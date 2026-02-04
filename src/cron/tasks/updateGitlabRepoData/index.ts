import { formatDate, getLogger, runTasks } from '../../../utils';
import { Task } from '../../index';
import { insertRecords, query } from '../../../db/clickhouse';
import { getMergeRequests } from './getMergeRequests';
import { getIssues } from './getIssues';
import { InsertRecord } from './utils';
import getConfig from '../../../config';
import { getGraphqlClient } from './getClient';

/**
 * This task is used to update GitLab repo data (Issues and Merge Requests)
 */
let taskCount = 0;
const task: Task = {
  cron: '*/20 * * * *',
  singleInstance: false,
  callback: async () => {
    const logger = getLogger('UpdateGitlabRepoDataTask');

    const config = await getConfig();
    const repoUpdateBatchSize = config.task.configs?.updateGitlabRepoData?.repoUpdateBatchSize;
    const repoUpdateConcurrency = config.task.configs?.updateGitlabRepoData?.repoUpdateConcurrency;

    if (!repoUpdateBatchSize || !repoUpdateConcurrency || repoUpdateBatchSize <= 0 || repoUpdateConcurrency <= 0) {
      logger.error('Repo update batch size or concurrency is not set');
      return;
    }

    if (!config.task.configs?.updateGitlabRepoData?.tokens || config.task.configs.updateGitlabRepoData.tokens.length === 0) {
      logger.error('GitLab tokens are not set');
      return;
    }

    const token = config.task.configs.updateGitlabRepoData.tokens[taskCount++ % config.task.configs.updateGitlabRepoData.tokens.length];
    const gitlabClient = await getGraphqlClient(token);

    const updateRepoDataTask = async () => {
      // repo updated_at means repo code or description changed, so update data when update or today is the first day of the month
      const repos = await query<any>(`
SELECT
  id, namespace_id, namespace_name,
  name,
  issue_updated_at,
  mr_updated_at,
  issue_end_cursor,
  mr_end_cursor,
  (dateDiff('hour', issue_updated_at, last_activity_at) >= 1) AS should_update_issue,
  (dateDiff('hour', mr_updated_at, last_activity_at) >= 1) AS should_update_mr
FROM gitlab_repo_list WHERE should_update_issue OR should_update_mr
LIMIT ${repoUpdateBatchSize};`);
      logger.info(`Got ${repos.length} repos to update`);

      const updateRepoData = async (r: any[]) => {
        const repo = {
          id: +r[0],
          namespaceId: +r[1],
          namespaceName: r[2],
          name: r[3],
          issueUpdatedAt: r[4],
          mrUpdatedAt: r[5],
          issueEndCursor: r[6],
          mrEndCursor: r[7],
          shouldUpdateIssue: +r[8] === 1,
          shouldUpdateMr: +r[9] === 1,
        };

        const projectPath = repo.name; // GitLab project path is already in format: namespace/project

        let issueEvents: InsertRecord[] = [], mrEvents: InsertRecord[] = [];
        let issueFinished = true, mrFinished = true;
        let issueEndCursor = repo.issueEndCursor, mrEndCursor = repo.mrEndCursor;

        if (repo.shouldUpdateIssue) {
          const issueResult = await getIssues(gitlabClient, projectPath, repo.id, repo.namespaceId, repo.namespaceName, repo.issueEndCursor);
          issueEvents = issueResult.events;
          issueFinished = issueResult.finished;
          if (issueResult.endCursor) {
            issueEndCursor = issueResult.endCursor;
          }
        }

        if (repo.shouldUpdateMr) {
          const mrResult = await getMergeRequests(gitlabClient, projectPath, repo.id, repo.namespaceId, repo.namespaceName, repo.mrEndCursor);
          mrEvents = mrResult.events;
          mrFinished = mrResult.finished;
          if (mrResult.endCursor) {
            mrEndCursor = mrResult.endCursor;
          }
        }

        logger.info(`Got ${issueEvents.length} issue events and ${mrEvents.length} mr events for ${repo.name}`);

        const issueUpdatedAtDate = repo.issueUpdatedAt ? new Date(repo.issueUpdatedAt) : new Date(0);
        const mrUpdatedAtDate = repo.mrUpdatedAt ? new Date(repo.mrUpdatedAt) : new Date(0);

        const events = [
          ...issueEvents.filter(e => e.created_at && new Date(e.created_at) > issueUpdatedAtDate),
          ...mrEvents.filter(e => e.created_at && new Date(e.created_at) > mrUpdatedAtDate),
        ];

        if (events.length > 0) {
          await insertRecords(events.map(e => ({ ...e, from_api: 1 })), 'events');
        }

        const issueUpdateTime = issueFinished ? new Date() : new Date(repo.issueUpdatedAt);
        const mrUpdateTime = mrFinished ? new Date() : new Date(repo.mrUpdatedAt);
        const q = `ALTER TABLE gitlab_repo_list UPDATE
        issue_updated_at = '${formatDate(issueUpdateTime.toISOString())}',
        mr_updated_at = '${formatDate(mrUpdateTime.toISOString())}',
        issue_end_cursor = '${issueEndCursor || ''}',
        mr_end_cursor = '${mrEndCursor || ''}'
        WHERE id = ${repo.id};`;
        await query(q);
      };

      await runTasks(repos.map(r => async () => {
        try {
          return await updateRepoData(r);
        } catch (e: any) {
          logger.error(`Error on updating repo data for ${r[3]}: ${e.message}\n${e.stack}`);
          return null;
        }
      }), repoUpdateConcurrency);

    };

    await updateRepoDataTask();
  }
};

module.exports = task;

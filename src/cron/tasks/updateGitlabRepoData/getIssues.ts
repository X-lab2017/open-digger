import { formatDate, getLogger } from "../../../utils";
import { InsertRecord, processActor, extractIdFromGid } from "./utils";
import { GraphqlClient } from "./getClient";

// since query will recursively get comments and events for every issue
// need to limit the number of issues to query at once to a small number to avoid rate limit error in a single query
const batchCount = 30;
const logger = getLogger('UpdateGitlabRepoDataTask[GetIssues]');

const getMoreNotes = async (client: GraphqlClient, projectPath: string, issueIid: string, after?: string): Promise<any[]> => {
  if (!after) return [];
  const q = `
    query getMoreNotes($projectPath: ID!, $issueIid: String!, $count: Int!, $after: String!) {
      project(fullPath: $projectPath) {
        issue(iid: $issueIid) {
          notes(first: $count, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              createdAt
              body
              author {
                id
                username
                name
              }
            }
          }
        }
      }
    }
  `;

  const result = await client(q, { projectPath, issueIid, after, count: batchCount });
  const notes = result.project?.issue?.notes?.nodes || [];
  if (result.project?.issue?.notes?.pageInfo?.hasNextPage) {
    notes.push(...await getMoreNotes(client, projectPath, issueIid, result.project.issue.notes.pageInfo.endCursor));
  }
  return notes;
};

const getIssuesBatch = async (client: GraphqlClient, projectPath: string, projectId: number, namespaceId: number, namespaceName: string, after?: string): Promise<{ events: InsertRecord[], hasNextPage: boolean, endCursor?: string }> => {
  const q = `
    query getIssues($projectPath: ID!, $after: String, $count: Int!) {
      project(fullPath: $projectPath) {
        id
        issues(first: $count, after: $after, sort: UPDATED_ASC) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            iid
            title
            description
            createdAt
            closedAt
            state
            labels(first: 10) {
              nodes {
                id
                title
                color
                description
              }
            }
            author {
              id
              username
              name
            }
            notes(first: $count) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                id
                createdAt
                body
                author {
                  id
                  username
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  const result = await client(q, { projectPath, after, count: batchCount });
  const events: InsertRecord[] = [];

  if (!result.project || !result.project.issues) {
    return { events, hasNextPage: false };
  }

  const issues = result.project.issues.nodes || [];

  for (const issue of issues) {
    if (!issue.author) {
      continue;
    }

    const issueAuthor = processActor(issue.author);
    const issueId = extractIdFromGid(issue.id);
    const issueNumber = parseInt(issue.iid);

    const baseIssueItem: InsertRecord = {
      platform: 'GitLab',
      repo_id: projectId,
      repo_name: projectPath,
      org_id: namespaceId,
      org_login: namespaceName,
      actor_id: 0,
      actor_login: '',
      type: '',
      action: '',
      issue_id: issueId,
      issue_number: issueNumber,
      issue_title: issue.title,
      issue_author_id: issueAuthor.actor_id,
      issue_author_login: issueAuthor.actor_login,
      body: issue.description,
      issue_created_at: formatDate(issue.createdAt),
      issue_closed_at: issue.closedAt ? formatDate(issue.closedAt) : undefined,
      "issue_labels.name": issue.labels?.nodes?.map((l: any) => l.title) || [],
      "issue_labels.color": issue.labels?.nodes?.map((l: any) => l.color) || [],
      "issue_labels.default": issue.labels?.nodes?.map(() => 0) || [],
      "issue_labels.description": issue.labels?.nodes?.map((l: any) => l.description || '') || [],
    };

    // Issue opened event
    events.push({
      ...baseIssueItem,
      ...issueAuthor,
      type: 'IssuesEvent',
      action: 'opened',
      created_at: formatDate(issue.createdAt),
    });

    // Issue closed event
    if (issue.state === 'closed' && issue.closedAt) {
      events.push({
        ...baseIssueItem,
        ...issueAuthor,
        type: 'IssuesEvent',
        action: 'closed',
        created_at: formatDate(issue.closedAt),
      });
    }

    // Issue notes (comments)
    let notes = issue.notes?.nodes || [];
    if (issue.notes?.pageInfo?.hasNextPage) {
      notes.push(...await getMoreNotes(client, projectPath, issue.iid, issue.notes.pageInfo.endCursor));
    }

    for (const note of notes) {
      if (!note.author) {
        continue;
      }
      events.push({
        ...baseIssueItem,
        ...processActor(note.author),
        type: 'IssueCommentEvent',
        action: 'created',
        issue_comment_id: extractIdFromGid(note.id),
        body: note.body,
        created_at: formatDate(note.createdAt),
      });
    }
  }

  return {
    events,
    hasNextPage: result.project.issues.pageInfo.hasNextPage,
    endCursor: result.project.issues.pageInfo.endCursor,
  };
};

export const getIssues = async (client: GraphqlClient, projectPath: string, projectId: number, namespaceId: number, namespaceName: string, after?: string): Promise<{ events: InsertRecord[], endCursor?: string, finished: boolean }> => {
  const allEvents: InsertRecord[] = [];
  let currentAfter = after;
  let hasNextPage = true;
  let finished = true;

  while (hasNextPage && allEvents.length < batchCount * 100) {
    try {
      const batch = await getIssuesBatch(client, projectPath, projectId, namespaceId, namespaceName, currentAfter);
      allEvents.push(...batch.events);
      hasNextPage = batch.hasNextPage;
      currentAfter = batch.endCursor;
    }
    catch (error: any) {
      logger.error(`Error getting issues: projectPath=${projectPath}, projectId=${projectId}, currentAfter=${currentAfter}, error=${error.message || error}`);
      finished = false;
      break;
    }
  }

  return { events: allEvents, endCursor: currentAfter, finished };
};

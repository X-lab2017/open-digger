import {
  QueryConfig,
  getMergedConfig,
  getRepoWhereClause,
  getUserWhereClause,
  getTimeRangeWhereClause,
  getGroupArrayInsertAtClause,
  getGroupTimeClause,
  getGroupIdClause,
  getInnerOrderAndLimit,
  getOutterOrderAndLimit,
  processQueryResult,
  getTopLevelPlatform,
  getInnerGroupBy,
  getWithClause,
  getLabelJoinClause
} from './basic';
import * as clickhouse from '../db/clickhouse';

export const ISSUE_COMMENT_WEIGHT = 0.5252;
export const OPEN_ISSUE_WEIGHT = 2.2235;
export const OPEN_PULL_WEIGHT = 4.0679;
export const REVIEW_COMMENT_WEIGHT = 0.7427;
export const PULL_MERGED_WEIGHT = 2.0339;

export const getRepoOpenrank = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClause: string[] = [];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClause.push(repoWhereClause);
  const timeRangeClause = getTimeRangeWhereClause(config);
  if (timeRangeClause) whereClause.push(timeRangeClause);
  whereClause.push("events.type='Repo'");

  const sql = `
${getWithClause(config)}
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'openrank' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config, 'repo', 'created_at')},
    SUM(openrank) AS openrank
  FROM global_openrank AS events
  ${getLabelJoinClause(config)}
  WHERE ${whereClause.join(' AND ')}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'openrank')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'openrank')}`;
  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['openrank']);
}

export const getUserOpenrank = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClause: string[] = [];
  const userWhereClause = await getUserWhereClause(config);
  if (userWhereClause) whereClause.push(userWhereClause);
  const timeRangeClause = getTimeRangeWhereClause(config);
  if (timeRangeClause) whereClause.push(timeRangeClause);
  whereClause.push("events.type='User'");

  const sql = `
${getWithClause(config)}
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'openrank' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config, 'user')},
    SUM(openrank) AS openrank
  FROM global_openrank AS events
  ${getLabelJoinClause(config)}
  WHERE ${whereClause.join(' AND ')}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'openrank')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'openrank')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['openrank']);
}

interface RepoCommunityOpenRankConfig {
  limit?: number;
  withBot?: boolean;
};
export const getRepoCommunityOpenrank = async (config: QueryConfig<RepoCommunityOpenRankConfig>) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = [];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  const userWhereClause = await getUserWhereClause(config);
  if (userWhereClause) whereClauses.push(userWhereClause);
  const timeRangeClause = getTimeRangeWhereClause(config);
  if (timeRangeClause) whereClauses.push(timeRangeClause);
  const limit = (config.options?.limit == undefined) ? 30 : config.options.limit;
  let baseTable = 'normalized_community_openrank';
  if (config.options?.withBot === true) {
    baseTable = 'normalized_community_openrank_with_bot';
  }

  const sql = `
${getWithClause(config)}
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'openrank' })},
  ${getGroupArrayInsertAtClause(config, { key: 'details', noPrecision: true, defaultValue: '[]' })}
FROM
(
  SELECT
    time, id, argMax(name, time) AS name,
    SUM(or) AS openrank,
    ${limit > 0
      ? `arraySlice(arraySort(x -> -x.4, groupArray(tuple(events.actor_platform, actor_id, actor_login, or))), 1, ${limit}) AS details`
      : `arraySort(x -> -x.4, groupArray(tuple(events.actor_platform, actor_id, actor_login, or))) AS details`}
  FROM
  (
    SELECT
      ${getGroupTimeClause(config)},
      ${getGroupIdClause(config, 'repo', 'time')},
      any(events.platform) AS actor_platform,
      actor_id, argMax(actor_login, created_at) AS actor_login,
      SUM(openrank) AS or
    FROM ${baseTable} events
    ${getLabelJoinClause(config)}
    WHERE ${whereClauses.join(' AND ')}
    ${getInnerGroupBy(config)}, actor_id
    HAVING or > 0
  ) events
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'total_openrank')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'openrank')}
`;

  const result = await clickhouse.query(sql);
  return processQueryResult(result, ['openrank', 'details']);
};

interface UserCommunityOpenRankConfig {
  limit?: number;
  withBot?: boolean;
  withoutDetail?: boolean;
};
export const getUserCommunityOpenrank = async (config: QueryConfig<UserCommunityOpenRankConfig>) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = [];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  const userWhereClause = await getUserWhereClause(config);
  if (userWhereClause) whereClauses.push(userWhereClause);
  const timeRangeClause = getTimeRangeWhereClause(config);
  if (timeRangeClause) whereClauses.push(timeRangeClause);
  const limit = (config.options?.limit == undefined) ? 30 : config.options.limit;
  let baseTable = 'normalized_community_openrank';
  if (config.options?.withBot === true) {
    baseTable = 'normalized_community_openrank_with_bot';
  }

  const sql = `
${getWithClause(config)}
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'openrank', value: 'total_openrank' })},
  ${getGroupArrayInsertAtClause(config, { key: 'details', noPrecision: true, defaultValue: '[]' })}
FROM
(
  SELECT
    time,
    ${getGroupIdClause(config, 'user', 'time')},
    SUM(or) AS total_openrank,
    ${limit > 0 ? `arraySlice(groupArray(tuple(events.platform, repo_id, repo_name, or)), 1, ${limit}) AS details` : `groupArray(tuple(events.platform, repo_id, repo_name, or)) AS details`}
  FROM
  (
    SELECT
      ${getGroupTimeClause(config)},
      platform,
      repo_id, argMax(repo_name, created_at) AS repo_name,
      org_id, argMax(org_login, created_at) AS org_login,
      actor_id, argMax(actor_login, created_at) AS actor_login,
      SUM(openrank) AS or
    FROM ${baseTable} events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY platform, repo_id, org_id, actor_id, time
    HAVING or > 0
  ) events
  ${getLabelJoinClause(config)}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'total_openrank')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'openrank')}
`;
  const result = await clickhouse.query(sql);
  return processQueryResult(result, ['openrank', 'details']);
};

export const basicActivitySqlComponent = `
    if(type='PullRequestEvent' AND action='closed' AND pull_merged=1, issue_author_id, actor_id) AS actor_id,
    argMax(if(type='PullRequestEvent' AND action='closed' AND pull_merged=1, issue_author_login, actor_login), created_at) AS actor_login,
    uniqExactIf(issue_comment_id, type='IssueCommentEvent' AND action='created') AS issue_comment,
    uniqExactIf(issue_id, type='IssuesEvent' AND action='opened') AS open_issue,
    uniqExactIf(issue_id, type='PullRequestEvent' AND action='opened') AS open_pull,
    uniqExactIf(pull_review_comment_id, type='PullRequestReviewCommentEvent' AND action IN ('created', 'added')) AS review_comment,
    uniqExactIf(issue_id, type='PullRequestEvent' AND action='closed' AND pull_merged=1) AS merged_pull,
    sqrt(${ISSUE_COMMENT_WEIGHT}*issue_comment + ${OPEN_ISSUE_WEIGHT}*open_issue + ${OPEN_PULL_WEIGHT}*open_pull + ${REVIEW_COMMENT_WEIGHT}*review_comment + ${PULL_MERGED_WEIGHT}*merged_pull) AS activity
`;

interface RepoActivityOption {
  developerDetail: boolean;
}
export const getRepoActivity = async (config: QueryConfig<RepoActivityOption>) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')"]; // specify types to reduce memory usage and calculation
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));
  const developerDetail = config.options?.developerDetail;

  const sql = `
${getWithClause(config)}
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'activity', value: 'agg_activity' })},
  ${getGroupArrayInsertAtClause(config, { key: 'participants' })},
  ${getGroupArrayInsertAtClause(config, { key: 'issue_comment' })},
  ${getGroupArrayInsertAtClause(config, { key: 'open_issue' })},
  ${getGroupArrayInsertAtClause(config, { key: 'open_pull' })},
  ${getGroupArrayInsertAtClause(config, { key: 'review_comment' })},
  ${getGroupArrayInsertAtClause(config, { key: 'merged_pull' })}
  ${developerDetail === true ? ',' + getGroupArrayInsertAtClause(config, { key: 'details', noPrecision: true, defaultValue: '[]' }) : ''}
FROM
(
  SELECT
    ${getGroupTimeClause(config, 'month')},
    ${getGroupIdClause(config, 'repo', 'last_active')},
    ROUND(SUM(activity), 2) AS agg_activity,
    COUNT(actor_id) AS participants,
    SUM(issue_comment) AS issue_comment,
    SUM(open_issue) AS open_issue,
    SUM(open_pull) AS open_pull,
    SUM(review_comment) AS review_comment,
    SUM(merged_pull) AS merged_pull
    ${developerDetail === true ? ', arraySlice(arraySort(x -> -tupleElement(x, 2), groupArray((actor_login, ROUND(activity, 2)))), 1, 100) AS details' : ''}
  FROM
  (
    SELECT
      toStartOfMonth(created_at) AS month,
      max(created_at) AS last_active,
      platform,
      repo_id, argMax(repo_name, created_at) AS repo_name,
      org_id, argMax(org_login, created_at) AS org_login,
      ${basicActivitySqlComponent}
    FROM events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY platform, repo_id, org_id, actor_id, month
    HAVING activity > 0
  ) AS events
  ${getLabelJoinClause(config)}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'agg_activity')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'activity')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['activity', 'participants', 'issue_comment', 'open_issue', 'open_pull', 'review_comment', 'merged_pull', 'details']);
}

interface UserActivityOption {
  repoDetail: boolean;
}
export const getUserActivity = async (config: QueryConfig<UserActivityOption>, withBot: boolean = true) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')"]; // specify types to reduce memory usage and calculation
  const userWhereClause = await getUserWhereClause(config);
  if (userWhereClause) whereClauses.push(userWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));
  const repoDetail = config.options?.repoDetail;

  const sql = `
${getWithClause(config)}
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'activity', value: 'agg_activity' })},
  ${getGroupArrayInsertAtClause(config, { key: 'issue_comment' })},
  ${getGroupArrayInsertAtClause(config, { key: 'open_issue' })},
  ${getGroupArrayInsertAtClause(config, { key: 'open_pull' })},
  ${getGroupArrayInsertAtClause(config, { key: 'review_comment' })},
  ${getGroupArrayInsertAtClause(config, { key: 'merged_pull' })}
  ${repoDetail === true ? ',' + getGroupArrayInsertAtClause(config, { key: 'details', noPrecision: true, defaultValue: '[]' }) : ''}
FROM
(
  SELECT
    ${getGroupTimeClause(config, 'month')},
    ${getGroupIdClause(config, 'user', 'last_active')},
    ROUND(SUM(activity), 2) AS agg_activity,
    SUM(issue_comment) AS issue_comment,
    SUM(open_issue) AS open_issue,
    SUM(open_pull) AS open_pull,
    SUM(review_comment) AS review_comment,
    SUM(merged_pull) AS merged_pull
    ${repoDetail === true ? ', arraySlice(arraySort(x -> -tupleElement(x, 2), groupArray((repo_name, ROUND(activity, 2)))), 1, 100) AS details' : ''}
  FROM
  (
    SELECT
      toStartOfMonth(created_at) AS month,
      max(created_at) AS last_active,
      platform,
      repo_id,
      argMax(repo_name, created_at) AS repo_name,
      ${basicActivitySqlComponent}
    FROM events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY platform, repo_id, actor_id, month
    HAVING activity > 0 ${withBot ? '' : `AND actor_login NOT LIKE '%[bot]'`}
  ) AS events
  ${getLabelJoinClause(config)}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'agg_activity')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'activity')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['activity', 'issue_comment', 'open_issue', 'open_pull', 'review_comment', 'merged_pull', 'details']);
}

export const getAttention = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["events.type IN ('WatchEvent', 'ForkEvent')"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
${getWithClause(config)}
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'attention' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config)},
    uniqExactIf(events.actor_id, events.type='WatchEvent') AS stars,
    uniqExactIf(events.actor_id, events.type='ForkEvent') AS forks,
    stars + 2 * forks AS attention
  FROM events
  ${getLabelJoinClause(config)}
  WHERE ${whereClauses.join(' AND ')}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'attention')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'attention')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['attention']);
};


// ===================== getUserTalent =====================

export const processCodeQuality = (val: number): number => {
  return +(Math.pow(val, 1.3) * 100).toFixed(2);
};

const processPrTitleAndDescriptionQuality = (val: number): number => {
  return +(val * 100).toFixed(2);
};

const processValueLevel = (val: number): number => {
  return +(val * 100).toFixed(2);
};

const processInformationQuality = (val: number): number => {
  return +(val * 100).toFixed(2);
};

const VALID_PR_TYPES = ['Feature', 'Fix', 'Refactor', 'Chore', 'Docs', 'Other'];
const processPrTypes = (prTypes: string[]): { type: string; count: number }[] => {
  return VALID_PR_TYPES.map(type => ({
    type,
    count: prTypes.filter(t => t === type).length,
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count);
};

interface TalentYearData {
  openIssues: number;
  participantIssues: number;
  openPrs: number;
  mergedPrs: number;
  prReviews: number;
  codeChanges: number;
  avgCodeQuality: number;
  avgPrTitleAndDescriptionQuality: number;
  avgValueLevel: number;
  prTypes: { type: string; count: number }[];
  avgIssueQuality: number;
  totalOpenrankContributions: number;
  openRankContributionTop10: { repoId: number; repoName: string; openrank: number }[];
  openRankContributionByTechArea: { name: string; o: number }[];
}

interface TalentUser {
  id: number;
  platform: string;
  name: string;
  years: { [year: string]: TalentYearData };
}

export const getUserTalent = async (config: QueryConfig): Promise<any[]> => {
  config = getMergedConfig(config);
  const startYear = config.startYear;
  const endYear = config.endYear;

  const whereClause = config.whereClause ?? '1=1';
  const yearCondition = `toYear(created_at) BETWEEN ${startYear} AND ${endYear}`;

  // Map: "platform:actor_id" -> TalentUser
  const userMap = new Map<string, TalentUser>();

  const getOrCreateUser = (platform: string, actorId: number): TalentUser => {
    const key = `${platform}:${actorId}`;
    if (!userMap.has(key)) {
      userMap.set(key, { id: actorId, platform, name: '', years: {} });
    }
    return userMap.get(key)!;
  };

  const getUserByKey = (platform: string, actorId: number): TalentUser | undefined => {
    return userMap.get(`${platform}:${actorId}`);
  };

  const getOrCreateYear = (user: TalentUser, year: string): TalentYearData => {
    if (!user.years[year]) {
      user.years[year] = {
        openIssues: 0,
        participantIssues: 0,
        openPrs: 0,
        mergedPrs: 0,
        prReviews: 0,
        codeChanges: 0,
        avgCodeQuality: 0,
        avgPrTitleAndDescriptionQuality: 0,
        avgValueLevel: 0,
        prTypes: [],
        avgIssueQuality: 0,
        totalOpenrankContributions: 0,
        openRankContributionTop10: [],
        openRankContributionByTechArea: [],
      };
    }
    return user.years[year];
  };

  // 1. Pull quality data
  const pullSql = `
SELECT
  platform,
  actor_id,
  toYear(created_at) AS year,
  AVG(multiIf(code_quality = 1, 1, code_quality = 2, 0.8, code_quality = 3, 0.6, code_quality = 4, 0.4, 0.2)) AS avg_code_quality,
  AVG(multiIf(pr_title_and_description_quality = 1, 1, pr_title_and_description_quality = 2, 0.8, pr_title_and_description_quality = 3, 0.6, pr_title_and_description_quality = 4, 0.4, 0.2)) AS avg_pr_title_and_description_quality,
  AVG((5 - value_level) * 0.2 / 0.8) AS avg_value_level,
  groupArray(pr_type) AS pr_type_array
FROM
(
  SELECT e.repo_id, e.issue_author_id AS actor_id, e.created_at, e.issue_id, e.platform, p.code_quality, p.pr_title_and_description_quality, p.value_level, p.pr_type
  FROM events e, pull_info p
  WHERE e.issue_id = p.id AND e.platform = p.platform AND e.type = 'PullRequestEvent' AND e.action = 'closed' AND e.pull_merged = 1
  AND ${yearCondition} AND ${whereClause}
)
GROUP BY platform, actor_id, year`;

  // 2. Issue quality data
  const issueSql = `
SELECT
  platform,
  actor_id,
  toYear(created_at) AS year,
  AVG(multiIf(information_quality = 1, 0.2, information_quality = 2, 0.4, information_quality = 3, 0.6, information_quality = 4, 0.8, 1)) AS avg_information_quality
FROM
(
  SELECT e.repo_id, e.actor_id, e.created_at, e.issue_id, e.platform, p.information_quality
  FROM events e, issue_info p
  WHERE e.issue_id = p.id AND e.platform = p.platform AND e.type = 'IssuesEvent' AND e.action = 'opened'
  AND ${yearCondition} AND ${whereClause}
)
GROUP BY platform, actor_id, year`;

  // 3. Activity counts
  const activitySql = `
SELECT
  platform,
  actor_id,
  year,
  argMax(login_value, created_at) AS actor_login,
  uniqExactIf(issue_id, type='IssuesEvent' AND action='opened') AS open_issue,
  uniqExact(issue_id) AS participant_issue,
  uniqExactIf(issue_id, type='PullRequestEvent' AND action='opened') AS open_pull,
  uniqExactIf(issue_id, type='PullRequestEvent' AND action='closed' AND pull_merged=1) AS merged_pull,
  uniqExactIf(pull_review_comment_id, type='PullRequestReviewCommentEvent' AND action='created') AS pull_review_comment,
  sumIf(pull_additions + pull_deletions, type='PullRequestEvent' AND action='closed' AND pull_merged=1) AS code_changes
FROM (
  SELECT
    if(type='PullRequestEvent' AND action='closed' AND pull_merged=1, issue_author_id, actor_id) AS actor_id,
    toYear(created_at) AS year,
    platform,
    if(type='PullRequestEvent' AND action='closed' AND pull_merged=1, issue_author_login, actor_login) AS login_value,
    type,
    action,
    pull_merged,
    issue_id,
    pull_review_comment_id,
    pull_additions,
    pull_deletions,
    created_at
  FROM events
  WHERE ${yearCondition} AND type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')
  AND ${whereClause}
)
GROUP BY platform, actor_id, year`;

  // 4. OpenRank total contributions
  const openrankSql = `
SELECT platform, actor_id, toYear(created_at) AS year, SUM(openrank) AS o
FROM normalized_community_openrank
WHERE ${yearCondition} AND ${whereClause}
GROUP BY platform, actor_id, year`;

  // 5. OpenRank top10 repos
  const openrankTop10Sql = `
SELECT platform, actor_id, year, arraySlice(groupArray(tuple(repo_id, repo_name, o)), 1, 10) AS openrank_contribution_top10 FROM (
  SELECT platform, actor_id, toYear(created_at) AS year, repo_id, any(repo_name) AS repo_name, SUM(openrank) AS o
  FROM normalized_community_openrank
  WHERE ${yearCondition} AND ${whereClause}
  GROUP BY platform, actor_id, year, repo_id
  ORDER BY o DESC
) GROUP BY platform, actor_id, year`;

  // 6. Tech area contributions
  const techAreaSql = `
SELECT platform, actor_id, year, groupArray(tuple(name, o)) AS openrank_contribution_by_tech_area FROM (
  SELECT
    a.platform AS platform,
    a.actor_id AS actor_id,
    a.year AS year,
    l.name_zh AS name,
    SUM(a.o) AS o
  FROM
  (SELECT actor_id, platform, repo_id, toYear(created_at) AS year, any(org_id) AS org_id, SUM(openrank) AS o
   FROM normalized_community_openrank
   WHERE ${yearCondition} AND ${whereClause}
   GROUP BY actor_id, repo_id, platform, year) a,
  flatten_labels l
  WHERE l.type='Tech-0' AND l.platform=a.platform AND ((l.entity_type='Repo' AND l.entity_id=a.repo_id) OR (l.entity_type='Org' AND l.entity_id=a.org_id))
  GROUP BY platform, actor_id, year, name
  ORDER BY o DESC
) GROUP BY platform, actor_id, year`;

  // 7. Fallback identity query: get platform/login for all users in the partition
  // This ensures users who only appear in openrank/pull data (not in activitySql) still get platform/name
  const identitySql = `
SELECT platform, actor_id, argMax(actor_login, created_at) AS login
FROM normalized_community_openrank
WHERE ${yearCondition} AND ${whereClause}
GROUP BY platform, actor_id`;

  // Execute all queries
  const [pullData, issueData, activityData, openrankData, openrankTop10Data, techAreaData, identityData] = await Promise.all([
    clickhouse.query(pullSql),
    clickhouse.query(issueSql),
    clickhouse.query(activitySql),
    clickhouse.query(openrankSql),
    clickhouse.query(openrankTop10Sql),
    clickhouse.query(techAreaSql),
    clickhouse.query(identitySql),
  ]);

  // Process identity data first to ensure all users have platform/name
  identityData.forEach((row: any) => {
    const platform = row[0];
    const actorId = +row[1];
    const user = getOrCreateUser(platform, actorId);
    user.name = row[2];
  });

  // Process activity counts (may overwrite identity with more accurate login from events)
  activityData.forEach((row: any) => {
    const platform = row[0];
    const actorId = +row[1];
    const user = getOrCreateUser(platform, actorId);
    const yearData = getOrCreateYear(user, String(row[2]));
    yearData.openIssues = +row[4];
    yearData.participantIssues = +row[5];
    yearData.openPrs = +row[6];
    yearData.mergedPrs = +row[7];
    yearData.prReviews = +row[8];
    yearData.codeChanges = +row[9];
  });

  // Process pull quality data — only update users already in the map with valid identity
  pullData.forEach((row: any) => {
    const platform = row[0];
    const actorId = +row[1];
    const user = getUserByKey(platform, actorId);
    if (!user) return; // skip cross-partition leaked PR authors
    const yearData = getOrCreateYear(user, String(row[2]));
    yearData.avgCodeQuality = processCodeQuality(+row[3]);
    yearData.avgPrTitleAndDescriptionQuality = processPrTitleAndDescriptionQuality(+row[4]);
    yearData.avgValueLevel = processValueLevel(+row[5]);
    yearData.prTypes = processPrTypes(row[6]);
  });

  // Process issue quality data
  issueData.forEach((row: any) => {
    const platform = row[0];
    const actorId = +row[1];
    const user = getUserByKey(platform, actorId);
    if (!user) return;
    const yearData = getOrCreateYear(user, String(row[2]));
    yearData.avgIssueQuality = processInformationQuality(+row[3]);
  });

  // Process openrank total
  openrankData.forEach((row: any) => {
    const platform = row[0];
    const actorId = +row[1];
    const user = getOrCreateUser(platform, actorId);
    const yearData = getOrCreateYear(user, String(row[2]));
    yearData.totalOpenrankContributions = +(+row[3]).toFixed(2);
  });

  // Process openrank top10
  openrankTop10Data.forEach((row: any) => {
    const platform = row[0];
    const actorId = +row[1];
    const user = getOrCreateUser(platform, actorId);
    const yearData = getOrCreateYear(user, String(row[2]));
    yearData.openRankContributionTop10 = row[3].map((i: any) => ({
      repoId: +i[0],
      repoName: i[1],
      openrank: +(+i[2]).toFixed(2),
    }));
  });

  // Process tech area contributions
  techAreaData.forEach((row: any) => {
    const platform = row[0];
    const actorId = +row[1];
    const user = getOrCreateUser(platform, actorId);
    const yearData = getOrCreateYear(user, String(row[2]));
    yearData.openRankContributionByTechArea = row[3].map((i: any) => ({
      name: i[0],
      o: +(+i[1]).toFixed(2),
    }));
  });

  return Array.from(userMap.values());
};

export const getBasicRepoStats = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["events.type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
${getWithClause(config)}
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'repo_count' })},
  ${getGroupArrayInsertAtClause(config, { key: 'org_count' })},
  ${getGroupArrayInsertAtClause(config, { key: 'participants' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config)},
    COUNT(DISTINCT events.repo_id) AS repo_count,
    COUNT(DISTINCT events.org_id) AS org_count,
    COUNT(DISTINCT events.actor_id) AS participants
  FROM events
  ${getLabelJoinClause(config)}
  WHERE ${whereClauses.join(' AND ')}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'repo_count')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'repo_count')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['repo_count', 'org_count', 'participants']);
};

module.exports = async function(config, utils) {
  const selectTable = utils.getSelectDataSql(config.repos, config.orgs, 'toYear(created_at) > 2018');
  const query = `SELECT
  repo_id,
  anyHeavy(repo_name) AS repo_name,
  floor(avg(resolve_period)) AS resolve_period_avg,
  floor(avg(response_period)) AS response_period_avg,
  median(resolve_period) AS resolve_period_median,
  median(response_period) AS response_period_median,
  count() AS count
FROM
(
  SELECT
    repo_id,
    repo_name,
    issue_number,
    close_at - open_at AS resolve_period,
    interact_at - open_at AS response_period
  FROM
  (
    SELECT
      oi.repo_id AS repo_id,
      oi.repo_name AS repo_name,
      oi.issue_number AS issue_number,
      oi.time AS open_at,
      ci.time AS close_at,
      ii.time AS interact_at
    FROM
    (
      SELECT
        repo_id,
        anyHeavy(repo_name) AS repo_name,
        issue_number,
        min(created_at) AS time
      FROM ${selectTable}
      WHERE (type IN ['IssuesEvent']) AND (action IN ['opened'])
      GROUP BY repo_id, issue_number
    ) AS oi
    INNER JOIN
    (
      SELECT
        repo_id,
        issue_number,
        min(created_at) AS time
      FROM ${selectTable}
      WHERE (type IN ['IssuesEvent']) AND (action IN ['closed'])
      GROUP BY repo_id, issue_number
    ) AS ci ON (oi.repo_id = ci.repo_id) AND (oi.issue_number = ci.issue_number)
    INNER JOIN
    (
      SELECT
        repo_id,
        issue_number,
        min(created_at) AS time
      FROM ${selectTable}
      WHERE (type IN ['IssuesEvent', 'IssueCommentEvent']) AND (action IN ['closed', 'created']) AND (actor_id != issue_author_id)
      GROUP BY repo_id, issue_number
    ) AS ii ON (oi.repo_id = ii.repo_id) AND (oi.issue_number = ii.issue_number)
  )
)
GROUP BY repo_id`;

  const data = await utils.queryGitHubEventLog(query);

  const keys = ['repo_name', 'resolve_period_avg', 'response_period_avg', 'resolve_period_median', 'response_period_median', 'count'];
  
  return {
    html: `
    <h3>Issue response and resolve period analysis.</h3>
    ${utils.genTable({
      keys,
      data: data.map(d => {
        return {
          repo_name: d.repo_name,
          resolve_period_avg: utils.convertSecondToReadableDuration(d.resolve_period_avg),
          response_period_avg: utils.convertSecondToReadableDuration(d.response_period_avg),
          resolve_period_median: utils.convertSecondToReadableDuration(d.resolve_period_median),
          response_period_median: utils.convertSecondToReadableDuration(d.response_period_median),
          count: d.count,
        }
      }),
    })}`,
    css: '',
    js: '',
  };
}

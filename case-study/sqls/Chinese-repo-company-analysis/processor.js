module.exports = async function(config, utils) {
  const table = 'github_log.year2021';
  const topNRepo = 50;
  const {companies, weight} = config;
  const repoList = [];
  const orgList = [];
  const companyMap = new Map();
  for (const k in companies) {
    repoList.push(...companies[k].repos ?? []);
    orgList.push(...companies[k].orgs ?? []);
    if (k !== 'None') {
      companyMap.set(k, {
        activity: 0,
        repo_count: 0,
        developer_count: 0,
        issue_comment: 0,
        open_issue: 0,
        open_pull: 0,
        review_comment: 0,
        merge_pull: 0,
        commits: 0,
        additions: 0,
        deletions: 0,
      });
    }
  }

  const query = `SELECT 
    anyHeavy(contribute_list.repo_name) AS name, 
    contribute_list.repo_id AS repo_id,
    anyHeavy(contribute_list.org_id) AS org_id,
    MAX(contribute_list.repo_language) AS language, 
    round(sum(sqrt(contribute_list.score)), 2) AS activity, 
    COUNTDistinct(contribute_list.actor_id) AS developer_count, 
    SUM(icc.count) AS issue_comment, 
    SUM(oic.count) AS open_issue, 
    SUM(opc.count) AS open_pull, 
    SUM(rcc.count) AS review_comment,
    SUM(mpc.count) AS merge_pull, 
    SUM(contribute_list.commits) AS commits, 
    SUM(contribute_list.additions) AS additions, 
    SUM(contribute_list.deletions) AS deletions
FROM 
(
    SELECT 
        icc.repo_id AS repo_id,
        icc.org_id AS org_id,
        icc.repo_name AS repo_name, 
        icc.actor_id AS actor_id, 
        icc.count, 
        oic.count, 
        opc.count, 
        rcc.count, 
        mpc.count, 
        ((((${weight.issueCommentWeight} * icc.count) + (${weight.openIssueWeight} * oic.count)) + (${weight.openPullWeight} * opc.count)) + (${weight.pullReviewWeight} * rcc.count)) + (${weight.mergePullWeight} * mpc.count) AS score, 
        mpc.commits AS commits, 
        mpc.additions AS additions, 
        mpc.deletions AS deletions, 
        mpc.repo_language AS repo_language
    FROM 
    (
        SELECT 
            repo_id,
            anyHeavy(org_id) AS org_id,
            actor_id, 
            anyHeavy(repo_name) AS repo_name, 
            COUNT(*) AS count
        FROM ${table}
        WHERE (type = 'IssueCommentEvent') AND (action = 'created')
        GROUP BY 
            repo_id,
            actor_id
        HAVING (repo_id IN [${repoList.join(',')}]) OR (org_id IN [${orgList.join(',')}])
    ) AS icc
    LEFT JOIN 
    (
        SELECT 
            repo_id, 
            actor_id, 
            COUNT(*) AS count
        FROM ${table}
        WHERE (type = 'IssuesEvent') AND (action = 'opened')
        GROUP BY 
            repo_id, 
            actor_id
    ) AS oic ON (icc.repo_id = oic.repo_id) AND (icc.actor_id = oic.actor_id)
    LEFT JOIN 
    (
        SELECT 
            repo_id, 
            actor_id, 
            COUNT(*) AS count
        FROM ${table}
        WHERE (type = 'PullRequestEvent') AND (action = 'opened')
        GROUP BY 
            repo_id, 
            actor_id
    ) AS opc ON (icc.repo_id = opc.repo_id) AND (icc.actor_id = opc.actor_id)
    LEFT JOIN 
    (
        SELECT 
            repo_id, 
            actor_id, 
            COUNT(*) AS count
        FROM ${table}
        WHERE (type = 'PullRequestReviewCommentEvent') AND (action = 'created')
        GROUP BY 
            repo_id, 
            actor_id
    ) AS rcc ON (icc.repo_id = rcc.repo_id) AND (icc.actor_id = rcc.actor_id)
    LEFT JOIN 
    (
        SELECT 
            repo_id, 
            issue_author_id AS actor_id, 
            COUNT(*) AS count, 
            SUM(pull_commits) AS commits, 
            SUM(pull_additions) AS additions, 
            SUM(pull_deletions) AS deletions, 
            MAX(repo_language) AS repo_language
        FROM ${table}
        WHERE (type = 'PullRequestEvent') AND (action = 'closed') AND (pull_merged = 1)
        GROUP BY 
            repo_id, 
            actor_id
    ) AS mpc ON (icc.repo_id = mpc.repo_id) AND (icc.actor_id = mpc.actor_id)
) AS contribute_list
GROUP BY repo_id
ORDER BY activity DESC`;

  const data = await utils.queryGitHubEventLog(query);

  const keys = ['name', 'language', 'activity', 'developer_count', 'issue_comment', 'open_issue', 'open_pull', 'review_comment', 'merge_pull', 'commits', 'additions', 'deletions'];

  const commonKeys = ['activity', 'developer_count', 'issue_comment', 'open_issue', 'open_pull', 'review_comment', 'merge_pull', 'commits', 'additions', 'deletions'];

  data.forEach(d => {
    for (const k in companies) {
      if ((companies[k].repos && companies[k].repos.includes(parseInt(d.repo_id))) ||
          (companies[k].orgs && companies[k].orgs.includes(parseInt(d.org_id)))) {
        if (!companyMap.has(k)) return;
        const companyInfo = companyMap.get(k);
        for (const key of commonKeys) {
          companyInfo[key] += parseInt(d[key]);
        }
        companyInfo['repo_count'] += 1;
        companyMap.set(k, companyInfo);
      }
    }
  });
  
  const companyKeys = ['company', 'activity', 'repo_count', 'developer_count', 'issue_comment', 'open_issue', 'open_pull', 'review_comment', 'merge_pull', 'commits', 'additions', 'deletions'];

  return {
    html: `${utils.genComponentContent('We calculated the activity metric of all repos from China and the ranking list is')}
    ${utils.genTable({
      keys,
      data: data.slice(0, topNRepo),
    })}
    ${utils.genComponentContent('We calculated the activity metric of all repos from different companies and the ranking list is')}
    ${utils.genTable({
      keys: companyKeys,
      data: Array.from(companyMap.entries()).map(v => {return {company: v[0], ...v[1]}}).sort((a, b) => a.activity > b.activity ? -1 : 1),
    })}`,
    css: '',
    js: '',
  };
}

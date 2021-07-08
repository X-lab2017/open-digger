module.exports = async function(config, utils) {
        
    const {repos, weight} = config;
    let curDate=new Date();
    let table=utils.getPeriodTable(new Date(curDate-1000*60*60*24*7),curDate,`
      repo_id in [${repos.join(',')}]
    `);
    let prra=utils.periodRepoActorActivity(table,weight);
    let query=utils.periodRepoActivity(prra);
    const data = await utils.queryGitHubEventLog(query);
    const keys = ['repo_name',  'activity', 'developer_count', 'issue_comment', 'open_issue', 'open_pull', 'pull_review_comment', 'merge_pull', 'commits', 'additions', 'deletions','star_count','fork_count','repo_language'];
    
    return {
      html: `${utils.genComponentContent('We calculated the activity metric of all repos from sofastack')}
      ${utils.genTable({
        keys,
        data,
      })}
      `,
      css: '',
      js: '',
    };
  }
  
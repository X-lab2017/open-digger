module.exports = async function(data, params, config) {
  let top_repo = '| # | name | language | activity | developer_count | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |\n';
  top_repo += '|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|\n';
  let org_id_company_map = new Map();
  let repo_id_company_map = new Map();
  config.orgs.forEach(item =>{
    org_id_company_map.set(String(item.id), item.company);
  });
  config.repos.forEach(item =>{
    repo_id_company_map.set(String(item.id), item.company);
  });
  //company with its aggregation fields
  let company_map = new Map();//{"company":[repo_activity,issue_comment...]}
  data.forEach((item, index) => {
    //top repo text
    if (index<config.topN){
      top_repo += `| ${index + 1} | ${item.repo_name} | ${item.repo_language} | ${item.repo_activity} | ${item.developer_count} | ${item.issue_comment} | ${item.open_issue} | ${item.open_pull} | ${item.pull_review_comment} | ${item.merge_pull} | ${item.commits} | ${item.additions} | ${item.deletions} |\n`;
    }
    //repo fields
    let info=[
      item.repo_activity,
      parseInt(item.issue_comment),
      parseInt(item.open_issue),
      parseInt(item.open_pull),
      parseInt(item.pull_review_comment),
      parseInt(item.merge_pull),
      parseInt(item.commits),
      parseInt(item.additions),
      parseInt(item.deletions),
    ];
    //calculate company fields by matching org_id,repo_id between config and sql answer
    let company = '';
    if(org_id_company_map.has(item.org_id)){
      company = org_id_company_map.get(item.org_id);
    }else if(repo_id_company_map.has(item.repo_id)){
      company = repo_id_company_map.get(item.repo_id);
    }
    if(company){
      if(company_map.has(company)){
        let company_Info = company_map.get(company);
        for (let i in company_Info){
          company_Info[i] += info[i];
        }
      }else{
        company_map.set(company,info);
      }
    }
  });
  //sort by activity
  let company_info_list = [];// [["company",repo_activity,issue_comment...]]
  company_map.forEach((info,company)=>{
    company_info_list.push([company, info[0].toFixed(2), ...info.slice(1)]);
  });
  company_info_list.sort((a, b)=>{
    return b[1] - a[1];
  });
  //top company string
  let top_company = '| # | name | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |\n';
  top_company += '|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|\n';
  company_info_list.forEach((info,index)=>{
    top_company+=`| ${index + 1} |`
    info.forEach(item=>{
      top_company+=` ${item} |`
    });
    top_company+='\n';
  });
  return {"top_repo": top_repo,"top_company": top_company};
}

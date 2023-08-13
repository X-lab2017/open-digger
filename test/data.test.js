var openDigger = require('../src/open_digger')
const fs = require('fs');
const assert = require('assert');
const _ = require('lodash');
const _isEqual = require('lodash/isEqual');

function deep_equal(a, b) {
  return _.isEqual(a, b);
}

async function validate_data(api_fn,sub_file_name,data_key) {
  const file_name = `../test/testdata/${sub_file_name}/${data_key}.json`;
  if (fs.existsSync(file_name)) {
    const json_data = JSON.parse(fs.readFileSync(file_name));
    const data_1 = json_data[data_key];
    const data_2 = await api_fn(json_data['modifiedOption']);
    const data1WithoutDetail = removeFields(data_1);
    const data2WithoutDetail = removeFields(data_2);

    const equal = deep_equal(data1WithoutDetail, data2WithoutDetail);
    if(!equal){
      console.log(json_data['modifiedOption']);
      console.log(api_fn);
      console.log('data1:', JSON.stringify(data1WithoutDetail));
      console.log('data2:', JSON.stringify(data2WithoutDetail));
    }
    assert(equal);
}
}
function removeFields(data) {

  if (Array.isArray(data)) {
    return data.map(item => removeFields(item)); 
  }

  if (typeof data === 'object' && data !== null) {
    const newData = {};

    for (const key in data) {
      if (!key.startsWith('quantile_')&&!key.startsWith('detail')) {
        newData[key] = removeFields(data[key]); 
      }
    }

    return newData;
  }

  return data;
}

const option = {
  orgIds: [1342004],
  startYear: 2015,
  endYear: 2016,
  startMonth: 1,
  endMonth: 12,
};

const orderOptions = ['DESC'];
const limitOptions = ['all'];
const limitOptions1 = [3];
const groupTimeRangeOptions = ['year', 'quarter', 'month'];
const groupByOptions = [null, 'org'];

const resultPromises = [];

const delay = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

(async () => {
  for (const order of orderOptions) {
    for (const limit of limitOptions1) {
      for (const limitOption of limitOptions) {
        for (const groupBy of groupByOptions) {
          for (const groupTimeRange of groupTimeRangeOptions) {
            const modifiedOption = {
              ...option,
              order,
              limit,
              limitOption,
              groupTimeRange,
              groupBy,
            };

            const issues_new_file_name = `issues_new_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.issuesNew,'issues_new',issues_new_file_name);
            const issues_closed_file_name = `issues_closed_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.issuesClosed,'issues_closed',issues_closed_file_name);
            const bus_factor_file_name = `bus_factor_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.busFactor,'bus_factor',bus_factor_file_name);

            const code_change_commits_file_name = `code_change_commits_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.codeChangeCommits,'code_change_commits',code_change_commits_file_name);
            const issues_and_change_request_active_file_name = `issues_and_change_request_active_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.issuesAndChangeRequestActive,'issues_and_change_request_active',issues_and_change_request_active_file_name);
            const change_requests_accepted_file_name = `change_requests_accepted_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.changeRequestsAccepted,'change_requests_accepted',change_requests_accepted_file_name);
            const change_requests_declined_file_name = `change_requests_declined_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.changeRequestsDeclined,'change_requests_declined',change_requests_declined_file_name);
            const code_change_lines_file_name = `code_change_lines_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.codeChangeLines,'code_change_lines',code_change_lines_file_name);
             const technical_fork_file_name = `technical_fork_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.technicalFork,'technical_fork',technical_fork_file_name);
            const issue_age_file_name = `issue_age_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.issueAge,'issue_age',issue_age_file_name);
            await delay(5000);
            const change_request_age_file_name = `change_request_age_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.changeRequestAge,'change_request_age',change_request_age_file_name);
            const repo_active_dates_and_times_file_name = `repo_active_dates_and_times_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.repoActiveDatesAndTimes,'repo_active_dates_and_times',repo_active_dates_and_times_file_name);
            const user_active_dates_and_times_file_name = `user_active_dates_and_times_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.userActiveDatesAndTimes,'user_active_dates_and_times',user_active_dates_and_times_file_name);       
            const issue_resolution_duration_file_name = `issue_resolution_duration_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.issueResolutionDuration,'issue_resolution_duration',issue_resolution_duration_file_name);
            const change_request_resolution_duration_file_name = `change_request_resolution_duration_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.changeRequestResolutionDuration,'change_request_resolution_duration',change_request_resolution_duration_file_name);
            const change_requests_duration_file_name = `change_requests_duration_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.changeRequestsDuration,'change_requests_duration',change_requests_duration_file_name);
            const new_contributors_file_name = `new_contributors_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.newContributors,'new_contributors',new_contributors_file_name);
            const inactive_contributors_file_name = `inactive_contributors_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.inactiveContributors,'inactive_contributors',inactive_contributors_file_name);
            const change_requests_acceptance_ratio_file_name = `change_requests_acceptance_ratio_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.changeRequestsAcceptanceRatio,'change_requests_acceptance_ratio',change_requests_acceptance_ratio_file_name);
            
          }
        }
      }
    }
  }

  console.log('All passed.');
})();



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
  const json_data = JSON.parse(fs.readFileSync(file_name));
  const data_1 = json_data[data_key];
  const data_2 = await api_fn(json_data['modifiedOption']);
  const is_equal = deep_equal(data_1, data_2);
  assert(is_equal);
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
            //  issues_new
            const issues_new_file_name = `issues_new_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.issuesNew,'issues_new',issues_new_file_name);
            // issues_closed
            const issues_closed_file_name = `issues_closed_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.issuesClosed,'issues_closed',issues_closed_file_name);
            // code_change_commits
            const code_change_commits_file_name = `code_change_commits_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.codeChangeCommits,'code_change_commits',code_change_commits_file_name);
            // issues_and_change_request_active
            const issues_and_change_request_active_file_name = `issues_and_change_request_active_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
            validate_data(openDigger.metric.chaoss.issuesAndChangeRequestActive,'issues_and_change_request_active',issues_and_change_request_active_file_name);
            await delay(1000);
          }
        }
      }
    }
  }

  console.log('All passed.');
})();
var openDigger = require('../src/open_digger')
const fs = require('fs');
const assert = require('assert');
const _ = require('lodash');
const _isEqual = require('lodash/isEqual');

function deep_equal(a, b) {
  return _.isEqual(a, b);
}
const option_year = {
  orgIds: [1342004],
  limit: 3,
  startYear: 2015,
  endYear: 2016, 
  startMonth: 1,
  endMonth: 12,
  order: 'DESC',
  groupTimeRange: 'year'  
};
const option_month = {
  orgIds: [1342004],
  limit: 3,
  startYear: 2015,
  endYear: 2016, 
  startMonth: 1,
  endMonth: 12,
  order: 'DESC',
  groupTimeRange: 'month'  
};
const option_quarter = {
  orgIds: [1342004],
  limit: 3,
  startYear: 2015,
  endYear: 2016, 
  startMonth: 1,
  endMonth: 12,
  order: 'DESC',
  groupTimeRange: 'quarter'  
};

async function validate_data(api_fn, option, data_key) {
  const file_name = `../test/testdata/${data_key}.json`;
  const json_data = JSON.parse(fs.readFileSync(file_name));
  const data_1 = json_data[data_key];
  const data_2 = await api_fn(option);
  const is_equal = deep_equal(data_1, data_2);
  assert(is_equal);
}

validate_data(openDigger.metric.chaoss.issuesClosed, option_year, 'issue_closed_desc_3_all_repo_year');
validate_data(openDigger.metric.chaoss.issuesClosed, option_month, 'issue_closed_desc_3_all_repo_month');
validate_data(openDigger.metric.chaoss.issuesClosed, option_quarter, 'issue_closed_desc_3_all_repo_quarter');
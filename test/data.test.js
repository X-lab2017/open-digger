var openDigger = require('../src/open_digger')
const fs = require('fs');
const assert = require('assert');
const _ = require('lodash');
const _isEqual = require('lodash/isEqual');
const FILENAME = '../test/testdata.json'; 

function deepEqual(a, b) {
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

async function validateData(apiFn, option, dataKey) {
  const jsonData = JSON.parse(fs.readFileSync(FILENAME));
  const data1 = jsonData[dataKey];
  const data2 = await apiFn(option);
  const equal = deepEqual(data1, data2);
  assert(equal);

}

validateData(openDigger.metric.chaoss.codeChangeCommits, option_year, 'codeChangeCommits_DESC_year');
validateData(openDigger.metric.chaoss.codeChangeCommits, option_month, 'codeChangeCommits_DESC_month');
validateData(openDigger.metric.chaoss.codeChangeCommits, option_quarter, 'codeChangeCommits_DESC_quarter');

validateData(openDigger.metric.chaoss.issuesNew, option_year, 'IssueNew_DESC_year');
validateData(openDigger.metric.chaoss.issuesNew, option_month, 'IssueNew_DESC_month');
validateData(openDigger.metric.chaoss.issuesNew, option_quarter, 'IssueNew_DESC_quarter');

validateData(openDigger.metric.chaoss.issuesAndChangeRequestActive, option_year, 'issuesAndChangeRequestActive_DESC_year');
validateData(openDigger.metric.chaoss.issuesAndChangeRequestActive, option_month, 'issuesAndChangeRequestActive_DESC_month');
validateData(openDigger.metric.chaoss.issuesAndChangeRequestActive, option_quarter, 'issuesAndChangeRequestActive_DESC_quarter');

validateData(openDigger.metric.chaoss.issuesClosed, option_year, 'IssueClosed_DESC_year');
validateData(openDigger.metric.chaoss.issuesClosed, option_month, 'IssueClosed_DESC_month');
validateData(openDigger.metric.chaoss.issuesClosed, option_quarter, 'IssueClosed_DESC_quarter');

validateData(openDigger.metric.chaoss.changeRequestsAccepted, option_year, 'changeRequestsAccepted_DESC_year');
validateData(openDigger.metric.chaoss.changeRequestsAccepted, option_month, 'changeRequestsAccepted_DESC_month');
validateData(openDigger.metric.chaoss.changeRequestsAccepted, option_quarter, 'changeRequestsAccepted_DESC_quarter');

validateData(openDigger.metric.chaoss.changeRequestsDeclined, option_year, 'changeRequestsDeclined_DESC_year');
validateData(openDigger.metric.chaoss.changeRequestsDeclined, option_month, 'changeRequestsDeclined_DESC_month');
validateData(openDigger.metric.chaoss.changeRequestsDeclined, option_quarter, 'changeRequestsDeclined_DESC_quarter');

validateData(openDigger.metric.chaoss.codeChangeLines, option_year, 'codeChangeLines_DESC_year');
validateData(openDigger.metric.chaoss.codeChangeLines, option_month, 'codeChangeLines_DESC_month');
validateData(openDigger.metric.chaoss.codeChangeLines, option_quarter, 'codeChangeLines_DESC_quarter');
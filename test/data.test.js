var openDigger = require('../src/open_digger')
const fs = require('fs');
const assert = require('assert');
const _ = require('lodash');
const _isEqual = require('lodash/isEqual');

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
  const FILENAME = `../test/testdata/${dataKey}.json`;
  const jsonData = JSON.parse(fs.readFileSync(FILENAME));
  const data1 = jsonData[dataKey];
  const data2 = await apiFn(option);
  const equal = deepEqual(data1, data2);
  assert(equal);

}

validateData(openDigger.metric.chaoss.issuesClosed, option_year, 'IssueClosed_DESC_year');
validateData(openDigger.metric.chaoss.issuesClosed, option_month, 'IssueClosed_DESC_month');
validateData(openDigger.metric.chaoss.issuesClosed, option_quarter, 'IssueClosed_DESC_quarter');
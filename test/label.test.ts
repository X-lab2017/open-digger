import assert from 'assert';
import { getGitHubData, getLabelData } from '../src/label_data_utils';

describe('Label data test', () => {
  it('Should return correct label data', () => {
    const labelData = getLabelData();
    assert.strictEqual(labelData.length > 0, true);
  });
  it('Should return correct GitHub data', () => {
    const companyData = getGitHubData(['Company']);
    assert.strictEqual(companyData.githubOrgs.length > 0 && companyData.githubRepos.length > 0, true);
  });
  it('Should work with injected label data', () => {
    const labelData = getLabelData([{
      identifier: ':inject1',
      type: 'Injected',
      name: 'inject1'
    }, {
      identifier: ':inject2',
      type: 'Injected',
      name: 'inject2'
    }]);
    assert.strictEqual(labelData.filter(l => l.type === 'Injected').length, 2);
  });
  it('Should work with injected GitHub data', () => {
    const labelData = getGitHubData(['Injected'], [{
      identifier: ':inject1',
      type: 'Injected',
      name: 'inject1',
      githubOrgs: [1],
      githubRepos: [1],
      githubUsers: [1],
    }, {
      identifier: ':inject2',
      type: 'Injected',
      name: 'inject2',
      githubOrgs: [2],
      githubRepos: [2],
      githubUsers: [2],
    }]);
    assert.strictEqual(labelData.githubOrgs.length, 2);
    assert.strictEqual(labelData.githubRepos.length, 2);
    assert.strictEqual(labelData.githubUsers.length, 2);
  });
});

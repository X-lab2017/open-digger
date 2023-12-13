import assert from 'assert';
import { getPlatformData, getLabelData } from '../src/label_data_utils';

describe('Label data test', () => {
  it('Should return correct label data', () => {
    const labelData = getLabelData();
    assert.strictEqual(labelData.length > 0, true);
  });
  it('Should return correct GitHub data', () => {
    const companyData = getPlatformData(['Company']);
    assert.strictEqual(companyData.length > 0, true);
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
    const labelData = getPlatformData(['Injected'], [{
      identifier: ':inject1',
      type: 'Injected',
      name: 'inject1',
      platforms: [{
        name: 'GitHub',
        type: 'Code Hosting',
        orgs: [{ id: 1, name: '1' }],
        repos: [{ id: 1, name: '1' }],
        users: [{ id: 1, name: '1' }],
      }],
    }, {
      identifier: ':inject2',
      type: 'Injected',
      name: 'inject2',
      platforms: [{
        name: 'GitHub',
        type: 'Code Hosting',
        orgs: [{ id: 2, name: '2' }],
        repos: [{ id: 2, name: '2' }],
        users: [{ id: 2, name: '2' }],
      }],
    }]);
    assert.strictEqual(labelData.find(p => p.name === 'GitHub')?.orgs.length, 2);
    assert.strictEqual(labelData.find(p => p.name === 'GitHub')?.repos.length, 2);
    assert.strictEqual(labelData.find(p => p.name === 'GitHub')?.users.length, 2);
  });
});

import assert from 'assert';
import { forEveryMonthByConfig, forEveryQuarterByConfig, forEveryYearByConfig } from '../src/metrics/basic';

describe('Basic functions test', () => {
  describe('Time range functions', () => {
    const queryConfig: any = { startYear: 2021, startMonth: 3, endYear: 2023, endMonth: 10 };

    it('Should return correct year and month for forEveryMonthByConfig', async () => {
      const monthes: string[] = [];
      await forEveryMonthByConfig(queryConfig, async (y, m) => {
        monthes.push(`${y}-${m}`);
      });
      assert(JSON.stringify(monthes) === '["2021-3","2021-4","2021-5","2021-6","2021-7","2021-8","2021-9","2021-10","2021-11","2021-12","2022-1","2022-2","2022-3","2022-4","2022-5","2022-6","2022-7","2022-8","2022-9","2022-10","2022-11","2022-12","2023-1","2023-2","2023-3","2023-4","2023-5","2023-6","2023-7","2023-8","2023-9","2023-10"]');
    });

    it('Should return correct year and month for forEveryQuarterByConfig', async () => {
      const quarters: string[] = [];
      await forEveryQuarterByConfig(queryConfig, async (y, q) => {
        quarters.push(`${y}Q${q}`);
      });
      assert(JSON.stringify(quarters) === '["2021Q1","2021Q2","2021Q3","2021Q4","2022Q1","2022Q2","2022Q3","2022Q4","2023Q1","2023Q2","2023Q3","2023Q4"]');
    });

    it('Should return correct year and month for forEveryYearByConfig', async () => {
      const years: string[] = [];
      await forEveryYearByConfig(queryConfig, async y => {
        years.push(`${y}`);
      });
      assert(JSON.stringify(years) === '["2021","2022","2023"]');
    });
  });
});

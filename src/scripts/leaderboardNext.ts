import { LabelUtil } from "../labelDataUtils";
import { forEveryMonthByConfig, QueryConfig } from "../metrics/basic";
import { getRepoOpenrank } from "../metrics/indices";
import { repoParticipants } from "../metrics/metrics";
import { getLogger } from "../utils";
import { query } from "../db/clickhouse";
import { join } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";

(async () => {

  const logger = getLogger('LeaderboardNext');

  logger.info('Start to run leaderboard next task.');

  const scopeLabels = [
    undefined,
    ':technology/database',
    ':technology/big_data',
    ':technology/cloud_native',
    ':technology/development_tools',
    ':technology/large_model_development',
    ':technology/operating_system',
    ':technology/web_frameworks',
    ':divisions/CN'
  ];
  const groupTypes: Array<[string | string[] | undefined, { name: string, name_zh: string }]> = [
    ['Project', { name: 'Project', name_zh: '项目' }],
    [undefined, { name: 'Repo', name_zh: '仓库' }],
    [['Company', 'University-0', 'Institution-0'], { name: 'Initiator', name_zh: '发起方' }],
    ['Foundation', { name: 'Foundation', name_zh: '基金会' }],
    ['Division-0', { name: 'Country', name_zh: '国家/地区' }],
  ];
  const groupByTimeTypes: Array<'year' | 'month'> = ['year', 'month'];

  const labelData = new Map<string, { name: string, name_zh: string }>();
  const labels = await query(`SELECT id, name, name_zh FROM labels`);
  for (const [id, name, name_zh] of labels) {
    labelData.set(id, { name, name_zh });
  }

  const meta = {
    updatedAt: new Date().getTime(),
    scopes: scopeLabels.map(scopeLabel => ({
      name: scopeLabel ? (labelData.get(scopeLabel)?.name ?? '') : 'Global',
      name_zh: scopeLabel ? (labelData.get(scopeLabel)?.name_zh + (scopeLabel.startsWith(':technology/') ? '技术领域' : '')) : '全域',
    })),
    groupTypes: groupTypes.map(([_, groupTypeName]) => ({
      name: groupTypeName.name,
      name_zh: groupTypeName.name_zh,
    })),
    groupByTimeTypes: groupByTimeTypes.map(groupByTimeType => ({
      name: groupByTimeType,
      name_zh: groupByTimeType === 'year' ? '年度' : '月度',
    })),
  };

  writeFileSync(join('./local_files/open_leaderboard_next', 'meta.json'), JSON.stringify(meta));

  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  const startYear = now.getFullYear() - 10, startMonth = now.getMonth() + 1;
  const endYear = now.getFullYear(), endMonth = now.getMonth() + 1;
  const limit = 300;
  for (const scopeLabel of scopeLabels) {
    for (const [groupType, groupTypeName] of groupTypes) {
      for (const groupByTimeType of groupByTimeTypes) {
        logger.info(`Running scopeLabel=${scopeLabel}, groupType=${groupType}, groupByTimeType=${groupByTimeType}`);
        const options: QueryConfig = {
          startYear, startMonth, endYear, endMonth,
          order: 'DESC', orderOption: 'latest',
          limit, limitOption: 'each',
          precision: 2,
          groupBy: groupType,
          groupTimeRange: groupByTimeType,
          label: scopeLabel ? LabelUtil.get(scopeLabel) : undefined,
        };
        const openrankData = await getRepoOpenrank(options);
        let idOrNames: any = undefined;
        if (!groupType) {
          const platformMap = new Map<string, number[]>();
          for (const row of openrankData) {
            if (!platformMap.has(row.platform)) {
              platformMap.set(row.platform, []);
            }
            platformMap.get(row.platform)!.push(row.id);
          }
          idOrNames = Array.from(platformMap.entries()).map(([platform, ids]) => ({
            platform, repoIds: ids,
          }));
        }
        const participantData = await repoParticipants({
          ...options,
          limit: -1,
          idOrNames,
        });
        const participantsDataMap = new Map<string, number[]>(participantData.map(row => [row.id, row.count]));

        for (const row of openrankData) {
          const participantsData = participantsDataMap.get(row.id);
          if (!participantsData) {
            logger.error(`Participants data not found for ${row.id}`);
            continue;
          }
          row.participants = participantsData;
        }

        let lastData: any = null;
        const keys: string[] = [];
        if (groupByTimeType === 'month') {
          await forEveryMonthByConfig(options, async (y, m) => keys.push(`${y}${m}`));
        } else {
          for (let y = startYear; y <= endYear; y++) keys.push(`${y}`);
        }

        for (let index = 0; index < keys.length; index++) {
          const key = keys[index];
          const data = openrankData.map(row => ({
            id: row.id,
            platform: row.platform,
            avatar: groupType ? `https://oss.open-digger.cn/logos/${row.id.split(':')[1]}.png` :
              row.platform === 'GitHub' ? `https://github.com/${row.name.split('/')[0]}.png` :
                row.platform === 'Gitee' ? `https://gitee.com/${row.name.split('/')[0]}.png` : '',
            name: row.name,
            name_zh: !labelData.has(row.id) || labelData.get(row.id)?.name_zh === '' ? row.name : labelData.get(row.id)!.name_zh,
            openrank: +row.openrank[index],
            openrankDelta: 0,
            participants: +row.participants[index],
            participantsDelta: 0,
          })).sort((a, b) => b.openrank - a.openrank).map((i, index) => ({
            rank: index + 1,
            rankDelta: 0,
            ...i,
          }));
          for (const row of data) {
            row.openrankDelta = lastData ? row.openrank - lastData.find(r => r.id === row.id)?.openrank : 0;
            row.participantsDelta = lastData ? row.participants - lastData.find(r => r.id === row.id)?.participants : 0;
            row.openrankDelta = +row.openrankDelta.toFixed(2);
            row.rankDelta = lastData ? lastData.find(r => r.id === row.id)?.rank - row.rank : 0;
          }
          lastData = data;
          const result = data.slice(0, limit);

          let scopeName = 'global';
          if (scopeLabel) {
            scopeName = labelData.get(scopeLabel)!.name.toLowerCase();
          }
          const path = join('./local_files/open_leaderboard_next', scopeName, groupTypeName.name.toLowerCase(), groupByTimeType, key);
          if (!existsSync(path)) mkdirSync(path, { recursive: true });
          writeFileSync(join(path, 'data.json'), JSON.stringify({
            data: result,
          }));
        }
      }
    }
  }

  logger.info('Leaderboard next task completed.');

})();

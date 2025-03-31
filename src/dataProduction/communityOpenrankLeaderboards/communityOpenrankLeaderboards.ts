// Community OpenRank Leaderboards for OpenDigger website
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { forEveryMonthByConfig, getMergedConfig } from "../../metrics/basic";
import { getRepoCommunityOpenrank } from "../../metrics/indices";
import { join } from "path";
import { query } from "../../db/clickhouse";
import { getLabelData } from "../../labelDataUtils";
import { getLogger } from "../../utils";

export interface ProjectDetail {
  name: string;
  text: string;
  key: string;
  description: string;
  logo: string;
  urls: {
    type: string;
    url: string;
    text: string;
  }[];
}

export interface DataItem {
  l: string;
  a: string;
  r: string;
  rd: string;
  o: string;
  od: string;
};

const d = new Date();
d.setMonth(d.getMonth() - 1, 1);
export const timeOption = {
  startYear: 2015,
  startMonth: 1,
  endYear: d.getFullYear(),
  endMonth: d.getMonth() + 1,
};

const processOpenrank = n => n.toFixed(2);
const logger = getLogger('CommunityOpenrankLeaderboards');

// all bot accounts with ${platform}_${id} format
const bots = new Set<string>();
// bot avatar url
const botAvatars = new Map<string, string>();

const initBots = async () => {
  const res = await query<any>('SELECT id, avatar FROM gh_bot_avatars');
  for (const [id, avatar] of res) {
    botAvatars.set(`GitHub_${id}`, avatar);
  }
  logger.info(`Loaded ${botAvatars.size} avatars from database.`);

  const labels = getLabelData();
  const botLabel = labels.find(l => l.identifier === ':bot')!;
  botLabel.platforms.forEach(p => p.users.forEach(u => bots.add(`${p.name}_${u.id}`)));
  logger.info(`Loaded ${bots.size} bots from label.`);
};

export const run = async (baseDir: string, memberOrg: string, labels: string[], logoUrl: string, settingFile: string) => {
  if (existsSync(baseDir)) rmSync(baseDir, { recursive: true });
  if (!existsSync(baseDir)) mkdirSync(baseDir, { recursive: true });
  const projectDetails: ProjectDetail[] = JSON.parse(readFileSync(settingFile).toString());
  const employeesRes = await query<any>(`SELECT id, platform FROM org_member_info WHERE org='${memberOrg}'`);
  const employees = new Set(employeesRes.map(row => `${row[1]}_${row[0]}`));

  const projectUrlTypeMap = new Map<string, string>([
    ['githubUrl', 'GitHub 地址'],
    ['giteeUrl', 'Gitee 地址'],
    ['documentUrl', '文档地址'],
    ['officialUrl', '官网地址'],
  ]);
  projectDetails.forEach(p => {
    p.urls.forEach(u => {
      if (!projectUrlTypeMap.has(u.type)) throw new Error(`Not support url type ${u.type}`);
      u.text = projectUrlTypeMap.get(u.type)!;
    });
  });

  const configs: any = getMergedConfig({
    labelUnion: labels,
    groupBy: 'Project',
    options: {
      limit: -1,
    },
    limit: -1,
  });

  const communityOpenrankMonthData = await getRepoCommunityOpenrank({ ...configs, groupTimeRange: 'month' });
  const communityOpenrankYearData = await getRepoCommunityOpenrank({ ...configs, groupTimeRange: 'year' });
  const monthes: string[] = [];
  const years: string[] = [];
  await forEveryMonthByConfig(configs, async (y, m) => monthes.push(`${y}-${m.toString().padStart(2, '0')}`));
  for (let y = configs.startYear; y <= configs.endYear; y++) years.push(y.toString());

  for (const projectDetail of projectDetails) {
    const writeData = (keys: string[], openrankArr: any[], filename: (key: string) => string) => {
      let lastOpenrankDetail = [];
      for (let i = 0; i < keys.length; i++) {
        const openrankDetail = openrankArr[i];
        if (openrankDetail.length === 0) continue;
        const data: DataItem[] = openrankDetail.map((u, index) => {
          const [platform, id, login, openrank] = u;
          const key = `${platform}_${id}`;
          return {
            l: login,
            o: processOpenrank(openrank),
            a: platform === 'GitHub' ? (botAvatars.has(key) ? botAvatars.get(key) : `https://avatars.githubusercontent.com/${login}`) : '',
            r: (index + 1).toString(),
            od: lastOpenrankDetail.find(i => i[2] === login) ?
              processOpenrank(openrank - lastOpenrankDetail.find(i => i[2] === login)![3]) : 'new',
            rd: lastOpenrankDetail.findIndex(i => i[2] === login) >= 0 ?
              (lastOpenrankDetail.findIndex(i => i[2] === login) - index).toString() : 'new',
            b: (login.endsWith('[bot]') || bots.has(key)) ? true : undefined,
            i: employees.has(key) ? true : undefined,
          };
        });
        const outputPath = join(baseDir, projectDetail.name, filename(keys[i]));
        if (!existsSync(outputPath)) mkdirSync(outputPath, { recursive: true });
        // proj/yyyy/mm/data.json and proj/yyyy/data.json contains detailed data of the ranking list
        writeFileSync(join(outputPath, 'data.json'), JSON.stringify({
          name: projectDetail.name,
          text: projectDetail.text,
          details: data
        }));
        lastOpenrankDetail = openrankDetail;
      }
    };

    // for month
    const openrankMonthDataRow = communityOpenrankMonthData.find(row => row.name === projectDetail.text || row.name === projectDetail.key);
    if (!openrankMonthDataRow) {
      console.table(communityOpenrankMonthData);
      console.log(`Can not find data for ${projectDetail.text}`);
    }
    writeData(monthes, openrankMonthDataRow.openrank, key => key.split('-').map(parseFloat).join('/'));
    const openrankYearDataRow = communityOpenrankYearData.find(row => row.name === projectDetail.text || row.name === projectDetail.key);
    if (!openrankYearDataRow) {
      console.table(communityOpenrankYearData);
      console.log(`Can not find data for ${projectDetail.text}`);
    }
    writeData(years, openrankYearDataRow.openrank, key => key);

    projectDetail.logo = `${logoUrl}/${openrankMonthDataRow.id.substring(1)}.png`;

    let startTime = -1, endTime = -1;
    for (let i = 0; i < monthes.length; i++) {
      if (openrankMonthDataRow.openrank[i].length === 0) continue;
      const [y, m] = monthes[i].split('-').map(parseFloat);
      const time = new Date(y, m - 1).getTime();
      if (startTime < 0) startTime = time;
      if (endTime < time) endTime = time;
    }

    // for every proj, proj/index.json contains start and end time range of the proj
    writeFileSync(join(baseDir, projectDetail.name, 'index.json'), JSON.stringify({
      name: projectDetail.name,
      text: projectDetail.text,
      startTime,
      endTime,
      defaultTime: endTime,
    }));
  }

  writeFileSync(join(baseDir, 'index.json'), JSON.stringify({
    time: new Date().getTime(),
    dataTime: d.getTime(),
    repos: projectDetails,
  }));
};

(async () => {
  await initBots();
  await run('./local_files/community_openrank/alibaba', ':companies/alibaba', [':companies/alibaba'], 'https://oss.open-digger.cn/logos', './src/dataProduction/communityOpenrankLeaderboards/alibaba_openrank_data.json');
  await run('./local_files/community_openrank/antgroup', ':companies/antgroup', [':companies/antgroup'], 'https://oss.open-digger.cn/logos', './src/dataProduction/communityOpenrankLeaderboards/antgroup_openrank_data.json');
  await run('./local_files/community_openrank/xlab', ':communities/xlab', [':communities/xlab'], 'https://oss.open-digger.cn/logos', './src/dataProduction/communityOpenrankLeaderboards/xlab_openrank_data.json');
})();

import { getLabelData } from "../labelDataUtils";
import { QueryConfig } from "../metrics/basic";
import { getRepoOpenrank } from "../metrics/indices";
import { repoCount, repoParticipants } from "../metrics/metrics";
import { countryInfo } from '../static/countries';

// China Annual Report
(async () => {
  const year = 2024, rankingCount = 30;
  const openDiggerOssUrl = 'https://oss.open-digger.cn/';
  const labels = getLabelData();
  const getLogoUrl = (id: string) => id ? `${openDiggerOssUrl}logos/${id.split(':')[1]}.png` : null;

  const findCountry = (labelId: string): {} => {
    const label = labels.find(l => l.identifier === labelId)!;
    const countryLabelId = label.parents.find(p => p.startsWith(':regions'));
    if (countryLabelId) {
      const countryLabel = labels.find(l => l.identifier === countryLabelId)!;
      const countryItem = countryInfo.find(c => c.name === countryLabel.name);
      if (!countryItem) {
        throw new Error(`Country flag not found: ${countryLabel.name}`);
      }
      return {
        country_flag: countryItem.flag,
        country_name: `${countryItem.flag}${countryItem.name}`,
      }
    }
    for (const parent of label.parents) {
      const c = findCountry(parent);
      if (c) return c;
    }
    return {};
  };

  const findInitiator = (labelId: string): {} => {
    const label = labels.find(l => l.identifier === labelId)!;
    const initiatorLabelId = label.parents.find(p => [':companies', ':universities', 'agencies'].some(i => p.startsWith(i)));
    if (initiatorLabelId) {
      const initiatorLabel = labels.find(l => l.identifier === initiatorLabelId)!;
      return {
        initiator_name: initiatorLabel.name,
        initiator_logo: getLogoUrl(initiatorLabelId),
      }
    }
    for (const parent of label.parents) {
      const c = findInitiator(parent);
      if (c) return c;
    }
    return {};
  };

  const findFoundation = (labelId: string): {} => {
    const label = labels.find(l => l.identifier === labelId)!;
    const foundationLabelId = label.parents.find(p => p.startsWith(':foundations'));
    if (foundationLabelId) {
      const companyLabel = labels.find(l => l.identifier === foundationLabelId)!;
      return {
        foundation_name: companyLabel.name,
        foundation_logo: getLogoUrl(foundationLabelId),
      }
    }
    for (const parent of label.parents) {
      const c = findFoundation(parent);
      if (c) return c;
    }
    return {};
  };

  const getProjectType = (name: string): string => {
    const typeMap = new Map([
      ['OpenHarmony', '操作系统'], ['Azure', '云计算'], ['.Net', '编程语言'], ['NixOS', '操作系统'],
      ['openEuler', '操作系统'], ['LLVM', '开发工具'], ['OpenShift', '云计算'], ['Home Assistant', '物联网'],
      ['VSCode', '开发工具'], ['DataDog', '大数据'], ['Odoo', '企业应用'], ['Rust', '编程语言'], ['Kubernetes', '云计算'],
      ['MindSpore', '人工智能'], ['OpenTelemetry', '大数据'], ['Godot Engine', '游戏引擎'], ['NextCloud', '应用工具'],
      ['Flutter', '编程语言'], ['OpenSearch', '大数据'], ['FreeDomain', '开发工具'], ['Zephyr', '物联网'],
      ['PaddlePaddle', '人工智能'], ['LangChain', '人工智能'], ['Conda Forge', '开发工具'], ['Grafana', '可视化'],
      ['Expensify', '企业应用'], ['Kibana', '可视化'], ['Cloudflare', '企业应用'], ['Homebrew', '开发工具'],
      ['OpenVINO', '人工智能'], ['openGauss', '数据库'], ['DaoCloud Public Image Mirror', '云计算'],
      ['Apache Doris', '数据库'], ['Anolis OS', '操作系统'], ['TiDB', '操作系统'], ['openKylin', '操作系统'],
      ['Ant Design', '可视化'], ['StarRocks', '数据库'], ['Milvus', '数据库'], ['ModelScope', '人工智能'], ['EMQX', '物联网'],
      ['AntV', '可视化'], ['SecretFlow', '隐私计算'], ['TDengine', '数据库'], ['OceanBase', '数据库'], ['1Panel', '企业应用'],
      ['Apache Flink', '大数据'], ['Lobe Chat', '人工智能'], ['DataEase', '可视化'], ['MatrixOne', '数据库'],
      ['Apache Ozone', '大数据'], ['Nacos', '中间件'], ['Apache ShardingSphere', '数据库'], ['Apache IoTDB', '数据库'],
      ['TiKV', '数据库'], ['Apache Dubbo', '中间件'], ['Zed', '开发工具']
    ]);
    if (!typeMap.has(name)) {
      throw new Error('No type found for ' + name);
    }
    return typeMap.get(name)!;
  }

  const injectParticipants = async (option: any, result: any[]) => {
    const participantsData = await repoParticipants({
      ...option,
      limit: -1,
    });
    for (const item of result) {
      const data = participantsData.find(row => row.id === item.id);
      if (!data) {
        console.error(`Can not find participants data for ${item.id}`);
        continue;
      }
      item.participants = +data.count[1];
      item.participants_delta = +data.count[1] - +data.count[0]
    }
  };

  const injectRepoCount = async (option: any, result: any[]) => {
    const repoCountData = await repoCount({
      ...option,
      limit: -1,
    });
    for (const item of result) {
      const data = repoCountData.find(row => row.id === item.id);
      if (!data) {
        console.error(`Can not find repo count data for ${item.id}`);
        continue;
      }
      item.repo_count = +data.count[1];
      item.repo_count_delta = +data.count[1] - +data.count[0]
    }
  };

  const defaultOption: Partial<QueryConfig> = {
    startYear: year - 1, startMonth: 1,
    endYear: year, endMonth: 12,
    limit: rankingCount + 3,
    order: 'DESC', orderOption: 'latest',
    groupTimeRange: 'year',
  }
  // Global Projects
  const getGlobalProjectsRanking = async () => {
    const option: any = {
      ...defaultOption,
      labelIntersect: ['Project'],
      groupBy: 'Project',
    };
    let res = await getRepoOpenrank(option);
    res = res.filter(row => row.name != 'Others').slice(0, rankingCount).map(row => {
      return {
        id: row.id,
        name: row.name,
        logo: getLogoUrl(row.id),
        openrank: row.openrank[1],
        delta: +(row.openrank[1] - row.openrank[0]).toFixed(2),
        ...findCountry(row.id),
        ...findInitiator(row.id),
        ...findFoundation(row.id),
        type: getProjectType(row.name),
      };
    })
    await injectRepoCount(option, res);
    await injectParticipants(option, res);
    console.log('Global projects data:');
    console.log(JSON.stringify({
      title: `${year} 全球项目 OpenRank 排行榜 Top ${res.length}`,
      data: res.map((r, i) => ({ rank: i + 1, ...r })),
      options: [
        { name: '#', type: 'String', fields: ['rank'], width: 40 },
        { name: '项目', type: 'StringWithIcon', fields: ['name', 'logo'], width: 230 },
        { name: 'OpenRank', type: 'NumberWithDelta', fields: ['openrank', 'delta'], width: 250 },
        { name: '活跃仓库数', type: 'NumberWithDelta', fields: ['repo_count', 'repo_count_delta'], width: 170 },
        { name: '活跃开发者数', type: 'NumberWithDelta', fields: ['participants', 'participants_delta'], width: 170 },
        { name: '技术领域', type: 'String', fields: ['type'], width: 120 },
        { name: '发起方', type: 'PureImage', fields: ['initiator_logo'], width: 100 },
        { name: '发起国家', type: 'String', fields: ['country_flag'], width: 100 },
      ]
    }));
  };
  // Chinese Projects
  const getChineseProjectsRanking = async () => {
    const option: any = {
      ...defaultOption,
      labelIntersect: ['Project', ':regions/CN'],
      groupBy: 'Project',
    };
    let res = await getRepoOpenrank(option);
    res = res.filter(row => row.name != 'Others').slice(0, rankingCount).map(row => {
      return {
        id: row.id,
        name: row.name,
        logo: getLogoUrl(row.id),
        openrank: row.openrank[1],
        delta: +(row.openrank[1] - row.openrank[0]).toFixed(2),
        ...findInitiator(row.id),
        ...findFoundation(row.id),
        type: getProjectType(row.name),
      };
    });
    await injectRepoCount(option, res);
    await injectParticipants(option, res);
    console.log('Chinese projects data:');
    console.log(JSON.stringify({
      title: `${year} 中国项目 OpenRank 排行榜 Top ${res.length}`,
      data: res.map((r, i) => ({ rank: i + 1, ...r })),
      options: [
        { name: '#', type: 'String', fields: ['rank'], width: 40 },
        { name: '项目', type: 'StringWithIcon', fields: ['name', 'logo'], width: 230 },
        { name: 'OpenRank', type: 'NumberWithDelta', fields: ['openrank', 'delta'], width: 250 },
        { name: '活跃仓库数', type: 'NumberWithDelta', fields: ['repo_count', 'repo_count_delta'], width: 170 },
        { name: '活跃开发者数', type: 'NumberWithDelta', fields: ['participants', 'participants_delta'], width: 170 },
        { name: '发起方', type: 'StringWithIcon', fields: ['initiator_name', 'initiator_logo'], width: 150 },
        { name: '技术领域', type: 'String', fields: ['type'], width: 150 },
        { name: '基金会', type: 'PureImage', fields: ['foundation_logo'], width: 80 },
      ]
    }));
  };
  // Global Companies
  const getGlobalCompaniesRanking = async () => {
    const option: any = {
      ...defaultOption,
      labelIntersect: ['Company'],
      groupBy: 'Company',
    };
    let res = await getRepoOpenrank(option);
    res = res.filter(row => row.name != 'Others').map(row => {
      return {
        id: row.id,
        name: row.name,
        logo: getLogoUrl(row.id),
        openrank: row.openrank[1],
        delta: +(row.openrank[1] - row.openrank[0]).toFixed(2),
        ...findCountry(row.id),
      };
    }).slice(0, rankingCount);
    await injectRepoCount(option, res);
    await injectParticipants(option, res);
    console.log('Global companies data:');
    console.log(JSON.stringify({
      title: `${year} 全球企业 OpenRank 排行榜 Top ${res.length}`,
      data: res.map((r, i) => ({ rank: i + 1, ...r })),
      options: [
        { name: '#', type: 'String', fields: ['rank'], width: 40 },
        { name: '企业', type: 'StringWithIcon', fields: ['name', 'logo'], width: 230 },
        { name: 'OpenRank', type: 'NumberWithDelta', fields: ['openrank', 'delta'], width: 230 },
        { name: '活跃仓库数', type: 'NumberWithDelta', fields: ['repo_count', 'repo_count_delta'], width: 200 },
        { name: '活跃开发者数', type: 'NumberWithDelta', fields: ['participants', 'participants_delta'], width: 200 },
        { name: '所属国家', type: 'String', fields: ['country_name'], width: 130 },
      ]
    }));
  };
  // Chinese Companies
  const getChineseCompaniesRanking = async () => {
    const option: any = {
      ...defaultOption,
      labelIntersect: ['Company', ':regions/CN'],
      groupBy: 'Company',
    };
    let res = await getRepoOpenrank(option);
    res = res.filter(row => row.name != 'Others').map(row => {
      return {
        id: row.id,
        name: row.name,
        logo: getLogoUrl(row.id),
        openrank: row.openrank[1],
        delta: +(row.openrank[1] - row.openrank[0]).toFixed(2),
      };
    }).slice(0, rankingCount);
    await injectRepoCount(option, res);
    await injectParticipants(option, res);
    console.log('Chinese companies data:');
    console.log(JSON.stringify({
      title: `${year} 中国企业 OpenRank 排行榜 Top ${res.length}`,
      data: res.map((r, i) => ({ rank: i + 1, ...r })),
      options: [
        { name: '#', type: 'String', fields: ['rank'], width: 40 },
        { name: '企业', type: 'StringWithIcon', fields: ['name', 'logo'], width: 250 },
        { name: 'OpenRank', type: 'NumberWithDelta', fields: ['openrank', 'delta'], width: 250 },
        { name: '活跃仓库数', type: 'NumberWithDelta', fields: ['repo_count', 'repo_count_delta'], width: 230 },
        { name: '活跃开发者数', type: 'NumberWithDelta', fields: ['participants', 'participants_delta'], width: 230 },
      ]
    }));
  };
  // Global Foundations
  const getGlobalFoundationsRanking = async () => {
    const option: any = {
      ...defaultOption,
      labelIntersect: ['Foundation'],
      groupBy: 'Foundation',
    };
    let res = await getRepoOpenrank(option);
    res = res.filter(row => row.name != 'Others').map(row => {
      return {
        id: row.id,
        name: row.name,
        logo: getLogoUrl(row.id),
        openrank: row.openrank[1],
        delta: +(row.openrank[1] - row.openrank[0]).toFixed(2),
        ...findCountry(row.id),
      };
    }).slice(0, 20);
    await injectRepoCount(option, res);
    await injectParticipants(option, res);
    console.log('Global foundation data:');
    console.log(JSON.stringify({
      title: `${year} 开源基金会 OpenRank 排行榜 Top ${res.length}`,
      data: res.map((r, i) => ({ rank: i + 1, ...r })),
      options: [
        { name: '#', type: 'String', fields: ['rank'], width: 40 },
        { name: '基金会', type: 'StringWithIcon', fields: ['name', 'logo'], width: 250 },
        { name: 'OpenRank', type: 'NumberWithDelta', fields: ['openrank', 'delta'], width: 250 },
        { name: '活跃仓库数', type: 'NumberWithDelta', fields: ['repo_count', 'repo_count_delta'], width: 230 },
        { name: '活跃开发者数', type: 'NumberWithDelta', fields: ['participants', 'participants_delta'], width: 230 },
        { name: '所属国家', type: 'String', fields: ['country_name'], width: 130 },
      ]
    }));
  };
  // Global New Force
  const getGlobalNewForceRanking = async () => {
    const option: any = {
      ...defaultOption,
      labelIntersect: ['Project'],
      groupBy: 'Project',
      limit: -1,
    };
    let res = await getRepoOpenrank(option);
    const filterNames = ['FreeDomain', 'GirlScript Summer of Code 24', 'Daily CodeForce Problems', 'god_bless',
      'Ollama', 'Aider'];
    res = res.filter(row => row.name != 'Others').filter(row => row.openrank[0] === 0 && !filterNames.includes(row.name)).map(row => {
      return {
        id: row.id,
        name: row.name,
        logo: getLogoUrl(row.id),
        openrank: row.openrank[1],
        delta: +(row.openrank[1] - row.openrank[0]).toFixed(2),
        ...findCountry(row.id),
        ...findInitiator(row.id),
        ...findFoundation(row.id),
      };
    }).slice(0, 10);
    await injectRepoCount(option, res);
    await injectParticipants(option, res);
    console.log('Global projects data:');
    console.log(JSON.stringify({
      title: `${year} 全球项目新势力 OpenRank 排行榜 Top ${res.length}`,
      data: res.map((r, i) => ({ rank: i + 1, ...r })),
      options: [
        { name: '#', type: 'String', fields: ['rank'], width: 40 },
        { name: '项目', type: 'StringWithIcon', fields: ['name', 'logo'], width: 280 },
        { name: 'OpenRank', type: 'String', fields: ['openrank'], width: 200 },
        { name: '活跃仓库数', type: 'String', fields: ['repo_count'], width: 170 },
        { name: '活跃开发者数', type: 'String', fields: ['participants'], width: 170 },
        { name: '发起方', type: 'PureImage', fields: ['initiator_logo'], width: 100 },
        { name: '发起国家', type: 'String', fields: ['country_flag'], width: 100 },
        { name: '基金会', type: 'PureImage', fields: ['foundation_logo'], width: 100 },
      ]
    }));
  };

  await getGlobalProjectsRanking();
  await getChineseProjectsRanking();
  await getGlobalCompaniesRanking();
  await getChineseCompaniesRanking();
  await getGlobalFoundationsRanking();
  await getGlobalNewForceRanking();
})();

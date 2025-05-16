import { dump } from 'js-yaml';
import { readCsvArray } from '../utils';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { query } from '../db/clickhouse';
import { getLabelData } from '../labelDataUtils';
import { countryInfo } from '../static/countries';
import { subdivisionAliasMap } from '../static/subdivisionAlias';
import { OpenAI } from 'openai';
import getConfig from '../config';

export const chinaParts = ['MO', 'HK', 'TW'];
export const invalidAlpha2 = ['AN', 'EU', 'XK', ...chinaParts];
export interface DivisionItem {
  name: string;
  type: 'Division-0' | 'Division-1';
  meta: {
    alpha2: string;
    name_full?: string;
    name_zh?: string;
    includes: string[];
    category?: string;
    developers?: {
      year: number;
      quarter: number;
      count: number;
    }[];
  };
  data?: {
    labels: string[];
  }
};

// preferred show name with language code
const languageCode = ['en', 'fr', 'zh', 'es', 'ru', 'ar',
  'vi', 'uk', 'sw', 'tr', 'tk', 'pt', 'tg', 'th', 'uz', 'nl', 'fy', 'so', 'it', 'sk',
  'sl', 'sv', 'sr', 'ro', 'pl', 'nn', 'ms', 'mn', 'my', 'mk', 'mg', 'lv', 'lt', 'de',
  'lo', 'ko', 'km', 'ja', 'is', 'fa', 'id', 'hu', 'hr', 'el', 'kl', 'ka', 'ca', 'gl',
  'et', 'da', 'cs', 'rm', 'dz', 'bg', 'bn', 'az', 'hy', 'sq', 'fa', '',
];

// generate data from static files
(async () => {

  const config: any = await getConfig();
  const openai = new OpenAI({
    apiKey: config.qwen.token,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  });

  // load top divisions
  const divisionMap = new Map<string, DivisionItem>();
  const divisions: {
    name: string; 'alpha-2': string; 'country-code': string
  }[] = JSON.parse(readFileSync('./src/static/divisions.json', 'utf-8'));
  divisions.forEach(d => !chinaParts.includes(d['alpha-2']) && divisionMap.set(d['alpha-2'], {
    name: d.name,
    type: 'Division-0',
    meta: {
      alpha2: d['alpha-2'],
      includes: [d.name, d['alpha-2'], d['country-code']],
    },
  }));

  // set top division chinese names
  const countryNames: {
    cn: string; en: string; full: string; abb2: string
  }[] = JSON.parse(readFileSync('./src/static/country_names.json', 'utf-8'));
  countryNames.forEach(c => {
    if (invalidAlpha2.includes(c.abb2)) return;
    if (!divisionMap.has(c.abb2)) console.log(`Can not find country with: ${c.abb2}`);
    const item = divisionMap.get(c.abb2)!;
    item.meta.name_full = c.full;
    item.meta.name_zh = c.cn;
    item.meta.includes.push(c.full);
    item.meta.includes.push(c.cn);
  });

  // generate subdivision data
  const subdivsionMap = new Map<string, { item: DivisionItem, names: Set<string> }>();
  const childDivisions = new Set<string>();
  const subdivisionData = await readCsvArray('./src/static/subdivisions.csv', [
    { name: 'country_code_alpha2', type: 'string' },
    { name: 'subdivision_code_iso3166_2', type: 'string' },
    { name: 'subdivision_name', type: 'string' },
    { name: 'language_code', type: 'string' },
    { name: 'parent_subdivision', type: 'string' },
    { name: 'category', type: 'string' },
    { name: 'localVariant', type: 'string' },
  ]);
  subdivisionData.forEach(d => {
    if (invalidAlpha2.includes(d.country_code_alpha2)) return;
    if (!divisionMap.has(d.country_code_alpha2)) console.log(`Can not find country with: ${d.country_code_alpha2}`);
    let code = d.subdivision_code_iso3166_2;
    if (d.parent_subdivision !== '') { // sub-subdivision
      code = d.parent_subdivision;
      childDivisions.add(d.subdivision_code_iso3166_2);
    }
    if (!subdivsionMap.has(code)) subdivsionMap.set(code, {
      item: {
        name: '', type: 'Division-1', meta: { alpha2: code, includes: [] },
      },
      names: new Set(),
    });
    subdivsionMap.get(code)!.names.add(d.subdivision_name);
    subdivsionMap.get(code)!.names.add(d.subdivision_code_iso3166_2);
    subdivsionMap.get(code)!.names.add(d.subdivision_code_iso3166_2.split('-')[1]);
    subdivsionMap.get(code)!.names.add(`${d.subdivision_name} ${d.category}`);
    if (d.localVariant && d.localVariant !== '') {
      d.localVariant.split(';').map(l => l.trim()).forEach(l => {
        subdivsionMap.get(code)!.names.add(l);
        subdivsionMap.get(code)!.names.add(`${l} ${d.category}`);
      });
    }
    if (d.parent_subdivision === '') {
      for (const l of languageCode) {
        if (d.language_code === l) {
          subdivsionMap.get(code)!.item.name = d.subdivision_name;
          subdivsionMap.get(code)!.item.meta.category = d.category;
          break;
        }
      }
    }
  });
  for (const [code, { item, names }] of subdivsionMap) {
    if (childDivisions.has(code)) continue;
    item.meta.includes = Array.from(names);
    const countryAlpha2 = code.split('-')[0];
    if (!divisionMap.has(countryAlpha2)) console.log(`Can not find country with: ${countryAlpha2}`);
    const countryItem = divisionMap.get(countryAlpha2)!;
    if (!countryItem.data) countryItem.data = { labels: [] };
    countryItem.data.labels.push(code);
    if (subdivisionAliasMap.has(code)) {
      item.meta.includes.push(...subdivisionAliasMap.get(code)!);
    }
    item.meta.includes = Array.from(new Set(item.meta.includes.map(n => n.toLocaleLowerCase())));
    if (item.name === '') {
      console.log(`No language name found for ${code}`);
    }
    if (!existsSync(`./labeled_data/divisions/${countryAlpha2}`)) {
      mkdirSync(`./labeled_data/divisions/${countryAlpha2}`);
    }
    writeFileSync(join(`./labeled_data/divisions/${countryAlpha2}`, `${code}.yml`),
      dump(item, { noRefs: true, lineWidth: -1 }));
  }

  countryInfo.forEach(c => {
    const item = divisionMap.get(c.a2);
    if (!item) {
      console.log(`Can not find item with: ${c.a2}`);
      return;
    }
    if (c.includes) item.meta.includes.push(...c.includes, c.name, c.name_zh);
    item.meta.includes = Array.from(new Set(item.meta.includes));
  })

  for (const i of divisionMap.values()) {
    const outputDir = `./labeled_data/divisions/${i.meta.alpha2}`;
    if (!existsSync(outputDir)) mkdirSync(outputDir);
    writeFileSync(join(outputDir, 'index.yml'), dump(i, { noRefs: true, lineWidth: -1 }));
  }

  // check data from database
  const checkDatabase = (async () => {
    const labels = getLabelData();
    const countryLabels: any = labels.filter(l => l.type === 'Division-0');
    const divisionDataInDB: any[] = await query("SELECT country, administrative_area_level_1 FROM location_info WHERE status='normal' AND administrative_area_level_1 != '' GROUP BY country, administrative_area_level_1");
    const databaseSubdivisions = new Map<string, Set<string>>();

    divisionDataInDB.forEach(row => {
      if (!countryLabels.some(l => l.meta.includes.includes(row[0]))) {
        return;
      }
      if (!databaseSubdivisions.has(row[0])) databaseSubdivisions.set(row[0], new Set());
      databaseSubdivisions.get(row[0])!.add(row[1]);
    });
    const notFoundItems: { country: string; subdivisions: string[]; notFoundSubdivisions: string[] }[] = [];
    for (const [country, subdivisions] of databaseSubdivisions) {
      const countryLabel = countryLabels.find(l => l.meta.includes.includes(country));
      if (!countryLabel) {
        console.log(`Can not find label for country: ${country}`);
        continue;
      }
      if (countryLabel.children.length === 0) continue;
      const notFoundSubdivisions: string[] = [];
      for (const subdivision of subdivisions) {
        const subdivisionLabel = countryLabel.children.find(l => labels.find(ll => ll.identifier === l)!.meta.includes.includes(subdivision.toLocaleLowerCase()));
        if (!subdivisionLabel) {
          notFoundSubdivisions.push(subdivision);
        }
      }
      if (notFoundSubdivisions.length > 0) {
        notFoundItems.push({
          country: `Country: ${countryLabel.name} ./labeled_data/divisions/${countryLabel.meta.alpha2}/index.yml`,
          subdivisions: [],
          notFoundSubdivisions,
        });
        for (const c of countryLabel.children) {
          const cl = labels.find(l => l.identifier === c)!;
          notFoundItems[notFoundItems.length - 1].subdivisions.push(`${cl.name} ./labeled_data/${cl.identifier.substring(1)}.yml`);
        }
      }
    }

    console.log(notFoundItems.length);
    console.log(notFoundItems.map(i => i.notFoundSubdivisions.length).reduce((a, c) => a + c, 0));

    for (const i of notFoundItems.sort((b, a) => b.notFoundSubdivisions.length - a.notFoundSubdivisions.length)) {
      // if (['Tajikistan', 'India'].some(c => i.country.includes(c))) continue;
      console.log(i.country);
      i.subdivisions.forEach(s => console.log(s));
      console.log(`Not found subdivisions:`);
      i.notFoundSubdivisions.forEach(s => console.log(`['', ['${s}']],`));
      const queryContent = `
以下是国家 ${i.country} 中包含的一级行政区划的列表，它们以\t分割，并使用的是联合国官方语言或本国的官方语言：
${i.subdivisions.join('\t')}
这里有一些其他的名称，它们是以\t分割的，可能可以对应到上述一级行政区划中：
${i.notFoundSubdivisions.join('\t')}
请你尽可能的根据你的知识将这些名称对应到上述行政区划中，并返回对应结果。
返回结果时请返回一个数据，这个数组中每项也为一个数组
每一项的第一项是对应的一级行政区划的 ISO 代码，也就是名称中的文件名，第二项也是一个字符串数组，是对应到这个行政区划的所有名称的列表
将上述结果以 JSON 格式返回，请不要添加其他的额外内容，包括外层的语言标识信息，以保证返回结果可以直接被解析
请注意在之前的对话中，你返回了带有 \`\`\`json 标识的 JSON 数据。这次请返回纯 JSON 数据，不带任何代码块标识
请注意在之前的对话中，你同时也返回了所提供的一级行政区划的名称，这次请只返回我要求你对应的这些名称，不要返回提供的名称
请注意在之前的对话中，你返回的数据中包含了一层 data 字段，这次请直接返回数据数组，不要添加额外的字段名
`;
      const parseResult = await openai.chat.completions.create({
        model: 'qwen-plus',
        messages: [{ role: 'user', content: queryContent }],
      });
      const res = parseResult.choices[0].message.content!;
      console.log(JSON.parse(res));
      console.log();
    }
  });

  await checkDatabase();
})();

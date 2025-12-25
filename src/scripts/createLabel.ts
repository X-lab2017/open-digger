import * as readline from 'readline';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import path from 'path';
import { dump, load } from 'js-yaml';

// 国家数据接口
interface CountryData {
  cn: string;
  en: string;
  full: string;
  abb2: string;
  abb3: string;
  code: string;
}

// 加载国家数据
function loadCountryData(): CountryData[] {
  const countryDataPath = path.join('src', 'static', 'country_names.json');
  try {
    const fileContent = readFileSync(countryDataPath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    console.error(`❌ 无法加载国家数据文件: ${countryDataPath}`, error.message);
    return [];
  }
}

// 根据中文名称查找国家代码
function findCountryByChineseName(countryName: string, countryData: CountryData[]): string | null {
  const trimmed = countryName.trim();
  const country = countryData.find(
    (c) => c.cn === trimmed || c.cn.toLowerCase() === trimmed.toLowerCase()
  );
  return country ? country.abb2.toLowerCase() : null;
}

// 支持的标签类型
const supportedTypes = new Set([
  'Division-0', 'Division-1', 'Region-0', 'Region-1', 'Company', 'Community',
  'Project', 'Foundation', 'University-0', 'Agency-0', 'Institution',
  'Tech-0', 'Tech-1', 'Tech-2', 'Tech-3', 'Domain-0', 'Bot'
]);

// 支持的平台
const supportedPlatforms = new Set(['github', 'gitee']);

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 询问用户输入的函数
function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

// 校验标签类型
function validateType(type: string): boolean {
  return supportedTypes.has(type);
}

// 解析平台数据
function parsePlatformData(input: string): { platform: string; orgName?: string; repoName?: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split('/');
  if (parts.length < 2 || parts.length > 3) {
    return null;
  }

  const platform = parts[0].toLowerCase();
  if (!supportedPlatforms.has(platform)) {
    return null;
  }

  if (parts.length === 2) {
    // org 格式: github/org
    return {
      platform: platform === 'github' ? 'GitHub' : 'Gitee',
      orgName: parts[1]
    };
  } else {
    // org/repo 格式: github/org/repo
    return {
      platform: platform === 'github' ? 'GitHub' : 'Gitee',
      orgName: parts[1],
      repoName: `${parts[1]}/${parts[2]}`
    };
  }
}

// 组装标签数据
function buildLabelData(name: string, type: string, platformData: { platform: string; orgName?: string; repoName?: string }): any {
  const data: any = {
    name,
    type,
    data: {
      platforms: [
        {
          name: platformData.platform,
          type: 'Code Hosting',
          orgs: [],
          repos: []
        }
      ]
    }
  };

  if (platformData.orgName && !platformData.repoName) {
    // 只有组织
    data.data.platforms[0].orgs.push({
      id: undefined,
      name: platformData.orgName
    });
  } else if (platformData.repoName) {
    // 有仓库
    data.data.platforms[0].repos.push({
      id: undefined,
      name: platformData.repoName
    });
  }

  return data;
}

// 确保目录存在
function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// 更新国家标签文件，添加企业ID到 labels 数组
async function updateDivisionLabel(alpha2: string, companyId: string): Promise<void> {
  const divisionFilePath = path.join('labeled_data', 'divisions', alpha2.toUpperCase(), 'index.yml');

  // 检查文件是否存在
  if (!existsSync(divisionFilePath)) {
    throw new Error(`无法找到国家标签文件: ${divisionFilePath}`);
  }

  // 读取现有文件
  const fileContent = readFileSync(divisionFilePath, 'utf8');
  const divisionData: any = load(fileContent, { json: true });

  if (!divisionData) {
    throw new Error(`无法解析国家标签文件: ${divisionFilePath}`);
  }

  // 确保 data 对象存在
  if (!divisionData.data) {
    divisionData.data = {};
  }

  // 确保 labels 数组存在
  if (!divisionData.data.labels) {
    divisionData.data.labels = [];
  }

  // 检查是否已存在，避免重复添加
  if (!divisionData.data.labels.includes(companyId)) {
    divisionData.data.labels.push(companyId);
    // 排序 labels 数组（可选，保持一致性）
    divisionData.data.labels.sort();
  }

  // 写回文件
  const yamlContent = dump(divisionData, { noRefs: true, lineWidth: -1 });
  writeFileSync(divisionFilePath, yamlContent, 'utf8');

  console.log(`✅ 已更新国家标签文件: ${divisionFilePath}`);
}

// 更新公司标签文件，添加项目ID到 labels 数组
async function updateCompanyIndexLabel(companyIndexPath: string, projectId: string): Promise<void> {
  // 检查文件是否存在
  if (!existsSync(companyIndexPath)) {
    throw new Error(`无法找到公司标签文件: ${companyIndexPath}`);
  }

  // 读取现有文件
  const fileContent = readFileSync(companyIndexPath, 'utf8');
  const companyData: any = load(fileContent, { json: true });

  if (!companyData) {
    throw new Error(`无法解析公司标签文件: ${companyIndexPath}`);
  }

  // 确保 data 对象存在
  if (!companyData.data) {
    companyData.data = {};
  }

  // 确保 labels 数组存在
  if (!companyData.data.labels) {
    companyData.data.labels = [];
  }

  // 检查是否已存在，避免重复添加
  if (!companyData.data.labels.includes(projectId)) {
    companyData.data.labels.push(projectId);
    // 排序 labels 数组（可选，保持一致性）
    companyData.data.labels.sort();
  }

  // 写回文件
  const yamlContent = dump(companyData, { noRefs: true, lineWidth: -1 });
  writeFileSync(companyIndexPath, yamlContent, 'utf8');

  console.log(`✅ 已更新公司标签文件: ${companyIndexPath}`);
}

// 主循环
async function main() {
  // 加载国家数据
  const countryData = loadCountryData();
  if (countryData.length === 0) {
    console.error('❌ 无法加载国家数据，程序退出。');
    process.exit(1);
  }

  let lastType: string | null = null;

  while (true) {
    try {
      // 1. 询问标签类型
      let type: string;
      if (lastType) {
        const typeInput = await question(`请输入标签类型（直接回车使用上次类型: ${lastType}）: `);
        type = typeInput.trim() || lastType;
      } else {
        const typeInput = await question('请输入标签类型（Company、Project、Foundation等）: ');
        type = typeInput.trim();
      }

      if (!type || !validateType(type)) {
        console.log('❌ 无效的标签类型，请重新输入。');
        continue;
      }

      lastType = type;

      // 2. 询问标签名称
      const nameInput = await question('请输入标签名称: ');
      const name = nameInput.trim();
      if (!name) {
        console.log('❌ 标签名称不能为空，请重新输入。');
        continue;
      }

      // 3. 询问平台数据
      const platformInput = await question('请输入平台数据（格式: github/org 或 github/org/repo）: ');
      const platformData = parsePlatformData(platformInput);
      if (!platformData) {
        console.log('❌ 无效的平台数据格式，请重新输入。格式应为: github/org 或 github/org/repo 或 gitee/org 或 gitee/org/repo');
        continue;
      }

      // 4. 组装数据
      const labelData = buildLabelData(name, type, platformData);

      // 显示 JSON 格式的数据
      console.log('\n📋 标签数据（JSON 格式）:');
      console.log(JSON.stringify(labelData, null, 2));

      // 5. 询问存储名称
      const storageNameInput = await question('\n请输入存储名称（直接回车使用标签名称）: ');
      const storageName = storageNameInput.trim()
        ? storageNameInput.trim().toLowerCase()
        : name.toLowerCase();

      // 6. 获取存储路径
      let filePath: string;
      if (type === 'Company') {
        filePath = path.join('labeled_data', 'companies', storageName, 'index.yml');
      } else if (type === 'Foundation') {
        filePath = path.join('labeled_data', 'foundations', storageName, 'index.yml');
      } else if (type === 'Project') {
        const inputPath = await question('请输入项目的存储路径（直接回车则使用 projects）: ');
        const storagePath = inputPath.trim()
          ? inputPath.trim().toLowerCase()
          : 'projects';
        filePath = path.join('labeled_data', storagePath, `${storageName}.yml`);
      } else {
        const inputPath = await question('请输入存储路径（直接回车则使用 projects）: ');
        const storagePath = inputPath.trim()
          ? inputPath.trim().toLowerCase()
          : 'projects';
        filePath = path.join('labeled_data', storagePath, `${storageName}.yml`);
      }

      // 7. 确保目录存在并写入文件
      ensureDirectoryExists(filePath);
      const yamlContent = dump(labelData, { noRefs: true, lineWidth: -1 });
      writeFileSync(filePath, yamlContent, 'utf8');

      console.log(`\n✅ 标签已成功保存到: ${filePath}\n`);

      // 8. 如果是 Project 类型且存储在 companies 目录下，更新同目录下的 index.yml
      if (type === 'Project') {
        // 检查文件路径是否在 companies 目录下
        if (filePath.includes(path.join('labeled_data', 'companies'))) {
          // 项目文件在 companies 目录下
          // 构建同目录下的 index.yml 路径
          const companyDir = path.dirname(filePath);
          const companyIndexPath = path.join(companyDir, 'index.yml');

          // 检查 index.yml 是否存在
          if (existsSync(companyIndexPath)) {
            try {
              // projectId 是存储名称（不含扩展名）
              await updateCompanyIndexLabel(companyIndexPath, storageName);
            } catch (error: any) {
              console.error(`❌ 更新公司标签文件时出错: ${error.message}`);
            }
          } else {
            console.log(`ℹ️  未找到公司标签文件: ${companyIndexPath}，跳过更新`);
          }
        }
      }

      // 9. 如果是 Company 类型，询问国家名称并更新国家标签文件
      if (type === 'Company') {
        let alpha2: string | null = null;
        while (true) {
          const countryNameInput = await question('请输入该企业的国家名称（中文，如：中国、美国）: ');
          const countryName = countryNameInput.trim();

          if (!countryName) {
            console.log('❌ 国家名称不能为空，请重新输入。');
            continue;
          }

          // 根据中文名称查找国家代码
          const foundAlpha2 = findCountryByChineseName(countryName, countryData);
          if (!foundAlpha2) {
            console.log(`❌ 无法找到国家名称 "${countryName}" 对应的国家代码。`);
            console.log('请检查输入的国家名称是否正确，然后重新输入。');
            continue;
          }

          // 检查国家标签文件是否存在
          const divisionFilePath = path.join('labeled_data', 'divisions', foundAlpha2, 'index.yml');
          if (!existsSync(divisionFilePath)) {
            console.log(`❌ 无法找到国家代码 "${foundAlpha2}" 对应的标签文件: ${divisionFilePath}`);
            console.log('请检查输入的国家名称是否正确，然后重新输入。');
            continue;
          }

          alpha2 = foundAlpha2;
          break;
        }

        // 构建企业ID（格式: :companies/{storageName}）
        const companyId = `:companies/${storageName}`;

        // 更新国家标签文件
        await updateDivisionLabel(alpha2, companyId);
      }

      console.log('---\n');

    } catch (error: any) {
      console.error('❌ 发生错误:', error.message);
      console.log('---\n');
    }
  }
}

// 启动主循环
main().catch((error) => {
  console.error('❌ 程序错误:', error);
  process.exit(1);
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n\n👋 再见！');
  rl.close();
  process.exit(0);
});


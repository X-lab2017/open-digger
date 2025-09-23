
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { countryInfo } from '../static/countries';

// 定义类型接口
interface Province {
  name: string;
  name_zh: string;
  alias?: string[];
}

interface Country {
  name: string;
  name_zh: string;
  a2: string;
  provinces?: Province[];
}

interface DivisionData {
  name: string;
  name_zh?: string;
  type: string;
  meta?: {
    alpha2: string;
    name_zh?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// 标准化名称用于匹配
function normalizeName(name: string): string {
  return name.toLowerCase()
    .replace(/[^\w\s]/g, '') // 移除特殊字符
    .replace(/\s+/g, ' ')    // 标准化空格
    .trim();
}

// 匹配省份名称
function matchProvince(provinceName: string, provinces: Province[]): Province | null {
  const normalizedProvinceName = normalizeName(provinceName);

  for (const province of provinces) {
    // 直接匹配
    if (normalizeName(province.name) === normalizedProvinceName) {
      return province;
    }

    // 匹配包含关系（处理 "Anhui Sheng" 匹配 "Anhui" 的情况）
    if (normalizeName(province.name).includes(normalizedProvinceName) ||
      normalizedProvinceName.includes(normalizeName(province.name))) {
      return province;
    }

    // 匹配别名
    if (province.alias) {
      for (const alias of province.alias) {
        if (normalizeName(alias) === normalizedProvinceName) {
          return province;
        }
      }
    }
  }

  return null;
}

// 更新 YAML 文件
function updateYamlFile(filePath: string, nameZh: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(content) as DivisionData;

    // 删除 meta 中的 name_zh 字段（如果存在）
    if (data.meta && data.meta.name_zh) {
      delete data.meta.name_zh;
    }

    // 重新构建对象，确保 name_zh 紧跟在 name 之后
    if (data.name && nameZh) {
      const newData: any = {};

      // 按顺序添加字段
      for (const [key, value] of Object.entries(data)) {
        // 跳过原有的 name_zh 字段，我们会在 name 后面重新添加
        if (key === 'name_zh') {
          continue;
        }

        newData[key] = value;

        // 在 name 字段后立即添加 name_zh
        if (key === 'name') {
          newData.name_zh = nameZh;
        }
      }

      // 写回文件
      const yamlContent = yaml.dump(newData, {
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      });

      fs.writeFileSync(filePath, yamlContent, 'utf8');
      console.log(`✓ 更新文件: ${filePath} - 添加 name_zh: ${nameZh}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`✗ 更新文件失败: ${filePath}`, (error as Error).message);
    return false;
  }
}

// 处理国家目录
function processCountryDirectory(countryDir: string, countryData: Country): number {
  const countryPath = path.join(__dirname, '..', '..', 'labeled_data/divisions', countryDir);

  if (!fs.existsSync(countryPath)) {
    return 0;
  }

  const items = fs.readdirSync(countryPath);
  let updatedCount = 0;

  for (const item of items) {
    const itemPath = path.join(countryPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // 递归处理子目录
      continue;
    }

    if (item === 'index.yml') {
      // 处理国家 index.yml 文件
      if (countryData.name_zh) {
        if (updateYamlFile(itemPath, countryData.name_zh)) {
          updatedCount++;
        }
      }
    } else if (item.endsWith('.yml') && item !== 'index.yml') {
      // 处理省份文件
      try {
        // 读取文件内容获取 name 字段
        const fileContent = fs.readFileSync(itemPath, 'utf8');
        const fileData = yaml.load(fileContent) as DivisionData;
        const provinceName = fileData.name;

        if (countryData.provinces && provinceName) {
          // 首先尝试使用 name 字段匹配
          let matchedProvince = matchProvince(provinceName, countryData.provinces);

          // 如果 name 字段没有匹配成功，尝试使用 includes 字段匹配
          if (!matchedProvince && fileData.meta && fileData.meta.includes) {
            for (const includeItem of fileData.meta.includes) {
              if (typeof includeItem === 'string') {
                matchedProvince = matchProvince(includeItem, countryData.provinces);
                if (matchedProvince) {
                  break; // 找到匹配就退出循环
                }
              }
            }
          }

          if (matchedProvince && matchedProvince.name_zh) {
            if (updateYamlFile(itemPath, matchedProvince.name_zh)) {
              updatedCount++;
            }
          }
        }
      } catch (error) {
        console.error(`读取省份文件失败: ${itemPath}`, (error as Error).message);
      }
    }
  }

  return updatedCount;
}

// 主函数
function main(): void {
  try {
    console.log('开始处理国家数据...');
    console.log(`读取到 ${countryInfo.length} 个国家的数据`);

    const divisionsPath = path.join(__dirname, '..', '..', 'labeled_data/divisions');
    const countryDirs = fs.readdirSync(divisionsPath).filter(item => {
      const itemPath = path.join(divisionsPath, item);
      return fs.statSync(itemPath).isDirectory();
    });

    console.log(`找到 ${countryDirs.length} 个国家目录`);

    let totalUpdated = 0;
    let processedCountries = 0;

    for (const countryDir of countryDirs) {
      // 通过 alpha2 匹配国家数据
      const countryData = countryInfo.find(country =>
        country.a2 === countryDir
      ) as Country | undefined;

      if (countryData) {
        console.log(`\n处理国家: ${countryData.name} (${countryData.a2})`);
        const updatedCount = processCountryDirectory(countryDir, countryData);
        totalUpdated += updatedCount;
        processedCountries++;
        console.log(`  更新了 ${updatedCount} 个文件`);
      } else {
        console.log(`\n⚠️  未找到国家数据: ${countryDir}`);
      }
    }

    console.log(`\n=== 处理完成 ===`);
    console.log(`处理了 ${processedCountries} 个国家`);
    console.log(`总共更新了 ${totalUpdated} 个文件`);

  } catch (error) {
    console.error('脚本执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { main };

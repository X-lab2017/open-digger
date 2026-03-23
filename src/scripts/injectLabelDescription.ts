import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { dump, load } from "js-yaml";
import { OpenAI } from "openai";
import getConfig from "../config";
import { query } from "../db/clickhouse";
import { getLabelData } from "../labelDataUtils";

const labelDataDir = path.join(__dirname, "..", "..", "labeled_data");

/** 根据 identifier 获取对应的 yml 文件路径（identifier 去掉首字符即为路径） */
function getYmlFilePath(identifier: string): string | null {
  const pathWithoutColon = identifier.startsWith(":") ? identifier.slice(1) : identifier;
  const directFile = path.join(labelDataDir, pathWithoutColon + ".yml");
  const indexFile = path.join(labelDataDir, pathWithoutColon, "index.yml");
  if (existsSync(directFile)) return directFile;
  if (existsSync(indexFile)) return indexFile;
  return null;
}

/** 将 description 和 description_zh 写入 yml 文件，紧跟在 name/name_zh 后面 */
function writeDescriptionToYml(
  filePath: string,
  description: string,
  description_zh: string
): void {
  const content = readFileSync(filePath, "utf8");
  const data = load(content) as Record<string, unknown>;

  const newData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === "description" || key === "description_zh") {
      continue; // 用新值替换，在 name/name_zh 后插入
    }
    if (key === "name_zh") {
      continue; // 在 name 后统一添加，此处跳过
    }
    newData[key] = value;

    // 在 name 字段后立即添加 name_zh（若有）、description、description_zh
    if (key === "name") {
      if (data.name_zh !== undefined) {
        newData.name_zh = data.name_zh;
      }
      newData.description = description;
      newData.description_zh = description_zh;
    }
  }

  const yamlContent = dump(newData, {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
  writeFileSync(filePath, yamlContent, "utf8");
}

(async () => {
  const config: any = await getConfig();
  const openai = new OpenAI({
    apiKey: config.qwen.token,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  });

  const labelData = getLabelData();

  const forceInject = false;
  const injectLabelTypes = new Set(['Project']);
  for (const label of labelData) {
    if (injectLabelTypes.has(label.type) && (forceInject || (!label.description && !label.description_zh))) {
      const descAndReadme = await query(`SELECT r.repo_id, any(i.description), any(i.readme_text) FROM
(SELECT platform, repo_id, any(repo_name), SUM(openrank) AS o
  FROM global_openrank
  WHERE (platform, repo_id) IN (SELECT platform, entity_id FROM flatten_labels WHERE id='${label.identifier}' AND entity_type='Repo')
    OR (platform, org_id) IN (SELECT platform, entity_id FROM flatten_labels WHERE id='${label.identifier}' AND entity_type='Org')
GROUP BY repo_id, platform
ORDER BY o DESC
LIMIT 1) r,
gh_repo_info i
WHERE r.platform = 'GitHub' AND r.repo_id=i.id
GROUP BY r.repo_id`);
      if (descAndReadme.length > 0) {
        const [_repoId, description, readme] = descAndReadme[0];
        // 调用阿里云通义千问大模型生成项目中英描述
        if (description || readme) {
          try {
            // 传递 description 和 readme，获取中英项目简介
            const prompt = `
你是一个开源项目文档助手。现在有如下开源软件仓库的信息。请你根据下列英文描述和README内容，生成一段简要的中英双语项目描述（不要超过30字），以如下JSON格式返回：
{
  "description": "...",          // 英文简要描述
  "description_zh": "..."        // 对应的中文简要描述
}

Description:
${description || ""}

README:
${readme || ""}
          `.trim();

            const response = await openai.chat.completions.create({
              model: "qwen3-32b",
              enable_thinking: false,
              messages: [{ role: "user", content: prompt }],
            } as any);
            const result = response.choices[0].message.content!;

            // 解析大模型返回结果
            let descObj: { description?: string, description_zh?: string } = {};
            if (typeof result === "string") {
              try {
                descObj = JSON.parse(result);
              } catch {
                // 某些大模型输出可能带前缀/后缀等, 尝试提取JSON
                const match = result.match(/\{[\s\S]*\}/);
                if (match) {
                  descObj = JSON.parse(match[0]);
                }
              }
            } else {
              descObj = result;
            }

            if (descObj.description) label.description = descObj.description;
            if (descObj.description_zh) label.description_zh = descObj.description_zh;

            // 写入对应的 yml 文件
            const ymlPath = getYmlFilePath(label.identifier);
            if (ymlPath && (descObj.description || descObj.description_zh)) {
              writeDescriptionToYml(
                ymlPath,
                descObj.description || "",
                descObj.description_zh || ""
              );
              console.log(`Generated and saved description for ${label.identifier} -> ${ymlPath}`);
            } else {
              console.log(`Generated description for ${label.identifier}:`, descObj);
            }
          } catch (err) {
            console.error(`Failed to get description for ${label.identifier}:`, err);
          }
        }
      }
    }
  }
})();

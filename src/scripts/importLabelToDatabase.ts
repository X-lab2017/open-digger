import { getLabelData } from "../labelDataUtils";
import { query, insertRecords } from "../db/clickhouse";

(async () => {
  const createLabelTable = async () => {
    await query(`DROP TABLE IF EXISTS labels`);
    await query(`CREATE TABLE IF NOT EXISTS labels (
      id String,
      type LowCardinality(String),
      name String,
      name_zh Nullable(String),
      children Array(String),
      platforms Nested(
        name LowCardinality(String),
        type LowCardinality(String),
        orgs Array(UInt64),
        repos Array(UInt64),
        users Array(UInt64),
      ),
      data Nullable(String),
    ) ENGINE = ReplacingMergeTree ORDER BY id`);
  };
  const labelData = getLabelData();
  await createLabelTable();

  const records = labelData.map(label => ({
    id: label.identifier,
    type: label.type,
    name: label.name,
    name_zh: label.name_zh ?? null,
    children: label.children,
    'platforms.name': label.platforms.map(platform => platform.name),
    'platforms.type': label.platforms.map(platform => platform.type),
    'platforms.orgs': label.platforms.map(platform => platform.orgs.map(org => org.id)),
    'platforms.repos': label.platforms.map(platform => platform.repos.map(repo => repo.id)),
    'platforms.users': label.platforms.map(platform => platform.users.map(user => user.id)),
    data: label.meta ? JSON.stringify(label.meta) : null,
  }));

  await insertRecords(records, 'labels');

  const count = await query<number[]>(`SELECT COUNT(*) FROM labels`);
  console.log(`Total labels imported: ${count[0][0]}, total labels: ${labelData.length}`);
})();

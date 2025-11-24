import { query } from "../db/clickhouse";
import { getLabelData } from "../labelDataUtils";

(async () => {
  const labels = getLabelData();
  console.log(`OpenDigger has ${labels.length} labels in total.`);
  console.log(`OpenDigger has ${labels.filter(l => l.type === 'Company').length} Company labels.`);
  console.log(`OpenDigger has ${labels.filter(l => l.type?.startsWith('Tech')).length} Tech labels.`);
  console.log(`OpenDigger has ${labels.filter(l => l.type?.startsWith('Division')).length} Division labels.`);
  console.log(`OpenDigger has ${labels.filter(l => l.type === 'Project').length} Project labels.`);

  for (const l of labels) {
    if (['Company', 'University-0', 'Agency-0', 'Foundation'].includes(l.type)) {
      if (!l.parents.some(p => p.startsWith(':divisions'))) {
        console.log(l.name, l.identifier);
      }
    }
  }

  const count = await query<number[]>(`SELECT COUNT(DISTINCT org_id), COUNT(DISTINCT repo_id) FROM events WHERE
    (platform, repo_id) IN (SELECT platform, entity_id FROM flatten_labels WHERE entity_type = 'Repo')
    OR (platform, org_id) IN (SELECT platform, entity_id FROM flatten_labels WHERE entity_type = 'Org')`);
  console.log(`Orgs covered by labels: ${count[0][0]}, Repos covered by labels: ${count[0][1]}`);

})();

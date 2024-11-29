import { query } from "../db/clickhouse";
import { getLabelData, getPlatformData } from "../label_data_utils";

(async () => {
  const labels = getLabelData();
  console.log(`OpenDigger has ${labels.length} labels in total.`);
  console.log(`OpenDigger has ${labels.filter(l => l.type === 'Company').length} Company labels.`);
  console.log(`OpenDigger has ${labels.filter(l => l.type?.startsWith('Tech')).length} Tech labels.`);
  console.log(`OpenDigger has ${labels.filter(l => l.type?.startsWith('Region')).length} Region labels.`);
  console.log(`OpenDigger has ${labels.filter(l => l.type === 'Project').length} Project labels.`);

  for (const l of labels) {
    if (['Company', 'University-0', 'Agency-0', 'Foundation'].some(t => l.type === t)) {
      if (!l.parents.some(p => p.startsWith(':regions'))) {
        console.log(l.name, l.identifier);
      }
    }
  }

  const labelPlatform = getPlatformData(['Region-0', 'Company', 'Community', 'Project', 'Foundation', 'Tech-0', 'Domain-0', 'Bot']);
  const repoCount = await query<number[]>(`SELECT COUNT(DISTINCT repo_id) FROM events WHERE ${labelPlatform.map(p =>
    `(((repo_id IN (${p.repos.map(r => r.id).join(',')})) OR (org_id IN (${p.orgs.map(r => r.id).join(',')}))) AND platform='${p.name}')`
  ).join(' OR ')}`);
  console.table(`Repos covered by labels: ${repoCount[0][0]}`);

})();

import { getLabelData } from "../label_data_utils";

(async () => {
  const labels = getLabelData();
  console.log(`OpenDigger has ${labels.length} labels in total.`);
  console.log(`OpenDigger has ${labels.filter(l => l.type === 'Company').length} Company labels.`);
  console.log(`OpenDigger has ${labels.filter(l => l.type?.startsWith('Tech')).length} Tech labels.`);
  console.log(`OpenDigger has ${labels.filter(l => l.type?.startsWith('Region')).length} Region labels.`);
  console.log(`OpenDigger has ${labels.filter(l => l.type === 'Project').length} Project labels.`);

  for (const l of labels) {
    if (l.type === 'Company') {
      if (!l.parents.some(p => p.startsWith(':regions'))) {
        console.log(l.name, l.identifier);
      }
    }
  }

})();

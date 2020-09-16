module.exports = async function(data, config) {
  if (!Array.isArray(data)) {
    throw new Error('Invalid data');
  }
  var d = data.map(i => parseInt(i.count));
  var min = Number.MAX_VALUE;
  var max = Number.MIN_VALUE;
  d.forEach(i => {
    if (i > max) max = i;
    if (i < min) min = i;
  });
  d = d.map(i => Math.ceil((i - min) * 10/ (max - min)));
  return `${config.baseUrl}svgrenderer/github/${config.owner}/${config.repo}?path=sqls/working-hour-distribution/image.svg&data=${JSON.stringify(d)}`;
}

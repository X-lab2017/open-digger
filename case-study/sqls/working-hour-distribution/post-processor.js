module.exports = async function(data, config) {
  if (!Array.isArray(data)) {
    throw new Error('Invalid data');
  }
  var min = Number.MAX_VALUE;
  var max = Number.MIN_VALUE;
  data.forEach(i => {
    i.count = parseInt(i.count);
    if (i.count > max) max = i.count;
    if (i.count < min) min = i.count;
  });

  var d = [];
  for (var j = 1; j <= 7; j++) {
    for (var i = 0; i < 24; i++) {
      var row = data.find(item => (item.dayOfWeek == j) && (item.hour == i));
      if (row) {
        // prevent zero for min
        var c = Math.ceil((row.count - min) * 10 / (max - min));
        d.push(Math.max(1, c));
      } else {
        d.push(0);
      }
    }
  }
  
  return `${config.baseUrl}svgrenderer/github/${config.owner}/${config.repo}?path=sqls/working-hour-distribution/image.svg&data=${JSON.stringify(d)}`;
}

module.exports = async function(data) {
  if (!data[0].count || Number.isNaN(parseInt(data[0].count))) {
    throw new Error('Invalid data');
  }
  var toThousands = (num) => {
    return (num || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
  }
  return toThousands(data[0].count);
}

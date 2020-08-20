module.exports = async function(data) {
  if (!data[0].count || Number.isNaN(parseInt(data[0].count))) {
    throw new Error('Invalid data');
  }
  return data[0].count;
}

module.exports = async function(data) {
  if (!Number.isInteger(data[0].count)) {
    throw new Error('Invalid data');
  }
  return data[0].count;
}

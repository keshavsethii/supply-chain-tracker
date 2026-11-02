function parseId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}
function isAddress(a) {
  return typeof a === 'string' && /^0x[a-fA-F0-9]{40}$/.test(a);
}
module.exports = { parseId, isAddress };

const web3 = require('../config/web3');

/** True if `signature` over `message` was produced by `address` (personal_sign). */
function verifySignature(message, signature, address) {
  try {
    const recovered = web3.eth.accounts.recover(message, signature);
    return recovered.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}
module.exports = { verifySignature };

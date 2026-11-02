// Single place where the blockchain connection is created.
// NODE_ENV picks .env.development (Ganache) or .env.production (Sepolia/mainnet).
require('../../scripts/env');
const Web3 = require('web3');

const rpc = process.env.WEB3_PROVIDER;
if (!rpc) {
  console.error('[web3] WEB3_PROVIDER is not set. Check your .env.<NODE_ENV> file.');
  process.exit(1);
}

const web3 = new Web3(new Web3.providers.HttpProvider(rpc));
console.log(`[web3] mode=${process.env.NODE_ENV || 'development'} network=${process.env.NETWORK_NAME || 'unknown'} chainId=${process.env.CHAIN_ID}`);

module.exports = web3;

// Usage: node scripts/deploy.js <development|sepolia|mainnet>
// Deploys RoleManager + SupplyChain and writes the addresses into .env.<mode>.
const fs = require('fs');
const path = require('path');
const target = process.argv[2] || 'development';
process.env.NODE_ENV = target === 'development' ? 'development' : 'production';
const { envFile } = require('./env');
const Web3 = require('web3');
const { compile } = require('./compile');

function setEnvVar(file, key, value) {
  let text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(text)) text = text.replace(re, `${key}=${value}`);
  else text += `${text.endsWith('\n') || !text ? '' : '\n'}${key}=${value}\n`;
  fs.writeFileSync(file, text);
}

async function main() {
  const rpc = process.env.WEB3_PROVIDER;
  if (!rpc) throw new Error(`WEB3_PROVIDER missing in ${envFile}`);

  let web3, deployer;
  if (process.env.DEPLOYER_PRIVATE_KEY) {
    web3 = new Web3(rpc);
    const key = process.env.DEPLOYER_PRIVATE_KEY.startsWith('0x') ? process.env.DEPLOYER_PRIVATE_KEY : '0x' + process.env.DEPLOYER_PRIVATE_KEY;
    const acct = web3.eth.accounts.privateKeyToAccount(key);
    web3.eth.accounts.wallet.add(acct);
    deployer = acct.address;
  } else if (process.env.MNEMONIC) {
    const HDWalletProvider = require('@truffle/hdwallet-provider');
    const provider = new HDWalletProvider({ mnemonic: process.env.MNEMONIC, providerOrUrl: rpc });
    web3 = new Web3(provider);
    deployer = (await web3.eth.getAccounts())[0];
  } else {
    // Ganache with unlocked accounts: use account[0]
    web3 = new Web3(rpc);
    deployer = (await web3.eth.getAccounts())[0];
  }

  const chainId = await web3.eth.getChainId();
  console.log(`Network: ${target} (chainId ${chainId}) | deployer: ${deployer}`);
  if (process.env.CHAIN_ID && Number(process.env.CHAIN_ID) !== chainId) {
    throw new Error(`CHAIN_ID in env (${process.env.CHAIN_ID}) != node chainId (${chainId}). Wrong RPC?`);
  }

  const artifacts = compile();
  const deploy = async (name, args = []) => {
    const a = artifacts[name];
    const contract = new web3.eth.Contract(a.abi);
    const gas = await contract.deploy({ data: a.bytecode, arguments: args }).estimateGas({ from: deployer });
    const inst = await contract.deploy({ data: a.bytecode, arguments: args }).send({ from: deployer, gas: Math.ceil(gas * 1.2) });
    console.log(`${name} deployed at ${inst.options.address}`);
    return inst.options.address;
  };

  const roleManager = await deploy('RoleManager');
  const supplyChain = await deploy('SupplyChain', [roleManager]);

  const file = envFile;
  if (!fs.existsSync(file)) fs.writeFileSync(file, '');
  setEnvVar(file, 'ROLE_MANAGER_ADDRESS', roleManager);
  setEnvVar(file, 'SUPPLY_CHAIN_ADDRESS', supplyChain);
  console.log(`Saved addresses to ${path.basename(file)}`);
  if (web3.currentProvider && web3.currentProvider.engine) web3.currentProvider.engine.stop();
  process.exit(0);
}

main().catch((e) => { console.error(e.message); process.exit(1); });

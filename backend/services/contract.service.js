const path = require('path');
const fs = require('fs');
const web3 = require('../config/web3');

const buildDir = path.join(__dirname, '..', '..', 'build');

function loadArtifact(name) {
  const file = path.join(buildDir, `${name}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`build/${name}.json not found. Run "npm run compile" first.`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function make(name, envKey) {
  const address = process.env[envKey];
  if (!address) {
    throw new Error(`${envKey} is empty. Run "npm run deploy:dev" (or deploy:sepolia) first.`);
  }
  const { abi } = loadArtifact(name);
  return { abi, address, contract: new web3.eth.Contract(abi, address) };
}

const supplyChain = make('SupplyChain', 'SUPPLY_CHAIN_ADDRESS');
const roleManager = make('RoleManager', 'ROLE_MANAGER_ADDRESS');

module.exports = {
  SupplyChainContract: supplyChain.contract,
  RoleManagerContract: roleManager.contract,
  registry: {
    SupplyChain: { abi: supplyChain.abi, address: supplyChain.address },
    RoleManager: { abi: roleManager.abi, address: roleManager.address },
  },
};

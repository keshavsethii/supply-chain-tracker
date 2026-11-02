// Test helpers: in-process Ganache + Web3 + deploy.
const Web3 = require('web3');
const ganache = require('ganache');
const { compile } = require('../scripts/compile');

async function setup() {
  const artifacts = compile();
  const provider = ganache.provider({ logging: { quiet: true }, wallet: { deterministic: true }, chain: { vmErrorsOnRPCResponse: true } });
  const web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();

  async function deploy(name, args = [], from = accounts[0]) {
    const a = artifacts[name];
    const c = new web3.eth.Contract(a.abi);
    return c.deploy({ data: a.bytecode, arguments: args }).send({ from, gas: 6000000 });
  }

  const rm = await deploy('RoleManager');
  const sc = await deploy('SupplyChain', [rm.options.address]);
  return { web3, provider, accounts, rm, sc };
}

async function expectRevert(promise, text) {
  try {
    await promise;
  } catch (e) {
    if (text && !String(e.message).includes(text)) {
      throw new Error(`Expected revert containing "${text}" but got: ${e.message}`);
    }
    return;
  }
  throw new Error(`Expected revert${text ? ` "${text}"` : ''} but call succeeded`);
}

module.exports = { setup, expectRevert };

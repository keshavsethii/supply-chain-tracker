// Assigns roles to wallet addresses. Development: uses Ganache accounts 1-4 automatically.
// Usage:  npm run seed
//         node scripts/seed-roles.js <manufacturer> <distributor> <retailer> <inspector>   (any network)
const { mode } = require('./env');
const Web3 = require('web3');
const path = require('path');

(async () => {
  const web3 = new Web3(process.env.WEB3_PROVIDER);
  const abi = require(path.join(__dirname, '..', 'build', 'RoleManager.json')).abi;
  const rm = new web3.eth.Contract(abi, process.env.ROLE_MANAGER_ADDRESS);
  let addrs = process.argv.slice(2);

  let from;
  if (process.env.DEPLOYER_PRIVATE_KEY) {
    const k = process.env.DEPLOYER_PRIVATE_KEY.startsWith('0x') ? process.env.DEPLOYER_PRIVATE_KEY : '0x' + process.env.DEPLOYER_PRIVATE_KEY;
    from = web3.eth.accounts.wallet.add(web3.eth.accounts.privateKeyToAccount(k)).address;
  } else {
    const accounts = await web3.eth.getAccounts();
    from = accounts[0];
    if (addrs.length === 0) addrs = accounts.slice(1, 5);
  }
  if (addrs.length !== 4) throw new Error('Provide 4 addresses: manufacturer distributor retailer inspector');

  const names = ['Manufacturer', 'Distributor', 'Retailer', 'Inspector'];
  for (let i = 0; i < 4; i++) {
    await rm.methods.assignRole(addrs[i], i + 1).send({ from, gas: 200000 });
    console.log(`${names[i].padEnd(13)} -> ${addrs[i]}`);
  }
  console.log(`Roles assigned on ${mode}.`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });

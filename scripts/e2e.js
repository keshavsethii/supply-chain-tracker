// End-to-end check against a RUNNING Ganache + RUNNING server (npm run ganache, npm run deploy:dev, npm run seed, npm run start:dev).
// Simulates what the browser does: wallet login via signature, then the full product lifecycle.
require('./env');
const Web3 = require('web3');
const path = require('path');
const assert = require('assert');

const API = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
// Well-known private keys of Ganache --wallet.deterministic accounts 1 and 4 (DEV ONLY)
const KEYS = {
  manufacturer: '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
};

const web3 = new Web3(process.env.WEB3_PROVIDER);
const sc = new web3.eth.Contract(require(path.join('..', 'build', 'SupplyChain.json')).abi, process.env.SUPPLY_CHAIN_ADDRESS);

async function api(method, url, body, token) {
  const res = await fetch(API + url, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

(async () => {
  const accounts = await web3.eth.getAccounts();
  const [, mfr, dist, ret, insp] = accounts;
  const G = 500000;

  // 1. Wallet login (nonce -> sign -> token)
  const acct = web3.eth.accounts.privateKeyToAccount(KEYS.manufacturer);
  assert.equal(acct.address, mfr, 'test key must match Ganache account #1');
  const n = await api('POST', '/api/auth/nonce', { address: mfr });
  assert.equal(n.status, 200);
  const sig = acct.sign(n.body.message).signature;
  const login = await api('POST', '/api/auth/login', { address: mfr, signature: sig });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  assert.equal(login.body.role, 'Manufacturer');
  console.log('PASS wallet login ->', login.body.role);

  // 2. Replay protection: same signature must fail the second time
  const replay = await api('POST', '/api/auth/login', { address: mfr, signature: sig });
  assert.equal(replay.status, 401);
  console.log('PASS replayed signature rejected');

  // 3. Bad signature rejected
  const n2 = await api('POST', '/api/auth/nonce', { address: mfr });
  const other = web3.eth.accounts.create().sign(n2.body.message).signature;
  assert.equal((await api('POST', '/api/auth/login', { address: mfr, signature: other })).status, 401);
  console.log('PASS wrong signer rejected');

  // 4. Role guard: manufacturer must NOT reach inspector-only route
  const me = await api('GET', '/api/auth/me', null, login.body.token);
  assert.equal(me.body.role, 'Manufacturer');
  assert.equal((await api('GET', '/api/products/recalled', null, login.body.token)).status, 403);
  assert.equal((await api('GET', '/api/products/recalled')).status, 401);
  console.log('PASS role middleware (401 no token, 403 wrong role)');

  // 5. Full lifecycle on-chain, then verify through the API
  const before = Number((await api('GET', '/api/products/total')).body.total);
  await sc.methods.createProduct('Vaccine Box', 'LOT-77', 'Pharma Plant, Pune', 0).send({ from: mfr, gas: G });
  const id = before + 1;
  await sc.methods.shipProduct(id, 'Hub Delhi', 'Cold chain ok').send({ from: dist, gas: G });
  await sc.methods.receiveAtDistributor(id, 'Warehouse Mumbai', 'Arrived').send({ from: dist, gas: G });
  await sc.methods.receiveAtRetailer(id, 'Store Pune', 'Stocked').send({ from: ret, gas: G });
  await sc.methods.markSold(id, 'Sold').send({ from: ret, gas: G });
  const p = await api('GET', `/api/products/${id}`);
  assert.equal(p.body.statusLabel, 'Sold');
  const cps = await api('GET', `/api/products/${id}/checkpoints`);
  assert.equal(cps.body.length, 5);
  const st = await api('GET', `/api/shipments/${id}/status`);
  assert.equal(st.body.checkpointCount, 5);
  console.log('PASS lifecycle: 5 checkpoints, status Sold');

  // 6. Recall + inspector-only listing
  await sc.methods.createProduct('Juice', 'LOT-78', 'Farm', 0).send({ from: mfr, gas: G });
  await sc.methods.recallProduct(id + 1, 'Contamination').send({ from: insp, gas: G });
  console.log('PASS recall recorded on-chain');

  // 7. Listing + pagination
  const list = await api('GET', '/api/products?limit=1&page=1');
  assert.equal(list.body.items.length, 1);
  assert.equal(list.body.items[0].id, id + 1);
  console.log('PASS listing newest-first');

  // 8. Events were captured by the poller
  await new Promise((r) => setTimeout(r, 4500));
  const ev = await api('GET', '/api/events');
  assert.ok(ev.body.some((e) => e.event === 'ProductRecalled'));
  console.log('PASS event poller captured ProductRecalled');

  console.log('\nALL E2E CHECKS PASSED');
  process.exit(0);
})().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });

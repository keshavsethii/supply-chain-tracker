const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { setup, expectRevert } = require('./helpers');

let ctx, mfr, dist, ret, insp, nobody;
const G = 500000;

before(async () => {
  ctx = await setup();
  const { rm, accounts } = ctx;
  [, mfr, dist, ret, insp, nobody] = accounts;
  await rm.methods.assignRole(mfr, 1).send({ from: accounts[0], gas: 200000 });
  await rm.methods.assignRole(dist, 2).send({ from: accounts[0], gas: 200000 });
  await rm.methods.assignRole(ret, 3).send({ from: accounts[0], gas: 200000 });
  await rm.methods.assignRole(insp, 4).send({ from: accounts[0], gas: 200000 });
});
after(async () => { await ctx.provider.disconnect(); });

test('manufacturer creates a product', async () => {
  const r = await ctx.sc.methods.createProduct('Laptop', 'BATCH-01', 'Factory A', 0).send({ from: mfr, gas: G });
  assert.equal(r.events.ProductCreated.returnValues.productId, '1');
  const p = await ctx.sc.methods.getProduct(1).call();
  assert.equal(p.name, 'Laptop');
  assert.equal(p.status, '0');
  assert.equal(await ctx.sc.methods.getTotalProducts().call(), '1');
});

test('full lifecycle builds a 5-step audit trail', async () => {
  const { sc } = ctx;
  await sc.methods.shipProduct(1, 'Hub-Delhi', 'Picked up').send({ from: dist, gas: G });
  await sc.methods.receiveAtDistributor(1, 'Warehouse-Mumbai', 'Arrived').send({ from: dist, gas: G });
  await sc.methods.receiveAtRetailer(1, 'Store-Pune', 'Stocked').send({ from: ret, gas: G });
  await sc.methods.markSold(1, 'Sold to customer').send({ from: ret, gas: G });
  const cps = await sc.methods.getCheckpoints(1).call();
  assert.equal(cps.length, 5);
  assert.deepEqual(cps.map((c) => c.status), ['0', '1', '2', '3', '4']);
  assert.equal((await sc.methods.getProduct(1).call()).status, '4');
});

test('retailer can receive directly from transit', async () => {
  const { sc } = ctx;
  await sc.methods.createProduct('Milk', 'BATCH-02', 'Dairy', 0).send({ from: mfr, gas: G });
  await sc.methods.shipProduct(2, 'Truck', 'Direct').send({ from: dist, gas: G });
  await sc.methods.receiveAtRetailer(2, 'Store', 'ok').send({ from: ret, gas: G });
  assert.equal((await sc.methods.getProduct(2).call()).status, '3');
});

test('inspector can recall, only once', async () => {
  const { sc } = ctx;
  await sc.methods.recallProduct(2, 'Contamination').send({ from: insp, gas: G });
  assert.equal((await sc.methods.getProduct(2).call()).status, '5');
  await expectRevert(sc.methods.recallProduct(2, 'again').send({ from: insp, gas: G }), 'Already recalled');
});

test('wrong role is rejected', async () => {
  const { sc } = ctx;
  await expectRevert(sc.methods.createProduct('X', 'B', 'O', 0).send({ from: nobody, gas: G }), 'Unauthorized role');
  await expectRevert(sc.methods.createProduct('X', 'B', 'O', 0).send({ from: dist, gas: G }), 'Unauthorized role');
  await expectRevert(sc.methods.shipProduct(1, 'l', 'n').send({ from: ret, gas: G }), 'Unauthorized role');
  await expectRevert(sc.methods.recallProduct(1, 'r').send({ from: mfr, gas: G }), 'Unauthorized role');
});

test('invalid status transitions are rejected', async () => {
  const { sc } = ctx;
  await sc.methods.createProduct('Phone', 'BATCH-03', 'Factory B', 0).send({ from: mfr, gas: G });
  await expectRevert(sc.methods.receiveAtDistributor(3, 'l', 'n').send({ from: dist, gas: G }), 'Must be InTransit');
  await expectRevert(sc.methods.markSold(3, 'n').send({ from: ret, gas: G }), 'Must be at retailer');
  await expectRevert(sc.methods.receiveAtRetailer(3, 'l', 'n').send({ from: ret, gas: G }), 'Invalid prior status');
});

test('nonexistent product and empty inputs are rejected', async () => {
  const { sc } = ctx;
  await expectRevert(sc.methods.getProduct(999).call(), 'Product not found');
  await expectRevert(sc.methods.shipProduct(999, 'l', 'n').send({ from: dist, gas: G }), 'Product not found');
  await expectRevert(sc.methods.createProduct('', 'B', 'O', 0).send({ from: mfr, gas: G }), 'Name required');
  await expectRevert(sc.methods.createProduct('N', '', 'O', 0).send({ from: mfr, gas: G }), 'Batch required');
});

test('events are emitted for checkpoints', async () => {
  const { sc } = ctx;
  const events = await sc.getPastEvents('CheckpointAdded', { fromBlock: 0, toBlock: 'latest' });
  assert.ok(events.length >= 5);
});

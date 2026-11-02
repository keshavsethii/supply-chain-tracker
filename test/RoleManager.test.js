const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { setup, expectRevert } = require('./helpers');

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx.provider.disconnect(); });

test('deployer is admin and Inspector', async () => {
  const { rm, accounts } = ctx;
  assert.equal(await rm.methods.admin().call(), accounts[0]);
  assert.equal(await rm.methods.getRole(accounts[0]).call(), '4');
});

test('admin can assign and revoke roles', async () => {
  const { rm, accounts } = ctx;
  await rm.methods.assignRole(accounts[1], 1).send({ from: accounts[0], gas: 200000 });
  assert.equal(await rm.methods.getRole(accounts[1]).call(), '1');
  assert.equal(await rm.methods.hasRole(accounts[1], 1).call(), true);
  await rm.methods.revokeRole(accounts[1]).send({ from: accounts[0], gas: 200000 });
  assert.equal(await rm.methods.getRole(accounts[1]).call(), '0');
});

test('non-admin cannot assign roles', async () => {
  const { rm, accounts } = ctx;
  await expectRevert(rm.methods.assignRole(accounts[2], 2).send({ from: accounts[3], gas: 200000 }), 'Not admin');
});

test('cannot assign None or zero address', async () => {
  const { rm, accounts } = ctx;
  await expectRevert(rm.methods.assignRole(accounts[2], 0).send({ from: accounts[0], gas: 200000 }), 'Use revokeRole');
  await expectRevert(
    rm.methods.assignRole('0x0000000000000000000000000000000000000000', 1).send({ from: accounts[0], gas: 200000 }),
    'Zero address'
  );
});

test('admin can be transferred', async () => {
  const { rm, accounts } = ctx;
  await rm.methods.transferAdmin(accounts[5]).send({ from: accounts[0], gas: 200000 });
  assert.equal(await rm.methods.admin().call(), accounts[5]);
  await rm.methods.transferAdmin(accounts[0]).send({ from: accounts[5], gas: 200000 });
});

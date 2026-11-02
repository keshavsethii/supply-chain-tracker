// `npm test` -> compile, then run all tests in ./test with Node's built-in runner.
const { spawnSync } = require('child_process');
const path = require('path');
const files = ['RoleManager.test.js', 'SupplyChain.test.js'].map((f) => path.join(__dirname, '..', 'test', f));
const r = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(r.status);

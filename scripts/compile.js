// Compiles ./contracts with solc-js and writes ABI + bytecode to ./build/<Name>.json
const fs = require('fs');
const path = require('path');
const solc = require('solc');

const root = path.join(__dirname, '..');
const contractsDir = path.join(root, 'contracts');
const buildDir = path.join(root, 'build');

function compile() {
  const sources = {};
  for (const f of fs.readdirSync(contractsDir).filter((x) => x.endsWith('.sol'))) {
    sources[f] = { content: fs.readFileSync(path.join(contractsDir, f), 'utf8') };
  }
  const input = {
    language: 'Solidity',
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  };
  const out = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (out.errors || []);
  errors.filter((e) => e.severity === 'warning').forEach((w) => console.warn(w.formattedMessage));
  const fatal = errors.filter((e) => e.severity === 'error');
  if (fatal.length) {
    fatal.forEach((e) => console.error(e.formattedMessage));
    throw new Error('Solidity compilation failed');
  }
  fs.mkdirSync(buildDir, { recursive: true });
  const result = {};
  for (const file of Object.keys(out.contracts)) {
    for (const name of Object.keys(out.contracts[file])) {
      const c = out.contracts[file][name];
      const artifact = { contractName: name, abi: c.abi, bytecode: '0x' + c.evm.bytecode.object };
      fs.writeFileSync(path.join(buildDir, `${name}.json`), JSON.stringify(artifact, null, 2));
      result[name] = artifact;
    }
  }
  return result;
}

module.exports = { compile };

if (require.main === module) {
  const r = compile();
  console.log('Compiled:', Object.keys(r).join(', '));
}

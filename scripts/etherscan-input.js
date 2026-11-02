// Writes build/standard-input.json for Etherscan "Solidity (Standard-Json-Input)" verification.
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'contracts');
const sources = {};
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sol'))) sources[f] = { content: fs.readFileSync(path.join(dir, f), 'utf8') };
const input = { language: 'Solidity', sources, settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode'] } } } };
fs.mkdirSync(path.join(__dirname, '..', 'build'), { recursive: true });
const out = path.join(__dirname, '..', 'build', 'standard-input.json');
fs.writeFileSync(out, JSON.stringify(input, null, 2));
console.log('Wrote', out, '\nCompiler: v0.8.20+commit.a1b79de6 | Optimization: Yes, 200 runs | License: MIT');

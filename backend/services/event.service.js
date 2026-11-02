// Web3 1.x cannot subscribe to events over HTTP, so we poll getPastEvents.
// Keeps the last 200 events in memory for /api/events and logs them to the console.
const web3 = require('../config/web3');
const { SupplyChainContract } = require('./contract.service');

const MAX = 200;
const recent = [];
let lastBlock = null;
let timer = null;

function stripNumeric(obj) {
  const out = {};
  for (const k of Object.keys(obj)) if (!/^\d+$/.test(k)) out[k] = obj[k];
  return out;
}

async function poll() {
  try {
    const latest = await web3.eth.getBlockNumber();
    if (lastBlock === null) lastBlock = Math.max(latest - 1000, 0);
    if (latest < lastBlock) { lastBlock = latest; return; }
    const events = await SupplyChainContract.getPastEvents('allEvents', { fromBlock: lastBlock + 1, toBlock: latest });
    for (const ev of events) {
      const entry = { event: ev.event, block: ev.blockNumber, tx: ev.transactionHash, data: stripNumeric(ev.returnValues) };
      recent.unshift(entry);
      console.log(`[event] ${ev.event}`, entry.data);
    }
    if (recent.length > MAX) recent.length = MAX;
    lastBlock = latest;
  } catch (e) {
    console.error('[event] poll failed:', e.message);
  }
}

function startEventListeners(intervalMs = 4000) {
  if (timer) return;
  poll();
  timer = setInterval(poll, intervalMs);
  timer.unref();
}

module.exports = { startEventListeners, getRecentEvents: () => recent };

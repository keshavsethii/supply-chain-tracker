// Writes (create/ship/receive/sell/recall) are signed in the user's MetaMask on the frontend.
// The backend only exposes read-only views of shipment state.
const { SupplyChainContract } = require('../services/contract.service');
const fmt = require('../utils/format');
const { parseId } = require('../utils/validate');

const NEXT = {
  0: ['Distributor: shipProduct', 'Inspector: recallProduct'],
  1: ['Distributor: receiveAtDistributor', 'Retailer: receiveAtRetailer', 'Inspector: recallProduct'],
  2: ['Distributor: shipProduct', 'Retailer: receiveAtRetailer', 'Inspector: recallProduct'],
  3: ['Retailer: markSold', 'Inspector: recallProduct'],
  4: ['Inspector: recallProduct'],
  5: [],
};

exports.getStatus = async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid product id' });
  try {
    const p = fmt.product(await SupplyChainContract.methods.getProduct(id).call());
    const count = Number(await SupplyChainContract.methods.getCheckpointCount(id).call());
    res.json({ id: p.id, status: p.status, statusLabel: p.statusLabel, checkpointCount: count, allowedNextActions: NEXT[p.status] });
  } catch (e) {
    if (String(e.message).includes('Product not found')) return res.status(404).json({ error: 'Product not found' });
    next(e);
  }
};

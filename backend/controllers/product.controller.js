const { SupplyChainContract } = require('../services/contract.service');
const fmt = require('../utils/format');
const { parseId } = require('../utils/validate');

exports.getTotal = async (_req, res, next) => {
  try {
    res.json({ total: Number(await SupplyChainContract.methods.getTotalProducts().call()) });
  } catch (e) { next(e); }
};

exports.list = async (req, res, next) => {
  try {
    const total = Number(await SupplyChainContract.methods.getTotalProducts().call());
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    // newest first
    const start = total - (page - 1) * limit;
    const ids = [];
    for (let id = start; id > Math.max(start - limit, 0); id--) ids.push(id);
    const items = await Promise.all(ids.map((id) => SupplyChainContract.methods.getProduct(id).call().then(fmt.product)));
    res.json({ total, page, limit, items });
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid product id' });
  try {
    const p = await SupplyChainContract.methods.getProduct(id).call();
    res.json(fmt.product(p));
  } catch (e) {
    if (String(e.message).includes('Product not found')) return res.status(404).json({ error: 'Product not found' });
    next(e);
  }
};

exports.getCheckpoints = async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid product id' });
  try {
    const cps = await SupplyChainContract.methods.getCheckpoints(id).call();
    res.json(cps.map(fmt.checkpoint));
  } catch (e) {
    if (String(e.message).includes('Product not found')) return res.status(404).json({ error: 'Product not found' });
    next(e);
  }
};

// Inspector-only: all recalled products
exports.recalled = async (_req, res, next) => {
  try {
    const total = Number(await SupplyChainContract.methods.getTotalProducts().call());
    const ids = Array.from({ length: total }, (_, i) => i + 1);
    const all = await Promise.all(ids.map((id) => SupplyChainContract.methods.getProduct(id).call().then(fmt.product)));
    res.json(all.filter((p) => p.status === 5));
  } catch (e) { next(e); }
};

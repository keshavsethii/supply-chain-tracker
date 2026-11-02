const authService = require('../services/auth.service');
const { RoleManagerContract } = require('../services/contract.service');
const { ROLES } = require('../utils/format');
const { isAddress } = require('../utils/validate');

exports.nonce = (req, res) => {
  const { address } = req.body || {};
  if (!isAddress(address)) return res.status(400).json({ error: 'Valid wallet address required' });
  res.json({ message: authService.createChallenge(address) });
};

exports.login = async (req, res, next) => {
  try {
    const { address, signature } = req.body || {};
    if (!isAddress(address) || typeof signature !== 'string') return res.status(400).json({ error: 'address and signature required' });
    const result = authService.login(address, signature);
    if (!result) return res.status(401).json({ error: 'Invalid or expired signature. Request a new challenge.' });
    const role = ROLES[Number(await RoleManagerContract.methods.getRole(address).call())];
    res.json({ ...result, address, role });
  } catch (e) { next(e); }
};

exports.me = async (req, res, next) => {
  try {
    const role = ROLES[Number(await RoleManagerContract.methods.getRole(req.address).call())];
    res.json({ address: req.address, role });
  } catch (e) { next(e); }
};

exports.logout = (req, res) => { authService.logout(req.token); res.json({ ok: true }); };

// Public role lookup used by the UI to pick the right dashboard
exports.roleOf = async (req, res, next) => {
  try {
    const { address } = req.params;
    if (!isAddress(address)) return res.status(400).json({ error: 'Invalid address' });
    const idx = Number(await RoleManagerContract.methods.getRole(address).call());
    const admin = await RoleManagerContract.methods.admin().call();
    res.json({ address, role: ROLES[idx], isAdmin: admin.toLowerCase() === address.toLowerCase() });
  } catch (e) { next(e); }
};

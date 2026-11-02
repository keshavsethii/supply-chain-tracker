// Usage: router.get('/x', auth, requireRole('Inspector'), handler)
const { RoleManagerContract } = require('../services/contract.service');
const { ROLES } = require('../utils/format');

module.exports = function requireRole(...allowed) {
  return async (req, res, next) => {
    try {
      const idx = Number(await RoleManagerContract.methods.getRole(req.address).call());
      req.role = ROLES[idx];
      if (!allowed.includes(req.role)) {
        return res.status(403).json({ error: `Requires role: ${allowed.join(' or ')}. You are: ${req.role}` });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
};

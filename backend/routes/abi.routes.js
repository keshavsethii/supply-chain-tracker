const router = require('express').Router();
const { registry } = require('../services/contract.service');

router.get('/:contract', (req, res) => {
  const entry = registry[req.params.contract];
  if (!entry) return res.status(404).json({ error: 'Unknown contract' });
  res.json(entry);
});

module.exports = router;

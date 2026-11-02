const router = require('express').Router();
const c = require('../controllers/product.controller');
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

router.get('/', c.list);
router.get('/total', c.getTotal);
router.get('/recalled', auth, requireRole('Inspector'), c.recalled);
router.get('/:id', c.getOne);
router.get('/:id/checkpoints', c.getCheckpoints);

module.exports = router;

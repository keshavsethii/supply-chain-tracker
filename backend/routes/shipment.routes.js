const router = require('express').Router();
const c = require('../controllers/shipment.controller');

router.get('/:id/status', c.getStatus);

module.exports = router;

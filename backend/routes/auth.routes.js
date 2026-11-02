const router = require('express').Router();
const c = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');

router.post('/nonce', c.nonce);
router.post('/login', c.login);
router.get('/me', auth, c.me);
router.post('/logout', auth, c.logout);
router.get('/role/:address', c.roleOf);

module.exports = router;

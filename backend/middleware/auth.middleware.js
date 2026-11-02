const { getSession } = require('../services/auth.service');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const session = token && getSession(token);
  if (!session) return res.status(401).json({ error: 'Not authenticated. Sign in with your wallet.' });
  req.token = token;
  req.address = session.address;
  next();
};

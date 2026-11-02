require('../scripts/env');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const web3 = require('./config/web3');
const { registry } = require('./services/contract.service');
const { startEventListeners, getRecentEvents } = require('./services/event.service');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'views'));
if (isProd) app.set('trust proxy', 1); // behind Render/Railway/nginx

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
}));

const allowed = [process.env.CORS_ORIGIN].filter(Boolean);
app.use(cors(isProd ? { origin: allowed.length ? allowed : false } : {}));
app.use(express.json({ limit: '10kb' }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false }));

// Static frontend + local Web3 bundle (no CDN needed, works with strict CSP)
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));
app.use('/vendor', express.static(path.join(__dirname, '..', 'node_modules', 'web3', 'dist')));

// API
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/shipments', require('./routes/shipment.routes'));
app.use('/api/abi', require('./routes/abi.routes'));

app.get('/api/config', (_req, res) => {
  res.json({
    chainId: Number(process.env.CHAIN_ID),
    networkName: process.env.NETWORK_NAME || 'Unknown',
    rpcUrl: isProd ? undefined : process.env.WEB3_PROVIDER, // only exposed in dev for MetaMask "add network"
    contracts: { SupplyChain: registry.SupplyChain.address, RoleManager: registry.RoleManager.address },
    mode: process.env.NODE_ENV || 'development',
  });
});
app.get('/api/events', (_req, res) => res.json(getRecentEvents()));
app.get('/api/health', async (_req, res) => {
  try {
    const block = await web3.eth.getBlockNumber();
    res.json({ ok: true, block });
  } catch (e) {
    res.status(503).json({ ok: false, error: e.message });
  }
});

// Pages
app.get('/', (_req, res) => res.render('index', { page: 'home' }));
app.get('/dashboard', (_req, res) => res.render('dashboard', { page: 'dashboard' }));
app.get('/track', (_req, res) => res.render('track', { page: 'track' }));

// Errors
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
});

app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}  mode=${process.env.NODE_ENV || 'development'}`);
  startEventListeners();
});

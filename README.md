# Supply Chain Tracker

A blockchain supply chain tracker. Manufacturers, distributors, retailers and inspectors record each step of a
product's journey on Ethereum. Anyone can look up the full, tamper-proof history.

**Stack:** Solidity 0.8.20 | Node.js + Express | Web3.js 1.x | MetaMask | Ganache (dev) | Sepolia (prod)

```
User -> Browser (EJS pages + Web3.js) -> MetaMask -> Ethereum network -> RoleManager + SupplyChain contracts
                     \-> Node.js/Express API (read-only, wallet-signature login) -> same network
```

## Roles
| Role | Can do |
|---|---|
| Manufacturer | `createProduct` |
| Distributor | `shipProduct`, `receiveAtDistributor` |
| Retailer | `receiveAtRetailer`, `markSold` |
| Inspector | `recallProduct` (any stage) |
| Admin (deployer) | assign / revoke roles, transfer admin |
| Anyone | read products and full history |

Status flow: `Created -> In Transit -> At Distributor -> At Retailer -> Sold` (`Recalled` possible at any stage).

## Quick start (development)
Requires Node.js 20+ and the MetaMask browser extension.

```bash
npm install
cp .env.example .env.development     # then set NETWORK_NAME / keep defaults for Ganache
npm run ganache                      # terminal 1 (leave running)
npm run deploy:dev                   # terminal 2: compile + deploy, writes contract addresses into .env.development
npm run seed                         # gives roles to Ganache accounts 1-4
npm run start:dev                    # open http://localhost:3000
```
Then import the Ganache accounts into MetaMask. See `docs/GITHUB-GUIDE.md`, section "Run it locally".

| Command | What it does |
|---|---|
| `npm test` | 13 contract tests on an in-process Ganache |
| `npm run e2e` | API end-to-end test (needs ganache + server running) |
| `npm run compile` | Compile contracts to `build/` |
| `npm run deploy:dev` / `deploy:sepolia` | Deploy and save addresses to the matching env file |
| `npm run seed` | Assign roles (Ganache accounts 1-4, or pass 4 addresses) |
| `npm run start:dev` / `start:prod` | Start the server against Ganache / the production network |

## Project layout
```
contracts/    RoleManager.sol, SupplyChain.sol
scripts/      compile, deploy, seed-roles, e2e, etherscan-input
test/         contract tests (node:test + Ganache)
backend/      Express API: config, routes, controllers, middleware, services, utils
frontend/     EJS views + public JS/CSS (no inline scripts, strict CSP)
docs/         TESTING.md, DEPLOY.md, GITHUB-GUIDE.md, sct-tasks.md (phased plan)
```

## API (read-only; all writes happen in MetaMask)
`GET /api/products` | `/api/products/total` | `/api/products/:id` | `/api/products/:id/checkpoints` | `/api/shipments/:id/status` |
`GET /api/products/recalled` (Inspector token) | `POST /api/auth/nonce` + `/api/auth/login` | `GET /api/auth/me` |
`GET /api/auth/role/:address` | `GET /api/abi/:contract` | `GET /api/config` | `GET /api/events` | `GET /api/health`

## Docs
Testing: `docs/TESTING.md` | Deploy to Sepolia and hosting: `docs/DEPLOY.md` | Security: `SECURITY.md`

## Note on tooling
Truffle was sunset by ConsenSys in 2023, so this project compiles with `solc-js` and deploys with plain Web3 scripts.
Ganache is still used for development, exactly as planned.

License: MIT

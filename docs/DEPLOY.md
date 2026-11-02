# Deployment: Sepolia testnet and hosting

## A. Deploy contracts to Sepolia (manual steps marked MANUAL)
1. MANUAL: create an Infura or Alchemy account, create a project, copy the **Sepolia** HTTPS URL.
2. MANUAL: in MetaMask create a **new** account just for deploying. Export its private key.
   Never use a wallet that holds real money.
3. MANUAL: get free Sepolia ETH for that account from a faucet (search "Sepolia faucet"; Alchemy and Google Cloud offer one).
4. `cp .env.production.example .env.production` and fill `WEB3_PROVIDER` and `DEPLOYER_PRIVATE_KEY`.
5. Deploy: `npm run deploy:sepolia` (addresses are written into `.env.production`).
6. Assign roles to your real test wallets (the deployer is the admin):
   `NODE_ENV=production node scripts/seed-roles.js <manufacturer> <distributor> <retailer> <inspector>`
   or use the Admin panel on the Dashboard while connected as the deployer.
7. Run in production mode locally: `npm run start:prod`, switch MetaMask to Sepolia, repeat the manual test list.

## B. Verify on Etherscan (optional, makes the code public and readable)
1. `npm run etherscan-input` creates `build/standard-input.json`.
2. MANUAL: open sepolia.etherscan.io, find your contract address, Contract tab, Verify and Publish.
3. Choose "Solidity (Standard-Json-Input)", compiler `v0.8.20`, upload `build/standard-input.json`.
4. SupplyChain needs its constructor argument: the RoleManager address, padded to 64 hex characters (Etherscan usually fills this).

## C. Host the backend (example: Render)
The `build/` folder is not in git, so the host must compile on every deploy.
- Build command: `npm install && npm run compile`
- Start command: `npm run start:prod`
- Environment variables: everything from `.env.production.example` (set `NODE_ENV=production`, `WEB3_PROVIDER`, `CHAIN_ID=11155111`,
  `NETWORK_NAME`, `SUPPLY_CHAIN_ADDRESS`, `ROLE_MANAGER_ADDRESS`, `CORS_ORIGIN`). The server does not need a private key.
- Run **one** instance only: login sessions are kept in memory (see SECURITY.md).

## D. Switching dev <-> prod
| | Development | Production |
|---|---|---|
| Node | Ganache `http://127.0.0.1:7545` | Infura/Alchemy RPC |
| Chain id | 1337 | 11155111 (Sepolia) / 1 (mainnet) |
| Env file | `.env.development` | `.env.production` or host variables |
| Deploy | `npm run deploy:dev` | `npm run deploy:sepolia` |
| Start | `npm run start:dev` | `npm run start:prod` |
| MetaMask | Ganache network (auto-added by the site) | Sepolia (built in) |

Nothing in the code changes. Only `NODE_ENV` and the env file differ.

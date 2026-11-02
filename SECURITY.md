# Security notes

## Already built in
- Wallet login uses a one-time server nonce, expires in 5 minutes, and cannot be replayed.
- Sessions expire after 1 hour. Role checks read the **blockchain** on every protected call (no stale roles).
- `helmet` with a strict Content-Security-Policy (no inline scripts, no CDN; Web3 is served locally).
- Rate limit: 120 API requests per minute per IP. JSON body limit 10 KB. CORS locked down in production.
- Frontend renders on-chain text with `textContent` only (no XSS from malicious product names).
- The server never holds a private key. All writes are signed in the user's MetaMask.
- Contracts: role-gated functions, status-order checks, input checks, no ether handling, no external calls.

## Known limits (be honest about these in your report)
- Sessions and nonces are in memory: restart = everyone logs in again; do not run multiple instances without Redis.
- The contracts are not audited. Run `slither .` (pip install slither-analyzer) before any mainnet deploy.
- Data is public on-chain. Do not store personal or confidential data in product fields.
- A single admin address controls roles. For real use, make it a multisig (e.g. Safe) with `transferAdmin`.
- Contracts cannot be edited after deploy. A change means redeploying and a new address.
- The deterministic Ganache keys in the docs are public. Never send real funds to those addresses.

## Before mainnet
1. Independent review or audit. 2. Admin moved to a multisig. 3. Gas price checked. 4. Deploy to Sepolia first and repeat all tests.

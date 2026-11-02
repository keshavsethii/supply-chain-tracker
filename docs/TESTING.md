# Testing

## 1. Contract tests (automatic, no setup)
```bash
npm test
```
Starts an in-process Ganache, deploys both contracts and runs 13 tests (roles, full lifecycle, recall,
wrong role, wrong status order, empty input, nonexistent product).

## 2. API end-to-end test (needs Ganache + server running)
```bash
npm run ganache        # terminal 1
npm run deploy:dev     # terminal 2 (writes addresses into .env.development)
npm run seed           # assigns roles to Ganache accounts 1-4
npm run start:dev      # terminal 3
npm run e2e            # terminal 2 again
```
Checks: wallet login by signature, replay protection, wrong signer rejected, 401/403 role guard,
full 5-step lifecycle, recall, pagination, event poller.

## 3. Manual browser test (Phase 6 checklist)
Import Ganache accounts into MetaMask (see GITHUB-GUIDE.md), then:
- [ ] Account 1 (Manufacturer): create a product. Toast shows the new ID.
- [ ] Account 2 (Distributor): ship, then receive at warehouse.
- [ ] Account 3 (Retailer): receive at store, then mark sold.
- [ ] Open `/track?id=1` logged out: 5 checkpoints with correct addresses and times.
- [ ] Account 4 (Inspector): recall another product; `/track` shows the red recall alert.
- [ ] Wrong role: Distributor tries to create a product -> "Blocked by contract: Unauthorized role".
- [ ] Wrong order: Retailer marks a Created product sold -> "Must be at retailer".
- [ ] Reject a MetaMask popup -> friendly message, no crash.
- [ ] Switch MetaMask account -> page reloads with the new role.
- [ ] Stop Ganache -> banner "Cannot reach the blockchain node".

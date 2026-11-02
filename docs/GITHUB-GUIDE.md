# Your manual steps (GitHub + running the project)

Things only you can do are marked **MANUAL**. Everything else is already in the repo.

## 0. Prerequisites (MANUAL, once)
- Node.js 20 or newer (`node -v`), Git (`git --version`), a GitHub account, the MetaMask browser extension.

## 1. Set up the folder (MANUAL)
```bash
unzip supply-chain-tracker.zip
cd supply-chain-tracker
npm install
```
The zip already contains the git history: one commit per phase.

## 2. Put your own name on the commits (MANUAL)
The commits were made with a placeholder author ("SCT Builder"). Replace it with you:
```bash
git config user.name  "Your Name"
git config user.email "your-github-email@example.com"
git rebase -r --root --exec "git commit --amend --reset-author --no-edit"
git log --format="%h %an %s"
```
Use the email linked to your GitHub account so the commits count on your profile.

## 3. Create the GitHub repository (MANUAL)
1. github.com -> New repository -> name `supply-chain-tracker`.
2. Leave **all** boxes unticked (no README, no .gitignore, no license). The repo must be empty.
3. Copy the repository URL.

## 4. Push phase by phase (MANUAL)
Sign-in: use a Personal Access Token as the password (GitHub -> Settings -> Developer settings -> Fine-grained tokens, repo
permission "Contents: read and write"), or run `gh auth login` if you have the GitHub CLI.

```bash
git remote add origin https://github.com/<your-username>/supply-chain-tracker.git
git log --oneline --reverse        # shows the 9 phase commits
```
Push one phase at a time so the history appears "side by side" with your progress. Replace `<hash>` with the commit id from the log:
```bash
git push -u origin <hash-of-phase-1>:refs/heads/main
git push origin <hash-of-phase-2>:main
git push origin <hash-of-phase-3>:main
# ... continue through phase 8
git push origin main               # final push, adds Phase 9 (docs)
```
Or push everything at once: `git push -u origin main`.

After the first push, the **Actions** tab will start running CI (compile + tests) on every push. A green tick means tests pass.
For your own future work use the normal cycle: `git add -A`, `git commit -m "Phase N: ..."`, `git push`.

## 5. Optional polish (MANUAL)
- Repo -> About -> add description and topics: `blockchain`, `supply-chain`, `solidity`, `nodejs`, `ethereum`.
- Add screenshots to the README (Home, Dashboard, Track timeline) once you have run it.
- Tag the release: `git tag -a v1.0.0 -m "First release" && git push origin v1.0.0`.
- Never commit `.env.*` files. They are already in `.gitignore`. If you ever push a private key by mistake, treat it as stolen.

## 6. Run it locally (MANUAL, browser part)
```bash
cp .env.example .env.development
npm run ganache          # terminal 1
npm run deploy:dev       # terminal 2
npm run seed
npm run start:dev        # open http://localhost:3000
```
Import these Ganache accounts in MetaMask (Account menu -> Import account -> paste private key):

| Role | Address | Private key |
|---|---|---|
| Admin (also Inspector) | 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 | 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d |
| Manufacturer | 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0 | 0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1 |
| Distributor | 0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b | 0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c |
| Retailer | 0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d | 0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913 |
| Inspector | 0xd03ea8624C8C5987235048901fB614fDcA89b117 | 0xadd53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743 |

These keys are public (every Ganache `--wallet.deterministic` user has them). Use them on Ganache only, never on a real network.
The site adds the Ganache network to MetaMask for you (chain id 1337). If you restart Ganache, run `npm run deploy:dev` and `npm run seed` again,
and in MetaMask use Settings -> Advanced -> "Clear activity tab data" (otherwise MetaMask may complain about nonces).

Then follow the checklist in `docs/TESTING.md`.

## 7. Go to Sepolia and host it (MANUAL)
Follow `docs/DEPLOY.md`. You need an Infura/Alchemy account, a fresh wallet with free Sepolia ETH, and optionally a host such as Render.

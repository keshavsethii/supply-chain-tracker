// Shared frontend logic: config, MetaMask connection, network check, wallet login, tx helper.
// SECURITY: all on-chain text (names, notes...) is user-supplied. Always render with textContent, never innerHTML.
(function () {
  const STATUS = ['Created', 'In Transit', 'At Distributor', 'At Retailer', 'Sold', 'Recalled'];
  const state = { cfg: null, web3: null, address: null, role: 'None', isAdmin: false, token: null, contracts: {} };

  const $ = (id) => document.getElementById(id);

  function toast(msg, type) {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'toast ' + (type || '');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.add('hidden'), type === 'err' ? 9000 : 5000);
  }

  function banner(msg, isErr) {
    const b = $('banner');
    if (!msg) { b.classList.add('hidden'); return; }
    b.textContent = msg;
    b.className = 'banner' + (isErr ? ' err' : '');
  }

  async function api(path, opts = {}) {
    const headers = { 'content-type': 'application/json' };
    if (state.token) headers.authorization = 'Bearer ' + state.token;
    const res = await fetch(path, { ...opts, headers: { ...headers, ...(opts.headers || {}) } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'Request failed (' + res.status + ')');
    return body;
  }

  async function loadConfig() {
    if (!state.cfg) state.cfg = await api('/api/config');
    const nb = $('netBadge');
    if (nb) nb.textContent = state.cfg.networkName + ' (' + state.cfg.chainId + ')';
    return state.cfg;
  }

  function parseError(e) {
    if (!e) return 'Unknown error';
    if (e.code === 4001 || /user (rejected|denied)/i.test(e.message || '')) return 'You rejected the request in MetaMask.';
    const msg = (e.message || String(e));
    const m = msg.match(/(?:revert(?:ed)?:?|reason string:?)\s*['"]?([^'"\n{}]+)/i);
    if (m && m[1].trim()) return 'Blocked by contract: ' + m[1].trim();
    return msg.length > 220 ? msg.slice(0, 220) + '...' : msg;
  }

  async function ensureNetwork() {
    const want = '0x' + state.cfg.chainId.toString(16);
    const cur = await window.ethereum.request({ method: 'eth_chainId' });
    if (cur.toLowerCase() === want) return true;
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: want }] });
    } catch (e) {
      if ((e.code === 4902 || e.code === -32603) && state.cfg.rpcUrl) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{ chainId: want, chainName: state.cfg.networkName, rpcUrls: [state.cfg.rpcUrl], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } }],
        });
      } else throw e;
    }
    return true;
  }

  async function loadContracts() {
    for (const name of ['SupplyChain', 'RoleManager']) {
      const { abi, address } = await api('/api/abi/' + name);
      state.contracts[name] = new state.web3.eth.Contract(abi, address);
    }
  }

  async function refreshRole() {
    const r = await api('/api/auth/role/' + state.address);
    state.role = r.role;
    state.isAdmin = r.isAdmin;
    const rb = $('roleBadge');
    if (rb) {
      rb.textContent = r.role + (r.isAdmin ? ' + Admin' : '');
      rb.className = 'badge role';
    }
  }

  // Wallet login: server issues a one-time nonce, user signs it (free, no gas).
  async function signIn() {
    const { message } = await api('/api/auth/nonce', { method: 'POST', body: JSON.stringify({ address: state.address }) });
    const signature = await state.web3.eth.personal.sign(message, state.address, '');
    const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ address: state.address, signature }) });
    state.token = r.token;
    sessionStorage.setItem('sct_token', r.token);
    sessionStorage.setItem('sct_addr', state.address);
  }

  async function connect(opts = {}) {
    await loadConfig();
    if (!window.ethereum) {
      banner('MetaMask not found. Install the MetaMask extension to use this page.', true);
      throw new Error('MetaMask not installed');
    }
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    await ensureNetwork();
    state.web3 = new Web3(window.ethereum);
    state.address = (await state.web3.eth.getAccounts())[0];
    const saved = sessionStorage.getItem('sct_token');
    state.token = sessionStorage.getItem('sct_addr') === state.address ? saved : null;
    await loadContracts();
    await refreshRole();
    if (opts.signIn && !state.token) await signIn();
    const btn = $('connectBtn');
    if (btn) { btn.textContent = state.address.slice(0, 6) + '...' + state.address.slice(-4); btn.disabled = true; }
    banner('');
    return state;
  }

  // Sends a state-changing transaction. Pre-flights with estimateGas so reverts show a clear reason.
  async function sendTx(method, label) {
    try {
      toast('Confirm "' + label + '" in MetaMask...');
      await method.estimateGas({ from: state.address });
      const receipt = await method.send({ from: state.address });
      toast(label + ' confirmed in block ' + receipt.blockNumber, 'ok');
      return receipt;
    } catch (e) {
      toast(parseError(e), 'err');
      throw e;
    }
  }

  function watchWallet() {
    if (!window.ethereum) return;
    window.ethereum.on('accountsChanged', () => { sessionStorage.clear(); location.reload(); });
    window.ethereum.on('chainChanged', () => location.reload());
  }

  const fmtDate = (ts) => (!ts || Number(ts) === 0 ? 'None' : new Date(Number(ts) * 1000).toLocaleString());

  function el(tag, props, text) {
    const n = document.createElement(tag);
    if (props) Object.assign(n, props);
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function statusBadge(status, label) {
    return el('span', { className: 'badge s' + status }, label || STATUS[status]);
  }

  window.SCT = { STATUS, state, $, api, toast, banner, loadConfig, connect, sendTx, parseError, fmtDate, el, statusBadge, watchWallet };
  watchWallet();
  loadConfig().catch(() => {});
})();

(function () {
  const { $, el, connect, sendTx, state, toast, parseError, api, statusBadge } = SCT;

  // Which actions each role gets, and whether the action needs a location field
  const ACTIONS = {
    Distributor: [
      { value: 'ship', label: 'Ship product (mark In Transit)', loc: true },
      { value: 'receiveDist', label: 'Receive at distributor warehouse', loc: true },
    ],
    Retailer: [
      { value: 'receiveRet', label: 'Receive at retail store', loc: true },
      { value: 'sold', label: 'Mark as sold', loc: false },
    ],
    Inspector: [{ value: 'recall', label: 'Recall product', loc: false }],
  };

  const HINTS = {
    Distributor: 'Created/At Distributor -> ship. In Transit -> receive at warehouse.',
    Retailer: 'In Transit or At Distributor -> receive at store. At Retailer -> mark sold.',
    Inspector: 'Recall works at any stage. Give a clear reason in the notes field.',
  };

  async function start() {
    try {
      await connect({ signIn: true });
    } catch (e) {
      if (e.message !== 'MetaMask not installed') toast(parseError(e), 'err');
      return;
    }
    $('gate').classList.add('hidden');
    $('panel').classList.remove('hidden');
    $('myAddr').textContent = state.address;
    $('myRole').textContent = state.role + (state.isAdmin ? ' (Admin)' : '');
    $('noRole').classList.toggle('hidden', state.role !== 'None' || state.isAdmin);

    $('secManufacturer').classList.toggle('hidden', state.role !== 'Manufacturer');
    $('secInspector').classList.toggle('hidden', state.role !== 'Inspector');
    $('secAdmin').classList.toggle('hidden', !state.isAdmin);

    const acts = ACTIONS[state.role];
    if (acts) {
      $('secMove').classList.remove('hidden');
      $('moveHint').textContent = HINTS[state.role];
      const sel = $('actionSelect');
      acts.forEach((a) => sel.appendChild(el('option', { value: a.value }, a.label)));
      sel.addEventListener('change', syncLoc);
      syncLoc();
    }
  }

  function syncLoc() {
    const acts = ACTIONS[state.role] || [];
    const a = acts.find((x) => x.value === $('actionSelect').value);
    $('locLabel').classList.toggle('hidden', !(a && a.loc));
  }

  $('connectBtn').addEventListener('click', start);
  if (window.ethereum && sessionStorage.getItem('sct_addr')) start(); // reconnect silently after reload

  // ---- Manufacturer: create product
  $('formCreate').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    const expiry = f.get('expiry') ? Math.floor(new Date(f.get('expiry')).getTime() / 1000) : 0;
    const m = state.contracts.SupplyChain.methods.createProduct(f.get('name').trim(), f.get('batch').trim(), f.get('origin').trim(), expiry);
    try {
      const r = await sendTx(m, 'Create product');
      const id = r.events.ProductCreated.returnValues.productId;
      toast('Product #' + id + ' created. Track it at /track?id=' + id, 'ok');
      ev.target.reset();
    } catch (_) { /* toast already shown */ }
  });

  // ---- Distributor / Retailer / Inspector: move product
  $('formMove').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    const id = Number(f.get('id'));
    const loc = (f.get('location') || '').trim();
    const notes = (f.get('notes') || '').trim();
    const m = state.contracts.SupplyChain.methods;
    const calls = {
      ship: () => m.shipProduct(id, loc || 'Unknown', notes),
      receiveDist: () => m.receiveAtDistributor(id, loc || 'Unknown', notes),
      receiveRet: () => m.receiveAtRetailer(id, loc || 'Unknown', notes),
      sold: () => m.markSold(id, notes),
      recall: () => m.recallProduct(id, notes || 'No reason given'),
    };
    const action = f.get('action');
    try {
      await sendTx(calls[action](), $('actionSelect').selectedOptions[0].textContent);
      ev.target.reset();
    } catch (_) { /* toast already shown */ }
  });

  // ---- Inspector: list recalled (uses the role-protected API route)
  $('loadRecalled').addEventListener('click', async () => {
    try {
      const items = await api('/api/products/recalled');
      const ul = $('recalledList'); ul.textContent = '';
      if (!items.length) ul.appendChild(el('li', { className: 'muted' }, 'No recalled products.'));
      items.forEach((p) => {
        const li = el('li'); li.appendChild(statusBadge(p.status, 'Recalled'));
        li.appendChild(el('span', {}, '  #' + p.id + ' ' + p.name + ' (batch ' + p.batchNumber + ') '));
        li.appendChild(el('a', { href: '/track?id=' + p.id }, 'view'));
        ul.appendChild(li);
      });
    } catch (e) { toast(parseError(e), 'err'); }
  });

  // ---- Admin: roles
  $('formRole').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    const addr = f.get('address').trim();
    const role = Number(f.get('role'));
    const rm = state.contracts.RoleManager.methods;
    try {
      await sendTx(role === 0 ? rm.revokeRole(addr) : rm.assignRole(addr, role), role === 0 ? 'Revoke role' : 'Assign role');
      ev.target.reset();
    } catch (_) { /* toast already shown */ }
  });

  $('formLookup').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const addr = new FormData(ev.target).get('address').trim();
    try {
      const r = await api('/api/auth/role/' + addr);
      $('lookupOut').textContent = r.role + (r.isAdmin ? ' + Admin' : '');
    } catch (e) { $('lookupOut').textContent = e.message; }
  });
})();

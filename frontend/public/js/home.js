(async function () {
  const { api, el, statusBadge, $, connect, toast, parseError, loadConfig } = SCT;
  $('connectBtn').addEventListener('click', () => connect().catch((e) => toast(parseError(e), 'err')));

  try {
    const cfg = await loadConfig();
    $('statNet').textContent = cfg.networkName;
    const h = await api('/api/health');
    $('statBlock').textContent = h.block;
    const { total, items } = await api('/api/products?limit=10');
    $('statTotal').textContent = total;
    const body = $('productRows');
    body.textContent = '';
    if (!items.length) {
      const tr = el('tr'); tr.appendChild(el('td', { colSpan: 6, className: 'muted' }, 'No products yet. A manufacturer can register the first one from the Dashboard.'));
      body.appendChild(tr);
    }
    for (const p of items) {
      const tr = el('tr');
      tr.appendChild(el('td', {}, '#' + p.id));
      tr.appendChild(el('td', {}, p.name));
      tr.appendChild(el('td', {}, p.batchNumber));
      tr.appendChild(el('td', {}, p.origin));
      const s = el('td'); s.appendChild(statusBadge(p.status, p.statusLabel)); tr.appendChild(s);
      const a = el('td'); a.appendChild(el('a', { href: '/track?id=' + p.id }, 'Track')); tr.appendChild(a);
      body.appendChild(tr);
    }
  } catch (e) {
    $('productRows').textContent = '';
    SCT.banner('Cannot reach the blockchain node: ' + e.message, true);
  }
})();

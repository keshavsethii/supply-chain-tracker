(function () {
  const { api, el, statusBadge, $, fmtDate, connect, toast, parseError } = SCT;
  $('connectBtn').addEventListener('click', () => connect().catch((e) => toast(parseError(e), 'err')));

  async function track(id) {
    $('result').classList.add('hidden');
    try {
      const [p, cps] = await Promise.all([api('/api/products/' + id), api('/api/products/' + id + '/checkpoints')]);
      $('pName').textContent = p.name;
      $('pId').textContent = '#' + p.id;
      $('pBatch').textContent = p.batchNumber;
      $('pOrigin').textContent = p.origin;
      $('pMfr').textContent = p.manufacturer;
      $('pDate').textContent = fmtDate(p.manufacturedAt);
      $('pExpiry').textContent = fmtDate(p.expiryDate);
      const st = $('pStatus'); st.textContent = p.statusLabel; st.className = 'badge s' + p.status;
      $('recallAlert').classList.toggle('hidden', p.status !== 5);

      const tl = $('timeline'); tl.textContent = '';
      for (const c of cps) {
        const li = el('li');
        const head = el('div'); head.appendChild(statusBadge(c.status, c.statusLabel)); head.appendChild(el('strong', {}, '  ' + c.location));
        li.appendChild(head);
        if (c.notes) li.appendChild(el('div', {}, c.notes));
        li.appendChild(el('div', { className: 'when' }, fmtDate(c.timestamp) + ' by '));
        li.lastChild.appendChild(el('span', { className: 'mono' }, c.actor));
        tl.appendChild(li);
      }
      $('result').classList.remove('hidden');
      history.replaceState(null, '', '/track?id=' + id);
    } catch (e) {
      toast(e.message, 'err');
    }
  }

  $('trackBtn').addEventListener('click', () => { const v = $('trackId').value; if (v) track(v); });
  $('trackId').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('trackBtn').click(); });
  const q = new URLSearchParams(location.search).get('id');
  if (q) { $('trackId').value = q; track(q); }
})();

/* =========================================================================
 * app.js — UI de la PWA (router por hash, vanilla JS, sin dependencias)
 *
 *   #/                   → selector de vendedor (sin contraseña)
 *   #/ruta               → módulo de campo (móvil)
 *   #/oficina/despacho   → consolidación + matriz de despacho
 *   #/oficina/inventario → CRUD de productos (+ importar/exportar CSV)
 *   #/oficina/vendedores → vendedores preconfigurados
 *   #/oficina/ajustes    → sincronización, tasa Bs, formato Excel, respaldos
 * ========================================================================= */
(function () {
  'use strict';

  /* ============================ Utilidades ============================ */
  const app = document.getElementById('app');
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ESC[c]);
  const nf2 = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nf0 = new Intl.NumberFormat('es-VE', { maximumFractionDigits: 2 });
  const usd = (n) => '$ ' + nf2.format(n || 0);
  const bs = (n) => 'Bs ' + nf2.format(n || 0);
  const int = (v) => { const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10); return isNaN(n) ? 0 : n; };
  const dec = (v) => { const n = parseFloat(String(v).replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return isNaN(n) ? 0 : n; };
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function fmtDate(iso) {
    const [y, m, d] = String(iso).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function fmtStock(units, upb) {
    units = +units || 0; upb = +upb || 1;
    if (upb <= 1 || units < 0) return nf0.format(units) + ' un';
    const cj = Math.floor(units / upb), un = units % upb;
    return cj + ' cj' + (un ? ' + ' + un + ' un' : '');
  }
  function productLabel(p) { return p.name + ' ' + p.presentation; }

  let toastTimer;
  function toast(msg, kind) {
    let el = $('.toast');
    if (!el) { el = document.createElement('div'); document.body.appendChild(el); }
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    el.setAttribute('role', 'status');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.remove(), 2600);
  }

  function openSheet(html) {
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>';
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); flushDeferredRender(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    ov.addEventListener('click', (e) => { if (e.target === ov || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(ov);
    return { el: ov.querySelector('.sheet'), close };
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { /* noop */ }
      ta.remove(); return ok;
    }
  }

  async function saveFile(filename, text, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    // En el teléfono: menú nativo de compartir (WhatsApp, Drive, correo…)
    try {
      const file = new File([blob], filename, { type: blob.type });
      if (matchMedia('(pointer:coarse)').matches && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return;
      }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  function pickFile(accept) {
    return new Promise((resolve) => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = accept;
      inp.onchange = () => resolve(inp.files[0] || null);
      inp.click();
    });
  }

  function slug(s) { return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  /* ============================== Estado ============================== */
  const S = {
    products: [], sellers: [], orders: [],
    settings: {},
    session: null,          // { sellerId, activeOrderId }
    ui: {                   // estado efímero de pantalla
      q: '', cat: '', onlyInOrder: false,
      office: { date: today(), sellerId: '', mode: 'bultos', invQ: '', invCat: '' },
    },
  };
  const DEFAULT_SETTINGS = { csvSep: ';', csvDecimal: ',', exchangeRate: 0, syncUrl: '', syncKey: '', adminKey: '' };
  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('pedidos') : null;

  async function loadAll() {
    const [p, s, o] = await Promise.all([DB.getAll('products'), DB.getAll('sellers'), DB.getAll('orders')]);
    S.products = p.filter((x) => !x.deleted);
    S.sellers = s.filter((x) => !x.deleted);
    S.orders = o.filter((x) => !x.deleted);
    S.settings = { ...DEFAULT_SETTINGS, ...(await DB.getMeta('settings', {})) };
    S.session = await DB.getMeta('session', null);
  }
  const productById = (id) => S.products.find((p) => p.id === id);
  const sellerById = (id) => S.sellers.find((s) => s.id === id);
  const orderById = (id) => S.orders.find((o) => o.id === id);
  const categories = () => [...new Set(S.products.map((p) => p.category))].sort((a, b) => a.localeCompare(b, 'es'));

  async function saveOrder(o) {
    DB.touch(o);
    await DB.put('orders', o);
    const i = S.orders.findIndex((x) => x.id === o.id);
    if (o.deleted) { if (i >= 0) S.orders.splice(i, 1); }
    else if (i >= 0) S.orders[i] = o; else S.orders.push(o);
    notifyChange();
  }
  async function saveProduct(p) {
    DB.touch(p);
    await DB.put('products', p);
    const i = S.products.findIndex((x) => x.id === p.id);
    if (p.deleted) { if (i >= 0) S.products.splice(i, 1); }
    else if (i >= 0) S.products[i] = p; else S.products.push(p);
    notifyChange();
  }
  async function saveSeller(s) {
    DB.touch(s);
    await DB.put('sellers', s);
    const i = S.sellers.findIndex((x) => x.id === s.id);
    if (i >= 0) S.sellers[i] = s; else S.sellers.push(s);
    notifyChange();
  }
  async function saveSettings(patch) {
    S.settings = { ...S.settings, ...patch };
    await DB.setMeta('settings', S.settings);
  }
  async function setSession(sess) { S.session = sess; await DB.setMeta('session', sess); }

  let changeTimer;
  function notifyChange() {
    updateSyncPill();
    clearTimeout(changeTimer);
    changeTimer = setTimeout(() => { if (bc) bc.postMessage('changed'); scheduleSync(4000); }, 300);
  }

  /* ========================= Sincronización UI ========================= */
  let syncTimer, lastSyncResult = null;
  function scheduleSync(ms) { clearTimeout(syncTimer); syncTimer = setTimeout(runSync, ms); }

  async function runSync(manual) {
    const isOffice = location.hash.startsWith('#/oficina');
    const scope = isOffice ? {} : (S.session ? { sellerId: S.session.sellerId } : {});
    const r = await Sync.syncNow(scope);
    lastSyncResult = r;
    if (r.ok && r.pulled) { await loadAll(); refreshAfterRemote(); }
    if (manual) {
      if (r.ok) toast('Sincronizado · ↑' + r.pushed + ' ↓' + r.pulled + (r.rejected ? ' · ' + r.rejected + ' ya despachados' : ''), 'ok');
      else if (r.offline) toast('Sin internet: los pedidos quedan guardados en el teléfono', 'err');
      else toast(r.error || 'No se pudo sincronizar', 'err');
    }
    updateSyncPill();
    // Oficina: casi en tiempo real. Teléfono: ahorra batería y datos.
    scheduleSync(isOffice ? 20000 : 60000);
    return r;
  }

  async function updateSyncPill() {
    const el = $('#syncPill');
    if (!el) return;
    const pending = await Sync.pendingCount();
    const online = navigator.onLine;
    const serverDown = lastSyncResult && !lastSyncResult.ok && !lastSyncResult.offline;
    el.className = 'pill' + (!online || serverDown ? ' offline' : '') + (pending ? ' pending' : '');
    el.innerHTML = '<span class="dot"></span>' +
      (!online ? 'Sin señal' : serverDown ? 'Sin servidor' : 'En línea') +
      (pending ? ' · ' + pending + ' por subir' : '');
    el.title = lastSyncResult && lastSyncResult.error ? lastSyncResult.error : 'Tocar para sincronizar';
  }

  /** Tras recibir datos remotos: re-render sin interrumpir la escritura. */
  let deferredRender = false;
  function refreshAfterRemote() {
    const a = document.activeElement;
    const typing = a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && app.contains(a);
    if ($('.overlay') || typing) { deferredRender = true; return; }
    deferredRender = false;
    render();
  }
  function flushDeferredRender() {
    if (!deferredRender) return;
    setTimeout(() => { if (deferredRender) refreshAfterRemote(); }, 0);
  }

  /* =============================== Router =============================== */
  function render() {
    const h = location.hash || '#/';
    if (h.startsWith('#/oficina')) return renderOffice(h.split('/')[2] || 'despacho');
    if (h === '#/ruta' && S.session && sellerById(S.session.sellerId)) return renderSeller();
    return renderLogin();
  }

  /* =============================== Login =============================== */
  function renderLogin() {
    const active = S.sellers.filter((s) => s.active).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    const last = S.session && S.session.sellerId;
    app.innerHTML = `
      <section class="login">
        <div class="card">
          <div class="logo-mark"><img src="./icons/icon.svg" width="56" height="56" alt=""></div>
          <h1>Toma de Pedidos</h1>
          <p>Selecciona tu nombre para comenzar la ruta de hoy.</p>
          <label class="field"><span>Vendedor</span>
            <select id="sellerSel" class="select" aria-label="Vendedor">
              <option value="">— Elige tu nombre —</option>
              ${active.map((s) => `<option value="${esc(s.id)}" ${s.id === last ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
            </select>
          </label>
          <button id="enterBtn" class="btn btn-primary btn-block" ${last ? '' : 'disabled'}>Entrar a mi ruta →</button>
          <div class="divider">o</div>
          <a class="btn btn-block" href="#/oficina/despacho">🖥️ Oficina · Despacho e inventario</a>
        </div>
      </section>`;
    const sel = $('#sellerSel'), btn = $('#enterBtn');
    sel.onchange = () => { btn.disabled = !sel.value; };
    btn.onclick = async () => {
      if (!sel.value) return;
      const prev = S.session && S.session.sellerId === sel.value ? S.session.activeOrderId : null;
      await setSession({ sellerId: sel.value, activeOrderId: prev });
      location.hash = '#/ruta';
    };
  }

  /* ========================== Módulo de campo ========================== */
  function myOrdersToday() {
    const sid = S.session.sellerId, d = today();
    return S.orders.filter((o) => o.sellerId === sid && o.routeDate === d)
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }
  function activeOrder() {
    const o = S.session.activeOrderId && orderById(S.session.activeOrderId);
    return o && o.routeDate === today() ? o : null;
  }
  function recentClients() {
    const sid = S.session.sellerId, seen = new Set(), out = [];
    S.orders.filter((o) => o.sellerId === sid)
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .forEach((o) => { const k = norm(o.clientName); if (!seen.has(k)) { seen.add(k); out.push(o.clientName); } });
    return out.slice(0, 300);
  }

  async function openClient(name) {
    name = String(name || '').replace(/\s+/g, ' ').trim();
    if (!name) { toast('Escribe el nombre del cliente', 'err'); return; }
    if (name.length > 80) name = name.slice(0, 80);
    const key = norm(name);
    let o = myOrdersToday().find((x) => x.clientKey === key);
    if (!o) {
      const seller = sellerById(S.session.sellerId);
      o = {
        id: DB.uid('o'), sellerId: seller.id, sellerName: seller.name,
        clientName: name, clientKey: key, routeDate: today(),
        status: 'abierto', lines: {}, notes: '',
        createdAt: DB.now(), deviceId: await Sync.deviceId(), deleted: false,
      };
      await saveOrder(o);
      toast('Cliente agregado: ' + name, 'ok');
    }
    await setSession({ ...S.session, activeOrderId: o.id });
    renderSeller();
  }

  function filteredProducts() {
    const tokens = norm(S.ui.q).split(' ').filter(Boolean);
    const o = activeOrder();
    return S.products.filter((p) => {
      if (!p.active) return false;
      if (S.ui.cat && p.category !== S.ui.cat) return false;
      if (S.ui.onlyInOrder && !(o && o.lines[p.id])) return false;
      if (!tokens.length) return true;
      const hay = norm(p.code + ' ' + p.name + ' ' + p.presentation + ' ' + p.category);
      return tokens.every((t) => hay.includes(t));
    }).sort((a, b) => a.category.localeCompare(b.category, 'es') || a.name.localeCompare(b.name, 'es') ||
      a.code.localeCompare(b.code, 'es', { numeric: true }));
  }

  function stepperHTML(p, kind, value, over) {
    const lbl = kind === 'cajas' ? 'CAJAS' : 'UNIDADES';
    return `
      <div class="stepper ${value ? 'active' : ''} ${over ? 'over' : ''}">
        <button type="button" data-act="dec" data-kind="${kind}" aria-label="Restar ${lbl.toLowerCase()}">−</button>
        <label><small>${lbl}</small>
          <input type="text" inputmode="numeric" pattern="[0-9]*" data-kind="${kind}" value="${value || ''}" placeholder="0" aria-label="${lbl.toLowerCase()} de ${esc(productLabel(p))}">
        </label>
        <button type="button" class="plus" data-act="inc" data-kind="${kind}" aria-label="Sumar ${lbl.toLowerCase()}">+</button>
      </div>`;
  }

  function productHTML(p, o) {
    const l = o && o.lines[p.id];
    const cj = l ? l.cajas : 0, un = l ? l.unidades : 0;
    const req = cj * p.unitsPerBox + un;
    const over = req > 0 && req > p.stock;
    const low = p.stock <= p.unitsPerBox * 2;
    const parts = [];
    if (p.sellBy !== 'unidad') parts.push(`CJ×${p.unitsPerBox} <b>${usd(p.boxPrice)}</b>`);
    if (p.sellBy !== 'caja') parts.push(`UN <b>${usd(p.unitPrice)}</b>`);
    return `
      <article class="pitem ${req ? 'has-qty' : ''}" data-pid="${esc(p.id)}">
        <div>
          <div class="pname">${esc(p.name)} <span class="ppres">${esc(p.presentation)}</span></div>
          <div class="pmeta">
            <span class="mono">${esc(p.code)}</span>
            ${parts.map((x) => '<span>' + x + '</span>').join('')}
            <span class="${over || low ? 'stock-low' : ''}">Stock: ${fmtStock(p.stock, p.unitsPerBox)}${over ? ' ⚠ insuficiente' : ''}</span>
          </div>
        </div>
        <div class="qty-row">
          ${p.sellBy !== 'unidad' ? stepperHTML(p, 'cajas', cj, over) : ''}
          ${p.sellBy !== 'caja' ? stepperHTML(p, 'unidades', un, over) : ''}
        </div>
      </article>`;
  }

  function renderSeller() {
    const seller = sellerById(S.session.sellerId);
    const orders = myOrdersToday();
    const o = activeOrder();
    const cats = categories();
    app.innerHTML = `
      <header class="topbar">
        <div class="grow"><h1>${esc(seller.name)}<small>Ruta · ${esc(fmtDate(today()))}</small></h1></div>
        <button id="syncPill" class="pill" type="button"></button>
        <button class="btn btn-sm" id="menuBtn" aria-label="Menú">☰</button>
      </header>
      <section class="client-bar">
        <form id="clientForm" class="row" autocomplete="off">
          <input id="clientInput" class="input grow" list="clientsDl" enterkeyhint="go"
                 placeholder="Cliente (ej: Panadería El Sol)" aria-label="Nombre del cliente" maxlength="80">
          <button class="btn btn-accent" type="submit">＋ Cliente</button>
        </form>
        <datalist id="clientsDl">${recentClients().map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
        <div class="chips" id="clientChips" role="tablist" aria-label="Clientes de hoy">
          ${orders.length ? orders.map((x) => {
            const t = Matrix.orderTotals(x);
            return `<button class="chip ${o && o.id === x.id ? 'active' : ''} ${x.status === 'enviado' ? 'sent' : ''} ${x.status === 'despachado' ? 'done' : ''}" data-oid="${esc(x.id)}" role="tab">
              ${x.status === 'enviado' ? '✓ ' : ''}${esc(x.clientName)} <span class="badge">${t.items}</span></button>`;
          }).join('') : '<span class="muted" style="padding:10px 2px">Aún no hay clientes hoy. Escribe el primero arriba.</span>'}
        </div>
      </section>
      <section class="catalog-tools">
        <div class="search"><input id="q" class="input" type="search" placeholder="Buscar producto, gramaje o código…" value="${esc(S.ui.q)}" aria-label="Buscar producto"></div>
        <div class="chips" id="catChips">
          <button class="chip ${!S.ui.cat && !S.ui.onlyInOrder ? 'active' : ''}" data-cat="">Todos</button>
          <button class="chip ${S.ui.onlyInOrder ? 'active' : ''}" data-only="1">🧾 En pedido</button>
          ${cats.map((c) => `<button class="chip ${S.ui.cat === c ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
        </div>
      </section>
      <section class="plist" id="plist"></section>
      <footer class="bottom-bar" id="bottomBar"></footer>`;

    renderProductList();
    renderBottomBar();
    updateSyncPill();

    $('#clientForm').onsubmit = (e) => { e.preventDefault(); openClient($('#clientInput').value); };
    $('#clientChips').onclick = async (e) => {
      const b = e.target.closest('[data-oid]'); if (!b) return;
      await setSession({ ...S.session, activeOrderId: b.dataset.oid });
      renderSeller();
    };
    let qt;
    $('#q').oninput = (e) => { clearTimeout(qt); qt = setTimeout(() => { S.ui.q = e.target.value; renderProductList(); }, 90); };
    $('#catChips').onclick = (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      if (b.dataset.only) { S.ui.onlyInOrder = !S.ui.onlyInOrder; S.ui.cat = ''; }
      else { S.ui.cat = b.dataset.cat; S.ui.onlyInOrder = false; }
      $$('#catChips .chip').forEach((c) => c.classList.toggle('active',
        c.dataset.only ? S.ui.onlyInOrder : (!S.ui.onlyInOrder && c.dataset.cat === S.ui.cat)));
      renderProductList();
    };
    $('#syncPill').onclick = () => runSync(true);
    $('#menuBtn').onclick = sellerMenu;

    const list = $('#plist');
    list.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-act]'); if (!b) return;
      const pid = b.closest('[data-pid]').dataset.pid;
      const cur0 = activeOrder(); // releer: un sync pudo reemplazar el objeto
      const l = cur0 && cur0.lines[pid];
      const cur = l ? l[b.dataset.kind] : 0;
      setQty(pid, b.dataset.kind, cur + (b.dataset.act === 'inc' ? 1 : -1));
      if (navigator.vibrate) navigator.vibrate(8);
    });
    list.addEventListener('focusin', (e) => { if (e.target.matches('input[data-kind]')) e.target.select(); });
    list.addEventListener('change', (e) => {
      const inp = e.target.closest('input[data-kind]'); if (!inp) return;
      setQty(inp.closest('[data-pid]').dataset.pid, inp.dataset.kind, int(inp.value));
    });
    list.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('input[data-kind]')) e.target.blur(); });
  }

  function renderProductList() {
    const list = $('#plist'); if (!list) return;
    const items = filteredProducts();
    const o = activeOrder();
    const hint = o ? '' : `<div class="card card-pad" style="border-color:var(--accent);border-width:2px"><strong>Primero escribe el cliente arriba</strong><div class="muted">Las cantidades se cargan al cliente seleccionado.</div></div>`;
    list.innerHTML = hint + (items.length ? items.map((p) => productHTML(p, o)).join('')
      : `<div class="empty"><strong>Sin resultados</strong>Prueba con otra palabra o categoría.</div>`);
  }

  function renderBottomBar() {
    const bar = $('#bottomBar'); if (!bar) return;
    const o = activeOrder();
    if (!o) { bar.innerHTML = `<div class="grow"><div class="who">Sin cliente seleccionado</div><div class="sum">${myOrdersToday().length} clientes hoy</div></div>`; return; }
    const t = Matrix.orderTotals(o);
    const rate = +S.settings.exchangeRate || 0;
    bar.innerHTML = `
      <div class="grow">
        <div class="who">${esc(o.clientName)} ${o.status !== 'abierto' ? `<span class="status ${o.status}">${o.status}</span>` : ''}</div>
        <div class="sum">${t.items} ítems · ${t.cajas} cj + ${t.unidades} un${rate ? ' · ' + bs(t.monto * rate) : ''}</div>
      </div>
      <div class="total num">${usd(t.monto)}</div>
      <button class="btn btn-accent" id="viewOrder">Ver pedido</button>`;
    $('#viewOrder').onclick = orderSheet;
  }

  async function setQty(pid, kind, value) {
    const o = activeOrder();
    if (!o) { toast('Primero escribe el nombre del cliente', 'err'); $('#clientInput').focus(); return; }
    if (o.status === 'despachado') { toast('Este pedido ya fue despachado por la oficina', 'err'); return; }
    const p = productById(pid); if (!p) return;
    value = Math.max(0, Math.min(99999, int(value)));
    const line = o.lines[pid] || {
      // Snapshot: el pedido conserva precio y descripción del momento de la venta
      code: p.code, name: p.name, presentation: p.presentation, category: p.category,
      unitsPerBox: p.unitsPerBox, unitPrice: p.unitPrice, boxPrice: p.boxPrice, cajas: 0, unidades: 0,
    };
    line[kind] = value;
    if (!line.cajas && !line.unidades) delete o.lines[pid]; else o.lines[pid] = line;
    if (o.status === 'enviado') { o.status = 'abierto'; toast('Pedido reabierto: recuerda enviarlo de nuevo'); }
    await saveOrder(o);
    // Actualiza solo la tarjeta tocada (rápido con 100+ productos)
    const card = $(`#plist [data-pid="${CSS.escape(pid)}"]`);
    if (card) {
      if (S.ui.onlyInOrder && !o.lines[pid]) card.remove();
      else card.outerHTML = productHTML(p, o);
    }
    renderBottomBar();
    const chip = $(`#clientChips [data-oid="${CSS.escape(o.id)}"]`);
    if (chip) {
      chip.classList.remove('sent');
      chip.innerHTML = `${esc(o.clientName)} <span class="badge">${Matrix.orderTotals(o).items}</span>`;
    }
  }

  function orderSheet() {
    const o = activeOrder(); if (!o) return;
    const rate = +S.settings.exchangeRate || 0;
    const lines = Object.entries(o.lines).map(([pid, l]) => ({ pid, l, t: Matrix.lineTotals(l) }))
      .sort((a, b) => a.l.category.localeCompare(b.l.category, 'es') || a.l.name.localeCompare(b.l.name, 'es'));
    const tot = Matrix.orderTotals(o);
    const locked = o.status === 'despachado';
    const sh = openSheet(`
      <div class="row"><div class="grow"><h2>${esc(o.clientName)}</h2>
        <div class="muted">${esc(fmtDate(o.routeDate))} · <span class="status ${o.status}">${o.status}</span></div></div>
        <button class="icon-btn" data-close aria-label="Cerrar">×</button></div>
      ${lines.length ? `<table class="lines">${lines.map(({ l, t }) => `
        <tr><td><b>${esc(l.name)} ${esc(l.presentation)}</b><div class="muted mono" style="font-size:12px">${esc(l.code)}</div></td>
            <td class="num">${t.cajas ? t.cajas + ' cj' : ''}${t.cajas && t.unidades ? ' + ' : ''}${t.unidades ? t.unidades + ' un' : ''}</td>
            <td class="num">${usd(t.monto)}</td></tr>`).join('')}
        <tr><td><b>TOTAL</b></td><td class="num"><b>${tot.cajas} cj + ${tot.unidades} un</b></td>
            <td class="num" style="font-size:18px">${usd(tot.monto)}${rate ? `<div class="muted" style="font-size:12px">${bs(tot.monto * rate)}</div>` : ''}</td></tr>
      </table>` : '<div class="empty"><strong>Pedido vacío</strong>Agrega productos desde el catálogo.</div>'}
      <label class="field" style="margin-top:14px"><span>Nota para despacho</span>
        <textarea id="notes" class="input" maxlength="300" placeholder="Ej: entregar antes de las 10am, cobrar en divisas…" ${locked ? 'disabled' : ''}>${esc(o.notes || '')}</textarea></label>
      <div class="actions">
        ${locked ? '' : `<button class="btn btn-ok" id="sendOrder" ${lines.length ? '' : 'disabled'}>✓ Cerrar y enviar</button>`}
        <button class="btn" id="renameOrder" ${locked ? 'disabled' : ''}>✎ Renombrar</button>
        <button class="btn btn-danger" id="delOrder" ${locked ? 'disabled' : ''}>Eliminar</button>
      </div>`);
    const notes = $('#notes', sh.el);
    notes.onchange = async () => { o.notes = notes.value.slice(0, 300); await saveOrder(o); };
    const send = $('#sendOrder', sh.el);
    if (send) send.onclick = async () => {
      o.notes = notes.value.slice(0, 300);
      o.status = 'enviado'; o.sentAt = DB.now();
      await saveOrder(o);
      await setSession({ ...S.session, activeOrderId: null });
      sh.close(); renderSeller();
      toast('Pedido cerrado. ' + (navigator.onLine ? 'Enviando…' : 'Se enviará al tener señal.'), 'ok');
      runSync(false);
      setTimeout(() => { const i = $('#clientInput'); if (i) i.focus(); }, 50);
    };
    $('#renameOrder', sh.el).onclick = async () => {
      const name = (prompt('Nuevo nombre del cliente', o.clientName) || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      if (!name || name === o.clientName) return;
      if (myOrdersToday().some((x) => x.id !== o.id && x.clientKey === norm(name))) { toast('Ya existe un pedido hoy con ese cliente', 'err'); return; }
      o.clientName = name; o.clientKey = norm(name);
      await saveOrder(o); sh.close(); renderSeller();
    };
    $('#delOrder', sh.el).onclick = async () => {
      if (!confirm('¿Eliminar el pedido de ' + o.clientName + '?')) return;
      o.deleted = true;
      await saveOrder(o);
      await setSession({ ...S.session, activeOrderId: null });
      sh.close(); renderSeller(); toast('Pedido eliminado');
    };
  }

  function sellerMenu() {
    const orders = myOrdersToday();
    const total = orders.reduce((a, o) => a + Matrix.orderTotals(o).monto, 0);
    const last = lastSyncResult;
    const sh = openSheet(`
      <div class="row"><h2 class="grow">Mi ruta de hoy</h2><button class="icon-btn" data-close aria-label="Cerrar">×</button></div>
      <p class="muted">${orders.length} clientes · <b>${usd(total)}</b> · ${orders.filter((o) => o.status === 'abierto').length} abiertos</p>
      <div class="actions" style="flex-direction:column">
        <button class="btn btn-primary" id="mSync">⟳ Sincronizar ahora</button>
        <button class="btn" id="mExport">⇪ Enviar pedidos de hoy por archivo (WhatsApp)</button>
        <button class="btn" id="mImport">⇩ Cargar catálogo desde archivo</button>
      </div>
      <details style="margin-top:16px"><summary class="section-title" style="display:inline">Conexión</summary>
        <div style="display:grid;gap:10px;margin-top:10px">
          <label class="field"><span>Clave de sincronización</span><input id="mKey" class="input" type="password" autocomplete="off" value="${esc(S.settings.syncKey)}"></label>
          <label class="field"><span>Servidor (opcional)</span><input id="mUrl" class="input" placeholder="${esc(Sync.DEFAULT_SYNC_URL)}" value="${esc(S.settings.syncUrl)}"></label>
          <button class="btn" id="mSave">Guardar conexión</button>
          <div class="muted" style="font-size:13px">${last ? (last.ok ? 'Último sync correcto.' : 'Último intento: ' + esc(last.error || 'sin señal')) : ''}</div>
        </div>
      </details>
      <div class="actions"><button class="btn btn-danger" id="mOut">Cambiar de vendedor</button></div>`);
    $('#mSync', sh.el).onclick = () => runSync(true);
    $('#mExport', sh.el).onclick = async () => {
      const seller = sellerById(S.session.sellerId);
      const b = await Sync.exportBundle({ sellerId: seller.id, routeDate: today() });
      await saveFile('pedidos_' + slug(seller.name) + '_' + today() + '.json', JSON.stringify(b), 'application/json');
    };
    $('#mImport', sh.el).onclick = async () => {
      const f = await pickFile('.json,application/json'); if (!f) return;
      try { const n = await Sync.importBundle(JSON.parse(await f.text()), false); await loadAll(); sh.close(); renderSeller(); toast(n + ' registros actualizados', 'ok'); }
      catch (e) { toast(e.message, 'err'); }
    };
    $('#mSave', sh.el).onclick = async () => {
      await saveSettings({ syncKey: $('#mKey', sh.el).value.trim(), syncUrl: $('#mUrl', sh.el).value.trim() });
      toast('Conexión guardada', 'ok'); runSync(true);
    };
    $('#mOut', sh.el).onclick = async () => { await setSession({ sellerId: null, activeOrderId: null }); sh.close(); location.hash = '#/'; };
  }

  /* ============================== Oficina ============================== */
  const TABS = [['despacho', 'Despacho'], ['inventario', 'Inventario'], ['vendedores', 'Vendedores'], ['ajustes', 'Ajustes']];

  function renderOffice(tab) {
    if (!TABS.some(([k]) => k === tab)) tab = 'despacho';
    app.innerHTML = `
      <header class="topbar">
        <div class="grow"><h1>Oficina<small>Consolidación y despacho</small></h1></div>
        <button id="syncPill" class="pill" type="button"></button>
        <a class="btn btn-sm" href="#/">Salir</a>
      </header>
      <nav class="tabs">${TABS.map(([k, l]) => `<a class="tab ${k === tab ? 'active' : ''}" href="#/oficina/${k}">${l}</a>`).join('')}</nav>
      <div class="container" id="officeBody"></div>`;
    $('#syncPill').onclick = () => runSync(true);
    updateSyncPill();
    $('#officeBody').onchange = null;
    ({ despacho: renderDispatch, inventario: renderInventory, vendedores: renderSellers, ajustes: renderSettings })[tab]($('#officeBody'));
  }

  /* ---------------------- Despacho / Matriz ---------------------- */
  function ordersFor(sellerId, date) {
    return S.orders.filter((o) => o.routeDate === date && (!sellerId || o.sellerId === sellerId));
  }

  /** Vista "Todos": columnas = vendedores (carga total del almacén). */
  function ordersBySellerAsColumns(date) {
    const by = new Map();
    ordersFor('', date).forEach((o) => {
      if (!by.has(o.sellerId)) {
        const s = sellerById(o.sellerId);
        by.set(o.sellerId, { id: 'agg_' + o.sellerId, clientName: s ? s.name : o.sellerName, createdAt: s ? s.name : '', status: 'enviado', lines: {} });
      }
      const agg = by.get(o.sellerId);
      if (o.status !== 'enviado') agg.status = o.status === 'abierto' ? 'abierto' : agg.status;
      Object.entries(o.lines).forEach(([pid, l]) => {
        const a = agg.lines[pid] || { ...l, cajas: 0, unidades: 0, _monto: 0 };
        a.cajas += l.cajas; a.unidades += l.unidades;
        a._monto += Matrix.lineTotals(l).monto;
        agg.lines[pid] = a;
      });
    });
    // Precios distintos entre pedidos: se preserva el monto real con un precio ponderado
    by.forEach((agg) => Object.values(agg.lines).forEach((a) => {
      const base = a.cajas * a.boxPrice + a.unidades * a.unitPrice;
      if (base && Math.abs(base - a._monto) > 0.005) { const f = a._monto / base; a.boxPrice *= f; a.unitPrice *= f; }
      delete a._monto;
    }));
    return [...by.values()];
  }

  function renderDispatch(root) {
    const U = S.ui.office;
    const sellers = S.sellers.slice().sort((a, b) => a.name.localeCompare(b.name, 'es'));
    const dayOrders = ordersFor('', U.date);
    const stats = (sid) => {
      const os = dayOrders.filter((o) => (sid === '*' || o.sellerId === sid) && Matrix.orderTotals(o).items);
      return { n: os.length, abiertos: os.filter((o) => o.status === 'abierto').length,
        desp: os.filter((o) => o.status === 'despachado').length,
        monto: os.reduce((a, o) => a + Matrix.orderTotals(o).monto, 0) };
    };
    const card = (sid, name) => {
      const st = stats(sid);
      return `<button class="seller-card ${U.sellerId === sid ? 'active' : ''}" data-sid="${esc(sid)}">
        <h3>${esc(name)}</h3><div class="big num">${usd(st.monto)}</div>
        <div class="kpis"><span>${st.n} clientes</span>${st.abiertos ? `<span class="status abierto">${st.abiertos} abiertos</span>` : ''}${st.desp ? `<span class="status despachado">${st.desp} despachados</span>` : ''}</div></button>`;
    };

    const isAll = U.sellerId === '*';
    const sel = isAll ? null : sellerById(U.sellerId);
    const source = isAll ? ordersBySellerAsColumns(U.date) : sel ? ordersFor(sel.id, U.date) : [];
    const m = Matrix.build(source, U.mode);
    const pendingDispatch = !isAll && sel ? source.filter((o) => o.status !== 'despachado' && Matrix.orderTotals(o).items) : [];

    root.innerHTML = `
      <div class="toolbar">
        <label class="field"><span>Fecha de ruta</span><input type="date" id="dDate" class="input" value="${esc(U.date)}"></label>
        <div class="field"><span>Mostrar</span>
          <div class="seg" id="dMode">
            <button data-m="bultos" class="${U.mode === 'bultos' ? 'active' : ''}">Cajas / Unid.</button>
            <button data-m="unidades" class="${U.mode === 'unidades' ? 'active' : ''}">Unid. totales</button>
            <button data-m="monto" class="${U.mode === 'monto' ? 'active' : ''}">Monto $</button>
          </div></div>
        <div class="grow"></div>
        <button class="btn" id="dRefresh">⟳ Actualizar</button>
      </div>
      <div class="seller-cards" id="dSellers">
        ${card('*', '🏭 Todos (carga total)')}
        ${sellers.map((s) => card(s.id, s.name)).join('')}
      </div>
      ${!U.sellerId ? `<div class="empty card"><strong>Elige un vendedor</strong>para generar su matriz de despacho (productos × clientes).</div>` : `
      <div class="print-head"><h2>Matriz de despacho · ${esc(isAll ? 'Todos los vendedores' : sel ? sel.name : '')} · ${esc(fmtDate(U.date))} (${esc(U.date)})</h2></div>
      <div class="toolbar no-print">
        <div class="grow"><b>${esc(isAll ? 'Todos los vendedores' : sel ? sel.name : '')}</b> · ${m.cols.length} ${isAll ? 'vendedores' : 'clientes'} · ${m.rows.length} filas</div>
        <button class="btn btn-primary" id="xCopy" ${m.cols.length ? '' : 'disabled'}>📋 Copiar para Excel</button>
        <button class="btn" id="xCsv" ${m.cols.length ? '' : 'disabled'}>⇩ CSV matriz</button>
        <button class="btn" id="xFlat" ${m.cols.length ? '' : 'disabled'}>⇩ CSV plano</button>
        <button class="btn" id="xPrint" ${m.cols.length ? '' : 'disabled'}>🖨 Imprimir</button>
        ${!isAll && sel ? `<button class="btn btn-ok" id="xDispatch" ${pendingDispatch.length ? '' : 'disabled'}>✓ Confirmar despacho (${pendingDispatch.length})</button>` : ''}
      </div>
      ${m.cols.length ? matrixTableHTML(m) : `<div class="empty card"><strong>Sin pedidos</strong>No hay pedidos con productos para esta fecha.</div>`}
      ${!isAll && sel ? notesHTML(source) : ''}`}
    `;

    $('#dDate').onchange = (e) => { U.date = e.target.value || today(); renderDispatch(root); };
    $('#dMode').onclick = (e) => { const b = e.target.closest('[data-m]'); if (!b) return; U.mode = b.dataset.m; renderDispatch(root); };
    $('#dSellers').onclick = (e) => { const b = e.target.closest('[data-sid]'); if (!b) return; U.sellerId = b.dataset.sid; renderDispatch(root); };
    $('#dRefresh').onclick = () => runSync(true);
    if (!U.sellerId || !m.cols.length) return;

    const who = isAll ? 'todos' : slug(sel.name);
    const opts = { sep: S.settings.csvSep, decimal: S.settings.csvDecimal };
    $('#xCopy').onclick = async () => {
      // Portapapeles: TAB como separador → Excel lo reparte en celdas al pegar
      const ok = await copyText(Matrix.toDelimited(m, { sep: '\t', decimal: opts.decimal }));
      toast(ok ? 'Matriz copiada. Pégala en Excel (Ctrl+V)' : 'No se pudo copiar', ok ? 'ok' : 'err');
    };
    // BOM UTF-8 para que Excel respete acentos y ñ
    $('#xCsv').onclick = () => saveFile(`despacho_${who}_${U.date}_${U.mode}.csv`, '﻿' + Matrix.toDelimited(m, opts), 'text/csv;charset=utf-8');
    $('#xFlat').onclick = () => {
      const src = isAll ? ordersFor('', U.date) : source;
      saveFile(`pedidos_${who}_${U.date}_plano.csv`, '﻿' + Matrix.toFlat(src, null, opts), 'text/csv;charset=utf-8');
    };
    $('#xPrint').onclick = () => window.print();
    const xd = $('#xDispatch');
    if (xd) xd.onclick = () => confirmDispatch(sel, pendingDispatch, root);
  }

  function matrixTableHTML(m) {
    const money = m.mode === 'monto';
    const f = (v, isMoney) => (v ? (isMoney ? nf2.format(v) : nf0.format(v)) : '·');
    let lastCat = null;
    const colspan = m.cols.length + 3;
    const body = m.rows.map((r) => {
      let head = '';
      if (r.category !== lastCat) { lastCat = r.category; head = `<tr class="cat-row"><td class="sticky-col">${esc(r.category)}</td><td colspan="${colspan - 1}"></td></tr>`; }
      return head + `<tr>
        <td class="sticky-col" title="${esc(r.code + ' · ' + r.name + ' ' + r.presentation)}"><span class="mono muted">${esc(r.code)}</span> ${esc(r.name)} <b>${esc(r.presentation)}</b></td>
        <td><span class="um ${r.um}">${r.um}</span></td>
        ${r.cells.map((v) => `<td class="n ${v ? '' : 'zero'}">${f(v, money)}</td>`).join('')}
        <td class="n tot">${f(r.total, money)}</td></tr>`;
    }).join('');
    const foot = m.footer.map((fr) => `<tr>
        <td class="sticky-col">${esc(fr.label)}</td><td>${fr.money ? 'USD' : ''}</td>
        ${fr.cells.map((v) => `<td class="n">${f(v, fr.money)}</td>`).join('')}
        <td class="n tot">${f(fr.total, fr.money)}</td></tr>`).join('');
    const mark = { abierto: ' ●', enviado: ' ✓', despachado: ' ▣' };
    return `<div class="table-wrap"><table class="grid">
      <thead><tr>
        <th class="sticky-col">Producto</th><th>UM</th>
        ${m.cols.map((c) => `<th class="client" title="${esc(c.client)} (${esc(c.status)})">${esc(c.client)}${mark[c.status] || ''}</th>`).join('')}
        <th class="tot">TOTAL</th></tr></thead>
      <tbody>${body}</tbody><tfoot>${foot}</tfoot></table></div>
      <p class="muted no-print" style="font-size:13px">● abierto (el vendedor aún lo edita) · ✓ enviado · ▣ despachado. CJ = cajas, UN = unidades sueltas.</p>`;
  }

  function notesHTML(orders) {
    const withNotes = orders.filter((o) => o.notes && o.notes.trim());
    if (!withNotes.length) return '';
    return `<div class="section-title">Notas de los clientes</div><div class="card card-pad">${withNotes.map((o) =>
      `<div style="margin-bottom:6px"><b>${esc(o.clientName)}:</b> ${esc(o.notes)}</div>`).join('')}</div>`;
  }

  async function confirmDispatch(seller, orders, root) {
    const open = orders.filter((o) => o.status === 'abierto').length;
    const msg = `¿Confirmar despacho de ${orders.length} pedidos de ${seller.name}?\n\n` +
      'Se descontará el inventario y los pedidos quedarán bloqueados para el vendedor.' +
      (open ? `\n\n⚠ ${open} pedido(s) siguen ABIERTOS: el vendedor podría estar agregando productos.` : '');
    if (!confirm(msg)) return;
    const delta = new Map();
    for (const o of orders) {
      Object.entries(o.lines).forEach(([pid, l]) => delta.set(pid, (delta.get(pid) || 0) + Matrix.lineTotals(l).totalUnidades));
      o.status = 'despachado'; o.dispatchedAt = DB.now();
      await saveOrder(o);
    }
    for (const [pid, units] of delta) {
      const p = productById(pid);
      if (p) { p.stock = (+p.stock || 0) - units; await saveProduct(p); }
    }
    toast('Despacho confirmado. Inventario actualizado.', 'ok');
    renderDispatch(root);
    runSync(false);
  }

  /* --------------------------- Inventario --------------------------- */
  function renderInventory(root) {
    const U = S.ui.office;
    const tokens = norm(U.invQ).split(' ').filter(Boolean);
    const rows = S.products.filter((p) => (!U.invCat || p.category === U.invCat) &&
      tokens.every((t) => norm(p.code + ' ' + p.name + ' ' + p.presentation).includes(t)))
      .sort((a, b) => a.category.localeCompare(b.category, 'es') || a.name.localeCompare(b.name, 'es') || a.code.localeCompare(b.code, 'es', { numeric: true }));
    const valor = S.products.reduce((a, p) => a + (p.stock > 0 ? p.stock * p.unitPrice : 0), 0);
    root.innerHTML = `
      <div class="toolbar">
        <label class="field grow"><span>Buscar</span><input id="iq" class="input" type="search" value="${esc(U.invQ)}" placeholder="Código, nombre o gramaje"></label>
        <label class="field"><span>Categoría</span><select id="icat" class="select"><option value="">Todas</option>
          ${categories().map((c) => `<option ${c === U.invCat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
        <button class="btn btn-primary" id="iNew">＋ Nuevo producto</button>
        <button class="btn" id="iImp">⇧ Importar CSV</button>
        <button class="btn" id="iExp">⇩ Exportar CSV</button>
      </div>
      <p class="muted">${S.products.length} productos · ${rows.length} mostrados · valor de inventario (precio unitario): <b>${usd(valor)}</b></p>
      <div class="card" style="overflow:auto"><table class="inv">
        <thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Und/caja</th><th>$ Unidad</th><th>$ Caja</th><th>Venta</th><th>Stock</th><th></th></tr></thead>
        <tbody>${rows.map((p) => `
          <tr class="${p.active ? '' : 'inactive'}">
            <td class="mono" data-l="Código">${esc(p.code)}</td>
            <td><b>${esc(p.name)}</b> ${esc(p.presentation)}</td>
            <td data-l="Categoría">${esc(p.category)}</td>
            <td class="n" data-l="Und/caja">${p.unitsPerBox}</td>
            <td class="n" data-l="$ Unidad">${nf2.format(p.unitPrice)}</td>
            <td class="n" data-l="$ Caja">${nf2.format(p.boxPrice)}</td>
            <td data-l="Venta">${esc(p.sellBy)}</td>
            <td class="n ${p.stock <= p.unitsPerBox * 2 ? 'stock-low' : ''}" data-l="Stock">${fmtStock(p.stock, p.unitsPerBox)}</td>
            <td style="white-space:nowrap"><button class="btn btn-sm" data-edit="${esc(p.id)}">Editar</button></td>
          </tr>`).join('')}</tbody></table></div>`;
    let t;
    $('#iq').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { U.invQ = e.target.value; renderInventory(root); $('#iq').focus(); const v = $('#iq').value; $('#iq').setSelectionRange(v.length, v.length); }, 200); };
    $('#icat').onchange = (e) => { U.invCat = e.target.value; renderInventory(root); };
    $('#iNew').onclick = () => productForm(null, root);
    root.querySelector('tbody').onclick = (e) => { const b = e.target.closest('[data-edit]'); if (b) productForm(productById(b.dataset.edit), root); };
    $('#iExp').onclick = () => saveFile('catalogo_' + today() + '.csv', '﻿' + catalogCSV(), 'text/csv;charset=utf-8');
    $('#iImp').onclick = () => importCatalog(root);
  }

  function productForm(p, root) {
    const isNew = !p;
    p = p || { code: '', name: '', presentation: '', category: '', unitsPerBox: 12, unitPrice: 0, boxPrice: 0, sellBy: 'ambos', stock: 0, active: true };
    const upb = p.unitsPerBox || 1;
    const sh = openSheet(`
      <div class="row"><h2 class="grow">${isNew ? 'Nuevo producto' : 'Editar ' + esc(p.code)}</h2><button class="icon-btn" data-close aria-label="Cerrar">×</button></div>
      <form id="pf" style="display:grid;gap:12px;margin-top:10px" autocomplete="off">
        <div class="grid2">
          <label class="field"><span>Código *</span><input name="code" class="input mono" required maxlength="20" value="${esc(p.code)}"></label>
          <label class="field"><span>Categoría *</span><input name="category" class="input" required list="catDl" maxlength="40" value="${esc(p.category)}"></label>
        </div>
        <datalist id="catDl">${categories().map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
        <div class="grid2">
          <label class="field"><span>Nombre base *</span><input name="name" class="input" required maxlength="60" value="${esc(p.name)}" placeholder="Salsa de Pizza"></label>
          <label class="field"><span>Presentación / gramaje *</span><input name="presentation" class="input" required maxlength="30" value="${esc(p.presentation)}" placeholder="340 g"></label>
        </div>
        <div class="grid3">
          <label class="field"><span>Und. por caja</span><input name="unitsPerBox" class="input" inputmode="numeric" value="${upb}"></label>
          <label class="field"><span>Precio unidad $</span><input name="unitPrice" class="input" inputmode="decimal" value="${nf2.format(p.unitPrice)}"></label>
          <label class="field"><span>Precio caja $</span><input name="boxPrice" class="input" inputmode="decimal" value="${nf2.format(p.boxPrice)}"></label>
        </div>
        <div class="grid3">
          <label class="field"><span>Se vende por</span><select name="sellBy" class="select">
            ${[['ambos', 'Caja y unidad'], ['caja', 'Solo caja'], ['unidad', 'Solo unidad']].map(([v, l]) => `<option value="${v}" ${p.sellBy === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="field"><span>Stock cajas</span><input name="stockCj" class="input" inputmode="numeric" value="${Math.floor(Math.max(0, p.stock) / upb)}"></label>
          <label class="field"><span>+ Stock unidades</span><input name="stockUn" class="input" inputmode="numeric" value="${p.stock < 0 ? p.stock : p.stock % upb}"></label>
        </div>
        <label class="row"><input type="checkbox" name="active" ${p.active ? 'checked' : ''} style="width:24px;height:24px"> Activo (visible para vendedores)</label>
        <div class="actions">
          <button class="btn btn-primary" type="submit">Guardar</button>
          ${isNew ? '' : '<button class="btn btn-danger" type="button" id="pDel">Eliminar</button>'}
        </div>
      </form>`);
    const form = $('#pf', sh.el);
    form.unitPrice.onchange = () => { if (!dec(form.boxPrice.value)) form.boxPrice.value = nf2.format(dec(form.unitPrice.value) * (int(form.unitsPerBox.value) || 1)); };
    form.onsubmit = async (e) => {
      e.preventDefault();
      const code = form.code.value.trim().toUpperCase();
      if (S.products.some((x) => x.code.toUpperCase() === code && x.id !== p.id)) { toast('Ya existe un producto con el código ' + code, 'err'); return; }
      const u = Math.max(1, int(form.unitsPerBox.value));
      const doc = {
        ...p, id: p.id || DB.uid('p'), code,
        name: form.name.value.trim(), presentation: form.presentation.value.trim(), category: form.category.value.trim(),
        unitsPerBox: u, unitPrice: Matrix.r2(dec(form.unitPrice.value)), boxPrice: Matrix.r2(dec(form.boxPrice.value)),
        sellBy: form.sellBy.value, stock: int(form.stockCj.value) * u + int(form.stockUn.value),
        active: form.active.checked, deleted: false,
      };
      if (doc.unitPrice < 0 || doc.boxPrice < 0) { toast('Los precios no pueden ser negativos', 'err'); return; }
      await saveProduct(doc); sh.close(); renderInventory(root); toast('Producto guardado', 'ok');
    };
    const del = $('#pDel', sh.el);
    if (del) del.onclick = async () => {
      if (!confirm('¿Eliminar ' + productLabel(p) + '? Los pedidos existentes conservan su copia.')) return;
      await saveProduct({ ...p, deleted: true, active: false }); sh.close(); renderInventory(root); toast('Producto eliminado');
    };
  }

  const CAT_HEAD = ['CODIGO', 'NOMBRE', 'PRESENTACION', 'CATEGORIA', 'UND_X_CAJA', 'PRECIO_UNIDAD', 'PRECIO_CAJA', 'VENTA', 'STOCK_UNIDADES', 'ACTIVO'];
  function catalogCSV() {
    const sep = S.settings.csvSep, d = S.settings.csvDecimal;
    const n = (v) => { const s = Number(v).toFixed(2); return d === ',' ? s.replace('.', ',') : s; };
    const q = (v) => { let s = String(v); if (/^[=+\-@]/.test(s)) s = "'" + s; return (s.includes(sep) || s.includes('"')) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const rows = [CAT_HEAD.join(sep)];
    S.products.slice().sort((a, b) => a.code.localeCompare(b.code, 'es', { numeric: true })).forEach((p) => {
      rows.push([q(p.code), q(p.name), q(p.presentation), q(p.category), p.unitsPerBox, n(p.unitPrice), n(p.boxPrice), p.sellBy, p.stock, p.active ? 'SI' : 'NO'].join(sep));
    });
    return rows.join('\r\n');
  }

  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const first = text.split(/\r?\n/)[0];
    const sep = [';', '\t', ','].sort((a, b) => first.split(b).length - first.split(a).length)[0];
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === sep) { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += c;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim()));
  }

  async function importCatalog(root) {
    const f = await pickFile('.csv,.txt,text/csv'); if (!f) return;
    const rows = parseCSV(await f.text());
    if (rows.length < 2) { toast('El archivo está vacío', 'err'); return; }
    const head = rows[0].map((h) => norm(h).toUpperCase().replace(/[^A-Z_]/g, ''));
    const col = (name) => head.indexOf(name);
    if (col('CODIGO') < 0 || col('NOMBRE') < 0) { toast('Faltan columnas: se requiere al menos CODIGO y NOMBRE', 'err'); return; }
    const byCode = new Map(S.products.map((p) => [p.code.toUpperCase(), p]));
    let created = 0, updated = 0;
    const get = (r, name) => { const i = col(name); return i >= 0 ? String(r[i] || '').trim().replace(/^'/, '') : ''; };
    const docs = [];
    rows.slice(1).forEach((r) => {
      const code = get(r, 'CODIGO').toUpperCase(); if (!code) return;
      const prev = byCode.get(code);
      const upb = Math.max(1, int(get(r, 'UND_X_CAJA')) || (prev ? prev.unitsPerBox : 1));
      const unitPrice = get(r, 'PRECIO_UNIDAD') ? dec(get(r, 'PRECIO_UNIDAD')) : (prev ? prev.unitPrice : 0);
      const doc = {
        ...(prev || { id: DB.uid('p'), active: true, deleted: false }),
        code, name: get(r, 'NOMBRE') || (prev && prev.name) || code,
        presentation: get(r, 'PRESENTACION') || (prev ? prev.presentation : ''),
        category: get(r, 'CATEGORIA') || (prev ? prev.category : 'Sin categoría'),
        unitsPerBox: upb, unitPrice: Matrix.r2(unitPrice),
        boxPrice: Matrix.r2(get(r, 'PRECIO_CAJA') ? dec(get(r, 'PRECIO_CAJA')) : (prev ? prev.boxPrice : unitPrice * upb)),
        sellBy: ['ambos', 'caja', 'unidad'].includes(norm(get(r, 'VENTA'))) ? norm(get(r, 'VENTA')) : (prev ? prev.sellBy : 'ambos'),
        stock: get(r, 'STOCK_UNIDADES') !== '' ? int(get(r, 'STOCK_UNIDADES')) : (prev ? prev.stock : 0),
        active: get(r, 'ACTIVO') ? norm(get(r, 'ACTIVO')) !== 'no' : (prev ? prev.active : true),
        deleted: false,
      };
      DB.touch(doc); docs.push(doc); byCode.set(code, doc);
      prev ? updated++ : created++;
    });
    await DB.putMany('products', docs);
    await loadAll(); notifyChange();
    renderInventory(root);
    toast(`Catálogo importado: ${created} nuevos, ${updated} actualizados`, 'ok');
  }

  /* --------------------------- Vendedores --------------------------- */
  function renderSellers(root) {
    const list = S.sellers.slice().sort((a, b) => a.name.localeCompare(b.name, 'es'));
    root.innerHTML = `
      <div class="card card-pad" style="max-width:640px">
        <p class="muted" style="margin-top:0">Los vendedores activos aparecen en el menú de inicio. No usan contraseña.</p>
        <form id="sNew" class="row" style="margin-bottom:14px"><input class="input grow" name="n" placeholder="Nombre (ej: María P.)" maxlength="30" required><button class="btn btn-primary">＋ Agregar</button></form>
        ${list.map((s) => `
          <div class="row" style="padding:8px 0;border-top:1px solid var(--line)">
            <input class="input grow" data-rename="${esc(s.id)}" value="${esc(s.name)}" maxlength="30" aria-label="Nombre">
            <label class="row" style="white-space:nowrap"><input type="checkbox" data-active="${esc(s.id)}" ${s.active ? 'checked' : ''} style="width:22px;height:22px"> Activo</label>
          </div>`).join('')}
      </div>`;
    $('#sNew').onsubmit = async (e) => {
      e.preventDefault();
      const name = e.target.n.value.trim(); if (!name) return;
      await saveSeller({ id: DB.uid('s'), name, active: true, deleted: false });
      renderSellers(root); toast('Vendedor agregado', 'ok');
    };
    root.onchange = async (e) => {
      const r = e.target.closest('[data-rename]'), a = e.target.closest('[data-active]');
      if (r) { const s = sellerById(r.dataset.rename); const v = r.value.trim(); if (s && v) { s.name = v; await saveSeller(s); toast('Guardado', 'ok'); } }
      if (a) { const s = sellerById(a.dataset.active); if (s) { s.active = a.checked; await saveSeller(s); } }
    };
  }

  /* ----------------------------- Ajustes ----------------------------- */
  function renderSettings(root) {
    const st = S.settings;
    root.innerHTML = `
      <div style="display:grid;gap:16px;max-width:760px">
        <section class="card card-pad">
          <h3 style="margin-top:0">Sincronización con el servidor</h3>
          <p class="muted">Los teléfonos guardan todo localmente y suben los pedidos cuando hay señal. La clave admin permite a este equipo publicar catálogo y vendedores.</p>
          <div style="display:grid;gap:10px">
            <label class="field"><span>URL del endpoint</span><input id="cUrl" class="input" placeholder="${esc(Sync.DEFAULT_SYNC_URL)}" value="${esc(st.syncUrl)}"></label>
            <div class="sheet-like grid2" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <label class="field"><span>Clave de sync (todos)</span><input id="cKey" class="input" type="password" autocomplete="off" value="${esc(st.syncKey)}"></label>
              <label class="field"><span>Clave admin (oficina)</span><input id="cAdmin" class="input" type="password" autocomplete="off" value="${esc(st.adminKey)}"></label>
            </div>
            <div class="row wrap"><button class="btn btn-primary" id="cSave">Guardar y sincronizar</button><span class="muted" id="cLast"></span></div>
          </div>
        </section>
        <section class="card card-pad">
          <h3 style="margin-top:0">Moneda y Excel</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
            <label class="field"><span>Tasa Bs por USD</span><input id="cRate" class="input" inputmode="decimal" value="${st.exchangeRate ? nf2.format(st.exchangeRate) : ''}" placeholder="Ej: 36,50"></label>
            <label class="field"><span>Separador CSV</span><select id="cSep" class="select">
              <option value=";" ${st.csvSep === ';' ? 'selected' : ''}>Punto y coma ( ; ) — Excel en español</option>
              <option value="," ${st.csvSep === ',' ? 'selected' : ''}>Coma ( , ) — Excel en inglés</option></select></label>
            <label class="field"><span>Decimal</span><select id="cDec" class="select">
              <option value="," ${st.csvDecimal === ',' ? 'selected' : ''}>Coma (1234,50)</option>
              <option value="." ${st.csvDecimal === '.' ? 'selected' : ''}>Punto (1234.50)</option></select></label>
          </div>
          <div class="row" style="margin-top:12px"><button class="btn" id="cSave2">Guardar</button></div>
        </section>
        <section class="card card-pad">
          <h3 style="margin-top:0">Intercambio por archivo (sin servidor)</h3>
          <p class="muted">Importa los archivos que los vendedores envían por WhatsApp, o genera un paquete con el catálogo para cargarlo en los teléfonos.</p>
          <div class="row wrap">
            <button class="btn btn-primary" id="bImp">⇩ Importar pedidos / respaldo</button>
            <button class="btn" id="bCat">⇪ Paquete de catálogo para teléfonos</button>
            <button class="btn" id="bAll">⇪ Respaldo completo</button>
          </div>
        </section>
        <p class="muted" style="font-size:13px">Almacenamiento: ${DB.isFallback ? 'localStorage (modo limitado)' : 'IndexedDB'} · Equipo <span class="mono" id="devId"></span></p>
      </div>`;
    Sync.deviceId().then((id) => { $('#devId').textContent = id.slice(0, 12); });
    DB.getMeta('lastSyncAt', null).then((t) => { const el = $('#cLast'); if (el && t) el.textContent = 'Último sync: ' + new Date(t).toLocaleString('es-VE'); });
    $('#cSave').onclick = async () => {
      await saveSettings({ syncUrl: $('#cUrl').value.trim(), syncKey: $('#cKey').value.trim(), adminKey: $('#cAdmin').value.trim() });
      await runSync(true); renderSettings(root);
    };
    $('#cSave2').onclick = async () => {
      await saveSettings({ exchangeRate: dec($('#cRate').value), csvSep: $('#cSep').value, csvDecimal: $('#cDec').value });
      toast('Ajustes guardados', 'ok');
    };
    $('#bImp').onclick = async () => {
      const f = await pickFile('.json,application/json'); if (!f) return;
      try { const n = await Sync.importBundle(JSON.parse(await f.text()), !!S.settings.adminKey); await loadAll(); toast(n + ' registros importados', 'ok'); }
      catch (e) { toast(e.message || 'Archivo inválido', 'err'); }
    };
    $('#bCat').onclick = async () => {
      const b = await Sync.exportBundle({ sellerId: '__none__', includeCatalog: true });
      saveFile('catalogo_telefonos_' + today() + '.json', JSON.stringify(b), 'application/json');
    };
    $('#bAll').onclick = async () => {
      const b = await Sync.exportBundle({ includeCatalog: true });
      saveFile('respaldo_' + today() + '.json', JSON.stringify(b), 'application/json');
    };
  }

  /* =============================== Arranque =============================== */
  async function boot() {
    try {
      await DB.open();
      await Seed.ensureSeed();
      await loadAll();
    } catch (e) {
      app.innerHTML = `<div class="empty"><strong>No se pudo abrir la base local</strong>${esc(e.message)}</div>`;
      return;
    }
    DB.requestPersistence();
    window.addEventListener('hashchange', render);
    window.addEventListener('online', () => { updateSyncPill(); runSync(false); });
    window.addEventListener('offline', updateSyncPill);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) runSync(false); });
    // Otra pestaña del mismo navegador cambió datos → refrescar (tiempo real local)
    if (bc) bc.onmessage = async () => { await loadAll(); refreshAfterRemote(); };
    app.addEventListener('focusout', flushDeferredRender);
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW no registrado', e));
    }
    render();
    scheduleSync(1500);
  }
  boot();
})();

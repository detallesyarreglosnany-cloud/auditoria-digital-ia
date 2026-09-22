/* =========================================================================
 * sync.js — Sincronización offline-first
 *
 * Dos canales, mismas reglas de fusión:
 *   1. HTTP  → POST {syncUrl}  (endpoint /api/pedidos/sync del mismo host)
 *   2. Archivo → paquete JSON exportado/importado (WhatsApp, USB, correo)
 *      para cuando no hay servidor o no hay datos en la calle.
 *
 * Reglas de fusión (idénticas en cliente y servidor):
 *   - Last-write-wins por updatedAt.
 *   - Catálogo (products/sellers): la oficina es la autoridad. Un equipo sin
 *     clave admin SIEMPRE acepta la versión remota y nunca sube catálogo.
 *   - Pedidos: un pedido "despachado" queda congelado; la versión local de un
 *     vendedor no puede pisarlo.
 * ========================================================================= */
(function (global) {
  'use strict';

  const DEFAULT_SYNC_URL = '/api/pedidos/sync';
  const INITIAL_ORDER_DAYS = 14; // historial que baja un teléfono nuevo
  let running = null;

  async function settings() {
    return DB.getMeta('settings', {});
  }

  async function deviceId() {
    let id = await DB.getMeta('deviceId', null);
    if (!id) { id = DB.uid('dev'); await DB.setMeta('deviceId', id); }
    return id;
  }

  function newer(a, b) {
    return String(a && a.updatedAt || '') > String(b && b.updatedAt || '');
  }

  /** Fusiona documentos remotos en el store local. Devuelve cuántos cambió. */
  async function mergeRemote(store, remoteDocs, isAdmin, markDirty) {
    if (!remoteDocs || !remoteDocs.length) return 0;
    const locals = await DB.getAll(store);
    const byId = new Map(locals.map((d) => [d.id, d]));
    const toPut = [];
    remoteDocs.forEach((r) => {
      const l = byId.get(r.id);
      if (l && l.dirty) {
        if (store === 'orders') {
          const frozen = r.status === 'despachado';
          if (!frozen && newer(l, r)) return; // mi cambio local es más reciente
        } else if (isAdmin && newer(l, r)) {
          return; // la oficina editó después: se subirá en el próximo push
        }
      }
      if (l && !l.dirty && l.updatedAt === r.updatedAt) return; // idéntico
      toPut.push({ ...r, dirty: !!markDirty });
    });
    await DB.putMany(store, toPut);
    return toPut.length;
  }

  /** Quita la marca dirty solo si el doc no cambió mientras se subía. */
  async function clearDirty(store, pushedDocs) {
    const toPut = [];
    for (const p of pushedDocs) {
      const cur = await DB.get(store, p.id);
      if (cur && cur.dirty && cur.updatedAt === p.updatedAt) toPut.push({ ...cur, dirty: false });
    }
    await DB.putMany(store, toPut);
  }

  async function collectDirty(isAdmin) {
    const [orders, products, sellers] = await Promise.all(
      ['orders', 'products', 'sellers'].map((s) => DB.getAll(s))
    );
    const strip = (d) => { const c = { ...d }; delete c.dirty; return c; };
    return {
      orders: orders.filter((d) => d.dirty).map(strip),
      products: isAdmin ? products.filter((d) => d.dirty).map(strip) : [],
      sellers: isAdmin ? sellers.filter((d) => d.dirty).map(strip) : [],
    };
  }

  /**
   * Sincroniza contra el servidor. scope = { sellerId } para teléfonos
   * (solo baja sus propios pedidos) o {} para la oficina (todos).
   */
  async function syncNow(scope) {
    if (running) return running;
    running = (async () => {
      if (!navigator.onLine) return { ok: false, offline: true };
      const cfg = await settings();
      const url = cfg.syncUrl || DEFAULT_SYNC_URL;
      const isAdmin = !!cfg.adminKey;
      const since = await DB.getMeta('syncCursor', null);
      const push = await collectDirty(isAdmin);

      const headers = { 'Content-Type': 'application/json' };
      if (cfg.syncKey) headers['x-sync-key'] = cfg.syncKey;
      if (cfg.adminKey) headers['x-admin-key'] = cfg.adminKey;

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      let res;
      try {
        res = await fetch(url, {
          method: 'POST', headers, signal: ctrl.signal,
          body: JSON.stringify({
            deviceId: await deviceId(),
            since,
            sinceDays: since ? null : INITIAL_ORDER_DAYS,
            sellerId: scope && scope.sellerId || null,
            push,
          }),
        });
      } catch (e) {
        return { ok: false, error: 'Sin conexión con el servidor' };
      } finally { clearTimeout(timer); }

      if (!res.ok) {
        let msg = 'Error ' + res.status;
        try { msg = (await res.json()).error || msg; } catch (e) { /* noop */ }
        return { ok: false, error: msg, status: res.status };
      }
      const data = await res.json();

      // 1) Lo aceptado por el servidor deja de estar pendiente
      await clearDirty('orders', push.orders.filter((d) => (data.accepted.orders || []).includes(d.id)));
      await clearDirty('products', push.products.filter((d) => (data.accepted.products || []).includes(d.id)));
      await clearDirty('sellers', push.sellers.filter((d) => (data.accepted.sellers || []).includes(d.id)));

      // 2) Lo rechazado vuelve con la versión del servidor (ya despachado, o
      //    el servidor tiene una edición más reciente)
      const rejected = (data.rejected || []).filter((r) => r.doc && ['orders', 'products', 'sellers'].includes(r.kind));
      for (const r of rejected) await DB.put(r.kind, { ...r.doc, dirty: false });
      const rejectedOrders = rejected.filter((r) => r.kind === 'orders');

      // 3) Bajar cambios remotos
      const changed =
        (await mergeRemote('products', data.pull.products, isAdmin)) +
        (await mergeRemote('sellers', data.pull.sellers, isAdmin)) +
        (await mergeRemote('orders', data.pull.orders, isAdmin));

      await DB.setMeta('syncCursor', data.serverTime);
      await DB.setMeta('lastSyncAt', new Date().toISOString());
      return {
        ok: true,
        pushed: push.orders.length + push.products.length + push.sellers.length,
        pulled: changed,
        rejected: rejectedOrders.length,
      };
    })();
    try { return await running; } finally { running = null; }
  }

  async function pendingCount() {
    const cfg = await settings();
    const d = await collectDirty(!!cfg.adminKey);
    return d.orders.length + d.products.length + d.sellers.length;
  }

  /* ---------------- Canal 2: paquete de archivo ---------------- */

  /** Paquete con los pedidos de un vendedor (o todo, si es la oficina). */
  async function exportBundle(opts) {
    const all = await DB.getAll('orders');
    const orders = all.filter((o) =>
      (!opts.sellerId || o.sellerId === opts.sellerId) &&
      (!opts.routeDate || o.routeDate === opts.routeDate));
    const bundle = {
      format: 'distribuidora-pedidos/v1',
      exportedAt: new Date().toISOString(),
      deviceId: await deviceId(),
      orders: orders.map((o) => { const c = { ...o }; delete c.dirty; return c; }),
    };
    if (opts.includeCatalog) {
      bundle.products = (await DB.getAll('products')).map((p) => { const c = { ...p }; delete c.dirty; return c; });
      bundle.sellers = (await DB.getAll('sellers')).map((s) => { const c = { ...s }; delete c.dirty; return c; });
    }
    return bundle;
  }

  async function importBundle(bundle, isAdmin) {
    if (!bundle || bundle.format !== 'distribuidora-pedidos/v1') {
      throw new Error('Archivo no reconocido (formato inválido)');
    }
    const n =
      // markDirty: si este equipo también sincroniza con servidor, los
      // pedidos importados por archivo se reenvían en el próximo sync.
      (await mergeRemote('orders', bundle.orders || [], isAdmin, true)) +
      (await mergeRemote('products', bundle.products || [], false)) +
      (await mergeRemote('sellers', bundle.sellers || [], false));
    return n;
  }

  global.Sync = { syncNow, pendingCount, exportBundle, importBundle, deviceId, DEFAULT_SYNC_URL };
})(window);

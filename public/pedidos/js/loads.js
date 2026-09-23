/* =========================================================================
 * loads.js — Hojas de carga (lógica pura: recibe datos, devuelve cambios)
 *
 * Ciclo de vida de un pedido:
 *   abierto ─(vendedor cierra)→ enviado ─(armado automático)→ en_carga
 *   en_carga ─(oficina: "pasar a espera")→ en_espera ─(reincorporar)→ enviado
 *   en_carga ─(oficina aprueba la hoja)→ despachado (+ Nº de nota de entrega)
 *
 * Una hoja de carga agrupa pedidos de UN vendedor y UNA ruta, hasta
 * config.load.limit (900) bultos o config.load.maxClients (32) clientes.
 * Si al sumar un pedido se pasa del tope, se abre otra hoja: pueden existir
 * varias "Esperando aprobación" a la vez. Un pedido que por sí solo supera
 * el tope ocupa una hoja propia y se marca como excedida para que la oficina
 * ajuste cantidades.
 *
 * Estados de la hoja: 'espera' (Esperando aprobación) → 'aprobada' (archivada).
 * ========================================================================= */
(function (global) {
  'use strict';

  const STATUS_LABEL = { espera: 'Esperando aprobación', aprobada: 'Carga aprobada' };
  const ORDER_LABEL = {
    abierto: 'Abierto', enviado: 'Enviado', en_carga: 'En hoja de carga',
    en_espera: 'Carga en espera', despachado: 'Despachado',
  };

  function limits(cfg) {
    const l = (cfg && cfg.load) || {};
    return { limit: +l.limit || 900, maxClients: +l.maxClients || 32, measure: l.measure === 'unidades' ? 'unidades' : 'bultos' };
  }

  /** Lo que un pedido ocupa en la hoja según la medida configurada. */
  function measure(order, cfg) {
    const t = Matrix.orderTotals(order);
    return limits(cfg).measure === 'unidades' ? t.totalUnidades : t.bultos;
  }

  function loadOrders(load, ordersById) {
    return (load.orderIds || []).map((id) => ordersById.get(id)).filter((o) => o && !o.deleted);
  }

  function usage(load, ordersById, cfg) {
    const L = limits(cfg);
    const os = loadOrders(load, ordersById);
    const used = os.reduce((a, o) => a + measure(o, cfg), 0);
    return {
      used, clients: os.length, limit: L.limit, maxClients: L.maxClients, measure: L.measure,
      pct: Math.min(100, Math.round((used / L.limit) * 100)),
      pctClients: Math.min(100, Math.round((os.length / L.maxClients) * 100)),
      full: used >= L.limit || os.length >= L.maxClients,
      over: used > L.limit || os.length > L.maxClients,
    };
  }

  function routeOf(order, sellersById) {
    if (order.route) return order.route;
    const s = sellersById.get(order.sellerId);
    return (s && s.routes && s.routes[0]) || '';
  }

  /**
   * Armado automático (primer ajuste): cada pedido "enviado" entra en la
   * primera hoja abierta de su vendedor+ruta donde quepa; si no cabe en
   * ninguna, se abre una hoja nueva.
   * @returns {{loads: Array, orders: Array}} documentos a guardar
   */
  function autoPack(state) {
    const { orders, loads, sellers, config } = state;
    const L = limits(config);
    const ordersById = new Map(orders.map((o) => [o.id, o]));
    const sellersById = new Map(sellers.map((s) => [s.id, s]));
    const changedLoads = new Map(), changedOrders = [];

    const queue = orders
      .filter((o) => !o.deleted && o.status === 'enviado' && !o.loadId && Matrix.orderTotals(o).items > 0)
      .sort((a, b) => String(a.sentAt || a.updatedAt).localeCompare(String(b.sentAt || b.updatedAt)));
    if (!queue.length) return { loads: [], orders: [] };

    const open = loads.filter((l) => !l.deleted && l.status === 'espera')
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

    queue.forEach((o) => {
      const route = routeOf(o, sellersById);
      const m = measure(o, config);
      let target = open.find((l) => {
        if (l.sellerId !== o.sellerId || (l.route || '') !== route) return false;
        const u = usage(l, ordersById, config);
        return u.clients === 0 || (u.clients < L.maxClients && u.used + m <= L.limit);
      });
      if (!target) {
        const s = sellersById.get(o.sellerId);
        target = {
          id: DB.uid('l'), status: 'espera', number: null,
          sellerId: o.sellerId, sellerName: s ? s.name : o.sellerName,
          route, dispatcherId: '', dispatcherName: '',
          orderIds: [], createdAt: DB.now(), approvedAt: null, notes: '', deleted: false,
        };
        open.push(target);
      }
      target.orderIds = (target.orderIds || []).concat(o.id);
      changedLoads.set(target.id, target);
      const upd = { ...o, loadId: target.id, status: 'en_carga', route };
      ordersById.set(o.id, upd);
      changedOrders.push(upd);
    });
    return { loads: [...changedLoads.values()], orders: changedOrders };
  }

  /** Sacar un cliente de la hoja: su pedido queda en cola ("Carga en espera"). */
  function hold(load, order) {
    return {
      load: { ...load, orderIds: (load.orderIds || []).filter((id) => id !== order.id) },
      order: { ...order, loadId: null, status: 'en_espera', heldAt: DB.now() },
    };
  }

  /** Devolver a la cola de armado: el próximo autoPack lo ubica en una hoja. */
  function release(order) {
    return { ...order, status: 'enviado', loadId: null, sentAt: order.sentAt || DB.now() };
  }

  /**
   * Aprobar (cerrar) la carga: numera la hoja y las notas de entrega,
   * marca los pedidos como despachados, descuenta inventario y guarda un
   * resumen para el archivo.
   */
  function approve(load, state, dispatcher) {
    const { orders, products, config } = state;
    const ordersById = new Map(orders.map((o) => [o.id, o]));
    const os = loadOrders(load, ordersById);
    const cfg = { ...config, counters: { load: 0, note: 0, ...(config.counters || {}) } };
    cfg.counters.load += 1;
    const ts = DB.now();

    const productsById = new Map(products.map((p) => [p.id, p]));
    const delta = new Map();
    const updOrders = os.map((o) => {
      Object.entries(o.lines || {}).forEach(([pid, l]) => {
        delta.set(pid, (delta.get(pid) || 0) + Matrix.lineTotals(l).totalUnidades);
      });
      cfg.counters.note += 1;
      return { ...o, status: 'despachado', dispatchedAt: ts, noteNumber: cfg.counters.note, loadNumber: cfg.counters.load };
    });
    const updProducts = [];
    delta.forEach((units, pid) => {
      const p = productsById.get(pid);
      // Productos sin control de inventario (stock vacío) no se descuentan
      if (p && p.stock !== null && p.stock !== undefined && p.stock !== '') updProducts.push({ ...p, stock: (+p.stock || 0) - units });
    });

    const tot = updOrders.reduce((a, o) => {
      const t = Matrix.orderTotals(o);
      a.cajas += t.cajas; a.unidades += t.unidades; a.bultos += t.bultos;
      a.totalUnidades += t.totalUnidades; a.monto = Matrix.r2(a.monto + t.monto);
      return a;
    }, { cajas: 0, unidades: 0, bultos: 0, totalUnidades: 0, monto: 0 });

    const updLoad = {
      ...load, status: 'aprobada', number: cfg.counters.load, approvedAt: ts,
      dispatcherId: dispatcher.id, dispatcherName: dispatcher.name,
      routeDate: ts.slice(0, 10),
      totals: { clients: updOrders.length, ...tot },
      firstNote: updOrders.length ? updOrders[0].noteNumber : null,
      lastNote: updOrders.length ? updOrders[updOrders.length - 1].noteNumber : null,
    };
    return { load: updLoad, orders: updOrders, products: updProducts, config: cfg };
  }

  /** Faltantes de inventario para una hoja (unidades pedidas vs stock). */
  function shortages(os, products) {
    const need = new Map();
    os.forEach((o) => Object.entries(o.lines || {}).forEach(([pid, l]) => {
      need.set(pid, (need.get(pid) || 0) + Matrix.lineTotals(l).totalUnidades);
    }));
    const byId = new Map(products.map((p) => [p.id, p]));
    const out = [];
    need.forEach((units, pid) => {
      const p = byId.get(pid);
      if (p && p.stock !== null && p.stock !== undefined && p.stock !== '' && units > (+p.stock || 0)) out.push({ product: p, need: units, stock: +p.stock || 0 });
    });
    return out;
  }

  const fmtNum = (n, w) => String(n || 0).padStart(w || 5, '0');

  global.Loads = {
    STATUS_LABEL, ORDER_LABEL, limits, measure, usage, loadOrders,
    autoPack, hold, release, approve, shortages,
    loadCode: (l) => l.number ? 'C-' + fmtNum(l.number) : 'Borrador',
    noteCode: (n) => 'NE-' + fmtNum(n, 6),
  };
})(window);

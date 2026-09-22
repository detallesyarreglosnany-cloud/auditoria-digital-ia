/* =========================================================================
 * seed.js — Datos iniciales (solo se cargan si la base local está vacía)
 *
 * Catálogo de demostración (~110 SKUs) generado a partir de
 * [base, [presentaciones]] para reflejar la realidad de una distribuidora:
 * un mismo producto base con varios gramajes/volúmenes y su empaque por caja.
 * La oficina lo reemplaza desde Inventario (o importando un CSV).
 * ========================================================================= */
(function (global) {
  'use strict';

  const SELLERS = [
    { id: 's_lucas', name: 'Lucas Ch.' },
    { id: 's_luis', name: 'Luis R.' },
    { id: 's_fanny', name: 'Fanny A.' },
    { id: 's_adrian', name: 'Adrián M.' },
  ];

  // [prefijo, categoría, [ [nombre base, [ [presentación, und/caja, $unidad, venta] ...] ] ]]
  // venta: 'ambos' | 'caja' | 'unidad'
  const CATALOG = [
    ['REF', 'Refrescos', [
      ['Refresco Cola', [['355 ml lata', 24, 0.70, 'ambos'], ['1 L', 12, 1.10, 'ambos'], ['1,5 L', 6, 1.45, 'ambos'], ['2 L', 6, 1.80, 'ambos']]],
      ['Refresco Naranja', [['355 ml lata', 24, 0.65, 'ambos'], ['1,5 L', 6, 1.35, 'ambos'], ['2 L', 6, 1.70, 'ambos']]],
      ['Refresco Uva', [['355 ml lata', 24, 0.65, 'ambos'], ['1,5 L', 6, 1.35, 'ambos'], ['2 L', 6, 1.70, 'ambos']]],
      ['Refresco Limón', [['355 ml lata', 24, 0.65, 'ambos'], ['2 L', 6, 1.70, 'ambos']]],
      ['Refresco Colita', [['355 ml', 24, 0.60, 'ambos'], ['2 L', 6, 1.60, 'ambos']]],
      ['Refresco Piña', [['355 ml', 24, 0.60, 'ambos'], ['2 L', 6, 1.60, 'ambos']]],
      ['Refresco Cola Zero', [['355 ml lata', 24, 0.75, 'ambos'], ['1,5 L', 6, 1.55, 'ambos']]],
    ]],
    ['AGU', 'Aguas', [
      ['Agua Mineral', [['355 ml', 24, 0.30, 'caja'], ['600 ml', 24, 0.40, 'caja'], ['1,5 L', 6, 0.75, 'ambos'], ['5 L', 2, 1.60, 'ambos']]],
      ['Agua con Gas', [['355 ml', 24, 0.45, 'caja'], ['1,5 L', 6, 0.95, 'ambos']]],
      ['Agua Saborizada', [['500 ml', 12, 0.80, 'ambos']]],
      ['Bebida Isotónica', [['500 ml', 12, 1.20, 'ambos'], ['1 L', 6, 1.90, 'ambos']]],
    ]],
    ['CER', 'Cervezas', [
      ['Cerveza Pilsen', [['222 ml tercio', 36, 0.55, 'caja'], ['355 ml lata', 24, 0.85, 'caja'], ['1 L', 12, 2.20, 'caja']]],
      ['Cerveza Light', [['222 ml tercio', 36, 0.58, 'caja'], ['355 ml lata', 24, 0.90, 'caja']]],
      ['Cerveza Premium', [['250 ml', 24, 0.95, 'caja'], ['355 ml lata', 24, 1.10, 'caja']]],
      ['Cerveza Negra', [['355 ml lata', 24, 1.05, 'caja']]],
    ]],
    ['MAL', 'Maltas', [
      ['Malta', [['222 ml', 36, 0.50, 'caja'], ['355 ml lata', 24, 0.75, 'ambos'], ['1,5 L', 6, 1.60, 'ambos']]],
      ['Malta Light', [['355 ml lata', 24, 0.78, 'ambos']]],
    ]],
    ['JUG', 'Jugos y Néctares', [
      ['Néctar Durazno', [['250 ml', 24, 0.55, 'ambos'], ['1 L', 12, 1.60, 'ambos']]],
      ['Néctar Pera', [['250 ml', 24, 0.55, 'ambos'], ['1 L', 12, 1.60, 'ambos']]],
      ['Jugo Naranja', [['1 L', 12, 1.90, 'ambos']]],
      ['Té Frío Limón', [['500 ml', 12, 0.90, 'ambos'], ['1,5 L', 6, 1.70, 'ambos']]],
    ]],
    ['CON', 'Confitería', [
      ['Chocolate con Leche', [['20 g', 24, 0.35, 'caja'], ['40 g', 24, 0.60, 'caja'], ['100 g', 12, 1.40, 'ambos']]],
      ['Chocolate Relleno', [['30 g', 24, 0.50, 'caja']]],
      ['Caramelo Surtido', [['bolsa 100 und', 12, 2.10, 'ambos']]],
      ['Chupeta', [['bolsa 50 und', 12, 2.40, 'ambos']]],
      ['Chicle', [['caja 100 und', 10, 2.80, 'ambos']]],
      ['Gomitas', [['30 g', 24, 0.40, 'caja'], ['90 g', 12, 1.10, 'ambos']]],
      ['Turrón de Maní', [['25 g', 24, 0.30, 'caja']]],
    ]],
    ['GAL', 'Galletas', [
      ['Galleta Soda', [['paquete 9 und', 12, 1.30, 'ambos'], ['tubo 3 und', 24, 0.45, 'caja']]],
      ['Galleta María', [['200 g', 24, 0.85, 'ambos'], ['400 g', 12, 1.55, 'ambos']]],
      ['Galleta Rellena Chocolate', [['36 g', 24, 0.35, 'caja'], ['6 x 36 g', 12, 1.90, 'ambos']]],
      ['Galleta Rellena Vainilla', [['36 g', 24, 0.35, 'caja'], ['6 x 36 g', 12, 1.90, 'ambos']]],
      ['Wafer', [['25 g', 24, 0.30, 'caja'], ['100 g', 12, 0.95, 'ambos']]],
    ]],
    ['SNK', 'Snacks', [
      ['Papas Fritas Clásicas', [['25 g', 24, 0.45, 'caja'], ['45 g', 24, 0.80, 'caja'], ['140 g', 12, 2.10, 'ambos']]],
      ['Tostones de Plátano', [['30 g', 24, 0.50, 'caja'], ['100 g', 12, 1.50, 'ambos']]],
      ['Chicharrón', [['30 g', 24, 0.55, 'caja']]],
      ['Maní Salado', [['40 g', 24, 0.40, 'caja'], ['200 g', 12, 1.60, 'ambos']]],
      ['Palitos de Queso', [['30 g', 24, 0.40, 'caja']]],
      ['Doritos Picante', [['45 g', 24, 0.85, 'caja']]],
    ]],
    ['SAL', 'Salsas y Aderezos', [
      ['Salsa de Tomate', [['198 g', 24, 0.70, 'ambos'], ['397 g', 24, 1.20, 'ambos'], ['1 kg', 12, 2.60, 'ambos']]],
      ['Salsa de Pizza', [['340 g', 12, 1.40, 'ambos'], ['500 g', 12, 1.95, 'ambos'], ['1 kg', 6, 3.40, 'ambos']]],
      ['Salsa para Pasta', [['340 g', 12, 1.50, 'ambos'], ['490 g', 12, 2.05, 'ambos']]],
      ['Mayonesa', [['175 g', 24, 0.95, 'ambos'], ['445 g', 12, 2.10, 'ambos'], ['910 g', 12, 3.80, 'ambos'], ['3,6 kg galón', 4, 12.50, 'ambos']]],
      ['Mostaza', [['200 g', 24, 0.80, 'ambos'], ['400 g', 12, 1.35, 'ambos']]],
      ['Salsa Inglesa', [['150 ml', 24, 0.90, 'ambos']]],
      ['Salsa de Soya', [['150 ml', 24, 0.85, 'ambos']]],
      ['Salsa Picante', [['60 ml', 24, 0.60, 'ambos'], ['150 ml', 24, 1.05, 'ambos']]],
      ['Vinagre', [['500 ml', 12, 0.70, 'ambos'], ['1 L', 12, 1.10, 'ambos']]],
    ]],
    ['VIV', 'Víveres', [
      ['Harina de Maíz Precocida', [['1 kg', 20, 1.15, 'ambos']]],
      ['Arroz Blanco', [['1 kg', 24, 1.25, 'ambos']]],
      ['Pasta Larga', [['500 g', 24, 0.95, 'ambos'], ['1 kg', 12, 1.80, 'ambos']]],
      ['Pasta Corta', [['500 g', 24, 0.95, 'ambos'], ['1 kg', 12, 1.80, 'ambos']]],
      ['Aceite Vegetal', [['1 L', 12, 2.90, 'ambos'], ['500 ml', 24, 1.55, 'ambos']]],
      ['Azúcar', [['1 kg', 20, 1.30, 'ambos']]],
      ['Café Molido', [['250 g', 24, 2.40, 'ambos'], ['500 g', 12, 4.50, 'ambos']]],
      ['Leche en Polvo', [['400 g', 24, 4.20, 'ambos'], ['900 g', 12, 8.90, 'ambos']]],
    ]],
  ];

  function round2(n) { return Math.round(n * 100) / 100; }

  function buildProducts() {
    const out = [];
    const ts = new Date().toISOString();
    CATALOG.forEach(([prefix, category, bases]) => {
      let n = 1;
      bases.forEach(([base, presentations]) => {
        presentations.forEach(([presentation, upb, unitPrice, sellBy]) => {
          const code = prefix + '-' + String(n++).padStart(3, '0');
          out.push({
            id: 'p_' + code.toLowerCase(),
            code,
            name: base,
            presentation,
            category,
            unitsPerBox: upb,
            unitPrice: round2(unitPrice),
            // Precio de caja con ~5% de descuento mayorista sobre el unitario
            boxPrice: round2(unitPrice * upb * 0.95),
            sellBy,
            stock: upb * (20 + ((out.length * 37) % 80)), // stock en UNIDADES
            active: true,
            updatedAt: ts,
            deleted: false,
            // dirty=true: si este equipo es la oficina (con clave admin),
            // el primer sync publica el catálogo en el servidor.
            dirty: true,
          });
        });
      });
    });
    return out;
  }

  function buildSellers() {
    const ts = new Date().toISOString();
    return SELLERS.map((s) => ({ ...s, active: true, updatedAt: ts, deleted: false, dirty: true }));
  }

  /** Carga el seed una sola vez por dispositivo. */
  async function ensureSeed() {
    const seeded = await DB.getMeta('seeded', false);
    if (seeded) return false;
    const [p, s] = await Promise.all([DB.getAll('products'), DB.getAll('sellers')]);
    if (!p.length) await DB.putMany('products', buildProducts());
    if (!s.length) await DB.putMany('sellers', buildSellers());
    await DB.setMeta('seeded', true);
    return true;
  }

  global.Seed = { ensureSeed, buildProducts, buildSellers };
})(window);

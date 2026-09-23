# Puerto Venado · PWA de pedidos, hojas de carga y despacho

App web instalable y **offline-first** de Distribuidora de Suministros Puerto Venado.
- **Vendedores:** usan el teléfono en la calle.
- **Oficina:** usa la PC para armar las cargas, aprobar el despacho, llevar el inventario y el archivo.

Vive en `public/pedidos/` (HTML + CSS + JS sin dependencias ni CDN) y se abre en `/pedidos`.
La sincronización pasa por `POST /api/pedidos/sync`, protegida con clave.

```
public/pedidos/
├── index.html, styles.css, manifest.webmanifest, sw.js
├── icons/        logo (login, impresión), íconos PWA
├── fonts/        Oswald (OFL) para funcionar sin internet
├── vendor/       SheetJS: lector de Excel, se carga solo al importar
└── js/
    ├── db.js        IndexedDB: products, sellers, clients, orders, loads, config, meta
    ├── seed.js      estructura inicial: vendedores+rutas, despachadores, límites (sin demo)
    ├── sync.js      sincronización HTTP + paquetes .json (WhatsApp / respaldo)
    ├── matrix.js    matriz productos × clientes + exportación Excel/CSV
    ├── loads.js     hojas de carga: armado automático, espera, aprobación
    ├── print.js     hoja de carga (sin precios) y notas de entrega (original + copia)
    ├── importer.js  Excel/CSV → catálogo y cartera, clasificador de rubros
    ├── app.js       núcleo + login + pantalla del vendedor
    └── office.js    oficina: Cargas, Pedidos, Archivo, Inventario, Clientes, Vendedores, Ajustes
```

> **Datos sensibles fuera del repositorio.** El repositorio es público. Por eso la lista de precios
> y la cartera de clientes (RIF, teléfonos) **no** están en el código. Llegan en el
> *paquete de arranque* (`puerto-venado-arranque.json`), que la oficina importa una sola vez.
> Desde ahí viajan solo por la sincronización, protegida con clave.

## 1. Flujo operativo

```
VENDEDOR (teléfono)                 OFICINA (PC)
abierto ──cierra y envía──▶ enviado ──armado automático──▶ en_carga (Hoja "Esperando aprobación")
                                         │  ✎ editar cantidades / ⏸ pasar a espera ──▶ en_espera
                                         │  ↩ reincorporar ──▶ vuelve a la cola
                                         └─ ✓ Aprobar carga ──▶ despachado · Nº de carga · Nº de nota
                                                                · descuenta inventario · Archivo
```

- **Hoja de carga:** agrupa los pedidos de **un vendedor y una ruta**. El tope es **900 bultos o 32 clientes**, configurable en Ajustes. Bultos = cajas + unidades sueltas; se puede cambiar a "unidades totales".
  - Si un pedido ya no cabe, se abre otra hoja. Puede haber varias hojas esperando aprobación a la vez.
  - Un pedido que por sí solo pasa del tope ocupa una hoja propia, marcada como **EXCEDIDA**.
- **Estados de la hoja:**
  - *Esperando aprobación*: la hoja está en cola.
  - *Carga aprobada*: la hoja se cierra, se imprime y pasa al archivo.
  - *Carga en espera*: clientes que se dejan para otra carga; no se pierde su pedido.
- **En la oficina** se asigna la **ruta** y el **despachador** (Ernesto Ch., Sr. Luis T., Douglas Ch., Aquiles M.) con menús desplegables. También se editan las cantidades de cualquier celda: por ejemplo, 300 → 50 si no hay existencia. Se muestran los **faltantes de inventario**.
- **Impresión:**
  - *Hoja de carga*: carta horizontal, **sin precios**, totales por producto y por cliente, firmas.
  - *Notas de entrega*: una por cliente, **con precios**, en ORIGINAL (cliente) + COPIA (empresa), numeradas NE-000001….
- **Archivo:** guarda cada carga aprobada con fecha, número, vendedor, ruta, despachador, clientes, bultos, unidades, monto y rango de notas. Se filtra y se exporta a CSV.
- **Bloqueo:** cuando un pedido entra en una hoja, el teléfono ya no puede modificarlo. El servidor lo rechaza aunque llegue tarde. Los cambios de la oficina (cantidades, precios, catálogo, clientes, rutas) llegan a los teléfonos en el siguiente sync: cada 45 s o al tocar ⟳.

## 2. Catálogo (lista de precios 30/07/2026)

- 169 renglones → **139 productos** en 10 rubros: REFRESCOS, AGUAS, JUGOS, MALTAS, CERVEZAS, BEBIDAS ALCOHÓLICAS, GALLETAS, PAPAS Y CHOWIS, SALSAS y VÍVERES. El orden de los rubros se edita en Ajustes.
- **Forma de venta:**
  - **Caja y unidad:** solo cuando la lista trae ambos precios. En ese caso los dos renglones se fusionan en un producto (30 casos). El código de caja queda como principal y el de unidad en `unitCode`.
  - **Solo unidad:** whisky, ron, anís y vodka, además de los renglones "P/UND" sin caja equivalente.
  - **Solo caja:** todo lo demás (refrescos, aguas, Del Valle, soda, maltas, cervezas…).
- Cada producto tiene: código, código unidad, nombre (el de facturación), presentación, rubro, subgrupo (ej. REFRESCOS · 2 L), marca, unidades por caja, precio caja, precio unidad, stock, **orden**, activo y **foto**.
- **Stock vacío = sin control de inventario:** no muestra alertas ni descuenta. Se llena desde Inventario.
- **Fotos:** se pueden subir una por una (📷 en el formulario) o **en lote**. En lote, el nombre del archivo debe ser el código, por ejemplo `222.jpg` o `G17.png`. Se comprimen a unos 30 KB y quedan disponibles sin internet en los teléfonos.

## 3. Estructura de datos (IndexedDB y servidor)

| Store | Documento | Notas |
|---|---|---|
| `products` | `{id, code, unitCode, name, presentation, category, subgroup, brand, sellBy, unitsPerBox, boxPrice, unitPrice, stock, sort, active, image}` | `stock` en unidades, o `null` = sin control |
| `sellers` | `{id, name, routes[], aliases[], active}` | los alias enlazan con el Excel ("LUCAS E CHAVEZ" → Lucas Ch.) |
| `clients` | `{id, rif, name, phone, address, group, creditDays, sellerId, route, source}` | `source: 'campo'` = creado por el vendedor en la calle |
| `orders` | `{id, sellerId, clientId, clientName, route, routeDate, status, lines{pid:{cajas, unidades, precios congelados…}}, loadId, noteNumber, officeEdited}` | los precios quedan congelados en cada línea |
| `loads` | `{id, sellerId, route, dispatcherId, status, orderIds[], number, approvedAt, totals{…}, firstNote, lastNote}` | `status`: `espera` \| `aprobada` |
| `config` | `{company, routes[], dispatchers[], rubros[], load{limit, maxClients, measure}, exchangeRate, counters{load, note}}` | un solo documento, compartido por todos los equipos |

El servidor guarda cada documento en `DistDoc` (Prisma/SQLite) con índices por vendedor, fecha y estado.
- Gana la escritura más reciente según `updatedAt`.
- Solo la clave admin puede publicar catálogo, vendedores, cargas y configuración.
- Cada teléfono baja solo su cartera y sus pedidos.

## 4. Exportación a Excel/VBA
- **Copiar para Excel:** texto con tabuladores, se pega directo con Ctrl+V.
- **CSV:** usa `;` y coma decimal, con BOM UTF-8 para que se vean las tildes.
- Encabezado fijo: `CODIGO | PRODUCTO | PRESENTACION | UM | <clientes> | TOTAL`. Las filas de totales llevan en la primera columna las claves `TOTAL_CAJAS`, `TOTAL_UNIDADES`, `TOTAL_BULTOS` y `TOTAL_USD`.
- Los nombres de cliente que empiezan con `= + - @` se exportan con un `'` delante, para que Excel no los tome como fórmula.

## 5. Despliegue
```bash
PEDIDOS_ADMIN_KEY=<clave larga de oficina>     # obligatoria
PEDIDOS_SYNC_KEY=<clave compartida de ruta>     # recomendada
bun install && bun run db:push && bun run build && bun run start
```
Al publicar cambios en `public/pedidos`, sube `CACHE_VERSION` en `sw.js`.

## 6. Límites conocidos
- Los números de carga y de nota los asigna el equipo que aprueba. Si dos PCs aprueban a la vez sin haber sincronizado, podrían repetir número. Recomendación: aprobar desde una sola PC.
- El stock que ve el vendedor no descuenta lo que ya está en hojas pendientes de aprobar; los faltantes se ven en la oficina.
- `vendor/xlsx.full.min.js` es SheetJS 0.18.5, la última versión en npm, y tiene avisos de seguridad conocidos. Solo lo usa la oficina, para leer archivos propios. Conviene actualizarlo a 0.20.x desde cdn.sheetjs.com cuando sea posible.

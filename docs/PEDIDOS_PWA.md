# PWA de Toma de Pedidos — Distribuidora mayorista

App web instalable y **offline-first** para vendedores en la calle (móvil) y para la oficina (PC).
Vive en `public/pedidos/` (HTML + CSS + JavaScript sin dependencias ni CDN) y se sirve en
`/pedidos/index.html` (`/pedidos` redirige ahí). La sincronización usa `POST /api/pedidos/sync`.

```
public/pedidos/
├── index.html            shell de la app
├── styles.css            alto contraste, botones ≥ 52 px, impresión horizontal
├── manifest.webmanifest  instalable ("Agregar a pantalla de inicio")
├── sw.js                 service worker: la app abre sin señal
├── icons/
└── js/
    ├── db.js      IndexedDB (con respaldo en localStorage)
    ├── seed.js    ~110 productos y 4 vendedores de demostración
    ├── sync.js    sincronización HTTP + intercambio por archivo
    ├── matrix.js  matriz de despacho + exportación CSV/TSV (funciones puras)
    └── app.js     interfaz y router (#/, #/ruta, #/oficina/*)
src/app/api/pedidos/sync/route.ts   endpoint de sincronización
prisma/schema.prisma                modelo DistDoc
```

## 1. Estructura de datos

IndexedDB `distribuidora-pedidos`, con 4 stores. Todo documento que se sincroniza lleva
`updatedAt` (ISO), `deleted` (borrado lógico) y `dirty` (cambio local todavía sin subir).

### `products` — catálogo (lo edita la oficina)
```json
{
  "id": "p_sal-004",
  "code": "SAL-004",
  "name": "Salsa de Pizza",
  "presentation": "340 g",
  "category": "Salsas y Aderezos",
  "unitsPerBox": 12,
  "unitPrice": 1.40,
  "boxPrice": 15.96,
  "sellBy": "ambos",          // "ambos" | "caja" | "unidad"
  "stock": 756,               // SIEMPRE en unidades (63 cj = 756 un)
  "active": true,
  "updatedAt": "2026-09-22T14:03:11.120Z", "deleted": false, "dirty": false
}
```
Cada gramaje es un SKU propio que comparte `name` (nombre base): *Salsa de Pizza 340 g / 500 g / 1 kg*.
El stock se guarda en unidades para no mezclar cajas con unidades sueltas en las cuentas.

### `sellers`
```json
{ "id": "s_fanny", "name": "Fanny A.", "active": true, "updatedAt": "…", "deleted": false }
```

### `orders` — 1 pedido = 1 vendedor + 1 cliente + 1 fecha de ruta
```json
{
  "id": "o_c5e61ae5-…",                 // UUID generado en el teléfono (sin choques offline)
  "sellerId": "s_fanny", "sellerName": "Fanny A.",
  "clientName": "Panadería El Sol",
  "clientKey": "panaderia el sol",      // normalizado: evita duplicar al cliente en el día
  "routeDate": "2026-09-22",
  "status": "abierto",                  // abierto → enviado → despachado
  "notes": "Entregar antes de las 10am",
  "lines": {
    "p_sal-004": {
      "cajas": 3, "unidades": 2,
      "code": "SAL-004", "name": "Salsa de Pizza", "presentation": "340 g",
      "category": "Salsas y Aderezos", "unitsPerBox": 12,
      "unitPrice": 1.50, "boxPrice": 17.00   // precio CONGELADO al momento de la venta
    }
  },
  "createdAt": "…", "sentAt": "…", "dispatchedAt": null,
  "deviceId": "dev_…", "updatedAt": "…", "deleted": false, "dirty": true
}
```
- `lines` es un mapa por `productId`, así sumar o restar una cantidad cuesta O(1).
- Cada línea guarda una **copia** del producto y del precio. Si la oficina cambia el precio o
  borra el producto después, el pedido y la matriz no cambian.

### `meta` (clave/valor)
`settings` (URL, claves, tasa Bs/USD, separador CSV), `session` (vendedor y cliente activo),
`deviceId`, `syncCursor`, `lastSyncAt`, `seeded`.

### Servidor (`DistDoc`, SQLite vía Prisma)
Espejo por documento de los stores: `kind + id` como clave, `data` con el JSON completo y
columnas indexadas (`sellerId`, `routeDate`, `status`, `syncedAt`) para filtrar lo que se baja.

## 2. Sincronización offline-first

1. Todo se escribe primero en IndexedDB y se marca `dirty`. La app no espera a la red.
2. `sync.js` sube lo pendiente y baja lo que cambió desde `syncCursor` (hora del servidor).
   Corre al abrir la app, al recuperar señal, al cerrar un pedido y cada 60 s (teléfono) o 20 s (oficina).
3. Reglas de fusión (iguales en cliente y servidor):
   - Gana la última escritura según `updatedAt`. Si un teléfono tiene el reloj adelantado,
     el servidor recorta la hora a la suya.
   - El catálogo solo lo publica la oficina, con `x-admin-key`. Un teléfono siempre acepta el catálogo del servidor.
   - Un pedido **despachado** queda congelado: el servidor rechaza cambios del vendedor y le devuelve su versión.
4. **Sin servidor:** el vendedor usa *Menú → Enviar pedidos de hoy por archivo* (JSON por WhatsApp)
   y la oficina lo carga en *Ajustes → Importar*. La oficina reparte el catálogo de la misma forma.

## 3. Matriz de despacho

- Filas: productos, en orden de almacén (categoría → nombre → código). Columnas: clientes, en el orden de la ruta.
- Columna final **TOTAL por producto**, para armar la carga. Filas finales **Total cajas / Total
  unid. sueltas / Total USD por cliente**, para el control contable.
- Tres modos: **Cajas/Unid.** (una fila por producto y unidad de medida, CJ y UN por separado,
  sin fracciones), **Unidades totales** y **Monto $**.
- Vista **Todos**: las columnas son los vendedores. Sirve para la carga total del día.
- **Confirmar despacho** marca los pedidos como despachados y descuenta el stock una sola vez.

### Exportación para Excel/VBA
- **Copiar para Excel**: texto separado por tabuladores. Se pega con Ctrl+V directo en las celdas.
- **CSV matriz**: UTF-8 con BOM (Excel muestra bien acentos y ñ). Usa `;` y coma decimal por
  defecto (Excel en español); se cambia en Ajustes.
- **CSV plano**: una fila por línea de pedido (`FECHA;VENDEDOR;CLIENTE;CODIGO;…;MONTO_USD;ESTADO;PEDIDO_ID`),
  útil para tablas dinámicas o para acumular en una hoja histórica.
- Encabezado fijo: `CODIGO | PRODUCTO | PRESENTACION | UM | <clientes…> | TOTAL`. Las filas de
  totales llevan en `CODIGO` las claves `TOTAL_CAJAS`, `TOTAL_UNIDADES` y `TOTAL_USD`.
  Así la macro las encuentra sin depender del texto visible:
  ```vb
  If ws.Cells(r, 1).Value = "TOTAL_USD" Then ...
  ```
- Protección contra inyección de fórmulas: si un nombre de cliente empieza por `= + - @`,
  se exporta con un `'` delante.

## 4. Despliegue

```bash
# variables de entorno del servidor
PEDIDOS_ADMIN_KEY=<clave larga de la oficina>   # obligatoria para publicar catálogo
PEDIDOS_SYNC_KEY=<clave compartida de ruta>      # opcional: exige clave a todos los equipos

bun run db:push      # crea la tabla DistDoc
bun run build && bun run start
```
- En la PC de oficina: *Oficina → Ajustes*, escribir las dos claves y pulsar *Guardar y sincronizar*.
  El primer sync publica el catálogo.
- En cada teléfono: abrir `https://<dominio>/pedidos`, *Agregar a pantalla de inicio*, y poner la
  clave de sync en *Menú → Conexión*.
- Al cambiar archivos de `public/pedidos`, subir `CACHE_VERSION` en `sw.js`.

## 5. Límites conocidos / próximos pasos
- El acceso de vendedores es sin contraseña, como se pidió. La seguridad real está en el servidor:
  las claves de sync y admin. Cualquiera que tenga la clave de sync puede subir pedidos.
- El stock mostrado al vendedor no descuenta lo reservado por pedidos de otros vendedores aún no despachados.
- La tasa Bs/USD se configura en cada equipo; todavía no se sincroniza.
- Si dos PCs de oficina confirman el mismo despacho a la vez, el stock resultante lo decide la última escritura.

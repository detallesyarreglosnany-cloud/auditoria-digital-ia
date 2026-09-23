# Instalación paso a paso — Puerto Venado Pedidos

> Tiempo estimado: 1 a 2 horas la primera vez. No hace falta programar, pero sí seguir los pasos en orden.

## 0. Antes de empezar (obligatorio)

1. **Haz privado el repositorio en GitHub.** Hoy es público: cualquiera puede ver y copiar el código.
   GitHub → repositorio `auditoria-digital-ia` → **Settings** → abajo, *Danger Zone* → **Change visibility → Private**.
2. **Crea cuatro claves largas y distintas** y guárdalas en un lugar seguro (gestor de contraseñas o papel en la caja fuerte).
   Para generarlas: en <https://passwordsgenerator.net> elige 24 caracteres sin símbolos raros; o en una terminal escribe `openssl rand -base64 24`.

| Variable | Para qué sirve | Quién la conoce |
|---|---|---|
| `PEDIDOS_BASIC_USER` / `PEDIDOS_BASIC_PASS` | Usuario y clave para **abrir** la app. Sin ellas no se descarga ni una línea del código | Todos (oficina y vendedores) |
| `PEDIDOS_SYNC_KEY` | Permite sincronizar pedidos | Todos |
| `PEDIDOS_ADMIN_KEY` | Permite publicar precios, catálogo, clientes y cerrar cargas | **Solo la oficina** |
| `DATABASE_URL` | Dónde se guarda la base de datos | Solo el servidor |

## ¿Se puede "subir a Vercel y listo"?

**Casi, pero no del todo.** Hoy la base de datos es **SQLite**, que es un archivo en el disco. En Vercel el disco se borra en cada despliegue y en cada reinicio, así que **los pedidos se perderían**. Hay dos caminos:

- **Opción A — Servidor propio (VPS).** Recomendada: es la más barata a largo plazo, deja los datos bajo tu control y el proyecto ya trae `Caddyfile` para esto. Cuesta unos $5–7 al mes.
- **Opción B — Vercel + base de datos Postgres gratuita** (Neon o Supabase). Hay que cambiar una línea del proyecto. Cómodo, pero dependes de dos servicios externos.

---

## Opción A — Servidor propio (VPS)

1. **Contrata un VPS** con Ubuntu 24.04, 1 GB de RAM y 25 GB de disco (Hetzner, DigitalOcean, Contabo o Vultr). Anota la IP.
2. **Compra o usa un dominio** (ej. `pedidos.puertovenado.com`). En el panel del dominio crea un registro **A** que apunte a la IP del VPS.
3. **Entra al servidor.** Desde Windows usa PowerShell: `ssh root@LA_IP`.
4. **Instala lo necesario** (copia y pega):
   ```bash
   apt update && apt install -y git unzip caddy
   curl -fsSL https://bun.sh/install | bash && source ~/.bashrc
   ```
5. **Descarga el proyecto.** Como el repositorio es privado, en GitHub crea un token: *Settings → Developer settings → Fine-grained tokens*, con acceso de solo lectura a este repositorio. Luego:
   ```bash
   git clone https://TU_USUARIO:EL_TOKEN@github.com/detallesyarreglosnany-cloud/auditoria-digital-ia.git /opt/pv
   cd /opt/pv && git checkout claude/pwa-order-management-wholesale-vjw6ut
   ```
6. **Crea el archivo de configuración** `/opt/pv/.env` con `nano /opt/pv/.env`:
   ```
   DATABASE_URL=file:/opt/pv/db/pedidos.db
   PEDIDOS_BASIC_USER=puertovenado
   PEDIDOS_BASIC_PASS=...clave larga...
   PEDIDOS_SYNC_KEY=...clave larga...
   PEDIDOS_ADMIN_KEY=...clave larga distinta...
   ```
   Guarda con Ctrl+O y sal con Ctrl+X. Después: `chmod 600 /opt/pv/.env`.
7. **Instala, crea la base de datos y compila:**
   ```bash
   cd /opt/pv && mkdir -p db && bun install && bun run db:push && bun run build
   ```
8. **Deja la app corriendo siempre** (se reinicia sola si el servidor se reinicia):
   ```bash
   cat > /etc/systemd/system/pv.service <<'EOF'
   [Unit]
   Description=Puerto Venado Pedidos
   After=network.target
   [Service]
   WorkingDirectory=/opt/pv
   EnvironmentFile=/opt/pv/.env
   ExecStart=/root/.bun/bin/bun .next/standalone/server.js
   Environment=PORT=3000 NODE_ENV=production
   Restart=always
   [Install]
   WantedBy=multi-user.target
   EOF
   systemctl daemon-reload && systemctl enable --now pv
   ```
9. **HTTPS automático con Caddy.** Escribe esto en `/etc/caddy/Caddyfile`, cambiando el dominio por el tuyo:
   ```
   pedidos.puertovenado.com {
       reverse_proxy localhost:3000
   }
   ```
   Luego ejecuta `systemctl reload caddy`. Caddy obtiene el certificado HTTPS solo.
10. **Copia de seguridad diaria** de la base de datos:
    ```bash
    mkdir -p /opt/pv/respaldos
    (crontab -l; echo '0 23 * * * cp /opt/pv/db/pedidos.db /opt/pv/respaldos/pedidos-$(date +\%F).db') | crontab -
    ```
    Una vez por semana descarga esos archivos a tu PC o a tu Drive.
11. **Para actualizar la app** en el futuro:
    ```bash
    cd /opt/pv && git pull && bun install && bun run db:push && bun run build && systemctl restart pv
    ```

## Opción B — Vercel + Postgres (Neon)

1. Crea una cuenta en <https://neon.tech> y un proyecto. Copia la **connection string** (empieza por `postgresql://…`).
2. En el proyecto, en `prisma/schema.prisma`, cambia `provider = "sqlite"` por `provider = "postgresql"`.
   **Ojo:** la landing de auditoría comparte esa base de datos; sus datos actuales en SQLite no se migran solos.
3. En tu PC, con la cadena de Neon: `DATABASE_URL="postgresql://…" bunx prisma db push`.
4. En <https://vercel.com> → **Add New Project** → importa el repositorio (privado) y elige la rama.
5. En *Settings → Environment Variables* agrega `DATABASE_URL`, `PEDIDOS_BASIC_USER`, `PEDIDOS_BASIC_PASS`, `PEDIDOS_SYNC_KEY` y `PEDIDOS_ADMIN_KEY`.
6. **Deploy.** En *Settings → Domains* conecta tu dominio.

---

## Primer uso (igual con A o B)

### PC de la oficina
1. Abre `https://TU-DOMINIO/pedidos` y escribe el usuario y la clave de acceso. Marca "recordar".
2. Entra en **Oficina** → **Cargar paquete de arranque** → elige `puerto-venado-arranque.json`.
3. Ve a **Ajustes → Sincronización**, escribe la **clave de sync** y la **clave admin**, y pulsa **Guardar y sincronizar**.
4. En **Ajustes → Seguridad de la oficina**, crea tu **PIN**. La oficina se bloqueará al salir y tras 15 minutos sin uso.
5. En **Ajustes → Empresa**, completa el RIF, el teléfono y la tasa Bs.
6. En Chrome, menú ⋮ → **Instalar Puerto Venado** para tenerla como programa.
7. Toca la 🔔 y pulsa **Activar avisos del sistema**, para recibir alertas aunque la pestaña esté en segundo plano.

### Teléfono de cada vendedor
1. Abre `https://TU-DOMINIO/pedidos` en Chrome (Android) o Safari (iPhone) y escribe el usuario y la clave.
2. Menú → **Agregar a pantalla de inicio**.
3. Elige su nombre → ☰ → **Conexión**, escribe la **clave de sync** → **Guardar**. Su cartera y el catálogo se descargan solos.
4. **Nunca le des la clave admin a un vendedor.**

## Imprimir y descargar
- **Hoja de carga y notas:** botón **🖨 Imprimir / PDF**. En la ventana que abre el navegador:
  - elige tu impresora para imprimir;
  - o elige **Guardar como PDF** para descargarla.
- **Excel:** botón **⇩ Descargar Excel** (CSV que abre directo en Excel) o **📋 Copiar para Excel**.

## Qué protege el sistema y qué no
- ✅ **Sin la clave de acceso** no se ve la app ni se descarga su código (servidor con autenticación). Los buscadores no la indexan y no se puede incrustar en otras webs.
- ✅ **Sin la clave de sync** nadie lee ni sube pedidos. **Sin la clave admin** nadie cambia precios, clientes ni cargas.
- ✅ **El PIN** bloquea la oficina en la PC compartida.
- ✅ **El repositorio privado** evita que se copie desde GitHub.
- ⚠️ **Lo que no se puede impedir:** quien ya tiene la clave de acceso puede, técnicamente, ver el JavaScript que corre en su navegador (esto pasa con cualquier web del mundo). Por eso:
  - cambia la clave de acceso si alguien se va de la empresa;
  - deja por escrito en el contrato de quién es el código y que no puede copiarse.

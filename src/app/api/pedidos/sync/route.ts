import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { db } from '@/lib/db';

// Sincronización de la PWA de pedidos (public/pedidos).
//
// POST /api/pedidos/sync
//   headers: x-sync-key  (obligatoria si PEDIDOS_SYNC_KEY está definida)
//            x-admin-key (oficina: permite escribir catálogo y vendedores)
//   body:    { deviceId, since, sinceDays, sellerId, push: { orders, products, sellers } }
//   resp:    { serverTime, accepted: {kind: ids[]}, rejected: [{kind,id,reason,doc}], pull: {kind: docs[]} }
//
// Reglas (espejo de public/pedidos/js/sync.js):
//   - Last-write-wins por updatedAt del documento.
//   - products/sellers solo se escriben con clave admin.
//   - Un pedido "despachado" no puede ser modificado por un vendedor.

export const dynamic = 'force-dynamic';

const SYNC_KEY = process.env.PEDIDOS_SYNC_KEY || '';
const ADMIN_KEY = process.env.PEDIDOS_ADMIN_KEY || '';
const KINDS = ['orders', 'products', 'sellers'] as const;
type Kind = (typeof KINDS)[number];
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MAX_DOCS_PER_KIND = 5000;
const MAX_DOC_BYTES = 64 * 1024;

type Doc = Record<string, unknown> & { id: string; updatedAt: string; deleted?: boolean };

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function isDoc(d: unknown): d is Doc {
  if (!d || typeof d !== 'object') return false;
  const o = d as Record<string, unknown>;
  return typeof o.id === 'string' && o.id.length > 0 && o.id.length <= 120 &&
    typeof o.updatedAt === 'string' && !Number.isNaN(Date.parse(o.updatedAt));
}

function parseDoc(data: string): Doc {
  return JSON.parse(data) as Doc;
}

function daysAgo(n: number) {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'pedidos-sync', time: new Date().toISOString() });
}

export async function POST(req: NextRequest) {
  const serverTime = new Date();

  if (SYNC_KEY && !safeEqual(req.headers.get('x-sync-key') || '', SYNC_KEY)) {
    return NextResponse.json({ error: 'Clave de sincronización inválida' }, { status: 401 });
  }
  const adminHeader = req.headers.get('x-admin-key');
  const isAdmin = !!ADMIN_KEY && !!adminHeader && safeEqual(adminHeader, ADMIN_KEY);
  if (adminHeader && !isAdmin) {
    return NextResponse.json({ error: 'Clave admin inválida' }, { status: 401 });
  }

  const len = Number(req.headers.get('content-length') || 0);
  if (len > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Paquete demasiado grande' }, { status: 413 });
  }

  let body: {
    since?: string | null;
    sinceDays?: number | null;
    sellerId?: string | null;
    push?: Partial<Record<Kind, unknown[]>>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const accepted: Record<Kind, string[]> = { orders: [], products: [], sellers: [] };
  const rejected: { kind: Kind; id: string; reason: string; doc?: Doc }[] = [];
  const maxTs = new Date(serverTime.getTime() + 60_000).toISOString();

  try {
    for (const kind of KINDS) {
      const incoming = Array.isArray(body.push?.[kind]) ? body.push![kind]! : [];
      if (!incoming.length) continue;
      if (incoming.length > MAX_DOCS_PER_KIND) {
        return NextResponse.json({ error: `Demasiados documentos en ${kind}` }, { status: 413 });
      }
      if (kind !== 'orders' && !isAdmin) {
        // Un teléfono nunca publica catálogo: se ignora sin error.
        continue;
      }

      await db.$transaction(async (tx) => {
        for (const raw of incoming) {
          if (!isDoc(raw)) continue;
          const doc: Doc = { ...raw };
          delete (doc as Record<string, unknown>).dirty;
          // Un reloj de teléfono adelantado no puede "ganar" para siempre.
          if (doc.updatedAt > maxTs) doc.updatedAt = serverTime.toISOString();
          const data = JSON.stringify(doc);
          if (data.length > MAX_DOC_BYTES) {
            rejected.push({ kind, id: doc.id, reason: 'too_large' });
            continue;
          }

          const existing = await tx.distDoc.findUnique({ where: { kind_id: { kind, id: doc.id } } });
          if (existing) {
            if (kind === 'orders' && existing.status === 'despachado' && !isAdmin) {
              rejected.push({ kind, id: doc.id, reason: 'despachado', doc: parseDoc(existing.data) });
              continue;
            }
            if (existing.updatedAt > doc.updatedAt) {
              rejected.push({ kind, id: doc.id, reason: 'stale', doc: parseDoc(existing.data) });
              continue;
            }
            if (existing.updatedAt === doc.updatedAt) {
              accepted[kind].push(doc.id); // reintento idempotente
              continue;
            }
          }

          const cols = {
            data,
            deleted: !!doc.deleted,
            updatedAt: doc.updatedAt,
            sellerId: kind === 'orders' ? String(doc.sellerId || '') : null,
            routeDate: kind === 'orders' ? String(doc.routeDate || '') : null,
            status: kind === 'orders' ? String(doc.status || '') : null,
          };
          await tx.distDoc.upsert({
            where: { kind_id: { kind, id: doc.id } },
            create: { kind, id: doc.id, ...cols },
            update: cols,
          });
          accepted[kind].push(doc.id);
        }
      });
    }

    // ---- Bajada ----
    const since = body.since && !Number.isNaN(Date.parse(body.since)) ? new Date(body.since) : null;
    const syncedAt = since ? { gte: since } : undefined;
    const sellerId = typeof body.sellerId === 'string' && body.sellerId ? body.sellerId : null;
    const sinceDays = !since && typeof body.sinceDays === 'number' && body.sinceDays > 0
      ? Math.min(body.sinceDays, 365) : null;

    const [products, sellers, orders] = await Promise.all([
      db.distDoc.findMany({ where: { kind: 'products', syncedAt } }),
      db.distDoc.findMany({ where: { kind: 'sellers', syncedAt } }),
      db.distDoc.findMany({
        where: {
          kind: 'orders',
          syncedAt,
          ...(sellerId ? { sellerId } : {}),
          ...(sinceDays ? { routeDate: { gte: daysAgo(sinceDays) } } : {}),
        },
      }),
    ]);

    return NextResponse.json({
      serverTime: serverTime.toISOString(),
      accepted,
      rejected,
      pull: {
        products: products.map((d) => parseDoc(d.data)),
        sellers: sellers.map((d) => parseDoc(d.data)),
        orders: orders.map((d) => parseDoc(d.data)),
      },
    });
  } catch (error) {
    console.error('[pedidos/sync]', error);
    return NextResponse.json({ error: 'Error interno de sincronización' }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Cron: segna Scaduto i preventivi Inviato/Visualizzato oltre dueDate. Proteggere con CRON_SECRET in produzione.
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const need = process.env.CRON_SECRET;
  if (!need) return true;
  if (new URL(req.url).searchParams.get("secret") === need) return true;
  if (req.headers.get("authorization") === `Bearer ${need}`) return true;
  return false;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const now = new Date();
  const expired = await prisma.quote.findMany({ where: { status: { in: ["Inviato", "Visualizzato"] }, dueDate: { lt: now }, deletedAt: null } });
  for (const q of expired) {
    await prisma.quote.update({ where: { id: q.id }, data: { status: "Scaduto" } });
    await prisma.quoteEvent.create({ data: { quoteId: q.id, type: "expired", payload: "Scadenza superata (cron)" } });
  }
  return NextResponse.json({ expired: expired.length });
}

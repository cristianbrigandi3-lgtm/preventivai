import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { calcTotals } from "@/lib/quotes";
import crypto from "crypto";

function custLabel(c: any) { return c.business || `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email || "Cliente"; }

export async function POST(req: Request) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const company = await prisma.company.findUnique({ where: { userId: uid } });
  if (!company) return NextResponse.json({ error: "no company" }, { status: 400 });
  const body = await req.json();
  const items = (body.items || []).filter((i: any) => i.description?.trim());
  if (items.length === 0) return NextResponse.json({ error: "Aggiungi almeno una riga" }, { status: 400 });

  // FREE limit: 5/mese
  const sub = await prisma.subscription.findUnique({ where: { userId: uid } });
  if (!sub || sub.plan === "FREE") {
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    const count = await prisma.quote.count({ where: { companyId: company.id, createdAt: { gte: start }, deletedAt: null } });
    if (count >= 5) return NextResponse.json({ error: "Limite FREE di 5 preventivi/mese raggiunto" }, { status: 403 });
  }

  let customerId = body.customerId || null;
  if (!customerId && body.newCustomer) {
    const nc = body.newCustomer;
    if (nc.business || nc.firstName || nc.email) {
      const c = await prisma.customer.create({ data: { companyId: company.id, business: nc.business || null, firstName: nc.firstName || null, lastName: nc.lastName || null, email: nc.email || null, phone: nc.phone || null, address: nc.address || null, piva: nc.piva || null, cf: nc.cf || null } });
      customerId = c.id;
    }
  }
  const t = calcTotals(items);
  const counter = company.quoteCounter + 1;
  const year = new Date().getFullYear();
  const number = `${year}-${String(counter).padStart(3, "0")}`;
  // Scritture sequenziali (niente nested create): compatibile con pooler PgBouncer
  const quote = await prisma.quote.create({
    data: {
      companyId: company.id, customerId, number,
      publicToken: crypto.randomBytes(12).toString("hex"),
      subject: String(body.subject || ""), description: body.description || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      payTerms: body.payTerms || company.defaultPayTerms || null,
      delivery: body.delivery || null, validity: body.validity || null,
      notes: body.notes || null, status: "Bozza",
      subtotal: t.subtotal, discount: t.discount, vatTotal: t.vatTotal, total: t.total
    }
  });
  await prisma.quoteItem.createMany({
    data: t.lines.map((l) => ({ quoteId: quote.id, description: l.description, qty: l.qty, unit: l.unit, unitPrice: l.unitPrice, discountPct: l.discountPct, vatPct: l.vatPct, lineTotal: l.lineTotal }))
  });
  await prisma.followUp.create({ data: { quoteId: quote.id } });
  await prisma.quoteEvent.create({ data: { quoteId: quote.id, type: "created", payload: `Preventivo ${number} creato` } });
  await prisma.company.update({ where: { id: company.id }, data: { quoteCounter: counter } });
  return NextResponse.json({ id: quote.id });
}

export async function GET() {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const company = await prisma.company.findUnique({ where: { userId: uid } });
  if (!company) return NextResponse.json({ customers: [] });
  const customers = await prisma.customer.findMany({ where: { companyId: company.id, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ customers: customers.map((c) => ({ id: c.id, label: custLabel(c) })) });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { renderQuotePdf } from "@/lib/pdf";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const uid = await getUserId();
  const q = await prisma.quote.findFirst({ where: { id: params.id }, include: { customer: true, company: true, items: true } });
  if (!q) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (uid && q.company.userId !== uid) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  // link pubblico gestito da /p/[token]; qui serve auth oppure token via query? richiediamo auth proprietario
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const c = q.customer;
  const pdf = await renderQuotePdf({
    company: { name: q.company.name, address: q.company.address, piva: q.company.piva, cf: q.company.cf, phone: q.company.phone, email: q.company.email, iban: q.company.iban },
    customer: { label: c?.business || `${c?.firstName || ""} ${c?.lastName || ""}` || "Cliente", address: c?.address, piva: c?.piva, cf: c?.cf, email: c?.email, phone: c?.phone },
    quote: { number: q.number, date: new Date(q.date).toLocaleDateString("it-IT"), dueDate: q.dueDate ? new Date(q.dueDate).toLocaleDateString("it-IT") : null, subject: q.subject, description: q.description, payTerms: q.payTerms, validity: q.validity, notes: q.notes, subtotal: q.subtotal, discount: q.discount, vatTotal: q.vatTotal, total: q.total },
    items: q.items.map((i) => ({ description: i.description, qty: i.qty, unit: i.unit, unitPrice: i.unitPrice, discountPct: i.discountPct, vatPct: i.vatPct, lineTotal: i.lineTotal }))
  });
  return new NextResponse(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="preventivo-${q.number}.pdf"` } });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderQuotePdf } from "@/lib/pdf";

// PDF pubblico via token non enumerabile (link /p/[token]). Nessun auth: il token è il segreto.
export async function GET(_: Request, { params }: { params: { token: string } }) {
  const q = await prisma.quote.findUnique({ where: { publicToken: params.token }, include: { customer: true, company: true, items: true } });
  if (!q) return NextResponse.json({ error: "not found" }, { status: 404 });
  const c = q.customer;
  const pdf = await renderQuotePdf({
    company: { name: q.company.name, address: q.company.address, piva: q.company.piva, cf: q.company.cf, phone: q.company.phone, email: q.company.email, iban: q.company.iban },
    customer: { label: c?.business || `${c?.firstName || ""} ${c?.lastName || ""}` || "Cliente", address: c?.address, piva: c?.piva, cf: c?.cf, email: c?.email, phone: c?.phone },
    quote: { number: q.number, date: new Date(q.date).toLocaleDateString("it-IT"), dueDate: q.dueDate ? new Date(q.dueDate).toLocaleDateString("it-IT") : null, subject: q.subject, description: q.description, payTerms: q.payTerms, validity: q.validity, notes: q.notes, subtotal: q.subtotal, discount: q.discount, vatTotal: q.vatTotal, total: q.total },
    items: q.items.map((i) => ({ description: i.description, qty: i.qty, unit: i.unit, unitPrice: i.unitPrice, discountPct: i.discountPct, vatPct: i.vatPct, lineTotal: i.lineTotal }))
  });
  return new NextResponse(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="preventivo-${q.number}.pdf"` } });
}

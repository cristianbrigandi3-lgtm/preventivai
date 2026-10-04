import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { renderQuotePdf } from "@/lib/pdf";
import { smtpConfigured, transporter, quoteEmailTemplate } from "@/lib/email";
import { eur } from "@/lib/quotes";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const q = await prisma.quote.findFirst({ where: { id: params.id }, include: { customer: true, company: true, items: true } });
  if (!q || q.company.userId !== uid) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const to = String(body.to || q.customer?.email || "").trim();
  if (!to) return NextResponse.json({ error: "Email cliente mancante: inseriscila nella scheda cliente" }, { status: 400 });

  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const link = `${appUrl}/p/${q.publicToken}`;
  const customerName = q.customer?.business || `${q.customer?.firstName || ""} ${q.customer?.lastName || ""}`.trim() || "Cliente";
  const subject = `Preventivo n. ${q.number} — ${q.subject} | ${q.company.name}`;
  const tpl = quoteEmailTemplate({
    customerName, companyName: q.company.name, number: q.number, subject: q.subject,
    total: eur(q.total), link, message: body.message || undefined
  });

  const pdf = await renderQuotePdf({
    company: { name: q.company.name, address: q.company.address, piva: q.company.piva, cf: q.company.cf, phone: q.company.phone, email: q.company.email, iban: q.company.iban },
    customer: { label: customerName, address: q.customer?.address, piva: q.customer?.piva, cf: q.customer?.cf, email: q.customer?.email, phone: q.customer?.phone },
    quote: { number: q.number, date: new Date(q.date).toLocaleDateString("it-IT"), dueDate: q.dueDate ? new Date(q.dueDate).toLocaleDateString("it-IT") : null, subject: q.subject, description: q.description, payTerms: q.payTerms, validity: q.validity, notes: q.notes, subtotal: q.subtotal, discount: q.discount, vatTotal: q.vatTotal, total: q.total },
    items: q.items.map((i) => ({ description: i.description, qty: i.qty, unit: i.unit, unitPrice: i.unitPrice, discountPct: i.discountPct, vatPct: i.vatPct, lineTotal: i.lineTotal }))
  });

  let status = "sent";
  if (smtpConfigured()) {
    try {
      await transporter().sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to, subject, text: tpl.text, html: tpl.html,
        attachments: [{ filename: `preventivo-${q.number}.pdf`, content: Buffer.from(pdf), contentType: "application/pdf" }]
      });
    } catch (e: any) {
      status = "error: " + String(e?.message || e).slice(0, 200);
    }
  } else {
    status = "logged-no-smtp";
  }

  await prisma.emailLog.create({ data: { quoteId: q.id, to, subject, body: tpl.text.slice(0, 2000), status } });
  if (q.status === "Bozza" && !status.startsWith("error")) {
    await prisma.quote.update({ where: { id: q.id }, data: { status: "Inviato" } });
    await prisma.quoteEvent.create({ data: { quoteId: q.id, type: "sent", payload: `Inviato a ${to} (${status})` } });
  }
  if (status.startsWith("error")) return NextResponse.json({ error: "Invio fallito: " + status }, { status: 502 });
  return NextResponse.json({ ok: true, status, to });
}

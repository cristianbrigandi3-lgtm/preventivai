import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import crypto from "crypto";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const q = await prisma.quote.findFirst({ where: { id: params.id }, include: { items: true, company: true } });
  if (!q || q.company.userId !== uid) redirect("/dashboard");
  const counter = q.company.quoteCounter + 1;
  const number = `${new Date().getFullYear()}-${String(counter).padStart(3, "0")}`;
  const dup = await prisma.quote.create({
    data: {
      companyId: q.companyId, customerId: q.customerId, number, publicToken: crypto.randomBytes(12).toString("hex"),
      subject: q.subject, description: q.description, dueDate: q.dueDate, payTerms: q.payTerms,
      delivery: q.delivery, validity: q.validity, notes: q.notes, status: "Bozza",
      subtotal: q.subtotal, discount: q.discount, vatTotal: q.vatTotal, total: q.total
    }
  });
  if (q.items.length > 0) {
    await prisma.quoteItem.createMany({
      data: q.items.map((i) => ({ quoteId: dup.id, description: i.description, qty: i.qty, unit: i.unit, unitPrice: i.unitPrice, discountPct: i.discountPct, vatPct: i.vatPct, lineTotal: i.lineTotal }))
    });
  }
  await prisma.followUp.create({ data: { quoteId: dup.id } });
  await prisma.company.update({ where: { id: q.companyId }, data: { quoteCounter: counter } });
  redirect(`/preventivi/${dup.id}`);
}

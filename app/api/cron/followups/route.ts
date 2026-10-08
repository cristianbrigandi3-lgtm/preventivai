import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { smtpConfigured, transporter } from "@/lib/email";
import { DEFAULT_FOLLOWUP_1, DEFAULT_FOLLOWUP_2, DEFAULT_FOLLOWUP_3, daysSince } from "@/lib/followups";

// Cron follow-up: invia reminder 1 e 2 ai preventivi Inviato/Visualizzato.
// Proteggere con CRON_SECRET in produzione (?secret=...).
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const need = process.env.CRON_SECRET;
  if (!need) return true;
  const url = new URL(req.url);
  if (url.searchParams.get("secret") === need) return true;
  // Vercel Cron invia Authorization: Bearer <CRON_SECRET> in automatico
  if (req.headers.get("authorization") === `Bearer ${need}`) return true;
  return false;
}
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const quotes = await prisma.quote.findMany({
    where: { status: { in: ["Inviato", "Visualizzato"] }, deletedAt: null },
    include: { customer: true, company: true, followups: true }
  });
  let sent = 0;
  const details: string[] = [];
  for (const q of quotes) {
    const fu = q.followups;
    const enabled = fu?.enabled ?? q.company.followupEnabled;
    if (!enabled) continue;
    if (!q.customer?.email) continue;
    const day1 = fu?.day1 ?? q.company.followupDay1;
    const day2 = fu?.day2 ?? q.company.followupDay2;
    const day3 = fu?.day3 ?? 10;
    const age = daysSince(new Date(q.updatedAt));
    const link = `${appUrl}/p/${q.publicToken}`;
    const jobs: { n: 1 | 2 | 3; text: string }[] = [];
    if (!fu?.sent1 && age >= day1) {
      jobs.push({ n: 1, text: fu?.text1 || q.company.followupText1 || DEFAULT_FOLLOWUP_1(q.subject, q.number, link) });
    }
    if (!fu?.sent2 && age >= day2) {
      jobs.push({ n: 2, text: fu?.text2 || q.company.followupText2 || DEFAULT_FOLLOWUP_2(q.subject, q.number, link) });
    }
    if (!fu?.sent3 && age >= day3) {
      jobs.push({ n: 3, text: fu?.text3 || DEFAULT_FOLLOWUP_3(q.subject, q.number, link) });
    }
    for (const j of jobs) {
      const subject = `Promemoria preventivo n. ${q.number} — ${q.company.name}`;
      let status = "sent";
      if (smtpConfigured()) {
        try {
          await transporter().sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: q.customer.email, subject, text: j.text
          });
        } catch (e: any) { status = "error: " + String(e?.message || e).slice(0, 200); }
      } else {
        status = "logged-no-smtp";
      }
      await prisma.emailLog.create({ data: { quoteId: q.id, to: q.customer.email, subject, body: j.text.slice(0, 2000), status } });
      if (j.n === 1) await prisma.followUp.upsert({ where: { quoteId: q.id }, create: { quoteId: q.id, sent1: true }, update: { sent1: true } });
      else if (j.n === 2) await prisma.followUp.upsert({ where: { quoteId: q.id }, create: { quoteId: q.id, sent2: true }, update: { sent2: true } });
      else await prisma.followUp.upsert({ where: { quoteId: q.id }, create: { quoteId: q.id, sent3: true }, update: { sent3: true } });
      await prisma.quoteEvent.create({ data: { quoteId: q.id, type: `followup${j.n}`, payload: `Reminder ${j.n} a ${q.customer.email} (${status})` } });
      sent++;
      details.push(`${q.number}: reminder${j.n} (${status})`);
    }
  }
  return NextResponse.json({ checked: quotes.length, sent, details });
}

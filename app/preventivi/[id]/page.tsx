import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { Shell, Card, btnGhost, btnPrimary } from "@/components/ui";
import { eur, statusColor } from "@/lib/quotes";
import SendForm from "./send-form";
import FollowUpCard from "./followup-card";

async function setStatus(form: FormData) {
  "use server";
  const { redirect: red } = await import("next/navigation");
  const { prisma: db } = await import("@/lib/db");
  const { getUserId: g } = await import("@/lib/auth");
  const uid = await g();
  if (!uid) red("/login");
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  const q = await db.quote.findFirst({ where: { id }, include: { company: true } });
  if (!q || q.company.userId !== uid) red("/dashboard");
  await db.quote.update({ where: { id }, data: { status } });
  await db.quoteEvent.create({ data: { quoteId: id, type: "status", payload: status } });
  red(`/preventivi/${id}`);
}

export default async function Page({ params }: { params: { id: string } }) {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const q = await prisma.quote.findFirst({
    where: { id: params.id }, include: { customer: true, company: true, items: true, followups: true, emails: { orderBy: { createdAt: "desc" } }, events: { orderBy: { createdAt: "desc" }, take: 20 } }
  });
  if (!q || q.company.userId !== uid) notFound();
  const wa = `https://wa.me/?text=${encodeURIComponent(`Buongiorno, le invio il preventivo n. ${q.number} relativo a ${q.subject}. Può visualizzarlo qui: ${(process.env.APP_URL || "")}/p/${q.publicToken}`)}`;
  return (
    <Shell>
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h1 className="text-2xl font-bold">Preventivo {q.number}</h1>
        <span className={`rounded-full px-3 py-1 text-xs ${statusColor(q.status)}`}>{q.status}</span>
      </div>
      <Card className="mt-3 text-sm">
        <p><b>Cliente:</b> {q.customer?.business || `${q.customer?.firstName || ""} ${q.customer?.lastName || ""}` || "—"} {q.customer?.email ? `· ${q.customer.email}` : ""}</p>
        <p><b>Oggetto:</b> {q.subject}</p>
        <p><b>Totale:</b> <span className="text-green-700 font-bold">{eur(q.total)}</span> (imp. {eur(q.subtotal)} + IVA {eur(q.vatTotal)})</p>
        <p className="text-slate-500">Link pubblico: <a className="text-indigo-600" href={`/p/${q.publicToken}`}>/p/{q.publicToken}</a></p>
      </Card>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={`/api/quotes/${q.id}/pdf`} className={btnPrimary}>Scarica PDF</a>
        <a href={wa} target="_blank" className={btnGhost}>Invia su WhatsApp</a>
        <form action={setStatus}><input type="hidden" name="id" value={q.id} /><input type="hidden" name="status" value="Inviato" /><button className={btnGhost}>Segna inviato</button></form>
        <form action={setStatus}><input type="hidden" name="id" value={q.id} /><input type="hidden" name="status" value="Accettato" /><button className={btnGhost}>Segna accettato</button></form>
        <form action={setStatus}><input type="hidden" name="id" value={q.id} /><input type="hidden" name="status" value="Scaduto" /><button className={btnGhost}>Segna scaduto</button></form>
        <a href={`/api/quotes/${q.id}/duplicate`} className={btnGhost}>Duplica preventivo</a>
      </div>
      <div className="mt-3 grid md:grid-cols-2 gap-3">
        <SendForm id={q.id} defaultTo={q.customer?.email || ""} />
        <FollowUpCard id={q.id} initial={{
          enabled: q.followups?.enabled ?? q.company.followupEnabled,
          day1: q.followups?.day1 ?? q.company.followupDay1,
          day2: q.followups?.day2 ?? q.company.followupDay2,
          day3: q.followups?.day3 ?? 10,
          text1: q.followups?.text1 || "", text2: q.followups?.text2 || "", text3: q.followups?.text3 || "",
          sent1: q.followups?.sent1 ?? false, sent2: q.followups?.sent2 ?? false, sent3: q.followups?.sent3 ?? false
        }} />
      </div>
      <div className="mt-3 grid md:grid-cols-2 gap-3">
        <Card className="text-sm">
          <h2 className="font-semibold">Voci</h2>
          {q.items.map((it) => <p key={it.id} className="border-t py-1">{it.description} — {it.qty} {it.unit} × €{it.unitPrice} = <b>{eur(it.lineTotal)}</b></p>)}
        </Card>
      </div>
      <div className="mt-3 grid md:grid-cols-2 gap-3">
        <Card className="text-sm">
          <h2 className="font-semibold">Email inviate ({q.emails.length})</h2>
          {q.emails.length === 0 && <p className="text-slate-500 mt-1">Nessun invio registrato.</p>}
          {q.emails.map((e) => <p key={e.id} className="border-t py-1">{new Date(e.createdAt).toLocaleString("it-IT")} → {e.to} · <span className="text-slate-500">{e.status}</span></p>)}
        </Card>
        <Card className="text-sm">
          <h2 className="font-semibold">Storico eventi</h2>
          {q.events.map((e) => <p key={e.id} className="border-t py-1">{new Date(e.createdAt).toLocaleString("it-IT")} · <b>{e.type}</b> {e.payload ? <span className="text-slate-500">— {e.payload.slice(0, 120)}</span> : ""}</p>)}
        </Card>
      </div>
    </Shell>
  );
}

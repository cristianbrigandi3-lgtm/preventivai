import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { Shell, Card, btnPrimary } from "@/components/ui";
import { eur } from "@/lib/quotes";
import crypto from "crypto";

function ipHash(ip: string, token: string) {
  return crypto.createHash("sha256").update(`${ip}|${token}`).digest("hex").slice(0, 16);
}

async function decide(form: FormData) {
  "use server";
  const { headers: h } = await import("next/headers");
  const { prisma: db } = await import("@/lib/db");
  const token = String(form.get("token"));
  const choice = String(form.get("choice"));
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  if (!name || !email) return;
  const q = await db.quote.findUnique({ where: { publicToken: token } });
  if (!q || ["Accettato", "Rifiutato"].includes(q.status)) return;
  const hh = h();
  const ip = hh.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ua = hh.get("user-agent") || "";
  const status = choice === "accept" ? "Accettato" : "Rifiutato";
  await db.quote.update({ where: { id: q.id }, data: { status } });
  await db.quoteEvent.create({
    data: { quoteId: q.id, type: status.toLowerCase(), payload: JSON.stringify({ name, email, at: new Date().toISOString(), iphash: ipHash(ip, token), ua: ua.slice(0, 200) }) }
  });
  const { redirect: red } = await import("next/navigation");
  red(`/p/${token}?ok=${status}`);
}

export default async function Page({ params, searchParams }: { params: { token: string }; searchParams: { ok?: string } }) {
  const q = await prisma.quote.findUnique({ where: { publicToken: params.token }, include: { customer: true, company: true, items: true } });
  if (!q) notFound();

  if (searchParams.ok) {
    const ok = searchParams.ok === "Accettato";
    return (
      <div className="max-w-md mx-auto mt-20 px-4 text-center">
        <p className={`inline-block rounded-full px-3 py-1 text-sm ${ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{searchParams.ok}</p>
        <h1 className="text-2xl font-bold mt-3">{ok ? "Preventivo accettato con successo." : "Preventivo rifiutato. Grazie comunque."}</h1>
        <p className="text-sm text-slate-600 mt-2">{q.company.name} riceverà la notifica. Preventivo n. {q.number}.</p>
        <a href={`/api/p/${q.publicToken}/pdf`} className="inline-block mt-4 rounded-xl border px-4 py-2 text-sm">Scarica PDF</a>
      </div>
    );
  }

  if (q.status === "Inviato") {
    const hh = headers();
    const ip = hh.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ua = hh.get("user-agent") || "";
    await prisma.quote.update({ where: { id: q.id }, data: { status: "Visualizzato" } });
    await prisma.quoteEvent.create({ data: { quoteId: q.id, type: "viewed", payload: "Apertura link pubblico" } });
    await prisma.quoteView.create({ data: { quoteId: q.id, ipHash: ipHash(ip, q.publicToken), userAgent: ua.slice(0, 300) } });
  }

  const locked = ["Accettato", "Rifiutato"].includes(q.status);
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <p className="font-bold text-indigo-700">{q.company.name}</p>
      <p className="text-xs text-slate-500">{[q.company.address, q.company.piva ? `P.IVA ${q.company.piva}` : "", q.company.phone, q.company.email].filter(Boolean).join(" · ")}</p>
      <h1 className="text-2xl font-bold mt-2">Preventivo {q.number} — {q.subject}</h1>
      <p className="text-sm text-slate-600">
        Cliente: {q.customer?.business || `${q.customer?.firstName || ""} ${q.customer?.lastName || ""}`} ·
        Data {new Date(q.date).toLocaleDateString("it-IT")} · Scadenza {q.dueDate ? new Date(q.dueDate).toLocaleDateString("it-IT") : "—"}
      </p>
      {q.description && <p className="text-sm mt-2">{q.description}</p>}
      <Card className="mt-4 text-sm">
        {q.items.map((i) => <p key={i.id} className="border-t py-1">{i.description} — {i.qty} {i.unit} = <b>{eur(i.lineTotal)}</b></p>)}
        <p className="mt-1 text-slate-600">Imponibile {eur(q.subtotal)} + IVA {eur(q.vatTotal)}</p>
        <p className="mt-1 text-lg">Totale: <b className="text-green-700">{eur(q.total)}</b></p>
        {[q.payTerms && `Pagamento: ${q.payTerms}`, q.validity && `Validità: ${q.validity}`, q.notes && `Note: ${q.notes}`].filter(Boolean).map((t) => <p key={t as string} className="text-slate-600 mt-1">{t}</p>)}
        <a href={`/api/p/${q.publicToken}/pdf`} className="inline-block mt-2 text-indigo-600">Scarica PDF</a>
      </Card>
      {locked ? (
        <p className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-center">Questo preventivo risulta già <b>{q.status.toLowerCase()}</b>.</p>
      ) : (
        <form action={decide} className="mt-4 space-y-2">
          <input type="hidden" name="token" value={q.publicToken} />
          <input name="name" required placeholder="Il tuo nome e cognome" className="w-full rounded-xl border px-3 py-2 text-sm" />
          <input name="email" type="email" required placeholder="La tua email" className="w-full rounded-xl border px-3 py-2 text-sm" />
          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input type="checkbox" required className="mt-0.5" />
            Confermo di aver letto il preventivo e accetto/rifiuto consapevolmente. Verranno registrati data, ora e un identificativo tecnico non invasivo.
          </label>
          <div className="flex gap-2">
            <button name="choice" value="accept" className={btnPrimary}>Accetta preventivo</button>
            <button name="choice" value="reject" className="rounded-xl border px-4 py-2 text-sm">Rifiuta</button>
          </div>
        </form>
      )}
    </div>
  );
}

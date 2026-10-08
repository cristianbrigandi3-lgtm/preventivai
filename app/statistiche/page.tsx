import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { Shell, Card } from "@/components/ui";
import { eur } from "@/lib/quotes";

export default async function Page() {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const company = await prisma.company.findUnique({ where: { userId: uid } });
  if (!company) redirect("/login");
  const quotes = await prisma.quote.findMany({ where: { companyId: company.id, deletedAt: null }, include: { customer: true, events: true } });

  const total = quotes.reduce((a, q) => a + q.total, 0);
  const accepted = quotes.filter((q) => q.status === "Accettato");
  const conv = quotes.length ? Math.round((accepted.length / quotes.length) * 100) : 0;
  const avg = quotes.length ? total / quotes.length : 0;

  // Tempo medio di accettazione (da eventi created -> accettato)
  const deltas: number[] = [];
  for (const q of accepted) {
    const c = q.events.find((e) => e.type === "created");
    const a = [...q.events].reverse().find((e) => e.type === "accettato");
    if (c && a) deltas.push((new Date(a.createdAt).getTime() - new Date(c.createdAt).getTime()) / 864e5);
  }
  const avgDays = deltas.length ? deltas.reduce((x, y) => x + y, 0) / deltas.length : null;
  const avgDaysTxt = avgDays === null ? "—" : `${avgDays.toFixed(1)} giorni`;

  // Per mese (ultimi 6)
  const byMonth: Record<string, { n: number; v: number }> = {};
  for (const q of quotes) {
    const k = new Date(q.createdAt).toLocaleDateString("it-IT", { month: "short", year: "numeric" });
    byMonth[k] = byMonth[k] || { n: 0, v: 0 };
    byMonth[k].n++; byMonth[k].v += q.total;
  }
  // Top clienti per valore
  const byCust: Record<string, number> = {};
  for (const q of quotes) {
    const k = q.customer?.business || `${q.customer?.firstName || ""} ${q.customer?.lastName || ""}`.trim() || "—";
    byCust[k] = (byCust[k] || 0) + q.total;
  }
  const top = Object.entries(byCust).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <Shell>
      <h1 className="text-2xl font-bold">Statistiche</h1>
      {quotes.length === 0 && <Card className="mt-3"><p className="text-sm text-slate-600">Non ci sono ancora abbastanza dati. Crea i primi preventivi per vedere le statistiche.</p></Card>}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["Fatturato potenziale", eur(total)], ["Tasso conversione", `${conv}%`], ["Valore medio", eur(avg)], ["Accettati", `${accepted.length}/${quotes.length}`], ["Tempo medio accettazione", avgDaysTxt], ["Valore accettati", eur(accepted.reduce((a, q) => a + q.total, 0))]].map(([k, v]) => (
          <Card key={k}><p className="text-xs text-slate-500">{k}</p><p className="text-xl font-bold">{v}</p></Card>
        ))}
      </div>
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-semibold text-sm">Preventivi per mese</h2>
          {Object.entries(byMonth).map(([m, d]) => (
            <div key={m} className="mt-2 text-sm">
              <div className="flex justify-between"><span>{m} ({d.n})</span><b>{eur(d.v)}</b></div>
              <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-indigo-600" style={{ width: `${total ? Math.round((d.v / total) * 100) : 0}%` }} /></div>
            </div>
          ))}
          {Object.keys(byMonth).length === 0 && <p className="text-sm text-slate-500">Nessun dato.</p>}
        </Card>
        <Card>
          <h2 className="font-semibold text-sm">Top clienti per valore</h2>
          {top.map(([k, v]) => <p key={k} className="mt-2 text-sm flex justify-between"><span>{k}</span><b>{eur(v)}</b></p>)}
          {top.length === 0 && <p className="text-sm text-slate-500">Nessun dato.</p>}
        </Card>
      </div>
    </Shell>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { Shell, Card } from "@/components/ui";
import { eur, statusColor } from "@/lib/quotes";

export default async function Page() {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const company = await prisma.company.findUnique({ where: { userId: uid } });
  if (!company) redirect("/login");
  if (!company.onboarded) redirect("/onboarding");
  const quotes = await prisma.quote.findMany({ where: { companyId: company.id, deletedAt: null }, include: { customer: true }, orderBy: { createdAt: "desc" }, take: 20 });
  const all = await prisma.quote.findMany({ where: { companyId: company.id, deletedAt: null } });
  const n = (s: string) => all.filter((q) => q.status === s).length;
  const stats = [
    ["Creati", all.length], ["Inviati", n("Inviato")], ["Accettati", n("Accettato")],
    ["In attesa", n("Inviato") + n("Visualizzato")],
    ["Valore totale", eur(all.reduce((a, q) => a + q.total, 0))],
    ["Valore accettati", eur(all.filter((q) => q.status === "Accettato").reduce((a, q) => a + q.total, 0))]
  ];
  const followup = all.filter((q) => ["Inviato", "Visualizzato"].includes(q.status)).length;

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/preventivi/nuovo" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">+ Nuovo preventivo</Link>
      </div>
      {followup > 0 && <p className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm">{followup} preventivi necessitano di follow-up</p>}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map(([k, v]) => <Card key={k}><p className="text-xs text-slate-500">{k}</p><p className="text-xl font-bold">{v}</p></Card>)}
      </div>
      <h2 className="mt-6 font-semibold">Ultimi preventivi</h2>
      {quotes.length === 0 ? (
        <Card className="mt-2 text-sm text-slate-600">Nessun preventivo. <Link className="text-indigo-600" href="/preventivi/nuovo">Creane uno ora</Link>.</Card>
      ) : (
        <div className="mt-2 space-y-2">
          {quotes.map((q) => (
            <Link key={q.id} href={`/preventivi/${q.id}`} className="block rounded-xl border bg-white p-3 flex items-center justify-between text-sm">
              <span><b>{q.number}</b> · {q.customer?.business || `${q.customer?.firstName || ""} ${q.customer?.lastName || ""}` || "—"} · {new Date(q.date).toLocaleDateString("it-IT")} · <b>{eur(q.total)}</b></span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor(q.status)}`}>{q.status}</span>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}

import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { Shell, Card } from "@/components/ui";
import { eur, statusColor } from "@/lib/quotes";

export default async function Page({ params }: { params: { id: string } }) {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const company = await prisma.company.findUnique({ where: { userId: uid } });
  if (!company) redirect("/login");
  const c = await prisma.customer.findFirst({ where: { id: params.id, companyId: company.id }, include: { quotes: { orderBy: { createdAt: "desc" } } } });
  if (!c) notFound();
  const total = c.quotes.reduce((a, q) => a + q.total, 0);
  const acc = c.quotes.filter((q) => q.status === "Accettato").length;
  return (
    <Shell>
      <h1 className="text-2xl font-bold">{c.business || `${c.firstName || ""} ${c.lastName || ""}`}</h1>
      <p className="text-sm text-slate-600">{c.email || ""} {c.phone || ""} {c.address || ""} {c.piva ? `· P.IVA ${c.piva}` : ""}</p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Card><p className="text-xs text-slate-500">Preventivi</p><p className="text-xl font-bold">{c.quotes.length}</p></Card>
        <Card><p className="text-xs text-slate-500">Valore totale</p><p className="text-xl font-bold">{eur(total)}</p></Card>
        <Card><p className="text-xs text-slate-500">Accettati</p><p className="text-xl font-bold">{acc}</p></Card>
      </div>
      <h2 className="mt-5 font-semibold">Storico preventivi</h2>
      <div className="mt-2 space-y-2">
        {c.quotes.map((q) => (
          <a key={q.id} href={`/preventivi/${q.id}`} className="block rounded-xl border bg-white p-3 text-sm flex justify-between">
            <span><b>{q.number}</b> · {q.subject || "—"} · {eur(q.total)}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor(q.status)}`}>{q.status}</span>
          </a>
        ))}
      </div>
    </Shell>
  );
}

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { Shell, Card, btnPrimary } from "@/components/ui";

const PLANS = [
  { id: "FREE", name: "FREE", price: "€0", feats: ["5 preventivi/mese", "Template base"] },
  { id: "PRO", name: "PRO", price: "€12/mese", feats: ["Preventivi illimitati", "Logo e PDF personalizzati", "Follow-up automatici", "Gestione clienti", "Invio email", "Statistiche"] },
  { id: "BUSINESS", name: "BUSINESS", price: "€29/mese", feats: ["Tutto PRO", "Più utenti", "Personalizzazione avanzata"] }
];

export default async function Page() {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const sub = await prisma.subscription.findUnique({ where: { userId: uid } });
  const current = sub?.plan || "FREE";
  const stripeOn = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_PRO);
  return (
    <Shell>
      <h1 className="text-2xl font-bold">Abbonamento</h1>
      <p className="text-sm text-slate-600 mt-1">Piano attuale: <b>{current}</b></p>
      <div className="mt-4 grid md:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <Card key={p.id}>
            <h2 className="font-bold">{p.name} — {p.price}</h2>
            <ul className="text-sm text-slate-600 mt-2 list-disc ml-4">{p.feats.map((f) => <li key={f}>{f}</li>)}</ul>
            <div className="mt-3">
              {p.id === current ? <span className="text-sm text-green-700 font-semibold">Piano attivo</span> :
                p.id === "FREE" ? <span className="text-sm text-slate-400">—</span> :
                stripeOn ? <a href={`/api/billing/checkout?plan=${p.id}`} className={btnPrimary}>Passa a {p.id}</a> :
                <span className="text-xs text-slate-500">Pagamenti Stripe non ancora collegati (vedi README).</span>}
            </div>
          </Card>
        ))}
      </div>
    </Shell>
  );
}

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { Shell, Card, inputCls, btnPrimary } from "@/components/ui";

async function save(form: FormData) {
  "use server";
  const { redirect: red } = await import("next/navigation");
  const { prisma: db } = await import("@/lib/db");
  const { getUserId: g } = await import("@/lib/auth");
  const uid = await g();
  if (!uid) red("/login");
  const c = await db.company.findUnique({ where: { userId: uid! } });
  if (!c) red("/login");
  const get = (k: string) => String(form.get(k) || "").trim() || null;
  await db.company.update({ where: { id: c!.id }, data: { name: String(form.get("name") || c!.name), address: get("address"), piva: get("piva"), cf: get("cf"), phone: get("phone"), email: get("email"), iban: get("iban"), defaultPayTerms: get("defaultPayTerms") } });
  red("/impostazioni?ok=1");
}

async function saveFollowup(form: FormData) {
  "use server";
  const { redirect: red } = await import("next/navigation");
  const { prisma: db } = await import("@/lib/db");
  const { getUserId: g } = await import("@/lib/auth");
  const uid = await g();
  if (!uid) red("/login");
  const c = await db.company.findUnique({ where: { userId: uid! } });
  if (!c) red("/login");
  await db.company.update({
    where: { id: c!.id },
    data: {
      followupEnabled: form.get("followupEnabled") === "on",
      followupDay1: Math.max(1, Number(form.get("followupDay1")) || 2),
      followupDay2: Math.max(1, Number(form.get("followupDay2")) || 5),
      followupText1: String(form.get("followupText1") || "") || null,
      followupText2: String(form.get("followupText2") || "") || null
    }
  });
  red("/impostazioni?ok=1");
}

export default async function Page() {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const c = await prisma.company.findUnique({ where: { userId: uid } });
  const sub = await prisma.subscription.findUnique({ where: { userId: uid } });
  return (
    <Shell>
      <h1 className="text-2xl font-bold">Impostazioni</h1>
      <div className="mt-3 grid md:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-semibold">Azienda / Dati fiscali / Pagamenti</h2>
          <form action={save} className="mt-2 space-y-2">
            {(["name", "address", "piva", "cf", "phone", "email", "iban", "defaultPayTerms"] as const).map((k) => (
              <input key={k} name={k} defaultValue={(c as any)?.[k] || ""} placeholder={k} className={inputCls} />
            ))}
            <button className={btnPrimary}>Salva</button>
          </form>
        </Card>
        <Card>
          <h2 className="font-semibold">Follow-up automatici (default)</h2>
          <form action={saveFollowup} className="mt-2 space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="followupEnabled" defaultChecked={c?.followupEnabled ?? true} /> Attivi di default
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">1° dopo (giorni)<input name="followupDay1" type="number" min={1} defaultValue={c?.followupDay1 ?? 2} className={inputCls} /></label>
              <label className="text-xs">2° dopo (giorni)<input name="followupDay2" type="number" min={1} defaultValue={c?.followupDay2 ?? 5} className={inputCls} /></label>
            </div>
            <textarea name="followupText1" defaultValue={c?.followupText1 || ""} rows={2} placeholder="Testo 1° reminder (vuoto = automatico)" className={inputCls} />
            <textarea name="followupText2" defaultValue={c?.followupText2 || ""} rows={2} placeholder="Testo 2° reminder (vuoto = automatico)" className={inputCls} />
            <button className={btnPrimary}>Salva follow-up</button>
          </form>
        </Card>
        <Card>
          <h2 className="font-semibold">Abbonamento</h2>
          <p className="text-sm mt-2">Piano attuale: <b>{sub?.plan || "FREE"}</b></p>
          <p className="text-sm text-slate-600">FREE: 5 preventivi/mese. PRO: illimitati + logo, follow-up, email, statistiche. BUSINESS: multi-utente. Pagamenti Stripe: da collegare.</p>
        </Card>
      </div>
    </Shell>
  );
}

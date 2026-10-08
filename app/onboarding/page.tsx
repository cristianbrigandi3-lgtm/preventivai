import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { inputCls, btnPrimary } from "@/components/ui";

const CATS = ["Elettricista", "Idraulico", "Installatore", "Climatizzazione", "Serramenti", "Imbianchino", "Edilizia", "Manutenzione", "Altro"];

async function save(form: FormData) {
  "use server";
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const c = await prisma.company.findUnique({ where: { userId: uid } });
  if (!c) redirect("/login");
  const get = (k: string) => String(form.get(k) || "").trim() || null;
  await prisma.company.update({
    where: { id: c.id },
    data: {
      name: String(form.get("name") || c.name), logoUrl: get("logoUrl"), address: get("address"),
      piva: get("piva"), cf: get("cf"), phone: get("phone"), email: get("email"),
      website: get("website"), iban: get("iban"), defaultPayTerms: get("defaultPayTerms"),
      category: get("category"), onboarded: true
    }
  });
  const svcName = String(form.get("svcName") || "").trim();
  if (svcName) {
    await prisma.service.create({
      data: { companyId: c.id, name: svcName, price: Number(form.get("svcPrice") || 0) || 0, unit: String(form.get("svcUnit") || "pz"), vatPct: Number(form.get("svcVat") ?? 22) || 0 }
    });
  }
  redirect("/preventivi/nuovo");
}

export default async function Page() {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const c = await prisma.company.findUnique({ where: { userId: uid } });
  return (
    <form action={save} className="max-w-lg mx-auto mt-10 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Benvenuto in PreventivAI</h1>
        <p className="text-sm text-slate-600">3 passi e crei il tuo primo preventivo.</p>
      </div>
      <section className="space-y-2">
        <h2 className="font-semibold text-sm">Passo 1 — La tua attività</h2>
        <input name="name" defaultValue={c?.name || ""} required placeholder="Nome attività *" className={inputCls} />
        <select name="category" defaultValue={c?.category || ""} className={inputCls}>
          <option value="">Categoria...</option>
          {CATS.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input name="phone" defaultValue={c?.phone || ""} placeholder="Telefono" className={inputCls} />
          <input name="email" defaultValue={c?.email || ""} placeholder="Email" className={inputCls} />
        </div>
        <input name="address" defaultValue={c?.address || ""} placeholder="Indirizzo" className={inputCls} />
        <div className="grid grid-cols-2 gap-3">
          <input name="piva" defaultValue={c?.piva || ""} placeholder="P.IVA" className={inputCls} />
          <input name="iban" defaultValue={c?.iban || ""} placeholder="IBAN (opz.)" className={inputCls} />
        </div>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold text-sm">Passo 2 — Logo e pagamenti</h2>
        <input name="logoUrl" defaultValue={c?.logoUrl || ""} placeholder="URL logo (opz.)" className={inputCls} />
        <input name="defaultPayTerms" defaultValue={c?.defaultPayTerms || ""} placeholder="Condizioni pagamento predefinite" className={inputCls} />
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold text-sm">Passo 3 — Il tuo primo servizio (opz.)</h2>
        <div className="grid grid-cols-3 gap-2">
          <input name="svcName" placeholder="Es. Punto luce" className={`${inputCls} col-span-2`} />
          <input name="svcPrice" type="number" step="any" min={0} placeholder="Prezzo €" className={inputCls} />
        </div>
      </section>
      <button className={btnPrimary}>Salva e crea il primo preventivo →</button>
    </form>
  );
}

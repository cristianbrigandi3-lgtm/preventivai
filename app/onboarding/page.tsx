import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { inputCls, btnPrimary } from "@/components/ui";

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
      onboarded: true
    }
  });
  redirect("/dashboard");
}

export default async function Page() {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const c = await prisma.company.findUnique({ where: { userId: uid } });
  return (
    <form action={save} className="max-w-lg mx-auto mt-10 space-y-3">
      <h1 className="text-2xl font-bold">Configura la tua attività</h1>
      <p className="text-sm text-slate-600">Questi dati appariranno automaticamente nei preventivi.</p>
      <input name="name" defaultValue={c?.name || ""} required placeholder="Nome attività" className={inputCls} />
      <input name="address" defaultValue={c?.address || ""} placeholder="Indirizzo" className={inputCls} />
      <div className="grid grid-cols-2 gap-3">
        <input name="piva" defaultValue={c?.piva || ""} placeholder="P.IVA" className={inputCls} />
        <input name="cf" defaultValue={c?.cf || ""} placeholder="Cod. fiscale (opz.)" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input name="phone" defaultValue={c?.phone || ""} placeholder="Telefono" className={inputCls} />
        <input name="email" defaultValue={c?.email || ""} placeholder="Email" className={inputCls} />
      </div>
      <input name="website" defaultValue={c?.website || ""} placeholder="Sito web (opz.)" className={inputCls} />
      <input name="iban" defaultValue={c?.iban || ""} placeholder="IBAN (opz.)" className={inputCls} />
      <input name="defaultPayTerms" defaultValue={c?.defaultPayTerms || ""} placeholder="Condizioni pagamento predefinite" className={inputCls} />
      <button className={btnPrimary}>Salva e vai alla dashboard</button>
    </form>
  );
}

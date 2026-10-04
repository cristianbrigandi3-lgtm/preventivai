import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { Shell, Card, inputCls, btnPrimary } from "@/components/ui";

async function create(form: FormData) {
  "use server";
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const company = await prisma.company.findUnique({ where: { userId: uid } });
  if (!company) redirect("/login");
  const business = String(form.get("business") || "").trim();
  const firstName = String(form.get("firstName") || "").trim() || null;
  const lastName = String(form.get("lastName") || "").trim() || null;
  const email = String(form.get("email") || "").trim() || null;
  const phone = String(form.get("phone") || "").trim() || null;
  if (!business && !firstName) redirect("/clienti?err=Nome+o+ragione+sociale+obbligatori");
  await prisma.customer.create({
    data: { companyId: company.id, business: business || null, firstName, lastName, email, phone, address: String(form.get("address") || "") || null, piva: String(form.get("piva") || "") || null, cf: String(form.get("cf") || "") || null }
  });
  revalidatePath("/clienti");
  redirect("/clienti");
}

export default async function Page({ searchParams }: { searchParams: { q?: string } }) {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const company = await prisma.company.findUnique({ where: { userId: uid } });
  if (!company) redirect("/login");
  const q = searchParams.q || "";
  const customers = await prisma.customer.findMany({
    where: { companyId: company.id, deletedAt: null, ...(q ? { OR: [{ business: { contains: q } }, { firstName: { contains: q } }, { lastName: { contains: q } }, { email: { contains: q } }] } : {}) },
    orderBy: { createdAt: "desc" }, take: 50
  });
  return (
    <Shell>
      <h1 className="text-2xl font-bold">Clienti</h1>
      <form className="mt-3 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Cerca cliente..." className={inputCls} />
        <button className={btnPrimary}>Cerca</button>
      </form>
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-semibold">Nuovo cliente</h2>
          <form action={create} className="mt-3 space-y-2">
            <input name="business" placeholder="Ragione sociale (o lascia vuoto)" className={inputCls} />
            <div className="grid grid-cols-2 gap-2">
              <input name="firstName" placeholder="Nome" className={inputCls} />
              <input name="lastName" placeholder="Cognome" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input name="email" placeholder="Email" className={inputCls} />
              <input name="phone" placeholder="Telefono" className={inputCls} />
            </div>
            <input name="address" placeholder="Indirizzo" className={inputCls} />
            <div className="grid grid-cols-2 gap-2">
              <input name="piva" placeholder="P.IVA" className={inputCls} />
              <input name="cf" placeholder="Cod. fiscale" className={inputCls} />
            </div>
            <button className={btnPrimary}>Salva cliente</button>
          </form>
        </Card>
        <div className="space-y-2">
          {customers.map((c) => (
            <a key={c.id} href={`/clienti/${c.id}`} className="block rounded-xl border bg-white p-3 text-sm">
              <b>{c.business || `${c.firstName || ""} ${c.lastName || ""}`}</b>
              <span className="text-slate-500"> · {c.email || c.phone || "—"}</span>
            </a>
          ))}
          {customers.length === 0 && <Card><p className="text-sm text-slate-500">Nessun cliente trovato.</p></Card>}
        </div>
      </div>
    </Shell>
  );
}

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { Shell, Card, inputCls, btnPrimary, btnGhost } from "@/components/ui";
import DeleteButton from "./delete-button";

async function companyId() {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const c = await prisma.company.findUnique({ where: { userId: uid } });
  if (!c) redirect("/login");
  return c.id;
}

async function upsert(form: FormData) {
  "use server";
  const cid = await companyId();
  const id = String(form.get("id") || "");
  const data = {
    companyId: cid,
    name: String(form.get("name") || "").trim(),
    description: String(form.get("description") || "").trim() || null,
    price: Number(form.get("price") || 0) || 0,
    unit: String(form.get("unit") || "pz").trim() || "pz",
    vatPct: Number(form.get("vatPct") ?? 22) || 0,
    category: String(form.get("category") || "").trim() || null,
    cost: form.get("cost") ? Number(form.get("cost")) || null : null,
    durationMin: form.get("durationMin") ? Number(form.get("durationMin")) || null : null,
    notes: String(form.get("notes") || "").trim() || null
  };
  if (!data.name) redirect("/servizi?err=Nome+obbligatorio");
  if (id) await prisma.service.updateMany({ where: { id, companyId: cid }, data });
  else await prisma.service.create({ data });
  revalidatePath("/servizi");
  redirect("/servizi");
}

async function remove(form: FormData) {
  "use server";
  const cid = await companyId();
  await prisma.service.updateMany({ where: { id: String(form.get("id")), companyId: cid }, data: { deletedAt: new Date() } });
  revalidatePath("/servizi");
  redirect("/servizi");
}

async function duplicate(form: FormData) {
  "use server";
  const cid = await companyId();
  const s = await prisma.service.findFirst({ where: { id: String(form.get("id")), companyId: cid } });
  if (s) await prisma.service.create({ data: { companyId: cid, name: s.name + " (copia)", description: s.description, price: s.price, unit: s.unit, vatPct: s.vatPct, category: s.category, cost: s.cost, durationMin: s.durationMin, notes: s.notes } });
  revalidatePath("/servizi");
  redirect("/servizi");
}

export default async function Page({ searchParams }: { searchParams: { q?: string; cat?: string } }) {
  const cid = await companyId();
  const q = searchParams.q || "";
  const cat = searchParams.cat || "";
  const where: any = { companyId: cid, deletedAt: null };
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }];
  if (cat) where.category = cat;
  const services = await prisma.service.findMany({ where, orderBy: [{ useCount: "desc" }, { name: "asc" }], take: 100 });
  const cats: { category: string | null }[] = await prisma.service.findMany({ where: { companyId: cid, deletedAt: null }, select: { category: true }, distinct: ["category"] });

  return (
    <Shell>
      <h1 className="text-2xl font-bold">Catalogo servizi</h1>
      <form className="mt-3 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Cerca servizio..." className={inputCls} />
        <select name="cat" defaultValue={cat} className={inputCls}>
          <option value="">Tutte le categorie</option>
          {cats.filter((c) => c.category).map((c) => <option key={c.category!} value={c.category!}>{c.category}</option>)}
        </select>
        <button className={btnPrimary}>Cerca</button>
      </form>
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-semibold">Nuovo / modifica servizio</h2>
          <form action={upsert} className="mt-2 space-y-2">
            <input name="id" placeholder="ID per modifica (lascia vuoto per creare)" className={inputCls} />
            <input name="name" required placeholder="Nome * (es. Installazione climatizzatore)" className={inputCls} />
            <input name="description" placeholder="Descrizione" className={inputCls} />
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs">Prezzo €<input name="price" type="number" step="any" min={0} defaultValue={0} className={inputCls} /></label>
              <label className="text-xs">Unità<input name="unit" defaultValue="pz" className={inputCls} /></label>
              <label className="text-xs">IVA %<input name="vatPct" type="number" step="any" defaultValue={22} className={inputCls} /></label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input name="category" placeholder="Categoria" className={inputCls} />
              <label className="text-xs">Costo int. €<input name="cost" type="number" step="any" className={inputCls} /></label>
              <label className="text-xs">Durata min<input name="durationMin" type="number" className={inputCls} /></label>
            </div>
            <input name="notes" placeholder="Note interne" className={inputCls} />
            <button className={btnPrimary}>Salva servizio</button>
          </form>
        </Card>
        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.id} className="rounded-xl border bg-white p-3 text-sm">
              <p><b>{s.name}</b> <span className="text-slate-500">· €{s.price} / {s.unit} · IVA {s.vatPct}%{s.category ? ` · ${s.category}` : ""}{s.useCount > 0 ? ` · usato ${s.useCount}x` : ""}</span></p>
              <p className="text-xs text-slate-400">id: {s.id}</p>
              <div className="mt-1 flex gap-2">
                <form action={duplicate}><input type="hidden" name="id" value={s.id} /><button className={btnGhost}>Duplica</button></form>
                <form action={remove}><input type="hidden" name="id" value={s.id} /><DeleteButton /></form>
              </div>
            </div>
          ))}
          {services.length === 0 && <Card><p className="text-sm text-slate-500">Nessun servizio. Aggiungi il primo dal form.</p></Card>}
        </div>
      </div>
    </Shell>
  );
}

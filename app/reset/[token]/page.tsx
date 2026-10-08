import { confirmReset } from "@/app/actions";
import { inputCls, btnPrimary } from "@/components/ui";

export default function Page({ params, searchParams }: { params: { token: string }; searchParams: { err?: string } }) {
  return (
    <form action={confirmReset} className="space-y-3 max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-bold">Nuova password</h1>
      {searchParams.err && <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{searchParams.err}</p>}
      <input type="hidden" name="token" value={params.token} />
      <input name="password" type="password" required minLength={8} placeholder="Nuova password (min 8)" className={inputCls} />
      <button className={btnPrimary}>Aggiorna password</button>
    </form>
  );
}

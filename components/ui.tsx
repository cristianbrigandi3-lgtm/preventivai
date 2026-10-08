import Link from "next/link";

export function Toast({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{msg}</p>;
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-indigo-700">PreventivAI</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/preventivi/nuovo">Nuovo</Link>
            <Link href="/clienti">Clienti</Link>
            <Link href="/servizi">Servizi</Link>
            <Link href="/statistiche">Statistiche</Link>
            <Link href="/abbonamento">Piano</Link>
            <Link href="/impostazioni">Impostazioni</Link>
            <form action="/api/logout" method="post"><button className="text-slate-500">Esci</button></form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export const inputCls = "w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
export const btnPrimary = "rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700";
export const btnGhost = "rounded-xl border px-4 py-2 text-sm hover:bg-slate-100";

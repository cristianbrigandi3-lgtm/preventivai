"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { login, register, requestReset } from "./actions";
import { inputCls, btnPrimary } from "@/components/ui";

function Err() {
  const q = useSearchParams();
  const e = q.get("err");
  if (!e) return null;
  return <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{e}</p>;
}

export function LoginForm() {
  return (
    <Suspense>
      <form action={login} className="space-y-3 max-w-sm mx-auto mt-16">
        <h1 className="text-2xl font-bold">Accedi</h1><Err />
        <input name="email" type="email" required placeholder="Email" className={inputCls} />
        <input name="password" type="password" required placeholder="Password" className={inputCls} />
        <button className={btnPrimary}>Accedi</button>
        <p className="text-sm"><a className="text-indigo-600" href="/recupero">Password dimenticata?</a> · <a className="text-indigo-600" href="/registrati">Registrati</a></p>
      </form>
    </Suspense>
  );
}

export function RegisterForm() {
  return (
    <Suspense>
      <form action={register} className="space-y-3 max-w-sm mx-auto mt-10">
        <h1 className="text-2xl font-bold">Crea account</h1><Err />
        <input name="name" required placeholder="Nome e cognome" className={inputCls} />
        <input name="email" type="email" required placeholder="Email" className={inputCls} />
        <input name="password" type="password" required placeholder="Password (min 8)" className={inputCls} />
        <input name="businessName" required placeholder="Nome attività" className={inputCls} />
        <input name="piva" placeholder="P.IVA (opzionale)" className={inputCls} />
        <button className={btnPrimary}>Registrati</button>
      </form>
    </Suspense>
  );
}

export function ResetForm() {
  return (
    <Suspense>
      <form action={requestReset} className="space-y-3 max-w-sm mx-auto mt-16">
        <h1 className="text-2xl font-bold">Recupero password</h1><Err />
        <input name="email" type="email" required placeholder="Email" className={inputCls} />
        <button className={btnPrimary}>Invia link di reset</button>
      </form>
    </Suspense>
  );
}

"use client";
import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("pa_cookie_ok")) setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-4 shadow-lg text-sm flex flex-col md:flex-row gap-3 items-center">
        <p className="flex-1">Usiamo solo cookie tecnici necessari al login (<a className="text-indigo-600" href="/cookie">dettagli</a>). Nessun tracking.</p>
        <button onClick={() => { localStorage.setItem("pa_cookie_ok", "1"); setShow(false); }} className="rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold">Ho capito</button>
      </div>
    </div>
  );
}

"use client";
export default function DeleteButton() {
  return (
    <button
      className="rounded-xl border px-4 py-2 text-sm text-red-600"
      onClick={(e) => { if (!confirm("Eliminare definitivamente?")) e.preventDefault(); }}
    >Elimina</button>
  );
}

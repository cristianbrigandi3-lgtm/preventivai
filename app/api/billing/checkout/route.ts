import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";

// Avvia checkout Stripe. Richiede STRIPE_SECRET_KEY + STRIPE_PRICE_PRO/BUSINESS + APP_URL.
export async function GET(req: Request) {
  const uid = await getUserId();
  if (!uid) return NextResponse.redirect(new URL("/login", process.env.APP_URL || "http://localhost:3000"));
  const plan = new URL(req.url).searchParams.get("plan");
  if (plan !== "PRO" && plan !== "BUSINESS") return NextResponse.json({ error: "plan non valido" }, { status: 400 });
  const key = process.env.STRIPE_SECRET_KEY;
  const price = plan === "PRO" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_BUSINESS;
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  if (!key || !price) return NextResponse.json({ error: "Stripe non configurato. Aggiungi STRIPE_SECRET_KEY e PRICE ids nel .env" }, { status: 501 });
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(key);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl}/abbonamento?ok=1`,
    cancel_url: `${appUrl}/abbonamento?c=1`,
    metadata: { userId: uid, plan }
  });
  return NextResponse.redirect(session.url!);
}

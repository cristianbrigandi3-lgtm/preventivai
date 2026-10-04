import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Webhook Stripe: aggiorna Subscription su checkout completato.
// Configurare STRIPE_WEBHOOK_SECRET + endpoint /api/billing/webhook in dashboard Stripe.
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await req.text();
  let event: any;
  try {
    if (secret && sig) {
      const { default: Stripe } = await import("stripe");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      event = stripe.webhooks.constructEvent(raw, sig, secret);
    } else {
      event = JSON.parse(raw);
    }
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const userId: string | undefined = s.metadata?.userId || s.client_reference_id;
    const plan: string | undefined = s.metadata?.plan;
    if (userId && plan) {
      await prisma.subscription.upsert({
        where: { userId }, create: { userId, plan, stripeId: s.customer ?? null, status: "active" },
        update: { plan, stripeId: s.customer ?? null, status: "active" }
      });
    }
  }
  if (event.type === "customer.subscription.deleted") {
    const s = event.data.object;
    const sub = await prisma.subscription.findFirst({ where: { stripeId: s.customer ?? "" } });
    if (sub) await prisma.subscription.update({ where: { id: sub.id }, data: { plan: "FREE", status: "canceled" } });
  }
  return NextResponse.json({ received: true });
}

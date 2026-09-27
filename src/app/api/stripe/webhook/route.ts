// Stripe calls this after checkout events. It's the source of truth for payment: an order only becomes
// PAID when a correctly signed event says so (the return page double-checks with Stripe the same way).
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { expireCheckoutSession, fulfilCheckoutSession } from "@/lib/orders";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook secret not configured", { status: 500 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  // The signature covers the exact raw body, so read it as text before parsing anything
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await fulfilCheckoutSession(event.data.object);
      break;
    case "checkout.session.expired":
      await expireCheckoutSession(event.data.object);
      break;
    // Other events are acknowledged and ignored
  }

  return Response.json({ received: true });
}

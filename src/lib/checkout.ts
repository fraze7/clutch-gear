// Turns a cart summary into an order and a Stripe Checkout request. No database or Stripe calls here.
import type Stripe from "stripe";
import type { CartLine, CartProduct } from "@/lib/cart";

export const CHECKOUT_EXPIRY_SECONDS = 30 * 60; // Stripe's minimum; pending orders expire quickly

export type PurchasableLine = CartLine<CartProduct & { id: string }>;

// Out-of-stock lines are never charged; reduced lines are charged at the reduced quantity
export function purchasableLines(lines: PurchasableLine[]) {
  return lines.filter((line) => line.issue !== "out-of-stock" && line.quantity > 0);
}

export function toOrderItems(lines: PurchasableLine[]) {
  return lines.map((line) => ({
    productId: line.product.id,
    productSlug: line.product.slug,
    productName: line.product.name,
    unitPriceCents: line.product.priceCents,
    quantity: line.quantity,
  }));
}

export function buildCheckoutSessionParams(args: {
  orderId: string;
  lines: PurchasableLine[];
  shippingCents: number;
  origin: string;
  now?: number;
}): Stripe.Checkout.SessionCreateParams {
  const { orderId, lines, shippingCents, origin, now = Date.now() } = args;
  return {
    mode: "payment",
    client_reference_id: orderId,
    metadata: { orderId },
    line_items: lines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: "gbp",
        unit_amount: line.product.priceCents, // from the database, never from the browser
        product_data: { name: line.product.name, metadata: { slug: line.product.slug } },
      },
    })),
    shipping_address_collection: { allowed_countries: ["GB"] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: shippingCents === 0 ? "Free UK delivery" : "UK delivery",
          fixed_amount: { amount: shippingCents, currency: "gbp" },
          delivery_estimate: {
            minimum: { unit: "business_day", value: 2 },
            maximum: { unit: "business_day", value: 4 },
          },
        },
      },
    ],
    success_url: `${origin}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart?checkout=cancelled`,
    expires_at: Math.floor(now / 1000) + CHECKOUT_EXPIRY_SECONDS,
  };
}

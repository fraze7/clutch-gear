// Order creation and fulfilment. Server-only.
import type Stripe from "stripe";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { toOrderItems, type PurchasableLine } from "@/lib/checkout";

export async function createPendingOrder(args: {
  lines: PurchasableLine[];
  subtotalCents: number;
  shippingCents: number;
  userId?: string;
}) {
  return db.order.create({
    data: {
      userId: args.userId,
      subtotalCents: args.subtotalCents,
      shippingCents: args.shippingCents,
      totalCents: args.subtotalCents + args.shippingCents,
      items: { create: toOrderItems(args.lines) },
    },
    select: { id: true },
  });
}

export type FulfilResult = "paid" | "already-paid" | "not-paid" | "mismatch" | "not-found";

// Marks an order paid and takes the items out of stock, in one transaction.
// Called by both the webhook and the return page, and Stripe may send the same event more than once,
// so it's idempotent: only a PENDING (or EXPIRED) order can become PAID, and only once.
export async function fulfilCheckoutSession(session: Stripe.Checkout.Session): Promise<FulfilResult> {
  const orderId = session.metadata?.orderId;
  if (!orderId) return "not-found";
  if (session.payment_status !== "paid") return "not-paid";

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { stripeSessionId: true, totalCents: true, currency: true, status: true },
  });
  if (!order) return "not-found";
  if (order.status === "PAID") return "already-paid";
  // The session must be the one we created for this order, for the amount we calculated
  if (
    order.stripeSessionId !== session.id ||
    session.amount_total !== order.totalCents ||
    session.currency !== order.currency
  ) {
    return "mismatch";
  }

  const shipping = session.collected_information?.shipping_details;
  const changed = await db.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: { in: ["PENDING", "EXPIRED"] } },
      data: {
        status: "PAID",
        paidAt: new Date(),
        email: session.customer_details?.email ?? null,
        shippingName: shipping?.name ?? null,
        shippingAddress: shipping?.address ? { ...shipping.address } : undefined,
      },
    });
    if (updated.count === 0) return false; // another request got here first

    const items = await tx.orderItem.findMany({ where: { orderId }, select: { productId: true, quantity: true } });
    for (const item of items) {
      if (!item.productId) continue;
      const decremented = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      // Sold more than we had (two buyers at once) — never go below zero
      if (decremented.count === 0) await tx.product.update({ where: { id: item.productId }, data: { stock: 0 } });
    }
    return true;
  });

  if (!changed) return "already-paid";
  revalidateTag("products", "max"); // stock changed
  return "paid";
}

export async function expireCheckoutSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  await db.order.updateMany({
    where: { id: orderId, stripeSessionId: session.id, status: "PENDING" },
    data: { status: "EXPIRED" },
  });
}

// A signed-in customer's orders, newest first. Pending checkouts they abandoned are left out.
export function getOrdersForUser(userId: string) {
  return db.order.findMany({
    where: { userId, status: { in: ["PAID", "EXPIRED"] } },
    orderBy: { createdAt: "desc" },
    include: { items: { select: { productName: true, quantity: true }, orderBy: { productName: "asc" } } },
  });
}

// Orders placed while signed in are private to that account; guest orders are found by their unguessable id
export function canViewOrder(order: { userId: string | null }, viewerId: string | undefined) {
  return order.userId === null || order.userId === viewerId;
}

export function getOrder(id: string) {
  return db.order.findUnique({
    where: { id },
    include: { items: { orderBy: { productName: "asc" } } },
  });
}

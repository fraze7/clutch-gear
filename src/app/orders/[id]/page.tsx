import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatPrice } from "@/lib/catalog";
import { canViewOrder, getOrder } from "@/lib/orders";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

// Guest orders are found by their id, which is long and random (a cuid), so it can't be guessed.
// Orders placed while signed in are only visible to that account.
export default function OrderPage({ params }: PageProps<"/orders/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl border border-line bg-surface" />}>
      <OrderDetails params={params} />
    </Suspense>
  );
}

const STATUS = {
  PAID: { title: "Thanks — your order is confirmed", tone: "text-emerald-400", label: "Paid" },
  PENDING: { title: "Waiting for payment confirmation", tone: "text-warn", label: "Awaiting payment" },
  EXPIRED: { title: "This checkout expired", tone: "text-danger", label: "Expired — not charged" },
};

async function OrderDetails({ params }: { params: PageProps<"/orders/[id]">["params"] }) {
  const { id } = await params;
  const order = /^[a-z0-9]{20,40}$/.test(id) ? await getOrder(id) : null;
  if (!order) notFound();
  if (order.userId && !canViewOrder(order, (await getSession())?.user.id)) notFound();

  const status = STATUS[order.status];
  const address = order.shippingAddress as Record<string, string | null> | null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-2">
        <p className={`text-sm font-semibold uppercase tracking-widest ${status.tone}`}>{status.label}</p>
        <h1 className="text-3xl font-bold">{status.title}</h1>
        <p className="text-muted">
          Order <span className="font-mono text-ink">{order.id}</span> · placed{" "}
          {order.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        {order.status === "PAID" && order.email && (
          <p className="text-sm text-muted">
            A receipt would normally go to {order.email}. This is a demo, so no email is sent and nothing ships.
          </p>
        )}
        {order.status === "PENDING" && (
          <p className="text-sm text-muted">This page updates once Stripe confirms the payment. Try refreshing in a moment.</p>
        )}
      </div>

      <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 p-4">
            <div>
              <Link href={`/products/${item.productSlug}`} className="font-semibold hover:text-accent">
                {item.productName}
              </Link>
              <p className="text-sm text-muted">
                {item.quantity} × {formatPrice(item.unitPriceCents)}
              </p>
            </div>
            <span className="tabular-nums">{formatPrice(item.quantity * item.unitPriceCents)}</span>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 sm:grid-cols-2">
        <dl className="space-y-2 rounded-xl border border-line bg-surface p-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatPrice(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">UK delivery</dt>
            <dd>{order.shippingCents === 0 ? "Free" : formatPrice(order.shippingCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(order.totalCents)}</dd>
          </div>
        </dl>
        {address && (
          <div className="rounded-xl border border-line bg-surface p-5 text-sm">
            <h2 className="mb-2 font-semibold">Delivering to</h2>
            <address className="not-italic leading-relaxed text-muted">
              {order.shippingName && <div className="text-ink">{order.shippingName}</div>}
              {[address.line1, address.line2, address.city, address.postal_code].filter(Boolean).map((part) => (
                <div key={part}>{part}</div>
              ))}
            </address>
          </div>
        )}
      </div>

      <Link href="/products" className="inline-block text-accent hover:underline">
        Continue shopping
      </Link>
    </div>
  );
}

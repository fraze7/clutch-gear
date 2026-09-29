import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { signOutAction } from "@/app/auth-actions";
import { PendingButton } from "@/components/pending-button";
import { formatPrice } from "@/lib/catalog";
import { getOrdersForUser } from "@/lib/orders";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl border border-line bg-surface" />}>
      <Account />
    </Suspense>
  );
}

const STATUS_LABEL = { PAID: "Paid", PENDING: "Awaiting payment", EXPIRED: "Expired" } as const;
const STATUS_TONE = { PAID: "text-emerald-400", PENDING: "text-warn", EXPIRED: "text-muted" } as const;

async function Account() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/account");

  const { user } = session;
  const orders = await getOrdersForUser(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <section className="flex flex-wrap items-center gap-4">
        {user.image && (
          <Image src={user.image} alt="" width={64} height={64} className="rounded-full border border-line" />
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
        <form action={signOutAction}>
          <PendingButton className="rounded-lg border border-line px-4 py-2 text-sm hover:border-accent/60">Sign out</PendingButton>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Order history</h2>
        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-10 text-center text-muted">
            <p>No orders yet.</p>
            <Link href="/products" className="mt-2 inline-block text-accent hover:underline">
              Browse gear
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {orders.map((order) => (
              <li key={order.id}>
                <Link href={`/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-surface-2">
                  <div>
                    <p className="font-semibold">
                      {order.items.map((i) => (i.quantity > 1 ? `${i.quantity} × ${i.productName}` : i.productName)).join(", ")}
                    </p>
                    <p className="text-sm text-muted">
                      {order.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" })}
                      {" · "}
                      <span className={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</span>
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums">{formatPrice(order.totalCents)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

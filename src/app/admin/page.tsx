import Link from "next/link";
import { Suspense } from "react";
import { AdminShell, AdminSkeleton } from "@/components/admin-shell";
import { getAdminOrders, getDashboardStats, requireAdminPage } from "@/lib/admin";
import { formatPrice } from "@/lib/catalog";

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  await requireAdminPage();
  const [stats, recent] = await Promise.all([getDashboardStats(), getAdminOrders("PAID")]);

  const tiles = [
    { label: "Revenue (test mode)", value: formatPrice(stats.revenueCents), href: "/admin/orders?status=PAID" },
    { label: "Paid orders", value: stats.paid, href: "/admin/orders?status=PAID" },
    { label: "Products", value: stats.products, href: "/admin/products" },
    { label: "Low stock (≤5)", value: stats.lowStock, href: "/admin/products", warn: stats.lowStock > 0 },
    { label: "Out of stock", value: stats.outOfStock, href: "/admin/products", warn: stats.outOfStock > 0 },
    { label: "Awaiting payment", value: stats.pending, href: "/admin/orders?status=PENDING" },
  ];

  return (
    <AdminShell active="/admin" title="Overview">
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="block rounded-xl border border-line bg-surface p-4 hover:border-accent/60">
              <p className="text-sm text-muted">{t.label}</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${t.warn ? "text-warn" : ""}`}>{t.value}</p>
            </Link>
          </li>
        ))}
      </ul>
      <section className="space-y-3">
        <h2 className="font-semibold">Latest paid orders</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted">No paid orders yet.</p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface text-sm">
            {recent.slice(0, 5).map((o) => (
              <li key={o.id} className="flex justify-between gap-4 p-3">
                <Link href={`/orders/${o.id}`} className="hover:text-accent">
                  {o.user?.name ?? o.shippingName ?? "Guest"} · {o.createdAt.toLocaleDateString("en-GB", { timeZone: "Europe/London" })}
                </Link>
                <span className="tabular-nums">{formatPrice(o.totalCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}

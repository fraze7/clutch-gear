import Link from "next/link";
import { Suspense } from "react";
import { AdminShell, AdminSkeleton } from "@/components/admin-shell";
import { getAdminOrders, requireAdminPage } from "@/lib/admin";
import { formatPrice } from "@/lib/catalog";
import type { OrderStatus } from "@/generated/prisma/enums";

const STATUSES: { value?: OrderStatus; label: string }[] = [
  { label: "All" },
  { value: "PAID", label: "Paid" },
  { value: "PENDING", label: "Awaiting payment" },
  { value: "EXPIRED", label: "Expired" },
];
const TONE = { PAID: "text-emerald-400", PENDING: "text-warn", EXPIRED: "text-muted" } as const;

export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Orders searchParams={searchParams} />
    </Suspense>
  );
}

async function Orders({ searchParams }: { searchParams: PageProps<"/admin/orders">["searchParams"] }) {
  await requireAdminPage();
  const requested = (await searchParams).status;
  const status = STATUSES.find((s) => s.value && s.value === requested)?.value;
  const orders = await getAdminOrders(status);

  return (
    <AdminShell active="/admin/orders" title="Orders">
      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s.label}
            href={s.value ? `/admin/orders?status=${s.value}` : "/admin/orders"}
            aria-current={status === s.value ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm ${
              status === s.value ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:text-ink"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </nav>
      {orders.length === 0 ? (
        <p className="text-sm text-muted">No orders.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-muted">
              <tr>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Items</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-surface">
                  <td className="p-3">
                    <Link href={`/orders/${o.id}`} className="hover:text-accent">
                      {o.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" })}
                    </Link>
                  </td>
                  <td className="p-3">
                    {o.user ? o.user.name : (o.shippingName ?? <span className="text-muted">—</span>)}
                    <span className="block text-xs text-muted">{o.user?.email ?? o.email ?? "Guest"}</span>
                  </td>
                  <td className="p-3 tabular-nums">{o._count.items}</td>
                  <td className={`p-3 ${TONE[o.status]}`}>{STATUSES.find((s) => s.value === o.status)?.label}</td>
                  <td className="p-3 text-right tabular-nums">{formatPrice(o.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

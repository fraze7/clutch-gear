import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AdminShell, AdminSkeleton } from "@/components/admin-shell";
import { StockBadge } from "@/components/stock-badge";
import { getAdminProducts, requireAdminPage } from "@/lib/admin";
import { categoryLabel, formatPrice } from "@/lib/catalog";

export default function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Products searchParams={searchParams} />
    </Suspense>
  );
}

async function Products({ searchParams }: { searchParams: PageProps<"/admin/products">["searchParams"] }) {
  await requireAdminPage();
  const [products, params] = await Promise.all([getAdminProducts(), searchParams]);

  return (
    <AdminShell
      active="/admin/products"
      title={`Products (${products.length})`}
      actions={
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:brightness-110"
        >
          New product
        </Link>
      }
    >
      {typeof params.saved === "string" && (
        <p role="status" className="rounded-lg bg-emerald-400/10 px-4 py-2 text-sm text-emerald-400">
          Saved.{" "}
          <Link href={`/products/${params.saved}`} className="underline">
            View it in the shop
          </Link>
        </p>
      )}
      {params.deleted && (
        <p role="status" className="rounded-lg bg-emerald-400/10 px-4 py-2 text-sm text-emerald-400">
          Product deleted. Past orders still show it.
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2 text-muted">
            <tr>
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 text-right font-medium">Price</th>
              <th className="p-3 text-right font-medium">Stock</th>
              <th className="p-3 font-medium">Featured</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-surface">
                <td className="p-3">
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-medium hover:text-accent">
                    <Image src={p.imageUrl} alt="" width={40} height={40} className="rounded" />
                    {p.name}
                  </Link>
                </td>
                <td className="p-3 text-muted">{categoryLabel(p.category)}</td>
                <td className="p-3 text-right tabular-nums">{formatPrice(p.priceCents)}</td>
                <td className="p-3 text-right tabular-nums">
                  {p.stock}
                  <span className="block">
                    <StockBadge stock={p.stock} />
                  </span>
                </td>
                <td className="p-3">{p.featured ? "★" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

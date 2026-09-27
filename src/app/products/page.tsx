import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CATEGORIES, catalogHref, categoryLabel, parseCatalogParams } from "@/lib/catalog";
import { getProducts } from "@/lib/products";
import { CatalogControls } from "@/components/catalog-controls";
import { ProductGrid, ProductGridSkeleton } from "@/components/product-card";

export const metadata: Metadata = { title: "Shop" };

// Not async: the search params are read inside <Suspense>, so the heading ships in the static shell
export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Shop</h1>
      <Suspense fallback={<ProductGridSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Catalog({ searchParams }: { searchParams: PageProps<"/products">["searchParams"] }) {
  const filters = parseCatalogParams(await searchParams);
  const products = await getProducts(filters);

  const pill = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm ${
      active ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:text-ink"
    }`;

  return (
    <div className="space-y-6">
      <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
        <Link
          href={catalogHref({ ...filters, category: null })}
          className={pill(!filters.category)}
          aria-current={!filters.category ? "page" : undefined}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={catalogHref({ ...filters, category: c.value })}
            className={pill(filters.category === c.value)}
            aria-current={filters.category === c.value ? "page" : undefined}
          >
            {c.label}
          </Link>
        ))}
      </nav>

      {/* key: remount when filters change, so the inputs' default values stay in sync with the URL */}
      <CatalogControls key={catalogHref(filters)} filters={filters} />

      <p className="text-sm text-muted" aria-live="polite">
        {products.length} {products.length === 1 ? "product" : "products"}
        {filters.category && ` in ${categoryLabel(filters.category)}`}
        {filters.q && ` matching “${filters.q}”`}
      </p>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="rounded-xl border border-dashed border-line p-10 text-center text-muted">
          <p>No gear matches that search.</p>
          <Link href="/products" className="mt-2 inline-block text-accent hover:underline">
            Clear filters
          </Link>
        </div>
      )}
    </div>
  );
}

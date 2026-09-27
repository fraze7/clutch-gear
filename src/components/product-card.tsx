import Image from "next/image";
import Link from "next/link";
import { categoryLabel, formatPrice } from "@/lib/catalog";
import type { ProductCardData } from "@/lib/products";
import { StockBadge } from "@/components/stock-badge";

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:border-accent/60"
    >
      <Image
        src={product.imageUrl}
        alt={product.name}
        width={400}
        height={400}
        className="aspect-square w-full transition duration-300 group-hover:scale-[1.03]"
      />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs uppercase tracking-wider text-muted">{categoryLabel(product.category)}</p>
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-sm text-muted">{product.tagline}</p>
        <div className="mt-auto flex items-baseline justify-between pt-3">
          <span className="font-semibold">{formatPrice(product.priceCents)}</span>
          <StockBadge stock={product.stock} />
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <li key={p.id} className="flex">
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="animate-pulse overflow-hidden rounded-xl border border-line bg-surface">
          <div className="aspect-square bg-surface-2" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 rounded bg-surface-2" />
            <div className="h-4 w-2/3 rounded bg-surface-2" />
            <div className="h-3 w-1/2 rounded bg-surface-2" />
          </div>
        </li>
      ))}
    </ul>
  );
}

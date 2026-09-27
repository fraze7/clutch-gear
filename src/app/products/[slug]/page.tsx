import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogHref, categoryLabel, formatPrice } from "@/lib/catalog";
import { getAllProductSlugs, getProductBySlug, getRelatedProducts } from "@/lib/products";
import { ProductGrid } from "@/components/product-card";
import { StockBadge } from "@/components/stock-badge";

// Every product page is prerendered at build time
export async function generateStaticParams() {
  return getAllProductSlugs();
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Product not found" };
  return { title: product.name, description: `${product.tagline}. ${product.description}` };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category, product.slug);
  const specs = Object.entries(product.specs as Record<string, string>);

  return (
    <div className="space-y-16">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/products" className="hover:text-ink">
          Shop
        </Link>
        {" / "}
        <Link href={catalogHref({ category: product.category })} className="hover:text-ink">
          {categoryLabel(product.category)}
        </Link>
        {" / "}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={640}
          height={640}
          loading="eager"
          className="w-full rounded-2xl border border-line"
        />
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-wider text-accent">{categoryLabel(product.category)}</p>
            <h1 className="text-4xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-lg text-muted">{product.tagline}</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-3xl font-semibold">{formatPrice(product.priceCents)}</span>
            <StockBadge stock={product.stock} />
          </div>
          <p className="leading-relaxed text-muted">{product.description}</p>
          {specs.length > 0 && (
            <div>
              <h2 className="mb-3 font-semibold">Specifications</h2>
              <dl className="divide-y divide-line rounded-xl border border-line">
                {specs.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                    <dt className="text-muted">{label}</dt>
                    <dd className="text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-2xl font-bold">More {categoryLabel(product.category).toLowerCase()}</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}

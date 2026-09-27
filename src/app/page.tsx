import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, catalogHref } from "@/lib/catalog";
import { getFeaturedProducts } from "@/lib/products";
import { ProductGrid } from "@/components/product-card";

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-8 rounded-2xl border border-line bg-gradient-to-br from-surface-2 to-bg p-8 sm:p-12 md:grid-cols-2">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">New · Rapid 75</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Gear for the clutch moments.</h1>
          <p className="max-w-md text-muted">
            Ultralight mice, rapid-trigger keyboards and headsets tuned for footsteps. Built for the round that
            decides the game.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-ink hover:brightness-110"
            >
              Shop all gear
            </Link>
            <Link
              href="/products/rapid-75"
              className="rounded-lg border border-line px-5 py-2.5 font-semibold hover:border-accent/60"
            >
              Meet the Rapid 75
            </Link>
          </div>
        </div>
        <Image
          src="/products/rapid-75.svg"
          alt="Rapid 75 keyboard"
          width={560}
          height={560}
          loading="eager"
          className="w-full rounded-xl"
        />
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold">Shop by category</h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <li key={c.value}>
              <Link
                href={catalogHref({ category: c.value })}
                className="group block overflow-hidden rounded-xl border border-line bg-surface hover:border-accent/60"
              >
                <Image src={c.image} alt="" width={300} height={300} className="aspect-square w-full" />
                <p className="p-3 font-semibold group-hover:text-accent">{c.label}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold">Featured</h2>
          <Link href="/products" className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>
    </div>
  );
}

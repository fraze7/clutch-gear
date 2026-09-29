import Link from "next/link";
import { Suspense } from "react";
import { CATEGORIES, catalogHref } from "@/lib/catalog";
import { CartLink, CartLinkView } from "@/components/cart-link";
import { AccountLink, SignInLink } from "@/components/account-link";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          CLUTCH<span className="text-accent">GEAR</span>
        </Link>
        <nav aria-label="Categories" className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          <Link href="/products" className="hover:text-ink">
            Shop all
          </Link>
          {CATEGORIES.map((c) => (
            <Link key={c.value} href={catalogHref({ category: c.value })} className="hover:text-ink">
              {c.label}
            </Link>
          ))}
        </nav>
        {/* These read cookies, so they stream in; the rest of the header stays static */}
        <div className="ml-auto flex items-center gap-2">
          <Suspense fallback={<SignInLink />}>
            <AccountLink />
          </Suspense>
          <Suspense fallback={<CartLinkView />}>
            <CartLink />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

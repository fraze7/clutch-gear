import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getCart } from "@/lib/cart-cookie";
import { FREE_SHIPPING_THRESHOLD_CENTS, lineLimit, summarizeCart, type CartLine } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";
import { getCartProducts } from "@/lib/products";
import { checkoutAction, removeFromCartAction, updateQuantityAction } from "./actions";
import { PendingButton } from "@/components/pending-button";

export const metadata: Metadata = { title: "Cart", robots: { index: false } };

export default function CartPage({ searchParams }: PageProps<"/cart">) {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Your cart</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl border border-line bg-surface" />}>
        <CartContents searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CartContents({ searchParams }: { searchParams: PageProps<"/cart">["searchParams"] }) {
  const cancelled = (await searchParams).checkout === "cancelled";
  const items = await getCart();
  const products = items.length ? await getCartProducts(items.map((i) => i.slug).sort()) : [];
  const cart = summarizeCart(items, products);

  if (cart.lines.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line p-12 text-center">
        <p className="text-muted">Your cart is empty.</p>
        <Link
          href="/products"
          className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-ink hover:brightness-110"
        >
          Browse gear
        </Link>
      </div>
    );
  }

  const toFreeShipping = FREE_SHIPPING_THRESHOLD_CENTS - cart.subtotalCents;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        {cancelled && (
          <p className="rounded-lg border border-line bg-surface-2 px-4 py-2 text-sm text-muted">
            Checkout cancelled — you haven&apos;t been charged. Your cart is still here.
          </p>
        )}
        {cart.missing.length > 0 && (
          <p className="rounded-lg border border-warn/40 bg-warn/10 px-4 py-2 text-sm text-warn">
            {cart.missing.length === 1 ? "An item" : "Some items"} in your cart are no longer available and
            {cart.missing.length === 1 ? " has" : " have"} been left out.
          </p>
        )}
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {cart.lines.map((line) => (
            <CartRow key={line.product.slug} line={line} />
          ))}
        </ul>
      </div>

      <aside className="h-fit space-y-4 rounded-xl border border-line bg-surface p-5" aria-label="Order summary">
        <h2 className="font-semibold">Order summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">
              Subtotal ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
            </dt>
            <dd>{formatPrice(cart.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">UK delivery</dt>
            <dd>{cart.shippingCents === 0 ? "Free" : formatPrice(cart.shippingCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(cart.totalCents)}</dd>
          </div>
        </dl>
        {toFreeShipping > 0 && cart.subtotalCents > 0 && (
          <p className="text-xs text-muted">Add {formatPrice(toFreeShipping)} more for free delivery.</p>
        )}
        <form action={checkoutAction}>
          <PendingButton
            disabled={cart.itemCount === 0}
            className="w-full rounded-lg bg-accent px-5 py-3 font-semibold text-accent-ink hover:brightness-110"
          >
            Checkout
          </PendingButton>
        </form>
        <p className="text-center text-xs text-muted">
          Secure test checkout by Stripe. Use card 4242 4242 4242 4242 — no real payment is taken.
        </p>
        <Link href="/products" className="block text-center text-sm text-accent hover:underline">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}

function CartRow({ line }: { line: CartLine }) {
  const { product, quantity, issue } = line;
  const max = lineLimit(product.stock);
  const stepper = "h-8 w-8 rounded-md border border-line text-lg leading-none hover:border-accent/60";

  return (
    <li className="flex gap-4 p-4">
      <Link href={`/products/${product.slug}`} className="shrink-0">
        <Image src={product.imageUrl} alt={product.name} width={96} height={96} className="rounded-lg border border-line" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link href={`/products/${product.slug}`} className="font-semibold hover:text-accent">
            {product.name}
          </Link>
          <p className="text-sm text-muted">{formatPrice(product.priceCents)} each</p>
          {issue === "out-of-stock" && <p className="text-sm text-danger">Out of stock — not included in your total.</p>}
          {issue === "reduced" && <p className="text-sm text-warn">Only {max} available — quantity reduced.</p>}
        </div>

        <div className="flex items-center gap-4 sm:flex-col sm:items-end">
          {issue !== "out-of-stock" && (
            <form action={updateQuantityAction} className="flex items-center gap-2">
              <input type="hidden" name="slug" value={product.slug} />
              <PendingButton name="quantity" value={quantity - 1} className={stepper} aria-label={`Decrease quantity of ${product.name}`}>
                −
              </PendingButton>
              <span className="w-6 text-center tabular-nums" aria-label="Quantity">
                {quantity}
              </span>
              <PendingButton
                name="quantity"
                value={quantity + 1}
                disabled={quantity >= max}
                className={stepper}
                aria-label={`Increase quantity of ${product.name}`}
              >
                +
              </PendingButton>
            </form>
          )}
          <span className="font-semibold tabular-nums">{formatPrice(line.lineTotalCents)}</span>
          <form action={removeFromCartAction}>
            <input type="hidden" name="slug" value={product.slug} />
            <PendingButton className="text-sm text-muted hover:text-danger">Remove</PendingButton>
          </form>
        </div>
      </div>
    </li>
  );
}

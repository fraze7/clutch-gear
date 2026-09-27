import Link from "next/link";
import { getCart } from "@/lib/cart-cookie";
import { cartCount } from "@/lib/cart";

// count is undefined while the real number is still loading, so the badge doesn't flash "0"
export function CartLinkView({ count }: { count?: number }) {
  return (
    <Link
      href="/cart"
      className="ml-auto flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent/60"
      aria-label={count === undefined ? "Cart" : `Cart, ${count} ${count === 1 ? "item" : "items"}`}
    >
      Cart
      {count !== undefined && (
        <span className="min-w-6 rounded-full bg-accent px-1.5 text-center text-xs font-bold leading-5 text-accent-ink">
          {count}
        </span>
      )}
    </Link>
  );
}

// Reads the cart cookie, so it must render inside <Suspense> (see SiteHeader)
export async function CartLink() {
  return <CartLinkView count={cartCount(await getCart())} />;
}

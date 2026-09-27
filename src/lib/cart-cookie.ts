// Reading and writing the cart cookie. Server-only: uses next/headers.
import { cookies } from "next/headers";
import { CART_COOKIE, parseCart, serializeCart, type CartItem } from "@/lib/cart";

export async function getCart(): Promise<CartItem[]> {
  const store = await cookies();
  return parseCart(store.get(CART_COOKIE)?.value);
}

// Only callable from a Server Action or Route Handler (cookies can't be set while rendering)
export async function saveCart(items: CartItem[]) {
  const store = await cookies();
  if (items.length === 0) {
    store.delete(CART_COOKIE);
    return;
  }
  store.set(CART_COOKIE, serializeCart(items), {
    httpOnly: true, // page scripts never need to read it
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

"use server";

// Server Actions are public endpoints — anyone can POST to them directly — so every input is validated
// here and stock is read fresh from the database rather than trusted from the page.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCart, saveCart } from "@/lib/cart-cookie";
import {
  addToCart,
  isValidQuantity,
  isValidSlug,
  lineLimit,
  removeFromCart,
  setQuantity,
  summarizeCart,
} from "@/lib/cart";
import { buildCheckoutSessionParams, purchasableLines } from "@/lib/checkout";
import { createPendingOrder } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";
import { getSession } from "@/lib/session";

export type AddToCartState =
  | { status: "idle" }
  | { status: "added"; added: number; message: string }
  | { status: "error"; message: string };

function findStock(slug: string) {
  return db.product.findUnique({ where: { slug }, select: { stock: true } });
}

function readItem(formData: FormData) {
  const slug = formData.get("slug");
  const quantity = Number(formData.get("quantity"));
  return { slug: isValidSlug(slug) ? slug : null, quantity: isValidQuantity(quantity) ? quantity : null };
}

export async function addToCartAction(_prev: AddToCartState, formData: FormData): Promise<AddToCartState> {
  const { slug, quantity } = readItem(formData);
  if (!slug || !quantity) return { status: "error", message: "Something went wrong — please try again." };

  const product = await findStock(slug);
  if (!product) return { status: "error", message: "This product no longer exists." };
  if (product.stock <= 0) return { status: "error", message: "Sorry, this is out of stock." };

  const result = addToCart(await getCart(), slug, quantity, product.stock);
  if (result.added === 0) {
    return { status: "error", message: `You already have the most you can add (${lineLimit(product.stock)}) in your cart.` };
  }
  await saveCart(result.items);

  const message =
    result.added < quantity ? `Added ${result.added} — that's all we can add right now.` : "Added to cart.";
  return { status: "added", added: result.added, message };
}

export async function updateQuantityAction(formData: FormData) {
  const { slug, quantity } = readItem(formData);
  if (!slug || quantity === null) return;

  const product = await findStock(slug);
  const cart = await getCart();
  await saveCart(product ? setQuantity(cart, slug, quantity, product.stock) : removeFromCart(cart, slug));
}

export async function removeFromCartAction(formData: FormData) {
  const slug = formData.get("slug");
  if (!isValidSlug(slug)) return;
  await saveCart(removeFromCart(await getCart(), slug));
}

// Where Stripe sends the buyer back to. SITE_URL wins when set; otherwise the site the request came from.
async function siteOrigin() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

// Re-prices the cart from the database, saves a PENDING order, then sends the buyer to Stripe's hosted
// checkout page. Nothing is charged here — the order only becomes PAID once Stripe confirms payment.
export async function checkoutAction() {
  const items = await getCart();
  const products = items.length
    ? await db.product.findMany({
        where: { slug: { in: items.map((i) => i.slug) } },
        select: { id: true, slug: true, name: true, priceCents: true, stock: true, imageUrl: true },
      })
    : [];
  const summary = summarizeCart(items, products);
  const lines = purchasableLines(summary.lines);
  if (lines.length === 0) redirect("/cart");

  const session = await getSession(); // optional: guests can check out too
  const order = await createPendingOrder({
    lines,
    subtotalCents: summary.subtotalCents,
    shippingCents: summary.shippingCents,
    userId: session?.user.id,
  });
  const checkout = await getStripe().checkout.sessions.create(
    buildCheckoutSessionParams({
      orderId: order.id,
      lines,
      shippingCents: summary.shippingCents,
      origin: await siteOrigin(),
      customerEmail: session?.user.email,
    })
  );
  await db.order.update({ where: { id: order.id }, data: { stripeSessionId: checkout.id } });

  if (!checkout.url) throw new Error("Stripe didn't return a checkout URL");
  redirect(checkout.url);
}

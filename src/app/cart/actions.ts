"use server";

// Server Actions are public endpoints — anyone can POST to them directly — so every input is validated
// here and stock is read fresh from the database rather than trusted from the page.
import { db } from "@/lib/db";
import { getCart, saveCart } from "@/lib/cart-cookie";
import { addToCart, isValidQuantity, isValidSlug, lineLimit, removeFromCart, setQuantity } from "@/lib/cart";

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

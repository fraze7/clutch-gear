// Cart logic with no Next.js or database code, so it's easy to test.
// The cart cookie only ever holds slugs and quantities — prices and stock always come from the database.

export const CART_COOKIE = "cart";
export const MAX_PER_LINE = 10;
export const MAX_LINES = 50;
export const SHIPPING_CENTS = 499;
export const FREE_SHIPPING_THRESHOLD_CENTS = 5000;

export type CartItem = { slug: string; quantity: number };

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 100 && SLUG.test(value);
}

export function isValidQuantity(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= MAX_PER_LINE;
}

// The cookie comes from the browser, so treat it as untrusted: drop anything malformed,
// merge duplicate lines and cap sizes rather than failing
export function parseCart(raw: string | undefined): CartItem[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const merged = new Map<string, number>();
  for (const entry of data) {
    const slug = entry?.slug;
    const quantity = entry?.quantity;
    if (!isValidSlug(slug) || !Number.isInteger(quantity) || quantity < 1) continue;
    merged.set(slug, Math.min(MAX_PER_LINE, (merged.get(slug) ?? 0) + quantity));
  }
  return [...merged].slice(0, MAX_LINES).map(([slug, quantity]) => ({ slug, quantity }));
}

export function serializeCart(items: CartItem[]) {
  return JSON.stringify(items.map(({ slug, quantity }) => ({ slug, quantity })));
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

// Most of this product a single cart line can hold
export function lineLimit(stock: number) {
  return Math.max(0, Math.min(stock, MAX_PER_LINE));
}

// Adds up to `quantity`, never going over the stock or the per-line maximum.
// Returns how many were actually added so the UI can say so.
export function addToCart(items: CartItem[], slug: string, quantity: number, stock: number) {
  const existing = items.find((item) => item.slug === slug)?.quantity ?? 0;
  const target = Math.min(existing + quantity, lineLimit(stock));
  const added = Math.max(0, target - existing);
  if (added === 0) return { items, added };

  const next = existing
    ? items.map((item) => (item.slug === slug ? { ...item, quantity: target } : item))
    : items.length >= MAX_LINES
      ? items
      : [...items, { slug, quantity: target }];
  return { items: next, added: next === items ? 0 : added };
}

// Sets a line's quantity (clamped to stock); 0 or less removes the line
export function setQuantity(items: CartItem[], slug: string, quantity: number, stock: number) {
  const clamped = Math.min(quantity, lineLimit(stock));
  if (clamped <= 0) return removeFromCart(items, slug);
  return items.map((item) => (item.slug === slug ? { ...item, quantity: clamped } : item));
}

export function removeFromCart(items: CartItem[], slug: string) {
  return items.filter((item) => item.slug !== slug);
}

export type CartProduct = {
  slug: string;
  name: string;
  priceCents: number;
  stock: number;
  imageUrl: string;
};

export type CartLine<P extends CartProduct = CartProduct> = {
  product: P;
  quantity: number;
  lineTotalCents: number;
  // "reduced": fewer in stock than were in the cart; "out-of-stock": can't be bought right now
  issue?: "reduced" | "out-of-stock";
};

// Combines the cart with current product data. Lines for products that no longer exist are dropped,
// and out-of-stock lines don't count towards the total.
// Generic so callers keep any extra product fields (e.g. checkout needs the product id)
export function summarizeCart<P extends CartProduct>(items: CartItem[], products: P[]) {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const lines: CartLine<P>[] = [];
  const missing: string[] = [];

  for (const item of items) {
    const product = bySlug.get(item.slug);
    if (!product) {
      missing.push(item.slug);
      continue;
    }
    if (product.stock <= 0) {
      lines.push({ product, quantity: item.quantity, lineTotalCents: 0, issue: "out-of-stock" });
      continue;
    }
    const quantity = Math.min(item.quantity, lineLimit(product.stock));
    lines.push({
      product,
      quantity,
      lineTotalCents: quantity * product.priceCents,
      issue: quantity < item.quantity ? "reduced" : undefined,
    });
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const shippingCents = subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_CENTS;
  const itemCount = lines.reduce((sum, line) => sum + (line.issue === "out-of-stock" ? 0 : line.quantity), 0);

  return { lines, missing, subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents, itemCount };
}

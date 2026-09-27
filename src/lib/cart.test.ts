import { describe, expect, it } from "vitest";
import {
  addToCart,
  cartCount,
  FREE_SHIPPING_THRESHOLD_CENTS,
  MAX_LINES,
  MAX_PER_LINE,
  parseCart,
  removeFromCart,
  serializeCart,
  setQuantity,
  SHIPPING_CENTS,
  summarizeCart,
  type CartProduct,
} from "./cart";

const product = (slug: string, priceCents: number, stock: number): CartProduct => ({
  slug,
  name: slug,
  priceCents,
  stock,
  imageUrl: `/products/${slug}.svg`,
});

describe("parseCart", () => {
  it("reads a valid cart and round-trips through serializeCart", () => {
    const items = [
      { slug: "recoil-mini", quantity: 2 },
      { slug: "glide-xl", quantity: 1 },
    ];
    expect(parseCart(serializeCart(items))).toEqual(items);
  });

  it("returns an empty cart for missing or malformed cookies", () => {
    expect(parseCart(undefined)).toEqual([]);
    expect(parseCart("not json{")).toEqual([]);
    expect(parseCart('{"slug":"recoil-mini","quantity":1}')).toEqual([]);
  });

  it("drops invalid lines and ignores extra fields like a price", () => {
    const raw = JSON.stringify([
      { slug: "../etc/passwd", quantity: 1 },
      { slug: "recoil-mini", quantity: -2 },
      { slug: "glide-xl", quantity: 1.5 },
      { slug: "entry-frag", quantity: "3" },
      { slug: "tactix-tkl", quantity: 1, priceCents: 1 },
    ]);
    expect(parseCart(raw)).toEqual([{ slug: "tactix-tkl", quantity: 1 }]);
  });

  it("merges duplicate lines and caps quantities and line count", () => {
    expect(
      parseCart(
        JSON.stringify([
          { slug: "recoil-mini", quantity: 4 },
          { slug: "recoil-mini", quantity: 3 },
        ])
      )
    ).toEqual([{ slug: "recoil-mini", quantity: 7 }]);
    expect(parseCart(JSON.stringify([{ slug: "recoil-mini", quantity: 999 }]))[0].quantity).toBe(MAX_PER_LINE);

    const many = Array.from({ length: MAX_LINES + 20 }, (_, i) => ({ slug: `item-${i}`, quantity: 1 }));
    expect(parseCart(JSON.stringify(many))).toHaveLength(MAX_LINES);
  });
});

describe("addToCart", () => {
  it("adds a new line, then increases it", () => {
    const first = addToCart([], "recoil-mini", 2, 50);
    expect(first).toEqual({ items: [{ slug: "recoil-mini", quantity: 2 }], added: 2 });
    expect(addToCart(first.items, "recoil-mini", 3, 50).items).toEqual([{ slug: "recoil-mini", quantity: 5 }]);
  });

  it("never goes over the stock", () => {
    const result = addToCart([{ slug: "grip-tape", quantity: 2 }], "grip-tape", 5, 3);
    expect(result).toEqual({ items: [{ slug: "grip-tape", quantity: 3 }], added: 1 });
    expect(addToCart(result.items, "grip-tape", 1, 3).added).toBe(0);
  });

  it("never goes over the per-line maximum", () => {
    expect(addToCart([], "glide-skates", 50, 200).items[0].quantity).toBe(MAX_PER_LINE);
  });

  it("adds nothing when out of stock", () => {
    expect(addToCart([], "lowsens-air", 1, 0)).toEqual({ items: [], added: 0 });
  });
});

describe("setQuantity and removeFromCart", () => {
  const items = [
    { slug: "recoil-mini", quantity: 2 },
    { slug: "glide-xl", quantity: 1 },
  ];

  it("changes a quantity, clamped to stock", () => {
    expect(setQuantity(items, "recoil-mini", 4, 50)[0].quantity).toBe(4);
    expect(setQuantity(items, "recoil-mini", 9, 3)[0].quantity).toBe(3);
  });

  it("removes the line when the quantity reaches 0", () => {
    expect(setQuantity(items, "recoil-mini", 0, 50)).toEqual([{ slug: "glide-xl", quantity: 1 }]);
    expect(removeFromCart(items, "glide-xl")).toEqual([{ slug: "recoil-mini", quantity: 2 }]);
  });

  it("counts items across lines", () => {
    expect(cartCount(items)).toBe(3);
  });
});

describe("summarizeCart", () => {
  it("prices lines from product data and adds delivery under the threshold", () => {
    const summary = summarizeCart([{ slug: "grip-tape", quantity: 2 }], [product("grip-tape", 799, 3)]);
    expect(summary.subtotalCents).toBe(1598);
    expect(summary.shippingCents).toBe(SHIPPING_CENTS);
    expect(summary.totalCents).toBe(1598 + SHIPPING_CENTS);
    expect(summary.itemCount).toBe(2);
  });

  it("gives free delivery at the threshold", () => {
    const summary = summarizeCart(
      [{ slug: "pad", quantity: 1 }],
      [product("pad", FREE_SHIPPING_THRESHOLD_CENTS, 10)]
    );
    expect(summary.shippingCents).toBe(0);
  });

  it("reduces lines to the stock, flags sold-out lines and drops missing products", () => {
    const summary = summarizeCart(
      [
        { slug: "grip-tape", quantity: 8 },
        { slug: "lowsens-air", quantity: 1 },
        { slug: "discontinued", quantity: 2 },
      ],
      [product("grip-tape", 799, 3), product("lowsens-air", 9999, 0)]
    );
    expect(summary.lines.map((l) => [l.product.slug, l.quantity, l.issue])).toEqual([
      ["grip-tape", 3, "reduced"],
      ["lowsens-air", 1, "out-of-stock"],
    ]);
    expect(summary.missing).toEqual(["discontinued"]);
    expect(summary.subtotalCents).toBe(3 * 799); // the sold-out line isn't charged
    expect(summary.itemCount).toBe(3);
  });

  it("charges no delivery on an empty cart", () => {
    expect(summarizeCart([], []).totalCents).toBe(0);
  });
});

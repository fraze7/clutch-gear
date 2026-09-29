import { describe, expect, it } from "vitest";
import { buildCheckoutSessionParams, CHECKOUT_EXPIRY_SECONDS, purchasableLines, toOrderItems, type PurchasableLine } from "./checkout";

const line = (slug: string, priceCents: number, quantity: number, issue?: PurchasableLine["issue"]): PurchasableLine => ({
  product: { id: `id-${slug}`, slug, name: `Name ${slug}`, priceCents, stock: 10, imageUrl: "" },
  quantity,
  lineTotalCents: issue === "out-of-stock" ? 0 : priceCents * quantity,
  issue,
});

describe("purchasableLines", () => {
  it("leaves out sold-out lines and keeps reduced ones", () => {
    const lines = [line("a", 100, 1), line("b", 200, 2, "out-of-stock"), line("c", 300, 1, "reduced")];
    expect(purchasableLines(lines).map((l) => l.product.slug)).toEqual(["a", "c"]);
  });
});

describe("toOrderItems", () => {
  it("copies the name and price at the time of purchase", () => {
    expect(toOrderItems([line("recoil-mini", 4999, 2)])).toEqual([
      { productId: "id-recoil-mini", productSlug: "recoil-mini", productName: "Name recoil-mini", unitPriceCents: 4999, quantity: 2 },
    ]);
  });
});

describe("buildCheckoutSessionParams", () => {
  const now = Date.UTC(2026, 8, 27, 12, 0, 0);
  const params = buildCheckoutSessionParams({
    orderId: "order123",
    lines: [line("recoil-mini", 4999, 2), line("grip-tape", 799, 1)],
    shippingCents: 499,
    origin: "https://clutch-gear.example",
    now,
  });

  it("charges the database price in GBP for each line", () => {
    expect(params.line_items).toEqual([
      expect.objectContaining({ quantity: 2, price_data: expect.objectContaining({ currency: "gbp", unit_amount: 4999 }) }),
      expect.objectContaining({ quantity: 1, price_data: expect.objectContaining({ currency: "gbp", unit_amount: 799 }) }),
    ]);
  });

  it("links the session to the order", () => {
    expect(params.metadata).toEqual({ orderId: "order123" });
    expect(params.client_reference_id).toBe("order123");
  });

  it("adds UK delivery at the calculated price", () => {
    expect(params.shipping_address_collection).toEqual({ allowed_countries: ["GB"] });
    expect(params.shipping_options?.[0].shipping_rate_data?.fixed_amount).toEqual({ amount: 499, currency: "gbp" });
  });

  it("returns to the site and expires after 30 minutes", () => {
    expect(params.success_url).toBe("https://clutch-gear.example/checkout/complete?session_id={CHECKOUT_SESSION_ID}");
    expect(params.cancel_url).toBe("https://clutch-gear.example/cart?checkout=cancelled");
    expect(params.expires_at).toBe(now / 1000 + CHECKOUT_EXPIRY_SECONDS);
  });

  it("pre-fills the email only for signed-in customers", () => {
    expect(params).not.toHaveProperty("customer_email");
    const signedIn = buildCheckoutSessionParams({ orderId: "o", lines: [line("x", 100, 1)], shippingCents: 0, origin: "https://x", customerEmail: "me@example.com" });
    expect(signedIn.customer_email).toBe("me@example.com");
  });

  it("labels free delivery", () => {
    const free = buildCheckoutSessionParams({ orderId: "o", lines: [line("x", 6000, 1)], shippingCents: 0, origin: "https://x" });
    expect(free.shipping_options?.[0].shipping_rate_data?.display_name).toBe("Free UK delivery");
  });
});

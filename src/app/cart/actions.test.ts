// The Server Actions are public endpoints, so these tests call them the way an attacker could:
// with made-up form data. The database and cookie store are replaced with in-memory fakes.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CART_COOKIE, parseCart } from "@/lib/cart";

const stock: Record<string, number> = {};
const jar = new Map<string, string>();

vi.mock("@/lib/db", () => ({
  db: {
    product: {
      findUnique: vi.fn(async ({ where }: { where: { slug: string } }) =>
        where.slug in stock ? { stock: stock[where.slug] } : null
      ),
    },
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
}));

const { addToCartAction, removeFromCartAction, updateQuantityAction } = await import("./actions");

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
};
const cart = () => parseCart(jar.get(CART_COOKIE));
const idle = { status: "idle" } as const;

beforeEach(() => {
  jar.clear();
  for (const key of Object.keys(stock)) delete stock[key];
  Object.assign(stock, { "recoil-mini": 85, "grip-tape": 3, "lowsens-air": 0 });
});

describe("addToCartAction", () => {
  it("adds to the cart cookie", async () => {
    const result = await addToCartAction(idle, form({ slug: "recoil-mini", quantity: "2" }));
    expect(result).toMatchObject({ status: "added", added: 2 });
    expect(cart()).toEqual([{ slug: "recoil-mini", quantity: 2 }]);
  });

  it("rejects invalid input without touching the cart", async () => {
    const invalid: Record<string, string>[] = [
      { slug: "recoil-mini", quantity: "0" },
      { slug: "recoil-mini", quantity: "11" },
      { slug: "recoil-mini", quantity: "abc" },
      { slug: "../../etc", quantity: "1" },
      { quantity: "1" },
    ];
    for (const fields of invalid) {
      expect((await addToCartAction(idle, form(fields))).status).toBe("error");
    }
    expect(jar.has(CART_COOKIE)).toBe(false);
  });

  it("rejects unknown and sold-out products", async () => {
    expect(await addToCartAction(idle, form({ slug: "made-up", quantity: "1" }))).toMatchObject({ status: "error" });
    expect(await addToCartAction(idle, form({ slug: "lowsens-air", quantity: "1" }))).toMatchObject({
      status: "error",
      message: "Sorry, this is out of stock.",
    });
    expect(cart()).toEqual([]);
  });

  it("only adds what's in stock, then refuses more", async () => {
    const partial = await addToCartAction(idle, form({ slug: "grip-tape", quantity: "5" }));
    expect(partial).toMatchObject({ status: "added", added: 3 });
    expect(await addToCartAction(idle, form({ slug: "grip-tape", quantity: "1" }))).toMatchObject({ status: "error" });
    expect(cart()).toEqual([{ slug: "grip-tape", quantity: 3 }]);
  });

  it("checks stock at the time of the request", async () => {
    stock["recoil-mini"] = 0; // sold out since the page was rendered
    expect((await addToCartAction(idle, form({ slug: "recoil-mini", quantity: "1" }))).status).toBe("error");
  });
});

describe("updateQuantityAction and removeFromCartAction", () => {
  beforeEach(async () => {
    await addToCartAction(idle, form({ slug: "recoil-mini", quantity: "2" }));
    await addToCartAction(idle, form({ slug: "grip-tape", quantity: "1" }));
  });

  it("changes a quantity, clamped to stock", async () => {
    await updateQuantityAction(form({ slug: "grip-tape", quantity: "3" }));
    expect(cart()).toContainEqual({ slug: "grip-tape", quantity: 3 });
    stock["grip-tape"] = 2;
    await updateQuantityAction(form({ slug: "grip-tape", quantity: "3" }));
    expect(cart()).toContainEqual({ slug: "grip-tape", quantity: 2 });
  });

  it("removes a line at 0 and when removed, and deletes the cookie once empty", async () => {
    await updateQuantityAction(form({ slug: "grip-tape", quantity: "0" }));
    expect(cart()).toEqual([{ slug: "recoil-mini", quantity: 2 }]);
    await removeFromCartAction(form({ slug: "recoil-mini" }));
    expect(jar.has(CART_COOKIE)).toBe(false);
  });

  it("drops a product that no longer exists", async () => {
    delete stock["grip-tape"];
    await updateQuantityAction(form({ slug: "grip-tape", quantity: "2" }));
    expect(cart()).toEqual([{ slug: "recoil-mini", quantity: 2 }]);
  });

  it("ignores invalid input", async () => {
    await updateQuantityAction(form({ slug: "recoil-mini", quantity: "-5" }));
    await removeFromCartAction(form({ slug: "<script>" }));
    expect(cart()).toHaveLength(2);
  });
});

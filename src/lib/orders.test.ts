// Fulfilment against an in-memory fake database: the parts that matter are that payment is verified,
// that an order is only ever marked paid once, and that stock never goes below zero.
import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

type FakeOrder = { id: string; status: string; stripeSessionId: string; totalCents: number; currency: string; email?: string | null };
const orders = new Map<string, FakeOrder>();
const items = new Map<string, { productId: string | null; quantity: number }[]>();
const stock = new Map<string, number>();

const tx = {
  order: {
    updateMany: vi.fn(
      async ({ where, data }: { where: { id: string; status: string | { in: string[] }; stripeSessionId?: string }; data: Partial<FakeOrder> }) => {
      const order = orders.get(where.id);
      const allowed = typeof where.status === "string" ? [where.status] : where.status.in;
      if (!order || !allowed.includes(order.status)) return { count: 0 };
      if (where.stripeSessionId && where.stripeSessionId !== order.stripeSessionId) return { count: 0 };
      Object.assign(order, data);
      return { count: 1 };
    }),
  },
  orderItem: { findMany: vi.fn(async ({ where }: { where: { orderId: string } }) => items.get(where.orderId) ?? []) },
  product: {
    updateMany: vi.fn(async ({ where, data }: { where: { id: string; stock: { gte: number } }; data: { stock: { decrement: number } } }) => {
      const current = stock.get(where.id) ?? 0;
      if (current < where.stock.gte) return { count: 0 };
      stock.set(where.id, current - data.stock.decrement);
      return { count: 1 };
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: { stock: number } }) => void stock.set(where.id, data.stock)),
  },
};

vi.mock("@/lib/db", () => ({
  db: {
    order: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => orders.get(where.id) ?? null),
      updateMany: tx.order.updateMany,
    },
    $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  },
}));
const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag: (...args: unknown[]) => revalidateTag(...args) }));

const { fulfilCheckoutSession, expireCheckoutSession } = await import("./orders");

const session = (overrides: Partial<Stripe.Checkout.Session> = {}) =>
  ({
    id: "cs_test_1",
    metadata: { orderId: "order1" },
    payment_status: "paid",
    status: "complete",
    amount_total: 5498,
    currency: "gbp",
    customer_details: { email: "test@example.com" },
    collected_information: { shipping_details: { name: "Test Buyer", address: { line1: "1 Test Street", city: "London" } } },
    ...overrides,
  }) as unknown as Stripe.Checkout.Session;

beforeEach(() => {
  orders.clear();
  items.clear();
  stock.clear();
  revalidateTag.mockClear();
  orders.set("order1", { id: "order1", status: "PENDING", stripeSessionId: "cs_test_1", totalCents: 5498, currency: "gbp" });
  items.set("order1", [{ productId: "p-recoil", quantity: 2 }]);
  stock.set("p-recoil", 85);
});

describe("fulfilCheckoutSession", () => {
  it("marks the order paid, records the buyer and takes the items out of stock", async () => {
    expect(await fulfilCheckoutSession(session())).toBe("paid");
    expect(orders.get("order1")).toMatchObject({ status: "PAID", email: "test@example.com" });
    expect(stock.get("p-recoil")).toBe(83);
    expect(revalidateTag).toHaveBeenCalledWith("products", "max");
  });

  it("only counts a payment once, however many times it's called", async () => {
    await fulfilCheckoutSession(session());
    expect(await fulfilCheckoutSession(session())).toBe("already-paid");
    expect(await fulfilCheckoutSession(session())).toBe("already-paid");
    expect(stock.get("p-recoil")).toBe(83);
  });

  it("does nothing until Stripe says the session is paid", async () => {
    expect(await fulfilCheckoutSession(session({ payment_status: "unpaid" }))).toBe("not-paid");
    expect(orders.get("order1")?.status).toBe("PENDING");
    expect(stock.get("p-recoil")).toBe(85);
  });

  it("rejects a session that doesn't match the order", async () => {
    expect(await fulfilCheckoutSession(session({ id: "cs_test_other" }))).toBe("mismatch");
    expect(await fulfilCheckoutSession(session({ amount_total: 1 }))).toBe("mismatch");
    expect(await fulfilCheckoutSession(session({ currency: "usd" }))).toBe("mismatch");
    expect(await fulfilCheckoutSession(session({ metadata: { orderId: "nope" } }))).toBe("not-found");
    expect(orders.get("order1")?.status).toBe("PENDING");
  });

  it("never takes stock below zero when two buyers bought the last ones", async () => {
    stock.set("p-recoil", 1);
    expect(await fulfilCheckoutSession(session())).toBe("paid");
    expect(stock.get("p-recoil")).toBe(0);
  });

  it("still accepts a payment that arrives after the session expired", async () => {
    orders.get("order1")!.status = "EXPIRED";
    expect(await fulfilCheckoutSession(session())).toBe("paid");
  });
});

describe("expireCheckoutSession", () => {
  it("expires a pending order", async () => {
    await expireCheckoutSession(session({ status: "expired", payment_status: "unpaid" }));
    expect(orders.get("order1")?.status).toBe("EXPIRED");
  });

  it("leaves a paid order alone", async () => {
    orders.get("order1")!.status = "PAID";
    await expireCheckoutSession(session({ status: "expired", payment_status: "unpaid" }));
    expect(orders.get("order1")?.status).toBe("PAID");
  });
});

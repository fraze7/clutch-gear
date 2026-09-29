// The admin Server Actions are public endpoints like any other, so these call them as an anonymous
// visitor, a signed-in customer and an admin, with a fake database.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";

let role: "admin" | "customer" | null = "admin";
vi.mock("@/lib/session", () => ({
  getSession: async () => (role ? { user: { id: "u1", name: "Tester", role } } : null),
}));

const db = {
  product: {
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
    deleteMany: vi.fn(async () => ({ count: 1 })),
  },
};
vi.mock("@/lib/db", () => ({ db }));

const updateTag = vi.fn();
vi.mock("next/cache", () => ({ updateTag: (tag: string) => updateTag(tag) }));

// redirect() throws in Next.js; mimic that so the test can see where it would go
class Redirect extends Error {
  constructor(public url: string) {
    super(url);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Redirect(url);
  },
}));

const { saveProductAction, deleteProductAction } = await import("./actions");
const { NotAuthorizedError } = await import("@/lib/admin");

const fields = {
  name: "Clutch Test Pad",
  slug: "",
  tagline: "A test product",
  description: "Made in a test.",
  category: "MOUSEPADS",
  priceCents: "12.50",
  stock: "7",
  imageUrl: "/products/hybrid-pad-m.svg",
  specs: "",
};
const form = (extra: Record<string, string> = {}) => {
  const data = new FormData();
  for (const [k, v] of Object.entries({ ...fields, ...extra })) data.set(k, v);
  return data;
};

beforeEach(() => {
  role = "admin";
  vi.clearAllMocks();
});

describe("who can use the admin actions", () => {
  for (const who of [null, "customer"] as const) {
    it(`refuses ${who ?? "an anonymous visitor"} before touching the database`, async () => {
      role = who;
      await expect(saveProductAction({}, form())).rejects.toBeInstanceOf(NotAuthorizedError);
      await expect(saveProductAction({}, form({ id: "p1" }))).rejects.toBeInstanceOf(NotAuthorizedError);
      await expect(deleteProductAction(form({ id: "p1", confirm: "on" }))).rejects.toBeInstanceOf(NotAuthorizedError);
      expect(db.product.create).not.toHaveBeenCalled();
      expect(db.product.update).not.toHaveBeenCalled();
      expect(db.product.deleteMany).not.toHaveBeenCalled();
    });
  }
});

describe("saveProductAction", () => {
  it("creates a product, refreshes the shop cache and returns to the list", async () => {
    await expect(saveProductAction({}, form())).rejects.toMatchObject({ url: "/admin/products?saved=clutch-test-pad" });
    expect(db.product.create).toHaveBeenCalledWith({ data: expect.objectContaining({ slug: "clutch-test-pad", priceCents: 1250 }) });
    expect(updateTag).toHaveBeenCalledWith("products");
  });

  it("updates when the form has an id", async () => {
    await expect(saveProductAction({}, form({ id: "p1", priceCents: "14.99" }))).rejects.toBeInstanceOf(Redirect);
    expect(db.product.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: expect.objectContaining({ priceCents: 1499 }) });
    expect(db.product.create).not.toHaveBeenCalled();
  });

  it("returns field errors without saving", async () => {
    const state = await saveProductAction({}, form({ priceCents: "free" }));
    expect(state.errors?.priceCents).toBeDefined();
    expect(db.product.create).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("explains a slug that's already taken", async () => {
    db.product.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", { code: "P2002", clientVersion: "7" })
    );
    const state = await saveProductAction({}, form({ slug: "rapid-75" }));
    expect(state.errors?.slug).toMatch(/already uses/);
  });
});

describe("deleteProductAction", () => {
  it("only deletes when the confirmation box is ticked", async () => {
    await deleteProductAction(form({ id: "p1" }));
    expect(db.product.deleteMany).not.toHaveBeenCalled();

    await expect(deleteProductAction(form({ id: "p1", confirm: "on" }))).rejects.toMatchObject({ url: "/admin/products?deleted=1" });
    expect(db.product.deleteMany).toHaveBeenCalledWith({ where: { id: "p1" } });
    expect(updateTag).toHaveBeenCalledWith("products");
  });
});

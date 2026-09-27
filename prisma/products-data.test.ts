import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { products } from "./products-data";
import { CATEGORIES } from "@/lib/catalog";

describe("seed products", () => {
  it("has unique, URL-safe slugs", () => {
    const slugs = products.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("has positive prices with at most two decimal places", () => {
    for (const p of products) {
      expect(p.price, p.slug).toBeGreaterThan(0);
      expect(Math.round(p.price * 100) / 100, p.slug).toBe(p.price);
    }
  });

  it("has a generated image for every product", () => {
    for (const p of products) {
      expect(existsSync(join(process.cwd(), "public", "products", `${p.slug}.svg`)), p.slug).toBe(true);
    }
  });

  it("has at least three products in every category", () => {
    for (const c of CATEGORIES) {
      expect(products.filter((p) => p.category === c.value).length, c.label).toBeGreaterThanOrEqual(3);
    }
  });

  it("uses images that exist for every category tile", () => {
    for (const c of CATEGORIES) expect(existsSync(join(process.cwd(), "public", c.image)), c.label).toBe(true);
  });
});

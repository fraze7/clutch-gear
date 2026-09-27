import { describe, expect, it } from "vitest";
import {
  buildProductQuery,
  catalogHref,
  formatPrice,
  LOW_STOCK_THRESHOLD,
  parseCatalogParams,
  stockStatus,
} from "./catalog";

describe("parseCatalogParams", () => {
  it("reads a valid category, search and sort", () => {
    expect(parseCatalogParams({ category: "mice", q: "  wireless ", sort: "price-asc" })).toEqual({
      category: "MICE",
      q: "wireless",
      sort: "price-asc",
    });
  });

  it("falls back to defaults for missing or unknown values", () => {
    expect(parseCatalogParams({})).toEqual({ category: null, q: "", sort: "featured" });
    expect(parseCatalogParams({ category: "laptops", sort: "cheapest" })).toEqual({
      category: null,
      q: "",
      sort: "featured",
    });
  });

  it("uses the first value when a param is repeated", () => {
    expect(parseCatalogParams({ category: ["keyboards", "mice"] }).category).toBe("KEYBOARDS");
  });

  it("caps very long searches", () => {
    expect(parseCatalogParams({ q: "a".repeat(500) }).q).toHaveLength(100);
  });
});

describe("catalogHref", () => {
  it("leaves defaults out of the URL", () => {
    expect(catalogHref({})).toBe("/products");
    expect(catalogHref({ category: null, q: "", sort: "featured" })).toBe("/products");
  });

  it("round-trips through parseCatalogParams", () => {
    const filters = { category: "HEADSETS", q: "open back", sort: "price-desc" } as const;
    const url = new URL(catalogHref(filters), "http://localhost");
    expect(parseCatalogParams(Object.fromEntries(url.searchParams))).toEqual(filters);
  });
});

describe("buildProductQuery", () => {
  it("filters by category", () => {
    expect(buildProductQuery({ category: "MICE", q: "", sort: "featured" }).where).toEqual({ category: "MICE" });
  });

  it("searches name, tagline and description, ignoring case", () => {
    const { where } = buildProductQuery({ category: null, q: "glass", sort: "featured" });
    expect(where.OR).toEqual([
      { name: { contains: "glass", mode: "insensitive" } },
      { tagline: { contains: "glass", mode: "insensitive" } },
      { description: { contains: "glass", mode: "insensitive" } },
    ]);
  });

  it("maps each sort to an order", () => {
    expect(buildProductQuery({ category: null, q: "", sort: "price-asc" }).orderBy).toEqual([{ priceCents: "asc" }]);
    expect(buildProductQuery({ category: null, q: "", sort: "featured" }).orderBy).toEqual([
      { featured: "desc" },
      { name: "asc" },
    ]);
  });
});

describe("formatPrice", () => {
  it("formats pence as pounds", () => {
    expect(formatPrice(12999)).toBe("£129.99");
    expect(formatPrice(799)).toBe("£7.99");
    expect(formatPrice(0)).toBe("£0.00");
  });
});

describe("stockStatus", () => {
  it("covers out, low and in stock", () => {
    expect(stockStatus(0).tone).toBe("out");
    expect(stockStatus(1)).toEqual({ label: "Only 1 left", tone: "low" });
    expect(stockStatus(LOW_STOCK_THRESHOLD).tone).toBe("low");
    expect(stockStatus(LOW_STOCK_THRESHOLD + 1).tone).toBe("in");
  });
});

import { describe, expect, it } from "vitest";
import { formatSpecs, parsePrice, parseSpecs, slugify, validateProductInput } from "./product-form";

const valid = {
  name: "Clutch Test Pad",
  slug: "",
  tagline: "A test product",
  description: "Made in a test.",
  category: "MOUSEPADS",
  priceCents: "12.50",
  stock: "7",
  imageUrl: "/products/hybrid-pad-m.svg",
  featured: "on",
  specs: "Size: 300 × 250 mm\nSurface: Hybrid weave",
};

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  for (const [k, v] of Object.entries({ ...valid, ...overrides })) if (v !== undefined) data.set(k, v);
  return data;
}

describe("validateProductInput", () => {
  it("accepts a valid product and converts price and stock", () => {
    const result = validateProductInput(form());
    expect(result).toEqual({
      ok: true,
      data: {
        slug: "clutch-test-pad",
        name: "Clutch Test Pad",
        tagline: "A test product",
        description: "Made in a test.",
        category: "MOUSEPADS",
        priceCents: 1250,
        stock: 7,
        imageUrl: "/products/hybrid-pad-m.svg",
        featured: true,
        specs: { Size: "300 × 250 mm", Surface: "Hybrid weave" },
      },
    });
  });

  it("keeps an explicit slug", () => {
    const result = validateProductInput(form({ slug: "my-pad" }));
    expect(result.ok && result.data.slug).toBe("my-pad");
  });

  it("reports every invalid field and returns what was typed", () => {
    const result = validateProductInput(
      form({ name: "", tagline: "", description: "", category: "LAPTOPS", priceCents: "free", stock: "-1", imageUrl: "https://evil.example/x.svg" })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(
      ["category", "description", "imageUrl", "name", "priceCents", "slug", "stock", "tagline"].sort()
    );
    expect(result.values.priceCents).toBe("free");
  });

  it("rejects prices outside £0.01–£10,000 and fractional stock", () => {
    for (const priceCents of ["0", "0.001", "10000.01", "12.345"]) {
      expect(validateProductInput(form({ priceCents })).ok, priceCents).toBe(false);
    }
    expect(validateProductInput(form({ stock: "2.5" })).ok).toBe(false);
    expect(validateProductInput(form({ stock: "0" })).ok).toBe(true);
  });

  it("only allows the site's own product images", () => {
    for (const imageUrl of ["/products/../secret.svg", "/products/x.png", "javascript:alert(1)", ""]) {
      expect(validateProductInput(form({ imageUrl })).ok, imageUrl).toBe(false);
    }
  });

  it("rejects badly formed slugs", () => {
    for (const slug of ["Has Spaces", "double--hyphen", "-leading", "UPPER"]) {
      expect(validateProductInput(form({ slug })).ok, slug).toBe(false);
    }
  });

  it("treats an unticked checkbox as not featured", () => {
    const data = form();
    data.delete("featured");
    const result = validateProductInput(data);
    expect(result.ok && result.data.featured).toBe(false);
  });
});

describe("helpers", () => {
  it("slugify makes URL-safe slugs", () => {
    expect(slugify("  Rapid 75 — Pro Édition! ")).toBe("rapid-75-pro-edition");
  });

  it("parsePrice understands pounds, pence and £ signs", () => {
    expect(parsePrice("129.99")).toBe(12999);
    expect(parsePrice("£1,299")).toBe(129900);
    expect(parsePrice("7.5")).toBe(750);
    expect(parsePrice("abc")).toBeNull();
  });

  it("specs round-trip between text and an object, skipping junk lines", () => {
    const specs = parseSpecs("Weight: 58 g\nnot a spec\n: no label\nSensor: 26,000 DPI: optical");
    expect(specs).toEqual({ Weight: "58 g", Sensor: "26,000 DPI: optical" });
    expect(parseSpecs(formatSpecs(specs))).toEqual(specs);
  });
});

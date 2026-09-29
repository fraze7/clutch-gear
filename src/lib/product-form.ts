// Parsing and validating the admin product form. No database access, so it's easy to test.
import type { Category } from "@/generated/prisma/enums";
import { CATEGORIES } from "@/lib/catalog";

export type ProductInput = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: Category;
  priceCents: number;
  stock: number;
  imageUrl: string;
  featured: boolean;
  specs: Record<string, string>;
};

export type ProductFormValues = Record<keyof ProductInput, string>;
export type ProductFormErrors = Partial<Record<keyof ProductInput, string>>;

export const LIMITS = {
  name: 80,
  tagline: 120,
  description: 2000,
  specs: 12,
  maxPriceCents: 1_000_000, // £10,000
  maxStock: 100_000,
};

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Specs are edited as "Label: value" lines
export function parseSpecs(text: string) {
  const specs: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const label = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    if (label && value) specs[label] = value;
  }
  return specs;
}

export function formatSpecs(specs: Record<string, string>) {
  return Object.entries(specs)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

// "129.99" or "£1,299" → pence. Returns null for anything that isn't a clean amount.
export function parsePrice(text: string) {
  const cleaned = text.replace(/[£,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

const IMAGE_PATH = /^\/products\/[a-z0-9-]+\.svg$/;

export function validateProductInput(
  form: FormData
): { ok: true; data: ProductInput } | { ok: false; errors: ProductFormErrors; values: ProductFormValues } {
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const values: ProductFormValues = {
    slug: text("slug"),
    name: text("name"),
    tagline: text("tagline"),
    description: text("description"),
    category: text("category"),
    priceCents: text("priceCents"),
    stock: text("stock"),
    imageUrl: text("imageUrl"),
    featured: form.get("featured") === "on" ? "on" : "",
    specs: String(form.get("specs") ?? ""),
  };
  const errors: ProductFormErrors = {};

  if (values.name.length < 2 || values.name.length > LIMITS.name) {
    errors.name = `Name must be 2–${LIMITS.name} characters.`;
  }
  const slug = values.slug ? values.slug : slugify(values.name);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 60) {
    errors.slug = "Use lowercase letters, numbers and single hyphens (e.g. flick-pro-wireless).";
  }
  if (!values.tagline || values.tagline.length > LIMITS.tagline) {
    errors.tagline = `Tagline is required (max ${LIMITS.tagline} characters).`;
  }
  if (!values.description || values.description.length > LIMITS.description) {
    errors.description = `Description is required (max ${LIMITS.description} characters).`;
  }
  const category = CATEGORIES.find((c) => c.value === values.category)?.value;
  if (!category) errors.category = "Choose a category.";

  const priceCents = parsePrice(values.priceCents);
  if (priceCents === null || priceCents < 1 || priceCents > LIMITS.maxPriceCents) {
    errors.priceCents = "Enter a price between £0.01 and £10,000, e.g. 129.99.";
  }
  const stock = Number(values.stock);
  if (!/^\d+$/.test(values.stock) || stock > LIMITS.maxStock) {
    errors.stock = `Stock must be a whole number from 0 to ${LIMITS.maxStock.toLocaleString("en-GB")}.`;
  }
  if (!IMAGE_PATH.test(values.imageUrl)) errors.imageUrl = "Choose an image.";

  const specs = parseSpecs(values.specs);
  if (Object.keys(specs).length > LIMITS.specs) errors.specs = `At most ${LIMITS.specs} specs.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors, values: { ...values, slug } };
  return {
    ok: true,
    data: {
      slug,
      name: values.name,
      tagline: values.tagline,
      description: values.description,
      category: category!,
      priceCents: priceCents!,
      stock,
      imageUrl: values.imageUrl,
      featured: values.featured === "on",
      specs,
    },
  };
}

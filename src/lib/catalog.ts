// Catalogue helpers shared by server and client code. No database access here, so it's easy to test.
import type { Category } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

export const CATEGORIES: { value: Category; slug: string; label: string; image: string }[] = [
  { value: "MICE", slug: "mice", label: "Mice", image: "/products/flick-pro-wireless.svg" },
  { value: "KEYBOARDS", slug: "keyboards", label: "Keyboards", image: "/products/rapid-75.svg" },
  { value: "HEADSETS", slug: "headsets", label: "Headsets", image: "/products/callout-pro.svg" },
  { value: "MOUSEPADS", slug: "mousepads", label: "Mousepads", image: "/products/glide-xl.svg" },
  { value: "ACCESSORIES", slug: "accessories", label: "Accessories", image: "/products/coiled-cable.svg" },
];

export function categoryLabel(value: Category) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name A–Z" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export type CatalogFilters = {
  category: Category | null;
  q: string;
  sort: SortKey;
};

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

// Turns the URL's ?category=&q=&sort= into safe values; anything unknown falls back to the default
export function parseCatalogParams(params: SearchParams): CatalogFilters {
  const category = CATEGORIES.find((c) => c.slug === first(params.category))?.value ?? null;
  const q = first(params.q).trim().slice(0, 100);
  const sortParam = first(params.sort);
  const sort = SORT_OPTIONS.some((s) => s.value === sortParam) ? (sortParam as SortKey) : "featured";
  return { category, q, sort };
}

// Builds a /products URL, leaving out defaults so URLs stay short
export function catalogHref(filters: Partial<CatalogFilters>) {
  const params = new URLSearchParams();
  const slug = CATEGORIES.find((c) => c.value === filters.category)?.slug;
  if (slug) params.set("category", slug);
  if (filters.q) params.set("q", filters.q);
  if (filters.sort && filters.sort !== "featured") params.set("sort", filters.sort);
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

const ORDER_BY: Record<SortKey, Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ featured: "desc" }, { name: "asc" }],
  "price-asc": [{ priceCents: "asc" }],
  "price-desc": [{ priceCents: "desc" }],
  newest: [{ createdAt: "desc" }, { name: "asc" }],
  name: [{ name: "asc" }],
};

export function buildProductQuery(filters: CatalogFilters) {
  const where: Prisma.ProductWhereInput = {};
  if (filters.category) where.category = filters.category;
  if (filters.q) {
    where.OR = (["name", "tagline", "description"] as const).map((field) => ({
      [field]: { contains: filters.q, mode: "insensitive" as const },
    }));
  }
  return { where, orderBy: ORDER_BY[filters.sort] };
}

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export function formatPrice(pence: number) {
  return gbp.format(pence / 100);
}

export const LOW_STOCK_THRESHOLD = 5;

export function stockStatus(stock: number) {
  if (stock <= 0) return { label: "Out of stock", tone: "out" } as const;
  if (stock <= LOW_STOCK_THRESHOLD) return { label: `Only ${stock} left`, tone: "low" } as const;
  return { label: "In stock", tone: "in" } as const;
}

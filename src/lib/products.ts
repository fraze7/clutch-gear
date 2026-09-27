// Product reads. Each one is cached with 'use cache' and tagged "products", so the admin area
// (step 7) can refresh everything with a single revalidateTag("products") after an edit.
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { buildProductQuery, type CatalogFilters } from "@/lib/catalog";
import type { Category } from "@/generated/prisma/enums";

const CARD_FIELDS = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  category: true,
  priceCents: true,
  stock: true,
  imageUrl: true,
} as const;

export async function getProducts(filters: CatalogFilters) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  return db.product.findMany({ ...buildProductQuery(filters), select: CARD_FIELDS });
}

export async function getFeaturedProducts() {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  return db.product.findMany({ where: { featured: true }, orderBy: { name: "asc" }, select: CARD_FIELDS });
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  return db.product.findUnique({ where: { slug } });
}

export async function getRelatedProducts(category: Category, excludeSlug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  return db.product.findMany({
    where: { category, slug: { not: excludeSlug } },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    take: 4,
    select: CARD_FIELDS,
  });
}

// For the cart: the current price and stock of each product in it
export async function getCartProducts(slugs: string[]) {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  return db.product.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, name: true, priceCents: true, stock: true, imageUrl: true },
  });
}

export async function getAllProductSlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  return db.product.findMany({ select: { slug: true } });
}

export type ProductCardData = Awaited<ReturnType<typeof getFeaturedProducts>>[number];

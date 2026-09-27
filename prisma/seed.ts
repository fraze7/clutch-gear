import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { products } from "./products-data";

config({ path: ".env.local", quiet: true });

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // Upsert by slug, so the seed can be run again without creating duplicates
  for (const p of products) {
    const data = {
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      category: p.category,
      priceCents: Math.round(p.price * 100),
      stock: p.stock,
      imageUrl: `/products/${p.slug}.svg`,
      featured: p.featured ?? false,
      specs: p.specs,
    };
    await db.product.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });
  }
  console.log(`Seeded ${products.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

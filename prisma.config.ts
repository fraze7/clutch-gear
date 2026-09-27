import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads .env.local itself, but the Prisma CLI doesn't — load it here
config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need the direct (non-pooled) connection
    url: process.env.DATABASE_URL,
  },
});

// Better Auth: GitHub sign-in, sessions stored in Postgres through Prisma.
// Reads BETTER_AUTH_SECRET and BETTER_AUTH_URL from the environment.
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    },
  },
  user: {
    additionalFields: {
      // Server-owned: input: false means sign-up and profile updates can never set it
      role: { type: ["customer", "admin"], required: false, defaultValue: "customer", input: false },
    },
  },
  // Lets Server Actions (sign in / sign out) set Better Auth's cookies. Must be the last plugin.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

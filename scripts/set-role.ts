// Makes a user an admin (or back to a customer). The site deliberately has no way to do this itself,
// so it's done from a terminal by someone with database access:
//   npm run set-role -- you@example.com admin
//   npm run set-role -- you@example.com customer
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local", quiet: true });

const ROLES = ["customer", "admin"];

async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || !ROLES.includes(role)) {
    console.error("Usage: npm run set-role -- <email> <customer|admin>");
    process.exitCode = 1;
    return;
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const user = await db.user.findUnique({ where: { email }, select: { id: true, name: true, role: true } });
    if (!user) {
      console.error(`No user with email ${email}. They need to sign in once first.`);
      process.exitCode = 1;
    } else if (user.role === role) {
      console.log(`${user.name} is already ${role}.`);
    } else {
      await db.user.update({ where: { id: user.id }, data: { role } });
      console.log(`${user.name}: ${user.role} → ${role}`);
    }
  } finally {
    await db.$disconnect();
  }
}

main();

// Admin checks. Every admin page AND every admin Server Action calls one of these itself: a layout check
// wouldn't protect Server Actions (they're public endpoints) and doesn't re-run on client navigation.
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import type { OrderStatus } from "@/generated/prisma/enums";

type MaybeSession = Awaited<ReturnType<typeof getSession>>;

export function isAdmin(session: MaybeSession) {
  return session?.user.role === "admin";
}

// For pages: anyone who isn't an admin gets the normal 404, so the admin area doesn't reveal it exists
export async function requireAdminPage() {
  const session = await getSession();
  if (!isAdmin(session)) notFound();
  return session!;
}

export class NotAuthorizedError extends Error {
  constructor() {
    super("Not authorized");
  }
}

// For Server Actions: throw before touching any data
export async function requireAdminAction() {
  const session = await getSession();
  if (!isAdmin(session)) throw new NotAuthorizedError();
  return session!;
}

// ── Admin data. Not cached: admins should always see the current state. ───────────────────────────

export function getAdminProducts() {
  return db.product.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, category: true, priceCents: true, stock: true, featured: true, imageUrl: true },
  });
}

export function getAdminProduct(id: string) {
  return db.product.findUnique({ where: { id } });
}

// The product illustrations already in use, offered as choices on the product form
export async function getProductImages() {
  const rows = await db.product.findMany({ distinct: ["imageUrl"], select: { imageUrl: true }, orderBy: { imageUrl: "asc" } });
  return rows.map((r) => r.imageUrl);
}

export function getAdminOrders(status?: OrderStatus) {
  return db.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      status: true,
      totalCents: true,
      createdAt: true,
      email: true,
      shippingName: true,
      user: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
  });
}

export async function getDashboardStats() {
  const [products, lowStock, outOfStock, paid, revenue, pending] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { stock: { gt: 0, lte: 5 } } }),
    db.product.count({ where: { stock: 0 } }),
    db.order.count({ where: { status: "PAID" } }),
    db.order.aggregate({ where: { status: "PAID" }, _sum: { totalCents: true } }),
    db.order.count({ where: { status: "PENDING" } }),
  ]);
  return { products, lowStock, outOfStock, paid, revenueCents: revenue._sum.totalCents ?? 0, pending };
}

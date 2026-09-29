"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireAdminAction } from "@/lib/admin";
import { validateProductInput, type ProductFormErrors, type ProductFormValues } from "@/lib/product-form";

export type ProductFormState = { errors?: ProductFormErrors; values?: ProductFormValues; message?: string };

// Creates a product, or updates one when the form includes an id
export async function saveProductAction(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdminAction();

  const result = validateProductInput(formData);
  if (!result.ok) return { errors: result.errors, values: result.values };

  const id = formData.get("id");
  try {
    if (typeof id === "string" && id) {
      await db.product.update({ where: { id }, data: result.data });
    } else {
      await db.product.create({ data: result.data });
    }
  } catch (e) {
    // Unique constraint on slug
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        errors: { slug: "Another product already uses this URL slug." },
        values: Object.fromEntries(formData) as unknown as ProductFormValues,
      };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return { message: "This product no longer exists." };
    }
    throw e;
  }

  updateTag("products"); // the shop's cached product data refreshes on the next request
  redirect("/admin/products?saved=" + encodeURIComponent(result.data.slug));
}

// Orders keep their own copy of each product's name and price, so deleting a product never changes past orders
export async function deleteProductAction(formData: FormData) {
  await requireAdminAction();

  const id = formData.get("id");
  if (typeof id !== "string" || !id || formData.get("confirm") !== "on") return;

  await db.product.deleteMany({ where: { id } });
  updateTag("products");
  redirect("/admin/products?deleted=1");
}

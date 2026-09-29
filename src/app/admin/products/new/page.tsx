import { Suspense } from "react";
import { AdminShell, AdminSkeleton } from "@/components/admin-shell";
import { ProductForm } from "@/components/product-form";
import { getProductImages, requireAdminPage } from "@/lib/admin";

export default function NewProductPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <NewProduct />
    </Suspense>
  );
}

async function NewProduct() {
  await requireAdminPage();
  const images = await getProductImages();
  return (
    <AdminShell active="/admin/products" title="New product">
      <ProductForm
        images={images}
        initial={{
          name: "",
          slug: "",
          tagline: "",
          description: "",
          category: "",
          priceCents: "",
          stock: "0",
          imageUrl: "",
          featured: "",
          specs: "",
        }}
      />
    </AdminShell>
  );
}

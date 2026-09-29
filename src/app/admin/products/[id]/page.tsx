import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteProductAction } from "@/app/admin/actions";
import { AdminShell, AdminSkeleton } from "@/components/admin-shell";
import { PendingButton } from "@/components/pending-button";
import { ProductForm } from "@/components/product-form";
import { getAdminProduct, getProductImages, requireAdminPage } from "@/lib/admin";
import { formatSpecs } from "@/lib/product-form";

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <EditProduct params={params} />
    </Suspense>
  );
}

async function EditProduct({ params }: { params: PageProps<"/admin/products/[id]">["params"] }) {
  await requireAdminPage();
  const { id } = await params;
  const [product, images] = await Promise.all([getAdminProduct(id), getProductImages()]);
  if (!product) notFound();

  return (
    <AdminShell
      active="/admin/products"
      title={`Edit ${product.name}`}
      actions={
        <Link href={`/products/${product.slug}`} className="text-sm text-accent hover:underline">
          View in shop
        </Link>
      }
    >
      <ProductForm
        id={product.id}
        images={images}
        initial={{
          name: product.name,
          slug: product.slug,
          tagline: product.tagline,
          description: product.description,
          category: product.category,
          priceCents: (product.priceCents / 100).toFixed(2),
          stock: String(product.stock),
          imageUrl: product.imageUrl,
          featured: product.featured ? "on" : "",
          specs: formatSpecs(product.specs as Record<string, string>),
        }}
      />

      {/* A confirm checkbox rather than a JavaScript dialog, so it works without JS too */}
      <details className="rounded-xl border border-danger/40 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-danger">Delete this product</summary>
        <form action={deleteProductAction} className="mt-3 space-y-3 text-sm">
          <input type="hidden" name="id" value={product.id} />
          <p className="text-muted">
            It disappears from the shop immediately. Past orders keep their copy of its name and price.
          </p>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="confirm" required className="h-4 w-4" />
            Yes, delete {product.name}
          </label>
          <PendingButton className="rounded-lg bg-danger px-4 py-2 font-semibold text-bg hover:brightness-110">
            Delete product
          </PendingButton>
        </form>
      </details>
    </AdminShell>
  );
}

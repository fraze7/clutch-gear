"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { saveProductAction, type ProductFormState } from "@/app/admin/actions";
import { CATEGORIES } from "@/lib/catalog";
import { LIMITS, type ProductFormValues } from "@/lib/product-form";

const input =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink placeholder:text-muted focus:border-accent focus:outline-none aria-[invalid=true]:border-danger";

export function ProductForm({ initial, id, images }: { initial: ProductFormValues; id?: string; images: string[] }) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProductAction, {});
  // After a failed save, show what was submitted rather than the original values
  const values = state.values ?? initial;
  const [image, setImage] = useState(values.imageUrl);
  const err = state.errors ?? {};

  const field = (name: keyof ProductFormValues, label: string, control: React.ReactNode, hint?: string) => (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {control}
      {err[name] ? (
        <p id={`${name}-error`} className="text-sm text-danger">
          {err[name]}
        </p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
  const a11y = (name: keyof ProductFormValues) => ({
    id: name,
    name,
    "aria-invalid": Boolean(err[name]),
    "aria-describedby": err[name] ? `${name}-error` : undefined,
  });

  return (
    // key: re-mount inputs with the submitted values after a failed save
    <form action={action} key={JSON.stringify(state.values ?? null)} className="grid gap-8 lg:grid-cols-[1fr_18rem]" noValidate>
      {id && <input type="hidden" name="id" value={id} />}
      <div className="space-y-5">
        {state.message && <p className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">{state.message}</p>}
        {Object.keys(err).length > 0 && (
          <p role="alert" className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
            Please fix the highlighted fields.
          </p>
        )}
        {field("name", "Name", <input {...a11y("name")} defaultValue={values.name} maxLength={LIMITS.name} className={input} />)}
        {field(
          "slug",
          "URL slug",
          <input {...a11y("slug")} defaultValue={values.slug} placeholder="Leave blank to generate from the name" className={input} />,
          "Used in the product's address: /products/your-slug"
        )}
        {field("tagline", "Tagline", <input {...a11y("tagline")} defaultValue={values.tagline} maxLength={LIMITS.tagline} className={input} />)}
        {field(
          "description",
          "Description",
          <textarea {...a11y("description")} defaultValue={values.description} rows={4} maxLength={LIMITS.description} className={input} />
        )}
        <div className="grid gap-5 sm:grid-cols-3">
          {field(
            "category",
            "Category",
            <select {...a11y("category")} defaultValue={values.category} className={input}>
              <option value="">Choose…</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
          {field("priceCents", "Price (£)", <input {...a11y("priceCents")} defaultValue={values.priceCents} inputMode="decimal" placeholder="129.99" className={input} />)}
          {field("stock", "Stock", <input {...a11y("stock")} defaultValue={values.stock} inputMode="numeric" className={input} />)}
        </div>
        {field(
          "specs",
          "Specifications",
          <textarea {...a11y("specs")} defaultValue={values.specs} rows={5} placeholder={"Weight: 58 g\nSensor: 26,000 DPI optical"} className={`${input} font-mono text-sm`} />,
          "One per line, as Label: value"
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={values.featured === "on"} className="h-4 w-4 accent-accent" />
          Featured on the home page
        </label>
      </div>

      <aside className="space-y-4">
        {field(
          "imageUrl",
          "Image",
          <select {...a11y("imageUrl")} value={image} onChange={(e) => setImage(e.target.value)} className={input}>
            <option value="">Choose…</option>
            {images.map((src) => (
              <option key={src} value={src}>
                {src.replace("/products/", "").replace(".svg", "")}
              </option>
            ))}
          </select>
        )}
        {image && <Image src={image} alt="Selected product image" width={288} height={288} className="w-full rounded-xl border border-line" />}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-ink hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Saving…" : id ? "Save changes" : "Create product"}
        </button>
      </aside>
    </form>
  );
}

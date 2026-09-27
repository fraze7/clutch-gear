"use client";

import Link from "next/link";
import { useActionState } from "react";
import { addToCartAction, type AddToCartState } from "@/app/cart/actions";
import { lineLimit } from "@/lib/cart";

// Works before JavaScript loads too: the form posts straight to the Server Action
export function AddToCart({ slug, stock }: { slug: string; stock: number }) {
  const [state, formAction, pending] = useActionState<AddToCartState, FormData>(addToCartAction, { status: "idle" });
  const max = lineLimit(stock);

  if (max === 0) {
    return (
      <button type="button" disabled className="w-full rounded-lg bg-surface-2 px-5 py-3 font-semibold text-muted sm:w-auto">
        Out of stock
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="slug" value={slug} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          Qty
          <select
            name="quantity"
            defaultValue="1"
            className="rounded-lg border border-line bg-surface px-3 py-2.5 text-ink focus:border-accent focus:outline-none"
          >
            {Array.from({ length: max }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-accent px-6 py-2.5 font-semibold text-accent-ink hover:brightness-110 disabled:opacity-60 sm:flex-none"
        >
          {pending ? "Adding…" : "Add to cart"}
        </button>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm">
        {state.status === "added" && (
          <span className="text-emerald-400">
            {state.message}{" "}
            <Link href="/cart" className="text-accent underline">
              View cart
            </Link>
          </span>
        )}
        {state.status === "error" && <span className="text-danger">{state.message}</span>}
      </p>
    </form>
  );
}

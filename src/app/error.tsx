"use client";

import Link from "next/link";

// Shown if something unexpected fails while rendering a page (e.g. the database is unreachable)
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-danger">Something went wrong</p>
      <h1 className="text-3xl font-bold">That one didn&apos;t register.</h1>
      <p className="text-muted">Something went wrong on our side. Try again, or head back to the shop.</p>
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-ink hover:brightness-110"
        >
          Try again
        </button>
        <Link href="/products" className="rounded-lg border border-line px-5 py-2.5 font-semibold hover:border-accent/60">
          Back to the shop
        </Link>
      </div>
    </div>
  );
}

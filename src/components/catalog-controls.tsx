"use client";

import Form from "next/form";
import { useRef } from "react";
import { CATEGORIES, SORT_OPTIONS, type CatalogFilters } from "@/lib/catalog";

// A plain GET form: works without JavaScript, and next/form turns submits into client-side navigation.
// The current values come from the server as props, so no useSearchParams is needed.
export function CatalogControls({ filters }: { filters: CatalogFilters }) {
  const formRef = useRef<HTMLFormElement>(null);
  const categorySlug = CATEGORIES.find((c) => c.value === filters.category)?.slug;

  return (
    <Form ref={formRef} action="/products" className="flex flex-col gap-3 sm:flex-row" role="search">
      {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
      <label className="flex-1">
        <span className="sr-only">Search products</span>
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Search gear…"
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-muted">
        Sort
        <select
          name="sort"
          defaultValue={filters.sort}
          onChange={() => formRef.current?.requestSubmit()}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-ink focus:border-accent focus:outline-none"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:border-accent/60"
      >
        Search
      </button>
    </Form>
  );
}

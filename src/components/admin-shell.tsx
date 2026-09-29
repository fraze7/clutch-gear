import Link from "next/link";
import type { ReactNode } from "react";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
] as const;

// Rendered by each admin page *after* its admin check, so non-admins never see the admin navigation
export function AdminShell({ active, title, actions, children }: {
  active: (typeof LINKS)[number]["href"];
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <nav aria-label="Admin" className="flex flex-wrap items-center gap-2 border-b border-line pb-3 text-sm">
        <span className="mr-2 rounded bg-warn/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-warn">Admin</span>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active === l.href ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 ${active === l.href ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function AdminSkeleton() {
  return <div className="h-96 animate-pulse rounded-xl border border-line bg-surface" />;
}

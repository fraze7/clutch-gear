import type { Metadata } from "next";

// No auth check here on purpose: layouts don't re-run on navigation and don't protect Server Actions,
// so every admin page and action checks for itself (see src/lib/admin.ts)
export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}

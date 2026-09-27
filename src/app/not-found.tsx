import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-accent">404</p>
      <h1 className="text-3xl font-bold">Whiffed that one.</h1>
      <p className="text-muted">We couldn’t find the page you were looking for.</p>
      <Link
        href="/products"
        className="inline-block rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-ink hover:brightness-110"
      >
        Back to the shop
      </Link>
    </div>
  );
}

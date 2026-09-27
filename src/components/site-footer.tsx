export function SiteFooter() {
  return (
    <footer className="border-t border-line text-sm text-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
        <p>
          © Clutch Gear — a made-up brand for a portfolio project. Product images are illustrations, not real products.
        </p>
        <a href="https://github.com/fraze7/clutch-gear" className="hover:text-ink">
          Source on GitHub
        </a>
      </div>
    </footer>
  );
}

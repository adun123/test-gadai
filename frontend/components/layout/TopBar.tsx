// components/layout/TopBar.tsx
import Link from "next/link";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Left */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              {/* simple "analytics" icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 19V10M12 19V5M19 19V13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-sm font-extrabold tracking-tight text-foreground">Pricing Analytics</span>
          </Link>

          <nav className="hidden items-center gap-3 sm:flex">
            <Link
              href="/history"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              History
            </Link>

            <Link
              href="/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              <span className="text-base leading-none">+</span>
              New Analysis
            </Link>
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <Link
            href="/help"
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground md:inline-flex"
          >
            Help Center
          </Link>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-accent"
            aria-label="Help"
            title="Help"
          >
            ?
          </button>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground"
            aria-label="Profile"
            title="Profile"
          >
            {/* avatar placeholder */}
            <span className="text-xs font-bold">U</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="border-t border-border bg-card sm:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-6 py-3">
          <Link
            href="/history"
            className="flex-1 rounded-lg border border-border px-3 py-2 text-center text-sm font-semibold text-foreground hover:bg-accent"
          >
            History
          </Link>
          <Link
            href="/new"
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-center text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            + New Analysis
          </Link>
        </div>
      </div>
    </header>
  );
}

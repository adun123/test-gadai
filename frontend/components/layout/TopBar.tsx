// components/layout/TopBar.tsx
import Link from "next/link";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Left */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
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
            <span className="text-sm font-extrabold tracking-tight">Pricing Analytics</span>
          </Link>

          <nav className="hidden items-center gap-3 sm:flex">
            <Link
              href="/history"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              History
            </Link>

            <Link
              href="/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:opacity-90"
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
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 md:inline-flex"
          >
            Help Center
          </Link>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white text-gray-700 hover:bg-gray-50"
            aria-label="Help"
            title="Help"
          >
            ?
          </button>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-700"
            aria-label="Profile"
            title="Profile"
          >
            {/* avatar placeholder */}
            <span className="text-xs font-bold">U</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="border-t bg-white sm:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-6 py-3">
          <Link
            href="/history"
            className="flex-1 rounded-lg border px-3 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            History
          </Link>
          <Link
            href="/new"
            className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-bold text-white hover:opacity-90"
          >
            + New Analysis
          </Link>
        </div>
      </div>
    </header>
  );
}

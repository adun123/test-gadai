"use client";

// components/layout/TopBar.tsx
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "system" | "light" | "dark";

export default function TopBar() {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [theme, setTheme] = useState<Theme>("system");

  // Initialize theme from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme;
    if (stored && ["system", "light", "dark"].includes(stored)) {
      setTheme(stored);
      applyTheme(stored);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;

    if (newTheme === "system") {
      // Remove the override, let system preference work
      root.classList.remove("light", "dark");
      localStorage.removeItem("theme");
    } else {
      // Override system preference
      root.classList.remove("light", "dark");
      root.classList.add(newTheme);
      localStorage.setItem("theme", newTheme);
    }
  };

  const toggleTheme = () => {
    const themeOrder: Theme[] = ["system", "light", "dark"];
    const currentIndex = themeOrder.indexOf(theme);
    const nextTheme = themeOrder[(currentIndex + 1) % 3];

    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const getThemeIcon = () => {
    if (theme === "light") return <Sun className="h-4 w-4" />;
    if (theme === "dark") return <Moon className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const handlePlaceholderClick = (feature: string) => {
    setToastMessage(`${feature} is under development. Available in production version.`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleNewAnalysis = () => {
    // Refresh the current page to reset all state
    router.refresh();
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/90 backdrop-blur">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="rounded-xl border border-border bg-card px-6 py-3 shadow-lg">
            <p className="text-sm font-semibold text-foreground">{toastMessage}</p>
          </div>
        </div>
      )}

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
            <button
              onClick={() => handlePlaceholderClick("History")}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              History
            </button>

            <button
              onClick={handleNewAnalysis}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              <span className="text-base leading-none">+</span>
              New Analysis
            </button>
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-accent"
            aria-label="Toggle theme"
            title={`Theme: ${theme}`}
          >
            {getThemeIcon()}
          </button>

          <button
            type="button"
            onClick={() => handlePlaceholderClick("Help")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-accent"
            aria-label="Help"
            title="Help"
          >
            ?
          </button>

          <button
            type="button"
            onClick={() => handlePlaceholderClick("User Profile")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground hover:bg-accent"
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
          <button
            onClick={() => handlePlaceholderClick("History")}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-center text-sm font-semibold text-foreground hover:bg-accent"
          >
            History
          </button>
          <button
            onClick={handleNewAnalysis}
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-center text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            + New Analysis
          </button>
        </div>
      </div>
    </header>
  );
}

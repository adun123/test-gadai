"use client";

// components/layout/TopBar.tsx
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Bell, User } from "lucide-react";

type Theme = "system" | "light" | "dark";

export default function TopBar() {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Lazy initialization: read theme from localStorage once on mount
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const stored = localStorage.getItem("theme") as Theme;
    return (stored && ["system", "light", "dark"].includes(stored)) ? stored : "system";
  });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;

    if (newTheme === "system") {
      root.classList.remove("light", "dark");
      localStorage.removeItem("theme");
    } else {
      root.classList.remove("light", "dark");
      root.classList.add(newTheme);
      localStorage.setItem("theme", newTheme);
    }
  };

  // Apply theme on mount
  useEffect(() => {
    applyTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setToastMessage(`${feature} is under development.`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleNewAnalysis = () => {
    router.refresh();
    window.location.reload();
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${scrolled
          ? "border-b border-border/40 bg-background/80 backdrop-blur-md shadow-sm"
          : "bg-transparent"
        }`}
    >
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="rounded-full border border-border/50 bg-foreground/90 px-6 py-2 shadow-xl backdrop-blur-xl">
            <p className="text-sm font-medium text-background">{toastMessage}</p>
          </div>
        </div>
      )}

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Left */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              {/* Abstract Scale/Logo Icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18" />
                <path d="M6 8l-4 4 4 4" />
                <path d="M18 8l4 4-4 4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-foreground leading-none">Pegadaian</span>
              <span className="text-xs font-medium text-muted-foreground tracking-wide">AI PREDICTION</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <button
              onClick={() => handlePlaceholderClick("Dashboard")}
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Overview
            </button>
            <button
              onClick={() => handlePlaceholderClick("History")}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              History
            </button>
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewAnalysis}
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>+</span>
            New Check
          </button>

          <div className="h-6 w-px bg-border/50 mx-2 hidden sm:block"></div>

          <button
            type="button"
            onClick={() => handlePlaceholderClick("Notifications")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Bell className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {getThemeIcon()}
          </button>

          <button
            type="button"
            onClick={() => handlePlaceholderClick("Profile")}
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-md hover:opacity-90 transition-opacity"
            aria-label="Profile"
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="border-t border-border bg-card/50 backdrop-blur-lg sm:hidden">
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
            + New Check
          </button>
        </div>
      </div>
    </header>
  );
}

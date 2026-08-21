"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

function getSessionThemeKey(pathname: string): string {
  if (pathname.startsWith("/admin")) return "nonmove_theme_admin";
  if (pathname.startsWith("/viewer")) return "nonmove_theme_viewer";
  if (pathname.startsWith("/dashboard")) return "nonmove_theme_store";
  return "nonmove_theme_guest";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  const applyThemeToDOM = (t: Theme) => {
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Sync theme whenever pathname or session changes
  useEffect(() => {
    try {
      const storageKey = getSessionThemeKey(pathname);
      const saved = localStorage.getItem(storageKey) as Theme;
      if (saved === "dark" || saved === "light") {
        setThemeState(saved);
        applyThemeToDOM(saved);
      } else {
        // Fallback default
        const defaultTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        setThemeState(defaultTheme);
        applyThemeToDOM(defaultTheme);
      }
    } catch (e) {
      // ignore
    }
    setMounted(true);
  }, [pathname]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeToDOM(newTheme);
    try {
      const storageKey = getSessionThemeKey(pathname);
      localStorage.setItem(storageKey, newTheme);
    } catch (e) {
      // ignore
    }
  }, [pathname]);

  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

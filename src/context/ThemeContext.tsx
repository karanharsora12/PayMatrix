import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  PRIMARY_COLOR_PRESETS,
  DEFAULT_PRIMARY_COLOR_ID,
  deriveCustomPrimary,
} from "@/constants/colorPresets";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  // Primary color customization
  primaryColor: string; // preset ID e.g. "blue", "violet", or custom HEX "#10b981"
  setPrimaryColor: (color: string) => void;
  resetPrimaryColor: () => void;
  isCustomColor: boolean;
}

const THEME_STORAGE_KEY = "paymatrix-theme";
const COLOR_STORAGE_KEY = "paymatrix-primary-color";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
  } catch (e) {
    console.warn("Unable to access localStorage for theme preference", e);
  }
  return "system";
}

function getInitialPrimaryColor(): string {
  if (typeof window === "undefined") return DEFAULT_PRIMARY_COLOR_ID;
  try {
    const saved = localStorage.getItem(COLOR_STORAGE_KEY);
    if (saved) {
      // Check if it matches a preset
      const preset = PRIMARY_COLOR_PRESETS.find((p) => p.id === saved);
      if (preset) return preset.id;
      // Or if it's a valid hex
      if (/^#?[0-9a-fA-F]{6}$/.test(saved)) {
        return saved.startsWith("#") ? saved : `#${saved}`;
      }
    }
  } catch (e) {
    console.warn("Unable to access localStorage for primary color", e);
  }
  return DEFAULT_PRIMARY_COLOR_ID;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  const [primaryColor, setPrimaryColorState] = useState<string>(getInitialPrimaryColor);

  // Listen to OS preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === "system") return systemTheme;
    return theme;
  }, [theme, systemTheme]);

  // Apply light/dark mode to HTML root element
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [resolvedTheme]);

  // Compute and inject dynamic primary color tokens into document.documentElement CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const isDark = resolvedTheme === "dark";

    const preset = PRIMARY_COLOR_PRESETS.find((p) => p.id === primaryColor);
    if (preset) {
      const primaryHsl = isDark ? preset.darkHsl : preset.lightHsl;
      const foregroundHsl = isDark
        ? preset.darkForegroundHsl || "0 0% 100%"
        : preset.lightForegroundHsl || "0 0% 100%";

      root.style.setProperty("--primary", primaryHsl);
      root.style.setProperty("--primary-foreground", foregroundHsl);
      root.style.setProperty("--ring", primaryHsl);
      root.style.setProperty("--sidebar-primary", primaryHsl);
      root.style.setProperty("--sidebar-ring", primaryHsl);
      root.style.setProperty("--chart-1", preset.chart1 || primaryHsl);
    } else if (primaryColor.startsWith("#")) {
      const derived = deriveCustomPrimary(primaryColor);
      if (derived) {
        const primaryHsl = isDark ? derived.darkHsl : derived.lightHsl;
        const foregroundHsl = isDark ? derived.darkForegroundHsl : derived.lightForegroundHsl;

        root.style.setProperty("--primary", primaryHsl);
        root.style.setProperty("--primary-foreground", foregroundHsl);
        root.style.setProperty("--ring", primaryHsl);
        root.style.setProperty("--sidebar-primary", primaryHsl);
        root.style.setProperty("--sidebar-ring", primaryHsl);
        root.style.setProperty("--chart-1", primaryHsl);
      }
    }
  }, [primaryColor, resolvedTheme]);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (e) {
      console.warn("Unable to persist theme preference to localStorage", e);
    }
  };

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
    try {
      localStorage.setItem(COLOR_STORAGE_KEY, color);
    } catch (e) {
      console.warn("Unable to persist primary color to localStorage", e);
    }
  };

  const resetPrimaryColor = () => {
    setPrimaryColor(DEFAULT_PRIMARY_COLOR_ID);
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const isCustomColor = useMemo(() => {
    return !PRIMARY_COLOR_PRESETS.some((p) => p.id === primaryColor);
  }, [primaryColor]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      primaryColor,
      setPrimaryColor,
      resetPrimaryColor,
      isCustomColor,
    }),
    [theme, resolvedTheme, primaryColor, isCustomColor]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

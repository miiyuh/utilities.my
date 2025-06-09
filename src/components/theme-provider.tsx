// src/components/theme-provider.tsx
"use client";
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = "light" | "dark";
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
  toggleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "utilitybelt-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const storedTheme = window.localStorage.getItem(storageKey) as Theme | null;
      if (storedTheme) {
        setTheme(storedTheme);
      } else {
        setTheme(defaultTheme);
      }
    } catch (e) {
      console.error("Error reading theme from localStorage", e);
      setTheme(defaultTheme);
    }
  }, [defaultTheme, storageKey]);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch (e) {
      console.error("Error saving theme to localStorage", e);
    }
  }, [theme, storageKey, mounted]);

  const toggleTheme = useCallback(() => {
    if (!mounted) return;
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  }, [mounted]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      if (!mounted) return;
      setTheme(newTheme);
    },
    toggleTheme,
  };
  
  // Prevents flash of unstyled content / incorrect theme by ensuring root class is set before children render
  // Only applicable on client, server will use default.
  if (!mounted && typeof window !== 'undefined') {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    let initialTheme = defaultTheme;
    try {
        const storedTheme = window.localStorage.getItem(storageKey) as Theme | null;
        if (storedTheme) {
          initialTheme = storedTheme;
        }
    } catch(e) {/*ignore*/}
    root.classList.add(initialTheme);
  }


  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

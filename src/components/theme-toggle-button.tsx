// src/components/theme-toggle-button.tsx
"use client";

import { Moon, Sun } from "phosphor-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/**
 * Flips between light and dark. Until the user clicks, next-themes follows the
 * OS preference; the first click stores an explicit choice.
 */
export function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <Button
      variant="outline"
      size="icon-sm"
      className="relative size-8"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => setTheme(next)}
    >
      <Sun aria-hidden className="size-4 scale-100 opacity-100 blur-none transition-[scale,opacity,filter] duration-fast ease-[cubic-bezier(0.2,0,0,1)] dark:scale-25 dark:opacity-0 dark:blur-[4px]" />
      <Moon aria-hidden className="absolute size-4 scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-fast ease-[cubic-bezier(0.2,0,0,1)] dark:scale-100 dark:opacity-100 dark:blur-none" />
      <span className="sr-only">Switch to {next} theme</span>
    </Button>
  );
}

// src/lib/tools.ts
import type { LucideIcon } from "lucide-react";
import { CaseSensitive, FileJson, Palette, Ruler, Home } from "lucide-react";

export interface Tool {
  name: string;
  path: string;
  icon: LucideIcon;
  description: string;
}

export const tools: Tool[] = [
  { name: "Home", path: "/", icon: Home, description: "Return to the main dashboard." },
  { name: "Text Case Converter", path: "/text-case", icon: CaseSensitive, description: "Convert text between different letter cases." },
  { name: "JSON Formatter", path: "/json-formatter", icon: FileJson, description: "Format and validate JSON data." },
  { name: "Color Picker", path: "/color-picker", icon: Palette, description: "Pick colors and get their codes in various formats." },
  { name: "Unit Converter", path: "/unit-converter", icon: Ruler, description: "Convert between different units of measurement." },
  // Add more tools here
];

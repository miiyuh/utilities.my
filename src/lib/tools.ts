// src/lib/tools.ts
import type { LucideIcon } from "lucide-react";
import { 
  CaseSensitive, Palette, Ruler, Home, 
  FileText, QrCode, Timer, Globe, CalendarRange, FileArchive, Baseline, ArrowDownUp, Camera, Disc3
} from "lucide-react";

export interface Tool {
  name: string;
  path: string;
  icon: LucideIcon;
  description: string;
}

export const tools: Tool[] = [
  { name: "Home", path: "/", icon: Home, description: "Return to the main dashboard." },
  { name: "Text Case Converter", path: "/text-case", icon: CaseSensitive, description: "Convert text between different letter cases." },
  { name: "Color Picker", path: "/color-picker", icon: Palette, description: "Pick colors and get their codes in various formats." },
  { name: "Unit Converter", path: "/unit-converter", icon: Ruler, description: "Convert between different units of measurement." },
  { name: "Markdown Previewer", path: "/markdown-previewer", icon: FileText, description: "Write Markdown and see a live preview." },
  { name: "QR Code Generator", path: "/qr-code-generator", icon: QrCode, description: "Generate QR codes from text or URLs." },
  { name: "Unix Timestamp Converter", path: "/unix-timestamp-converter", icon: Timer, description: "Convert Unix timestamps to human-readable dates and vice-versa." },
  { name: "Timezone Converter", path: "/timezone-converter", icon: Globe, description: "Convert times between different timezones." },
  { name: "Date Difference Calculator", path: "/date-diff-calculator", icon: CalendarRange, description: "Calculate the difference between two dates." },
  { name: "File Compressor (ZIP)", path: "/file-compressor", icon: FileArchive, description: "Compress multiple files into a single ZIP archive." },
  { name: "Text Statistics", path: "/text-statistics", icon: Baseline, description: "Analyze text for word count, character count, and more." },
  { name: "Sorter", path: "/sorter", icon: ArrowDownUp, description: "Sort lines of text alphabetically or numerically." },
  { name: "Image to ASCII", path: "/image-to-ascii", icon: Camera, description: "Convert images into ASCII art representations." },
  { name: "Spin the Wheel", path: "/spin-the-wheel", icon: Disc3, description: "A fun utility to pick a random item from a list." },
];

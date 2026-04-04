// src/lib/tools.ts
import type { Icon } from "phosphor-react";
import { 
  TextAa, Palette, Ruler, House, 
  Article, QrCode, Timer, Globe, Calendar, TextAa as Baseline2, SortAscending, Disc, Activity, Image, Lightning, Clock, Percent
} from "phosphor-react";

export interface Tool {
  name: string;
  path: string;
  icon: Icon;
  description: string;
}

export const tools: Tool[] = [
  { name: "Home", path: "/", icon: House, description: "Return to the main dashboard." },
  { name: "Text Case Converter", path: "/text-case", icon: TextAa, description: "Convert text between different letter cases." },
  { name: "Colour Picker", path: "/color-picker", icon: Palette, description: "Pick colors and get their codes in various formats." },
  { name: "Unit Converter", path: "/unit-converter", icon: Ruler, description: "Convert between different units of measurement." },
  { name: "BMI Calculator", path: "/bmi-calculator", icon: Activity, description: "Calculate Body Mass Index with metric or imperial units." },
  { name: "Image Converter", path: "/image-converter", icon: Image, description: "Convert images between formats and resize them." },
  { name: "Markdown Previewer", path: "/markdown-previewer", icon: Article, description: "Write Markdown and see a live preview." },
  { name: "QR Code Generator", path: "/qr-code-generator", icon: QrCode, description: "Generate QR codes from text or URLs." },
  { name: "Unix Timestamp Converter", path: "/unix-timestamp-converter", icon: Timer, description: "Convert Unix timestamps to human-readable dates and vice-versa." },
  { name: "Timezone Converter", path: "/timezone-converter", icon: Globe, description: "Compare times across multiple timezones with a visual timeline." },
  { name: "World Clock", path: "/world-clock", icon: Clock, description: "View current time in all major cities and timezones around the world." },
  { name: "Date Difference Calculator", path: "/date-diff-calculator", icon: Calendar, description: "Calculate the difference between two dates." },
  { name: "Text Statistics", path: "/text-statistics", icon: Baseline2, description: "Analyze text for word count, character count, and more." },
  { name: "Sorter", path: "/sorter", icon: SortAscending, description: "Sort lines of text alphabetically or numerically." },
  { name: "Spin the Wheel", path: "/spin-the-wheel", icon: Disc, description: "A fun utility to pick a random item from a list." },
  { name: "Morse Code Generator", path: "/morse-code-generator", icon: Lightning, description: "Convert text to Morse code and vice versa with audio, visual, and vibration playback." },
  { name: "Percentage Calculator", path: "/percentage-calculator", icon: Percent, description: "Calculate percentages, percentage changes, and percentage increases/decreases." },
  { name: "Foot Size Converter", path: "/foot-size-converter", icon: Ruler, description: "Convert shoe sizes between US, UK, EU, and CM measurements." },
];
// src/lib/tools.ts
import type { Icon } from "phosphor-react";
import {
  PersonSimpleWalk, TextAa, Palette, Ruler, House,
  Article, QrCode, Timer, Globe, Calendar, ChartBar, SortAscending, Disc, Activity, Image, Lightning, Clock, Percent, IdentificationCard, AppWindow
} from "phosphor-react";

export interface Tool {
  name: string;
  path: string;
  icon: Icon;
  description: string;
}

export const tools: Tool[] = [
  { name: "Home", path: "/", icon: House, description: "Return to the main dashboard." },
  { name: "Text Case Converter", path: "/text-case", icon: TextAa, description: "See your text in every case at once, then copy the one you need." },
  { name: "Colour Picker", path: "/colour-picker", icon: Palette, description: "Pick any colour and grab its HEX, RGB, HSL or OKLCH code." },
  { name: "Unit Converter", path: "/unit-converter", icon: Ruler, description: "Metres, miles, kilos, pounds: sorted." },
  { name: "BMI Calculator", path: "/bmi-calculator", icon: Activity, description: "See where your height and weight land on the BMI scale." },
  { name: "Image Converter", path: "/image-converter", icon: Image, description: "Change a picture's format or size, and see how much space you save." },
  { name: "Markdown Previewer", path: "/markdown-previewer", icon: Article, description: "Write Markdown and watch it take shape as you type." },
  { name: "QR Code Generator", path: "/qr-code-generator", icon: QrCode, description: "Turn any link into a QR code in seconds." },
  { name: "Unix Timestamp Converter", path: "/unix-timestamp-converter", icon: Timer, description: "Turn those long epoch numbers into real dates, and back again." },
  { name: "Timezone Converter", path: "/timezone-converter", icon: Globe, description: "Find a time that works for everyone, wherever they are." },
  { name: "World Clock", path: "/world-clock", icon: Clock, description: "Spin the globe and see what time it is anywhere." },
  { name: "Date Difference Calculator", path: "/date-diff-calculator", icon: Calendar, description: "Count the days (or hours, or years) between two dates." },
  { name: "Text Statistics", path: "/text-statistics", icon: ChartBar, description: "Count words and reading time, and check your post will fit." },
  { name: "Sorter", path: "/sorter", icon: SortAscending, description: "Sort, tidy or split any list, and undo any step." },
  { name: "Spin the Wheel", path: "/spin-the-wheel", icon: Disc, description: "Can't decide? Let the wheel pick for you." },
  { name: "Morse Code Generator", path: "/morse-code-generator", icon: Lightning, description: "Turn messages into dots and dashes, with sound and light." },
  { name: "Percentage Calculator", path: "/percentage-calculator", icon: Percent, description: "Discounts, tips and changes in percent, worked out for you." },
  { name: "Foot Size Converter", path: "/foot-size-converter", icon: PersonSimpleWalk, description: "Find your shoe size from a size you know or your foot length." },
  { name: "Favicon Generator", path: "/favicon-generator", icon: AppWindow, description: "Turn a letter, emoji or image into every icon your site needs." },
  { name: "Palang IC", path: "/palang-ic", icon: IdentificationCard, description: "Make sure your IC copy can't be used for anything else." },
];
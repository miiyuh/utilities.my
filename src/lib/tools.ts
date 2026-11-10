// src/lib/tools.ts
import type { Icon } from '@phosphor-icons/react';
import {
  PersonSimpleWalk, TextAa, Palette, Ruler, House,
  Article, QrCode, Timer, Globe, Calendar, ChartBar, SortAscending, Disc, Pulse, Image, Lightning, Clock, Percent, IdentificationCard, AppWindow
} from '@phosphor-icons/react';
import type { FileTyped } from './file-types';

export interface Tool extends FileTyped {
  name: string;
  path: string;
  icon: Icon;
  description: string;
  /** Extra words people might type for it in search: synonyms, units, use cases. */
  keywords?: string[];
}

/** Pictures every browser can open. */
const PHOTOS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"];

export const tools: Tool[] = [
  { name: "Home", path: "/", icon: House, description: "Return to the main dashboard." },
  {
    name: "Text Case Converter", path: "/text-case", icon: TextAa,
    description: "See your text in every case at once, then copy the one you need.",
    keywords: ["uppercase", "lowercase", "title", "camel", "snake", "kebab", "capitalise"],
    accepts: [".txt"],
    receivesFiles: true,
  },
  {
    name: "Colour Picker", path: "/colour-picker", icon: Palette,
    description: "Pick any colour and grab its HEX, RGB, HSL or OKLCH code.",
    keywords: ["color", "hex", "rgb", "hsl", "oklch", "cmyk", "eyedropper", "palette", "contrast"],
    accepts: [...PHOTOS, ".bmp", ".svg"],
    receivesFiles: true,
  },
  {
    name: "Unit Converter", path: "/unit-converter", icon: Ruler,
    description: "Metres, miles, kilos, pounds: sorted.",
    keywords: ["length", "weight", "temperature", "celsius", "fahrenheit", "km", "miles", "kg", "pounds"],
  },
  {
    name: "BMI Calculator", path: "/bmi-calculator", icon: Pulse,
    description: "See where your height and weight land on the BMI scale.",
    keywords: ["body mass", "weight", "height", "health"],
  },
  {
    name: "Image Converter", path: "/image-converter", icon: Image,
    description: "Change a picture's format or size, and see how much space you save.",
    keywords: ["png", "jpg", "jpeg", "webp", "avif", "jxl", "jpegxl", "gif", "bmp", "tiff", "tif", "ico", "icon", "resize", "compress", "crop", "exif"],
    accepts: [...PHOTOS, ".jxl", ".bmp", ".ico", ".tif", ".tiff"],
    produces: [".png", ".jpg", ".jpeg", ".webp", ".avif", ".jxl", ".gif", ".bmp", ".tif", ".tiff", ".ico", ".zip"],
    takesMany: true,
    receivesFiles: true,
  },
  {
    name: "Markdown Previewer", path: "/markdown-previewer", icon: Article,
    description: "Write Markdown and watch it take shape as you type.",
    keywords: ["md", "editor", "html", "preview"],
    accepts: [".md", ".markdown", ".txt"],
    produces: [".md"],
    receivesFiles: true,
  },
  {
    name: "QR Code Generator", path: "/qr-code-generator", icon: QrCode,
    description: "Turn any link into a QR code in seconds.",
    keywords: ["qr", "barcode", "link", "wifi", "url"],
    produces: [".png", ".svg"],
  },
  {
    name: "Unix Timestamp Converter", path: "/unix-timestamp-converter", icon: Timer,
    description: "Turn those long epoch numbers into real dates, and back again.",
    keywords: ["epoch", "unix", "timestamp", "seconds", "milliseconds"],
  },
  {
    name: "Timezone Converter", path: "/timezone-converter", icon: Globe,
    description: "Find a time that works for everyone, wherever they are.",
    keywords: ["time zone", "meeting", "gmt", "utc", "schedule"],
  },
  {
    name: "World Clock", path: "/world-clock", icon: Clock,
    description: "Spin the globe and see what time it is anywhere.",
    keywords: ["globe", "map", "time", "cities", "day night"],
  },
  {
    name: "Date Difference Calculator", path: "/date-diff-calculator", icon: Calendar,
    description: "Count the days (or hours, or years) between two dates.",
    keywords: ["days between", "age", "countdown", "duration"],
  },
  {
    name: "Text Statistics", path: "/text-statistics", icon: ChartBar,
    description: "Count words and reading time, and check your post will fit.",
    keywords: ["word count", "character count", "reading time"],
    accepts: [".txt", ".md"],
    receivesFiles: true,
  },
  {
    name: "Sorter", path: "/sorter", icon: SortAscending,
    description: "Sort, tidy or split any list, and undo any step.",
    keywords: ["sort", "alphabetical", "shuffle", "dedupe", "list"],
    accepts: [".txt", ".csv"],
    produces: [".txt"],
    receivesFiles: true,
  },
  {
    name: "Spin the Wheel", path: "/spin-the-wheel", icon: Disc,
    description: "Can't decide? Let the wheel pick for you.",
    keywords: ["random", "picker", "decide", "raffle", "roulette"],
    accepts: [".txt", ".csv", ".tsv"],
    produces: [".txt", ".csv"],
    receivesFiles: true,
  },
  {
    name: "Morse Code Generator", path: "/morse-code-generator", icon: Lightning,
    description: "Turn messages into dots and dashes, with sound and light.",
    keywords: ["morse", "sos", "dots", "dashes", "translate"],
    accepts: [".txt"],
    produces: [".txt"],
    receivesFiles: true,
  },
  {
    name: "Percentage Calculator", path: "/percentage-calculator", icon: Percent,
    description: "Discounts, tips and changes in percent, worked out for you.",
    keywords: ["percent", "discount", "tip", "increase", "decrease"],
  },
  {
    name: "Foot Size Converter", path: "/foot-size-converter", icon: PersonSimpleWalk,
    description: "Find your shoe size from a size you know or your foot length.",
    keywords: ["shoe", "size", "us", "uk", "eu"],
  },
  {
    name: "Favicon Generator", path: "/favicon-generator", icon: AppWindow,
    description: "Turn a letter, emoji or image into every icon your site needs.",
    keywords: ["favicon", "icon", "ico", "apple touch", "manifest", "pwa"],
    accepts: [...PHOTOS, ".svg"],
    produces: [".ico", ".png", ".svg", ".webmanifest", ".zip"],
    receivesFiles: true,
  },
  {
    name: "Palang IC", path: "/palang-ic", icon: IdentificationCard,
    description: "Make sure your IC copy can't be used for anything else.",
    keywords: ["mykad", "ic", "watermark", "identity card", "pdf"],
    accepts: [".png", ".jpg", ".jpeg", ".webp"],
    receivesFiles: true,
    // No `produces`: its PDF and PNG are a stamped IC copy, not a converted file,
    // so it shouldn't answer searches like "jpg to pdf".
  },
];

/** The file types a tool opens, for its own file picker and checks. */
export function toolAccepts(path: string): string[] {
  return tools.find((t) => t.path === path)?.accepts ?? [];
}

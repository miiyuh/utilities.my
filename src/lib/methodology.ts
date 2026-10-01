// How each tool computes its results, with the constants the code actually
// uses and the references they come from. Rendered on the About page; keep it
// in sync when a tool's maths changes.

export interface MethodSource {
  label: string;
  url: string;
}

export interface Method {
  /** Tool path from `tools` in src/lib/tools.ts. */
  path: string;
  summary: string;
  formulas?: string[];
  notes?: string[];
  sources: MethodSource[];
}

export const METHODOLOGY: Method[] = [
  {
    path: '/bmi-calculator',
    summary:
      'Body Mass Index relates weight to height squared. Imperial inputs are converted to metric with exact factors before the same formula is applied.',
    formulas: [
      'BMI = weight (kg) ÷ height (m)²',
      'BMI = 703 × weight (lb) ÷ height (in)²',
      'Healthy weight range = 18.5 × h² to (overweight cut-off − 0.1) × h² (kg)',
      'BMI Prime = BMI ÷ overweight cut-off (25 WHO, 23 Asian)',
      '1 in = 0.0254 m · 1 lb = 0.45359237 kg',
    ],
    notes: [
      'You can choose between two sets of cut-offs. WHO (international): under 18.5 underweight, 18.5–24.9 healthy, 25–29.9 overweight, 30 and above obesity.',
      'Asian: under 18.5 underweight, 18.5–22.9 healthy, 23–27.4 overweight, 27.5 and above obesity. These lower points come from a WHO expert consultation for Asian populations, and Malaysian clinical guidelines adopt them.',
      'BMI is a screening measure. It does not distinguish fat from muscle and is not a diagnosis.',
    ],
    sources: [
      { label: 'WHO: Body mass index', url: 'https://www.who.int/data/gho/data/themes/topics/topic-details/GHO/body-mass-index' },
      { label: 'CDC: Adult BMI categories', url: 'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html' },
      { label: 'WHO Expert Consultation (2004), BMI for Asian populations, The Lancet', url: 'https://doi.org/10.1016/S0140-6736(03)15268-3' },
    ],
  },
  {
    path: '/unit-converter',
    summary:
      'Every linear unit is stored as a factor relative to one base unit (metre, kilogram, litre, square metre, metre per second, pascal, joule, second, byte, bit per second). A value is multiplied into the base unit and divided out into the target, so any pair converts consistently.',
    formulas: [
      'result = value × factor(from) ÷ factor(to)',
      '1 yd = 0.9144 m · 1 mi = 1609.344 m · 1 lb = 0.45359237 kg',
      '1 US gal = 3.785411784 L · 1 UK gal = 4.54609 L · 1 acre = 4046.8564224 m² · 1 knot = 1852 m/h',
      '1 psi = 6894.757 Pa · 1 bar = 100 kPa · 1 atm = 101.325 kPa',
      '1 kcal = 4.184 kJ · 1 kWh = 3,600 kJ',
      'K = °C + 273.15 · °F = (K − 273.15) × 9/5 + 32',
      'L/100 km = 100 ÷ (km/L) · km/L = mpg × 1.609344 ÷ gallon in litres',
    ],
    notes: [
      'Imperial and US customary factors are the exact values defined by the 1959 international yard and pound agreement.',
      'Temperature is not a simple ratio, so it converts through kelvin with an offset. Fuel economy in litres per 100 km is the inverse of kilometres per litre.',
      'Kilocalories use the 4.184 kJ calorie printed on food labels. Tablespoons and teaspoons are metric (15 mL and 5 mL).',
      'Storage has both decimal units (1 GB = 1,000,000,000 bytes, as drive makers count) and binary ones (1 GiB = 1,073,741,824 bytes, as many computers report).',
      'A small non-zero answer is never rounded down to 0: below the chosen decimal places it keeps three significant figures.',
    ],
    sources: [
      { label: 'NIST Special Publication 811, Guide for the Use of the SI', url: 'https://www.nist.gov/pml/special-publication-811' },
      { label: 'BIPM: The International System of Units (SI Brochure)', url: 'https://www.bipm.org/en/publications/si-brochure' },
    ],
  },
  {
    path: '/foot-size-converter',
    summary:
      'A lookup table of equivalent sizes across UK, EU, US and foot length in centimetres, with separate tables for men, women and kids.',
    notes: [
      'From a foot length, the result is the smallest size that fits at least that length, since a shoe shorter than your foot won\'t fit.',
      'Shoe size systems are not defined by one exact formula, and brands differ by half a size or more. Treat the result as a starting point.',
      'Foot length in centimetres (the basis of the Mondopoint system) is the most reliable number to compare.',
    ],
    sources: [
      { label: 'ISO 9407:2019, Footwear sizing: Mondopoint system', url: 'https://www.iso.org/standard/71594.html' },
    ],
  },
  {
    path: '/percentage-calculator',
    summary: 'Standard percentage arithmetic, computed with full precision and rounded to two decimal places for display.',
    formulas: [
      'X% of Y = X ÷ 100 × Y',
      'X is what % of Y = X ÷ Y × 100',
      '% change = (new − original) ÷ original × 100',
      'increase / decrease = value ± value × p ÷ 100',
    ],
    sources: [],
  },
  {
    path: '/date-diff-calculator',
    summary:
      'Differences are calendar-aware: months and years follow real month lengths and leap years rather than assuming 30 or 365 days. Each unit counts whole periods only (partial units are truncated).',
    notes: ['Calculations run in your local time zone, so a span that crosses a daylight-saving change reflects the real elapsed hours.'],
    sources: [{ label: 'date-fns: differenceInMonths and related functions', url: 'https://date-fns.org/docs/differenceInMonths' }],
  },
  {
    path: '/unix-timestamp-converter',
    summary:
      'A Unix timestamp counts seconds (or milliseconds) since 1970-01-01 00:00:00 UTC. Conversions use your browser\'s clock and time zone for the local view, and UTC for the ISO view.',
    formulas: ['date = 1970-01-01T00:00:00Z + timestamp seconds'],
    notes: ['As defined by POSIX, leap seconds are not counted, so every day is exactly 86,400 seconds.'],
    sources: [
      { label: 'POSIX (IEEE Std 1003.1): Seconds Since the Epoch', url: 'https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap04.html' },
    ],
  },
  {
    path: '/timezone-converter',
    summary:
      'UTC offsets and daylight-saving rules come from the IANA time zone database built into your browser, read through dayjs\' timezone plugin.',
    notes: ['Because the rules ship with the browser, an outdated browser can be wrong for zones whose rules changed recently.'],
    sources: [
      { label: 'IANA Time Zone Database', url: 'https://www.iana.org/time-zones' },
      { label: 'City list: kevinroberts/city-timezones', url: 'https://github.com/kevinroberts/city-timezones' },
    ],
  },
  {
    path: '/world-clock',
    summary:
      'Times use the same IANA time zone data as the Timezone Converter. The day/night shading is drawn from the sun\'s position, computed for the current moment.',
    formulas: [
      'Sun position: low-precision mean longitude, mean anomaly and obliquity of the ecliptic (accurate to about ±0.3°)',
      'Night = the hemisphere centred on the point opposite the subsolar point',
      'Flat map: Equal Earth projection, which keeps every region at its true relative area',
    ],
    sources: [
      { label: 'IANA Time Zone Database', url: 'https://www.iana.org/time-zones' },
      { label: 'NOAA Solar Calculator', url: 'https://gml.noaa.gov/grad/solcalc/' },
      { label: 'Šavrič, Patterson & Jenny (2018), The Equal Earth map projection', url: 'https://doi.org/10.1080/13658816.2018.1504949' },
    ],
  },
  {
    path: '/colour-picker',
    summary:
      'Colours are handled as 8-bit sRGB. Other formats are derived from the RGB value, and contrast is checked against WCAG.',
    formulas: [
      'HSL / HSV: standard RGB cylindrical transforms',
      'CMYK: K = 1 − max(R, G, B); C = (1 − R − K) ÷ (1 − K), and likewise for M and Y',
      'OKLCH: sRGB → linear light → Oklab (Ottosson matrices) → lightness, chroma, hue',
      'Contrast = (L₁ + 0.05) ÷ (L₂ + 0.05), using WCAG relative luminance',
    ],
    notes: [
      'CMYK here is a device-independent approximation with no ICC profile, so printed colour will differ.',
      'WCAG AA needs a contrast of 4.5 : 1 for normal text, and AAA needs 7 : 1.',
    ],
    sources: [
      { label: 'IEC 61966-2-1: sRGB colour space', url: 'https://webstore.iec.ch/en/publication/6169' },
      { label: 'Björn Ottosson: A perceptual color space for image processing (Oklab)', url: 'https://bottosson.github.io/posts/oklab/' },
      { label: 'W3C CSS Color Module Level 4', url: 'https://www.w3.org/TR/css-color-4/' },
      { label: 'W3C WCAG 2.2: contrast ratio', url: 'https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio' },
    ],
  },
  {
    path: '/qr-code-generator',
    summary:
      'Codes are encoded with the open-source qrcode.react library. Error-correction level L, M, Q or H lets a code stay readable with roughly 7%, 15%, 25% or 30% of it damaged or covered.',
    notes: ['Keep a quiet zone (blank margin) around the code. Scanners rely on it to find the symbol.'],
    sources: [
      { label: 'ISO/IEC 18004:2024, QR code symbology', url: 'https://www.iso.org/standard/83389.html' },
      { label: 'qrcode.react', url: 'https://github.com/zpao/qrcode.react' },
    ],
  },
  {
    path: '/text-statistics',
    summary:
      'A word is a run of letters or digits in any script, so Malay, accented and non-Latin text count properly. Sentences end at . ! ? or …, or at a blank line. Reading and speaking times are estimates based on average rates.',
    formulas: [
      'Reading time = words ÷ 200 per minute',
      'Speaking time = words ÷ 130 per minute',
      'Reading ease = 206.835 − 1.015 × (words ÷ sentences) − 84.6 × (syllables ÷ words)',
    ],
    notes: [
      '200 wpm is a deliberately conservative silent-reading rate; studies put the adult average around 238 wpm for non-fiction.',
      'The reading ease score is designed for English and uses an approximate syllable count. It needs at least 30 words.',
      'Length limits are counted as plain characters. Some platforms count links or emoji differently, and they change their limits from time to time.',
      'Leaving everyday words out of the top words list affects only that list, never the word count.',
    ],
    sources: [
      { label: 'Brysbaert (2019), How many words do we read per minute?', url: 'https://doi.org/10.1016/j.jml.2019.104047' },
      { label: 'Flesch (1948), A new readability yardstick', url: 'https://doi.org/10.1037/h0057532' },
    ],
  },
  {
    path: '/morse-code-generator',
    summary: 'Uses the International Morse Code alphabet and standard timing, all expressed in multiples of one dot.',
    formulas: [
      'dot = 1 unit · dash = 3 units',
      'gap within a letter = 1 · between letters = 3 · between words = 7',
      '1 unit = 50 ms at 1× speed (about 24 words per minute)',
    ],
    sources: [{ label: 'ITU-R M.1677-1: International Morse code', url: 'https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en' }],
  },
  {
    path: '/spin-the-wheel',
    summary:
      'The winner is picked first, with every option equally likely, and the wheel then spins to land on it. Shuffle uses the unbiased Fisher–Yates algorithm.',
    notes: [
      'Randomness comes from your browser\'s secure generator, crypto.getRandomValues(), with rejection sampling so no option is favoured. It is fair enough for real draws, but nothing is recorded, so for an official draw use a process others can witness or audit.',
    ],
    sources: [
      { label: 'MDN: Crypto.getRandomValues()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues' },
      { label: 'Fisher–Yates shuffle', url: 'https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle' },
    ],
  },
  {
    path: '/sorter',
    summary:
      'Text sorting uses your browser\'s locale-aware comparison. With numbers in order on, runs of digits compare as numbers, so "item 2" comes before "item 10". Shuffle uses Fisher–Yates with your browser\'s secure random generator.',
    notes: [
      'Sorting by number uses the first number on each line, ignoring thousands separators, so "RM 1,250" sorts as 1250. Lines without a number go last.',
      'Removing duplicates keeps the first copy of each line and ignores capitals unless Match capitals is on.',
      'Every change is kept so it can be undone, up to the last 50.',
    ],
    sources: [
      { label: 'MDN: Intl.Collator', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator' },
      { label: 'MDN: Crypto.getRandomValues()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues' },
    ],
  },
  {
    path: '/image-converter',
    summary:
      "Images are decoded, edited (crop, rotate, flip) and re-encoded on a canvas in your browser, with high-quality smoothing when resizing. The preview is encoded with the exact settings of the download, so the file size shown is the size you get. Nothing is uploaded.",
    formulas: [
      'Aim for a file size: binary search over quality (7 steps; 5 for AVIF) for the highest quality that fits',
      'Passport preset: 35 × 45 mm at 300 dpi = 413 × 531 px',
      'Batch sizes: long edge = min(original, chosen limit); images are never enlarged',
    ],
    notes: [
      'Re-encoding writes only pixels, so metadata (camera, date, location) is removed by default. You can choose to keep it when converting JPEG to JPEG; keeping it without location deletes the GPS data and zeroes its bytes.',
      'Browsers cannot save AVIF from a canvas yet, so AVIF uses a WebAssembly encoder that downloads only when you choose AVIF.',
    ],
    sources: [
      { label: 'WHATWG HTML: canvas toBlob()', url: 'https://html.spec.whatwg.org/multipage/canvas.html#dom-canvas-toblob' },
      { label: 'CIPA DC-008: Exif 2.32 specification', url: 'https://www.cipa.jp/std/documents/download_e.html?DC-008-Translation-2023-E' },
      { label: 'exifr (metadata reader)', url: 'https://github.com/MikeKovarik/exifr' },
      { label: 'jSquash AVIF encoder (libavif via WebAssembly)', url: 'https://github.com/jamsinclair/jSquash' },
    ],
  },
  {
    path: '/favicon-generator',
    summary:
      'Every icon is drawn on a canvas from the same design, so all sizes match. Text is sized from the real ink box of its letters, so they sit optically centred.',
    formulas: [
      'favicon.ico = PNG images at 16, 32 and 48 px inside an ICO container',
      'Maskable icon: content kept inside the central 80% (the safe zone Android may crop to a circle or squircle)',
      'Apple touch icon: 180 × 180 px with an opaque background (iOS turns transparency black and rounds the corners itself)',
    ],
    notes: ['Text and emoji designs also get a scalable favicon.svg, which modern browsers prefer when it is listed.'],
    sources: [
      { label: 'MDN: Web app manifest icons and maskable purpose', url: 'https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons' },
      { label: 'web.dev: Adaptive icon support with maskable icons', url: 'https://web.dev/articles/maskable-icon' },
      { label: 'Apple: Configuring web applications (touch icons)', url: 'https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html' },
    ],
  },
  {
    path: '/palang-ic',
    summary:
      'Everything happens on your device. Each side is cropped, watermarked and placed on an A4 PDF at true ID-1 card size, so printed copies match the real card.',
    formulas: ['Card size = 85.6 × 54 mm (ISO/IEC 7810 ID-1)'],
    sources: [
      { label: 'ISO/IEC 7810:2019, Identification cards: physical characteristics', url: 'https://www.iso.org/standard/70483.html' },
      { label: 'MKN: Kad pengenalan, tips penjagaan dan palang salinan', url: 'https://www.mkn.gov.my/web/ms/2022/08/14/kad-pengenalan-tips-penjagaan-dan-palang-salinan/' },
    ],
  },
  {
    path: '/markdown-previewer',
    summary: 'Markdown is rendered with the marked parser, using GitHub Flavored Markdown (tables, task lists, strikethrough) with line breaks preserved.',
    sources: [
      { label: 'marked', url: 'https://marked.js.org/' },
      { label: 'GitHub Flavored Markdown spec', url: 'https://github.github.com/gfm/' },
    ],
  },
  {
    path: '/text-case',
    summary: 'Case changes use your browser\'s Unicode-aware upper- and lower-casing, so accented and non-Latin letters convert correctly. Title and sentence case are built from those rules.',
    notes: [
      'Smart title case keeps short joining words lowercase in the middle of a line: English ones like "and" and "of", Malay ones like "dan" and "untuk", and the parts of Malaysian names such as "bin", "binti", "a/l" and "a/p".',
      'Keep acronyms leaves words that already have capitals inside them (IC, KL, iPhone) as written. It switches itself off when most of the text is in capitals, since that is shouting rather than acronyms.',
      'Code-style cases (camelCase, snake_case and the rest) convert each line separately, so a list of names becomes a list of identifiers.',
    ],
    sources: [],
  },
];

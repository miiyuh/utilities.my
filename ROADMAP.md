# Roadmap

What's next for utilities.my. Nothing here is promised or dated; it's a shared list so ideas don't get lost. Planned items have been agreed; ideas still need a decision.

## Planned

### Files, hand-offs and offline

Changes across the whole site, so tools work together instead of one at a time. Each step can ship on its own, but the order matters: the early steps build what the later ones need.

**1. Describe what each tool takes and makes** ✅ done

- Each tool in `src/lib/tools.ts` lists the file types it opens and saves, and its search keywords, which used to live in `command-palette.tsx`.
- Search reads "webp to jpg", "png to ico" and ".md" and finds the tools that can do it. A test checks that every listed type is real.

**2. One way to bring files in** ✅ done

- A shared hook (`useFileIntake`) for choosing, dropping and pasting files, with the same messages for HEIC photos, wrong types and files over 50 MB.
- Image Converter, Favicon Generator and Palang IC use it. Favicon Generator can now take a dropped image, and Palang IC a pasted one, which goes into the first empty side.

**3. Drop a file anywhere** ✅ done

- Drop or paste a file on the home page, or into search, and search lists the tools that can open it. HEIC photos and files no tool opens get a plain message.
- Picking one opens the tool with the file already loaded. The file is handed over in memory, so nothing is stored or uploaded. Several images open in Image Converter's batch tab.
- On every other page, a file dropped outside a drop area is caught, so the browser no longer leaves the site to show it.

**4. Send work from one tool to the next** ✅ done

- Image Converter's result has a "Send to" row for the tools that can open the format chosen: Favicon Generator, Palang IC and Colour Picker. Files go through the same in-memory hand-off as step 3.
- QR Code Generator reads `?fg=`, `?bg=`, `?url=` and `?text=` from its link, and Colour Picker has a "Send to: QR code colour" button that uses it.
- Every tool that opens files now uses the shared intake and picks up handed-over files: the image tools, Colour Picker, Text Case, Text Statistics, Sorter, Spin the Wheel, Morse and Markdown. A test checks that the tool list matches the code.
- Later: Contrast Checker once it exists, and deciding tool by tool which other settings belong in the link. That also answers the Size Visualiser's question about shareable links.

**5. Work offline** ✅ done

- A service worker (`scripts/sw-template.js`, written to `dist/sw.js` by `scripts/build-sw.ts`) stores every page, the app's code, the fonts, icons and data on the first visit: about 4 MB. The AVIF and JPEG XL encoders and the World Clock's city time zone list are stored the first time they're used.
- Pages come from the network when it answers within 3 seconds, and from storage otherwise. Hashed files always come from storage.
- A new version shows a notice with a Reload button instead of swapping in mid-task; if it's ignored, the update applies on the next visit. `sw.js` is never cached by Vercel.
- Still to check by hand: after one visit, every tool opens in airplane mode, and a new deploy shows the notice.

**6. What's new** ✅ done

- A "What's new" button in the header opens a short list of changes in plain words, with a dot until the newest one has been opened. It never opens by itself.
- Written by hand in `src/lib/whats-new.ts`, newest first, because `CHANGELOG.md` is generated from commit messages and reads like them. Add an entry there with each release people would notice.

**Open questions**

- Should step 3's "Open with" list also appear when a file is dropped outside a tool's drop area? For now the drop is only caught there, so the browser doesn't leave the site.

### Design guide and tool checks

So new tools look and behave like the old ones, and a change to one tool can't quietly break another.

- **`DESIGN.md`**: the design language as it is now: colour and type tokens, spacing, motion tokens, `PageHeader` and `PageIntro`, how controls and results are laid out, mobile behaviour, and a checklist every tool must pass (both themes, phone width, keyboard only, empty, loading and error states, copy that follows the writing style)
- **Tool checks**: a short script per tool that opens it in a headless browser, does its main job with a sample file or input (convert an image, make a QR code, convert 10 km) and fails on console errors or a wrong result. Run them all in CI next to the unit tests.

**Open questions**

- Playwright adds a browser download to CI. Run the checks on every pull request, or only before a release?

### UI and usability

Ideas from how delphitools' tools work, not how they look: delphitools is square and dense, and utilities.my keeps its own look and themes. Each item names the tools it would change first. Most of it goes into `DESIGN.md` too, so new tools start this way.

**Controls**

- **Segmented buttons instead of dropdowns** for short choices (up to about five options), so every option is visible and one tap away. A new shared component, then: QR payload type, error correction and file type; BMI and Foot Size units; Palang IC's simpler options. Long lists such as Image Converter's nine formats stay as dropdowns.
- **Quick styles**: a row of ready-made looks to start from. QR Code Generator (classic, rounded, dots, inverted, branded) and Favicon Generator (shapes and colour pairs). Image Converter already has presets.
- **Show the password**: an eye button on the Wi-Fi password field in QR Code Generator, so a typo doesn't make a code that won't connect.

**Results and actions**

- **One action bar per tool**: the file name on the left and the main action (Download, Copy) on the right. On a computer it sits above the result. On phones it sticks to the bottom of the screen, where a thumb reaches it, and it replaces the buttons at the end of the page instead of repeating them: one button in one place, and screen readers don't announce it twice. Start with QR Code Generator, Favicon Generator, Image Converter and Palang IC.
- **Undo and redo for settings** with Ctrl/⌘ Z and Ctrl/⌘ Shift Z (or Y). Changes made close together, such as dragging a slider, count as one step. The text tools already have undo; this adds it to QR Code Generator, Favicon Generator, Image Converter and Palang IC.
- **Many at once**: QR Code Generator makes one code per line of a list and downloads them as a ZIP, as Image Converter already does for images. The Barcode Generator gets the same from the start.
- **A loupe**: hold or click on Image Converter's preview to see the pixels up close, to judge quality before downloading. It sits beside the existing before/after slider.

**Remembering and protecting work**

- **Remember settings between visits, in every tool**, so you never have to guess which tools remember. Only lasting choices are kept: QR colours, size and margin; image format and quality; the last units; favicon shape and colours; Sorter options. What belongs to one job is not kept: the text or link, the number typed, the picture, its crop and rotation. That also keeps the promise that nothing you enter is stored. Tools that forget everything now come first: QR Code Generator, Favicon Generator, Image Converter, Text Case Converter, Sorter and Morse Code Generator.
- **Reset to defaults**: a button in each tool, and a "Reset all tools" button in Settings.
- **Ask before leaving** when work would be lost: a batch still converting in Image Converter, an unsaved Palang IC stamp, a long Markdown draft.

**Layout**

- **Wide mode** for tools that need room (Image Converter, Markdown Previewer, Text Compare): a button that lets the tool use the full screen width, remembered per tool.

### Text Compare

Paste two texts or lists and see what changed. Replaces the planned "Sorter: compare two lists", which fits better here: comparing is a different job from sorting, and both modes share the same two input boxes.

**Core**

- **Text mode**: changes highlighted line by line, and word by word inside changed lines. Side by side on wide screens, one column on phones. Options to ignore case, extra spaces and blank lines. A count of lines added, removed and changed, and a button to jump to the next change.
- **List mode**: one item per line, shown as three lists you can copy: only in the first, only in the second, and in both. Options to ignore case and spaces and to sort the results. For guest lists, inventories and email lists ("who hasn't replied?").
- Drop or paste a text file into either side.
- Sorter gets a link to List mode for people who look for it there.

**Open questions**

- Word by word for long texts can be slow. Limit it, or do the work off the main thread?
- Should a comparison be shareable as a link? Long texts make very long links.

### Paper Sizes

A reference for paper and print sizes, and the start of the Size Visualiser's presets.

**Core**

- ISO A, B and C series, US Letter, Legal and Tabloid, JIS B, envelopes, business cards, and photo prints as Malaysian print shops name them (3R, 4R, 5R and up)
- Every size in mm, cm and inches, and in pixels at a resolution you choose (72, 150, 300 DPI)
- Pick two sizes to see them drawn on top of each other
- The sizes live in one data file that the Size Visualiser reuses

### Size Visualiser

See how big something really is before you buy, print or hang it. Enter its measurements and see it drawn to scale next to familiar things, starting with a person.

**Core**

- Enter width and height (and optionally depth) in cm, mm, inches or feet
- Presets for common things: paper sizes (from Paper Sizes), posters, photo prints, TVs and monitors (by diagonal and aspect ratio), rugs, bed and mattress sizes
- Drawn to scale beside a person of adjustable height, with a 10 cm grid and labelled dimensions
- Several objects side by side for comparison
- Works on phones, with a picture you can save or share

**Open questions**

- Flat things only (posters, screens, rugs), or 3D boxes in perspective too?
- Which reference figures besides a person: a door, a sofa, a credit card, a phone?
- Should people be able to place an object against a photo of their own room? That needs a reference object of known size in the photo to set the scale.
- Should a design be shareable through a link (all settings in the URL, nothing stored)? See step 4 of "Files, hand-offs and offline".

### Password Generator

- Passwords from the browser's secure random generator, with length, character sets and an option to leave out look-alikes (`0` and `O`, `1`, `l` and `I`)
- Passphrases of random words, with a separator, capitals and numbers if a site demands them
- Strength shown as bits of entropy worked out from the settings, with a plain-words guess of how long it would take to crack
- Nothing is stored, and the page says so

**Open questions**

- A Malay word list for passphrases would be a nice touch, but it needs a list we're allowed to use.

### Contrast Checker

- Two colours, typed in any notation the Colour Picker reads, with the WCAG contrast ratio and pass or fail for AA and AAA, normal text, large text and interface parts
- A live preview of text on the background
- When a pair fails, the nearest colour that passes, keeping the hue
- Search answers "#ffffff on #3eaf86" directly, like the other search answers

### PDF Tools

- **Merge** several PDFs and **split** one into pages or ranges
- **Reorder, rotate and delete** pages from thumbnails
- **Page numbers**, with position, size and starting number
- **Images to PDF**, with paper size (from Paper Sizes), margins and orientation
- All with pdf-lib, which is already a dependency

**Open questions**

- One tool with tabs, or one page per job (easier to find in search)?
- Real compression means re-encoding the images inside the PDF, which pdf-lib can't do. That needs a PDF renderer such as PDF.js or MuPDF (several megabytes, loaded only when used). Leave compression out at first?

### Barcode Generator

- Code 128, EAN-13, EAN-8, UPC-A, Code 39 and ITF-14, with the check digit worked out and wrong input explained
- Size, bar height, colours and the number printed underneath on or off
- PNG and SVG download, and many codes at once from a list, as a ZIP
- Data Matrix and PDF417 if the library choice allows it

**Open questions**

- JsBarcode is small but only does 1D codes. bwip-js does everything, including Data Matrix and PDF417, but is much bigger. Load it only on this page?

### Social Image Cropper and Splitter

- Crop to the right size for each platform: Instagram post, portrait and story, Facebook, X, LinkedIn, TikTok, YouTube thumbnail, WhatsApp profile picture
- Split one picture into a grid (3 × 1, 3 × 3) for Instagram profile grids, or into slices for a swipeable carousel
- Reuses the Image Converter's crop and export code

### Watermark

- Text or a logo, in a corner or tiled across the picture, with opacity, size and angle
- Many images at once, downloaded as a ZIP
- Shares the stamping code with Palang IC

### Time Calculator

- Add and subtract times and durations: "9:30 + 7 h 45 min", "how long from 08:15 to 17:40"
- Total a list of durations, for timesheets, with or without breaks
- Answers in hours and minutes and as decimal hours, for invoicing

### Seamless Scroll Generator

- One wide picture (or several placed side by side) cut into Instagram carousel slides, so swiping looks like one continuous image
- Slide size 1:1, 4:5 or 3:4, with a preview you can swipe through
- Download every slide in order, as a ZIP
- Shares the cutting code with the Social Image Cropper and Splitter

### Tailwind Shade Generator

- One colour in, a full 50 to 950 scale out, the way Tailwind's own colours are built
- Copy the scale as Tailwind v4 `@theme` CSS, a v3 config object or plain CSS variables
- Contrast against white and black shown on every shade
- Reuses the Colour Picker's colour reading, and the Colour Picker gets a "Make a scale" link

### Placeholder Generator

- Placeholder images at any size, with colours, text (the size by default) and PNG, JPEG, WebP or SVG output
- Presets for common sizes: social posts, banners, phone screens
- Copy as a data URL or an `<img>` tag, as well as downloading

### Font File Explorer

- Drop in a TTF, OTF, WOFF or WOFF2 file and see its name, designer, licence, version, weights, variable axes and OpenType features
- Every glyph in a grid, with its Unicode name and code
- Type your own text to preview it, at any size and on any variable axis

**Open questions**

- Reading WOFF2 needs a decompressor (a few hundred KB of WebAssembly). Load it only for WOFF2 files?

### PX to REM

- Pixels to rem and back, with the root size you set (16 px by default)
- A table of common sizes to copy from
- Paste a block of CSS and have every `px` value converted
- Search answers "24px to rem" directly

### UUID Generator

- UUID v4 and v7, and Nano IDs, one at a time or in bulk
- Upper or lower case, with or without dashes
- Copy all, or download as a text file
- Paste a UUID to see its version, and the time inside a v7

### Braille Converter

- Text to braille cells and back, as Unicode braille you can copy, with each cell's dot numbers
- Grade 1 (letter by letter) to start; Grade 2 contractions later if needed
- A picture of the cells to save, for signs and printing

**Open questions**

- Malay braille uses the same letters, but numbers and some punctuation differ by standard. Which one to follow, and where to source it?

### NATO Phonetic

- Spells out text letter by letter (Alfa, Bravo, Charlie), for reading out booking codes, IC numbers and email addresses over the phone
- Digits as the standard words, with a large-type view to read from
- Other spelling alphabets, such as German DIN 5009, as options
- Links to the Morse Code Generator, and back

### For existing tools

- **QR Code Generator: more styling**:
  - Dot shapes (square, rounded, dots) and corner styles, with the corner colour separate from the dots
  - Gradient colours
  - A frame with a caption, such as "Scan me"
  - A blank area behind the logo so dots don't run into it
  - More content types: contact card (vCard), calendar event and location
  - A scan check that reads the finished code back and warns when the styling has made it hard to scan
  - qrcode.react can't draw dot shapes, so the code would be drawn as our own SVG from the QR pattern

## Ideas to discuss

Not agreed yet. Each needs a yes or no first.

- **Unit price comparer**: which pack is cheaper per gram, litre or piece, for shoppers comparing sizes

### For existing tools

- **Percentage Calculator: SST**: add or remove Malaysia's Sales and Service Tax at the current rates, with the rate kept up to date in one place
- **Percentage Calculator: stacked discounts**: "20% off, then another 10%" worked out as the real total discount (28%, not 30%)
- **Text Statistics: keyword density**: how often a word or phrase you choose appears, as a count and a share of all words, for writing web pages

## Technical follow-ups

- **marked 13 → 18**: major upgrade for the Markdown Previewer and legal pages; check that marked-footnote still works first
- **semantic-release plugins**: majors available for changelog (7), git (11) and the conventional-commits preset (10); update together and test a release
- **@types/node 26**: wait until the toolchain targets Node 26

## Done recently

- What's new: a header button with the latest changes in plain words
- Works offline after the first visit, with a notice when a new version is ready
- Send to: Image Converter's result goes straight to Favicon Generator or Palang IC, and a colour from Colour Picker to QR Code Generator
- Drop or paste a file on the home page or into search to find the tools that open it
- One way to bring files into Image Converter, Favicon Generator and Palang IC: choose, drop or paste, with the same messages
- Search finds tools by file type ("png to ico", ".md"), from the file types each tool now lists
- Search answers typed values: "10 km to mi", "#1e90ff", a Unix timestamp or "20% of 150" gives an answer to copy, with a link to the tool
- Reworked Text Case Converter, Foot Size Converter, Text Statistics, Sorter, Markdown Previewer, Percentage Calculator and Unit Converter
- Favicon Generator: no-background option and home-screen previews on real wallpapers
- Favicon Generator, with dark-mode variants and the full Unicode emoji set
- Image Converter rebuild: crop/rotate/flip, metadata viewer with privacy controls, AVIF, JPEG XL (output and input, with lossless mode), GIF, BMP, TIFF and ICO output, target file size, presets, before/after comparison
- Command palette (Ctrl/⌘ K) and keyboard shortcuts
- Icons moved to `@phosphor-icons/react`, and lucide removed
- Spin the Wheel rebuilt as SVG; Morse alphabet reference
- "How this works" methodology for every tool
- Pandan & Kopi theme

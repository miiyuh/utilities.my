# Roadmap

What's next for utilities.my. Nothing here is promised or dated; it's a shared list so ideas don't get lost. Planned items have been agreed; ideas still need a decision.

## Planned

### Size Visualiser

See how big something really is before you buy, print or hang it. Enter its measurements and see it drawn to scale next to familiar things, starting with a person.

**Core**

- Enter width and height (and optionally depth) in cm, mm, inches or feet
- Presets for common things: paper sizes (A5 to A0), posters, photo prints, TVs and monitors (by diagonal and aspect ratio), rugs, bed and mattress sizes
- Drawn to scale beside a person of adjustable height, with a 10 cm grid and labelled dimensions
- Several objects side by side for comparison
- Works on phones, with a picture you can save or share

**Open questions**

- Flat things only (posters, screens, rugs), or 3D boxes in perspective too?
- Which reference figures besides a person: a door, a sofa, a credit card, a phone?
- Should people be able to place an object against a photo of their own room? That needs a reference object of known size in the photo to set the scale.
- Should a design be shareable through a link (all settings in the URL, nothing stored)?

## Ideas to discuss

Not agreed yet. Each needs a yes or no first.

- **PDF tools**: merge, split, reorder and compress PDFs entirely in the browser (pdf-lib is already a dependency)
- **Password and passphrase generator**: using the browser's secure random generator, with a strength estimate
- **Contrast checker**: a standalone version of the Colour Picker's accessibility check, comparing any two colours
- **Unit price comparer**: which pack is cheaper per gram, litre or piece, for shoppers comparing sizes

### For existing tools

- **Sorter: compare two lists**: paste two lists and see what's only in the first, only in the second, or in both (for guest lists, inventories, email lists)
- **Percentage Calculator: SST**: add or remove Malaysia's Sales and Service Tax at the current rates, with the rate kept up to date in one place
- **Percentage Calculator: stacked discounts**: "20% off, then another 10%" worked out as the real total discount (28%, not 30%)
- **Text Statistics: keyword density**: how often a word or phrase you choose appears, as a count and a share of all words, for writing web pages

## Technical follow-ups

- **marked 13 → 18**: major upgrade for the Markdown Previewer and legal pages; check that marked-footnote still works first
- **semantic-release plugins**: majors available for changelog (7), git (11) and the conventional-commits preset (10); update together and test a release
- **@types/node 26**: wait until the toolchain targets Node 26
- **Phosphor icons**: `phosphor-react` is no longer maintained; its successor is `@phosphor-icons/react` (a mostly mechanical import rename)
- **Icon libraries**: both Phosphor and lucide are installed (lucide only for chevrons in a few UI components); standardise on one

## Done recently

- Reworked Text Case Converter, Foot Size Converter, Text Statistics, Sorter, Markdown Previewer, Percentage Calculator and Unit Converter
- Favicon Generator: no-background option and home-screen previews on real wallpapers
- Favicon Generator, with dark-mode variants and the full Unicode emoji set
- Image Converter rebuild: crop/rotate/flip, metadata viewer with privacy controls, AVIF, target file size, presets, before/after comparison
- Command palette (Ctrl/⌘ K) and keyboard shortcuts
- Spin the Wheel rebuilt as SVG; Morse alphabet reference
- "How this works" methodology for every tool
- Pandan & Kopi theme

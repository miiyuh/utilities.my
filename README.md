<img src="https://utilities.my/assets/img/utilities-my_text.svg" alt="utilities.my logo" height="64px" />

---

Small browser tools for everyday jobs: converting images, units and time zones, checking text, and a few others. Everything runs in your browser. Nothing you enter or drop in is uploaded.

## Tools

**Text**
- **Text Case Converter**: see your text in every case at once and copy the one you need
- **Text Statistics**: character, word and paragraph counts, and reading time
- **Sorter**: sort, tidy or split a list, with undo
- **Morse Code Generator**: text to Morse and back, with sound and light

**Writing and web**
- **Markdown Previewer**: write Markdown and see the result as you type
- **QR Code Generator**: make a QR code from a link or text
- **Favicon Generator**: turn a letter, emoji or image into favicon.ico, PNG, Apple and Android icons, a web manifest and the HTML snippet
- **Colour Picker**: pick a colour and copy its HEX, RGB, HSL or OKLCH code

**Images and documents**
- **Image Converter**: convert between PNG, JPEG, WebP, AVIF and JPEG XL, with crop, rotate, flip and resize. Shows the file size before you download, can aim for a size you set, reads and removes metadata such as location, and handles many files at once as a ZIP
- **Palang IC**: stamp a purpose across a MyKad copy so it can't be reused, then export it as an A4 PDF or PNG

**Date and time**
- **Unix Timestamp Converter**: epoch numbers to dates and back
- **Timezone Converter**: compare times across time zones, with daylight saving handled
- **World Clock**: the current time in any city, on a globe
- **Date Difference Calculator**: days, hours or years between two dates

**Measurement and numbers**
- **Unit Converter**: length, weight, temperature, volume and more
- **BMI Calculator**: metric and imperial units
- **Foot Size Converter**: shoe size from a size you know or your foot length
- **Percentage Calculator**: percentages, changes, discounts and tips

**Other**
- **Spin the Wheel**: let a wheel pick for you

### Image Converter formats

| Format | Notes |
|--------|-------|
| PNG | Lossless, keeps transparency |
| JPEG | Works everywhere. No transparency |
| WebP | Smaller than JPEG at the same quality |
| AVIF | Smallest files in most cases, slow to encode |
| JPEG XL | Lossy or lossless. Lossless files are usually much smaller than PNG. Browser support is still uneven, so keep JPEG or WebP for files you plan to share |

JPEG XL files can also be opened as input. AVIF and JPEG XL use WebAssembly encoders ([jSquash](https://github.com/jamsinclair/jSquash)) that download only when you pick that format. If your browser can't display JPEG XL, the preview shows a PNG copy while the download is still a real `.jxl` file.

## Tech stack

- React 19 and TypeScript 7
- Vite 8 and Tailwind CSS 4
- React Router 7
- Radix UI and Base UI components, with Phosphor and Lucide icons
- next-themes for the dark and light themes
- Libraries used by individual tools: date-fns and @date-fns/tz (dates and time zones), marked and DOMPurify (Markdown), qrcode.react (QR codes), exifr (image metadata), pdf-lib and JSZip (PDF and ZIP export), d3-geo and world-atlas (the world clock globe), dnd-kit (drag and drop)
- oxlint for linting, Husky and commitlint for commit checks, semantic-release for versioning

## Running it locally

You need Node.js 20.19+ or 22.12+ and [bun](https://bun.sh) 1.3+ (the version pinned in `package.json`).

```bash
git clone https://github.com/miiyuh/utilities.my.git
cd utilities.my
bun install
bun run dev
```

Then open `http://localhost:5173`.

| Command | What it does |
|---------|--------------|
| `bun run dev` | Start the dev server on port 5173 |
| `bun run build` | Typecheck, build, then prerender each route's HTML, the sitemap and the social cards |
| `bun run preview` | Serve the production build locally |
| `bun run lint` | Run oxlint, including type-aware rules |
| `bun run test` | Run the tests with bun test |
| `bun run typecheck` | Check types for the app and the build scripts, using [tsc-rs](https://github.com/pingdotgg/ts-rust) |

## Contributing

Bug fixes, documentation and new tools are all welcome. The [Roadmap](ROADMAP.md) lists what's planned and what's still being discussed. Please read the [Code of Conduct](CODE_OF_CONDUCT.md) first. To report a security problem, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

1. Fork the repository and create a branch, for example `git checkout -b feat/new-tool`.
2. Make your change, following the patterns already in the code.
3. Check it on a phone-sized and a desktop-sized screen, in both themes, and with the keyboard.
4. Commit using [Conventional Commits](https://www.conventionalcommits.org), for example `feat: add a hash generator`. Commitlint checks this and releases are versioned from it.
5. Push the branch and open a pull request.

### Adding a tool

1. Create `src/pages/<tool-name>.tsx`.
2. Add it to `src/lib/tools.ts` with an icon and a description.
3. Add a `<Route>` for it in `src/App.tsx`.
4. Add an entry to `src/lib/seo.ts` with its title, description and `h1`.
5. If the tool has a method, formula or sources worth explaining, add them to `src/lib/methodology.ts`.

Step 4 is required. Each route is served as its own prerendered HTML file, with no single-page fallback, so a route missing from `src/lib/seo.ts` returns a 404 in production. The build fails if a tool in `tools.ts` has no matching entry, so you'll find out before deploying.

### Code standards

- TypeScript throughout
- Tailwind classes for styling, and shadcn/ui components where one exists
- Use the shared motion tokens (`duration-quick`, `duration-fast`, `duration-medium`) and the `PageHeader` component instead of hardcoding durations or headers
- Show loading states for slow work and a clear message when something fails

### Reporting issues

Open an issue with what went wrong, the steps to reproduce it, what you expected, your browser and device, and a screenshot if it helps.

## License

MIT.

## [3.0.0](https://github.com/miiyuh/utilities.my/compare/v2.0.0...v3.0.0) (2026-09-04)

### ⚠ BREAKING CHANGES

* removing the catch-all rewrite changes the deployed URL
contract. Unknown paths now return a real HTTP 404 instead of HTTP 200 with
the SPA shell, and any client-side route not registered in src/lib/seo.ts
404s at the CDN rather than reaching the router. /color-picker is a 308 at
the edge instead of a client-side redirect, hashed assets moved from
/assets/ to /_static/, `vite build` alone no longer produces a deployable
dist/ (scripts/build-seo.ts must run after it), and contributors need Node
20.19+/22.12+, TypeScript 7 and oxlint instead of ESLint.

### Features

* harden headers, prerender SEO, and move to TypeScript 7 + oxlint ([#19](https://github.com/miiyuh/utilities.my/issues/19)) ([0a8a06e](https://github.com/miiyuh/utilities.my/commit/0a8a06ea46d95d1c197becb1f716766adb81711c)), closes [#root](https://github.com/miiyuh/utilities.my/issues/root) [#FF8800](https://github.com/miiyuh/utilities.my/issues/FF8800) [#0F0](https://github.com/miiyuh/utilities.my/issues/0F0) [#0F](https://github.com/miiyuh/utilities.my/issues/0F) [#0F0](https://github.com/miiyuh/utilities.my/issues/0F0) [#0F0](https://github.com/miiyuh/utilities.my/issues/0F0)

### Bug Fixes

* sync bun.lock after react-helmet-async removal ([df96d12](https://github.com/miiyuh/utilities.my/commit/df96d12799d16948e00449e3a1170552017d5666)), closes [#19](https://github.com/miiyuh/utilities.my/issues/19)

## 2.0.0 (2026-07-07)

Major UI overhaul: standardized motion, rebuilt the home page, migrated to Tailwind v4/Radix UI, and added the World Clock feature.

### Features

* standardize motion with transitions.dev tokens and optimize bundle ([f66ea1b](https://github.com/miiyuh/utilities.my/commit/f66ea1bfd501bace460bf043552a3f0ea50647c2))
* rebuild home page, add World Clock, migrate to Tailwind v4/radix-ui, and standardize UI ([224eb2b](https://github.com/miiyuh/utilities.my/commit/224eb2b6d23dbb716838917aae63a4b1568bb0ff))

### Bug Fixes

* reserve scrollbar gutter to prevent layout shift between pages ([1f7dd16](https://github.com/miiyuh/utilities.my/commit/1f7dd165d8849b6c3d6c544209836aebd7f93cdb))

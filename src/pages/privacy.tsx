import { ShieldCheck } from 'phosphor-react';
import { MarkdownPage } from '@/components/markdown/markdown-page';

const PRIVACY_CONTENT = `# Privacy Policy

*Last Updated: 2026-10-01*

utilities.my is a collection of free tools that run in your browser. This policy explains what happens to your data when you use them. The short version: what you type, upload or calculate stays on your device, and the only things that leave it are anonymous visit statistics and the requests your browser makes to load the site.

## 1. What stays on your device

### 1.1 Everything you put into a tool

Every tool does its work inside your browser. Text you convert, images you resize, photos of your MyKad in Palang IC, numbers you calculate and colours you pick are processed on your device and are **never uploaded** to us or anyone else. There is no server-side processing, and there are no accounts.

### 1.2 What the site remembers in your browser

Some tools save things in your browser's local storage so they are still there next time. This data never leaves your device, and we cannot see it. It includes:

- **Preferences**: light or dark theme, and your Settings choices (units, date, time and number formats)
- **Tool drafts and lists**: for example the text in Text Statistics, your Spin the Wheel items and winners, your pinned World Clock and Timezone Converter cities, your BMI measurements, and your recent colours in the Colour Picker
- **Tool options**: for example the Unix timestamp display format, and Palang IC's wording and watermark style

Palang IC deliberately **never** stores card images or the date. Images exist only in memory for as long as the tab is open.

You can remove all of this at any time by clearing this site's data in your browser settings.

## 2. What leaves your device

### 2.1 Anonymous visit statistics

We use two privacy-focused analytics services to understand which tools people use and how the site performs:

- **Rybbit** (self-hosted by us)
- **Vercel Web Analytics**

They record anonymous page views: the page visited, the referring site, your approximate country, and your browser, operating system and device type. Neither uses cookies, and neither receives anything you type, upload or calculate. We do not use this data to identify you or build a profile of you.

### 2.2 Loading the site

Like any website, loading utilities.my means your browser contacts these services, which can see your IP address and basic request details:

- **Vercel**, which hosts the site
- **Google Fonts**, which serves the typefaces
- **REST Countries flag CDN** (flags.restcountries.com), which serves country flag images in the World Clock and Timezone Converter

Each of these handles that information under its own privacy policy.

## 3. What we don't do

- No accounts, sign-ups or email collection
- No advertising, ad networks or data brokers
- No tracking cookies or cross-site tracking
- No selling or sharing of personal data
- No uploading of the content you work with

## 4. Security

The site is served only over HTTPS, with security headers that restrict what scripts and connections the page is allowed to make. Because your data is processed on your device, its safety also depends on your device and browser: keep your browser up to date, and clear the site's data if you use a shared computer.

## 5. Your choices

- **Clear saved data**: remove this site's data in your browser settings to erase everything stored locally
- **Use a private window**: nothing is kept after you close it
- **Block analytics**: content blockers that stop analytics scripts won't break any tool

## 6. Changes to this policy

If the way the site handles data changes, we will update this page and the date at the top.

## 7. Contact

Questions about this policy? Open an issue on [GitHub](https://github.com/miiyuh/utilities.my/issues) or get in touch through [miiyuh.com](https://miiyuh.com).
`;

export default function PrivacyPage() {
  return (
    <>
      <MarkdownPage
        title="Privacy Policy"
        icon={ShieldCheck}
        content={PRIVACY_CONTENT}
      />
    </>
  );
}

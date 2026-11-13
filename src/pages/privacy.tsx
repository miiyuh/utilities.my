import { ShieldCheck } from '@phosphor-icons/react';
import { MarkdownPage } from '@/components/markdown/markdown-page';

const PRIVACY_CONTENT = `# Privacy Policy

*Last Updated: 2026-11-13*

utilities.my is a collection of free tools that run in your browser. This policy explains what happens to your data when you use them. The short version: what you type, upload or calculate stays on your device, and the only things that leave it are anonymous visit statistics, the requests your browser makes to load the site, and the tweet links you give the Twitter Video/GIF Downloader.

## 1. What stays on your device

### 1.1 Everything you put into a tool

Every tool does its work inside your browser. Text you convert, images you resize, photos of your MyKad in Palang IC, numbers you calculate and colours you pick are processed on your device and are **never uploaded** to us or anyone else. There are no accounts. The one exception is the Twitter Video/GIF Downloader, described in section 2.3, which has to ask Twitter about the tweet you link to.

### 1.2 What the site remembers in your browser

Some tools save things in your browser's local storage so they are still there next time. This data never leaves your device, and we cannot see it. It includes:

- **Preferences**: light or dark theme, your Settings choices (date, time and number formats), and the newest "What's new" update you've opened
- **Tool drafts and lists**: for example the text in Text Statistics, your Markdown Previewer document, your Spin the Wheel items and winners, your pinned World Clock and Timezone Converter cities, your BMI measurements, and your recent colours in the Colour Picker
- **Tool options**: for example the Unix timestamp display format, and Palang IC's wording and watermark style

Palang IC deliberately **never** stores card images or the date. Images exist only in memory for as long as the tab is open.

To keep working without an internet connection, the site also stores its own files in your browser after your first visit: its pages, code, fonts and icons, and the image encoders once you use them. That is a copy of the website, not of anything you enter, and it updates when the site does.

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
- **REST Countries flag CDN** (flags.restcountries.com), which serves country flag images in the World Clock and Timezone Converter
- **miiyuh.com**, the maintainer's website, which serves the portrait on the About page

Each of these handles that information under its own privacy policy.

### 2.3 Twitter Video/GIF Downloader

Twitter (now X) lets only its own pages read a tweet's details from a browser, so this one tool needs help from a server:

- **The tweet's number** from the link you paste goes to a small function on our host, Vercel, which asks **Twitter** for that tweet and passes back its media links. The function stores nothing and keeps no log of which tweets are looked up. Vercel may briefly cache the answer for a public tweet so Twitter isn't asked again, and like any request, Vercel can see your IP address.
- **The videos and photos** then download straight from Twitter's servers (video.twimg.com and pbs.twimg.com) to your browser, so Twitter sees your IP address, as it would if you watched the tweet on Twitter.
- **GIFs you make** are made on your device and never uploaded.

Nothing else you do on the site is sent this way, and nothing is sent until you look up a tweet.

## 3. What we don't do

- No accounts, sign-ups or email collection
- No advertising, ad networks or data brokers
- No tracking cookies or cross-site tracking
- No selling or sharing of personal data
- No uploading of the content you work with (the Twitter Video/GIF Downloader sends only the link you give it, as section 2.3 explains)

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

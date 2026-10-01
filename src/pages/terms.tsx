import { BookOpen } from 'phosphor-react';
import { MarkdownPage } from '@/components/markdown/markdown-page';

const TERMS_CONTENT = `# Terms of Service

*Last Updated: 2026-10-01*

These terms apply to your use of utilities.my. By using the site, you agree to them. If you don't agree, please don't use the site.

## 1. The service

utilities.my is a free collection of browser-based tools:

- **Text**: Text Case Converter, Text Statistics, Sorter, Markdown Previewer, Morse Code Generator
- **Numbers and units**: Unit Converter, Percentage Calculator, BMI Calculator, Foot Size Converter
- **Time and dates**: Unix Timestamp Converter, Date Difference Calculator, Timezone Converter, World Clock
- **Images and colour**: Image Converter, Favicon Generator, Colour Picker, QR Code Generator
- **Everyday**: Spin the Wheel, Palang IC

There are no accounts and no fees. Tools run in your browser, as described in the [Privacy Policy](/privacy). We may add, change or remove tools at any time.

## 2. Using the tools

### 2.1 You're welcome to

Use the tools for personal, educational and commercial purposes, including for work and for files or content you create with them.

### 2.2 Please don't

- Use the site for anything illegal, or to process content you have no right to use
- Use Palang IC, or any other tool, on documents that aren't yours or that you aren't authorised to handle
- Attempt to disrupt, overload or break the site, or bypass its security
- Scrape or mirror the site in a way that degrades it for others

## 3. Accuracy of results

We work to make every tool correct, and the [How the tools work](/about#methodology) section lists the formulas and sources each one uses. Even so:

- **Results are for general information.** Check anything important against an authoritative source.
- **Health tools are not medical advice.** The BMI Calculator is a screening measure, not a diagnosis. Talk to a healthcare professional about your health.
- **Conversions and estimates can be approximate.** For example, shoe sizes vary between brands, CMYK values are not print-accurate, and reading times are averages.
- **Random tools are for fun.** Spin the Wheel and shuffling aren't suitable for draws with real stakes.

## 4. Your content

Anything you put into a tool remains yours. It is processed on your device, and we never receive it. You are responsible for the content you use with the tools and for keeping your own copies of anything important.

## 5. Open source

The site's source code is available on [GitHub](https://github.com/miiyuh/utilities.my) under the MIT License, which governs your use of the code itself. These terms govern your use of the hosted website.

## 6. No warranty

The site is provided **"as is"** and **"as available"**, without warranties of any kind, express or implied. We don't guarantee that the site will always be available, uninterrupted or error-free.

## 7. Limitation of liability

To the fullest extent permitted by law, utilities.my and its maintainer are not liable for any indirect, incidental, special or consequential damages, or for any loss of data, profits or business, arising from your use of the site or reliance on its results.

## 8. Changes to these terms

We may update these terms from time to time. When we do, we'll change the date at the top. Continuing to use the site after an update means you accept the new terms.

## 9. Contact

Questions about these terms? Open an issue on [GitHub](https://github.com/miiyuh/utilities.my/issues) or get in touch through [miiyuh.com](https://miiyuh.com).
`;

export default function TermsPage() {
  return (
    <>
      <MarkdownPage
        title="Terms of Service"
        icon={BookOpen}
        content={TERMS_CONTENT}
      />
    </>
  );
}

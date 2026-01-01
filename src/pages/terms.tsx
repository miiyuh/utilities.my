import { Helmet } from 'react-helmet-async';
import { BookOpenText } from 'lucide-react';
import { MarkdownPage } from '@/components/markdown/markdown-page';

const TERMS_CONTENT = `# Terms of Service

*Last Updated: 2025-08-06*

These Terms of Service ("Terms") govern your use of utilities.my and all related services. By accessing or using our platform, you agree to be bound by these Terms.

## 1. Acceptance of Terms

### 1.1 Agreement

By accessing utilities.my, you confirm that you:

- Are at least 13 years of age
- Have the legal capacity to enter into this agreement
- Agree to comply with all applicable laws and regulations
- Accept these Terms in their entirety

### 1.2 Binding Agreement

These Terms constitute a legally binding agreement between you and utilities.my. If you disagree with any part of these Terms, you must discontinue use of our services immediately.

## 2. Description of Service

### 2.1 What We Provide

utilities.my offers a comprehensive suite of web-based utility tools including:

#### Text Tools
- Text case conversion (uppercase, lowercase, title case, camelCase)
- Text statistics and analysis (word count, character count, reading time)
- Markdown preview and editing
- Text sorting and organization

#### Media Tools
- Image to ASCII art conversion
- Colour picker and palette tools
- File compression (ZIP creation)
- Image format conversion

#### Productivity Tools
- Date difference calculator
- Unix timestamp converter
- Timezone converter and world clock
- Unit converter (length, weight, temperature, etc.)

#### Fun Tools
- QR code generator
- Spin the wheel decision maker
- Random list sorter
- Password generator

### 2.2 Service Characteristics

Our platform is designed with the following principles:

- **Client-side processing**: Most tools work entirely in your browser
- **No registration required**: Use tools without creating accounts
- **Privacy-focused**: Minimal data collection and processing
- **Free to use**: All tools are available at no cost
- **Open source friendly**: Built with transparency in mind

## 3. Acceptable Use Policy

### 3.1 Permitted Uses

You may use utilities.my for:

- Personal projects and productivity enhancement
- Educational purposes and learning
- Professional work and development
- Creative projects and experimentation
- Research and analysis
- Commercial projects (within legal bounds)

### 3.2 Prohibited Uses

You must **NOT** use our services for:

- Illegal activities or content processing
- Harassment, hate speech, or harmful content creation
- Attempting to break, hack, or exploit our systems
- Distributing malware or malicious code
- Violating intellectual property rights
- Spamming or automated abuse

## 4. Disclaimers and Limitations

### 4.1 Service Disclaimer

utilities.my is provided **"AS IS"** and **"AS AVAILABLE"** without warranties of any kind.

### 4.2 Limitation of Liability

To the maximum extent permitted by law, utilities.my shall not be liable for any indirect, incidental, special, consequential, or punitive damages.

## 5. Contact

If you have questions about these Terms, please contact us through our website.
`;

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | utilities.my</title>
        <meta name="description" content="Terms of Service for utilities.my - Read our terms and conditions for using our utility tools." />
        <link rel="canonical" href="https://utilities.my/terms" />
      </Helmet>
      <MarkdownPage
        title="Terms of Service"
        icon={BookOpenText}
        content={TERMS_CONTENT}
      />
    </>
  );
}

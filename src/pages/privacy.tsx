import { Helmet } from 'react-helmet-async';
import { ShieldCheck } from 'lucide-react';
import { MarkdownPage } from '@/components/markdown/markdown-page';

const PRIVACY_CONTENT = `# Privacy Policy

*Last Updated: 2025-08-06*

This Privacy Policy governs how we collect, use, protect, and handle your information when you use our web-based utility tools and services.

## 1. Introduction

### 1.1 Our Commitment to Privacy

utilities.my is built with **privacy by design** principles. We believe in giving users complete control over their data while providing powerful, client-side utility tools.

### 1.2 Scope of This Policy

This policy describes our practices regarding data collection and usage across all our utility tools, including:

- Text processing tools (case conversion, statistics, markdown preview)
- Media tools (image to ASCII, colour picker, file compression)
- Productivity tools (date calculator, timezone converter, unit converter)
- Fun tools (QR generator, wheel spinner, random sorter)

## 2. Information We Collect

### 2.1 Client-Side Processing

Our application is designed with privacy by design principles. **Most of our tools operate entirely within your browser** using client-side processing, which means:

- **Your data stays on your device** - Files and text you process remain in your browser
- **No server uploads** - We don't upload your sensitive data to our servers
- **Real-time processing** - Conversions and transformations happen instantly on your device
- **No tracking** - We don't monitor what tools you use or how you use them

### 2.2 Data We May Store Locally

We use browser local storage **only** for:

- **Theme Preferences**: Your preferred theme (light/dark mode) and UI customization settings
- **Tool Settings**: Last used configurations and user preferences for specific utilities
- **User Experience**: Convenience settings like default units, formats, and recently used options

> **Note**: All this data is stored locally on your device and never transmitted to our servers.

### 2.3 Data We Explicitly Do NOT Collect

We want to be crystal clear about what we **don't** collect:

- Personal identification information (name, email, phone, address)
- File contents you upload or process through our tools
- Text or data you input into our utilities
- IP addresses or precise location data
- Browsing history or detailed usage analytics
- Device fingerprinting or tracking identifiers
- Cookies for tracking purposes
- Third-party advertising data

## 3. How We Use Information

### 3.1 Enhancing Your Experience

The minimal information we store locally is used to:

- Remember your preferred theme and interface settings
- Provide consistent user experience across browser sessions
- Save your tool configurations for convenience
- Optimize tool performance based on your usage patterns

### 3.2 Service Improvement

Anonymous, aggregated data helps us:

- Identify which tools are most useful to users
- Optimize performance and fix technical issues
- Plan new features and improvements
- Ensure compatibility across different browsers and devices

### 3.3 No Profiling or Tracking

We explicitly do **not**:

- Create detailed user profiles or behavioral tracking
- Share data with advertising networks or data brokers
- Use data for marketing or promotional purposes
- Track users across different websites or services

## 4. Data Security and Protection

### 4.1 Client-Side Security

- **Encryption in Transit**: All connections use HTTPS/TLS encryption
- **No Data Transmission**: Most processing happens entirely in your browser
- **Browser Security**: We rely on your browser's built-in security features
- **No Persistent Server Storage**: Tool data is not saved permanently on our servers

### 4.2 Your Responsibility

Since data processing happens in your browser, we recommend:

- Keep your browser updated with the latest security patches
- Use trusted networks when processing sensitive data
- Clear browser data when using shared or public computers
- Be cautious when processing highly confidential information

## 5. Your Rights and Choices

### 5.1 Data Control

You have complete control over your data:

- **Clear Local Storage**: Remove all saved preferences and settings
- **Disable JavaScript**: Prevent local storage (may break functionality)
- **Use Incognito Mode**: For completely temporary sessions
- **Opt Out**: Stop using our services at any time

## 6. Contact

If you have questions about this Privacy Policy, please contact us through our website.
`;

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | utilities.my</title>
        <meta name="description" content="Privacy Policy for utilities.my - Learn how we protect your data and privacy." />
        <link rel="canonical" href="https://utilities.my/privacy" />
      </Helmet>
      <MarkdownPage
        title="Privacy Policy"
        icon={ShieldCheck}
        content={PRIVACY_CONTENT}
      />
    </>
  );
}

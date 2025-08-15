"use client";

import type { Metadata } from 'next';

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
- Media tools (image to ASCII, color picker, file compression)
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

### 4.3 Incident Response

In the unlikely event of a security incident:

- We will investigate and contain any issues immediately
- Users will be notified if their data may have been affected
- We will cooperate with relevant authorities as required by law

## 5. Third-Party Services

### 5.1 External Dependencies

Our application may use:

- **CDN Services**: For faster loading of fonts, icons, and static assets
- **Font Services**: For typography (Google Fonts, etc.)
- **Icon Libraries**: For user interface elements
- **Analytics Services**: For anonymous usage statistics (if any)

> **Important**: No personal data is shared with these services.

### 5.2 External Links

We may link to external resources, documentation, or related tools. This Privacy Policy does not cover third-party websites or services. Please review their privacy policies before using external services.

## 6. Your Rights and Choices

### 6.1 Data Control

You have complete control over your data:

- **Clear Local Storage**: Remove all saved preferences and settings
- **Disable JavaScript**: Prevent local storage (may break functionality)
- **Use Incognito Mode**: For completely temporary sessions
- **Opt Out**: Stop using our services at any time

### 6.2 Privacy Settings

You can adjust privacy-related settings:

- Choose whether to save tool preferences
- Control theme and interface customizations
- Decide which convenience features to enable

## 7. International Data Transfers

### 7.1 Cross-Border Processing

While utilities.my primarily operates using client-side processing, some services may involve:

- **CDN Services**: Content delivery networks that may cache static assets globally
- **Analytics Services**: Anonymous usage statistics that may be processed internationally
- **Cloud Infrastructure**: Hosting services that may replicate data across regions

### 7.2 Data Protection Standards

We ensure that any international data transfers maintain appropriate safeguards:

- **Equivalent Protection**: All transfers maintain privacy standards equivalent to this policy
- **Security Measures**: Data in transit and at rest is encrypted and secured
- **Limited Scope**: Only necessary data is transferred for service functionality

## 8. Children's Privacy

### 8.1 Age Requirements

utilities.my is intended for users who are at least 13 years of age. We:

- Do not knowingly collect personal information from children under 13
- Encourage parental supervision for users under 18
- Comply with applicable children's privacy laws (COPPA, GDPR Article 8)

### 8.2 Parental Rights

If you believe a child under 13 has used our services:

- **Contact Us**: Report the incident through our contact methods
- **Data Removal**: We will promptly remove any collected information
- **Account Termination**: Access will be restricted until age verification

## 9. Updates to This Policy

### 9.1 Policy Changes

We may update this Privacy Policy to:

- Reflect changes in our data practices
- Comply with new legal requirements
- Improve clarity and transparency
- Add new features or services

### 9.2 Notification Process

- **Significant Changes**: Will be prominently displayed on our website
- **Version Dating**: All updates include effective dates
- **Continued Use**: Constitutes acceptance of updated terms
- **Change Log**: We maintain a record of major policy changes

## 10. Contact Information

### 10.1 Privacy Questions

If you have questions about this Privacy Policy or our privacy practices:

- **Website**: Contact us through utilities.my
- **Response Time**: We aim to respond within 48 hours
- **Data Requests**: We handle data-related inquiries promptly

### 10.2 Data Protection Requests

For any data-related requests, please include:

- Your specific concern or question
- The tool or service you're asking about
- Any relevant details about your usage
- Preferred method of response

## Summary

**utilities.my is committed to privacy**. We collect minimal data, process most information locally in your browser, and give you complete control over your privacy settings. This policy is designed to be transparent and comprehensive because we believe in your right to privacy.`;

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How utilities.my handles your data: privacy-first approach with local processing where possible.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacy Policy · utilities.my',
    url: 'https://utilities.my/privacy',
    images: [{ url: '/api/og?title=Privacy%20Policy&subtitle=Your%20data%2C%20your%20control', width: 1200, height: 630 }],
  },
};

export default function PrivacyPolicyPage() {
  return <MarkdownPage icon={ShieldCheck} title="Privacy Policy" content={PRIVACY_CONTENT} />;
}

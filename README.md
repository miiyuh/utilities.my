<img src="https://utilities.my/assets/img/utilities-my_text.svg" alt="utilities.my logo" height="64px" />

---

A comprehensive collection of web-based utilities for everyday tasks, all centralized in one modern, responsive web application.

## Overview

utilities.my is a productivity-focused web application that consolidates essential online tools into a single, unified platform. Built with React and modern web technologies, it provides a consistent, responsive interface across all utilities with support for both dark and light themes.

**Key Benefits:**
- 🎯 **Centralized Access** - All your frequently-used tools in one place
- 📱 **Fully Responsive** - Optimized for mobile, tablet, and desktop devices
- 🎨 **Modern Design** - Clean, intuitive interface with dark/light theme support
- ⚡ **High Performance** - Fast, lightweight Vite-powered development and builds

## Features

### 📝 Text Utilities
- **Text Case Converter** - Transform text between multiple case formats (uppercase, lowercase, title case, camel case, snake case, and more)
- **Text Statistics** - Comprehensive text analysis including character count, word count, paragraph count, and reading time
- **Text Sorter** - Sort lines of text alphabetically, numerically, or by length with customizable options

### 🛠️ Development Tools
- **Markdown Previewer** - Live markdown editor with real-time preview and syntax highlighting
- **QR Code Generator** - Create QR codes from text or URLs

### 🎨 Design Tools
- **Colour Picker** - Advanced colour selection tool with support for HEX, RGB, HSL, CMYK, and HSV formats

### ⏰ Date & Time Utilities
- **Unix Timestamp Converter** - Convert between Unix timestamps and human-readable dates with timezone support
- **Timezone Converter** - Convert times across global timezones with major city presets and DST handling
- **Date Difference Calculator** - Calculate precise time differences between dates
- **World Clock** - View current time across multiple timezones

### 📏 Measurement & Conversion Tools
- **Unit Converter** - Convert between various units including length, weight, temperature, and volume
- **BMI Calculator** - Calculate Body Mass Index with metric and imperial units
- **Footsize Converter** - Convert between different footsize scales
- **Percentage Calculator** - Calculate percentages, percentage changes, and more

### 🎲 Image & Fun Tools
- **Image Converter** - Convert images between different formats (PNG, JPG, WebP) with resizing
- **Spin the Wheel** - Customizable decision-making wheel with animations
- **Morse Code Generator** - Convert text to Morse code and vice versa with audio and visual playback

### 📜 Additional Pages
- **About** - Project information and details
- **Settings** - Application configuration and preferences
- **Privacy Policy** - Privacy information and data handling
- **Terms of Service** - Terms and conditions

## Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Full type safety and IntelliSense
- **Vite** - Ultra-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, reusable component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Libraries
- **dayjs** - Lightweight date manipulation with timezone support
- **marked** - Markdown parsing and rendering
- **qrcode.react** - QR code generation
- **DOMPurify** - XSS protection

## Project Structure

```
src/
├── components/           # Reusable React components
│   ├── ui/              # shadcn/ui components
│   ├── sidebar-content.tsx
│   ├── theme-toggle-button.tsx
│   ├── interactive-grid-background.tsx
│   └── spin-wheel-canvas.tsx
├── pages/               # Utility pages
│   ├── about.tsx
│   ├── bmi-calculator.tsx
│   ├── colour-picker.tsx
│   ├── date-diff-calculator.tsx
│   ├── footsize-converter.tsx
│   ├── home.tsx
│   ├── image-converter.tsx
│   ├── markdown-previewer.tsx
│   ├── morse-code-generator.tsx
│   ├── not-found.tsx
│   ├── percentage-calculator.tsx
│   ├── privacy.tsx
│   ├── qr-code-generator.tsx
│   ├── settings.tsx
│   ├── sorter.tsx
│   ├── spin-the-wheel.tsx
│   ├── terms.tsx
│   ├── text-case.tsx
│   ├── text-statistics.tsx
│   ├── timezone-converter.tsx
│   ├── unit-converter.tsx
│   ├── unix-timestamp-converter.tsx
│   └── world-clock.tsx
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── App.tsx
├── main.tsx
└── globals.css
```

## 🚀 Installation & Development

### Prerequisites
- **Node.js 18+** (Latest LTS recommended)
- **bun** (or npm/yarn)
- **Git** for version control

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/miiyuh/utilities.my.git
   cd utilities.my
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Start development server**
   ```bash
   bun run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run build` | Build optimized production bundle |
| `bun run preview` | Preview production build locally |
| `bun run lint` | Run ESLint for code quality |

## 🎨 Design Philosophy

### User-Centered Design
- **Intuitive Interface** - Clean, uncluttered layouts focused on functionality
- **Responsive** - Seamless experience across all device sizes
- **Theme Support** - Beautiful dark and light themes

### Code Quality
- **TypeScript** - Full type safety throughout the codebase
- **Component-Based** - Modular, reusable components
- **Consistent Styling** - Tailwind CSS with custom design system

## Contributing

Contributions are welcome! Whether you're fixing bugs, improving documentation, or adding new utilities, your contributions help make this better.

### How to Contribute

1. **Fork the repository** and create your feature branch
   ```bash
   git checkout -b feature/new-utility
   ```

2. **Make your changes** following the project's code patterns
3. **Test thoroughly** across different screen sizes and themes
4. **Commit with clear messages**
   ```bash
   git commit -m "Add new utility description"
   ```

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/new-utility
   ```

### Development Guidelines

#### Adding New Utilities

1. Create a new file in `src/pages/[utility-name].tsx`
2. Add the utility to `src/lib/tools.ts` with icon and description
3. Follow existing component patterns and styling
4. Ensure responsive design for mobile, tablet, and desktop
5. Test with both dark and light themes
6. Test keyboard navigation and accessibility

#### Code Standards

- Use TypeScript for all code
- Follow existing component structure and naming conventions
- Use Tailwind CSS classes for styling
- Use shadcn/ui components when available
- Implement proper error handling and user feedback
- Add loading states for async operations

### Ideas for Contributions

We're open to new utilities! Some potential additions:

- Base64 Encoder/Decoder
- URL Encoder/Decoder
- JSON Formatter and Validator
- Password Generator
- Hash Generator (MD5, SHA-256)
- Binary/Decimal/Hex Converter
- Regular Expression Tester

### Reporting Issues

Found a bug? Please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser and device info

## License

This project is licensed under the MIT License.

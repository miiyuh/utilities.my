<img src="https://utilities.my/assets/img/utilities-my_text.svg" alt="utilities.my logo" height="64px" />

---

A comprehensive collection of web-based utilities for everyday tasks, all centralized in one modern, responsive web application.

## Overview

utilities.my is a productivity-focused web application that consolidates essential online tools into a single, unified platform. Built with modern web technologies and designed with accessibility in mind, it eliminates the need to switch between multiple websites by providing a consistent, responsive interface across all utilities.

**Key Benefits:**
- 🎯 **Centralized Access** - All your frequently-used tools in one place
- 📱 **Fully Responsive** - Optimized for mobile, tablet, and desktop devices
- 🎨 **Modern Design** - Clean, intuitive interface with dark/light theme support
- ♿ **Accessible** - Built with accessibility-first principles
- ⚡ **High Performance** - Server-side rendering and optimized loading

## Features

### 📝 Text Utilities
- **Text Case Converter** - Transform text between multiple case formats (uppercase, lowercase, title case, camel case, snake case, and more)
- **Text Statistics** - Comprehensive text analysis including character count, word count, paragraph count, reading time, and readability metrics
- **Text Sorter** - Sort lines of text alphabetically, numerically, or by length with customizable options

### 🛠️ Development Tools
- **Markdown Previewer** - Live markdown editor with real-time preview, syntax highlighting, and comprehensive formatting support
- **QR Code Generator** - Create customizable QR codes from text or URLs with size and styling options
- **Color Picker** - Advanced color selection tool with support for HEX, RGB, HSL, CMYK, and HSV formats. Includes image color extraction and accessibility contrast checking

### ⏰ Date & Time Utilities
- **Unix Timestamp Converter** - Bidirectional conversion between Unix timestamps and human-readable dates with timezone support
- **Timezone Converter** - Convert times across global timezones with major city presets and DST handling
- **Date Difference Calculator** - Calculate precise time differences with multiple output formats (years, months, days, hours, etc.)

### 📏 Measurement Tools
- **Unit Converter** - Convert between various units including length, weight, temperature, volume, area, and more
- **BMI Calculator** - Calculate Body Mass Index with metric and imperial units, including health classifications and ideal weight ranges

### 📁 File & Image Tools
- **File Compressor** - Create ZIP archives from multiple files with compression options
- **Image Converter** - Convert images between different formats (PNG, JPG, WebP) with resizing and quality control
- **Image to ASCII Converter** - Transform images into ASCII art with adjustable resolution and character sets

### 🎲 Fun Utilities
- **Spin the Wheel** - Customizable decision-making wheel with animations and multiple options

### 📜 Additional Pages
- **About** - Comprehensive project information, technology stack, and contribution guidelines
- **Settings** - Application configuration including theme preferences and default units
- **Privacy Policy** - Privacy information and data handling practices
- **Terms of Service** - Terms and conditions for using the application

## Technology Stack

### Frontend Framework
- **Next.js 15.3.3** - React framework with App Router, server-side rendering, and Turbopack for fast development
- **React 18** - Modern React with hooks, concurrent features, and server components
- **TypeScript** - Full type safety with comprehensive IntelliSense support

### UI & Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework with custom design system
- **Radix UI** - Accessible, unstyled component primitives
- **shadcn/ui** - Beautiful, reusable component library built on Radix UI
- **Lucide React** - Consistent, customizable icon library

### Additional Libraries
- **marked** - Markdown parsing and rendering with extensions
- **DOMPurify** - XSS protection for user-generated content
- **dayjs** - Lightweight date manipulation library
- **qrcode.react** - QR code generation
- **jszip** - Client-side ZIP file creation
- **Google Fonts** - Noto Sans, Noto Mono, and Inter typography

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── about/             # About page with project information
│   ├── bmi-calculator/    # BMI calculation with health metrics
│   ├── color-picker/      # Advanced color picker and palette tool
│   ├── date-diff-calculator/ # Date difference calculator
│   ├── image-converter/   # Image format conversion and resizing
│   ├── markdown-previewer/ # Markdown editor and live preview
│   ├── privacy/           # Privacy policy page
│   ├── qr-code-generator/ # QR code generation utility
│   ├── settings/          # Application settings and preferences
│   ├── sorter/            # Text sorting utility
│   ├── spin-the-wheel/    # Random decision wheel
│   ├── terms/             # Terms of service page
│   ├── text-case/         # Text case converter
│   ├── text-statistics/   # Text analysis and statistics
│   ├── timezone-converter/ # Timezone conversion tool
│   ├── unit-converter/    # Unit measurement converter
│   └── unix-timestamp-converter/ # Unix timestamp converter
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   ├── sidebar-content.tsx # Navigation sidebar
│   ├── theme-provider.tsx # Dark/light theme provider
│   └── theme-toggle-button.tsx # Theme switcher
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
└── ai/                   # AI integration files
```

## 🚀 Installation & Development

### Prerequisites
- **Node.js 18+** (Latest LTS recommended)
- **npm** or **yarn** package manager
- **Git** for version control

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/miiyuh/utilities.my.git
   cd utilities.my
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:9002`

### 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack (hot reload) |
| `npm run build` | Build optimized production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint for code quality |
| `npm run typecheck` | Run TypeScript compiler checks |
| `npm run genkit:dev` | Start Genkit AI development server |
| `npm run genkit:watch` | Start Genkit AI with file watching |

### 🔧 Development Environment

- **Hot Reload**: Instant updates during development
- **TypeScript**: Full type checking and IntelliSense
- **ESLint**: Code quality and consistency
- **Turbopack**: Ultra-fast bundling and compilation

## 🎨 Design Philosophy

### 🎯 User-Centered Design
- **Intuitive Interface** - Clean, uncluttered layouts that prioritize functionality
- **Responsive Design** - Seamless experience across mobile, tablet, and desktop devices
- **Progressive Enhancement** - Core features work everywhere, enhanced features where supported

### ♿ Accessibility First
- **WCAG Compliance** - Built with accessibility-first components from Radix UI
- **Keyboard Navigation** - Full keyboard accessibility for all interactive elements
- **Screen Reader Support** - Proper ARIA labels and semantic HTML structure
- **Color Contrast** - High contrast ratios and colorblind-friendly palettes
- **Touch Targets** - Minimum 44px touch targets for mobile devices

### ⚡ Performance Optimized
- **Server-Side Rendering** - Fast initial page loads with Next.js SSR
- **Code Splitting** - Optimized bundle sizes with automatic code splitting
- **Image Optimization** - Automatic image optimization and lazy loading
- **Caching Strategy** - Efficient caching for static assets and dynamic content

### 🎨 Visual Consistency
- **Design System** - Unified color palette, typography, and spacing scales
- **Component Library** - Reusable shadcn/ui components for consistency
- **Theme Support** - Beautiful dark and light themes with smooth transitions
- **Micro-interactions** - Subtle animations and feedback for better UX

## Contributing

Contributions are welcome and encouraged! This project is open-source and benefits from community input. Whether you're fixing bugs, adding new utilities, improving documentation, or enhancing existing features, your contributions help make this tool better for everyone.

### How to Contribute

1. **Fork the repository** and create your feature branch

   ```bash
   git checkout -b feature/amazing-new-utility
   ```

2. **Make your changes** following the project's coding standards
3. **Test your changes** thoroughly across different screen sizes and themes
4. **Commit your changes** with clear, descriptive messages

   ```bash
   git commit -m "Add new password generator utility"
   ```

5. **Push to your branch** and create a Pull Request

   ```bash
   git push origin feature/amazing-new-utility
   ```

### Development Guidelines

#### Adding New Utilities

1. Create a new page in the `src/app/[utility-name]/` directory
2. Add the utility to the tools list in `src/lib/tools.ts` with appropriate icon and description
3. Follow the established component patterns and styling guidelines
4. Ensure responsive design works on mobile, tablet, and desktop
5. Test both dark and light theme compatibility
6. Verify accessibility with keyboard navigation and screen readers

#### Code Standards

- Use TypeScript for all new code
- Follow the existing component structure and naming conventions
- Implement proper error handling and user feedback
- Add appropriate loading states for async operations
- Use existing UI components from `src/components/ui/` when possible
- Maintain consistent styling with Tailwind CSS classes

#### Design Consistency

- Follow the established header pattern with icons and tool names
- Include large heading sections with tool descriptions
- Use consistent container widths (`max-w-7xl mx-auto`)
- Apply standard padding (`p-4 lg:p-8`)
- Maintain the sidebar navigation structure

### 💡 Ideas for Contributions

We're always looking for useful utilities to add! Some ideas include:

**Encoding & Decoding**
- Base64 Encoder/Decoder
- URL Encoder/Decoder
- HTML Entity Encoder/Decoder

**Development Tools**
- JSON Formatter and Validator
- Regular Expression Tester
- CSS Formatter and Minifier
- JWT Token Decoder

**Text & Content**
- Lorem Ipsum Generator
- Password Generator with customizable rules
- Text Diff Checker
- Slug Generator

**Data & Math**
- Hash Generator (MD5, SHA-256, etc.)
- Binary/Decimal/Hex Converter
- Percentage Calculator
- Random Number Generator

**Health & Fitness**
- BMI Calculator with health classifications
- Metric and imperial unit support
- Health recommendations and ideal weight ranges

**Image Processing**
- Multi-format image conversion (PNG, JPG, WebP)
- Intelligent resizing with aspect ratio preservation
- Quality control for optimized file sizes
- Drag-and-drop file handling

### Reporting Issues

Found a bug or have a feature request? Please create an issue with:

- Clear description of the problem or feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable
- Browser and device information

### Questions and Support

Feel free to open an issue for questions about the codebase, contribution process, or feature discussions. Community input helps shape the direction of this project.

## License

This project is licensed under the MIT License.

<img src="https://utilities.my/assets/img/utilities-my_text.svg" alt="utilities.my logo" height="64px" />

---

A comprehensive collection of web-based utilities for everyday tasks, all centralized in one modern, responsive web application.

<img src=".\public\assets\img\screenshots\screenshot-01.png" alt="utilities.my logo" height="256px" />
<img src=".\public\assets\img\screenshots\screenshot-02.png" alt="utilities.my logo" height="256px" />

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

### 🔤 Communication Tools
- **Morse Code Generator** - Convert text to Morse code and vice versa with audio, visual, and vibration playback. Customizable speed, pitch, and volume controls.

### 📜 Additional Pages
- **About** - Comprehensive project information, technology stack, and contribution guidelines
- **Settings** - Application configuration including theme preferences and default units
- **Privacy Policy** - Privacy information and data handling practices
- **Terms of Service** - Terms and conditions for using the application

## Technology Stack

### Frontend
- **React 19** - Latest React with hooks and modern features
- **TypeScript** - Full type safety and IntelliSense
- **Vite** - Ultra-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Routing & State Management
- **React Router DOM 7** - Client-side routing
- **React Context** - State management for settings and preferences
- **next-themes** - Theme switching and persistence

### UI & Animation
- **Framer Motion** - Smooth animations and transitions
- **sonner** - Toast notifications
- **dnd-kit** - Drag and drop utilities
- **Radix UI Dialog, Popover, Select** - Advanced components

### Libraries & Utilities
- **dayjs** - Lightweight date manipulation with timezone support
- **date-fns** - Additional date utilities
- **marked** - Markdown parsing with GitHub Flavored Markdown
- **marked-footnote** - Markdown footnote support
- **react-markdown** - React component for rendering markdown
- **rehype-slug** - Auto-generating heading IDs
- **remark-gfm** - GitHub Flavored Markdown support
- **qrcode.react** - QR code generation
- **DOMPurify** - XSS protection
- **react-colorful** - Color picker component
- **browser-image-compression** - Client-side image compression
- **color** - Color manipulation utilities
- **leaflet & react-leaflet** - Interactive maps
- **canvas-confetti** - Confetti animations
- **react-day-picker** - Calendar component

## 🚀 Installation & Development

### Prerequisites
- **Node.js 18+** (Latest LTS recommended)
- **bun 1.1+** (or npm/yarn)
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
| `bun run dev` | Start development server with hot reload on `http://localhost:5173` |
| `bun run build` | Build optimized production bundle with TypeScript checking |
| `bun run preview` | Preview production build locally |
| `bun run lint` | Run ESLint for code quality with strict warnings |
| `bun run typecheck` | Check TypeScript types without emitting files |

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
- Metric and imperial unit support
- Health recommendations and ideal weight ranges

**Image Processing**
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

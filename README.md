<img src="https://utilities.my/assets/img/utilities-my_text.svg" alt="utilities.my logo" height="64px" />

# utilities.my

A comprehensive collection of web-based utilities for everyday tasks, all centralized in one modern, responsive web application.

## Overview

utilities.my is a personal productivity suite designed to consolidate frequently-used online tools into a single, cohesive platform. Instead of navigating between multiple websites for different utilities, this application provides a unified interface with consistent design and functionality.

## Features

### Text Utilities
- **Text Case Converter** - Convert text between different letter cases (uppercase, lowercase, title case, camel case, etc.)
- **Text Statistics** - Analyze text for character count, word count, paragraph count, reading time, and more
- **Sorter** - Sort lines of text alphabetically or numerically with various sorting options

### Development Tools
- **Markdown Previewer** - Write Markdown with live preview and syntax highlighting
- **QR Code Generator** - Generate QR codes from text or URLs with customizable styling
- **Color Picker** - Pick colors and get their codes in various formats (HEX, RGB, HSL, etc.)

### Date & Time Utilities
- **Unix Timestamp Converter** - Convert Unix timestamps to human-readable dates and vice versa
- **Timezone Converter** - Convert times between different timezones with support for major cities
- **Date Difference Calculator** - Calculate precise differences between two dates and times

### Measurement Tools
- **Unit Converter** - Convert between different units of measurement (length, weight, temperature, etc.)

### File Tools
- **File Compressor** - Compress multiple files into ZIP archives for easy sharing and storage
- **Image to ASCII Converter** - Convert images into ASCII art with customizable settings

### Fun Utilities
- **Spin the Wheel** - Random decision maker with customizable options and animation

## Technology Stack

### Frontend Framework
- **Next.js 15.3.3** - React framework with App Router and server-side rendering
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development with full IntelliSense support

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Radix UI** - Accessible, unstyled UI components
- **Lucide React** - Beautiful, customizable icons
- **shadcn/ui** - Re-usable component library built on Radix UI

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── about/             # About page
│   ├── color-picker/      # Color picker utility
│   ├── date-diff-calculator/ # Date difference calculator
│   ├── markdown-previewer/ # Markdown editor and preview
│   ├── qr-code-generator/ # QR code generation
│   ├── settings/          # Application settings
│   ├── sorter/            # Text sorting utility
│   ├── spin-the-wheel/    # Random decision wheel
│   ├── text-case/         # Text case converter
│   ├── text-statistics/   # Text analysis tool
│   ├── timezone-converter/ # Timezone conversion
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

## Installation & Development

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Setup
1. Clone the repository
```bash
git clone https://github.com/miiyuh/utilities.my.git
cd utilities.my
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:9002`

### Available Scripts
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler check
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit AI with file watching

## Design Philosophy

### Consistency
- Unified design language across all utilities
- Consistent navigation and user interface patterns
- Standardized color scheme and typography

### Accessibility
- Built with accessibility-first components from Radix UI
- Keyboard navigation support
- Screen reader compatibility
- High contrast color schemes

### Performance
- Server-side rendering with Next.js
- Optimized bundle sizes with code splitting
- Fast page transitions and loading states

### User Experience
- Responsive design for all screen sizes
- Dark and light theme support
- Intuitive navigation with sidebar
- Real-time feedback and validation

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

### Ideas for Contributions

We're always looking for useful utilities to add! Some ideas include:

- Base64 Encoder/Decoder
- JSON Formatter and Validator
- Hash Generator (MD5, SHA-256, etc.)
- Lorem Ipsum Generator
- Regular Expression Tester
- Image Format Converter
- Percentage Calculator
- Binary/Decimal/Hex Converter

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

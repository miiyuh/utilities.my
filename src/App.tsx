import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Home stays eager so the landing page renders without a second request.
import Home from './pages/home'

// Every other page is code-split so heavy tools (maps, image processing,
// markdown rendering) only load when their route is visited.
const TextCase = lazy(() => import('./pages/text-case'))
const ColorPicker = lazy(() => import('./pages/colour-picker'))
const UnitConverter = lazy(() => import('./pages/unit-converter'))
const BmiCalculator = lazy(() => import('./pages/bmi-calculator'))
const ImageConverter = lazy(() => import('./pages/image-converter'))
const MarkdownPreviewer = lazy(() => import('./pages/markdown-previewer'))
const QrCodeGenerator = lazy(() => import('./pages/qr-code-generator'))
const UnixTimestampConverter = lazy(() => import('./pages/unix-timestamp-converter'))
const TimezoneConverter = lazy(() => import('./pages/timezone-converter'))
const WorldClock = lazy(() => import('./pages/world-clock'))
const DateDiffCalculator = lazy(() => import('./pages/date-diff-calculator'))
const TextStatistics = lazy(() => import('./pages/text-statistics'))
const Sorter = lazy(() => import('./pages/sorter'))
const SpinTheWheel = lazy(() => import('./pages/spin-the-wheel'))
const MorseCodeGenerator = lazy(() => import('./pages/morse-code-generator'))
const PercentageCalculator = lazy(() => import('./pages/percentage-calculator'))
const FootSizeConverter = lazy(() => import('./pages/footsize-converter'))
const About = lazy(() => import('./pages/about'))
const Privacy = lazy(() => import('./pages/privacy'))
const Terms = lazy(() => import('./pages/terms'))
const Settings = lazy(() => import('./pages/settings'))
const NotFound = lazy(() => import('./pages/not-found'))

function RouteFallback() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading page" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/text-case" element={<TextCase />} />
        <Route path="/colour-picker" element={<ColorPicker />} />
        <Route path="/color-picker" element={<Navigate to="/colour-picker" replace />} />
        <Route path="/unit-converter" element={<UnitConverter />} />
        <Route path="/bmi-calculator" element={<BmiCalculator />} />
        <Route path="/image-converter" element={<ImageConverter />} />
        <Route path="/markdown-previewer" element={<MarkdownPreviewer />} />
        <Route path="/qr-code-generator" element={<QrCodeGenerator />} />
        <Route path="/unix-timestamp-converter" element={<UnixTimestampConverter />} />
        <Route path="/timezone-converter" element={<TimezoneConverter />} />
        <Route path="/world-clock" element={<WorldClock />} />
        <Route path="/date-diff-calculator" element={<DateDiffCalculator />} />
        <Route path="/text-statistics" element={<TextStatistics />} />
        <Route path="/sorter" element={<Sorter />} />
        <Route path="/spin-the-wheel" element={<SpinTheWheel />} />
        <Route path="/morse-code-generator" element={<MorseCodeGenerator />} />
        <Route path="/percentage-calculator" element={<PercentageCalculator />} />
        <Route path="/foot-size-converter" element={<FootSizeConverter />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

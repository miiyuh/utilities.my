import { Routes, Route } from 'react-router-dom'

// Pages
import Home from './pages/home'
import TextCase from './pages/text-case'
import ColorPicker from './pages/colour-picker'
import UnitConverter from './pages/unit-converter'
import BmiCalculator from './pages/bmi-calculator'
import ImageConverter from './pages/image-converter'
import MarkdownPreviewer from './pages/markdown-previewer'
import QrCodeGenerator from './pages/qr-code-generator'
import UnixTimestampConverter from './pages/unix-timestamp-converter'
import TimezoneConverter from './pages/timezone-converter'
import WorldClock from './pages/world-clock'
import DateDiffCalculator from './pages/date-diff-calculator'
import TextStatistics from './pages/text-statistics'
import Sorter from './pages/sorter'
import SpinTheWheel from './pages/spin-the-wheel'
import MorseCodeGenerator from './pages/morse-code-generator'
import PercentageCalculator from './pages/percentage-calculator'
import FootSizeConverter from './pages/footsize-converter'
import About from './pages/about'
import Privacy from './pages/privacy'
import Terms from './pages/terms'
import Settings from './pages/settings'
import NotFound from './pages/not-found'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/text-case" element={<TextCase />} />
      <Route path="/color-picker" element={<ColorPicker />} />
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
  )
}

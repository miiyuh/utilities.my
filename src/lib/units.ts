// Unit definitions for the Unit Converter. Linear units convert through a
// base unit by an exact factor; temperature and fuel economy use functions.

export interface Unit {
  id: string
  /** Plural name, as in a list: "Kilometres". */
  name: string
  /** Short symbol for results: "km". */
  symbol: string
  /** How many base units one of this unit is (linear units). */
  factor?: number
  /** For non-linear units: to and from the base unit. */
  toBase?: (x: number) => number
  fromBase?: (x: number) => number
}

export interface Category {
  id: string
  name: string
  /** Base unit, for "How this works". */
  base: string
  units: Unit[]
  /** Common pairs offered as one-tap shortcuts: [from, to]. */
  pairs: [string, string][]
}

const u = (id: string, name: string, symbol: string, factor: number): Unit => ({ id, name, symbol, factor })

export const CATEGORIES: Category[] = [
  {
    id: 'length',
    name: 'Length',
    base: 'metre',
    units: [
      u('m', 'Metres', 'm', 1),
      u('km', 'Kilometres', 'km', 1000),
      u('cm', 'Centimetres', 'cm', 0.01),
      u('mm', 'Millimetres', 'mm', 0.001),
      u('mi', 'Miles', 'mi', 1609.344),
      u('yd', 'Yards', 'yd', 0.9144),
      u('ft', 'Feet', 'ft', 0.3048),
      u('in', 'Inches', 'in', 0.0254),
      u('nmi', 'Nautical miles', 'nmi', 1852),
    ],
    pairs: [['km', 'mi'], ['cm', 'in'], ['m', 'ft']],
  },
  {
    id: 'weight',
    name: 'Weight',
    base: 'kilogram',
    units: [
      u('kg', 'Kilograms', 'kg', 1),
      u('g', 'Grams', 'g', 0.001),
      u('mg', 'Milligrams', 'mg', 0.000001),
      u('t', 'Tonnes', 't', 1000),
      u('lb', 'Pounds', 'lb', 0.45359237),
      u('oz', 'Ounces', 'oz', 0.028349523125),
      u('st', 'Stones', 'st', 6.35029318),
    ],
    pairs: [['kg', 'lb'], ['g', 'oz'], ['kg', 'st']],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    base: 'kelvin',
    units: [
      { id: 'c', name: 'Celsius', symbol: '°C', toBase: (x) => x + 273.15, fromBase: (k) => k - 273.15 },
      { id: 'f', name: 'Fahrenheit', symbol: '°F', toBase: (f) => ((f - 32) * 5) / 9 + 273.15, fromBase: (k) => ((k - 273.15) * 9) / 5 + 32 },
      { id: 'k', name: 'Kelvin', symbol: 'K', toBase: (x) => x, fromBase: (k) => k },
    ],
    pairs: [['c', 'f'], ['c', 'k']],
  },
  {
    id: 'volume',
    name: 'Volume',
    base: 'litre',
    units: [
      u('l', 'Litres', 'L', 1),
      u('ml', 'Millilitres', 'mL', 0.001),
      u('m3', 'Cubic metres', 'm³', 1000),
      u('gal', 'US gallons', 'US gal', 3.785411784),
      u('galuk', 'UK gallons', 'UK gal', 4.54609),
      u('qt', 'US quarts', 'US qt', 0.946352946),
      u('pt', 'US pints', 'US pt', 0.473176473),
      u('cup', 'US cups', 'cup', 0.2365882365),
      u('floz', 'US fluid ounces', 'US fl oz', 0.0295735295625),
      u('tbsp', 'Tablespoons (15 mL)', 'tbsp', 0.015),
      u('tsp', 'Teaspoons (5 mL)', 'tsp', 0.005),
    ],
    pairs: [['l', 'gal'], ['ml', 'floz'], ['ml', 'cup']],
  },
  {
    id: 'area',
    name: 'Area',
    base: 'square metre',
    units: [
      u('m2', 'Square metres', 'm²', 1),
      u('km2', 'Square kilometres', 'km²', 1_000_000),
      u('cm2', 'Square centimetres', 'cm²', 0.0001),
      u('ha', 'Hectares', 'ha', 10_000),
      u('ac', 'Acres', 'ac', 4046.8564224),
      u('ft2', 'Square feet', 'ft²', 0.09290304),
      u('in2', 'Square inches', 'in²', 0.00064516),
    ],
    pairs: [['ft2', 'm2'], ['ac', 'ha'], ['ha', 'm2']],
  },
  {
    id: 'speed',
    name: 'Speed',
    base: 'metre per second',
    units: [
      u('kmh', 'Kilometres per hour', 'km/h', 1000 / 3600),
      u('mph', 'Miles per hour', 'mph', 1609.344 / 3600),
      u('ms', 'Metres per second', 'm/s', 1),
      u('kn', 'Knots', 'kn', 1852 / 3600),
    ],
    pairs: [['kmh', 'mph'], ['ms', 'kmh'], ['kn', 'kmh']],
  },
  {
    id: 'pressure',
    name: 'Pressure',
    base: 'pascal',
    units: [
      u('psi', 'Pounds per square inch', 'psi', 6894.757293168),
      u('bar', 'Bars', 'bar', 100_000),
      u('kpa', 'Kilopascals', 'kPa', 1000),
      u('pa', 'Pascals', 'Pa', 1),
      u('atm', 'Atmospheres', 'atm', 101_325),
      u('mmhg', 'Millimetres of mercury', 'mmHg', 133.322387415),
    ],
    pairs: [['psi', 'bar'], ['psi', 'kpa'], ['bar', 'kpa']],
  },
  {
    id: 'energy',
    name: 'Energy',
    base: 'joule',
    units: [
      u('kcal', 'Kilocalories', 'kcal', 4184),
      u('kj', 'Kilojoules', 'kJ', 1000),
      u('j', 'Joules', 'J', 1),
      u('wh', 'Watt-hours', 'Wh', 3600),
      u('kwh', 'Kilowatt-hours', 'kWh', 3_600_000),
    ],
    pairs: [['kcal', 'kj'], ['kwh', 'kj']],
  },
  {
    id: 'fuel',
    name: 'Fuel economy',
    base: 'kilometre per litre',
    units: [
      { id: 'kml', name: 'Kilometres per litre', symbol: 'km/L', toBase: (x) => x, fromBase: (b) => b },
      // Litres per 100 km is the inverse: more litres means fewer km per litre.
      { id: 'l100', name: 'Litres per 100 km', symbol: 'L/100 km', toBase: (x) => 100 / x, fromBase: (b) => 100 / b },
      { id: 'mpgus', name: 'Miles per US gallon', symbol: 'mpg (US)', toBase: (x) => (x * 1.609344) / 3.785411784, fromBase: (b) => (b * 3.785411784) / 1.609344 },
      { id: 'mpguk', name: 'Miles per UK gallon', symbol: 'mpg (UK)', toBase: (x) => (x * 1.609344) / 4.54609, fromBase: (b) => (b * 4.54609) / 1.609344 },
    ],
    pairs: [['kml', 'l100'], ['l100', 'mpgus'], ['kml', 'mpguk']],
  },
  {
    id: 'time',
    name: 'Time',
    base: 'second',
    units: [
      u('s', 'Seconds', 's', 1),
      u('min', 'Minutes', 'min', 60),
      u('h', 'Hours', 'h', 3600),
      u('d', 'Days', 'd', 86_400),
      u('wk', 'Weeks', 'wk', 604_800),
    ],
    pairs: [['h', 'min'], ['d', 'h'], ['wk', 'd']],
  },
  {
    id: 'storage',
    name: 'Storage',
    base: 'byte',
    units: [
      u('b', 'Bits', 'bit', 0.125),
      u('B', 'Bytes', 'B', 1),
      u('KB', 'Kilobytes', 'KB', 1e3),
      u('MB', 'Megabytes', 'MB', 1e6),
      u('GB', 'Gigabytes', 'GB', 1e9),
      u('TB', 'Terabytes', 'TB', 1e12),
      u('KiB', 'Kibibytes', 'KiB', 1024),
      u('MiB', 'Mebibytes', 'MiB', 1024 ** 2),
      u('GiB', 'Gibibytes', 'GiB', 1024 ** 3),
      u('TiB', 'Tebibytes', 'TiB', 1024 ** 4),
    ],
    pairs: [['GB', 'GiB'], ['TB', 'GB'], ['MB', 'MiB']],
  },
  {
    id: 'data',
    name: 'Internet speed',
    base: 'bit per second',
    units: [
      u('Mbps', 'Megabits per second', 'Mbps', 1e6),
      u('MBps', 'Megabytes per second', 'MB/s', 8e6),
      u('Gbps', 'Gigabits per second', 'Gbps', 1e9),
      u('kbps', 'Kilobits per second', 'kbps', 1e3),
      u('bps', 'Bits per second', 'bps', 1),
      u('kBps', 'Kilobytes per second', 'kB/s', 8e3),
    ],
    pairs: [['Mbps', 'MBps'], ['Gbps', 'Mbps']],
  },
]

export function convert(value: number, from: Unit, to: Unit): number {
  const base = from.factor != null ? value * from.factor : from.toBase!(value)
  return to.factor != null ? base / to.factor : to.fromBase!(base)
}

/**
 * Rounds to the chosen decimal places, but never rounds a small non-zero
 * answer down to 0: it keeps three significant figures instead.
 */
export function roundForDisplay(n: number, decimals: number, keepZeros: boolean): string {
  if (!Number.isFinite(n)) return ''
  if (n !== 0 && Math.abs(n) < 10 ** -decimals) return String(Number(n.toPrecision(3)))
  let s = n.toFixed(decimals)
  if (!keepZeros && s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '')
  return s === '-0' ? '0' : s
}

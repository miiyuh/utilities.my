import React, { useCallback, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowsLeftRight, Ruler, Thermometer, Cube, Square, Gauge, Clock, Scales, WifiHigh, HardDrive } from 'phosphor-react';
import { Sidebar, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from "@/components/page-header";

type LinearUnit = { value: string; label: string; factor: number };
type AffineUnit = { value: string; label: string; toBase: (x: number) => number; fromBase: (x: number) => number };
type Unit = LinearUnit | AffineUnit;
interface UnitCategory { name: string; units: Unit[] }

const isLinear = (u: Unit): u is LinearUnit => 'factor' in u;

const UNIT_CATEGORIES: UnitCategory[] = [
  {
    name: 'Length',
    units: [
      { value: 'meter', label: 'Metres (m)', factor: 1 },
      { value: 'kilometer', label: 'Kilometres (km)', factor: 1000 },
      { value: 'centimeter', label: 'Centimetres (cm)', factor: 0.01 },
      { value: 'millimeter', label: 'Millimetres (mm)', factor: 0.001 },
      { value: 'mile', label: 'Miles (mi)', factor: 1609.344 },
      { value: 'yard', label: 'Yards (yd)', factor: 0.9144 },
      { value: 'foot', label: 'Feet (ft)', factor: 0.3048 },
      { value: 'inch', label: 'Inches (in)', factor: 0.0254 },
    ],
  },
  {
    name: 'Weight',
    units: [
      { value: 'kilogram', label: 'Kilograms (kg)', factor: 1 },
      { value: 'gram', label: 'Grams (g)', factor: 0.001 },
      { value: 'milligram', label: 'Milligrams (mg)', factor: 0.000001 },
      { value: 'pound', label: 'Pounds (lb)', factor: 0.45359237 },
      { value: 'ounce', label: 'Ounces (oz)', factor: 0.028349523125 },
      { value: 'stone', label: 'Stones (st)', factor: 6.35029318 },
    ],
  },
  {
    name: 'Temperature',
    units: [
      { value: 'celsius', label: 'Celsius (°C)', toBase: x => x + 273.15, fromBase: k => k - 273.15 },
      { value: 'fahrenheit', label: 'Fahrenheit (°F)', toBase: f => (f - 32) * 5 / 9 + 273.15, fromBase: k => (k - 273.15) * 9 / 5 + 32 },
      { value: 'kelvin', label: 'Kelvin (K)', toBase: x => x, fromBase: k => k },
    ],
  },
  {
    name: 'Volume',
    units: [
      { value: 'liter', label: 'Litres (L)', factor: 1 },
      { value: 'milliliter', label: 'Millilitres (mL)', factor: 0.001 },
      { value: 'cubic_meter', label: 'Cubic metres (m³)', factor: 1000 },
      { value: 'gallon_us', label: 'Gallons (US)', factor: 3.785411784 },
      { value: 'quart_us', label: 'Quarts (US)', factor: 0.946352946 },
      { value: 'pint_us', label: 'Pints (US)', factor: 0.473176473 },
      { value: 'cup_us', label: 'Cups (US)', factor: 0.2365882365 },
      { value: 'fluid_ounce_us', label: 'Fluid ounces (US fl oz)', factor: 0.0295735295625 },
    ],
  },
  {
    name: 'Area',
    units: [
      { value: 'square_meter', label: 'Square metres (m²)', factor: 1 },
      { value: 'square_kilometer', label: 'Square kilometres (km²)', factor: 1_000_000 },
      { value: 'square_centimeter', label: 'Square centimetres (cm²)', factor: 0.0001 },
      { value: 'hectare', label: 'Hectares (ha)', factor: 10_000 },
      { value: 'acre', label: 'Acres (ac)', factor: 4046.8564224 },
      { value: 'square_foot', label: 'Square feet (ft²)', factor: 0.09290304 },
      { value: 'square_inch', label: 'Square inches (in²)', factor: 0.00064516 },
    ],
  },
  {
    name: 'Speed',
    units: [
      { value: 'meter_per_second', label: 'Metres/second (m/s)', factor: 1 },
      { value: 'kilometer_per_hour', label: 'Kilometres/hour (km/h)', factor: 1000 / 3600 },
      { value: 'mile_per_hour', label: 'Miles/hour (mph)', factor: 1609.344 / 3600 },
      { value: 'knot', label: 'Knots (kn)', factor: 1852 / 3600 },
    ],
  },
  {
    name: 'Time',
    units: [
      { value: 'second', label: 'Seconds (s)', factor: 1 },
      { value: 'minute', label: 'Minutes (min)', factor: 60 },
      { value: 'hour', label: 'Hours (h)', factor: 3600 },
      { value: 'day', label: 'Days (d)', factor: 86400 },
      { value: 'week', label: 'Weeks (wk)', factor: 604800 },
    ],
  },
  {
    name: 'Storage',
    units: [
      { value: 'bit', label: 'Bits (b)', factor: 0.125 },
      { value: 'byte', label: 'Bytes (B)', factor: 1 },
      { value: 'kilobyte', label: 'Kilobytes (KB)', factor: 1000 },
      { value: 'megabyte', label: 'Megabytes (MB)', factor: 1000000 },
      { value: 'gigabyte', label: 'Gigabytes (GB)', factor: 1000000000 },
      { value: 'terabyte', label: 'Terabytes (TB)', factor: 1000000000000 },
      { value: 'petabyte', label: 'Petabytes (PB)', factor: 1000000000000000 },
      { value: 'kibibyte', label: 'Kibibytes (KiB)', factor: 1024 },
      { value: 'mebibyte', label: 'Mebibytes (MiB)', factor: 1048576 },
      { value: 'gibibyte', label: 'Gibibytes (GiB)', factor: 1073741824 },
      { value: 'tebibyte', label: 'Tebibytes (TiB)', factor: 1099511627776 },
    ],
  },
  {
    name: 'Internet Speed',
    units: [
      { value: 'bit_per_second', label: 'Bits/second (bps)', factor: 1 },
      { value: 'kilobit_per_second', label: 'Kilobits/second (Kbps)', factor: 1000 },
      { value: 'megabit_per_second', label: 'Megabits/second (Mbps)', factor: 1000000 },
      { value: 'gigabit_per_second', label: 'Gigabits/second (Gbps)', factor: 1000000000 },
      { value: 'byte_per_second', label: 'Bytes/second (B/s)', factor: 8 },
      { value: 'kilobyte_per_second', label: 'Kilobytes/second (KB/s)', factor: 8000 },
      { value: 'megabyte_per_second', label: 'Megabytes/second (MB/s)', factor: 8000000 },
      { value: 'gigabyte_per_second', label: 'Gigabytes/second (GB/s)', factor: 8000000000 },
    ],
  },
];

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Length: Ruler,
  Weight: Scales,
  Temperature: Thermometer,
  Volume: Cube,
  Area: Square,
  Speed: Gauge,
  Time: Clock,
  Storage: HardDrive,
  'Internet Speed': WifiHigh,
};

function convert(val: number, from: Unit, to: Unit): number {
  const base = isLinear(from) ? val * from.factor : from.toBase(val);
  return isLinear(to) ? base / to.factor : to.fromBase(base);
}

function formatNumber(n: number, precision: number, keepZeros: boolean): string {
  if (!isFinite(n)) return '';
  let s = n.toFixed(precision);
  if (!keepZeros) s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return s;
}

export default function UnitConverterPage() {
  const [categoryName, setCategoryName] = useState(UNIT_CATEGORIES[0].name);
  const category = useMemo(() => UNIT_CATEGORIES.find(c => c.name === categoryName) ?? UNIT_CATEGORIES[0], [categoryName]);

  const [fromUnitValue, setFromUnitValue] = useState(category.units[0].value);
  const [toUnitValue, setToUnitValue] = useState(category.units[1]?.value ?? category.units[0].value);

  // Single source of truth: whichever side the user is actively typing into.
  const [editingSide, setEditingSide] = useState<'from' | 'to'>('from');
  const [rawValue, setRawValue] = useState('1');

  const [precision, setPrecision] = useState(6);
  const [keepZeros, setKeepZeros] = useState(false);

  const fromUnit = category.units.find(u => u.value === fromUnitValue) ?? category.units[0];
  const toUnit = category.units.find(u => u.value === toUnitValue) ?? category.units[1] ?? category.units[0];

  const parsedRaw = parseFloat(rawValue);
  const derivedValue = useMemo(() => {
    if (isNaN(parsedRaw)) return '';
    const [src, dst] = editingSide === 'from' ? [fromUnit, toUnit] : [toUnit, fromUnit];
    return formatNumber(convert(parsedRaw, src, dst), precision, keepZeros);
  }, [parsedRaw, editingSide, fromUnit, toUnit, precision, keepZeros]);

  const fromValue = editingSide === 'from' ? rawValue : derivedValue;
  const toValue = editingSide === 'to' ? rawValue : derivedValue;

  const handleCategoryChange = (name: string) => {
    setCategoryName(name);
    const nextCategory = UNIT_CATEGORIES.find(c => c.name === name) ?? UNIT_CATEGORIES[0];
    setFromUnitValue(nextCategory.units[0].value);
    setToUnitValue(nextCategory.units[1]?.value ?? nextCategory.units[0].value);
    setEditingSide('from');
    setRawValue('1');
  };

  const handleSwap = useCallback(() => {
    setFromUnitValue(toUnitValue);
    setToUnitValue(fromUnitValue);
    setEditingSide(side => (side === 'from' ? 'to' : 'from'));
  }, [fromUnitValue, toUnitValue]);

  const summary = useMemo(() => {
    if (!rawValue || rawValue.trim() === '') return `Enter a value to convert ${fromUnit.label} → ${toUnit.label}`;
    if (isNaN(parsedRaw) || derivedValue === '') return `Enter a valid number to see ${fromUnit.label} → ${toUnit.label}`;
    return `${fromValue} ${fromUnit.label} = ${toValue} ${toUnit.label}`;
  }, [rawValue, parsedRaw, derivedValue, fromUnit, toUnit, fromValue, toValue]);

  return (
    <>
      <Helmet>
        <title>Unit Converter | utilities.my</title>
        <meta name="description" content="Convert between length, weight, temperature, volume, area, speed, time, storage, and internet speed units. Free online unit converter." />
        <link rel="canonical" href="https://utilities.my/unit-converter" />
      </Helmet>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={Ruler} title="Unit Converter" />

        <div className="flex flex-1 flex-col px-4 p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8">
            <div className="mb-8 hidden sm:block">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Unit Converter</h1>
              <p className="text-lg text-muted-foreground max-w-3xl">Convert between units with live two-way input and precision control.</p>
            </div>

            <Card className="w-full shadow-sm">
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="category" className="mb-1.5 block">Category</Label>
                  <Select value={categoryName} onValueChange={handleCategoryChange}>
                    <SelectTrigger id="category" className="w-full sm:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[50vh]">
                      {UNIT_CATEGORIES.map(cat => {
                        const Icon = CATEGORY_ICONS[cat.name] ?? Ruler;
                        return (
                          <SelectItem key={cat.name} value={cat.name}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span>{cat.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
                  <div>
                    <Label htmlFor="fromValue" className="mb-1.5 block">From</Label>
                    <div className="flex gap-2">
                      <Input
                        id="fromValue"
                        type="number"
                        inputMode="decimal"
                        value={fromValue}
                        onChange={(e) => { setEditingSide('from'); setRawValue(e.target.value); }}
                        placeholder="0"
                        className="font-mono"
                      />
                      <CopyButton value={() => fromValue} label="" title="Copy" disabled={!fromValue} />
                    </div>
                    <Select value={fromUnitValue} onValueChange={setFromUnitValue}>
                      <SelectTrigger className="w-full mt-2">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[40vh]">
                        {category.units.map((u) => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-center md:pb-16">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleSwap}
                      title="Swap units"
                    >
                      <ArrowsLeftRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="toValue" className="mb-1.5 block">To</Label>
                    <div className="flex gap-2">
                      <Input
                        id="toValue"
                        type="number"
                        inputMode="decimal"
                        value={toValue}
                        onChange={(e) => { setEditingSide('to'); setRawValue(e.target.value); }}
                        placeholder="0"
                        className="font-mono"
                      />
                      <CopyButton value={() => toValue} label="" title="Copy" disabled={!toValue} />
                    </div>
                    <Select value={toUnitValue} onValueChange={setToUnitValue}>
                      <SelectTrigger className="w-full mt-2">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[40vh]">
                        {category.units.map((u) => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-5 bg-muted/40 border border-border rounded-2xl text-center font-medium text-base sm:text-lg text-primary break-words animate-in fade-in-0 duration-quick ease-smooth-out">
                  {summary}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border">
                  <div className="flex items-center gap-3 pt-4">
                    <Label htmlFor="precision" className="whitespace-nowrap">Precision:</Label>
                    <Select value={String(precision)} onValueChange={(v) => setPrecision(Number(v))}>
                      <SelectTrigger id="precision" className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
                          <SelectItem key={p} value={String(p)}>{p} decimals</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <Checkbox id="zeros" checked={keepZeros} onCheckedChange={(c) => setKeepZeros(Boolean(c))} />
                    <Label htmlFor="zeros" className="font-normal cursor-pointer select-none">Keep trailing zeros</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

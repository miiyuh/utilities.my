
"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowRightLeft, Copy, Ruler, Thermometer, Box, Square, Gauge, Clock, Dumbbell } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Checkbox } from '@/components/ui/checkbox';

type LinearUnit = { value: string; label: string; factor: number };
type AffineUnit = { value: string; label: string; toBase: (x:number)=>number; fromBase: (x:number)=>number };
type Unit = LinearUnit | AffineUnit;
interface UnitCategory { name: string; baseUnit: string; units: Unit[]; }

const isLinear = (u: Unit): u is LinearUnit => 'factor' in u;

const unitCategories: UnitCategory[] = [
  {
    name: 'Length', baseUnit: 'meter',
    units: [
      { value: 'meter', label: 'Meters (m)', factor: 1 },
      { value: 'kilometer', label: 'Kilometers (km)', factor: 1000 },
      { value: 'centimeter', label: 'Centimeters (cm)', factor: 0.01 },
      { value: 'millimeter', label: 'Millimeters (mm)', factor: 0.001 },
      { value: 'mile', label: 'Miles (mi)', factor: 1609.344 },
      { value: 'yard', label: 'Yards (yd)', factor: 0.9144 },
      { value: 'foot', label: 'Feet (ft)', factor: 0.3048 },
      { value: 'inch', label: 'Inches (in)', factor: 0.0254 },
    ],
  },
  {
    name: 'Weight', baseUnit: 'kilogram',
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
    name: 'Temperature', baseUnit: 'kelvin',
    units: [
      { value: 'celsius', label: 'Celsius (°C)', toBase: x=> x + 273.15, fromBase: k=> k - 273.15 },
      { value: 'fahrenheit', label: 'Fahrenheit (°F)', toBase: f=> (f - 32) * 5/9 + 273.15, fromBase: k=> (k - 273.15) * 9/5 + 32 },
      { value: 'kelvin', label: 'Kelvin (K)', toBase: x=> x, fromBase: k=> k },
    ],
  },
  {
    name: 'Volume', baseUnit: 'liter',
    units: [
      { value: 'liter', label: 'Liters (L)', factor: 1 },
      { value: 'milliliter', label: 'Milliliters (mL)', factor: 0.001 },
      { value: 'cubic_meter', label: 'Cubic meters (m³)', factor: 1000 },
      { value: 'gallon_us', label: 'Gallons (US)', factor: 3.785411784 },
      { value: 'quart_us', label: 'Quarts (US)', factor: 0.946352946 },
      { value: 'pint_us', label: 'Pints (US)', factor: 0.473176473 },
      { value: 'cup_us', label: 'Cups (US)', factor: 0.2365882365 },
      { value: 'fluid_ounce_us', label: 'Fluid ounces (US fl oz)', factor: 0.0295735295625 },
    ],
  },
  {
    name: 'Area', baseUnit: 'square_meter',
    units: [
      { value: 'square_meter', label: 'Square meters (m²)', factor: 1 },
      { value: 'square_kilometer', label: 'Square kilometers (km²)', factor: 1_000_000 },
      { value: 'square_centimeter', label: 'Square centimeters (cm²)', factor: 0.0001 },
      { value: 'hectare', label: 'Hectares (ha)', factor: 10_000 },
      { value: 'acre', label: 'Acres (ac)', factor: 4046.8564224 },
      { value: 'square_foot', label: 'Square feet (ft²)', factor: 0.09290304 },
      { value: 'square_inch', label: 'Square inches (in²)', factor: 0.00064516 },
    ],
  },
  {
    name: 'Speed', baseUnit: 'meter_per_second',
    units: [
      { value: 'meter_per_second', label: 'Meters/second (m/s)', factor: 1 },
      { value: 'kilometer_per_hour', label: 'Kilometers/hour (km/h)', factor: 1000/3600 },
      { value: 'mile_per_hour', label: 'Miles/hour (mph)', factor: 1609.344/3600 },
      { value: 'knot', label: 'Knots (kn)', factor: 1852/3600 },
    ],
  },
  {
    name: 'Time', baseUnit: 'second',
    units: [
      { value: 'second', label: 'Seconds (s)', factor: 1 },
      { value: 'minute', label: 'Minutes (min)', factor: 60 },
      { value: 'hour', label: 'Hours (h)', factor: 3600 },
      { value: 'day', label: 'Days (d)', factor: 86400 },
      { value: 'week', label: 'Weeks (wk)', factor: 604800 },
    ],
  },
];

export default function UnitConverterPage() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>(unitCategories[0].name);
  const currentCategory = unitCategories.find(c=> c.name===selectedCategory) || unitCategories[0];

  const [fromUnit, setFromUnit] = useState<string>(currentCategory.units[0].value);
  const [toUnit, setToUnit] = useState<string>(currentCategory.units[1].value);
  const [fromValue, setFromValue] = useState<string>('1');
  const [toValue, setToValue] = useState<string>('');
  const [activeSide, setActiveSide] = useState<'from'|'to'>('from');
  const [precision, setPrecision] = useState<number>(6);
  const [keepZeros, setKeepZeros] = useState<boolean>(false);

  useEffect(()=>{
    // when category changes, reset units appropriately
    setFromUnit(currentCategory.units[0].value);
    setToUnit(currentCategory.units[Math.min(1, currentCategory.units.length-1)].value);
  }, [selectedCategory]);

  const getUnit = (key: string): Unit | undefined => currentCategory.units.find(u=> u.value===key);

  const convert = (val: number, from: Unit, to: Unit): number => {
    const base = isLinear(from) ? val * from.factor : from.toBase(val);
    const out = isLinear(to) ? base / to.factor : to.fromBase(base);
    return out;
  };

  const format = (n: number): string => {
    if (!isFinite(n)) return '';
    let s = n.toFixed(precision);
    if (!keepZeros) s = s.replace(/\.0+$|(?<=\.\d*?)0+$/,'').replace(/\.$/,'');
    return s;
  };

  const recalc = (origin: 'from'|'to', input: string) => {
    const val = parseFloat(input);
    const uFrom = getUnit(fromUnit); const uTo = getUnit(toUnit);
    if (!uFrom || !uTo || isNaN(val)) { origin==='from'? setToValue('') : setFromValue(''); return; }
    if (origin==='from') {
      const out = convert(val, uFrom, uTo);
      setToValue(format(out));
    } else {
      const out = convert(val, uTo, uFrom);
      setFromValue(format(out));
    }
  };

  const getCategoryIcon = (name: string) => {
    const cls = "h-4 w-4 text-muted-foreground";
    switch (name) {
      case 'Length': return <Ruler className={cls} />;
      case 'Weight': return <Dumbbell className={cls} />;
      case 'Temperature': return <Thermometer className={cls} />;
      case 'Volume': return <Box className={cls} />;
      case 'Area': return <Square className={cls} />;
      case 'Speed': return <Gauge className={cls} />;
      case 'Time': return <Clock className={cls} />;
      default: return <Ruler className={cls} />;
    }
  };

  const getUnitLabel = (val: string): string => {
    const u = currentCategory.units.find(u=> u.value===val);
    // for Linear or Affine units we stored label in the same key
    // @ts-ignore - both shapes have label
    return u?.label ?? val;
  };

  // Recalc when units or settings change, using active side as source
  useEffect(()=>{ recalc(activeSide, activeSide==='from'? fromValue : toValue); }, [fromUnit, toUnit, precision, keepZeros]);

  const handleSwapUnits = () => {
    setFromUnit(toUnit); setToUnit(fromUnit);
    // values swap as well
    const fv = fromValue; const tv = toValue; setFromValue(tv); setToValue(fv);
  };

  const copy = async (text: string) => {
    if (!text) { toast({ title: 'Nothing to copy', description: 'Value is empty.', variant: 'destructive' }); return; }
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!', description: 'Converted value has been copied.' });
  };

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold font-headline">Unit Converter</h1>
            </div>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 lg:pb-24">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Unit Converter</h1>
              <p className="text-lg text-muted-foreground">Convert between units with live two-way input, precision control, and more categories.</p>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <Card className="w-full mx-auto shadow-sm">
                <CardContent className="space-y-6 p-6 lg:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger id="category">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(selectedCategory)}
                            <span>{selectedCategory}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {unitCategories.map(cat => (
                            <SelectItem key={cat.name} value={cat.name}>
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(cat.name)}
                                <span>{cat.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="precision">Precision</Label>
                      <Select value={String(precision)} onValueChange={(v)=> setPrecision(Number(v))}>
                        <SelectTrigger id="precision"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[0,1,2,3,4,5,6,7,8,9,10].map(p=> (<SelectItem key={p} value={String(p)}>{p} decimals</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="zeros" checked={keepZeros} onCheckedChange={(c)=> setKeepZeros(Boolean(c))} />
                        <Label htmlFor="zeros" className="font-normal">Keep trailing zeros</Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-start md:items-end gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromValue">From</Label>
                      <div className="relative">
                        <Input id="fromValue" type="number" value={fromValue} onChange={(e)=> { setFromValue(e.target.value); setActiveSide('from'); recalc('from', e.target.value); }} placeholder="Enter value" className="pr-10" />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1.5 top-1/2 -translate-y-1/2" onClick={()=> copy(fromValue)} disabled={!fromValue} title="Copy">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Select value={fromUnit} onValueChange={(v)=> { setFromUnit(v); }}>
                        <SelectTrigger>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(selectedCategory)}
                            <span>{getUnitLabel(fromUnit)}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {currentCategory.units.map(unit => (
                            <SelectItem key={unit.value} value={unit.value}>
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(selectedCategory)}
                                <span>{unit.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSwapUnits}
                      className="justify-self-center self-center my-2 md:my-0"
                      title="Swap units"
                    >
                      <ArrowRightLeft className="h-5 w-5" />
                    </Button>

                    <div className="space-y-2">
                      <Label htmlFor="toValue">To</Label>
                      <div className="relative">
                        <Input id="toValue" type="number" value={toValue} onChange={(e)=> { setToValue(e.target.value); setActiveSide('to'); recalc('to', e.target.value); }} placeholder="Result" className="bg-muted/50 text-lg font-semibold pr-10" />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1.5 top-1/2 -translate-y-1/2" onClick={()=> copy(toValue)} disabled={!toValue} title="Copy">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Select value={toUnit} onValueChange={(v)=> { setToUnit(v); }}>
                        <SelectTrigger>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(selectedCategory)}
                            <span>{getUnitLabel(toUnit)}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {currentCategory.units.map(unit => (
                            <SelectItem key={unit.value} value={unit.value}>
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(selectedCategory)}
                                <span>{unit.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

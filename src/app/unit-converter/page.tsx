
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowRightLeft, Copy, PanelLeft } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

interface Unit {
  value: string;
  label: string;
  factor: number; 
}

interface UnitCategory {
  name: string;
  baseUnit: string;
  units: Unit[];
}

const unitCategories: UnitCategory[] = [
  {
    name: 'Length',
    baseUnit: 'meter',
    units: [
      { value: 'meter', label: 'Meters (m)', factor: 1 },
      { value: 'kilometer', label: 'Kilometers (km)', factor: 1000 },
      { value: 'centimeter', label: 'Centimeters (cm)', factor: 0.01 },
      { value: 'millimeter', label: 'Millimeters (mm)', factor: 0.001 },
      { value: 'mile', label: 'Miles (mi)', factor: 1609.34 },
      { value: 'yard', label: 'Yards (yd)', factor: 0.9144 },
      { value: 'foot', label: 'Feet (ft)', factor: 0.3048 },
      { value: 'inch', label: 'Inches (in)', factor: 0.0254 },
    ],
  },
  {
    name: 'Weight',
    baseUnit: 'kilogram',
    units: [
        { value: 'kilogram', label: 'Kilograms (kg)', factor: 1},
        { value: 'gram', label: 'Grams (g)', factor: 0.001},
        { value: 'milligram', label: 'Milligrams (mg)', factor: 0.000001},
        { value: 'pound', label: 'Pounds (lb)', factor: 0.453592},
        { value: 'ounce', label: 'Ounces (oz)', factor: 0.0283495},
    ]
  },
];

export default function UnitConverterPage() {
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<string>(unitCategories[0].units[0].value);
  const [toUnit, setToUnit] = useState<string>(unitCategories[0].units[1].value);
  const [selectedCategory, setSelectedCategory] = useState<string>(unitCategories[0].name);
  const [outputValue, setOutputValue] = useState<string>('');

  const currentCategory = unitCategories.find(cat => cat.name === selectedCategory) || unitCategories[0];

  useEffect(() => {
    convertUnits();
  }, [inputValue, fromUnit, toUnit, selectedCategory]);
  
  useEffect(() => {
    setFromUnit(currentCategory.units[0].value);
    setToUnit(currentCategory.units.length > 1 ? currentCategory.units[1].value : currentCategory.units[0].value);
  }, [selectedCategory, currentCategory.units]);


  const convertUnits = () => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) {
      setOutputValue('');
      return;
    }

    const fromUnitData = currentCategory.units.find(u => u.value === fromUnit);
    const toUnitData = currentCategory.units.find(u => u.value === toUnit);

    if (!fromUnitData || !toUnitData) {
      setOutputValue('Error: Unit not found');
      return;
    }

    const valueInBaseUnit = val * fromUnitData.factor;
    const result = valueInBaseUnit / toUnitData.factor;
    
    setOutputValue(result.toFixed(6).replace(/\.?0*$/, ''));
  };

  const handleSwapUnits = () => {
    const tempFrom = fromUnit;
    setFromUnit(toUnit);
    setToUnit(tempFrom);
  };

  const handleCopy = async () => {
    if (!outputValue) {
      toast({ title: 'Nothing to copy', description: 'Output is empty.', variant: 'destructive' });
      return;
    }
    try {
      await navigator.clipboard.writeText(outputValue);
      toast({ title: 'Copied to clipboard!', description: 'Converted value has been copied.' });
    } catch (err) {
      toast({ title: 'Copy failed', description: 'Could not copy value.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden">
              <PanelLeft />
            </SidebarTrigger>
            <h1 className="text-xl font-semibold font-headline">Unit Converter</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-lg mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Unit Converter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitCategories.map(cat => (
                        <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-end gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromValue">From</Label>
                    <Input
                      id="fromValue"
                      type="number"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Enter value"
                    />
                    <Select value={fromUnit} onValueChange={setFromUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentCategory.units.map(unit => (
                          <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="ghost" size="icon" onClick={handleSwapUnits} className="self-center mt-5 md:mt-0" title="Swap units">
                    <ArrowRightLeft className="h-5 w-5" />
                  </Button>

                  <div className="space-y-2">
                    <Label htmlFor="toValue">To</Label>
                    <Input
                      id="toValue"
                      type="text"
                      value={outputValue}
                      readOnly
                      placeholder="Result"
                      className="bg-muted/50"
                    />
                    <Select value={toUnit} onValueChange={setToUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentCategory.units.map(unit => (
                          <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                 <Button onClick={handleCopy} title="Copy result" disabled={!outputValue}>
                  <Copy className="mr-2 h-4 w-4" /> Copy Result
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </div>
  );
}

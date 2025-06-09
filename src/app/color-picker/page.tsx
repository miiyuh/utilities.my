
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';

// Helper functions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s: number, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}


export default function ColorPickerPage() {
  const { toast } = useToast();
  const [hexColor, setHexColor] = useState('#1a1a1a'); // Default to foreground color
  const [rgbColor, setRgbColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [hslColor, setHslColor] = useState<{ h: number; s: number; l: number } | null>(null);

  useEffect(() => {
    const rgb = hexToRgb(hexColor);
    setRgbColor(rgb);
    if (rgb) {
      setHslColor(rgbToHsl(rgb.r, rgb.g, rgb.b));
    } else {
      setHslColor(null);
    }
  }, [hexColor]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newHex = e.target.value;
    if (!newHex.startsWith('#')) {
        newHex = '#' + newHex;
    }
    setHexColor(newHex);
  };
  
  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHexColor(e.target.value);
  };


  const copyToClipboard = async (text: string, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} Copied!`, description: `${text} copied to clipboard.` });
    } catch (err) {
      toast({ title: 'Copy Failed', description: `Could not copy ${label}.`, variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Color Picker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Label htmlFor="color-picker-input" className="text-lg">Select Color</Label>
            <Input
              id="color-picker-input"
              type="color"
              value={hexColor}
              onChange={handleColorInputChange}
              className="h-20 w-full cursor-pointer p-1"
            />
            <div
              className="w-full h-24 rounded-md border border-border"
              style={{ backgroundColor: hexColor }}
            />
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="hex-value">HEX</Label>
              <div className="flex items-center gap-2">
                <Input id="hex-value" value={hexColor} onChange={handleHexChange} className="font-code" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(hexColor, 'HEX')} title="Copy HEX">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>RGB</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={rgbColor ? `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})` : 'N/A'}
                  className="font-code bg-muted/30"
                />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(rgbColor ? `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})` : '', 'RGB')} title="Copy RGB" disabled={!rgbColor}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>HSL</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={hslColor ? `hsl(${hslColor.h}, ${hslColor.s}%, ${hslColor.l}%)` : 'N/A'}
                  className="font-code bg-muted/30"
                />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(hslColor ? `hsl(${hslColor.h}, ${hslColor.s}%, ${hslColor.l}%)` : '', 'HSL')} title="Copy HSL" disabled={!hslColor}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground w-full text-center">
                Tip: You can also type a HEX value directly into the input field.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

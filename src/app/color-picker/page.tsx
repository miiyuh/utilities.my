
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Upload, PanelLeft, Palette } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

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
    h = s = 0; 
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

function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  if (r === 0 && g === 0 && b === 0) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }
  
  const rPrime = r / 255;
  const gPrime = g / 255;
  const bPrime = b / 255;

  let kVal = 1 - Math.max(rPrime, gPrime, bPrime);
  
  if (1 - kVal === 0) { // Avoid division by zero for very dark colors close to black
    return { c: 0, m: 0, y: 0, k: Math.round(kVal * 100) };
  }

  const cVal = (1 - rPrime - kVal) / (1 - kVal);
  const mVal = (1 - gPrime - kVal) / (1 - kVal);
  const yVal = (1 - bPrime - kVal) / (1 - kVal);

  return {
    c: Math.round(cVal * 100),
    m: Math.round(mVal * 100),
    y: Math.round(yVal * 100),
    k: Math.round(kVal * 100),
  };
}

const MAGNIFIER_SIZE = 120;
const MAGNIFIER_ZOOM = 4;

export default function ColorPickerPage() {
  const { toast } = useToast();
  const [hexColor, setHexColor] = useState('#1a1a1a'); 
  const [rgbColor, setRgbColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [hslColor, setHslColor] = useState<{ h: number; s: number; l: number } | null>(null);
  const [cmykColor, setCmykColor] = useState<{ c: number; m: number; y: number; k: number } | null>(null);
  
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [magnifierVisible, setMagnifierVisible] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const [magnifiedColor, setMagnifiedColor] = useState('#000000');
  const [mouseOnCanvasPosition, setMouseOnCanvasPosition] = useState({ x: 0, y: 0 });
  const magnifierCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const rgb = hexToRgb(hexColor);
    setRgbColor(rgb);
    if (rgb) {
      setHslColor(rgbToHsl(rgb.r, rgb.g, rgb.b));
      setCmykColor(rgbToCmyk(rgb.r, rgb.g, rgb.b));
    } else {
      setHslColor(null);
      setCmykColor(null);
    }
  }, [hexColor]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let textValue = e.target.value;
    let newHexOutput = textValue;

    if (/^[0-9a-fA-F]{6}$/.test(textValue)) {
      newHexOutput = '#' + textValue;
    } else if (/^[0-9a-fA-F]{3}$/.test(textValue)) {
        newHexOutput = '#' + textValue.split('').map(char => char + char).join('');
    } else if (/^#[0-9a-fA-F]{3}$/.test(textValue)) {
        newHexOutput = '#' + textValue.substring(1).split('').map(char => char + char).join('');
    }
    
    setHexColor(newHexOutput);
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setMagnifierVisible(false); // Hide magnifier if a new image is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (uploadedImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = canvas.parentElement?.clientWidth ? Math.min(400, canvas.parentElement.clientWidth - 20) : 380; // Ensure it fits parent
          const MAX_HEIGHT = 300;
          let { width, height } = img;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round(height * (MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round(width * (MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
        };
        img.src = uploadedImage;
      }
    }
  }, [uploadedImage]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];
      
      const newHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      setHexColor(newHex);
    }
  };

  const handleMouseMoveOnCanvas = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !uploadedImage) return;
    const mainCanvas = canvasRef.current;
    const rect = mainCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setMouseOnCanvasPosition({ x, y });
    // Position magnifier relative to canvas container, offset from cursor
    setMagnifierPosition({ x: x + 15, y: y + 15 }); 

    const ctx = mainCanvas.getContext('2d');
    if (ctx) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];
      setMagnifiedColor(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
    }
  };

  const handleMouseEnterCanvas = () => {
    if (uploadedImage) setMagnifierVisible(true);
  };

  const handleMouseLeaveCanvas = () => {
    setMagnifierVisible(false);
  };

  useEffect(() => {
    if (!magnifierVisible || !canvasRef.current || !magnifierCanvasRef.current || !uploadedImage) return;

    const mainCanvas = canvasRef.current;
    const mainCtx = mainCanvas.getContext('2d');
    const magnCanvas = magnifierCanvasRef.current;
    const magnCtx = magnCanvas.getContext('2d');

    if (!mainCtx || !magnCtx) return;

    magnCtx.imageSmoothingEnabled = false;
    magnCtx.clearRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE);

    const sourceRectSize = MAGNIFIER_SIZE / MAGNIFIER_ZOOM;
    const sourceX = mouseOnCanvasPosition.x - sourceRectSize / 2;
    const sourceY = mouseOnCanvasPosition.y - sourceRectSize / 2;
    
    magnCtx.drawImage(
      mainCanvas,
      sourceX,
      sourceY,
      sourceRectSize,
      sourceRectSize,
      0,
      0,
      MAGNIFIER_SIZE,
      MAGNIFIER_SIZE
    );
  }, [magnifierVisible, mouseOnCanvasPosition, uploadedImage]);


  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold font-headline">Color Picker</h1>
            </div>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Color Picker</h1>
              <p className="text-lg text-muted-foreground">Pick colors and get their codes in various formats.</p>
            </div>
            
            <div className="space-y-8">            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Panel: Color Inputs & Derived Codes */}
              <Card>
                <CardHeader className="pb-6">
                  <CardTitle>Color Input & Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-6">
                    <Label htmlFor="hex-value" className="text-center block text-lg font-medium">Input HEX or Pick Visually</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="color-picker-swatch"
                        type="color"
                        value={(/^#[0-9a-fA-F]{6}$/i.test(hexColor) || /^#[0-9a-fA-F]{3}$/i.test(hexColor)) ? hexColor : '#000000'}
                        onChange={handleColorInputChange}
                        className="h-16 w-16 md:h-20 md:w-20 shrink-0 cursor-pointer p-0.5 border-0 rounded-md overflow-hidden shadow-sm"
                        aria-label="Visual color picker"
                      />
                      <div
                        className="flex-grow h-16 md:h-20 rounded-md border border-input shadow-inner"
                        style={{ backgroundColor: hexColor }}
                        aria-label={`Current color preview: ${hexColor}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="hex-value-input">HEX Value</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="hex-value-input" 
                          value={hexColor} 
                          onChange={handleHexChange} 
                          className="font-mono" 
                          placeholder="#RRGGBB, fff, #abc..."
                        />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(hexColor, 'HEX')} title="Copy HEX">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-md font-medium text-muted-foreground">Derived Color Codes</h3>
                    <div>
                      <Label>RGB</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={rgbColor ? `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})` : 'N/A'}
                          className="font-mono bg-muted/30"
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
                          className="font-mono bg-muted/30"
                        />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(hslColor ? `hsl(${hslColor.h}, ${hslColor.s}%, ${hslColor.l}%)` : '', 'HSL')} title="Copy HSL" disabled={!hslColor}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label>CMYK</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={cmykColor ? `cmyk(${cmykColor.c}%, ${cmykColor.m}%, ${cmykColor.y}%, ${cmykColor.k}%)` : 'N/A'}
                          className="font-mono bg-muted/30"
                        />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(cmykColor ? `cmyk(${cmykColor.c}%, ${cmykColor.m}%, ${cmykColor.y}%, ${cmykColor.k}%)` : '', 'CMYK')} title="Copy CMYK" disabled={!cmykColor}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                    <p className="text-xs text-muted-foreground w-full text-center">
                        Tip: Type a HEX value (e.g., #RRGGBB or RRGGBB) or use the visual picker.
                    </p>
                </CardFooter>
              </Card>

              {/* Right Panel: Pick from Image & Magnifier */}
              <Card>
                <CardHeader>
                  <CardTitle>Pick Color from Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    id="image-upload-button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" /> Upload Image
                  </Button>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {uploadedImage ? (
                    <div className="flex flex-col items-center space-y-2 relative">
                      <p className="text-sm text-muted-foreground">Click on the image to pick a color. Hover to magnify.</p>
                      <canvas
                        ref={canvasRef}
                        onMouseMove={handleMouseMoveOnCanvas}
                        onMouseEnter={handleMouseEnterCanvas}
                        onMouseLeave={handleMouseLeaveCanvas}
                        onClick={handleCanvasClick}
                        className="rounded-md border border-border cursor-crosshair max-w-full shadow-sm"
                        style={{ touchAction: 'none' }} 
                      />
                      {magnifierVisible && (
                        <div
                          style={{
                            left: `${magnifierPosition.x}px`,
                            top: `${magnifierPosition.y}px`,
                            width: `${MAGNIFIER_SIZE}px`,
                            height: `${MAGNIFIER_SIZE}px`,
                          }}
                          className="absolute z-50 pointer-events-none border-2 border-primary bg-background/90 shadow-lg rounded-full flex flex-col items-center justify-center overflow-hidden"
                        >
                          <canvas
                            ref={magnifierCanvasRef}
                            width={MAGNIFIER_SIZE}
                            height={MAGNIFIER_SIZE}
                            className="absolute inset-0"
                          />
                          {/* Crosshair */}
                          <div style={{width: '1px', height: '100%'}} className="absolute left-1/2 bg-red-500/70 -translate-x-1/2"></div>
                          <div style={{height: '1px', width: '100%'}} className="absolute top-1/2 bg-red-500/70 -translate-y-1/2"></div>
                          
                          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-black/70 text-white px-2 py-0.5 rounded text-[10px] font-mono shadow">
                            {magnifiedColor}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Upload an image to extract colors</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}


"use client";

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, Download, Settings2, Upload, Trash2 } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { QRCodeCanvas } from 'qrcode.react';
import { Slider } from '@/components/ui/slider';

// Helper function to validate HEX color
const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/i.test(color);
};

// Helper function to convert HEX to RGB object
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

export default function QrCodeGeneratorPage() {
  const { toast } = useToast();
  const [inputText, setInputText] = useState(''); // 1. Empty input box by default
  const [qrSize, setQrSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColorHex, setBgColorHex] = useState('#FFFFFF'); // Store only HEX part
  const [bgOpacity, setBgOpacity] = useState(1); // 0 (transparent) to 1 (opaque)

  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(0.15); // Relative size to QR code (15%)
  const qrRef = useRef<HTMLDivElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);


  const handleDownload = () => {
    if (!inputText) {
      toast({ title: 'Input Empty', description: 'Please enter text or URL to generate a QR code.', variant: 'destructive' });
      return;
    }
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const pngUrl = canvas
          .toDataURL('image/png')
          .replace('image/png', 'image/octet-stream');
        let downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'qrcode.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadLink.href);
        toast({ title: 'QR Code Downloaded', description: 'qrcode.png has been downloaded.' });
      }
    }
  };
  
  const getFinalBgColor = (): string => {
    if (!isValidHexColor(bgColorHex)) return `rgba(255, 255, 255, ${bgOpacity})`; // Default to white if hex is invalid
    const rgb = hexToRgb(bgColorHex);
    if (!rgb) return `rgba(255, 255, 255, ${bgOpacity})`; // Fallback
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${bgOpacity})`;
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoSrc(e.target?.result as string);
        toast({ title: 'Logo Uploaded', description: file.name });
      };
      reader.readAsDataURL(file);
    } else {
      setLogoSrc(null);
    }
  };

  const clearLogo = () => {
    setLogoSrc(null);
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = "";
    }
    toast({ title: 'Logo Cleared' });
  };
  
  const handleHexColorInput = (value: string, setColorHex: React.Dispatch<React.SetStateAction<string>>) => {
    let newHex = value;
    if (!newHex.startsWith('#')) {
      newHex = '#' + newHex;
    }
    // Basic validation for length, could be more complex for 3-char hex, etc.
    if (/^#[0-9A-Fa-f]{0,6}$/i.test(newHex)) {
       setColorHex(newHex);
    } else if (value === "" || value === "#") { // Allow clearing or starting with #
       setColorHex(value);
    }
  };


  return (
    <>
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
            <h1 className="text-xl font-semibold font-headline">QR Code Generator</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-lg mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">QR Code Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="qrText">Text or URL</Label>
                  <Input
                    id="qrText"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text or URL for QR code"
                  />
                </div>
                
                {inputText && (
                  <div ref={qrRef} className="flex justify-center p-4 bg-muted/20 rounded-md">
                    <QRCodeCanvas
                      value={inputText}
                      size={qrSize}
                      fgColor={isValidHexColor(fgColor) ? fgColor : '#000000'}
                      bgColor={getFinalBgColor()}
                      level="H" // High error correction for better logo readability
                      imageSettings={logoSrc ? {
                        src: logoSrc,
                        height: qrSize * logoSize,
                        width: qrSize * logoSize,
                        excavate: true,
                      } : undefined}
                    />
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium flex items-center"><Settings2 className="mr-2 h-5 w-5" /> Customization</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="qrSize">QR Code Size: {qrSize}px</Label>
                    <Slider
                      id="qrSize"
                      min={64}
                      max={512}
                      step={16}
                      value={[qrSize]}
                      onValueChange={(value) => setQrSize(value[0])}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fgColorText">Foreground Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="fgColorText"
                          type="text"
                          value={fgColor}
                          onChange={(e) => handleHexColorInput(e.target.value, setFgColor)}
                          placeholder="#000000"
                          className="font-mono flex-grow"
                        />
                        <Input
                          id="fgColorSwatch"
                          type="color"
                          value={isValidHexColor(fgColor) ? fgColor : '#000000'}
                          onChange={(e) => setFgColor(e.target.value)}
                          className="h-10 w-12 min-w-[3rem] p-1 cursor-pointer flex-shrink-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bgColorText">Background Color (HEX)</Label>
                       <div className="flex items-center gap-2">
                        <Input
                          id="bgColorText"
                          type="text"
                          value={bgColorHex}
                          onChange={(e) => handleHexColorInput(e.target.value, setBgColorHex)}
                          placeholder="#FFFFFF"
                          className="font-mono flex-grow"
                        />
                        <Input
                          id="bgColorSwatch"
                          type="color"
                          value={isValidHexColor(bgColorHex) ? bgColorHex : '#FFFFFF'}
                          onChange={(e) => setBgColorHex(e.target.value)}
                          className="h-10 w-12 min-w-[3rem] p-1 cursor-pointer flex-shrink-0"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="bgOpacity">Background Opacity: {Math.round(bgOpacity * 100)}%</Label>
                      <Slider
                        id="bgOpacity"
                        min={0}
                        max={100}
                        step={1}
                        value={[bgOpacity * 100]}
                        onValueChange={(val) => setBgOpacity(val[0] / 100)}
                      />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Logo (Optional)</h3>
                    <div className="space-y-2">
                        <Label htmlFor="logoUpload">Upload Logo Image</Label>
                        <Input
                            id="logoUpload"
                            type="file"
                            accept="image/png, image/jpeg, image/svg+xml"
                            onChange={handleLogoUpload}
                            ref={logoFileInputRef}
                            className="pt-2"
                        />
                         <Button 
                            variant="outline" 
                            className="w-full mt-2" 
                            onClick={() => logoFileInputRef.current?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" /> Choose Logo
                          </Button>
                    </div>
                    {logoSrc && (
                        <>
                            <div className="flex justify-center">
                                <img src={logoSrc} alt="Logo preview" className="max-h-20 border rounded-md p-1" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="logoSize">Logo Size: {Math.round(logoSize * 100)}% of QR Code</Label>
                                <Slider
                                    id="logoSize"
                                    min={5} // 5%
                                    max={30} // 30%
                                    step={1}
                                    value={[logoSize * 100]}
                                    onValueChange={(val) => setLogoSize(val[0] / 100)}
                                />
                            </div>
                            <Button variant="outline" onClick={clearLogo} className="w-full text-destructive hover:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Clear Logo
                            </Button>
                        </>
                    )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleDownload} disabled={!inputText} className="w-full">
                  <Download className="mr-2 h-4 w-4" /> Download QR Code
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}


"use client";

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, Download, Settings2 } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { QRCodeCanvas } from 'qrcode.react';
import { Slider } from '@/components/ui/slider';

export default function QrCodeGeneratorPage() {
  const { toast } = useToast();
  const [inputText, setInputText] = useState('https://firebase.google.com');
  const [qrSize, setQrSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
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
        toast({ title: 'QR Code Downloaded', description: 'qrcode.png has been downloaded.' });
      }
    }
  };

  const isValidHexColor = (color: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
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
                      fgColor={fgColor}
                      bgColor={bgColor}
                      level="H" // High error correction
                      imageSettings={{
                        src: "https://firebase.google.com/static/downloads/brand-guidelines/PNG/logo-logomark.png",
                        height: qrSize * 0.15,
                        width: qrSize * 0.15,
                        excavate: true,
                      }}
                    />
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium flex items-center"><Settings2 className="mr-2 h-5 w-5" /> Customization</h3>
                  <div className="space-y-2">
                    <Label htmlFor="qrSize">Size: {qrSize}px</Label>
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
                          onChange={(e) => setFgColor(e.target.value)}
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
                      <Label htmlFor="bgColorText">Background Color</Label>
                       <div className="flex items-center gap-2">
                        <Input
                          id="bgColorText"
                          type="text"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          placeholder="#FFFFFF"
                          className="font-mono flex-grow"
                        />
                        <Input
                          id="bgColorSwatch"
                          type="color"
                          value={isValidHexColor(bgColor) ? bgColor : '#FFFFFF'}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="h-10 w-12 min-w-[3rem] p-1 cursor-pointer flex-shrink-0"
                        />
                      </div>
                    </div>
                  </div>
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

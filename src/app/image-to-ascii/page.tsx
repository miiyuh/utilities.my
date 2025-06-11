
"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, UploadCloud, Wand2, Copy, Image as ImageIcon } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Slider } from "@/components/ui/slider";

// More detailed ramp
const ASCII_CHARS = "`.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@".split('');

const getAsciiChar = (brightness: number): string => {
  const index = Math.floor((brightness / 255) * (ASCII_CHARS.length - 1));
  return ASCII_CHARS[ASCII_CHARS.length - 1 - index]; // Invert for dark char on light bg
};

export default function ImageToAsciiPage() {
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [asciiArt, setAsciiArt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [asciiWidth, setAsciiWidth] = useState<number>(80);
  const imagePreviewRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid File Type', description: 'Please upload an image file (e.g., PNG, JPG, GIF).', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setAsciiArt(''); // Clear previous ASCII art
      };
      reader.readAsDataURL(file);
    }
  };

  const convertToAscii = useCallback(() => {
    if (!uploadedImage || !imagePreviewRef.current) {
      toast({ title: 'No Image', description: 'Please upload an image first.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    const img = imagePreviewRef.current;
    
    if (!img.complete || img.naturalWidth === 0) {
        toast({title: "Image Loading", description: "Preview is loading, please wait a moment and try again.", variant: "default"});
        setIsLoading(false);
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast({ title: 'Canvas Error', description: 'Could not create canvas context.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    const aspectRatio = img.naturalWidth / img.naturalHeight;
    const scaledHeight = Math.round(asciiWidth / aspectRatio * 0.5);

    canvas.width = asciiWidth;
    canvas.height = scaledHeight;

    ctx.drawImage(img, 0, 0, asciiWidth, scaledHeight);
    
    let art = '';
    try {
        const imageData = ctx.getImageData(0, 0, asciiWidth, scaledHeight);
        const { data } = imageData;

        for (let y = 0; y < scaledHeight; y++) {
          for (let x = 0; x < asciiWidth; x++) {
            const i = (y * asciiWidth + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b); 
            art += getAsciiChar(brightness);
          }
          art += '\n';
        }
        setAsciiArt(art);
        toast({ title: 'Conversion Complete!', description: 'Image converted to ASCII art.' });
    } catch (error) {
        console.error("Error getting image data:", error);
        toast({ title: 'Conversion Error', description: 'Could not process image data. The image might be from a restricted source (CORS) if loaded from a URL.', variant: 'destructive' });
        setAsciiArt('');
    } finally {
        setIsLoading(false);
    }

  }, [uploadedImage, asciiWidth, toast]);

  const handleCopy = async () => {
    if (!asciiArt) {
      toast({ title: 'Nothing to copy', description: 'No ASCII art generated yet.', variant: 'destructive' });
      return;
    }
    try {
      await navigator.clipboard.writeText(asciiArt);
      toast({ title: 'Copied to clipboard!', description: 'ASCII art has been copied.' });
    } catch (err) {
      toast({ title: 'Copy failed', description: 'Could not copy text.', variant: 'destructive' });
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
            <h1 className="text-xl font-semibold font-headline">Image to ASCII Converter</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-5xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Image to ASCII Converter</CardTitle>
                <CardDescription>Upload an image, preview it, adjust the width, and then convert it into an ASCII art representation.</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6 p-4 md:p-6">
                {/* Left Column: Upload & Preview */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageUploadButton">1. Upload Image</Label>
                    <Input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      id="imageUploadButton"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <UploadCloud className="mr-2 h-4 w-4" /> Choose Image
                    </Button>
                  </div>

                  {uploadedImage && (
                    <div className="space-y-2 pt-2">
                      <h3 className="font-medium text-center md:text-left">Image Preview</h3>
                      <div className="flex justify-center md:justify-start max-h-80 overflow-hidden rounded-md border bg-muted/10 p-2 shadow-inner">
                        <img 
                          ref={imagePreviewRef} 
                          src={uploadedImage} 
                          alt="Uploaded preview" 
                          className="max-w-full max-h-full object-contain"
                          data-ai-hint="uploaded image preview"
                          onLoad={() => console.log("Image preview loaded.")}
                          onError={() => toast({title:"Preview Error", description:"Could not load image preview.", variant:"destructive"})}
                        />
                      </div>
                    </div>
                  )}
                  {!uploadedImage && (
                    <div className="mt-4 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-md p-8 h-60">
                        <ImageIcon className="h-16 w-16 mb-2 opacity-50" />
                        <p className="text-center">Upload an image to see a preview here.</p>
                    </div>
                  )}
                </div>

                {/* Right Column: Controls & Output */}
                <div className="space-y-4">
                  {uploadedImage ? (
                    <>
                      <div className="space-y-2">
                          <Label htmlFor="asciiWidthSlider">2. Adjust ASCII Art Width: {asciiWidth} chars</Label>
                          <Slider
                              id="asciiWidthSlider"
                              min={20}
                              max={200}
                              step={5}
                              value={[asciiWidth]}
                              onValueChange={(value) => setAsciiWidth(value[0])}
                              disabled={isLoading}
                          />
                      </div>
                      <Button onClick={convertToAscii} disabled={isLoading || !uploadedImage} className="w-full">
                        <Wand2 className="mr-2 h-4 w-4" /> {isLoading ? 'Converting...' : '3. Convert to ASCII'}
                      </Button>
                    </>
                  ) : (
                    <div className="text-muted-foreground border-2 border-dashed rounded-md p-8 h-full flex flex-col items-center justify-center min-h-[200px]">
                        <Wand2 className="h-10 w-10 mb-2 opacity-50" />
                        <p className="text-center">Controls and output will appear here after uploading an image.</p>
                    </div>
                  )}

                  {asciiArt && !isLoading && (
                    <div className="space-y-2 pt-4 border-t">
                      <Label htmlFor="asciiOutput">ASCII Art Output</Label>
                      <Textarea
                        id="asciiOutput"
                        value={asciiArt}
                        readOnly
                        rows={15}
                        className="font-mono text-[10px] leading-tight resize-none bg-muted/30 p-2 whitespace-pre"
                        placeholder="ASCII art will appear here..."
                      />
                      <Button onClick={handleCopy} disabled={!asciiArt || isLoading} className="w-full sm:w-auto">
                        <Copy className="mr-2 h-4 w-4" /> Copy ASCII Art
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}


"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, UploadCloud, Wand2, Copy } from 'lucide-react';
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
    
    // Ensure image is loaded before trying to draw it
    // This check is crucial because the img src is set asynchronously
    if (!img.complete || img.naturalWidth === 0) {
        // Image not loaded yet, or dimensions are zero.
        // Attempt to re-trigger after a short delay if src is set.
        // If src is not set (or image fails to load), this won't loop indefinitely.
        toast({title: "Image Loading", description: "Preview is loading, please wait a moment and try again.", variant: "default"});
        setIsLoading(false); // Reset loading state
        // Optionally, add a retry mechanism or user feedback
        // For now, we just inform the user and stop.
        // setTimeout(convertToAscii, 100); // Avoid this without better load handling
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast({ title: 'Canvas Error', description: 'Could not create canvas context.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    // Calculate scaled height based on original aspect ratio and desired ASCII width
    // The 0.5 factor accounts for typical character aspect ratio (height is roughly twice width)
    // to make the ASCII art look less "stretched" vertically.
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    const scaledHeight = Math.round(asciiWidth / aspectRatio * 0.5);

    canvas.width = asciiWidth;
    canvas.height = scaledHeight;

    // Draw the (potentially scaled) image onto the canvas
    ctx.drawImage(img, 0, 0, asciiWidth, scaledHeight);
    
    let art = '';
    try {
        const imageData = ctx.getImageData(0, 0, asciiWidth, scaledHeight);
        const { data } = imageData;

        for (let y = 0; y < scaledHeight; y++) {
          for (let x = 0; x < asciiWidth; x++) {
            const i = (y * asciiWidth + x) * 4; // Index for R, G, B, A components
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Standard luminance formula for grayscale conversion
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b); 
            art += getAsciiChar(brightness);
          }
          art += '\n'; // Newline after each row
        }
        setAsciiArt(art);
        toast({ title: 'Conversion Complete!', description: 'Image converted to ASCII art.' });
    } catch (error) {
        console.error("Error getting image data:", error);
        toast({ title: 'Conversion Error', description: 'Could not process image data. The image might be from a restricted source (CORS) if loaded from a URL.', variant: 'destructive' });
        setAsciiArt(''); // Clear any partial art
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
            <Card className="w-full max-w-3xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Image to ASCII Converter</CardTitle>
                <CardDescription>Upload an image, preview it, adjust the width, and then convert it into an ASCII art representation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="imageUploadButton">Upload Image</Label>
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
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium text-center">Image Preview</h3>
                    <div className="flex justify-center max-h-60 overflow-hidden rounded-md border bg-muted/10 p-2 shadow-inner">
                      <img 
                        ref={imagePreviewRef} 
                        src={uploadedImage} 
                        alt="Uploaded preview" 
                        className="max-w-full max-h-full object-contain"
                        data-ai-hint="uploaded image preview"
                        onLoad={() => console.log("Image preview loaded.")} // For debugging
                        onError={() => toast({title:"Preview Error", description:"Could not load image preview.", variant:"destructive"})}
                      />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="asciiWidthSlider">ASCII Art Width: {asciiWidth} characters</Label>
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
                      <Wand2 className="mr-2 h-4 w-4" /> {isLoading ? 'Converting...' : 'Convert to ASCII'}
                    </Button>
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
                      className="font-mono text-[10px] leading-tight resize-none bg-muted/30 p-2 whitespace-pre" // whitespace-pre is important
                      placeholder="ASCII art will appear here..."
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleCopy} disabled={!asciiArt || isLoading} className="w-full sm:w-auto">
                  <Copy className="mr-2 h-4 w-4" /> Copy ASCII Art
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

    
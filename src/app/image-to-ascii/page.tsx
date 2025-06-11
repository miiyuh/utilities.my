
"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, UploadCloud, Wand2, Copy, Image as ImageIcon, Settings2 } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const ASCII_RAMPS = {
  detailed: "`.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@", // Sparse to Dense
  standard: " .'-~+=*#%@", // Sparse to Dense
  simple: " .:*o&8#@", // Sparse to Dense (very short)
  blocks: " ░▒▓█", // Sparse to Dense
  minimal: " .#", // Sparse to Dense (extreme minimal)
};
type RampKey = keyof typeof ASCII_RAMPS;

const getAsciiChar = (brightness: number, ramp: string, invert: boolean): string => {
  const normalizedBrightness = brightness / 255;
  let index = Math.floor(normalizedBrightness * (ramp.length - 1));
  // Ramps are sparse to dense.
  // Not inverted: Light (high brightness) -> sparse (early in ramp) -> ramp.length - 1 - index
  // Inverted: Light (high brightness) -> dense (late in ramp) -> ramp[index]
  return invert ? ramp[index] : ramp[ramp.length - 1 - index];
};

export default function ImageToAsciiPage() {
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [asciiArt, setAsciiArt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Conversion Options
  const [asciiWidth, setAsciiWidth] = useState<number>(80);
  const [selectedRampKey, setSelectedRampKey] = useState<RampKey>('standard');
  const [invertBrightness, setInvertBrightness] = useState<boolean>(false);
  const [contrast, setContrast] = useState<number>(1);

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
        setAsciiArt(''); 
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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      toast({ title: 'Canvas Error', description: 'Could not create canvas context.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    const aspectRatio = img.naturalWidth / img.naturalHeight;
    // Character aspect ratio correction (characters are taller than they are wide)
    // 0.5 to 0.6 is a common range, 0.55 is a decent middle ground.
    const charAspectCorrection = 0.55; 
    const scaledHeight = Math.round((asciiWidth / aspectRatio) * charAspectCorrection);

    canvas.width = asciiWidth;
    canvas.height = scaledHeight;

    ctx.drawImage(img, 0, 0, asciiWidth, scaledHeight);
    
    let art = '';
    const currentRamp = ASCII_RAMPS[selectedRampKey];
    try {
        const imageData = ctx.getImageData(0, 0, asciiWidth, scaledHeight);
        const { data } = imageData;

        for (let y = 0; y < scaledHeight; y++) {
          for (let x = 0; x < asciiWidth; x++) {
            const i = (y * asciiWidth + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // Blend with white based on alpha
            const alphaFactor = a / 255;
            const blendedR = r * alphaFactor + 255 * (1 - alphaFactor);
            const blendedG = g * alphaFactor + 255 * (1 - alphaFactor);
            const blendedB = b * alphaFactor + 255 * (1 - alphaFactor);
            
            let brightness = (0.299 * blendedR + 0.587 * blendedG + 0.114 * blendedB); 

            // Apply contrast
            let normalizedBrightness = brightness / 255;
            normalizedBrightness = (normalizedBrightness - 0.5) * contrast + 0.5;
            normalizedBrightness = Math.max(0, Math.min(1, normalizedBrightness)); // Clamp to [0, 1]
            brightness = normalizedBrightness * 255;
            
            art += getAsciiChar(brightness, currentRamp, invertBrightness);
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

  }, [uploadedImage, asciiWidth, toast, selectedRampKey, invertBrightness, contrast]);

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
                <CardDescription>Upload an image, adjust options, and convert it into an ASCII art representation. Preview your image and then generate the art.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                {/* Top Section: Upload, Preview, Controls */}
                <div className="grid md:grid-cols-2 gap-x-6 gap-y-8 mb-6">
                  {/* Left Part: Upload & Preview */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageUploadButton" className="font-medium text-base">1. Upload Image</Label>
                      <Input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isLoading}
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
                            className="max-w-full max-h-72 object-contain"
                            data-ai-hint="uploaded image preview"
                            onLoad={() => console.log("Image preview loaded.")}
                            onError={() => toast({title:"Preview Error", description:"Could not load image preview.", variant:"destructive"})}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center md:text-left">This is a preview of your uploaded image.</p>
                      </div>
                    )}
                    {!uploadedImage && (
                      <div className="mt-4 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-md p-8 h-60">
                          <ImageIcon className="h-16 w-16 mb-2 opacity-50" />
                          <p className="text-center">Upload an image to see a preview here.</p>
                      </div>
                    )}
                  </div>

                  {/* Right Part: Controls */}
                  <div className="space-y-6">
                     <h3 className="font-medium text-base flex items-center"><Settings2 className="mr-2 h-5 w-5 text-primary"/>2. Adjust Conversion Options</h3>
                    {uploadedImage ? (
                      <>
                        <div className="space-y-2">
                            <Label htmlFor="asciiWidthSlider">ASCII Art Width: {asciiWidth} chars</Label>
                            <Slider
                                id="asciiWidthSlider"
                                min={20}
                                max={300}
                                step={5}
                                value={[asciiWidth]}
                                onValueChange={(value) => setAsciiWidth(value[0])}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="characterRamp">Character Set (Ramp)</Label>
                          <Select 
                            value={selectedRampKey} 
                            onValueChange={(value) => setSelectedRampKey(value as RampKey)}
                            disabled={isLoading}
                          >
                            <SelectTrigger id="characterRamp">
                              <SelectValue placeholder="Select character ramp" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(ASCII_RAMPS).map(key => (
                                <SelectItem key={key} value={key}>
                                  {key.charAt(0).toUpperCase() + key.slice(1)} (Preview: {ASCII_RAMPS[key as RampKey].substring(0,10)}...)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="contrastSlider">Contrast: {contrast.toFixed(1)}</Label>
                            <Slider
                                id="contrastSlider"
                                min={0.1}
                                max={3}
                                step={0.1}
                                value={[contrast]}
                                onValueChange={(value) => setContrast(value[0])}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="invertBrightness" 
                            checked={invertBrightness} 
                            onCheckedChange={setInvertBrightness} 
                            disabled={isLoading}
                          />
                          <Label htmlFor="invertBrightness">Invert Brightness Mapping</Label>
                        </div>
                        <p className="text-xs text-muted-foreground -mt-1 pl-1">
                          Changes how bright/dark image areas map to sparse/dense characters.
                        </p>

                        <Button onClick={convertToAscii} disabled={isLoading || !uploadedImage} className="w-full pt-3">
                          <Wand2 className="mr-2 h-4 w-4" /> {isLoading ? 'Converting...' : '3. Convert to ASCII'}
                        </Button>
                      </>
                    ) : (
                      <div className="text-muted-foreground border-2 border-dashed rounded-md p-8 h-full flex flex-col items-center justify-center min-h-[200px] md:min-h-[260px]">
                          <Settings2 className="h-10 w-10 mb-2 opacity-50" />
                          <p className="text-center">Options will appear here after uploading an image.</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Bottom Section: Output */}
                {asciiArt && !isLoading && (
                  <div className="space-y-4 pt-6 border-t mt-8">
                    <Label htmlFor="asciiOutput" className="font-medium text-base">4. ASCII Art Output</Label>
                    <Textarea
                      id="asciiOutput"
                      value={asciiArt}
                      readOnly
                      rows={15}
                      className="font-mono text-[10px] leading-tight resize-none bg-muted/30 p-2 whitespace-pre w-full shadow-inner"
                      placeholder="ASCII art will appear here..."
                      aria-label="ASCII Art Output"
                    />
                    <Button onClick={handleCopy} disabled={!asciiArt || isLoading} className="w-full sm:w-auto mt-2">
                      <Copy className="mr-2 h-4 w-4" /> Copy ASCII Art
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

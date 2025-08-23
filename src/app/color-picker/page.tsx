
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Upload, Palette, Shuffle, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
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
  let h = 0; let s: number; const l = (max + min) / 2;

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

  const kVal = 1 - Math.max(rPrime, gPrime, bPrime);
  
  if (1 - kVal === 0) { // Avoid division by zero for very dark colours close to black
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

const MAGNIFIER_SIZE = 120; // base size (desktop)
const DEFAULT_MAGNIFIER_ZOOM = 4;

export default function ColourPickerPage() {
  const { toast } = useToast();
  const [hexColour, setHexColour] = useState('#1a1a1a'); 
  const [rgbColour, setRgbColour] = useState<{ r: number; g: number; b: number } | null>(null);
  const [hslColour, setHslColour] = useState<{ h: number; s: number; l: number } | null>(null);
  const [cmykColour, setCmykColour] = useState<{ c: number; m: number; y: number; k: number } | null>(null);
  
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  // HSV state for custom colour picker (Hue 0-360, Saturation 0-100, Value 0-100)
  const [hsv, setHsv] = useState<{h: number; s: number; v: number}>({ h: 0, s: 0, v: 10 });
  const internalHexUpdateRef = useRef(false); // Prevent sync loops when we update hex from HSV picker
  const [previousHex, setPreviousHex] = useState<string>('#1a1a1a');
  const [contrast, setContrast] = useState<{ ratio:number; recommended:'#FFFFFF'|'#000000'; passesAA:boolean; passesAAA:boolean }>({ratio:1,recommended:'#FFFFFF',passesAA:false,passesAAA:false});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [magnifierVisible, setMagnifierVisible] = useState(false);
  const [magnifierSize, setMagnifierSize] = useState<number>(MAGNIFIER_SIZE);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const [magnifiedColour, setMagnifiedColour] = useState('#000000');
  const [mouseOnCanvasPosition, setMouseOnCanvasPosition] = useState({ x: 0, y: 0 });
  const magnifierCanvasRef = useRef<HTMLCanvasElement>(null);
  // Removed colourHistory (recently picked) per updated requirements
  const [imagePalette, setImagePalette] = useState<string[]>([]);
  // Advanced interaction state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const scaleRef = useRef(scale);
  const panRef = useRef(pan);
  const imageSizeRef = useRef<{w:number;h:number}>({ w:0, h:0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [samplingMode, setSamplingMode] = useState<'point'|'average'>('point');
  const [averageSize, setAverageSize] = useState(3);
  const [lockedSamples, setLockedSamples] = useState<string[]>([]);
  const [crosshair, setCrosshair] = useState<{x:number;y:number}|null>(null);
  const [magnifierZoom, setMagnifierZoom] = useState(DEFAULT_MAGNIFIER_ZOOM);
  const [lastSamplePos, setLastSamplePos] = useState<{x:number;y:number}|null>(null);
  const [showAdvancedHSV, setShowAdvancedHSV] = useState(false);
  // Mobile a11y panel toggle
  const [showMobileA11y, setShowMobileA11y] = useState(false);
  // User-configurable dominant palette size (min 4 max 16)
  const [paletteSize, setPaletteSize] = useState<number>(8);
  // Fresh drag/pan tracking
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{x:number;y:number;panX:number;panY:number}|null>(null);
  const DRAG_THRESHOLD = 3; // px distance to distinguish click vs drag
  function clampPan(p: {x:number;y:number}, scl: number){
    const container = canvasContainerRef.current;
    if(!container || !imageSizeRef.current.w) return p;
    const cw = container.clientWidth; const ch = container.clientHeight;
    const iw = imageSizeRef.current.w * scl; const ih = imageSizeRef.current.h * scl;
    let x = p.x; let y = p.y;
    if (iw <= cw) { x = (cw - iw)/2; } else { const minX = cw - iw; const maxX = 0; x = Math.min(maxX, Math.max(minX, x)); }
    if (ih <= ch) { y = (ch - ih)/2; } else { const minY = ch - ih; const maxY = 0; y = Math.min(maxY, Math.max(minY, y)); }
    return { x, y };
  }
  // Always listen for paste events (no explicit activation button necessary)

  // Track last fully valid 6-digit HEX to keep previews stable during partial typing
  const lastValidHexRef = useRef<string>(hexColour);
  useEffect(() => {
    if (/^#[0-9A-F]{6}$/i.test(hexColour)) {
      const rgb = hexToRgb(hexColour);
      setRgbColour(rgb);
      if (rgb) {
        setHslColour(rgbToHsl(rgb.r, rgb.g, rgb.b));
        setCmykColour(rgbToCmyk(rgb.r, rgb.g, rgb.b));
      } else {
        setHslColour(null);
        setCmykColour(null);
      }
      lastValidHexRef.current = hexColour;
    } else if (hexColour === '' || /^#[0-9A-F]{0,5}$/i.test(hexColour)) {
      // Partial input: don't recompute, keep previous valid conversions
    } else {
      // Invalid characters removed below in handler; no state change here
    }
  }, [hexColour]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.toUpperCase();
    // Always allow a leading '#'
    if (!raw.startsWith('#')) raw = '#' + raw.replace(/#/g,'');
    // Strip invalid characters after '#'
    const body = raw.slice(1).replace(/[^0-9A-F]/g, '').slice(0,6);
    const candidate = '#' + body;
    setHexColour(candidate);
  };
  
  // --- Colour Space Conversion Helpers (RGB/HSV/Hex) ---
  const rgbToHex = (r: number, g: number, b: number) =>
    '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('').toUpperCase();

  const rgbToHsv = (r: number, g: number, b: number): {h: number; s: number; v: number} => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    const d = max - min;
    let h = 0;
    if (d === 0) h = 0; else if (max === r) h = ((g - b)/d) % 6; else if (max === g) h = (b - r)/d + 2; else h = (r - g)/d + 4;
    h = Math.round(h * 60); if (h < 0) h += 360;
    const v = max;
    const s = max === 0 ? 0 : d / max;
    return { h, s: Math.round(s*100), v: Math.round(v*100) };
  };

  const hsvToRgb = (h: number, s: number, v: number): {r: number; g: number; b: number} => {
    s /= 100; v /= 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r1=0, g1=0, b1=0;
    if (0 <= h && h < 60) { r1=c; g1=x; b1=0; }
    else if (60 <= h && h < 120) { r1=x; g1=c; b1=0; }
    else if (120 <= h && h < 180) { r1=0; g1=c; b1=x; }
    else if (180 <= h && h < 240) { r1=0; g1=x; b1=c; }
    else if (240 <= h && h < 300) { r1=x; g1=0; b1=c; }
    else { r1=c; g1=0; b1=x; }
    return { r: Math.round((r1+m)*255), g: Math.round((g1+m)*255), b: Math.round((b1+m)*255) };
  };

  // Sync HSV when HEX changes externally (manual input / random / image pick)
  useEffect(() => {
    if (internalHexUpdateRef.current) { // skip if we triggered the hex change from HSV interaction
      internalHexUpdateRef.current = false;
      return;
    }
    const rgb = hexToRgb(hexColour);
    if (rgb) {
      const hsvNew = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHsv(hsvNew);
    }
  }, [hexColour]);

  const updateHexFromHsv = (next: {h: number; s: number; v: number}) => {
    const { r, g, b } = hsvToRgb(next.h, next.s, next.v);
    const nextHex = rgbToHex(r,g,b);
    internalHexUpdateRef.current = true;
    setHexColour(nextHex);
  };

  // WCAG Luminance & Contrast utilities
  const hexToLuminance = (hex:string) => {
    const rgb = hexToRgb(hex); if(!rgb) return 0;
    const toLinear = (c:number)=>{ const ch=c/255; return ch<=0.03928? ch/12.92 : Math.pow((ch+0.055)/1.055,2.4);};
    const L = 0.2126*toLinear(rgb.r)+0.7152*toLinear(rgb.g)+0.0722*toLinear(rgb.b); return L;
  };
  const contrastRatio = (hex1:string, hex2:string) => {
    const L1 = hexToLuminance(hex1); const L2 = hexToLuminance(hex2);
    const lighter = Math.max(L1,L2)+0.05; const darker=Math.min(L1,L2)+0.05; return +(lighter/darker).toFixed(2);
  };
  const computeContrast = (colourHex:string) => {
    // Get background hsl(var(--background)) -> convert to hex first
    const styles = getComputedStyle(document.documentElement);
    const bgHslRaw = styles.getPropertyValue('--background').trim(); // e.g. "29 23% 91%"
    let bgHex = '#000000';
    if(bgHslRaw){
      const [hStr,sStr,lStr] = bgHslRaw.split(/\s+/); const h=parseFloat(hStr); const s=parseFloat(sStr)/100; const l=parseFloat(lStr)/100;
      const c=(1-Math.abs(2*l-1))*s; const x=c*(1-Math.abs(((h/60)%2)-1)); const m=l-c/2; let rp=0,gp=0,bp=0; const hp=Math.floor(h/60);
      switch(hp){case 0: rp=c; gp=x; break; case 1: rp=x; gp=c; break; case 2: gp=c; bp=x; break; case 3: gp=x; bp=c; break; case 4: rp=x; bp=c; break; case 5: rp=c; bp=x; break;}
      const r=Math.round((rp+m)*255), g=Math.round((gp+m)*255), b=Math.round((bp+m)*255);
      bgHex = rgbToHex(r,g,b);
    }
    const ratio = contrastRatio(colourHex,bgHex);
    const whiteRatio = contrastRatio(colourHex,'#FFFFFF');
    const blackRatio = contrastRatio(colourHex,'#000000');
    const recommended = whiteRatio>blackRatio ? '#FFFFFF' : '#000000';
    setContrast({ ratio, recommended, passesAA: ratio>=4.5, passesAAA: ratio>=7 });
  };
  useEffect(()=>{ if(/^#[0-9A-F]{6}$/i.test(hexColour)) computeContrast(hexColour); },[hexColour]);

  const copyToClipboard = async (text: string, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast({ 
        title: `${label} Copied!`, 
        description: `${text} copied to clipboard.`,
        duration: 2000 
      });
  } catch {
      toast({ 
        title: 'Copy Failed', 
        description: `Could not copy ${label}.`, 
        variant: 'destructive' 
      });
    }
  };

  const generateRandomColour = () => {
    const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
  setPreviousHex(hexColour);
  setHexColour(randomHex);
    toast({ 
      title: 'Random Colour Generated!', 
      description: `New colour: ${randomHex}`,
      duration: 2000 
    });
  };

  // Extract dominant colours from image for palette
  const extractImagePalette = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sample pixels from the image (every 10th pixel for performance)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const colourMap = new Map<string, number>();
    
  for (let i = 0; i < data.length; i += 40) { // Sample every 10th pixel (4 bytes per pixel)
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];
      
      // Skip transparent pixels
      if (alpha < 128) continue;
      
  // Quantize colours to reduce similar shades (clamp to 255 to avoid 256 overflow)
  const quantize = (val: number) => Math.min(255, Math.floor(val / 32) * 32);
  const quantizedR = quantize(r);
  const quantizedG = quantize(g);
  const quantizedB = quantize(b);
      
  const hex = `#${quantizedR.toString(16).padStart(2, '0')}${quantizedG.toString(16).padStart(2, '0')}${quantizedB.toString(16).padStart(2, '0')}`.toUpperCase();
      
      colourMap.set(hex, (colourMap.get(hex) || 0) + 1);
    }
    
    // Sort by frequency and get top N colours (user configurable)
    const sortedColours = Array.from(colourMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.min(16, Math.max(4, paletteSize)))
      .map(([colour]) => colour);
    
    setImagePalette(sortedColours);
  };

  const resetImage = () => {
    setUploadedImage(null);
    setImagePalette([]);
    setMagnifierVisible(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({ 
      title: 'Image Removed', 
      description: 'Canvas cleared successfully',
      duration: 2000 
    });
  };

  // Clipboard paste functionality (always active)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setUploadedImage(event.target?.result as string);
              setMagnifierVisible(false);
              toast({ 
                title: 'Image Pasted!', 
                description: 'Click on the image to pick colours',
                duration: 3000 
              });
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [toast]);

  // Precise single-pixel colour sampling (no averaging) to reflect exact clicked pixel
  const getPixelColour = (canvas: HTMLCanvasElement, offsetX: number, offsetY: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    // Use floor for deterministic pixel selection. The intrinsic canvas pixel (i,j)
    // covers coordinate range [i, i+1) × [j, j+1). Rounding can shift selection to an
    // adjacent pixel when pointer is past half the pixel, causing visual misalignment
    // with overlays. Flooring keeps the chosen pixel the one actually under the cursor.
    const x = Math.min(canvas.width - 1, Math.max(0, Math.floor(offsetX)));
    const y = Math.min(canvas.height - 1, Math.max(0, Math.floor(offsetY)));
    if (samplingMode === 'point') {
      const data = ctx.getImageData(x, y, 1, 1).data;
      const r = data[0]; const g = data[1]; const b = data[2];
      const hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`.toUpperCase();
      return { r, g, b, hex };
    }
    const half = Math.floor(averageSize / 2);
    let rSum=0,gSum=0,bSum=0,count=0;
    for (let yy = y - half; yy <= y + half; yy++) {
      if (yy < 0 || yy >= canvas.height) continue;
      for (let xx = x - half; xx <= x + half; xx++) {
        if (xx < 0 || xx >= canvas.width) continue;
        const data = ctx.getImageData(xx, yy, 1, 1).data;
        rSum += data[0]; gSum += data[1]; bSum += data[2]; count++;
      }
    }
    if (!count) return null;
    const r = Math.round(rSum / count), g = Math.round(gSum / count), b = Math.round(bSum / count);
    const hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`.toUpperCase();
    return { r, g, b, hex };
  };

  // Map pointer to intrinsic image coordinates
  const translatePointerToImageCoords = (e: React.MouseEvent | React.PointerEvent, container: HTMLDivElement) => {
    const rect = container.getBoundingClientRect();
    const xScreen = e.clientX - rect.left - pan.x;
    const yScreen = e.clientY - rect.top - pan.y;
    return { offsetX: xScreen / scale, offsetY: yScreen / scale };
  };

  // Wheel zoom handled via explicit non-passive listener (see useEffect below)
  // so we don't define a React onWheel handler here.

  // Fresh panning + click sampling
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // only left button triggers drag/click sample
    if (!canvasContainerRef.current) return;
    setIsDragging(true);
    setMagnifierVisible(false);
    const start = { x: e.clientX, y: e.clientY, panX: panRef.current.x, panY: panRef.current.y };
    dragStartRef.current = start;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    const move = (ev: PointerEvent) => {
      if (!dragStartRef.current) return;
      const dx = ev.clientX - dragStartRef.current.x;
      const dy = ev.clientY - dragStartRef.current.y;
      const dist = Math.hypot(dx, dy);
      // Only treat as drag when beyond threshold
      if (dist >= DRAG_THRESHOLD) {
        const next = clampPan({ x: dragStartRef.current.panX + dx, y: dragStartRef.current.panY + dy }, scaleRef.current);
        panRef.current = next; setPan(next);
      }
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const startInfo = dragStartRef.current; dragStartRef.current = null; setIsDragging(false);
      const container = canvasContainerRef.current;
      if (!container || !canvasRef.current || !startInfo) { if (uploadedImage) setMagnifierVisible(true); return; }
      const totalDx = ev.clientX - startInfo.x;
      const totalDy = ev.clientY - startInfo.y;
      const dist = Math.hypot(totalDx, totalDy);
      const rect = container.getBoundingClientRect();
      const inside = ev.clientX>=rect.left && ev.clientX<=rect.right && ev.clientY>=rect.top && ev.clientY<=rect.bottom;
      if (dist < DRAG_THRESHOLD && inside) {
        // Click sample
        const cursorX = ev.clientX - rect.left;
        const cursorY = ev.clientY - rect.top;
        const offsetX = (cursorX - panRef.current.x) / scaleRef.current;
        const offsetY = (cursorY - panRef.current.y) / scaleRef.current;
        const colourData = getPixelColour(canvasRef.current, offsetX, offsetY);
        if (colourData) {
          setHexColour(colourData.hex);
          setMagnifiedColour(colourData.hex);
          toast({ title: 'Colour Picked!', description: `Selected colour: ${colourData.hex}`, duration: 1600 });
          const fx = Math.floor(offsetX); const fy = Math.floor(offsetY);
          setCrosshair({ x: fx, y: fy });
          setLastSamplePos({ x: fx, y: fy });
        }
      }
      if (uploadedImage && inside) setMagnifierVisible(true);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // Keyboard pixel stepping
  useEffect(() => {
    const el = canvasContainerRef.current; if (!el) return;
    const handleKey = (e: KeyboardEvent) => {
      if (!canvasRef.current || !imageSizeRef.current.w) return;
      if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      let cx = crosshair? crosshair.x : 0;
      let cy = crosshair? crosshair.y : 0;
      if (e.key==='ArrowUp') cy = Math.max(0, cy - step);
      if (e.key==='ArrowDown') cy = Math.min(imageSizeRef.current.h - 1, cy + step);
      if (e.key==='ArrowLeft') cx = Math.max(0, cx - step);
      if (e.key==='ArrowRight') cx = Math.min(imageSizeRef.current.w - 1, cx + step);
      setCrosshair({ x: cx, y: cy });
      const colourData = getPixelColour(canvasRef.current, cx, cy);
      if (colourData) { setHexColour(colourData.hex); setMagnifiedColour(colourData.hex); }
    };
    el.addEventListener('keydown', handleKey);
    return () => el.removeEventListener('keydown', handleKey);
  }, [crosshair, samplingMode, averageSize]);

  // Re-clamp pan whenever scale changes to keep image framed
  useEffect(() => {
    panRef.current = clampPan(panRef.current, scaleRef.current);
    setPan(panRef.current);
  }, [scale]);

  // Magnifier wheel for zoom
  const handleMagnifierWheel = (e: React.WheelEvent) => {
    if (!magnifierVisible) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setMagnifierZoom(z => Math.min(20, Math.max(2, +(z * factor).toFixed(2))));
  };

  // Ensure wheel listener is non-passive to allow preventDefault to block page scroll
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const wheelHandler = (e: WheelEvent) => {
      if (!imageSizeRef.current.w) return;
      // Core zoom-to-cursor logic
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const targetScale = Math.min(32, Math.max(0.25, scaleRef.current * zoomFactor));
      if (targetScale === scaleRef.current) return; // no change
      // Preserve world coordinates under cursor
      const worldX = (cursorX - panRef.current.x) / scaleRef.current;
      const worldY = (cursorY - panRef.current.y) / scaleRef.current;
      let nextPan = { x: cursorX - worldX * targetScale, y: cursorY - worldY * targetScale };
      nextPan = clampPan(nextPan, targetScale);
      scaleRef.current = targetScale; setScale(targetScale);
      panRef.current = nextPan; setPan(nextPan);
    };
    el.addEventListener('wheel', wheelHandler, { passive: false });
    return () => el.removeEventListener('wheel', wheelHandler as any);
  }, [uploadedImage]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setMagnifierVisible(false); // Hide magnifier if a new image is uploaded
        toast({ 
          title: 'Image Uploaded!', 
          description: 'Click on the image to pick colours',
          duration: 3000 
        });
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
          const MAX_WIDTH = canvas.parentElement?.clientWidth ? Math.min(400, canvas.parentElement.clientWidth - 20) : 380;
          const MAX_HEIGHT = 300;
          let { width, height } = img;
            if (width > height) {
              if (width > MAX_WIDTH) { height = Math.round(height * (MAX_WIDTH / width)); width = MAX_WIDTH; }
            } else {
              if (height > MAX_HEIGHT) { width = Math.round(width * (MAX_HEIGHT / height)); height = MAX_HEIGHT; }
            }
          canvas.width = width; canvas.height = height; ctx.drawImage(img, 0, 0, width, height);
          imageSizeRef.current = { w: width, h: height };
          setScale(1); scaleRef.current = 1;
          // Center the image within container using clampPan
          requestAnimationFrame(()=>{
            if (canvasContainerRef.current) {
              const centered = clampPan({ x:0, y:0 }, 1);
              panRef.current = centered; setPan(centered);
            } else { panRef.current={x:0,y:0}; setPan({x:0,y:0}); }
          });
          extractImagePalette(canvas);
        };
        img.src = uploadedImage;
      }
    }
  }, [uploadedImage]);

  // Recompute palette when user changes desired palette size
  useEffect(() => {
    if (uploadedImage && canvasRef.current) {
      extractImagePalette(canvasRef.current);
    }
  }, [paletteSize]);

  // handleCanvasClick removed (sampling now occurs in pointerup when not dragging)

  const handleMouseMoveOnCanvas = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return; // no live preview while dragging
    if (!canvasRef.current || !uploadedImage || !canvasContainerRef.current) return;
    const { offsetX, offsetY } = translatePointerToImageCoords(event, canvasContainerRef.current);
    setMouseOnCanvasPosition({ x: offsetX, y: offsetY });
    // Raw desired position (offset slightly so cursor not covered)
    let rawX = offsetX * scale + pan.x + 15;
    let rawY = offsetY * scale + pan.y + 15;
    // Clamp within container so magnifier stays inside card on small screens
    const cont = canvasContainerRef.current;
    if (cont) {
      const cw = cont.clientWidth; const ch = cont.clientHeight;
      rawX = Math.min(Math.max(0, rawX), cw - magnifierSize);
      rawY = Math.min(Math.max(0, rawY), ch - magnifierSize);
    }
    setMagnifierPosition({ x: rawX, y: rawY });
    const colourData = getPixelColour(canvasRef.current, offsetX, offsetY);
    if (colourData) setMagnifiedColour(colourData.hex);
    const fx = Math.floor(offsetX); const fy = Math.floor(offsetY);
    setLastSamplePos({ x: fx, y: fy });
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
    magnCtx.clearRect(0, 0, magnifierSize, magnifierSize);

  const sourceRectSize = magnifierSize / magnifierZoom;
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
      magnifierSize,
      magnifierSize
    );
  }, [magnifierVisible, mouseOnCanvasPosition, uploadedImage, magnifierSize, magnifierZoom]);

  // Adjust magnifier size responsively
  useEffect(()=>{
    const compute = () => {
      const w = window.innerWidth;
      if (w < 420) setMagnifierSize(90); else if (w < 640) setMagnifierSize(100); else setMagnifierSize(MAGNIFIER_SIZE);
    };
    compute();
    window.addEventListener('resize', compute);
    return ()=> window.removeEventListener('resize', compute);
  }, []);


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
              <Palette className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold font-headline">Colour Picker</h1>
            </div>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-3 md:p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto">
            {/* Big heading */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 md:mb-6 text-foreground border-b border-border pb-3 md:pb-4">Colour Picker</h1>
              <p className="text-base md:text-lg text-muted-foreground">Pick colours and get their codes in various formats.</p>
            </div>
            
            <div className="space-y-6 md:space-y-8">
            <div className="grid gap-4 md:gap-6 xl:gap-8 md:grid-cols-2">
              {/* Left Panel: Colour Inputs & Derived Codes */}
              <Card className="minimal-card">
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="font-headline text-lg md:text-xl tracking-tight">Colour Input & Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-5">
                  {/* Top interactive area */}
                  <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
                    {/* Left: Visual Picker */}
                    <div className="flex flex-col gap-2 w-full max-w-[280px] mx-auto lg:mx-0">
                      <div className="relative select-none" aria-label="Visual colour picker" role="application" aria-describedby="sv-instructions">
                          {/* Saturation / Value Area */}
                        <div
                          className="relative aspect-square w-full rounded-md overflow-hidden cursor-crosshair border border-border shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/40"
                          style={{ background: `hsl(${hsv.h} 100% 50%)` }}
                          tabIndex={0}
                          onMouseDown={(e)=>{
                            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                            const move=(ev:MouseEvent)=>{ const x=Math.min(Math.max(0,ev.clientX-rect.left),rect.width); const y=Math.min(Math.max(0,ev.clientY-rect.top),rect.height); const s=Math.round((x/rect.width)*100); const v=Math.round(100-(y/rect.height)*100); const next={h:hsv.h,s,v}; setHsv(next); updateHexFromHsv(next); };
                            const up=()=>{window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',up);};
                            window.addEventListener('mousemove',move);window.addEventListener('mouseup',up);move(e.nativeEvent as unknown as MouseEvent);
                          }}
                          onKeyDown={(e)=>{ let {h,s,v}=hsv; const step=e.shiftKey?10:1; let changed=false; if(e.key==='ArrowRight'){s=Math.min(100,s+step);changed=true;} if(e.key==='ArrowLeft'){s=Math.max(0,s-step);changed=true;} if(e.key==='ArrowUp'){v=Math.min(100,v+step);changed=true;} if(e.key==='ArrowDown'){v=Math.max(0,v-step);changed=true;} if(changed){ const next={h,s,v}; setHsv(next); updateHexFromHsv(next); e.preventDefault();}}}
                        >
                          <div className="absolute inset-0" style={{background:'linear-gradient(to right,#fff,rgba(255,255,255,0))'}} />
                          <div className="absolute inset-0" style={{background:'linear-gradient(to top,#000,rgba(0,0,0,0))'}} />
                          <div className="absolute w-4 h-4 border-2 border-white shadow pointer-events-none bg-white/70" style={{left:`calc(${hsv.s}% - 8px)`,top:`calc(${100-hsv.v}% - 8px)`,boxShadow:'0 0 0 1px rgba(0,0,0,0.4)'}} />
                        </div>
                        {/* Hue slider */}
                        <div className="mt-2 relative h-3 w-full overflow-hidden cursor-pointer border border-border" onMouseDown={(e)=>{ const rect=(e.currentTarget as HTMLDivElement).getBoundingClientRect(); const move=(ev:MouseEvent)=>{ const x=Math.min(Math.max(0,ev.clientX-rect.left),rect.width); const h=Math.round((x/rect.width)*360); const next={h,s:hsv.s,v:hsv.v}; setHsv(next); updateHexFromHsv(next); }; const up=()=>{window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',up);}; window.addEventListener('mousemove',move); window.addEventListener('mouseup',up); move(e.nativeEvent as unknown as MouseEvent); }}>
                          <div className="absolute inset-0" style={{background:'linear-gradient(to right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)'}} />
                          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-white shadow bg-white/70" style={{left:`calc(${(hsv.h/360)*100}% - 6px)`,boxShadow:'0 0 0 1px rgba(0,0,0,0.4)'}} />
                        </div>
                        <div className="flex items-center justify-between text-[10px] mt-1 text-muted-foreground">
                          <span>SV</span><span>Hue</span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              aria-label={showAdvancedHSV? 'Hide HSV numeric inputs':'Show HSV numeric inputs'}
                              title={showAdvancedHSV? 'Hide HSV numeric inputs':'Show HSV numeric inputs'}
                              onClick={()=> setShowAdvancedHSV(s=>!s)}
                              className="px-2 h-6 inline-flex items-center gap-1 rounded-sm border border-border/70 bg-background/40 hover:bg-accent/30 hover:border-primary/60 transition-colors font-medium tracking-wide"
                            >
                              <span className="font-mono">HSV</span>
                              <span className="text-[9px] opacity-70">{showAdvancedHSV?'–':'+'}</span>
                            </button>
                            <button
                              type="button"
                              aria-label="Reset picker to default #1A1A1A"
                              title="Reset to default (#1A1A1A)"
                              onClick={()=>{ setHsv(rgbToHsv(26,26,26)); setPreviousHex(hexColour); setHexColour('#1A1A1A'); }}
                              className="px-2 h-6 inline-flex items-center gap-1 rounded-sm border border-border/70 bg-background/40 hover:bg-destructive/20 hover:border-destructive/60 transition-colors font-medium"
                            >
                              <span className="font-mono">Reset</span>
                            </button>
                            <button
                              type="button"
                              aria-label="Generate random colour"
                              title="Random colour"
                              onClick={generateRandomColour}
                              className="px-2 h-6 inline-flex items-center gap-1 rounded-sm border border-border/70 bg-background/40 hover:bg-accent/30 hover:border-primary/60 transition-colors font-medium"
                            >
                              <Shuffle className="h-3 w-3" />
                              <span className="font-mono">Rand</span>
                            </button>
                          </div>
                          <span className="text-muted-foreground hidden sm:inline">S:{hsv.s}% V:{hsv.v}%</span>
                        </div>
                        {showAdvancedHSV && (
                          <div className="grid grid-cols-3 gap-1 mt-2">
                            {(['h','s','v'] as const).map(key=> (
                              <div key={key} className="flex flex-col gap-0.5">
                                <Label className="text-[9px] uppercase tracking-wide">{key}</Label>
                                <Input type="number" min={0} max={key==='h'?360:100} value={hsv[key]} onChange={(e)=>{ const val=Math.max(0,Math.min(key==='h'?360:100,parseInt(e.target.value||'0',10))); const next={...hsv,[key]:val}; setHsv(next); updateHexFromHsv(next); }} className="h-7 text-[11px] font-mono" />
                              </div>
                            ))}
                          </div>
                        )}
                        <p id="sv-instructions" className="sr-only">Use mouse or arrow keys to adjust saturation and value; use hue slider below.</p>
                      </div>{/* end relative select-none */}
                    </div>{/* end picker column */}
                    {/* Right: Derived Colour Codes */}
                    <div className="flex flex-col gap-2 md:gap-3 flex-1 max-w-sm mx-auto lg:mx-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Derived Colour Codes</p>
                      {/* RGB */}
                      <button
                        type="button"
                        disabled={!rgbColour}
                        onClick={()=> copyToClipboard(rgbColour?`rgb(${rgbColour.r}, ${rgbColour.g}, ${rgbColour.b})`:'','RGB')}
                        className="group relative h-14 md:h-16 border border-border rounded-sm text-[11px] md:text-xs font-mono px-2 flex flex-col justify-center items-center text-center hover:bg-accent/20 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                        aria-label={rgbColour?`Copy RGB ${`rgb(${rgbColour.r}, ${rgbColour.g}, ${rgbColour.b})`}`:'RGB unavailable'}
                      >
                        <span className="absolute top-1 left-2 text-[10px] tracking-wide font-medium opacity-70 group-hover:opacity-100">RGB</span>
                        <span className="truncate w-full">{rgbColour?`rgb(${rgbColour.r}, ${rgbColour.g}, ${rgbColour.b})`:'—'}</span>
                        <span className="pointer-events-none absolute bottom-1 right-2 opacity-0 group-hover:opacity-70 text-[9px] inline-flex items-center gap-0.5">Copy <Copy className="h-3 w-3 opacity-80" /></span>
                      </button>
                      {/* HSL */}
                      <button
                        type="button"
                        disabled={!hslColour}
                        onClick={()=> copyToClipboard(hslColour?`hsl(${hslColour.h}, ${hslColour.s}%, ${hslColour.l}%)`:'','HSL')}
                        className="group relative h-14 md:h-16 border border-border rounded-sm text-[11px] md:text-xs font-mono px-2 flex flex-col justify-center items-center text-center hover:bg-accent/20 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                        aria-label={hslColour?`Copy HSL ${`hsl(${hslColour.h}, ${hslColour.s}%, ${hslColour.l}%)`}`:'HSL unavailable'}
                      >
                        <span className="absolute top-1 left-2 text-[10px] tracking-wide font-medium opacity-70 group-hover:opacity-100">HSL</span>
                        <span className="truncate w-full">{hslColour?`hsl(${hslColour.h}, ${hslColour.s}%, ${hslColour.l}%)`:'—'}</span>
                        <span className="pointer-events-none absolute bottom-1 right-2 opacity-0 group-hover:opacity-70 text-[9px] inline-flex items-center gap-0.5">Copy <Copy className="h-3 w-3 opacity-80" /></span>
                      </button>
                      {/* CMYK */}
                      <button
                        type="button"
                        disabled={!cmykColour}
                        onClick={()=> copyToClipboard(cmykColour?`cmyk(${cmykColour.c}%, ${cmykColour.m}%, ${cmykColour.y}%, ${cmykColour.k}%)`:'','CMYK')}
                        className="group relative h-14 md:h-16 border border-border rounded-sm text-[11px] md:text-xs font-mono px-2 flex flex-col justify-center items-center text-center hover:bg-accent/20 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                        aria-label={cmykColour?`Copy CMYK ${`cmyk(${cmykColour.c}%, ${cmykColour.m}%, ${cmykColour.y}%, ${cmykColour.k}%)`}`:'CMYK unavailable'}
                      >
                        <span className="absolute top-1 left-2 text-[10px] tracking-wide font-medium opacity-70 group-hover:opacity-100">CMYK</span>
                        <span className="truncate w-full">{cmykColour?`cmyk(${cmykColour.c}%, ${cmykColour.m}%, ${cmykColour.y}%, ${cmykColour.k}%)`:'—'}</span>
                        <span className="pointer-events-none absolute bottom-1 right-2 opacity-0 group-hover:opacity-70 text-[9px] inline-flex items-center gap-0.5">Copy <Copy className="h-3 w-3 opacity-80" /></span>
                      </button>
                      {/* Colour preview */}
                      <div className="relative h-14 md:h-16 border border-border rounded-sm overflow-hidden">
                        <div className="absolute inset-0" style={{background:lastValidHexRef.current}} aria-label={`Colour preview ${lastValidHexRef.current}`}></div>
                        <div className="absolute inset-0 flex items-end justify-end p-1">
                          <span className="bg-black/50 text-white text-[10px] px-1 rounded-sm font-mono">{lastValidHexRef.current}</span>
                        </div>
                      </div>
                    </div>
                  </div> {/* end top interactive area */}
                  {/* Hex row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input id="hex-value-input" value={hexColour} onChange={handleHexChange} className="font-mono text-center text-base tracking-wider w-32 sm:w-40" placeholder="#000000" maxLength={7} />
                    <Button variant="outline" size="icon" onClick={()=> copyToClipboard(lastValidHexRef.current,'HEX')} disabled={!/^#[0-9A-F]{6}$/i.test(lastValidHexRef.current)} aria-label="Copy HEX"><Copy className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" disabled={previousHex===lastValidHexRef.current} onClick={()=>{ const cur=lastValidHexRef.current; setHexColour(previousHex); setPreviousHex(cur); }} aria-label="Swap with previous colour">↺</Button>
                  </div>
                  <hr className="border-border/60" />
                  {/* Accessibility + Preview (integrated styling) */}
                  <section className="space-y-2 md:space-y-3">
                    <div className="flex md:hidden justify-end">
                      <button
                        type="button"
                        onClick={()=> setShowMobileA11y(s=>!s)}
                        className="text-[11px] px-2 py-1 rounded border border-border/60 hover:bg-accent/30 transition-colors touch-manipulation"
                        aria-expanded={showMobileA11y}
                      >{showMobileA11y? 'Hide':'Accessibility'}</button>
                    </div>
                    <div className={"space-y-2 md:space-y-3 " + (showMobileA11y? 'block':'hidden md:block')}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Accessibility & Preview</h4>
                      <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-[11px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-secondary/50 border border-border/60">{contrast.ratio}:1</span>
                        <span className="text-[9px] md:text-[10px]">AA {contrast.passesAA? '✔':'✖'} / AAA {contrast.passesAAA? '✔':'✖'}</span>
                        <Button size="sm" variant="outline" className="h-6 md:h-7 px-2 text-[10px] md:text-[11px] touch-manipulation" onClick={()=>{ const payload = { hex: hexColour, rgb: rgbColour, hsl: hslColour, cmyk: cmykColour, hsv }; copyToClipboard(JSON.stringify(payload,null,2),'All Formats'); }}>Copy All</Button>
                      </div>
                    </div>
                    <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 items-stretch">
                      <div className="text-xs space-y-1 leading-relaxed">
                        <p>Current colour: <span className="font-mono">{lastValidHexRef.current}</span></p>
                        <p>Recommended text: <span style={{color:contrast.recommended}} className="font-mono">{contrast.recommended}</span></p>
                        <p>Contrast: <span className={contrast.passesAA? 'text-green-500':'text-yellow-500'}>{contrast.ratio}:1</span></p>
                        <p>Status: <span>{contrast.passesAA? 'AA pass':'AA fail'}</span> / <span>{contrast.passesAAA? 'AAA pass':'AAA fail'}</span></p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="rounded-md border border-border h-16 md:h-20 overflow-hidden grid grid-cols-2 text-[11px] font-mono">
                          <div style={{background:lastValidHexRef.current,color:contrast.recommended}} className="flex flex-col items-center justify-center gap-1">
                            <span>Aa</span>
                            <span className="text-[9px] opacity-70">FG {contrast.recommended}</span>
                          </div>
                          <div style={{background:contrast.recommended,color:lastValidHexRef.current}} className="flex flex-col items-center justify-center gap-1">
                            <span>Aa</span>
                            <span className="text-[9px] opacity-70">FG {lastValidHexRef.current}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                  </section>
                </CardContent>
              </Card>

              {/* Right Panel: Pick from Image & Magnifier */}
              <Card className="minimal-card">
                <CardHeader className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 md:gap-4 flex-wrap">
                    <CardTitle className="shrink-0 font-headline text-lg md:text-xl tracking-tight">Pick Colour from Image</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        id="image-upload-button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9 md:h-10 px-3 md:px-4 text-sm"
                      >
                        <Upload className="mr-2 h-4 w-4" /> Upload
                      </Button>
                      {uploadedImage && (
                        <Button
                          variant="outline"
                          onClick={resetImage}
                          className="h-9 md:h-10 px-2 md:px-3 hover:bg-destructive/5 hover:border-destructive/30 hover:text-destructive"
                          title="Remove current image"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">Upload (or paste) an image, then: wheel to zoom, drag to pan, click to pick, hover for loupe, arrows to step pixel (Shift for ×10). Lock swatches you want to keep.</p>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  <div className="space-y-3 md:space-y-4">
                  {uploadedImage ? (
                    <div className="flex flex-col items-center space-y-3 md:space-y-4 relative">
                      <div className="w-full flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <Label className="text-xs w-10 text-muted-foreground">Zoom</Label>
                          <Slider
                            value={[Math.round(scale*100)]}
                            min={25}
                            max={800}
                            step={25}
                            onValueChange={(val)=> {
                              const nextScale = val[0]/100; setScale(nextScale); scaleRef.current = nextScale; /* keep pan to maintain focus center roughly */
                            }}
                            className="flex-1"
                            aria-label="Zoom level"
                          />
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" onClick={()=>{ if (!imageSizeRef.current.w || !canvasContainerRef.current) return; const cw = canvasContainerRef.current.clientWidth; const ch=300; const fitScale = Math.min(cw / imageSizeRef.current.w, ch / imageSizeRef.current.h); setScale(fitScale); scaleRef.current=fitScale; const centered = clampPan({x:0,y:0}, fitScale); panRef.current=centered; setPan(centered); }}>Fit</Button>
                            <Button size="sm" variant="outline" onClick={()=>{ setScale(1); scaleRef.current=1; const centered = clampPan({x:0,y:0},1); panRef.current=centered; setPan(centered); }}>100%</Button>
                          </div>
                          <span className="text-[11px] tabular-nums w-12 text-right text-muted-foreground">{(scale*100).toFixed(0)}%</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-[11px]">
                          <div className="flex items-center gap-1">
                            <Label className="text-[11px]">Mode</Label>
                            <select className="bg-input border rounded px-1 py-1" value={samplingMode} onChange={(e)=> setSamplingMode(e.target.value as any)}>
                              <option value="point">Point</option>
                              <option value="average">Average</option>
                            </select>
                            {samplingMode==='average' && (
                              <select className="bg-input border rounded px-1 py-1" value={averageSize} onChange={(e)=> setAverageSize(parseInt(e.target.value,10))}>
                                {[3,5,7,9].map(n=> <option key={n} value={n}>{n}x{n}</option>)}
                              </select>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" onClick={()=> { if(!lockedSamples.includes(hexColour) && /^#[0-9A-F]{6}$/i.test(hexColour)) setLockedSamples(s=>[...s,hexColour]); }}>Lock</Button>
                            <Button size="sm" variant="outline" disabled={!lockedSamples.length} onClick={()=> setLockedSamples([])}>Clear</Button>
                          </div>
                          <div className="text-muted-foreground">Arrows: pixel • Shift+Arrows: ×10</div>
                        </div>
                      </div>
                      <div
                        ref={canvasContainerRef}
                        className="relative rounded-lg border-2 border-border max-w-full shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden outline-none overscroll-contain bg-neutral-950/40 dark:bg-neutral-900/40 select-none"
                        style={{ width: '100%', height: 250, touchAction: 'none', backgroundImage: 'linear-gradient(45deg,#444 25%,transparent 25%),linear-gradient(-45deg,#444 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#444 75%),linear-gradient(-45deg,transparent 75%,#444 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0,0 10px,10px -10px,-10px 0' }}
                        tabIndex={0}
                        // wheel handled by custom listener (non-passive) for zoom-to-cursor
                        onPointerDown={handlePointerDown}
                        onMouseMove={(e)=> handleMouseMoveOnCanvas(e as unknown as React.MouseEvent<HTMLCanvasElement>)}
                        onMouseEnter={() => handleMouseEnterCanvas()}
                        onMouseLeave={() => handleMouseLeaveCanvas()}
                        // click sampling handled in pointerup inside handlePointerDown
                        onWheelCapture={handleMagnifierWheel}
                        aria-label="Interactive image canvas (zoom, pan, sample)"
                      >
                        <canvas
                          ref={canvasRef}
                          style={{
                            position:'absolute',
                            left: pan.x,
                            top: pan.y,
                            transform: `scale(${scale})`,
                            transformOrigin: 'top left',
                            imageRendering: scale>=4? 'pixelated':'auto',
                            cursor: isDragging? 'grabbing':'crosshair'
                          }}
                        />
                        {/* HUD */}
                        <div className="absolute left-2 top-2 px-2 py-1 rounded bg-black/60 backdrop-blur text-[11px] font-mono text-white flex items-center gap-3 pointer-events-none">
                          {lastSamplePos && <span>{lastSamplePos.x},{lastSamplePos.y}</span>}
                          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm border border-white/30" style={{background: magnifiedColour}}></span>{magnifiedColour}</span>
                          <span>{(scale*100).toFixed(0)}%</span>
                        </div>
                        {scale >= 8 && (
                          <div className="pointer-events-none absolute" style={{
                            left: pan.x,
                            top: pan.y,
                            width: imageSizeRef.current.w * scale,
                            height: imageSizeRef.current.h * scale,
                            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.15) 0, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 0, rgba(255,255,255,0.15) 1px, transparent 1px)` ,
                            backgroundSize: `${scale}px ${scale}px, ${scale}px ${scale}px`,
                            mixBlendMode: 'overlay'
                          }} />
                        )}
                        {crosshair && (
                          <div className="pointer-events-none absolute" style={{
                            left: Math.round(pan.x + crosshair.x * scale),
                            top: Math.round(pan.y + crosshair.y * scale),
                            width: Math.max(1, Math.round(scale)),
                            height: Math.max(1, Math.round(scale)),
                            outline: '1px solid rgba(255,0,0,0.9)',
                            boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
                            background: 'transparent'
                          }} />
                        )}
                      </div>
          {magnifierVisible && (
                        <div
                          style={{
            left: `${magnifierPosition.x}px`,
            top: `${magnifierPosition.y}px`,
            width: `${magnifierSize}px`,
            height: `${magnifierSize}px`,
                          }}
                          className="absolute z-50 pointer-events-none border-2 border-primary bg-background shadow-2xl rounded-full flex flex-col items-center justify-center overflow-hidden"
                        >
                          <canvas
                            ref={magnifierCanvasRef}
            width={magnifierSize}
            height={magnifierSize}
                            className="absolute inset-0"
                          />
                          {/* Enhanced crosshair */}
                          <div style={{width: '2px', height: '100%'}} className="absolute left-1/2 bg-red-500 -translate-x-1/2 opacity-80"></div>
                          <div style={{height: '2px', width: '100%'}} className="absolute top-1/2 bg-red-500 -translate-y-1/2 opacity-80"></div>
                          
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-[11px] font-mono shadow-lg border border-white/20">{magnifiedColour} ×{magnifierZoom.toFixed(1)}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 md:h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/40 transition-colors duration-200 text-center px-4">
                      <div className="text-center text-muted-foreground">
                        <Upload className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-medium">Upload an image to extract colours</p>
                        <p className="text-xs mt-1 opacity-75">Supports JPG, PNG, GIF, WebP</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Image Palette */}
                  {imagePalette.length > 0 && (
                    <div className="space-y-3 pt-6 border-t">
                      <div className="flex items-center gap-2 md:gap-3 mb-1 flex-wrap">
                        <Palette className="h-5 w-5 text-primary" />
                        <h3 className="text-base md:text-lg font-medium">Image Palette</h3>
                        <span className="text-sm text-muted-foreground">({imagePalette.length}/{paletteSize})</span>
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            type="button"
                            onClick={()=> setPaletteSize(s=> Math.max(4, s-1))}
                            disabled={paletteSize<=4}
                            className="w-6 h-6 md:w-7 md:h-7 border border-border rounded-sm flex items-center justify-center text-sm md:text-lg leading-none font-mono hover:bg-accent/30 disabled:opacity-40 touch-manipulation"
                            title="Decrease palette size"
                            aria-label="Decrease palette size"
                          >−</button>
                          <button
                            type="button"
                            onClick={()=> setPaletteSize(s=> Math.min(16, s+1))}
                            disabled={paletteSize>=16}
                            className="w-6 h-6 md:w-7 md:h-7 border border-border rounded-sm flex items-center justify-center text-sm md:text-lg leading-none font-mono hover:bg-accent/30 disabled:opacity-40 touch-manipulation"
                            title="Increase palette size"
                            aria-label="Increase palette size"
                          >+</button>
                        </div>
                      </div>
                      <div className="grid gap-2 p-1 rounded-md bg-muted/10 border border-border" style={{gridTemplateColumns:`repeat(${imagePalette.length}, minmax(24px,1fr))`}}>
                        {imagePalette.map((colour, index) => (
                          <button
                            key={index}
                            onClick={() => { setHexColour(colour); copyToClipboard(colour, 'HEX'); }}
                            className="relative w-full h-7 md:h-8 rounded-sm border border-border/70 hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary group transition-colors touch-manipulation"
                            style={{backgroundColor: colour}}
                            aria-label={`Use palette colour ${colour}`}
                            title={`Click to use ${colour}`}
                          >
                            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-black/80 text-white px-1 py-0.5 rounded text-[9px] font-mono opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">{colour}</div>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Click a swatch to set the colour. Use + / − to adjust count.</p>
                    </div>
                  )}
                  {lockedSamples.length > 0 && (
                    <div className="space-y-3 pt-6 border-t">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base md:text-lg font-medium">Locked Samples</h3>
                        <span className="text-sm text-muted-foreground">({lockedSamples.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {lockedSamples.map((c,i)=>(
                          <button
                            key={`${c}-${i}`}
                            onClick={()=> copyToClipboard(c,'HEX')}
                            onContextMenu={(e)=>{ e.preventDefault(); setLockedSamples(ls => ls.filter((_,idx)=> idx!==i)); }}
                            className="relative w-9 h-9 md:w-10 md:h-10 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary group touch-manipulation"
                            style={{ background: c }}
                            aria-label={`Locked sample ${c}. Click to copy. Right-click to remove.`}
                          >
                            <span className="absolute inset-0 rounded-md bg-black/0 group-hover:bg-black/10 transition-colors" />
                            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-black/80 text-white px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">{c}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">Right-click a swatch to remove. Locked swatches capture current sampling mode.</p>
                    </div>
                  )}
                  </div>{/* end space-y-4 wrapper */}
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

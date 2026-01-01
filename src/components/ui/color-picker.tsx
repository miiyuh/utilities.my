import Color from 'color';
import { Copy, PipetteIcon, Check } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export type ColorPickerProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange'
> & {
  /** Hex color value (e.g., "#FF0000") */
  value?: string;
  /** Initial hex color if value is not controlled */
  defaultValue?: string;
  /** Called with hex color string when color changes */
  onChange?: (hex: string) => void;
  /** Show alpha/opacity slider */
  showAlpha?: boolean;
};

/** HSV to RGB conversion */
function hsvToRgb(
  h: number,
  s: number,
  v: number
): [number, number, number] {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/** RGB to HSV conversion */
function rgbToHsv(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }

  return [h, s * 100, v * 100];
}

/** Draw the saturation-value gradient canvas */
function drawGradient(
  canvas: HTMLCanvasElement,
  hue: number
): void {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const { width, height } = canvas;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sat = (x / width) * 100;
      const val = 100 - (y / height) * 100;
      const [r, g, b] = hsvToRgb(hue, sat, val);
      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Integrated color picker component with swatch button and popover controls.
 */
export function ColorPicker({
  value,
  defaultValue = '#000000',
  onChange,
  showAlpha = false,
  className,
  ...props
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hue, setHue] = useState(0);
  const [sat, setSat] = useState(100);
  const [val, setVal] = useState(100);
  const [alpha, setAlpha] = useState(100);
  const [hexInput, setHexInput] = useState(defaultValue);
  const [copied, setCopied] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleCanvasRef = useCallback((node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
    setCanvasReady(Boolean(node));
  }, []);
  const skipOnChange = useRef(false);

  // Parse a hex string into HSV state
  const parseHex = useCallback((hex: string, skipNotify = false) => {
    try {
      const c = Color(hex);
      const [r, g, b] = c.rgb().array();
      const [h, s, v] = rgbToHsv(r, g, b);
      skipOnChange.current = skipNotify;
      setHue(h);
      setSat(s);
      setVal(v);
      setAlpha(Math.round(c.alpha() * 100));
      setHexInput(c.hex());
    } catch {
      // Invalid color
    }
  }, []);

  // Sync from controlled value prop
  useEffect(() => {
    if (value) {
      parseHex(value, true);
    }
  }, [value, parseHex]);

  // Initialize from defaultValue on mount
  useEffect(() => {
    if (value) return;
    parseHex(defaultValue, true);
  }, [defaultValue, value, parseHex]);

  // Notify parent when HSV changes (unless we're syncing from props)
  useEffect(() => {
    if (skipOnChange.current) {
      skipOnChange.current = false;
      return;
    }
    if (onChange) {
      const [r, g, b] = hsvToRgb(hue, sat, val);
      const hex = Color.rgb(r, g, b).alpha(alpha / 100).hex();
      onChange(hex);
      setHexInput(hex);
    }
  }, [hue, sat, val, alpha, onChange]);

  // Draw canvas when popover opens or hue changes
  useEffect(() => {
    if (!open || !canvasReady || !canvasRef.current) return;
    const id = requestAnimationFrame(() => {
      if (canvasRef.current) {
        drawGradient(canvasRef.current, hue);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [open, hue, canvasReady]);

  // Handle click/drag on SV canvas
  const handleCanvasInteraction = (
    e: React.MouseEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setSat(x * 100);
    setVal(100 - y * 100);
  };

  const handleEyeDropper = async () => {
    try {
      // @ts-expect-error - EyeDropper API is experimental
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      parseHex(result.sRGBHex);
    } catch {
      // Not available or cancelled
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(hexInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setHexInput(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      parseHex(v);
    }
  };

  // Current color for display
  const [r, g, b] = hsvToRgb(hue, sat, val);
  const currentColor = Color.rgb(r, g, b).alpha(alpha / 100).hexa();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'h-10 w-10 rounded border border-border/70 shadow-sm cursor-pointer transition-colors hover:border-primary/70',
            className
          )}
          style={{ backgroundColor: currentColor }}
          title={hexInput}
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
        />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-4">
          {/* SV Canvas */}
          <div>
            <label className="mb-2 block text-sm font-medium">Color</label>
            <canvas
              ref={handleCanvasRef}
              width={240}
              height={140}
              onClick={handleCanvasInteraction}
              onMouseDown={(e) => {
                handleCanvasInteraction(e);
                const onMove = (ev: MouseEvent) => {
                  handleCanvasInteraction(ev as unknown as React.MouseEvent<HTMLCanvasElement>);
                };
                const onUp = () => {
                  window.removeEventListener('mousemove', onMove);
                  window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
              className="w-full cursor-crosshair rounded border border-border"
              style={{ aspectRatio: '240 / 140' }}
            />
          </div>

          {/* Hue Slider */}
          <div>
            <label className="mb-2 block text-sm font-medium">Hue</label>
            <Slider
              value={[hue]}
              onValueChange={([v]) => setHue(v)}
              max={360}
              step={1}
              className="w-full"
              style={{
                background: `linear-gradient(to right, 
                  hsl(0, 100%, 50%), 
                  hsl(60, 100%, 50%), 
                  hsl(120, 100%, 50%), 
                  hsl(180, 100%, 50%), 
                  hsl(240, 100%, 50%), 
                  hsl(300, 100%, 50%), 
                  hsl(360, 100%, 50%))`,
                borderRadius: '4px',
              }}
            />
          </div>

          {/* Alpha Slider */}
          {showAlpha && (
            <div>
              <label className="mb-2 block text-sm font-medium">
                Opacity ({alpha}%)
              </label>
              <Slider
                value={[alpha]}
                onValueChange={([v]) => setAlpha(v)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          )}

          {/* Hex Input + Buttons */}
          <div className="flex gap-2">
            <Input
              type="text"
              value={hexInput}
              onChange={handleHexChange}
              placeholder="#000000"
              className="h-9 flex-1 font-mono text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-9 w-9 p-0"
              type="button"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleEyeDropper}
              className="h-9 w-9 p-0"
              type="button"
              title="Pick color from screen"
            >
              <PipetteIcon size={16} />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Download, Settings2, Upload, Trash2, QrCode as QrCodeIcon, Copy, QrCode, ImageDown, RefreshCcw, Info } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { ColorPicker } from '@/components/ui/color-picker';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type PayloadType = "url" | "text" | "email" | "sms" | "tel" | "wifi";
type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
type WifiEncryption = "WPA" | "WEP" | "nopass";
type OutputFormat = "png" | "svg";

// SVG output size constant (512x512 pixels)
const SVG_OUTPUT_SIZE = 512;

// Helper function to validate HEX color
const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/i.test(color);
};

export default function QrCodeGeneratorPage() {
  const { toast } = useToast();
  
  // QR Value and Payload States
  const [qrValue, setQrValue] = useState(''); 
  const [payloadType, setPayloadType] = useState<PayloadType>('url');
  const [urlInput, setUrlInput] = useState('');
  const [plainTextInput, setPlainTextInput] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [smsNumber, setSmsNumber] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [telNumber, setTelNumber] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<WifiEncryption>('WPA');

  // Customization States
  const [qrSize, setQrSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColorHex, setBgColorHex] = useState('#FFFFFF');
  const [bgTransparent, setBgTransparent] = useState(false);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<ErrorCorrectionLevel>('M');
  
  // Logo States
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(0.15); 
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Output States
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');
  const [downloadFilename, setDownloadFilename] = useState('qrcode.png');
  const [manualFilenameEdited, setManualFilenameEdited] = useState(false);
  const [marginSize, setMarginSize] = useState(4);

  const qrCanvasRef = useRef<HTMLDivElement>(null);
  const qrSvgRef = useRef<SVGSVGElement>(null);
  const suggestedFilenameRef = useRef<string>('qrcode');


  // Validation helpers and payload limits
  const MAX_PAYLOAD_BYTES = 2048; // 2 KiB limit (tunable)
  const [payloadTooLarge, setPayloadTooLarge] = useState(false);

  const isValidUrl = (v: string) => {
    if (!v) return false;
    try {
      const u = new URL(v);
      return ['http:', 'https:'].includes(u.protocol);
    } catch { return false; }
  };
  const isValidEmail = (v: string) => /^(?:[a-zA-Z0-9_'^&+=%$!*~`{|}.-]+)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(v);
  const isValidPhone = (v: string) => !!v && /^[+\d][\d ()-]{4,}$/.test(v);

  const validatePayload = (): boolean => {
    if (!qrValue) {
      toast({ title: 'Input Empty', description: 'Please enter data to generate a QR code.', variant: 'destructive' });
      return false;
    }
    // payload-type specific checks
    if (payloadType === 'url' && !isValidUrl(urlInput)) {
      toast({ title: 'Invalid URL', description: 'Please enter a valid URL (include http:// or https://).', variant: 'destructive' });
      return false;
    }
    if (payloadType === 'email' && !isValidEmail(emailTo)) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return false;
    }
    if (payloadType === 'sms' && !isValidPhone(smsNumber)) {
      toast({ title: 'Invalid Phone', description: 'Please enter a valid phone number for SMS.', variant: 'destructive' });
      return false;
    }
    if (payloadType === 'tel' && !isValidPhone(telNumber)) {
      toast({ title: 'Invalid Phone', description: 'Please enter a valid phone number.', variant: 'destructive' });
      return false;
    }
    if (payloadType === 'wifi' && !wifiSsid) {
      toast({ title: 'Missing SSID', description: 'Please enter a Wi‑Fi SSID (network name).', variant: 'destructive' });
      return false;
    }
    if (logoSrc && logoSize > 0.2) {
      toast({ title: 'Logo too large', description: 'Logo must be ≤20% of the QR area for reliable scanning.', variant: 'destructive' });
      return false;
    }
    if (payloadTooLarge) {
      toast({ title: 'Payload too large', description: 'The QR payload is too large — shorten the text or reduce options.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  // Effect to update qrValue based on payloadType and its fields (debounced)
  useEffect(() => {
    let newQrValue = '';
    switch (payloadType) {
      case 'url':
        newQrValue = urlInput;
        break;
      case 'text':
        newQrValue = plainTextInput;
        break;
      case 'email':
        const subjectQuery = emailSubject ? `?subject=${encodeURIComponent(emailSubject)}` : '';
        const bodyQuery = emailBody ? `${subjectQuery ? '&' : '?'}body=${encodeURIComponent(emailBody)}` : '';
        newQrValue = `mailto:${emailTo}${subjectQuery}${bodyQuery}`;
        break;
      case 'sms':
        // Do not URL-encode the SMS message; some scanners/apps don't decode %20 etc.
        // Use the standard SMSTO format: SMSTO:number:message
        newQrValue = `smsto:${smsNumber}:${smsMessage}`;
        break;
      case 'tel':
        newQrValue = `tel:${telNumber}`;
        break;
      case 'wifi':
        newQrValue = `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};;`;
        break;
      default:
        newQrValue = '';
    }

    // Debounce the final value to avoid frequent re-renders
    const handle = window.setTimeout(() => {
      setQrValue(newQrValue);
      const bytes = new TextEncoder().encode(newQrValue || '').length;
      setPayloadTooLarge(bytes > MAX_PAYLOAD_BYTES);
    }, 300);
    return () => clearTimeout(handle);
  }, [payloadType, urlInput, plainTextInput, emailTo, emailSubject, emailBody, smsNumber, smsMessage, telNumber, wifiSsid, wifiPassword, wifiEncryption]);

  // Update filename extension or suggest base when format changes
  useEffect(() => {
    setDownloadFilename(prev => {
      if (!manualFilenameEdited) {
        const base = suggestedFilenameRef.current || 'qrcode';
        return `${base}.${outputFormat}`;
      }
      const dot = prev.lastIndexOf('.');
      const base = dot > 0 ? prev.slice(0, dot) : prev || 'qrcode';
      return `${base}.${outputFormat}`;
    });
  }, [outputFormat, manualFilenameEdited]);

  // Suggest filename based on current payload value
  useEffect(() => {
    if (!manualFilenameEdited) {
      const raw = qrValue || 'qrcode';
      const base = raw
        .replace(/^https?:\/\//i, '')
        .slice(0, 50)
        .replace(/[^a-z0-9-_]+/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'qrcode';
      suggestedFilenameRef.current = base.toLowerCase();
      setDownloadFilename(`${suggestedFilenameRef.current}.${outputFormat}`);
    }
  }, [qrValue, manualFilenameEdited, outputFormat]);


  const handleDownload = () => {
    if (!qrValue) {
      toast({ title: 'Input Empty', description: 'Please enter data to generate a QR code.', variant: 'destructive' });
      return;
    }

    // Validate payload before attempting download
    if (!validatePayload()) return;

    const finalFilename = downloadFilename.endsWith(`.${outputFormat}`) ? downloadFilename : `${downloadFilename || 'qrcode'}.${outputFormat}`;
    const downloadLink = document.createElement('a');

    if (outputFormat === 'png') {
        // Create a temporary container for the download-sized QR code
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        document.body.appendChild(tempContainer);
        
        // Create props for the high-resolution QR code
        const downloadQrProps = {
          value: qrValue,
          size: qrSize, // Use actual download size for high resolution
          fgColor: isValidHexColor(fgColor) ? fgColor : '#000000',
          bgColor: getFinalBgColor(),
          level: errorCorrectionLevel,
          marginSize,
          imageSettings: logoSrc ? {
            src: logoSrc,
            height: qrSize * logoSize,
            width: qrSize * logoSize,
            excavate: true,
          } : undefined,
        };

        // Cleanup function to ensure proper resource disposal
        const cleanup = (root: ReturnType<typeof createRoot>) => {
          root.unmount();
          if (tempContainer.parentNode) {
            document.body.removeChild(tempContainer);
          }
        };

        // Render a high-resolution QRCodeCanvas at the actual download size
        const root = createRoot(tempContainer);
        root.render(<QRCodeCanvas {...downloadQrProps} />);
        
        // Canvas rendering delay - allows React to complete rendering before extraction
        // QRCodeCanvas renders synchronously but DOM updates may be batched
        const CANVAS_RENDER_DELAY_MS = 100;
        
        setTimeout(() => {
          const highResCanvas = tempContainer.querySelector('canvas');
          if (highResCanvas) {
            const pngUrl = highResCanvas.toDataURL('image/png');
            downloadLink.href = pngUrl;
            
            cleanup(root);
            
            // Complete the download
            downloadLink.download = finalFilename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            toast({ title: 'QR Code Downloaded', description: `${finalFilename} has been downloaded.` });
          } else {
            cleanup(root);
            toast({ title: 'Download Error', description: 'Could not render high-resolution QR code.', variant: 'destructive' });
            return;
          }
        }, CANVAS_RENDER_DELAY_MS);
     } else if (outputFormat === 'svg') {
        if (qrSvgRef.current) {
            // SVG is already generated at the correct size (512px)
            const svgString = new XMLSerializer().serializeToString(qrSvgRef.current);
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            downloadLink.href = URL.createObjectURL(blob);
            
            downloadLink.download = finalFilename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(downloadLink.href);
            toast({ title: 'QR Code Downloaded', description: `${finalFilename} has been downloaded.` });
        } else {
            toast({ title: 'Download Error', description: 'Could not find QR code SVG element.', variant: 'destructive' });
            return;
        }
    } else {
        toast({ title: 'Unsupported Format', description: 'Selected format is not supported for download.', variant: 'destructive' });
        return;
    }
  };

  const copyPngToClipboard = async () => {
    if (outputFormat !== 'png') {
      toast({ title: 'PNG Only', description: 'Switch to PNG to copy image.', variant: 'destructive' });
      return;
    }
    if (!qrValue || !qrCanvasRef.current) {
      toast({ title: 'Nothing to Copy', description: 'Generate a QR code first.', variant: 'destructive' });
      return;
    }
    const canvas = qrCanvasRef.current.querySelector('canvas');
    if (!canvas) {
      toast({ title: 'Copy Failed', description: 'Canvas not found.', variant: 'destructive' });
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).ClipboardItem && navigator.clipboard?.write) {
        const blob: Blob | null = await new Promise(res => canvas.toBlob(b => res(b), 'image/png'));
        if (blob) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const item = new (window as any).ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          toast({ title: 'Copied!', description: 'QR PNG copied to clipboard.' });
          return;
        }
      }
      const dataUrl = canvas.toDataURL('image/png');
      await navigator.clipboard.writeText(dataUrl);
      toast({ title: 'Copied (Data URL)', description: 'PNG data URL copied.' });
    } catch (e) {
      toast({ title: 'Copy Failed', description: String(e), variant: 'destructive' });
    }
  };

  const resetAll = () => {
    setPayloadType('url');
    setUrlInput('');
    setPlainTextInput('');
    setEmailTo('');
    setEmailSubject('');
    setEmailBody('');
    setSmsNumber('');
    setSmsMessage('');
    setTelNumber('');
    setWifiSsid('');
    setWifiPassword('');
    setWifiEncryption('WPA');
    setQrSize(256);
    setFgColor('#000000');
    setBgColorHex('#FFFFFF');
    setBgTransparent(false);
    setErrorCorrectionLevel('M');
    setLogoSrc(null);
    setLogoSize(0.15);
    setOutputFormat('png');
    setMarginSize(4);
    setManualFilenameEdited(false);
    suggestedFilenameRef.current = 'qrcode';
    toast({ title: 'Reset', description: 'All settings reverted.' });
  };
  
  const getFinalBgColor = (): string => {
    if (bgTransparent) return 'transparent';
    return isValidHexColor(bgColorHex) ? bgColorHex : '#FFFFFF';
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoSrc(e.target?.result as string);
        // Enforce max logo size of 20% for reliable scanning
        if (logoSize > 0.2) {
          setLogoSize(0.2);
          toast({ title: 'Logo Uploaded', description: `${file.name} — logo size exceeded 20% and was clamped for reliability.` });
        } else {
          toast({ title: 'Logo Uploaded', description: file.name });
        }
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

  // Auto-upgrade error correction to H when a logo is present for more resilience
  useEffect(() => {
    if (logoSrc && errorCorrectionLevel !== 'H') {
      setErrorCorrectionLevel('H');
      toast({ title: 'Error Correction Upgraded', description: 'Increased to H because a logo is present to improve scan reliability.' });
    }
  }, [logoSrc, errorCorrectionLevel, toast]);
  
  const handleHexColorInput = (value: string, setColorHex: React.Dispatch<React.SetStateAction<string>>) => {
    let newHex = value;
    if (!newHex.startsWith('#')) {
      newHex = '#' + newHex;
    }
    if (/^#[0-9A-Fa-f]{0,6}$/i.test(newHex)) {
       setColorHex(newHex);
    } else if (value === "" || value === "#") { 
       setColorHex(value);
    }
  };

  const handleCopyHtmlEmbed = async () => {
    if (!qrValue) {
        toast({ title: 'Cannot Copy', description: 'Generate a QR code first.', variant: 'destructive' });
        return;
    }
    let embedCode = '';
    if (outputFormat === 'png' && qrCanvasRef.current) {
        const canvas = qrCanvasRef.current.querySelector('canvas');
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            embedCode = `<img src="${dataUrl}" alt="QR Code" width="${qrSize}" height="${qrSize}">`;
        }
    } else if (outputFormat === 'svg' && qrSvgRef.current) {
        embedCode = qrSvgRef.current.outerHTML;
    }

    if (embedCode) {
        try {
            await navigator.clipboard.writeText(embedCode);
            toast({ title: 'HTML Embed Copied!', description: `${outputFormat === 'svg' ? '<svg> markup' : '<img> tag'} copied to clipboard.` });
        } catch (err) {
            toast({ title: 'Copy Failed', description: `Could not copy HTML embed code. Error: ${err}`, variant: 'destructive' });
        }
    } else {
        toast({ title: 'Cannot Copy', description: `Could not generate embed code for ${outputFormat.toUpperCase()}.`, variant: 'destructive' });
    }
  };

  const renderPayloadInputs = () => {
    switch (payloadType) {
      case 'url':
        return (
          <div className="space-y-2">
            <Label htmlFor="urlInput">URL</Label>
            <Input id="urlInput" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://example.com" />
          </div>
        );
      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor="plainTextInput">Plain Text</Label>
            <Textarea id="plainTextInput" value={plainTextInput} onChange={(e) => setPlainTextInput(e.target.value)} placeholder="Enter your text here" rows={3}/>
          </div>
        );
      case 'email':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailTo">To (Email Address)</Label>
              <Input id="emailTo" type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="recipient@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailSubject">Subject</Label>
              <Input id="emailSubject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Email Subject" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailBody">Body</Label>
              <Textarea id="emailBody" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Email body message" rows={3}/>
            </div>
          </div>
        );
      case 'sms':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smsNumber">Phone Number</Label>
              <Input id="smsNumber" type="tel" value={smsNumber} onChange={(e) => setSmsNumber(e.target.value)} placeholder="+1234567890" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smsMessage">Message</Label>
              <Textarea id="smsMessage" value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} placeholder="Your SMS message" rows={3}/>
            </div>
          </div>
        );
      case 'tel':
        return (
          <div className="space-y-2">
            <Label htmlFor="telNumber">Phone Number</Label>
            <Input id="telNumber" type="tel" value={telNumber} onChange={(e) => setTelNumber(e.target.value)} placeholder="+1234567890" />
          </div>
        );
      case 'wifi':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wifiSsid">SSID (Network Name)</Label>
              <Input id="wifiSsid" value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)} placeholder="MyNet" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wifiPassword">Password</Label>
              <Input id="wifiPassword" type="password" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} placeholder="Network Password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wifiEncryption">Encryption</Label>
              <Select value={wifiEncryption} onValueChange={(value) => setWifiEncryption(value as WifiEncryption)}>
                <SelectTrigger id="wifiEncryption"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA">WPA/WPA2</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="nopass">None (Open Network)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  const commonQrProps = {
    value: qrValue,
    size: 256, // Fixed preview size (256px for display)
    fgColor: isValidHexColor(fgColor) ? fgColor : '#000000',
    bgColor: getFinalBgColor(),
    level: errorCorrectionLevel,
    marginSize,
    imageSettings: logoSrc ? {
      src: logoSrc,
      height: 256 * logoSize, // Use fixed preview size instead of qrSize
      width: 256 * logoSize,
      excavate: true,
    } : undefined,
  };

  // Props for SVG with proper output size
  const svgQrProps = {
    value: qrValue,
    size: SVG_OUTPUT_SIZE, // Use full output size for SVG
    fgColor: isValidHexColor(fgColor) ? fgColor : '#000000',
    bgColor: getFinalBgColor(),
    level: errorCorrectionLevel,
    includeMargin: marginSize > 0,
    imageSettings: logoSrc ? {
      src: logoSrc,
      height: SVG_OUTPUT_SIZE * logoSize,
      width: SVG_OUTPUT_SIZE * logoSize,
      excavate: true,
    } : undefined,
  };

  // Props for download with actual qrSize


  const qrByteLength = new TextEncoder().encode(qrValue || '').length;
  const complexityHint = (() => {
    if (!qrValue) return 'Enter data to generate a code';
    if (qrByteLength < 50) return 'Very small payload';
    if (qrByteLength < 150) return 'Moderate payload';
    if (qrByteLength < 500) return 'Large payload (may increase version)';
    return 'Very large payload (consider shortening)';
  })();

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
              <QrCode className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold font-headline">QR Code Generator</h1>
            </div>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">QR Code Generator</h1>
              <p className="text-lg text-muted-foreground">Generate QR codes from text or URLs.</p>
            </div>
            
            <div className="space-y-8">
              <div className="grid lg:grid-cols-3 gap-6 xl:gap-8 h-full">
              {/* Left Panel: Inputs & Customization */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="minimal-card">
                  <CardHeader className="pb-3 md:pb-4">
                    <CardTitle className="font-headline text-lg md:text-xl tracking-tight">Content & Data Type</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 md:space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="payloadType">Payload Type</Label>
                        <Select value={payloadType} onValueChange={(value) => setPayloadType(value as PayloadType)}>
                            <SelectTrigger id="payloadType"><SelectValue /></SelectTrigger>
                            <SelectContent>
                            <SelectItem value="url">URL</SelectItem>
                            <SelectItem value="text">Plain Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="tel">Phone Number</SelectItem>
                            <SelectItem value="wifi">Wi-Fi Credentials</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="pt-2 space-y-3">
                        {renderPayloadInputs()}
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" disabled={!qrValue} onClick={handleCopyHtmlEmbed} className="h-8 px-3">
                            <Copy className="h-3.5 w-3.5 mr-1" /> HTML
                          </Button>
                          <Button type="button" variant="outline" size="sm" disabled={!qrValue || outputFormat!=='png'} onClick={copyPngToClipboard} className="h-8 px-3">
                            <ImageDown className="h-3.5 w-3.5 mr-1" /> PNG
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={resetAll} className="h-8 px-3">
                            <RefreshCcw className="h-3.5 w-3.5 mr-1" /> Reset
                          </Button>
                        </div>
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                          <span>{qrByteLength} bytes</span>
                          <span>Error Correction: {errorCorrectionLevel}</span>
                        </div>
                        <div className="w-full h-1 bg-border/60 rounded overflow-hidden">
                          <div className={`h-full transition-all ${qrByteLength<150?'bg-primary':qrByteLength<500?'bg-amber-500':'bg-destructive'}`} style={{width: `${Math.min(100, (qrByteLength/600)*100)}%`}} />
                        </div>
                        <p className="text-[11px] leading-snug text-muted-foreground">{complexityHint}</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Customization Section */}
                <Card className="minimal-card">
                  <CardHeader className="pb-3 md:pb-4">
                    <CardTitle className="flex items-center font-headline text-lg md:text-xl tracking-tight"><Settings2 className="mr-2 h-5 w-5" /> Customization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 md:space-y-5">
                    <TooltipProvider delayDuration={200}>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="errorCorrectionLevel">Error Correction</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="inline-flex items-center text-muted-foreground hover:text-foreground" aria-label="About error correction levels">
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs leading-snug">
                              Higher levels add redundancy for damaged codes but increase density. Use M for most cases.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Select value={errorCorrectionLevel} onValueChange={(value) => setErrorCorrectionLevel(value as ErrorCorrectionLevel)}>
                          <SelectTrigger id="errorCorrectionLevel"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="L">Low (7%)</SelectItem>
                            <SelectItem value="M">Medium (15%)</SelectItem>
                            <SelectItem value="Q">Quartile (25%)</SelectItem>
                            <SelectItem value="H">High (30%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TooltipProvider>

                    {outputFormat === 'png' && (
                      <div className="space-y-2">
                        <Label htmlFor="qrSize">QR Code Size: {qrSize}px</Label>
                        <Slider
                          id="qrSize"
                          min={64}
                          max={1024}
                          step={16}
                          value={[qrSize]}
                          onValueChange={(value) => setQrSize(value[0])}
                        />
                        <div className="flex flex-wrap gap-2 pt-1">
                          {[128,256,384,512,768,1024].map(sz => (
                            <button key={sz} type="button" onClick={()=> setQrSize(sz)} className={`px-2 h-7 text-[11px] rounded-sm border border-border/70 hover:border-primary/60 hover:bg-accent/30 font-mono ${qrSize===sz?'bg-accent/40 border-primary/60':''}`}>{sz}px</button>
                          ))}
                        </div>
                      </div>
                    )}

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
                          <ColorPicker
                            value={isValidHexColor(fgColor) ? fgColor : '#000000'}
                            onChange={(hex: string) => setFgColor(hex)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bgColorText">Background Color</Label>
                         <div className="flex items-center gap-2">
                          <Input
                            id="bgColorText"
                            type="text"
                            value={bgColorHex}
                            onChange={(e) => handleHexColorInput(e.target.value, setBgColorHex)}
                            placeholder="#FFFFFF"
                            className="font-mono flex-grow"
                            disabled={bgTransparent}
                          />
                          <ColorPicker
                            value={isValidHexColor(bgColorHex) ? bgColorHex : '#FFFFFF'}
                            onChange={(hex: string) => setBgColorHex(hex)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                      <div className="flex items-center space-x-2">
                          <Switch id="bgTransparent" checked={bgTransparent} onCheckedChange={setBgTransparent} />
                          <Label htmlFor="bgTransparent">Transparent BG</Label>
                      </div>
                    </div>

                    {/* Border Size Section */}
                    <div className="space-y-2">
                      <Label htmlFor="marginSize">Border Size (Quiet Zone): {marginSize}px</Label>
                      <div className="flex flex-col gap-1">
                        <Slider
                          id="marginSize"
                          min={0}
                          max={64}
                          step={1}
                          value={[marginSize]}
                          onValueChange={(val) => setMarginSize(val[0])}
                        />
                        <div className="text-xs text-muted-foreground">Adjust the border (quiet zone) around the QR code from 0 to 64 pixels.</div>
                      </div>
                    </div>

                    {/* Logo Section */}
                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-medium">Logo (Optional)</h4>
                        <div className="space-y-2">
                            <Label htmlFor="logoUpload">Upload Logo Image</Label>
                            <Input
                                id="logoUpload"
                                type="file"
                                accept="image/png, image/jpeg, image/svg+xml"
                                onChange={handleLogoUpload}
                                ref={logoFileInputRef}
                                className="hidden"
                            />
                             <Button 
                                variant="outline" 
                                className="w-full" 
                                onClick={() => logoFileInputRef.current?.click()}
                              >
                                <Upload className="mr-2 h-4 w-4" /> Choose Logo
                              </Button>
                        </div>
                        {logoSrc && (
                            <div className="space-y-3 pt-3">
                                <div className="flex justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={logoSrc} alt="Logo preview" className="max-h-20 border rounded-md p-1 bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="logoSize">Logo Size: {Math.round(logoSize * 100)}% of QR Code</Label>
                                    <div className="flex flex-col gap-1">
                                      <Slider
                                        id="logoSize"
                                        min={5}
                                        max={20}
                                        step={1}
                                        value={[Math.min(20, logoSize * 100)]}
                                        onValueChange={(val) => {
                                          const v = Math.min(20, val[0]);
                                          setLogoSize(v / 100);
                                        }}
                                      />
                                      <div className="text-xs text-muted-foreground">Max 20% recommended to ensure QR remains scannable on devices like iPhone camera.</div>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={clearLogo} className="w-full text-destructive hover:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Clear Logo
                                </Button>
                            </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel: Preview & Download */}
              <div className="lg:col-span-1 space-y-8">
                <Card className="h-fit minimal-card">
                  <CardHeader className="pb-3 md:pb-4">
                    <CardTitle className="font-headline text-lg md:text-xl tracking-tight">Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4 md:space-y-5">
                    {qrValue ? (
                      <div className={`p-4 rounded-sm inline-block border border-border ${bgTransparent? 'bg-[linear-gradient(45deg,#eee_25%,transparent_25%,transparent_75%,#eee_75%),linear-gradient(45deg,#eee_25%,transparent_25%,transparent_75%,#eee_75%)] bg-[length:12px_12px] bg-[0_0,6px_6px] dark:bg-[linear-gradient(45deg,#333_25%,transparent_25%,transparent_75%,#333_75%),linear-gradient(45deg,#333_25%,transparent_25%,transparent_75%,#333_75%)] dark:bg-[length:12px_12px] dark:bg-[0_0,6px_6px]':''} bg-background relative`}> 
                        {outputFormat === 'png' ? (
                          <div ref={qrCanvasRef} className="relative inline-block">
                             <QRCodeCanvas {...commonQrProps} />
                          </div>
                        ) : (
                          <div className="relative inline-block">
                            <QRCodeSVG {...svgQrProps} ref={qrSvgRef} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full max-w-[288px] aspect-square rounded-sm flex flex-col items-center justify-center text-muted-foreground p-4 border border-dashed border-border/70 bg-background/40">
                        <QrCodeIcon className="h-10 w-10 mb-2 opacity-60" />
                        <span className="text-xs text-center tracking-wide uppercase">Enter data to generate</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="minimal-card">
                  <CardHeader className="pb-3 md:pb-4">
                    <CardTitle className="font-headline text-lg md:text-xl tracking-tight">Download</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 md:space-y-5">
                    <div className="flex items-end gap-2">
                       <div className="flex-1 space-y-1">
                          <Label htmlFor="outputFormat">File Type</Label>
                          <Select value={outputFormat} onValueChange={(value) => setOutputFormat(value as OutputFormat)}>
                              <SelectTrigger id="outputFormat"><SelectValue /></SelectTrigger>
                              <SelectContent>
                              <SelectItem value="png">PNG</SelectItem>
                              <SelectItem value="svg">SVG</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="flex-1 space-y-1">
                          <Label htmlFor="downloadFilename">Filename</Label>
              <Input 
                id="downloadFilename" 
                value={downloadFilename} 
                onChange={(e) => { setDownloadFilename(e.target.value); setManualFilenameEdited(true); }}
                placeholder={`qrcode.${outputFormat}`}
              />
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button onClick={handleCopyHtmlEmbed} variant="outline" className="w-full">
                          <Copy className="mr-2 h-4 w-4" /> HTML Embed
                      </Button>
                      <Button onClick={handleDownload} disabled={!qrValue} className="w-full">
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                    </div>
          <p className="text-[11px] text-muted-foreground leading-snug">Tip: SVG stays vector for print; PNG is raster. Include a quiet zone for better scanning.</p>
                  </CardContent>
                </Card>
              </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}


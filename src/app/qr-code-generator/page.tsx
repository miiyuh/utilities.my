
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, Download, Settings2, Upload, Trash2, QrCode as QrCodeIcon, Copy } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Slider } from '@/components/ui/slider';

type PayloadType = "url" | "text" | "email" | "sms" | "tel" | "wifi";
type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
type WifiEncryption = "WPA" | "WEP" | "nopass";
type OutputFormat = "png" | "svg";


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

  const qrCanvasRef = useRef<HTMLDivElement>(null);
  const qrSvgRef = useRef<SVGSVGElement>(null);


  // Effect to update qrValue based on payloadType and its fields
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
        newQrValue = `smsto:${smsNumber}:${encodeURIComponent(smsMessage)}`;
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
    setQrValue(newQrValue);
  }, [payloadType, urlInput, plainTextInput, emailTo, emailSubject, emailBody, smsNumber, smsMessage, telNumber, wifiSsid, wifiPassword, wifiEncryption]);

  // Effect to update filename extension when output format changes
  useEffect(() => {
    setDownloadFilename(prev => {
      const nameWithoutExtension = prev.substring(0, prev.lastIndexOf('.')) || prev || "qrcode";
      return `${nameWithoutExtension}.${outputFormat}`;
    });
  }, [outputFormat]);


  const handleDownload = () => {
    if (!qrValue) {
      toast({ title: 'Input Empty', description: 'Please enter data to generate a QR code.', variant: 'destructive' });
      return;
    }

    const finalFilename = downloadFilename.endsWith(`.${outputFormat}`) ? downloadFilename : `${downloadFilename || 'qrcode'}.${outputFormat}`;
    let downloadLink = document.createElement('a');

    if (outputFormat === 'png') {
        if (qrCanvasRef.current) {
            const canvas = qrCanvasRef.current.querySelector('canvas');
            if (canvas) {
                const pngUrl = canvas.toDataURL('image/png');
                downloadLink.href = pngUrl;
            } else {
                 toast({ title: 'Download Error', description: 'Could not find QR code canvas.', variant: 'destructive' });
                 return;
            }
        }
    } else if (outputFormat === 'svg') {
        if (qrSvgRef.current) {
            const svgString = new XMLSerializer().serializeToString(qrSvgRef.current);
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            downloadLink.href = URL.createObjectURL(blob);
        } else {
            toast({ title: 'Download Error', description: 'Could not find QR code SVG element.', variant: 'destructive' });
            return;
        }
    } else {
        toast({ title: 'Unsupported Format', description: 'Selected format is not supported for download.', variant: 'destructive' });
        return;
    }
    
    downloadLink.download = finalFilename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    if (outputFormat === 'svg') {
      URL.revokeObjectURL(downloadLink.href);
    }
    toast({ title: 'QR Code Downloaded', description: `${finalFilename} has been downloaded.` });
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
    size: qrSize,
    fgColor: isValidHexColor(fgColor) ? fgColor : '#000000',
    bgColor: getFinalBgColor(),
    level: errorCorrectionLevel,
    imageSettings: logoSrc ? {
      src: logoSrc,
      height: qrSize * logoSize,
      width: qrSize * logoSize,
      excavate: true,
    } : undefined,
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
            <Card className="w-full max-w-5xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">QR Code Generator</CardTitle>
                <CardDescription>Generate custom QR codes for URLs, text, email, SMS, Wi-Fi credentials, and more. Customize size, colors, and add a logo.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid md:grid-cols-3 gap-8">
                {/* Left Panel: Inputs & Customization */}
                <div className="md:col-span-2 space-y-8">
                  
                  {/* Content & Data Type Section */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">Content & Data Type</h3>
                    <div className="space-y-2">
                        <Label htmlFor="payloadType">Payload Type</Label>
                        <Select value={payloadType} onValueChange={(value) => setPayloadType(value as PayloadType)}>
                            <SelectTrigger id="payloadType"><SelectValue /></SelectTrigger>
                            <SelectContent>
                            <SelectItem value="url">URL</SelectItem>
                            <SelectItem value="text">Plain Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="tel">Phone Number (tel:)</SelectItem>
                            <SelectItem value="wifi">Wi-Fi Credentials</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="pt-2">
                        {renderPayloadInputs()}
                    </div>
                  </div>
                  
                  {/* Customization Section */}
                  <div className="space-y-6 pt-6 border-t">
                    <h3 className="text-lg font-medium flex items-center"><Settings2 className="mr-2 h-5 w-5" /> Customization</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="errorCorrectionLevel">Error Correction Level</Label>
                      <Select value={errorCorrectionLevel} onValueChange={(value) => setErrorCorrectionLevel(value as ErrorCorrectionLevel)}>
                        <SelectTrigger id="errorCorrectionLevel"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L">L (Low ~7%)</SelectItem>
                          <SelectItem value="M">M (Medium ~15%)</SelectItem>
                          <SelectItem value="Q">Q (Quartile ~25%)</SelectItem>
                          <SelectItem value="H">H (High ~30%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

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
                          <Input
                            id="bgColorSwatch"
                            type="color"
                            value={isValidHexColor(bgColorHex) ? bgColorHex : '#FFFFFF'}
                            onChange={(e) => setBgColorHex(e.target.value)}
                            className="h-10 w-12 min-w-[3rem] p-1 cursor-pointer flex-shrink-0"
                            disabled={bgTransparent}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="bgTransparent" checked={bgTransparent} onCheckedChange={setBgTransparent} />
                        <Label htmlFor="bgTransparent">Transparent Background</Label>
                    </div>
                  </div>

                  {/* Logo Section */}
                  <div className="space-y-4 pt-6 border-t">
                      <h3 className="text-lg font-medium">Logo (Optional)</h3>
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
                                  <img src={logoSrc} alt="Logo preview" className="max-h-20 border rounded-md p-1 bg-white" />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="logoSize">Logo Size: {Math.round(logoSize * 100)}% of QR Code</Label>
                                  <Slider
                                      id="logoSize"
                                      min={5} 
                                      max={30} 
                                      step={1}
                                      value={[logoSize * 100]}
                                      onValueChange={(val) => setLogoSize(val[0] / 100)}
                                  />
                              </div>
                              <Button variant="outline" onClick={clearLogo} className="w-full text-destructive hover:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> Clear Logo
                              </Button>
                          </div>
                      )}
                  </div>
                </div>

                {/* Right Panel: Preview & Download */}
                <div className="md:col-span-1 flex flex-col items-center space-y-6 md:pt-10">
                  {qrValue ? (
                    <div className="p-4 bg-white dark:bg-muted/20 rounded-md inline-block shadow-md">
                      {outputFormat === 'png' ? (
                        <div ref={qrCanvasRef}>
                           <QRCodeCanvas {...commonQrProps} />
                        </div>
                      ) : (
                        <QRCodeSVG {...commonQrProps} ref={qrSvgRef} />
                      )}
                    </div>
                  ) : (
                    <div className="w-full max-w-[288px] aspect-square bg-muted/30 rounded-md flex flex-col items-center justify-center text-muted-foreground p-4 shadow">
                      <QrCodeIcon className="h-12 w-12 mb-2 opacity-70" />
                      <span className="text-sm text-center">Enter data to generate QR Code</span>
                    </div>
                  )}

                  {/* Output Section */}
                  <div className="w-full max-w-xs space-y-4">
                    <h3 className="text-lg font-medium text-center md:text-left">Output</h3>
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
                          <Label htmlFor="downloadFilename">Download Filename</Label>
                          <Input 
                              id="downloadFilename" 
                              value={downloadFilename} 
                              onChange={(e) => setDownloadFilename(e.target.value)}
                              placeholder={`qrcode.${outputFormat}`}
                          />
                      </div>
                    </div>
                    <Button onClick={handleCopyHtmlEmbed} variant="outline" className="w-full">
                        <Copy className="mr-2 h-4 w-4" /> Copy HTML Embed Code
                    </Button>
                  </div>
                  
                  <Button onClick={handleDownload} disabled={!qrValue} className="w-full max-w-xs">
                    <Download className="mr-2 h-4 w-4" /> Download QR Code ({outputFormat.toUpperCase()})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}


"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
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
import { QRCodeCanvas } from 'qrcode.react';
import { Slider } from '@/components/ui/slider';

type PayloadType = "url" | "text" | "email" | "sms" | "tel" | "wifi";
type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
type WifiEncryption = "WPA" | "WEP" | "nopass";


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
  const [downloadFilename, setDownloadFilename] = useState('qrcode.png');

  const qrRef = useRef<HTMLDivElement>(null);

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
        // Format: WIFI:T:<encryption>;S:<ssid>;P:<password>;H:<hidden;>;
        // For simplicity, 'hidden' is not an option here.
        newQrValue = `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};;`;
        break;
      default:
        newQrValue = '';
    }
    setQrValue(newQrValue);
  }, [payloadType, urlInput, plainTextInput, emailTo, emailSubject, emailBody, smsNumber, smsMessage, telNumber, wifiSsid, wifiPassword, wifiEncryption]);


  const handleDownload = () => {
    if (!qrValue) {
      toast({ title: 'Input Empty', description: 'Please enter data to generate a QR code.', variant: 'destructive' });
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
        downloadLink.download = downloadFilename.endsWith('.png') ? downloadFilename : `${downloadFilename}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadLink.href);
        toast({ title: 'QR Code Downloaded', description: `${downloadLink.download} has been downloaded.` });
      }
    }
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
    if (!qrValue || !qrRef.current) {
        toast({ title: 'Cannot Copy', description: 'Generate a QR code first.', variant: 'destructive' });
        return;
    }
    const canvas = qrRef.current.querySelector('canvas');
    if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const embedCode = `<img src="${dataUrl}" alt="QR Code" width="${qrSize}" height="${qrSize}">`;
        try {
            await navigator.clipboard.writeText(embedCode);
            toast({ title: 'HTML Embed Copied!', description: '<img> tag copied to clipboard.' });
        } catch (err) {
            toast({ title: 'Copy Failed', description: 'Could not copy HTML embed code.', variant: 'destructive' });
        }
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
                  
                  {/* Output Section */}
                  <div className="space-y-4 pt-6 border-t">
                    <h3 className="text-lg font-medium">Output</h3>
                    <div className="space-y-2">
                        <Label htmlFor="downloadFilename">Download Filename</Label>
                        <Input 
                            id="downloadFilename" 
                            value={downloadFilename} 
                            onChange={(e) => setDownloadFilename(e.target.value)}
                            placeholder="qrcode.png"
                        />
                    </div>
                    <Button onClick={handleCopyHtmlEmbed} variant="outline" className="w-full">
                        <Copy className="mr-2 h-4 w-4" /> Copy HTML Embed Code
                    </Button>
                  </div>
                </div>

                {/* Right Panel: Preview & Download */}
                <div className="md:col-span-1 flex flex-col items-center space-y-6 md:pt-10">
                  {qrValue ? (
                    <div ref={qrRef} className="p-4 bg-white dark:bg-muted/20 rounded-md inline-block shadow-md">
                      <QRCodeCanvas
                        value={qrValue}
                        size={qrSize}
                        fgColor={isValidHexColor(fgColor) ? fgColor : '#000000'}
                        bgColor={getFinalBgColor()}
                        level={errorCorrectionLevel} 
                        imageSettings={logoSrc ? {
                          src: logoSrc,
                          height: qrSize * logoSize,
                          width: qrSize * logoSize,
                          excavate: true,
                        } : undefined}
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-[288px] aspect-square bg-muted/30 rounded-md flex flex-col items-center justify-center text-muted-foreground p-6 shadow">
                      <QrCodeIcon className="h-16 w-16 mb-2" />
                      <span>Enter data to generate QR Code</span>
                    </div>
                  )}
                  <Button onClick={handleDownload} disabled={!qrValue} className="w-full max-w-xs">
                    <Download className="mr-2 h-4 w-4" /> Download QR Code (PNG)
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



"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Trash2, PanelLeft } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

export default function TextCaseConverterPage() {
  const { toast } = useToast();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');

  const handleConvert = (conversionType: string) => {
    if (!inputText) {
      setOutputText('');
      return;
    }
    let result = '';
    switch (conversionType) {
      case 'uppercase':
        result = inputText.toUpperCase();
        break;
      case 'lowercase':
        result = inputText.toLowerCase();
        break;
      case 'titlecase':
        result = inputText.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
        break;
      case 'sentencecase':
        result = inputText.toLowerCase().replace(/(^\w{1}|\.\s*\w{1})/g, char => char.toUpperCase());
        break;
      default:
        result = inputText;
    }
    setOutputText(result);
  };

  const handleCopy = async () => {
    if (!outputText) {
      toast({ title: 'Nothing to copy', description: 'Output is empty.', variant: 'destructive' });
      return;
    }
    try {
      await navigator.clipboard.writeText(outputText);
      toast({ title: 'Copied to clipboard!', description: 'Converted text has been copied.' });
    } catch (err) {
      toast({ title: 'Copy failed', description: 'Could not copy text to clipboard.', variant: 'destructive' });
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  return (
    <div className="flex h-screen bg-background">
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
            <h1 className="text-xl font-semibold font-headline">Text Case Converter</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
            <Card className="w-full max-w-2xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Text Case Converter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="inputText">Input Text</Label>
                  <Textarea
                    id="inputText"
                    placeholder="Enter text here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => handleConvert('uppercase')}>Uppercase</Button>
                  <Button onClick={() => handleConvert('lowercase')}>Lowercase</Button>
                  <Button onClick={() => handleConvert('titlecase')}>Title Case</Button>
                  <Button onClick={() => handleConvert('sentencecase')}>Sentence Case</Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outputText">Output Text</Label>
                  <Textarea
                    id="outputText"
                    placeholder="Converted text will appear here..."
                    value={outputText}
                    readOnly
                    rows={6}
                    className="resize-none bg-muted/50"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClear} title="Clear all text">
                  <Trash2 className="mr-2 h-4 w-4" /> Clear
                </Button>
                <Button onClick={handleCopy} title="Copy output text">
                  <Copy className="mr-2 h-4 w-4" /> Copy Output
                </Button>
              </CardFooter>
            </Card>
        </div>
      </SidebarInset>
    </div>
  );
}

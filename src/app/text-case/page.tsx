
"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Trash2, PanelLeft, CaseUpper, CaseLower, CaseSensitive, Baseline } from 'lucide-react';
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
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex items-center gap-2">
              <CaseSensitive className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold font-headline">Text Case Converter</h1>
            </div>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Text Case Converter</h1>
              <p className="text-lg text-muted-foreground">Convert text between different letter cases.</p>
            </div>
            
            <div className="space-y-8">
              <div className="max-w-7xl mx-auto space-y-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="inputText">Input Text</Label>
                  <Textarea
                    id="inputText"
                    placeholder="Enter text here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={8}
                    className="resize-none text-base"
                  />
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => handleConvert('uppercase')} className="h-12 px-6">
                    <CaseUpper className="mr-2 h-4 w-4" /> Uppercase
                  </Button>
                  <Button onClick={() => handleConvert('lowercase')} className="h-12 px-6">
                    <CaseLower className="mr-2 h-4 w-4" /> Lowercase
                  </Button>
                  <Button onClick={() => handleConvert('titlecase')} className="h-12 px-6">
                    <CaseSensitive className="mr-2 h-4 w-4" /> Title Case
                  </Button>
                  <Button onClick={() => handleConvert('sentencecase')} className="h-12 px-6">
                    <Baseline className="mr-2 h-4 w-4" /> Sentence Case
                  </Button>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="outputText">Output Text</Label>
                  <Textarea
                    id="outputText"
                    placeholder="Converted text will appear here..."
                    value={outputText}
                    readOnly
                    rows={8}
                    className="resize-none bg-muted/50 text-base"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={handleClear} title="Clear all text" className="h-12 px-6">
                    <Trash2 className="mr-2 h-4 w-4" /> Clear
                  </Button>
                  <Button onClick={handleCopy} title="Copy output text" disabled={!outputText} className="h-12 px-6">
                    <Copy className="mr-2 h-4 w-4" /> Copy Output
                  </Button>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

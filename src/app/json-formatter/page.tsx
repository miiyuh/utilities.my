
"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { Copy, Trash2, AlertCircle, CheckCircle, PanelLeft } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

export default function JsonFormatterPage() {
  const { toast } = useToast();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidJson, setIsValidJson] = useState<boolean | null>(null);

  const handleFormat = () => {
    if (!inputText.trim()) {
      setOutputText('');
      setError(null);
      setIsValidJson(null);
      toast({ title: 'Input is empty', description: 'Please enter JSON to format.', variant: 'default' });
      return;
    }
    try {
      const parsedJson = JSON.parse(inputText);
      const formattedJson = JSON.stringify(parsedJson, null, 2);
      setOutputText(formattedJson);
      setError(null);
      setIsValidJson(true);
      toast({ title: 'JSON Formatted', description: 'Successfully formatted the JSON input.' });
    } catch (e: any) {
      setOutputText('');
      setError(`Invalid JSON: ${e.message}`);
      setIsValidJson(false);
      toast({ title: 'Formatting Failed', description: `Invalid JSON: ${e.message}`, variant: 'destructive' });
    }
  };

  const handleCopy = async () => {
    if (!outputText) {
      toast({ title: 'Nothing to copy', description: 'Output is empty or contains an error.', variant: 'destructive' });
      return;
    }
    try {
      await navigator.clipboard.writeText(outputText);
      toast({ title: 'Copied to clipboard!', description: 'Formatted JSON has been copied.' });
    } catch (err) {
      toast({ title: 'Copy failed', description: 'Could not copy text to clipboard.', variant: 'destructive' });
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setError(null);
    setIsValidJson(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (isValidJson !== null) { 
        setIsValidJson(null);
        setError(null);
        setOutputText(''); 
    }
  }

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
            <h1 className="text-xl font-semibold font-headline">JSON Formatter</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-3xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">JSON Formatter</CardTitle>
                <CardDescription>Paste your JSON data to format it into a readable structure. Also validates the JSON and highlights errors if any.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="inputText">Input JSON</Label>
                  <Textarea
                    id="inputText"
                    placeholder="Paste your JSON here..."
                    value={inputText}
                    onChange={handleInputChange}
                    rows={10}
                    className="font-code resize-none"
                  />
                </div>

                {isValidJson === false && error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {isValidJson === true && !error && (
                   <Alert variant="default" className="border-green-500">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-700 dark:text-green-400">Valid JSON</AlertTitle>
                    <AlertDescription>The input is valid JSON and has been formatted.</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="outputText">Formatted JSON</Label>
                  <Textarea
                    id="outputText"
                    placeholder="Formatted JSON will appear here..."
                    value={outputText}
                    readOnly
                    rows={10}
                    className="font-code resize-none bg-muted/50"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                 <Button onClick={handleFormat}>Format JSON</Button>
                 <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClear} title="Clear all text">
                      <Trash2 className="mr-2 h-4 w-4" /> Clear
                  </Button>
                  <Button onClick={handleCopy} title="Copy formatted JSON" disabled={!outputText || isValidJson === false}>
                      <Copy className="mr-2 h-4 w-4" /> Copy Output
                  </Button>
                 </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

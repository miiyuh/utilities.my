
"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, Copy, Trash2, ArrowDownUp, ALargeSmall, FilterX } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

export default function SorterPage() {
  const { toast } = useToast();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [sortType, setSortType] = useState<'alpha' | 'numeric'>('alpha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);

  const handleSort = () => {
    if (!inputText.trim()) {
      setOutputText('');
      toast({ title: 'Input is empty', description: 'Please enter text to sort.' });
      return;
    }

    let lines = inputText.split('\n');

    if (removeDuplicates) {
      const seen = new Map<string, string>();
      const uniqueLines: string[] = [];
      for (const line of lines) {
        const key = caseSensitive ? line : line.toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, line); // Store the original casing
          uniqueLines.push(line);
        }
      }
      lines = uniqueLines;
    }
    
    lines.sort((a, b) => {
      let valA = caseSensitive ? a : a.toLowerCase();
      let valB = caseSensitive ? b : b.toLowerCase();

      if (sortType === 'numeric') {
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortOrder === 'asc' ? numA - numB : numB - numA;
        }
      }
      // Fallback to alphabetical or if not valid numbers
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    setOutputText(lines.join('\n'));
    toast({ title: 'Text Sorted!', description: `Sorted ${lines.length} lines.` });
  };
  
  const handleCopy = async () => {
    if (!outputText) {
      toast({ title: 'Nothing to copy', variant: 'destructive' });
      return;
    }
    await navigator.clipboard.writeText(outputText);
    toast({ title: 'Copied to clipboard!' });
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
            <SidebarTrigger className="md:hidden">
              <PanelLeft />
            </SidebarTrigger>
            <h1 className="text-xl font-semibold font-headline">Sorter</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-2xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Sorter</CardTitle>
                <CardDescription>Sort lines of text alphabetically or numerically, in ascending or descending order. Options for case sensitivity and removing duplicates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="inputText">Input Text (one item per line)</Label>
                  <Textarea
                    id="inputText"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter items to sort, one per line..."
                    rows={8}
                    className="resize-none font-code"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sortType">Sort Type</Label>
                    <Select value={sortType} onValueChange={(v) => setSortType(v as 'alpha' | 'numeric')}>
                      <SelectTrigger id="sortType"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alpha">Alphabetical</SelectItem>
                        <SelectItem value="numeric">Numerical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">Sort Order</Label>
                    <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
                      <SelectTrigger id="sortOrder"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending (A-Z, 0-9)</SelectItem>
                        <SelectItem value="desc">Descending (Z-A, 9-0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-dashed">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="caseSensitive" checked={caseSensitive} onCheckedChange={(checked) => setCaseSensitive(Boolean(checked))} />
                        <Label htmlFor="caseSensitive" className="font-normal flex items-center">
                            <ALargeSmall className="mr-2 h-4 w-4 text-muted-foreground" /> Case Sensitive
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="removeDuplicates" checked={removeDuplicates} onCheckedChange={(checked) => setRemoveDuplicates(Boolean(checked))} />
                        <Label htmlFor="removeDuplicates" className="font-normal flex items-center">
                            <FilterX className="mr-2 h-4 w-4 text-muted-foreground" /> Remove Duplicates
                        </Label>
                    </div>
                </div>
                
                <Button onClick={handleSort} className="w-full"><ArrowDownUp className="mr-2 h-4 w-4"/> Sort Text</Button>

                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="outputText">Sorted Output</Label>
                  <Textarea
                    id="outputText"
                    value={outputText}
                    readOnly
                    placeholder="Sorted text will appear here..."
                    rows={8}
                    className="resize-none font-code bg-muted/30"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleClear}><Trash2 className="mr-2 h-4 w-4" /> Clear</Button>
                <Button onClick={handleCopy} disabled={!outputText}><Copy className="mr-2 h-4 w-4" /> Copy Output</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

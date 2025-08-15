"use client";

import type { Metadata } from 'next';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownUp, ALargeSmall, FilterX, Trash2, Copy, Upload, Download, Shuffle, ArrowLeftRight, Info } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: 'Sorter',
  description: 'Sort lines naturally, alphabetically, by length, and more. Remove duplicates and tidy text quickly.',
  keywords: ['sort lines', 'natural sort', 'remove duplicates', 'text tools'],
  alternates: { canonical: '/sorter' },
  openGraph: {
    title: 'Sorter · utilities.my',
    url: 'https://utilities.my/sorter',
    images: [{ url: '/api/og?title=Sorter&subtitle=Sort%20%2B%20De-dupe%20Text', width: 1200, height: 630 }],
  },
};

export default function SorterPage() {
  const { toast } = useToast();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [sortType, setSortType] = useState<'alpha' | 'numeric' | 'length' | 'column'>('alpha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [autoSort, setAutoSort] = useState(true);
  const [trimLines, setTrimLines] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(false);
  const [naturalSort, setNaturalSort] = useState(true); // applies to alpha sort
  // Column sort controls
  const [columnIndex, setColumnIndex] = useState<number>(1);
  const [columnNumeric, setColumnNumeric] = useState<boolean>(false);
  const [delimiter, setDelimiter] = useState<'auto'|'comma'|'tab'|'pipe'|'custom'>('auto');
  const [customDelimiter, setCustomDelimiter] = useState<string>('');

  const [stats, setStats] = useState<{inCount:number; outCount:number; uniqueCount:number}>({inCount:0,outCount:0,uniqueCount:0});
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const naturalCompare = (a: string, b: string) => {
    // Split into numeric and non-numeric parts
    const ax = a.match(/(\d+|\D+)/g) || [a];
    const bx = b.match(/(\d+|\D+)/g) || [b];
    const len = Math.max(ax.length, bx.length);
    for (let i = 0; i < len; i++) {
      const as = ax[i] ?? '';
      const bs = bx[i] ?? '';
      const an = /^\d+$/.test(as) ? Number(as) : NaN;
      const bn = /^\d+$/.test(bs) ? Number(bs) : NaN;
      if (!Number.isNaN(an) && !Number.isNaN(bn)) {
        if (an !== bn) return an - bn;
      } else {
        const cmp = as.localeCompare(bs);
        if (cmp !== 0) return cmp;
      }
    }
    return 0;
  };

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const getDelimiterRegex = (sample: string): RegExp => {
    if (delimiter === 'comma') return /,/g;
    if (delimiter === 'tab') return /\t/g;
    if (delimiter === 'pipe') return /\|/g;
    if (delimiter === 'custom') {
      const d = customDelimiter || ',';
      return new RegExp(escapeRegExp(d), 'g');
    }
    // auto detect on sample
    if (sample.includes('\t')) return /\t/g;
    if (sample.includes(',')) return /,/g;
    if (sample.includes('|')) return /\|/g;
    return /,/g;
  };

  const buildProcessedLines = (source: string) => {
    let lines = source.split('\n');
    const inCount = lines.length;
    if (trimLines) lines = lines.map(l => l.trim());
    if (removeEmpty) lines = lines.filter(l => l.length>0);
    if (removeDuplicates) {
      const seen = new Map<string,string>();
      const unique: string[] = [];
      for (const line of lines) {
        const key = caseSensitive ? line : line.toLowerCase();
        if (!seen.has(key)) { seen.set(key, line); unique.push(line); }
      }
      lines = unique;
    }
    return { lines, inCount };
  };

  const sortLines = (lines: string[]) => {
    const sample = lines[0] ?? '';
    const delim = getDelimiterRegex(sample);
    const idx = Math.max(1, columnIndex) - 1;
    const pick = (line: string) => {
      if (sortType === 'column') {
        const cols = line.split(delim);
        let v = cols[idx] ?? '';
        if (!caseSensitive) v = v.toLowerCase();
        return v;
      }
      let v = caseSensitive ? line : line.toLowerCase();
      if (sortType === 'length') return String(v.length).padStart(10, '0') + '|' + v; // stable-ish key
      return v;
    };
    const cmp = (a: string, b: string) => {
      if (sortType === 'numeric') {
        const na = parseFloat(caseSensitive ? a : a.toLowerCase());
        const nb = parseFloat(caseSensitive ? b : b.toLowerCase());
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
      }
      if (sortType === 'column' && columnNumeric) {
        const na = parseFloat(pick(a));
        const nb = parseFloat(pick(b));
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
      }
      const va = pick(a);
      const vb = pick(b);
      const base = (sortType === 'alpha' || sortType === 'column') && naturalSort ? naturalCompare(va, vb) : va.localeCompare(vb);
      if (base !== 0) return base;
      // stable tie-breaker by original index if available
      return 0;
    };
    const arr = [...lines];
    arr.sort((a,b)=> sortOrder==='asc'? cmp(a,b) : -cmp(a,b));
    return arr;
  };

  const handleSort = () => {
    if (!inputText.trim()) {
      setOutputText('');
      toast({ title: 'Input is empty', description: 'Please enter text to sort.' });
      return;
    }
    const { lines, inCount } = buildProcessedLines(inputText);
    const sorted = sortLines(lines);
    const out = sorted.join('\n');
    setOutputText(out);
    setStats({inCount, outCount: sorted.length, uniqueCount: sorted.length});
    toast({ title: 'Text Sorted!', description: `Sorted ${sorted.length} lines.` });
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
    setStats({inCount:0,outCount:0,uniqueCount:0});
  };

  const handleShuffle = () => {
    const { lines, inCount } = buildProcessedLines(inputText);
    // Fisher–Yates
    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lines[i], lines[j]] = [lines[j], lines[i]];
    }
    setOutputText(lines.join('\n'));
    setStats({inCount, outCount: lines.length, uniqueCount: lines.length});
    toast({ title: 'Shuffled!', description: `Reordered ${lines.length} lines.` });
  };

  const handleDownload = () => {
    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sorted.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async (file: File) => {
    const text = await file.text();
    setInputText(text);
    toast({ title: 'File loaded', description: `${file.name} (${text.split('\n').length} lines)` });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'enter') { e.preventDefault(); handleSort(); }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') { e.preventDefault(); navigator.clipboard.writeText(outputText); toast({ title: 'Copied to clipboard!' }); }
      if (e.ctrlKey && e.key.toLowerCase() === 'b') { e.preventDefault(); const i=inputText; const o=outputText; setInputText(o); setOutputText(i); }
      if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); handleClear(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inputText, outputText]);

  // Auto sort with debounce
  useEffect(() => {
    if (!autoSort) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (inputText.trim()) {
  // Run silently without toasts using shared helpers
  const { lines, inCount } = buildProcessedLines(inputText);
  const sorted = sortLines(lines);
  setOutputText(sorted.join('\n'));
  setStats({inCount, outCount: sorted.length, uniqueCount: sorted.length});
      } else {
        setOutputText('');
        setStats({inCount:0,outCount:0,uniqueCount:0});
      }
    }, 200);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [inputText, sortType, sortOrder, caseSensitive, removeDuplicates, trimLines, removeEmpty, naturalSort, autoSort]);

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
  <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 md:px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="lg:hidden" />
            <ArrowDownUp className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold font-headline">Sorter</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Sorter</h1>
              <p className="text-lg text-muted-foreground">Sort lines of text alphabetically, numerically, by length, or by any column.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left: Input & Controls */}
              <Card className="minimal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-headline text-lg tracking-tight">Input & Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input ref={fileInputRef} type="file" accept=".txt,.csv,.tsv,text/plain" className="hidden" onChange={(e)=>{ const f=e.currentTarget.files?.[0]; if (f) handleUpload(f); e.currentTarget.value=''; }} />
                    <Button variant="outline" size="sm" onClick={()=> fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-1"/> Upload file</Button>
                    <Button variant="outline" size="sm" onClick={handleClear}><Trash2 className="h-4 w-4 mr-1"/> Clear</Button>
                    <div className="text-xs text-muted-foreground ml-auto">Lines: <span className="font-medium">{stats.inCount}</span></div>
                  </div>
                  <Label htmlFor="inputText">Input (one item per line)</Label>
                  <Textarea id="inputText" value={inputText} onChange={(e)=> setInputText(e.target.value)} placeholder="Enter items to sort, one per line..." rows={14} className="resize-none font-code text-base" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sortType">Sort Type</Label>
                      <Select value={sortType} onValueChange={(v)=> setSortType(v as any)}>
                        <SelectTrigger id="sortType" className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alpha">Alphabetical</SelectItem>
                          <SelectItem value="numeric">Numerical</SelectItem>
                          <SelectItem value="length">By Length</SelectItem>
                          <SelectItem value="column">By Column</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sortOrder">Order</Label>
                      <Select value={sortOrder} onValueChange={(v)=> setSortOrder(v as any)}>
                        <SelectTrigger id="sortOrder" className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Ascending</SelectItem>
                          <SelectItem value="desc">Descending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {sortType === 'column' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="columnIndex">Column (1‑based)</Label>
                        <input id="columnIndex" type="number" min={1} value={columnIndex} onChange={(e)=> setColumnIndex(Math.max(1, Number(e.currentTarget.value)||1))} className="h-10 rounded-md border bg-background px-2 text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label>Delimiter</Label>
                        <Select value={delimiter} onValueChange={(v)=> setDelimiter(v as any)}>
                          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto-detect</SelectItem>
                            <SelectItem value="comma">Comma (,)</SelectItem>
                            <SelectItem value="tab">Tab (\t)</SelectItem>
                            <SelectItem value="pipe">Pipe (|)</SelectItem>
                            <SelectItem value="custom">Custom…</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customDelim">{delimiter==='custom'? 'Custom delimiter' : 'Options'}</Label>
                        {delimiter==='custom' ? (
                          <input id="customDelim" value={customDelimiter} onChange={(e)=> setCustomDelimiter(e.currentTarget.value)} placeholder="," className="h-10 rounded-md border bg-background px-2 text-sm" />
                        ) : (
                          <div className="flex items-center gap-2 h-10">
                            <Checkbox id="columnNumeric" checked={columnNumeric} onCheckedChange={(c)=> setColumnNumeric(Boolean(c))} />
                            <Label htmlFor="columnNumeric" className="font-normal">Treat column as numeric</Label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <Checkbox id="autoSort" checked={autoSort} onCheckedChange={(c)=> setAutoSort(Boolean(c))} />
                        <Label htmlFor="autoSort" className="font-normal">Auto sort as you type</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox id="naturalSort" checked={naturalSort} onCheckedChange={(c)=> setNaturalSort(Boolean(c))} />
                        <Label htmlFor="naturalSort" className="font-normal">Natural sort (1, 2, 10)</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox id="caseSensitive" checked={caseSensitive} onCheckedChange={(c)=> setCaseSensitive(Boolean(c))} />
                        <Label htmlFor="caseSensitive" className="font-normal flex items-center"><ALargeSmall className="mr-2 h-4 w-4 text-muted-foreground" /> Case Sensitive</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <Checkbox id="trimLines" checked={trimLines} onCheckedChange={(c)=> setTrimLines(Boolean(c))} />
                        <Label htmlFor="trimLines" className="font-normal">Trim each line</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox id="removeEmpty" checked={removeEmpty} onCheckedChange={(c)=> setRemoveEmpty(Boolean(c))} />
                        <Label htmlFor="removeEmpty" className="font-normal">Remove empty lines</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox id="removeDuplicates" checked={removeDuplicates} onCheckedChange={(c)=> setRemoveDuplicates(Boolean(c))} />
                        <Label htmlFor="removeDuplicates" className="font-normal flex items-center"><FilterX className="mr-2 h-4 w-4 text-muted-foreground" /> Remove Duplicates</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {!autoSort && (
                      <Button onClick={handleSort} className="h-10"><ArrowDownUp className="mr-2 h-4 w-4"/> Sort</Button>
                    )}
                    <Button variant="outline" onClick={()=> { setSortOrder(o=> o==='asc'? 'desc':'asc'); if (!autoSort) setTimeout(()=> handleSort(), 0); }} className="h-10">Reverse order</Button>
                    <Button variant="outline" onClick={handleShuffle} className="h-10"><Shuffle className="mr-2 h-4 w-4"/> Shuffle</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Right: Output */}
              <Card className="minimal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-headline text-lg tracking-tight">Output</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={()=> { if (outputText) { setInputText(outputText); toast({ title: 'Replaced input with output' }); } }}><ArrowLeftRight className="h-4 w-4 mr-1"/> Use as Input</Button>
                    <Button variant="outline" size="sm" onClick={handleDownload} disabled={!outputText}><Download className="h-4 w-4 mr-1"/> Download</Button>
                    <Button size="sm" onClick={handleCopy} disabled={!outputText}><Copy className="h-4 w-4 mr-1"/> Copy</Button>
                    <div className="text-xs text-muted-foreground ml-auto">Lines: <span className="font-medium">{stats.outCount}</span></div>
                  </div>
                  <Label htmlFor="outputText">Sorted Output</Label>
                  <Textarea id="outputText" value={outputText} readOnly placeholder="Sorted text will appear here..." rows={14} className="resize-none font-code bg-muted/30 text-base" />
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Info className="h-3.5 w-3.5"/> Tip: Use Ctrl+Enter to sort, Ctrl+Shift+C to copy output, Ctrl+B to swap.</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

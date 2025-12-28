import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Trash2, CaseUpper, CaseLower, CaseSensitive, Baseline, ArrowLeftRight, Upload, Download } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Mode = 'uppercase' | 'lowercase' | 'title' | 'sentence' | 'toggle' | 'camel' | 'pascal' | 'snake' | 'kebab' | 'constant';

const SMALL_WORDS = new Set(['a','an','and','the','or','but','as','at','by','for','in','of','on','to','via','vs','vs.','per','nor','so','yet']);

export default function TextCaseConverterPage() {
  const { toast } = useToast();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useState<Mode>('title');
  const [auto, setAuto] = useState(true);
  const [trim, setTrim] = useState(true);
  const [collapseSpaces, setCollapseSpaces] = useState(true);
  const [smartTitle, setSmartTitle] = useState(true);
  const fileInputRef = useRef<HTMLInputElement|null>(null);

  // helpers
  const toWords = (s: string) => s
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);

  const buildTextForWordModes = (s: string, sep: string, transform: (w:string, i:number)=>string) => {
    const words = toWords(s);
    return words.map(transform).join(sep);
  };

  const toggleCase = (s: string) => s.replace(/[A-Za-z]/g, ch => ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase());

  const sentenceCase = (s: string) => {
    const lower = s.toLowerCase();
    return lower.replace(/(^\s*[a-z])|([.!?]\s*[a-z])/g, m => m.toUpperCase());
  };

  const titleCase = (s: string) => {
    const lower = s.toLowerCase();
    const parts = lower.split(/(\b[^\w']+\b)/); // keep delimiters
    let idxWord = 0; const wordsTotal = toWords(s).length;
    return parts.map(part => {
      if (!/[A-Za-z0-9]/.test(part)) return part; // delimiter
      const w = part;
      const isSmall = smartTitle && SMALL_WORDS.has(w);
      const shouldCap = !smartTitle || idxWord === 0 || idxWord === wordsTotal - 1 || !isSmall;
      idxWord++;
      return shouldCap ? w.replace(/\b\w/g, c => c.toUpperCase()) : w;
    }).join('');
  };

  const convert = (s: string, m: Mode) => {
    let t = s;
    if (trim) t = t.trim();
    if (collapseSpaces) t = t.replace(/\s+/g, ' ');
    switch (m) {
      case 'uppercase': return t.toUpperCase();
      case 'lowercase': return t.toLowerCase();
      case 'toggle': return toggleCase(t);
      case 'sentence': return sentenceCase(t);
      case 'title': return titleCase(t);
      case 'camel': return buildTextForWordModes(t, '', (w,i)=> i===0? w.toLowerCase(): (w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()));
      case 'pascal': return buildTextForWordModes(t, '', (w)=> w.charAt(0).toUpperCase()+w.slice(1).toLowerCase());
      case 'snake': return buildTextForWordModes(t, '_', (w)=> w.toLowerCase());
      case 'kebab': return buildTextForWordModes(t, '-', (w)=> w.toLowerCase());
      case 'constant': return buildTextForWordModes(t, '_', (w)=> w.toUpperCase());
    }
  };

  // effects
  useEffect(()=>{
    if (auto) setOutputText(convert(inputText, mode));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, mode, trim, collapseSpaces, smartTitle, auto]);

  // actions
  const handleConvertNow = () => setOutputText(convert(inputText, mode));
  const handleCopy = async () => {
    if (!outputText) { toast({ title: 'Nothing to copy', description: 'Output is empty.', variant: 'destructive' }); return; }
    await navigator.clipboard.writeText(outputText); toast({ title: 'Copied to clipboard' });
  };
  const handleClear = () => { setInputText(''); setOutputText(''); };
  const handleSwap = () => { setInputText(outputText); setOutputText(inputText); };
  const handleImport = async (file: File) => { const text = await file.text(); setInputText(text.replace(/\r\n?/g,'\n')); };
  const handleExport = () => {
    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='converted.txt'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <Helmet>
        <title>Text Case Converter | utilities.my</title>
        <meta name="description" content="Convert text between uppercase, lowercase, title case, sentence case, camelCase, PascalCase, snake_case, and kebab-case. Free online text case converter." />
        <link rel="canonical" href="https://utilities.my/text-case" />
      </Helmet>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
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
          <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 lg:pb-24">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Text Case Converter</h1>
              <p className="text-lg text-muted-foreground">Convert text between letter cases with smart options.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Input */}
              <Card className="flex flex-col overflow-hidden">
                <CardHeader>
                  <CardTitle>Input</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input ref={fileInputRef} type="file" accept=".txt,text/plain" className="hidden" onChange={(e)=> { const f=e.currentTarget.files?.[0]; if (f) handleImport(f); e.currentTarget.value=''; }} />
                    <Button variant="outline" size="sm" onClick={()=> fileInputRef.current?.click()}><Download className="h-4 w-4 mr-1"/> Import</Button>
                    <Button variant="outline" size="sm" onClick={handleExport} disabled={!outputText}><Upload className="h-4 w-4 mr-1"/> Export</Button>
                    <Button variant="outline" size="sm" onClick={handleSwap} disabled={!outputText}><ArrowLeftRight className="h-4 w-4 mr-1"/> Swap</Button>
                    <Button variant="outline" size="sm" onClick={handleClear} className="ml-auto"><Trash2 className="h-4 w-4 mr-1"/> Clear</Button>
                  </div>
                  <Textarea id="inputText" placeholder="Enter text here..." value={inputText} onChange={(e)=> setInputText(e.target.value)} className="resize-none min-h-[240px]" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="mode">Mode</Label>
                      <Select value={mode} onValueChange={(v)=> setMode(v as Mode)}>
                        <SelectTrigger id="mode"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="title">Title Case</SelectItem>
                          <SelectItem value="sentence">Sentence case</SelectItem>
                          <SelectItem value="uppercase">UPPERCASE</SelectItem>
                          <SelectItem value="lowercase">lowercase</SelectItem>
                          <SelectItem value="toggle">tOGGLE cASE</SelectItem>
                          <SelectItem value="camel">camelCase</SelectItem>
                          <SelectItem value="pascal">PascalCase</SelectItem>
                          <SelectItem value="snake">snake_case</SelectItem>
                          <SelectItem value="kebab">kebab-case</SelectItem>
                          <SelectItem value="constant">CONSTANT_CASE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Options</Label>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center space-x-2"><Checkbox id="auto" checked={auto} onCheckedChange={(c)=> setAuto(Boolean(c))} /><Label htmlFor="auto" className="font-normal">Auto convert</Label></div>
                        <div className="flex items-center space-x-2"><Checkbox id="trim" checked={trim} onCheckedChange={(c)=> setTrim(Boolean(c))} /><Label htmlFor="trim" className="font-normal">Trim edges</Label></div>
                        <div className="flex items-center space-x-2"><Checkbox id="collapse" checked={collapseSpaces} onCheckedChange={(c)=> setCollapseSpaces(Boolean(c))} /><Label htmlFor="collapse" className="font-normal">Collapse whitespace</Label></div>
                        <div className="flex items-center space-x-2"><Checkbox id="smartTitle" checked={smartTitle} onCheckedChange={(c)=> setSmartTitle(Boolean(c))} disabled={mode!=='title'} /><Label htmlFor="smartTitle" className="font-normal">Smart Title (ignore small words)</Label></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Output */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Output</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!auto && (
                    <Button onClick={handleConvertNow} className="h-10 w-full">Convert</Button>
                  )}
                  <Textarea id="outputText" placeholder="Converted text will appear here..." value={outputText} readOnly className="resize-none bg-muted/50 min-h-[240px]" />
                  <div className="flex justify-end">
                    <Button onClick={handleCopy} title="Copy output text" disabled={!outputText}><Copy className="mr-2 h-4 w-4" /> Copy Output</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

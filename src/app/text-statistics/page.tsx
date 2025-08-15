"use client";

import type { Metadata } from 'next';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Baseline, Type, RemoveFormatting, WrapText, ScanLine, Pilcrow, Clock, FileUp, FileDown, Copy, BarChartHorizontal, Hash, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

type WordCount = { word: string; count: number };
interface FullStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  uniqueWords: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  avgWordLength: number;
  longestWord: string;
  longestSentenceWords: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
  estimatedPages: number;
  topWords: WordCount[];
  charFreq: Record<string, number>;
}

const STOPWORDS = new Set([
  'a','an','and','the','or','but','if','then','else','for','to','of','in','on','at','by','with','as','is','it','this','that','these','those','be','been','are','was','were','from','up','down','over','under','i','you','he','she','we','they','them','me','my','your','their','our'
]);

export const metadata: Metadata = {
  title: 'Text Statistics',
  description: 'Analyze text for character, word, sentence counts, reading time, and more. Live updates and copy-friendly.',
  keywords: ['text statistics', 'word count', 'character count', 'reading time'],
  alternates: { canonical: '/text-statistics' },
  openGraph: {
    title: 'Text Statistics · utilities.my',
    url: 'https://utilities.my/text-statistics',
    images: [{ url: '/api/og?title=Text%20Statistics&subtitle=Counts%20%26%20Reading%20Time', width: 1200, height: 630 }],
  },
};

export default function TextStatisticsPage() {
  const [inputText, setInputText] = useState('');
  const [stats, setStats] = useState<FullStats | null>(null);
  const [selStats, setSelStats] = useState<FullStats | null>(null);
  const [selection, setSelection] = useState<{start:number; end:number}>({start:0,end:0});
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [ignoreStopwords, setIgnoreStopwords] = useState(true);
  const [countNumbers, setCountNumbers] = useState(true);
  const [debounceMs] = useState(150);
  const fileInputRef = useRef<HTMLInputElement|null>(null);
  const textRef = useRef<HTMLTextAreaElement|null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  // compute helper
  const computeStats = (text: string): FullStats => {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const lines = text ? text.split('\n').length : 0;
    const paragraphs = (()=>{
      const p = text.split(/\n\s*\n/).filter(Boolean).length;
      return p || (text.trim()? 1: 0);
    })();
    const sentenceRegex = /[.!?]+(?=\s|$)/g;
    const sentences = (text.match(sentenceRegex) || []).length || (text.trim()? 1: 0);

    // tokens
    const tokenRegex = /[A-Za-z0-9'’]+/g;
    const tokens = (text.match(tokenRegex) || [])
      .filter(tok => countNumbers || !/^\d+$/.test(tok));
    const norm = (s: string) => (caseSensitive? s : s.toLowerCase());
    const filteredTokens = tokens.map(norm).filter(tok => ignoreStopwords? !STOPWORDS.has(tok) : true);
    const words = filteredTokens.length;
    const uniqueWords = new Set(filteredTokens).size;
    const avgWordLength = words ? Math.round((filteredTokens.reduce((sum, w)=> sum + w.length, 0) / words) * 10) / 10 : 0;
    const longestWord = filteredTokens.reduce((acc,w)=> w.length>acc.length? w: acc, '');

    // longest sentence by word count
    const sentenceParts = text.split(/(?<=[.!?])\s+/);
    const longestSentenceWords = sentenceParts.reduce((m, s)=>{
      const wc = (s.match(tokenRegex) || []).length;
      return Math.max(m, wc);
    }, 0);

    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
    const speakingTimeMinutes = Math.max(1, Math.ceil(words / 130));
    const estimatedPages = Math.max(1, Math.ceil(words / 500));

    // word frequencies
    const freqMap = new Map<string, number>();
    for (const w of filteredTokens) freqMap.set(w, (freqMap.get(w) || 0) + 1);
    const topWords = Array.from(freqMap.entries()).map(([word,count])=>({word,count})).sort((a,b)=> b.count - a.count).slice(0, 50);

    // char frequencies (non-space)
    const charFreq: Record<string, number> = {};
    for (const ch of text) {
      if (/\s/.test(ch)) continue;
      const c = caseSensitive? ch : ch.toLowerCase();
      charFreq[c] = (charFreq[c] || 0) + 1;
    }

    return { characters, charactersNoSpaces, words, uniqueWords, sentences, paragraphs, lines, avgWordLength, longestWord, longestSentenceWords, readingTimeMinutes, speakingTimeMinutes, estimatedPages, topWords, charFreq };
  };

  // load from localStorage on mount
  useEffect(()=>{
    const saved = localStorage.getItem('textstats.input');
    if (saved) setInputText(saved);
  }, []);
  // persist input
  useEffect(()=>{ localStorage.setItem('textstats.input', inputText); }, [inputText]);

  // debounce compute global stats
  useEffect(()=>{
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(()=>{
      if (!inputText.trim()) { setStats(null); return; }
      setStats(computeStats(inputText));
      // update selection stats as well
      const {start,end} = selection;
      if (start !== end) {
        const sub = inputText.slice(Math.min(start,end), Math.max(start,end));
        setSelStats(sub.trim()? computeStats(sub) : null);
      } else {
        setSelStats(null);
      }
    }, debounceMs);
    return ()=> { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [inputText, caseSensitive, ignoreStopwords, countNumbers, selection, debounceMs]);

  // selection tracking
  const onSelect = () => {
    if (!textRef.current) return;
    setSelection({ start: textRef.current.selectionStart ?? 0, end: textRef.current.selectionEnd ?? 0 });
  };

  // actions
  const handleClear = () => { setInputText(''); setStats(null); setSelStats(null); };
  const handleCopySummary = async () => {
    if (!stats) return;
    const lines = [
      `Characters: ${stats.characters}`,
      `Characters (no spaces): ${stats.charactersNoSpaces}`,
      `Words: ${stats.words} (unique: ${stats.uniqueWords})`,
      `Sentences: ${stats.sentences}`,
      `Paragraphs: ${stats.paragraphs}`,
      `Lines: ${stats.lines}`,
      `Avg word length: ${stats.avgWordLength}`,
      `Longest word: ${stats.longestWord || '-'}`,
      `Longest sentence (words): ${stats.longestSentenceWords}`,
      `Reading time: ~${stats.readingTimeMinutes} min`,
      `Speaking time: ~${stats.speakingTimeMinutes} min`,
      `Estimated pages (~500 wpp): ~${stats.estimatedPages}`,
    ];
    await navigator.clipboard.writeText(lines.join('\n'));
  };
  const handleExportJson = () => {
    if (!stats) return;
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'text-stats.json'; a.click(); URL.revokeObjectURL(url);
  };
  const handleImportFile = async (file: File) => {
    const text = await file.text();
    setInputText(text.replace(/\r\n?/g, '\n'));
  };

  const charFreqSorted = useMemo(()=> {
    if (!stats) return [] as Array<[string, number]>;
    return Object.entries(stats.charFreq).sort((a,b)=> b[1] - a[1]).slice(0, 50);
  }, [stats]);

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
            <Baseline className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold font-headline">Text Statistics</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 lg:pb-24">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Text Statistics</h1>
              <p className="text-lg text-muted-foreground">Analyze text for counts, reading time, and distributions with live options.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Input Section */}
              <Card className="flex flex-col overflow-hidden">
                <CardHeader>
                  <CardTitle>Enter Text</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input ref={fileInputRef} type="file" accept=".txt,text/plain" className="hidden" onChange={(e)=> { const f=e.currentTarget.files?.[0]; if (f) handleImportFile(f); e.currentTarget.value=''; }} />
                    <Button variant="outline" size="sm" onClick={()=> fileInputRef.current?.click()}><Download className="h-4 w-4 mr-1"/> Import</Button>
                    <Button variant="outline" size="sm" onClick={handleExportJson} disabled={!stats}><Upload className="h-4 w-4 mr-1"/> Export JSON</Button>
                    <Button size="sm" onClick={handleCopySummary} disabled={!stats}><Copy className="h-4 w-4 mr-1"/> Copy summary</Button>
                    <Button variant="outline" size="sm" onClick={handleClear} className="ml-auto">Clear</Button>
                  </div>
                  <Textarea
                    id="textInput"
                    ref={textRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onSelect={onSelect}
                    placeholder="Paste or type your text here..."
                    className="resize-none min-h-[360px]"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="caseSensitive" checked={caseSensitive} onCheckedChange={(c)=> setCaseSensitive(Boolean(c))} />
                      <Label htmlFor="caseSensitive" className="text-sm">Case sensitive</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="ignoreStop" checked={ignoreStopwords} onCheckedChange={(c)=> setIgnoreStopwords(Boolean(c))} />
                      <Label htmlFor="ignoreStop" className="text-sm">Ignore common stopwords</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="countNums" checked={countNumbers} onCheckedChange={(c)=> setCountNumbers(Boolean(c))} />
                      <Label htmlFor="countNums" className="text-sm">Count numbers as words</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results Section */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selStats && (
                    <div className="rounded-md border p-3 text-xs">
                      <div className="font-medium mb-1">Selection</div>
                      <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                        <div>Chars: <span className="text-foreground font-medium">{selStats.characters}</span></div>
                        <div>Words: <span className="text-foreground font-medium">{selStats.words}</span></div>
                        <div>Sentences: <span className="text-foreground font-medium">{selStats.sentences}</span></div>
                        <div>Reading: <span className="text-foreground font-medium">~{selStats.readingTimeMinutes} min</span></div>
                      </div>
                    </div>
                  )}

                  {stats ? (
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="words">Top words</TabsTrigger>
                        <TabsTrigger value="chars">Characters</TabsTrigger>
                      </TabsList>
                      <TabsContent value="overview" className="pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <StatCard icon={Type} label="Characters (incl. spaces)" value={stats.characters} />
                          <StatCard icon={RemoveFormatting} label="Characters (no spaces)" value={stats.charactersNoSpaces} />
                          <StatCard icon={WrapText} label="Words" value={`${stats.words} (unique ${stats.uniqueWords})`} />
                          <StatCard icon={ScanLine} label="Sentences" value={stats.sentences} />
                          <StatCard icon={Pilcrow} label="Paragraphs" value={stats.paragraphs} />
                          <StatCard icon={Hash} label="Lines" value={stats.lines} />
                          <StatCard icon={Type} label="Avg word length" value={stats.avgWordLength} />
                          <StatCard icon={Type} label="Longest word" value={stats.longestWord || '-'} />
                          <StatCard icon={WrapText} label="Longest sentence (words)" value={stats.longestSentenceWords} />
                          <StatCard icon={Clock} label="Reading time" value={`~${stats.readingTimeMinutes} min`} />
                          <StatCard icon={Clock} label="Speaking time" value={`~${stats.speakingTimeMinutes} min`} />
                          <StatCard icon={BarChartHorizontal} label="Estimated pages (~500 wpp)" value={`~${stats.estimatedPages}`} />
                        </div>
                      </TabsContent>
                      <TabsContent value="words" className="pt-4">
                        {stats.topWords.length ? (
                          <div className="space-y-2">
                            {stats.topWords.slice(0, 50).map((w)=> (
                              <div key={w.word} className="flex items-center justify-between rounded-md border px-3 py-2">
                                <div className="font-mono text-sm">{w.word}</div>
                                <div className="text-sm text-muted-foreground">{w.count}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No words after filters.</div>
                        )}
                      </TabsContent>
                      <TabsContent value="chars" className="pt-4">
                        {charFreqSorted.length ? (
                          <div className="space-y-3">
                            {charFreqSorted.map(([ch,count])=> (
                              <div key={ch} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-mono">{JSON.stringify(ch)}</span>
                                  <span className="text-muted-foreground">{count}</span>
                                </div>
                                <Progress value={Math.min(100, (count / charFreqSorted[0][1]) * 100)} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No characters counted.</div>
                        )}
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Type className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Enter text to see statistics</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center p-4 rounded-lg border bg-card shadow-sm">
      <Icon className="h-6 w-6 text-primary mr-4 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <p className="text-xl font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

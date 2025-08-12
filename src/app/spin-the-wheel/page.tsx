"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw, Trash2, Plus, Disc3, Shuffle, FilterX, ArrowDownUp, Upload, Download, Share2, Copy } from 'lucide-react';
import { Sidebar, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { SpinWheelCanvas } from '@/components/spin-wheel-canvas';
import { Checkbox } from '@/components/ui/checkbox';
import { useSearchParams } from 'next/navigation';

const DEFAULT_ITEMS = ["Pizza","Burgers","Sushi","Pasta","Tacos","Salad"];
const PRESETS: Record<string,string[]> = {
  "Lunch": DEFAULT_ITEMS,
  "Yes/No": ["Yes","No"],
  "Numbers 1-10": Array.from({length:10},(_,i)=> String(i+1)),
};

export default function SpinTheWheelPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement|null>(null);
  const [itemsInput, setItemsInput] = useState(DEFAULT_ITEMS.join("\n"));
  const [winners, setWinners] = useState<string[]>([]);
  const [removeAfterWin, setRemoveAfterWin] = useState(false);
  const [trimLines, setTrimLines] = useState(true);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);

  const items = useMemo(()=>{
    let arr = itemsInput.split("\n");
    if (trimLines) arr = arr.map(s=> s.trim());
    arr = arr.filter(Boolean);
    if (removeDuplicates) {
      const seen = new Set<string>();
      arr = arr.filter(l=>{ const k=l.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true;});
    }
    return arr;
  }, [itemsInput, trimLines, removeDuplicates]);

  // Load from URL or localStorage on mount
  useEffect(()=>{
    const fromUrl = searchParams?.get('items');
    if (fromUrl) {
      try {
        const decoded = decodeURIComponent(fromUrl);
        const byLines = decoded.includes('\n') ? decoded : decoded.split(',').join('\n');
        setItemsInput(byLines);
      } catch {}
    } else {
      const saved = localStorage.getItem('spinwheel.items');
      if (saved) setItemsInput(saved);
      const savedW = localStorage.getItem('spinwheel.winners');
      if (savedW) try { setWinners(JSON.parse(savedW)); } catch {}
      const savedR = localStorage.getItem('spinwheel.removeAfterWin');
      if (savedR) setRemoveAfterWin(savedR==='1');
      const savedT = localStorage.getItem('spinwheel.trimLines');
      if (savedT) setTrimLines(savedT==='1');
      const savedD = localStorage.getItem('spinwheel.removeDuplicates');
      if (savedD) setRemoveDuplicates(savedD==='1');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist
  useEffect(()=>{ localStorage.setItem('spinwheel.items', itemsInput); }, [itemsInput]);
  useEffect(()=>{ localStorage.setItem('spinwheel.winners', JSON.stringify(winners)); }, [winners]);
  useEffect(()=>{ localStorage.setItem('spinwheel.removeAfterWin', removeAfterWin?'1':'0'); }, [removeAfterWin]);
  useEffect(()=>{ localStorage.setItem('spinwheel.trimLines', trimLines?'1':'0'); }, [trimLines]);
  useEffect(()=>{ localStorage.setItem('spinwheel.removeDuplicates', removeDuplicates?'1':'0'); }, [removeDuplicates]);

  const handleSpin = (winner: string) => {
    // Add winner to history
    setWinners((prev) => [...prev, winner]);
    
    // Show celebration toast
    toast({
      title: "🎉 Winner!",
      description: `${winner} has been selected!`,
      duration: 4000,
    });

    // Remove winner if option is enabled
    if (removeAfterWin) {
      setTimeout(() => {
        setItemsInput((prev) => {
          const arr = prev.split("\n").map((l) => l.trim());
          const index = arr.indexOf(winner);
          if (index > -1) {
            arr.splice(index, 1);
          }
          return arr.join("\n");
        });
      }, 1500); // Delay to allow celebration to finish
    }
  };

  const handleClear = () => {
    setItemsInput('');
    setWinners([]);
  };

  const handleReset = () => {
    setItemsInput(DEFAULT_ITEMS.join("\n"));
    setWinners([]);
  };

  const handleAddItem = () => {
    const newItem = `Item ${items.length + 1}`;
    setItemsInput(prev => prev ? `${prev}\n${newItem}` : newItem);
  };

  const handleShuffle = () => {
    const arr = items.slice();
    for (let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
    setItemsInput(arr.join('\n'));
  };

  const handleDedupe = () => {
    const arr = items;
    const seen = new Set<string>();
    const uniq = arr.filter(l=>{ const k=l.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true;});
    setItemsInput(uniq.join('\n'));
    toast({ title: 'Removed duplicates', description: `${arr.length-uniq.length} duplicate${arr.length-uniq.length===1?'':'s'} removed.` });
  };

  const naturalCompare = (a:string,b:string) => {
    const ax = a.match(/(\d+|\D+)/g) || [a];
    const bx = b.match(/(\d+|\D+)/g) || [b];
    const len = Math.max(ax.length,bx.length);
    for(let i=0;i<len;i++){
      const as = ax[i] ?? '';
      const bs = bx[i] ?? '';
      const an = /^\d+$/.test(as)? Number(as): NaN;
      const bn = /^\d+$/.test(bs)? Number(bs): NaN;
      if (!Number.isNaN(an) && !Number.isNaN(bn)) { if (an!==bn) return an-bn; }
      const cmp = as.localeCompare(bs);
      if (cmp!==0) return cmp;
    }
    return 0;
  };

  const handleSortAZ = () => {
    const arr = items.slice().sort((a,b)=> naturalCompare(a.toLowerCase(), b.toLowerCase()));
    setItemsInput(arr.join('\n'));
  };
  const handleSortZA = () => {
    const arr = items.slice().sort((a,b)=> -naturalCompare(a.toLowerCase(), b.toLowerCase()));
    setItemsInput(arr.join('\n'));
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    setItemsInput(text.replace(/\r\n?/g,'\n'));
    toast({ title: 'List imported', description: `${text.split(/\r?\n/).length} lines` });
  };
  const handleExport = () => {
    const blob = new Blob([items.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download='wheel-items.txt'; a.click(); URL.revokeObjectURL(url);
  };
  const handleExportWinners = () => {
    const text = winners.map((w,i)=> `${i+1},${w}`).join('\n');
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download='wheel-winners.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const handleShare = async () => {
    const encoded = encodeURIComponent(items.join(','));
    const url = `${window.location.origin}${window.location.pathname}?items=${encoded}`;
    await navigator.clipboard.writeText(url);
    toast({ title: 'Share link copied', description: 'Anyone with the link will see your list preloaded.' });
  };
  const handleCopyWinners = async () => {
    if (!winners.length) { toast({ title: 'No winners yet' }); return; }
    await navigator.clipboard.writeText(winners.join('\n'));
    toast({ title: 'Copied winners' });
  };

  return (
    <>
      <Sidebar className="z-50">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <div className="flex items-center gap-3">
              <Disc3 className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold font-headline">Spin the Wheel</h1>
            </div>
            <ThemeToggleButton />
          </header>
          
          <div className="flex-1 p-4 lg:p-8">
            <div className="w-full max-w-7xl mx-auto space-y-6">
              {/* Big heading */}
              <div className="mb-8">
                <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Spin the Wheel</h1>
                <p className="text-lg text-muted-foreground">A fun utility to pick a random item from a list.</p>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">Add your choices and spin to randomly select one. Perfect for making decisions!</p>
              </div>

              <div className="bg-card rounded-lg border p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Wheel Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Wheel</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {items.length} {items.length === 1 ? 'option' : 'options'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <SpinWheelCanvas 
                        items={items}
                        onSpin={handleSpin}
                        disabled={items.length < 2}
                      />
                    </div>
                  </div>

                  {/* Controls Section */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input ref={fileInputRef} type="file" accept=".txt,.csv,.tsv,text/plain" className="hidden" onChange={(e)=>{ const f=e.currentTarget.files?.[0]; if (f) handleImport(f); e.currentTarget.value=''; }} />
                        <Button variant="outline" size="sm" onClick={()=> fileInputRef.current?.click()}><Download className="w-4 h-4 mr-1"/> Import</Button>
                        <Button variant="outline" size="sm" onClick={handleExport} disabled={!items.length}><Upload className="w-4 h-4 mr-1"/> Export</Button>
                        <Button variant="outline" size="sm" onClick={handleShare} disabled={!items.length}><Share2 className="w-4 h-4 mr-1"/> Share</Button>
                      </div>
                      <Label htmlFor="itemsInput">Items (one per line)</Label>
                      <Textarea
                        id="itemsInput"
                        rows={10}
                        value={itemsInput}
                        onChange={(e) => setItemsInput(e.target.value)}
                        className="resize-none font-mono text-sm"
                        placeholder="Enter your options here...&#10;Example:&#10;Pizza&#10;Burgers&#10;Sushi&#10;Pasta"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="trimLines" checked={trimLines} onCheckedChange={(c)=> setTrimLines(Boolean(c))} />
                        <Label htmlFor="trimLines" className="text-sm cursor-pointer">Trim each line</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="removeDup" checked={removeDuplicates} onCheckedChange={(c)=> setRemoveDuplicates(Boolean(c))} />
                        <Label htmlFor="removeDup" className="text-sm cursor-pointer">Remove duplicates</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="removeAfterWin" checked={removeAfterWin} onCheckedChange={(c)=> setRemoveAfterWin(Boolean(c))} />
                        <Label htmlFor="removeAfterWin" className="text-sm cursor-pointer">Remove winners automatically</Label>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={handleAddItem}><Plus className="w-4 h-4 mr-1" /> Add Item</Button>
                      <Button variant="outline" size="sm" onClick={handleShuffle} disabled={items.length<2}><Shuffle className="w-4 h-4 mr-1"/> Shuffle</Button>
                      <Button variant="outline" size="sm" onClick={handleDedupe} disabled={items.length<2}><FilterX className="w-4 h-4 mr-1"/> Dedupe</Button>
                      <Button variant="outline" size="sm" onClick={handleSortAZ} disabled={items.length<2}><ArrowDownUp className="w-4 h-4 mr-1 rotate-90"/> A→Z</Button>
                      <Button variant="outline" size="sm" onClick={handleSortZA} disabled={items.length<2}><ArrowDownUp className="w-4 h-4 mr-1 -rotate-90"/> Z→A</Button>
                      <Button variant="outline" size="sm" onClick={handleReset}><RotateCcw className="w-4 h-4 mr-1" /> Reset</Button>
                      <Button variant="outline" size="sm" onClick={handleClear}><Trash2 className="w-4 h-4 mr-1" /> Clear All</Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">Quick presets:</span>
                      {Object.entries(PRESETS).map(([k,v])=> (
                        <Button key={k} variant="secondary" size="sm" onClick={()=> setItemsInput(v.join('\n'))}>{k}</Button>
                      ))}
                    </div>

                    {items.length < 2 && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">Add at least 2 items to spin the wheel.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Winner History */}
                {winners.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Winner History ({winners.length})</h4>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={handleCopyWinners} disabled={!winners.length}><Copy className="w-4 h-4 mr-1"/> Copy</Button>
                          <Button variant="outline" size="sm" onClick={handleExportWinners} disabled={!winners.length}><Download className="w-4 h-4 mr-1"/> Export CSV</Button>
                          <Button variant="outline" size="sm" onClick={()=> setWinners([])} disabled={!winners.length}><Trash2 className="w-4 h-4 mr-1"/> Clear</Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {winners.map((winner, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                          >
                            #{index + 1} {winner}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClear} className="h-10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

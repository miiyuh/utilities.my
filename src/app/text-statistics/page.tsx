
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PanelLeft, Type, RemoveFormatting, WrapText, ScanLine, Pilcrow, Clock, Baseline } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
}

interface StatDisplayItem {
  id: keyof TextStats;
  label: string;
  icon: React.ElementType;
  value?: number | string;
}

export default function TextStatisticsPage() {
  const [inputText, setInputText] = useState('');
  const [stats, setStats] = useState<TextStats | null>(null);

  useEffect(() => {
    if (inputText.trim() === '') {
      setStats(null);
      return;
    }

    const characters = inputText.length;
    const charactersNoSpaces = inputText.replace(/\s/g, '').length;
    const words = inputText.trim().split(/\s+/).filter(Boolean).length;
    
    const sentences = (inputText.match(/[.!?]+/g) || []).length || (words > 0 ? 1 : 0); 
    const paragraphs = inputText.split(/\n\s*\n/).filter(Boolean).length || (words > 0 ? 1: 0);

    const wordsPerMinute = 200; 
    const readingTimeMinutes = Math.ceil(words / wordsPerMinute);

    setStats({
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      readingTimeMinutes,
    });
  }, [inputText]);

  const statItems: StatDisplayItem[] = stats ? [
    { id: 'characters', label: 'Characters (incl. spaces)', icon: Type, value: stats.characters },
    { id: 'charactersNoSpaces', label: 'Characters (no spaces)', icon: RemoveFormatting, value: stats.charactersNoSpaces },
    { id: 'words', label: 'Words', icon: WrapText, value: stats.words },
    { id: 'sentences', label: 'Sentences', icon: ScanLine, value: stats.sentences },
    { id: 'paragraphs', label: 'Paragraphs', icon: Pilcrow, value: stats.paragraphs },
    { id: 'readingTimeMinutes', label: 'Est. Reading Time', icon: Clock, value: `~${stats.readingTimeMinutes} min(s)` },
  ] : [];


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
          <div className="w-full max-w-7xl mx-auto space-y-8">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Text Statistics</h1>
              <p className="text-lg text-muted-foreground">Analyze text for word count, character count, and more.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 h-full">
              {/* Input Section */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Enter Text</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <Textarea
                    id="textInput"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste or type your text here..."
                    className="resize-none h-full min-h-[400px]"
                  />
                </CardContent>
              </Card>

              {/* Results Section */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  {stats ? (
                    <div className="grid grid-cols-1 gap-5">
                      {statItems.map((item) => (
                        <div key={item.id} className="flex items-center p-5 rounded-lg border bg-card shadow-sm">
                          <item.icon className="h-8 w-8 text-primary mr-5 shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                            <p className="text-2xl font-bold text-foreground">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
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

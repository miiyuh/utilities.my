
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PanelLeft, Type, RemoveFormatting, WrapText, ScanLine, Pilcrow, Clock } from 'lucide-react';
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
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden">
              <PanelLeft />
            </SidebarTrigger>
            <h1 className="text-xl font-semibold font-headline">Text Statistics</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-2xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Text Statistics</CardTitle>
                <CardDescription>Analyze your text to get statistics like character count (with and without spaces), word count, sentence count, paragraph count, and estimated reading time.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="textInput">Enter Text</Label>
                  <Textarea
                    id="textInput"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste or type your text here..."
                    rows={10}
                    className="resize-none"
                  />
                </div>

                {stats && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-xl font-semibold mb-3">Statistics:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {statItems.map((item) => (
                        <div key={item.id} className="flex items-center p-4 rounded-lg border bg-card shadow-sm">
                          <item.icon className="h-8 w-8 text-primary mr-4 shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                            <p className="text-2xl font-bold text-foreground">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

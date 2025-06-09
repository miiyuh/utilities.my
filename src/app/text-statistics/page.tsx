
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PanelLeft } from 'lucide-react';
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
    
    // Naive sentence count, can be improved
    const sentences = (inputText.match(/[.!?]+/g) || []).length || (words > 0 ? 1 : 0); 
    const paragraphs = inputText.split(/\n\s*\n/).filter(Boolean).length || (words > 0 ? 1: 0);

    const wordsPerMinute = 200; // Average reading speed
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
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="text-lg font-medium">Statistics:</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <p>Characters (with spaces): <span className="font-semibold text-primary">{stats.characters}</span></p>
                      <p>Characters (no spaces): <span className="font-semibold text-primary">{stats.charactersNoSpaces}</span></p>
                      <p>Words: <span className="font-semibold text-primary">{stats.words}</span></p>
                      <p>Sentences: <span className="font-semibold text-primary">{stats.sentences}</span></p>
                      <p>Paragraphs: <span className="font-semibold text-primary">{stats.paragraphs}</span></p>
                      <p>Estimated Reading Time: <span className="font-semibold text-primary">~{stats.readingTimeMinutes} min(s)</span></p>
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

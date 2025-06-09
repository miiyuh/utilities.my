
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PanelLeft } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { marked } from 'marked';

export default function MarkdownPreviewerPage() {
  const [markdownText, setMarkdownText] = useState('# Hello Markdown!\n\nStart typing here...');
  const [htmlOutput, setHtmlOutput] = useState('');

  useEffect(() => {
    const generateHtml = async () => {
      const rawMarkup = await marked.parse(markdownText, { breaks: true, gfm: true });
      setHtmlOutput(rawMarkup);
    };
    generateHtml();
  }, [markdownText]);

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
            <h1 className="text-xl font-semibold font-headline">Markdown Previewer</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="grid flex-1 gap-4 md:grid-cols-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-headline">Markdown Input</CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-4rem)]">
                <Label htmlFor="markdownInput" className="sr-only">Markdown Input</Label>
                <Textarea
                  id="markdownInput"
                  value={markdownText}
                  onChange={(e) => setMarkdownText(e.target.value)}
                  className="h-full resize-none font-code"
                  placeholder="Type your Markdown here..."
                />
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-headline">HTML Preview</CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-4rem)] overflow-auto">
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: htmlOutput }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

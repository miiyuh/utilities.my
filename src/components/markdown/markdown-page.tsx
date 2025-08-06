"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { MarkdownView } from './markdown-view';

interface MarkdownPageProps {
  icon: LucideIcon;
  title: string;
  content: string;
}

export function MarkdownPage({ icon: Icon, title, content }: MarkdownPageProps) {
  const [lastUpdated, setLastUpdated] = React.useState('');

  React.useEffect(() => {
    setLastUpdated(new Date().toLocaleDateString());
  }, []);

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="lg:hidden">
              <Icon className="h-5 w-5 md:h-6 md:w-6" />
            </SidebarTrigger>
            <Icon className="h-5 w-5 md:h-6 md:w-6" />
            <h1 className="text-xl font-semibold font-headline">{title}</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <MarkdownView content={content} lastUpdated={lastUpdated} />
      </SidebarInset>
    </>
  );
}

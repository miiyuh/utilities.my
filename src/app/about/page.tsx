
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PanelLeft, Info } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

export default function AboutPage() {
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
            <Info className="h-5 w-5 md:h-6 md:w-6" />
            <h1 className="text-xl font-semibold font-headline">About utilities.my</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-2xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">About utilities.my</CardTitle>
                <CardDescription>Information about the utilities.my application.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose dark:prose-invert max-w-none">
                  <p>
                    Welcome to utilities.my! This application is a collection of handy tools designed to
                    make your daily digital tasks a bit easier.
                  </p>
                  <p>
                    Built with Next.js, React, ShadCN UI, Tailwind CSS, and Genkit for AI functionalities,
                    utilities.my aims to provide a clean, efficient, and user-friendly experience.
                  </p>
                  <p>
                    Explore the various tools using the sidebar navigation. We hope you find them useful!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

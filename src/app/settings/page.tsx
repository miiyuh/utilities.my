
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PanelLeft } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

export default function SettingsPage() {
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
            <h1 className="text-xl font-semibold font-headline">Settings</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-2xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Application Settings</CardTitle>
                <CardDescription>Manage your preferences and application settings here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-muted-foreground">Appearance</h3>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-semibold">Theme</p>
                      <p className="text-sm text-muted-foreground">
                        Select your preferred light or dark theme.
                      </p>
                    </div>
                    <ThemeToggleButton />
                  </div>
                </div>
                 <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium text-muted-foreground">More Settings</h3>
                   <p className="text-sm text-muted-foreground">
                    Future application settings will appear here.
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

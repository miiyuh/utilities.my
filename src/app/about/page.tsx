
"use client";

import React from 'react';
import { Info } from 'lucide-react';
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
          <div className="flex items-center gap-3">
            <SidebarTrigger className="lg:hidden" />
            <Info className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold font-headline">About utilities.my</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-6">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">About utilities.my</h1>
              <p className="text-lg text-muted-foreground">Information about the application.</p>
            </div>
            
            {/* About the Project - Full Width */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Project Description</h2>
              <div className="prose dark:prose-invert max-w-none font-paragraph">
                <p>
                  This application is a comprehensive collection of web-based tools designed to
                  streamline your daily digital tasks and boost productivity.
                </p>
                <p>
                  Born from the frustration of having to visit multiple websites for different utilities, this project
                  centralizes frequently-used tools into one cohesive, modern web application. Whether you need to convert
                  text cases, generate QR codes, pick colors, or calculate date differences, everything is just a click away.
                </p>
                <p>
                  The application prioritizes performance, accessibility, and user experience across
                  all devices and screen sizes.
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* From the Author */}
              <div className="lg:col-span-2 bg-card rounded-lg border p-6">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">From the Author</h2>
                <div className="prose dark:prose-invert max-w-none font-paragraph">
                  <p>
                    hey, it&#39;s miiyuh, the creator and maintainer of this website. As a developer who
                    frequently uses various online tools for different tasks, I found myself constantly switching
                    between multiple websites and bookmarks.
                  </p>
                  <p>
                    This project started as a personal solution to centralize the utilities I use most often. What began
                    as a simple collection of tools has evolved into a comprehensive platform that I&#39;m excited to share
                    with the community.
                  </p>
                  <p>
                    I believe in creating tools that are not only functional but also beautiful, accessible, and enjoyable
                    to use. Every utility in this collection has been carefully crafted with attention to detail and
                    user experience.
                  </p>
                </div>
              </div>

              {/* Technical Stack */}
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">Built With</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Next.js 15 & React 18</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>TypeScript</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                    <span>Tailwind CSS</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Radix UI & shadcn/ui</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Lucide React Icons</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Open Source & Contributing - Full Width */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Open Source & Contributing</h2>
              <div className="prose dark:prose-invert max-w-none mb-6 font-paragraph">
                <p>
                  utilities.my is proudly <strong>open source</strong> and released under the MIT License. The project
                  welcomes contributions from developers of all skill levels who want to help improve and expand the
                  utility collection.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-background/50 rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub Repository
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 font-paragraph">
                    View the source code, report issues, and contribute to the project.
                  </p>
                  <a 
                    href="https://github.com/miiyuh/utilities.my" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
                  >
                    Visit Repository
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                
                <div className="bg-background/50 rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    How to Contribute
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 font-paragraph">
                    Add new utilities, fix bugs, or improve existing features.
                  </p>
                  <a 
                    href="https://github.com/miiyuh/utilities.my" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
                  >
                    Fork • Code • Pull Request
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Statistics or Future Plans - Optional section for visual balance */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-card rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">10+</div>
                <div className="text-sm text-muted-foreground">Utilities Available</div>
              </div>
              <div className="bg-card rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <div className="text-sm text-muted-foreground">Open Source</div>
              </div>
              <div className="bg-card rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">MIT</div>
                <div className="text-sm text-muted-foreground">License</div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

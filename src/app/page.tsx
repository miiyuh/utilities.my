
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import {
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { useToast } from "@/hooks/use-toast";
import { 
  PanelLeft, 
  ExternalLink, 
  Zap, 
  TrendingUp, 
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  FileText
} from "lucide-react";
import Link from "next/link";
import { tools } from "@/lib/tools";
import { MouseEvent } from "react";
import { cn } from "@/lib/utils";

type Tool = typeof tools[0];

export default function Home() {
  const { toast } = useToast();

  // Categorize tools
  const categories = {
    popular: ["text-case", "color-picker", "qr-code-generator", "unit-converter"],
    text: ["text-case", "text-statistics", "sorter", "markdown-previewer"],
    time: ["timezone-converter", "unix-timestamp-converter", "date-diff-calculator"],
    fun: ["spin-the-wheel"],
    development: ["color-picker", "qr-code-generator", "markdown-previewer"]
  };

  const getToolsByCategory = (category: keyof typeof categories) => {
    const availableTools = tools.filter(tool => tool.path !== "/");
    return availableTools.filter(tool => 
      categories[category].some(path => tool.path.includes(path))
    );
  };

  const otherTools = tools.filter(tool => 
    tool.path !== "/" && 
    !Object.values(categories).flat().some(path => tool.path.includes(path))
  );

  return (
      <>
        <Sidebar collapsible="icon" variant="sidebar" side="left">
          <SidebarContent />
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="lg:hidden" />
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold font-headline">Essential utilities for all!</h1>
              </div>
            </div>
            <ThemeToggleButton />
          </header>
          <div className="min-h-screen p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-12 md:space-y-16">
              {/* Popular Tools Section */}
              <div className="mb-20">
                <div className="flex items-center gap-4 mb-10">
                  <div className="minimal-icon-container">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-heading-2 text-foreground">Popular Tools</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {getToolsByCategory('popular').slice(0, 4).map((tool) => (
                    <Link key={tool.path} href={tool.path}>
                      <div className="minimal-card group cursor-pointer h-full">
                        <div className="flex items-center justify-between mb-6">
                          <div className="minimal-icon-container">
                            <tool.icon className="h-6 w-6" />
                          </div>
                          <div className="minimal-button-ghost opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        <h3 className="text-heading-3 text-foreground mb-3 group-hover:text-primary transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-body-small line-clamp-3">
                          {tool.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Categorized Tools */}
              <div className="space-y-20">
                {/* Categories */}
                {Object.entries({
                  text: "Text & Content",
                  time: "Time & Date", 
                  development: "Development",
                  fun: "Fun & Games"
                }).map(([key, title]) => {
                  const categoryTools = getToolsByCategory(key as keyof typeof categories);
                  if (categoryTools.length === 0) return null;
                  
                  return (
                    <div key={key}>
                      <div className="flex items-center gap-4 mb-10">
                        <div className="minimal-icon-container">
                          {key === 'text' && <FileText className="h-6 w-6" />}
                          {key === 'time' && <Clock className="h-6 w-6" />}
                          {key === 'development' && <Zap className="h-6 w-6" />}
                          {key === 'fun' && <Sparkles className="h-6 w-6" />}
                        </div>
                        <div>
                          <h2 className="text-heading-2 text-foreground">{title}</h2>
                        </div>
                      </div>
                      <ToolGrid tools={categoryTools} viewMode="grid" />
                    </div>
                  );
                })}
                
                {/* Other Tools */}
                {otherTools.length > 0 && (
                  <div>
                    <div className="flex items-center gap-4 mb-10">
                      <div className="minimal-icon-container">
                        <ExternalLink className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-heading-2 text-foreground">Other Tools</h2>
                      </div>
                    </div>
                    <ToolGrid tools={otherTools} viewMode="grid" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </>
  );
}

// Reusable ToolGrid component
function ToolGrid({ 
  tools, 
  viewMode 
}: { 
  tools: Tool[], 
  viewMode: "grid" | "list"
}) {
  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {tools.map((tool) => (
          <Link key={tool.path} href={tool.path}>
            <div className="minimal-card group cursor-pointer">
              <div className="flex items-center gap-6">
                <div className="minimal-icon-container">
                  <tool.icon className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-heading-3 text-foreground group-hover:text-primary transition-colors truncate mb-2">
                    {tool.name}
                  </h3>
                  <p className="text-body-small line-clamp-2 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="minimal-button-ghost opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {tools.map((tool) => (
        <Link key={tool.path} href={tool.path}>
          <div className="minimal-card group cursor-pointer h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="minimal-icon-container">
                <tool.icon className="h-7 w-7" />
              </div>
              <div className="minimal-button-ghost opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            </div>
            <h3 className="text-heading-3 mb-4 text-foreground group-hover:text-primary transition-colors">
              {tool.name}
            </h3>
            <p className="text-body-small line-clamp-3 leading-relaxed">
              {tool.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

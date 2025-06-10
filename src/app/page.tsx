
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import {
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { useToast } from "@/hooks/use-toast";
import { PanelLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { tools } from "@/lib/tools";

export default function Home() {
  const { toast } = useToast();

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
              <h1 className="text-xl font-semibold font-headline">Dashboard</h1>
            </div>
            <ThemeToggleButton />
          </header>
          <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
               <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Welcome to UtilityBelt!</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Navigate tools using the sidebar or the cards below. Toggle themes using the button in the header.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-2xl font-semibold font-headline mb-4">Available Tools</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tools.filter(tool => tool.path !== "/").map((tool) => (
                  <Card key={tool.path} className="flex flex-col">
                    <CardHeader className="flex flex-col items-center text-center p-6 gap-3">
                      <tool.icon className="h-8 w-8 text-primary" />
                      <CardTitle>{tool.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <CardDescription>{tool.description}</CardDescription>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link href={tool.path}>
                          Open Tool
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-muted-foreground font-code">
                Try resizing your browser window to see responsive behavior.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Press <kbd className="rounded-md border bg-muted px-1.5 py-0.5 font-code">Ctrl/Cmd + B</kbd> to toggle the sidebar.
              </p>
            </div>
          </div>
        </SidebarInset>
      </>
  );
}

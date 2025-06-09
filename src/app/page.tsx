
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
import { Copy, Download, PanelLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { tools } from "@/lib/tools";

export default function Home() {
  const { toast } = useToast();

  return (
      <div className="flex h-screen bg-background">
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
          <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Input Panel Example</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This is an example input panel. Place forms or input elements here.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() =>
                        toast({
                          title: "Text Copied!",
                          description: "Example input has been copied.",
                          variant: "default",
                        })
                      }
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Text
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Output Panel Example</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This is an example output panel. Display results here.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        toast({
                          title: "File Downloaded!",
                          description: "Example file has been downloaded.",
                          variant: "default",
                        })
                      }
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download File
                    </Button>
                  </div>
                </CardContent>
              </Card>
               <Card className="lg:col-span-1">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tools.filter(tool => tool.path !== "/").map((tool) => (
                  <Card key={tool.path} className="flex flex-col">
                    <CardHeader className="flex flex-row items-center gap-3">
                      <tool.icon className="h-6 w-6 text-primary" />
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
          </main>
        </SidebarInset>
      </div>
  );
}

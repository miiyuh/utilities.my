"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import {
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, PanelLeft } from "lucide-react";

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
              <SidebarTrigger className="md:hidden"> {/* Only show trigger on mobile if sidebar is off-canvas type */}
                <PanelLeft />
              </SidebarTrigger>
              <h1 className="text-xl font-semibold font-headline">Dashboard</h1>
            </div>
            <ThemeToggleButton />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Input Panel</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This is the input panel. Place your forms or input elements here.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() =>
                        toast({
                          title: "Text Copied!",
                          description: "Your input has been copied to the clipboard.",
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
                  <CardTitle>Output Panel</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This is the output panel. Display results or processed data here.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        toast({
                          title: "File Downloaded!",
                          description: "The generated file has been successfully downloaded.",
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
                    Navigate tools using the sidebar. Toggle themes using the button in the header.
                  </p>
                </CardContent>
              </Card>
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

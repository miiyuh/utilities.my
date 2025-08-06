
// src/components/sidebar-content.tsx
"use client";

import * as React from "react";
import Image from 'next/image';
import {
  SidebarHeader,
  SidebarContent as SidebarScrollableContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Info } from "lucide-react"; 
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tools as originalTools, type Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function SidebarContent() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLinkClick = React.useCallback(() => {
    // Auto-close sidebar on mobile after clicking a link
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  const sortedTools = React.useMemo(() => {
    const homeTool = originalTools.find(tool => tool.path === "/");
    const otherTools = originalTools.filter(tool => tool.path !== "/");
    otherTools.sort((a, b) => a.name.localeCompare(b.name));
    return homeTool ? [homeTool, ...otherTools] : otherTools;
  }, []);

  return (
    <>
      <SidebarHeader 
        className="border-b h-16 flex flex-row items-center justify-center px-4"
      >
        <Image
          src="/assets/img/utilities-my_text.svg"
          alt="utilities.my"
          width={120} 
          height={24} 
          priority
          className="object-contain"
        />
      </SidebarHeader>
      <SidebarScrollableContent className="flex-1 p-3 pt-4">
        <ScrollArea className="h-full">
          <SidebarMenu className="space-y-1.5">
            {sortedTools.map((tool) => (
               <SidebarMenuItem key={tool.path}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === tool.path}
                  className={cn(
                    "w-full justify-start group-data-[collapsible=icon]:justify-center",
                    "minimal-menu-item",
                    pathname === tool.path && "minimal-menu-item-active"
                  )}
                  tooltip={tool.name}
                >
                  <Link href={tool.path} onClick={handleLinkClick}>
                    <tool.icon className="h-4 w-4 mr-3 group-data-[collapsible=icon]:mr-0" />
                    <span className={cn(
                      "group-data-[collapsible=icon]:hidden font-medium",
                      pathname === tool.path ? "text-primary font-bold" : "text-foreground"
                    )}>{tool.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarScrollableContent>
      {/* Combined bottom section */}
      <div className="p-3 pt-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          {/* Left: Small text links - hidden when collapsed */}
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            <Link 
              href="/privacy" 
              className="hover:text-foreground transition-colors"
              onClick={handleLinkClick}
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="hover:text-foreground transition-colors"
              onClick={handleLinkClick}
            >
              Terms of Service
            </Link>
          </div>
          
          {/* Right: Icon buttons */}
          <div className="flex items-center gap-2">
            <Link 
              href="/settings"
              className={cn(
                "p-2 rounded-md transition-colors hover:bg-sidebar-accent",
                pathname === "/settings" && "bg-sidebar-accent"
              )}
              title="Settings"
              onClick={handleLinkClick}
            >
              <Settings className={cn(
                "h-4 w-4",
                pathname === "/settings" ? "text-primary" : "text-muted-foreground"
              )} />
            </Link>
            <Link 
              href="/about"
              className={cn(
                "p-2 rounded-md transition-colors hover:bg-sidebar-accent",
                pathname === "/about" && "bg-sidebar-accent"
              )}
              title="About"
              onClick={handleLinkClick}
            >
              <Info className={cn(
                "h-4 w-4",
                pathname === "/about" ? "text-primary" : "text-muted-foreground"
              )} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

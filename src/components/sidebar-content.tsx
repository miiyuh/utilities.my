
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
import { Info } from "lucide-react"; 
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tools as originalTools, type Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SidebarContent() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile, state } = useSidebar();
  const isCollapsed = state === 'collapsed';

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
        // Keep consistent height even when collapsed (removed group-data collapsed h-12 override)
        className="border-b h-16 flex flex-row items-center justify-center px-4 group-data-[collapsible=icon]:px-2"
      >
        <Image
          src="/assets/img/utilities-my_text.svg"
          alt="utilities.my"
          width={120} 
          height={24} 
          priority
          // Keep logo size stable; hide text via opacity/scale if needed instead of shrinking height
          className="object-contain transition-all duration-200 group-data-[collapsible=icon]:scale-90"
        />
      </SidebarHeader>
  <SidebarScrollableContent className="flex-1 p-3 pt-2 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pt-2">
        <ScrollArea className="h-full">
          <SidebarMenu className="space-y-1.5">
            {sortedTools.map((tool) => (
               <SidebarMenuItem key={tool.path}>
        <SidebarMenuButton
                  asChild
                  isActive={pathname === tool.path}
                  className={cn(
          "w-full justify-start group-data-[collapsible=icon]:justify-center",
          !isCollapsed && "minimal-menu-item",
          pathname === tool.path && !isCollapsed && "minimal-menu-item-active"
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
      <div className="p-3 pt-3 border-t border-sidebar-border group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pt-2">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          {/* Left: Small text links - render only when expanded */}
          {!isCollapsed && (
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
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
          )}
          
          {/* Right: Icon buttons */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent side="right" align="center" hidden={state !== 'collapsed' || isMobile}>About</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </>
  );
}

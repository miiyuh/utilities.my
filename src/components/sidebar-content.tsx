
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
  SidebarGroup,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings } from "lucide-react"; 
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tools as originalTools, type Tool } from "@/lib/tools";

export function SidebarContent() {
  const pathname = usePathname();

  const sortedTools = React.useMemo(() => {
    const homeTool = originalTools.find(tool => tool.path === "/");
    const otherTools = originalTools.filter(tool => tool.path !== "/");
    otherTools.sort((a, b) => a.name.localeCompare(b.name));
    return homeTool ? [homeTool, ...otherTools] : otherTools;
  }, []);

  return (
    <>
      <SidebarHeader 
        className="border-b h-16 flex flex-row items-center p-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
      >
        <Image
          src="https://miiyuh.com/_next/image?url=%2Fassets%2Fimg%2Flogo_miiyuh_text_white_v2.png&w=384&q=75"
          alt="Miiyuh"
          width={79} 
          height={20} 
          priority
          className="object-contain"
        />
        <span 
          className="text-xl font-semibold font-headline tracking-tight ml-1 group-data-[collapsible=icon]:hidden"
        >
          's utilities
        </span>
      </SidebarHeader>
      <SidebarScrollableContent className="flex-1">
        <ScrollArea className="h-full">
          <SidebarMenu className="p-2">
            {sortedTools.map((tool) => (
               <SidebarMenuItem key={tool.path}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === tool.path}
                  className="w-full justify-start"
                  tooltip={tool.name}
                >
                  <Link href={tool.path}>
                    <tool.icon className="h-4 w-4" />
                    <span>{tool.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarScrollableContent>
      <SidebarGroup className="border-t">
         <SidebarMenu className="p-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/settings"}
                className="w-full justify-start"
                tooltip="Settings"
              >
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarGroup>
    </>
  );
}


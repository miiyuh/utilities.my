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
import { Input } from "@/components/ui/input";
import { Settings, Search } from "lucide-react"; // BadgeCheck removed
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tools } from "@/lib/tools";

export function SidebarContent() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const pathname = usePathname();

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-1.5 p-2.5">
          <Image
            src="https://miiyuh.com/_next/image?url=%2Fassets%2Fimg%2Flogo_miiyuh_text_white_v2.png&w=384&q=75"
            alt="Miiyuh"
            width={110}
            height={28}
            priority
            className="object-contain"
          />
          <span className="text-xl font-semibold font-headline tracking-tight">'s utilities</span>
        </div>
        <div className="relative p-2">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </SidebarHeader>
      <SidebarScrollableContent className="flex-1">
        <ScrollArea className="h-full">
          <SidebarMenu className="p-2">
            {filteredTools.map((tool) => (
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

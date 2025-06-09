
// src/components/sidebar-content.tsx
"use client";

import * as React from "react";
import {
  SidebarHeader,
  SidebarInput,
  SidebarContent as SidebarScrollableContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { BadgeCheck, Palette, FileJson, CaseSensitive, Ruler, Search, Settings, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tools = [
  { name: "Home", path: "/", icon: Home },
  { name: "Text Case Converter", path: "/text-case", icon: CaseSensitive },
  { name: "JSON Formatter", path: "/json-formatter", icon: FileJson },
  { name: "Color Picker", path: "/color-picker", icon: Palette },
  { name: "Unit Converter", path: "/unit-converter", icon: Ruler },
  // Add more tools here
];

export function SidebarContent() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const pathname = usePathname();

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 p-2">
          <BadgeCheck className="h-8 w-8 text-primary" />
          <h2 className="text-xl font-semibold font-headline">UtilityBelt</h2>
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

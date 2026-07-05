// src/components/sidebar-content.tsx

import * as React from "react"
import { Link, useLocation } from 'react-router-dom'
import {
  SidebarHeader,
  SidebarContent as SidebarScrollableContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Info } from "phosphor-react"
import { tools as originalTools } from "@/lib/tools"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function SidebarContent() {
  const { pathname } = useLocation()
  const { setOpenMobile, isMobile, state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const handleLinkClick = React.useCallback(() => {
    // Auto-close sidebar on mobile after clicking a link
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [isMobile, setOpenMobile])

  const sortedTools = React.useMemo(() => {
    const homeTool = originalTools.find(tool => tool.path === "/")
    const otherTools = originalTools.filter(tool => tool.path !== "/")
    otherTools.sort((a, b) => a.name.localeCompare(b.name))
    return homeTool ? [homeTool, ...otherTools] : otherTools
  }, [])

  return (
    <>
      <SidebarHeader
        className="border-b h-16 flex flex-row items-center justify-center px-4 group-data-[collapsible=icon]:px-2 relative"
      >
        {isMobile && (
          <button
            type="button"
            onClick={() => setOpenMobile(false)}
            className="minimal-button-ghost absolute left-4 p-1.5"
            aria-label="Close sidebar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/img/utilities-my_text.svg"
          alt="utilities.my"
          width={120}
          height={24}
          className="object-contain transition-all duration-quick group-data-[collapsible=icon]:scale-90 group-data-[collapsible=icon]:hidden"
        />
        {/* compact fallback shown only when collapsed */}
        <div className="hidden group-data-[collapsible=icon]:inline-flex items-center justify-center rounded-md h-8 w-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/apple-touch-icon.png"
            alt="utilities.my"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg object-contain"
          />
        </div>
      </SidebarHeader>
      <SidebarScrollableContent className="flex-1 p-3 pt-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
        <ScrollArea className="h-full w-full">
          <SidebarMenu className="space-y-1.5 group-data-[collapsible=icon]:items-center">
            {sortedTools.map((tool) => (
              <SidebarMenuItem key={tool.path}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === tool.path}
                  className={cn(
                    "w-full justify-start group-data-[collapsible=icon]:justify-center",
                    !isCollapsed && pathname !== tool.path && "minimal-menu-item",
                    pathname === tool.path &&
                      "data-active:bg-primary data-active:text-primary-foreground data-active:hover:bg-primary/90 data-active:hover:text-primary-foreground"
                  )}
                  tooltip={tool.name}
                >
                  <Link to={tool.path} onClick={handleLinkClick}>
                    <div className="flex items-center">
                      <tool.icon className="h-4 w-4 mr-3 group-data-[collapsible=icon]:mr-0" />
                      <span className="group-data-[collapsible=icon]:hidden font-medium">{tool.name}</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarScrollableContent>
      {/* Combined bottom section */}
      <div className="p-3 pt-3 border-t border-sidebar-border group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          {/* Left: Small text links - render only when expanded */}
          {!isCollapsed && (
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <Link 
                to="/privacy" 
                className="hover:text-foreground transition-colors"
                onClick={handleLinkClick}
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms" 
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
                  to="/about"
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    pathname === "/about"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "text-muted-foreground hover:bg-sidebar-accent"
                  )}
                  title="About"
                  onClick={handleLinkClick}
                >
                  <Info className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" align="center" hidden={state !== 'collapsed' || isMobile}>About</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </>
  )
}

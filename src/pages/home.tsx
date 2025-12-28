import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import {
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar"
import { SidebarContent } from "@/components/sidebar-content"
import { 
  Zap, 
  TrendingUp, 
  ArrowUpRight,
} from "lucide-react"
import { tools } from "@/lib/tools"

export default function Home() {
  // Define most-used tools in priority order (update this list as needed)
  const mostUsedOrder = [
    'QR Code Generator',
    'World Clock',
    'Timezone Converter',
    'Unit Converter',
    'Date Diff Calculator',
    'Text Case',
    'Text Statistics',
    'BMI Calculator',
    'Spin the Wheel',
    'Colour Picker',
    'Image Converter',
    'Markdown Previewer',
    'Morse Code Generator',
    'Sorter',
    'Settings',
    'Privacy',
    'Terms',
    'About',
  ]

  // Show all tools except Home, sorted by most-used order
  const allTools = tools
    .filter(tool => tool.path !== "/")
    .sort((a, b) => {
      const aIdx = mostUsedOrder.indexOf(a.name)
      const bIdx = mostUsedOrder.indexOf(b.name)
      if (aIdx === -1 && bIdx === -1) return 0
      if (aIdx === -1) return 1
      if (bIdx === -1) return -1
      return aIdx - bIdx
    })

  return (
    <>
      <Helmet>
        <title>utilities.my - free online tools</title>
        <meta name="description" content="A fast, privacy-friendly collection of free online tools by miiyuh. No signup required." />
        <link rel="canonical" href="https://utilities.my" />
      </Helmet>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
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
            <div className="mb-20">
              <div className="flex items-center gap-4 mb-10">
                <div className="minimal-icon-container">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-heading-2 text-foreground">All Tools</h2>
                  <p className="text-muted-foreground mt-2 text-base">A collection of useful utilities for everyone. Click any tool to get started!</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
                {allTools.map((tool) => (
                  <Link key={tool.path} to={tool.path}>
                    <div className="minimal-card group cursor-pointer aspect-square h-full w-full flex flex-col p-6 overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div className="minimal-icon-container">
                          <tool.icon className="h-6 w-6" />
                        </div>
                        <div className="minimal-button-ghost opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowUpRight className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-heading-3 text-foreground mb-3 group-hover:text-primary transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-body-small line-clamp-3 hidden md:block">
                        {tool.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}

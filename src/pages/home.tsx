import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { PreviewCard } from '@base-ui/react/preview-card'
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import {
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar"
import { SidebarContent } from "@/components/sidebar-content"
import { 
  Lightning, 
  TrendUp, 
  ArrowUpRight,
} from "phosphor-react"
import { tools } from "@/lib/tools"

export default function Home() {
  // Create a handle for the preview card with description payload
  const toolPreviewCardHandle = PreviewCard.createHandle<{ description: string }>()

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
              <Lightning className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold font-headline">Essential utilities for all!</h1>
            </div>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="min-h-screen px-8 py-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-12 md:space-y-16">
            <div className="mb-20">
              <div className="flex items-center gap-4 mb-10">
                <div className="minimal-icon-container">
                  <TrendUp className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-heading-2 text-foreground">All Tools</h2>
                  <p className="text-muted-foreground mt-2 text-base">A collection of useful utilities for everyone. Click any tool to get started!</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
                {allTools.map((tool) => (
                  <PreviewCard.Trigger
                    key={tool.path}
                    handle={toolPreviewCardHandle}
                    href={`#${tool.path}`}
                    payload={{ description: tool.description }}
                    onClick={(e) => {
                      e.preventDefault()
                      window.location.hash = tool.path
                    }}
                  >
                    <Link to={tool.path}>
                      <div className="minimal-card group cursor-pointer sm:aspect-square h-full w-full flex flex-col p-4 overflow-hidden">
                        <div className="flex items-start justify-between mb-0 sm:mb-2">
                          <div className="flex flex-row sm:flex-col gap-2 sm:gap-4 items-center sm:items-start">
                            <div className="minimal-icon-container">
                              <tool.icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-heading-3 text-foreground mb-0 sm:mb-1 group-hover:text-primary transition-colors">
                              {tool.name}
                            </h3>
                          </div>
                          <div className="minimal-button-ghost opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </PreviewCard.Trigger>
                ))}
              </div>

              {/* Preview Card Portal */}
              <PreviewCard.Root handle={toolPreviewCardHandle}>
                {({ payload }) => (
                  <PreviewCard.Portal>
                    <PreviewCard.Positioner className="z-50" sideOffset={8}>
                      <PreviewCard.Popup className="bg-card border border-border rounded-lg p-3 shadow-lg max-w-xs">
                        {payload && (
                          <p className="text-sm text-muted-foreground line-clamp-4">
                            {payload.description}
                          </p>
                        )}
                        <PreviewCard.Arrow className="fill-card" />
                      </PreviewCard.Popup>
                    </PreviewCard.Positioner>
                  </PreviewCard.Portal>
                )}
              </PreviewCard.Root>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}

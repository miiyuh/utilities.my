import { Link } from 'react-router-dom'
import {
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar"
import { SidebarContent } from "@/components/sidebar-content"
import { Lightning, ArrowUpRight } from '@phosphor-icons/react'
import { tools } from "@/lib/tools"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PageHeader } from "@/components/page-header";

// Most-used tools first (exact names from tools.ts); anything missing sorts to the end.
const TOOL_ORDER = [
  'QR Code Generator',
  'Palang IC',
  'World Clock',
  'Timezone Converter',
  'Unit Converter',
  'Date Difference Calculator',
  'Text Case Converter',
  'Text Statistics',
  'BMI Calculator',
  'Spin the Wheel',
  'Colour Picker',
  'Image Converter',
  'Favicon Generator',
  'Twitter Video/GIF Downloader',
  'Markdown Previewer',
  'Morse Code Generator',
  'Sorter',
  'Unix Timestamp Converter',
  'Percentage Calculator',
  'Foot Size Converter',
]

const sortedTools = tools
  .filter(tool => tool.path !== "/")
  .sort((a, b) => {
    const aIdx = TOOL_ORDER.indexOf(a.name)
    const bIdx = TOOL_ORDER.indexOf(b.name)
    return (aIdx === -1 ? Infinity : aIdx) - (bIdx === -1 ? Infinity : bIdx)
  })


export default function Home() {
  return (
    <>
      <Sidebar collapsible="icon" variant="inset" side="left">
        <SidebarContent />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={Lightning} title="Everyday tools" />
        <div className="min-h-screen">
          {/* Hero */}
          <section className="relative pt-14 pb-12 md:pt-20 md:pb-16 overflow-hidden">
            <div className="relative max-w-6xl mx-auto px-4 lg:px-8">
              <div className="surface-enter max-w-3xl space-y-5">
                <h1 className="font-headline text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-foreground">
                  Everyday tools,{' '}
                  <span className="font-serif italic font-normal text-primary">done right.</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl">
                  Privacy matters more than ever, and it shouldn&apos;t cost you usability. Everything here
                  runs in your browser and stays <span className="whitespace-nowrap">
                    there
                    {/* A popover, not a tooltip: tooltips never open on tap and
                        their text doesn't reach screen readers. */}
                    <Popover>
                      <PopoverTrigger
                        openOnHover
                        delay={150}
                        aria-label="About the Twitter downloader exception"
                        className="relative inline rounded-sm pl-0.5 text-primary after:absolute after:-inset-2 focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        *
                      </PopoverTrigger>
                      <PopoverContent side="bottom" className="w-[min(18rem,calc(100vw-2rem))] p-3 text-sm text-muted-foreground">
                        The Twitter downloader sends the tweet’s number to our server to find its media. Downloads need an internet connection. GIF creation runs in your browser.
                      </PopoverContent>
                    </Popover>.
                  </span> If it helps, share it with a friend.
                </p>
                <p className="text-sm text-muted-foreground">
                  {sortedTools.length} tools · Free forever · No accounts · Most tools work offline · Drop a file anywhere to find a tool for it
                </p>
              </div>
            </div>
          </section>

          {/* Tool grid */}
          <section className="max-w-6xl mx-auto px-4 lg:px-8 pb-16">
            <h2 className="font-code text-xs text-muted-foreground mb-5">
              All tools
            </h2>
            <div className="surface-enter surface-enter-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {sortedTools.map((tool) => (
                <Link
                  key={tool.path}
                  to={tool.path}
                  className="minimal-card group flex flex-col gap-3 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="minimal-icon-container">
                      <tool.icon className="h-6 w-6" />
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-1 translate-y-1 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:translate-y-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-[opacity,translate] duration-quick ease-smooth-out" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-quick">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tool.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </SidebarInset>
    </>
  )
}

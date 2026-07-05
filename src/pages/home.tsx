import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  Sidebar,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar"
import { SidebarContent } from "@/components/sidebar-content"
import { Lightning, ArrowUpRight } from "phosphor-react"
import { tools } from "@/lib/tools"
import { PageHeader } from "@/components/page-header";

// Most-used tools first (exact names from tools.ts); anything missing sorts to the end.
const TOOL_ORDER = [
  'QR Code Generator',
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

const heroStagger = "animate-in fade-in-0 slide-in-from-bottom-2 duration-slow ease-smooth-out fill-mode-backwards"

export default function Home() {
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
        <PageHeader icon={Lightning} title="Essential utilities for all!" />
        <div className="min-h-screen">
          {/* Hero */}
          <section className="relative pt-14 pb-12 md:pt-20 md:pb-16 overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-transparent"
            />
            <div className="relative max-w-6xl mx-auto px-4 lg:px-8">
              <div className="max-w-3xl space-y-5">
                <h1 className={`font-headline text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] text-foreground ${heroStagger}`}>
                  Everyday tools,{' '}
                  <span className="font-serif italic font-normal text-primary">done right.</span>
                </h1>
                <p className={`text-lg text-muted-foreground max-w-xl ${heroStagger} [animation-delay:calc(var(--duration-stagger)*2)]`}>
                  Eighteen fast, free utilities that run entirely in your browser.
                  No accounts, no ads, nothing ever leaves your device.
                </p>
                <p className={`text-sm text-muted-foreground/80 ${heroStagger} [animation-delay:calc(var(--duration-stagger)*4)]`}>
                  18 tools · Free forever · No accounts · Runs in your browser
                </p>
              </div>
            </div>
          </section>

          {/* Tool grid */}
          <section className="max-w-6xl mx-auto px-4 lg:px-8 pb-16">
            <p className="font-code text-xs uppercase tracking-widest text-muted-foreground mb-5">
              All tools
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {sortedTools.map((tool, i) => (
                <Link
                  key={tool.path}
                  to={tool.path}
                  className={`minimal-card group flex flex-col gap-3 p-5 ${heroStagger}`}
                  style={{ animationDelay: `calc(var(--duration-stagger) * ${Math.min(i, 12) + 6})` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="minimal-icon-container">
                      <tool.icon className="h-6 w-6" />
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-quick ease-smooth-out" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-quick">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
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

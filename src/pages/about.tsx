import {
  Info,
  GithubLogo,
  Sparkle,
  Cube,
  Lightning,
  Heart,
  GridFour,
  Wrench,
  HardDrive,
  Code,
  Keyboard,
  Prohibit,
  Target,
  Wind,
  Path,
  MathOperations,
  ShieldCheck,
  Globe,
} from 'phosphor-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { METHODOLOGY } from '@/lib/methodology'
import { MethodologyBody } from '@/components/tool-methodology'
import { tools } from '@/lib/tools'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { MOD_KEY } from '@/components/command-palette'
import { Sidebar, SidebarInset, SidebarRail } from "@/components/ui/sidebar"
import { SidebarContent } from "@/components/sidebar-content"
import { PageHeader } from "@/components/page-header";

const slug = (path: string) => path.replace(/^\//, '')

/** Who makes this: a hovercard on the maintainer's name, with links out. */
function MaintainerCard() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="font-medium text-foreground underline decoration-border underline-offset-2 transition-colors duration-quick hover:decoration-foreground"
        >
          miiyuh
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-base font-semibold text-primary-foreground" aria-hidden>
            MA
          </span>
          <div className="min-w-0">
            <p className="font-heading font-semibold leading-tight">Muhamad Azri</p>
            <p className="text-xs text-muted-foreground">miiyuh · Malaysia</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Creative developer and photographer. Cares about better policy, governance and urban life in Malaysia.
        </p>
        <div className="flex items-center gap-1">
          <a
            href="https://miiyuh.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors duration-quick hover:bg-accent"
          >
            <Globe className="h-3.5 w-3.5" /> miiyuh.com
          </a>
          <a
            href="https://github.com/miiyuh"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="miiyuh on GitHub"
            className="inline-flex size-8 items-center justify-center rounded-full border border-border transition-colors duration-quick hover:bg-accent"
          >
            <GithubLogo className="h-4 w-4" />
          </a>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function MethodologySection() {
  const { hash } = useLocation()
  const [open, setOpen] = useState<string[]>([])

  // /about#bmi-calculator opens that entry and scrolls to it.
  useEffect(() => {
    const id = decodeURIComponent(hash.replace(/^#/, ''))
    if (!id || !METHODOLOGY.some((m) => slug(m.path) === id)) return
    setOpen((prev) => (prev.includes(id) ? prev : [...prev, id]))
    // Wait for the lazy route and the opening item to lay out before scrolling.
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
    return () => clearTimeout(t)
  }, [hash])

  return (
    <section id="methodology" className="rounded-md border bg-card/60 p-6 scroll-mt-20">
      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
        <MathOperations className="h-5 w-5 text-muted-foreground" />
        How the tools work
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-3xl">
        Every calculation runs in your browser. Below are the formulas, constants and references each tool uses, so you
        can check any result for yourself.
      </p>
      <Accordion type="multiple" value={open} onValueChange={setOpen}>
        {METHODOLOGY.map((m) => {
          const tool = tools.find((t) => t.path === m.path)
          if (!tool) return null
          const id = slug(m.path)
          return (
            <AccordionItem key={m.path} value={id} id={id} className="scroll-mt-20">
              <AccordionTrigger className="px-4">
                <span className="flex items-center gap-2">
                  <tool.icon className="h-4 w-4 text-muted-foreground" />
                  {tool.name}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4">
                <MethodologyBody method={m} />
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </section>
  )
}

export default function About() {
  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={Info} title="About utilities.my" />
        <div className="relative flex flex-1 flex-col px-4 p-4 lg:p-8">
          <div className="w-full max-w-6xl mx-auto space-y-10">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-md border bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                <div className="shrink-0">
                  <img
                    src="/assets/img/utilities-my_text.svg"
                    alt="utilities.my"
                    width={200}
                    height={40}
                    className="h-auto w-[180px] md:w-[220px]"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">A small toolbox for everyday jobs</h2>
                  <p className="text-muted-foreground text-base md:text-lg">
                    Converting, calculating, counting and tidying, all in one calm place and all in your browser.
                    No accounts, no uploads, no fuss.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" /> Private by design
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                      <Sparkle className="h-3.5 w-3.5 text-muted-foreground" /> Free, always
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                      <Lightning className="h-3.5 w-3.5 text-muted-foreground" /> Fast on any screen
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Highlights */}
            <section className="rounded-md border bg-card/60 p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: GridFour, title: 'Thoughtful design', desc: 'Consistent and minimal, on any screen size.' },
                  { icon: Wrench, title: 'Ready when you are', desc: 'Sensible defaults, so most tools work the moment you open them.' },
                  { icon: HardDrive, title: 'Stays on your device', desc: 'Your inputs and settings live in your browser. Nothing is uploaded.' },
                  { icon: Code, title: 'Open source', desc: 'MIT-licensed. Read the code, change it, or chip in.' },
                  { icon: Keyboard, title: 'Keyboard-friendly', desc: `Press ${MOD_KEY} K to jump to any tool. Every control works without a mouse.` },
                  { icon: Prohibit, title: 'No clutter', desc: 'Just the essentials, with no ads to worry about.' },
                ].map((f) => (
                  <div key={f.title}>
                    <div className="flex items-center gap-2 text-sm font-semibold mb-1">
                      <f.icon className="h-4 w-4 text-muted-foreground" />
                      {f.title}
                    </div>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <MethodologySection />

            {/* Tech & Contribute */}
            <section className="rounded-md border bg-card/60 p-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    Why it exists
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Everyday tasks shouldn&apos;t send you hunting across sites full of ads and sign-up walls. utilities.my
                    keeps the useful ones in one place, works without an account, and never sends your things anywhere.
                  </p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    <Heart className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px align-middle" />
                    Made with care in Malaysia by <MaintainerCard />.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-muted-foreground" />
                    Built with
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2"><Code className="h-4 w-4 text-muted-foreground" /> Vite, React, TypeScript</li>
                    <li className="flex items-center gap-2"><Wind className="h-4 w-4 text-muted-foreground" /> Tailwind CSS</li>
                    <li className="flex items-center gap-2"><Cube className="h-4 w-4 text-muted-foreground" /> Radix UI, shadcn/ui</li>
                    <li className="flex items-center gap-2"><Path className="h-4 w-4 text-muted-foreground" /> Phosphor icons</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Open Source */}
            <section className="rounded-md border bg-card/60 p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <GithubLogo className="h-5 w-5 text-muted-foreground" />
                    Open source on GitHub
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Found a bug or have an idea? Issues and pull requests are always welcome.
                  </p>
                </div>
                <a
                  href="https://github.com/miiyuh/utilities.my"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
                >
                  <GithubLogo className="h-4 w-4" />
                  View repository
                </a>
              </div>
            </section>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}

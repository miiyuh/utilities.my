import { Helmet } from 'react-helmet-async'
import {
  Info,
  Github,
  Sparkles,
  Blocks,
  Zap,
  Heart,
  LayoutGrid,
  Wrench,
  HardDrive,
  Code2,
  Keyboard,
  Minimize2,
  Target,
  Hammer,
  Wind,
  Boxes,
  Shapes,
} from 'lucide-react'
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar"
import { SidebarContent } from "@/components/sidebar-content"
import { ThemeToggleButton } from "@/components/theme-toggle-button"

export default function About() {
  return (
    <>
      <Helmet>
        <title>About | utilities.my</title>
        <meta name="description" content="About utilities.my - A fast, privacy-friendly collection of free online tools by miiyuh." />
        <link rel="canonical" href="https://utilities.my/about" />
      </Helmet>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="lg:hidden" />
            <Info className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold font-headline">About utilities.my</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="relative flex flex-1 flex-col p-4 lg:p-8">
          <div className="w-full max-w-6xl mx-auto space-y-10">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-md border bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                <div className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/img/utilities-my_text.svg"
                    alt="utilities.my"
                    width={200}
                    height={40}
                    className="h-auto w-[180px] md:w-[220px]"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">A handy toolbox for everyday tasks</h2>
                  <p className="text-muted-foreground text-base md:text-lg">
                    One clean, fast app with focused utilities: convert, analyze, generate, and more — without tab chaos.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> Polished UX
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                      <Blocks className="h-3.5 w-3.5 text-primary" /> Modular tools
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                      <Zap className="h-3.5 w-3.5 text-primary" /> Fast & accessible
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Highlights */}
            <section className="rounded-md border bg-card/60 p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: LayoutGrid, title: 'Thoughtful design', desc: 'Consistent, minimal, and responsive. Dark mode included.' },
                  { icon: Wrench, title: 'Useful by default', desc: 'Practical tools like unit, time, text, and QR utilities.' },
                  { icon: HardDrive, title: 'Local-first', desc: 'Settings and inputs persist where it helps, no account needed.' },
                  { icon: Code2, title: 'Open source', desc: 'MIT-licensed. Explore, modify, and contribute freely.' },
                  { icon: Keyboard, title: 'Keyboard-friendly', desc: 'Snappy interactions and predictable focus behavior.' },
                  { icon: Minimize2, title: 'No clutter', desc: 'Just the essentials. No ads. No noise.' },
                ].map((f) => (
                  <div key={f.title}>
                    <div className="flex items-center gap-2 text-sm font-semibold mb-1">
                      <f.icon className="h-4 w-4 text-primary" />
                      {f.title}
                    </div>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Tech & Contribute */}
            <section className="rounded-md border bg-card/60 p-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Why it exists
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Built to reduce context switching. Instead of bouncing across sites for common tasks, utilities.my
                    keeps them in one place with a consistent interface and reliable behavior.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Heart className="h-3.5 w-3.5 text-primary" /> Crafted with care by miiyuh.
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Hammer className="h-5 w-5 text-primary" />
                    Built with
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2"><Code2 className="h-4 w-4 text-primary" /> Vite, React, TypeScript</li>
                    <li className="flex items-center gap-2"><Wind className="h-4 w-4 text-primary" /> Tailwind CSS</li>
                    <li className="flex items-center gap-2"><Boxes className="h-4 w-4 text-primary" /> Radix UI, shadcn/ui</li>
                    <li className="flex items-center gap-2"><Shapes className="h-4 w-4 text-primary" /> Lucide icons</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Open Source */}
            <section className="rounded-md border bg-card/60 p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Github className="h-5 w-5 text-primary" />
                    Open source on GitHub
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Issues and pull requests are welcome. Contributions that improve UX and reliability are especially appreciated.
                  </p>
                </div>
                <a
                  href="https://github.com/miiyuh/utilities.my"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
                >
                  <Github className="h-4 w-4" />
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

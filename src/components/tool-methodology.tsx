import { Link, useLocation } from 'react-router-dom'
import { ArrowSquareOut, MathOperations } from 'phosphor-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { METHODOLOGY, type Method } from '@/lib/methodology'

/** Formulas, notes and sources for one tool. Shared by tool pages and the About page. */
export function MethodologyBody({ method }: { method: Method }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground leading-relaxed">{method.summary}</p>
      {method.formulas && (
        <ul className="space-y-1 rounded-xl border bg-background/60 p-3 font-mono text-xs leading-relaxed overflow-x-auto">
          {method.formulas.map((f) => <li key={f}>{f}</li>)}
        </ul>
      )}
      {method.notes && (
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          {method.notes.map((n) => <li key={n}>{n}</li>)}
        </ul>
      )}
      {method.sources.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Sources</p>
          <ul className="space-y-1">
            {method.sources.map((src) => (
              <li key={src.url}>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline underline-offset-2 decoration-border hover:decoration-foreground transition-colors duration-quick"
                >
                  {src.label}
                  <ArrowSquareOut className="h-3 w-3 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * Collapsible "How this works" panel shown at the bottom of a tool page,
 * looked up from the current route. Renders nothing for routes without an entry.
 */
export function ToolMethodology({ path }: { path?: string }) {
  const { pathname } = useLocation()
  const method = METHODOLOGY.find((m) => m.path === (path ?? pathname))
  if (!method) return null

  return (
    <section className="px-4 pb-8 lg:px-8" aria-label="How this tool works">
      <div className="w-full max-w-7xl mx-auto">
        <Accordion type="single" collapsible>
          <AccordionItem value="how">
            <AccordionTrigger className="px-4">
              <span className="flex items-center gap-2">
                <MathOperations className="h-4 w-4 text-muted-foreground" />
                How this works
                <span className="hidden sm:inline text-xs font-normal text-muted-foreground">Formulas and sources</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 space-y-4">
              <MethodologyBody method={method} />
              <Link
                to={`/about#${method.path.replace(/^\//, '')}`}
                className="inline-block text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors duration-quick"
              >
                See how every tool works
              </Link>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  )
}

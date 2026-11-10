import * as React from 'react'
import { format, parseISO } from 'date-fns'
import { Sparkle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { useToolSettings } from '@/hooks/use-tool-settings'
import { UPDATES, hasUnseen, markSeen, readSeen } from '@/lib/whats-new'

/**
 * What's new, from a button in the header. A dot shows until the newest
 * update has been opened. It never opens by itself.
 */
export function WhatsNewButton() {
  const [unseen, setUnseen] = React.useState(() => hasUnseen(UPDATES, readSeen()))
  const { fns } = useToolSettings()

  return (
    <Popover
      onOpenChange={(open) => {
        if (open && unseen) {
          markSeen(UPDATES)
          setUnseen(false)
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            className="relative size-8"
            aria-label={unseen ? "What's new (something you haven't seen)" : "What's new"}
          />
        }
      >
        <Sparkle aria-hidden className="size-4" />
        {unseen && <span aria-hidden className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background" />}
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[min(70vh,32rem)] w-[min(22rem,calc(100vw-2rem))] gap-0 overflow-y-auto p-0">
        <PopoverHeader className="sticky top-0 border-b border-border bg-popover px-4 py-3">
          <PopoverTitle>What&apos;s new</PopoverTitle>
          <PopoverDescription>Recent changes to utilities.my.</PopoverDescription>
        </PopoverHeader>
        <ol className="divide-y divide-border">
          {UPDATES.map((u) => (
            <li key={u.id} className="space-y-2 px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-medium">{u.title}</h3>
                <time dateTime={u.date} className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {format(parseISO(u.date), fns.long)}
                </time>
              </div>
              <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                {u.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {u.fixes && u.fixes.length > 0 && (
                <>
                  <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fixed</p>
                  <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                    {u.fixes.map((fix) => (
                      <li key={fix}>{fix}</li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          ))}
        </ol>
      </PopoverContent>
    </Popover>
  )
}

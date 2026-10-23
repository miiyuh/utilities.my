import * as React from 'react'
import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import { ArrowCounterClockwise } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import {
  A11Y_TOGGLES,
  DEFAULT_A11Y_PREFERENCES,
  READING_FONTS,
  TEXT_SIZES,
  isReadingFont,
  isTextSize,
  readA11yPreferences,
  subscribeToA11yPreferences,
  writeA11yPreferences,
  type A11yPreferences,
  type A11yToggle,
  type ReadingFont,
} from '@/lib/a11y-preferences'
import { cn } from '@/lib/utils'

const FONTS: Record<ReadingFont, { label: string; hint: string; family: string }> = {
  default: { label: 'Default', hint: 'Space Grotesk', family: "'Space Grotesk Variable', sans-serif" },
  legible: { label: 'Legible', hint: 'Atkinson Hyperlegible', family: "'Atkinson Hyperlegible Next Variable', sans-serif" },
  dyslexic: { label: 'Dyslexia-friendly', hint: 'OpenDyslexic', family: "'OpenDyslexic', sans-serif" },
}

const TOGGLES: Record<A11yToggle, { label: string; description: string }> = {
  spacing: { label: 'Text spacing', description: 'More space between lines, letters and words.' },
  contrast: { label: 'Higher contrast', description: 'Darker text and stronger borders.' },
  underlineLinks: { label: 'Underline links', description: "Underline every link so links don't rely on colour alone." },
  reduceMotion: { label: 'Reduce motion', description: 'Turn off animations and smooth scrolling.' },
}

function reset() {
  writeA11yPreferences(DEFAULT_A11Y_PREFERENCES)
  toast.success('Accessibility settings reset')
}

const groupLabelClass = 'text-sm font-medium text-foreground'

// Option tiles: Base UI's radio is the focusable element itself.
const optionClass =
  'flex cursor-pointer rounded-lg border bg-background text-muted-foreground outline-none transition-colors duration-quick hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:border-primary data-checked:bg-primary/10 data-checked:text-foreground'

export default function A11yPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const preferences = React.useSyncExternalStore(subscribeToA11yPreferences, readA11yPreferences)
  const id = React.useId()

  const update = (patch: Partial<A11yPreferences>) => writeA11yPreferences({ ...preferences, ...patch })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-sm">
        <SheetHeader className="pr-14">
          <SheetTitle className="font-headline text-xl font-semibold">Accessibility</SheetTitle>
          <SheetDescription>
            Change how the site looks and moves. Your choices are saved in this browser only.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-8 px-6 pb-2">
          <div className="flex flex-col gap-3">
            <span id={`${id}-size`} className={groupLabelClass}>Text size</span>
            <RadioGroup
              aria-labelledby={`${id}-size`}
              value={preferences.textSize}
              onValueChange={(value) => {
                if (isTextSize(value)) update({ textSize: value })
              }}
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {TEXT_SIZES.map((size) => (
                <Radio.Root key={size} value={size} className={cn(optionClass, 'min-h-11 items-center justify-center text-sm tabular-nums')}>
                  {size}%
                </Radio.Root>
              ))}
            </RadioGroup>
          </div>

          <div className="flex flex-col gap-3">
            <span id={`${id}-font`} className={groupLabelClass}>Font</span>
            <RadioGroup
              aria-labelledby={`${id}-font`}
              value={preferences.font}
              onValueChange={(value) => {
                if (isReadingFont(value)) update({ font: value })
              }}
              className="flex flex-col gap-2"
            >
              {READING_FONTS.map((font) => (
                <Radio.Root key={font} value={font} className={cn(optionClass, 'min-h-14 flex-col justify-center gap-0.5 px-4 py-2.5')}>
                  {/* Each option previews its own face; a11y.css leaves these alone. */}
                  <span data-a11y-font-preview className="text-base" style={{ fontFamily: FONTS[font].family }}>
                    {FONTS[font].label}
                  </span>
                  <span className="text-xs text-muted-foreground">{FONTS[font].hint}</span>
                </Radio.Root>
              ))}
            </RadioGroup>
          </div>

          <section aria-labelledby={`${id}-display`} className="flex flex-col">
            <h3 id={`${id}-display`} className={cn(groupLabelClass, 'mb-2')}>Display and motion</h3>
            <ul className="flex flex-col divide-y border-y">
              {A11Y_TOGGLES.map((key) => (
                <li key={key} className="flex min-h-14 items-center justify-between gap-4 py-3">
                  <span className="flex flex-col gap-0.5">
                    <label htmlFor={`${id}-${key}`} className="cursor-pointer text-sm text-foreground">{TOGGLES[key].label}</label>
                    <span id={`${id}-${key}-hint`} className="text-xs text-muted-foreground">{TOGGLES[key].description}</span>
                  </span>
                  <Switch
                    id={`${id}-${key}`}
                    checked={preferences[key]}
                    onCheckedChange={(checked) => update({ [key]: checked })}
                    aria-describedby={`${id}-${key}-hint`}
                  />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Your device's reduced motion and higher contrast settings are always followed.
            </p>
          </section>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={reset} className="w-full">
            <ArrowCounterClockwise aria-hidden />
            Reset to defaults
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

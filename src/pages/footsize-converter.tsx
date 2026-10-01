import { useMemo, useState } from 'react';
import { PersonSimpleWalk, Ruler } from 'phosphor-react';
import { Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { SidebarContent } from '@/components/sidebar-content';
import { PageHeader } from '@/components/page-header';
import { ToolMethodology } from '@/components/tool-methodology';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SIZES, matchLength, type Category, type SizeSystem } from '@/lib/shoe-sizes';
import { cn } from '@/lib/utils';

type Source = 'length' | SizeSystem;

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
  { id: 'kids', label: 'Kids' },
];

const SOURCES: { id: Source; label: string }[] = [
  { id: 'uk', label: 'UK size' },
  { id: 'eu', label: 'EU size' },
  { id: 'us', label: 'US size' },
  { id: 'length', label: 'Foot length' },
];

const SYSTEM_NAMES: Record<SizeSystem, string> = { uk: 'UK', eu: 'EU', us: 'US' };

export default function FootSizeConverterPage() {
  const [category, setCategory] = useState<Category>('men');
  const [source, setSource] = useState<Source>('uk');
  // The chosen row (when starting from a size) and the typed foot length.
  const [index, setIndex] = useState<number>(6);
  const [length, setLength] = useState('');

  const rows = SIZES[category];
  const lengthMatch = useMemo(() => (source === 'length' ? matchLength(category, Number(length)) : null), [source, category, length]);
  const activeIndex = source === 'length' ? (lengthMatch?.index ?? null) : Math.min(index, rows.length - 1);
  const active = activeIndex == null ? null : rows[activeIndex];

  // Switching category keeps the same foot length where possible.
  const changeCategory = (next: Category) => {
    if (active && source !== 'length') {
      const m = matchLength(next, active.cm);
      if (m) setIndex(m.index);
    }
    setCategory(next);
  };

  const changeSource = (next: Source) => {
    if (next === 'length' && active) setLength(String(active.cm));
    if (next !== 'length' && lengthMatch) setIndex(lengthMatch.index);
    setSource(next);
  };

  const tiles = active
    ? [
        { id: 'uk', label: 'UK', value: active.uk },
        { id: 'eu', label: 'EU', value: active.eu },
        { id: 'us', label: 'US', value: active.us },
        { id: 'length', label: 'Foot length', value: `${active.cm} cm` },
      ]
    : [];

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={PersonSimpleWalk} title="Foot Size Converter" />
        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <div className="mx-auto w-full max-w-7xl space-y-8 pb-16 lg:pb-24">
            <div className="mb-2 max-sm:sr-only">
              <h1 className="mb-4 border-b border-border pb-3 text-4xl font-bold tracking-tight text-foreground sm:mb-6 sm:pb-4 sm:text-5xl">Foot Size Converter</h1>
              <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">
                Find your shoe size in UK, EU or US sizes, from a size you know or from the length of your foot.
              </p>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
              <div className="space-y-6 lg:sticky lg:top-20">
                <Card className="minimal-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-lg">Find your size</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <fieldset className="space-y-2">
                      <legend className="mb-2 text-sm font-medium">Shoes for</legend>
                      <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.map((c) => (
                          <Chip key={c.id} active={category === c.id} onClick={() => changeCategory(c.id)}>{c.label}</Chip>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset className="space-y-2">
                      <legend className="mb-2 text-sm font-medium">Start from</legend>
                      <div className="flex flex-wrap gap-1.5">
                        {SOURCES.map((s) => (
                          <Chip key={s.id} active={source === s.id} onClick={() => changeSource(s.id)}>{s.label}</Chip>
                        ))}
                      </div>
                    </fieldset>

                    {source === 'length' ? (
                      <div className="space-y-1.5">
                        <Label htmlFor="foot-length">Foot length</Label>
                        <div className="relative max-w-[220px]">
                          <NumberInput id="foot-length" value={length} onValueChange={setLength} placeholder="e.g. 26.2" className="pr-12" />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">cm</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Heel to the tip of your longest toe. See how to measure below.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label htmlFor="foot-size">{SYSTEM_NAMES[source]} size</Label>
                        <Select value={String(activeIndex ?? 0)} onValueChange={(v) => setIndex(Number(v))}>
                          <SelectTrigger id="foot-size" className="max-w-[220px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {rows.map((r, i) => (
                              <SelectItem key={r.cm} value={String(i)}>{SYSTEM_NAMES[source]} {r[source]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="rounded-md bg-muted p-4" aria-live="polite">
                      {active ? (
                        <>
                          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                            {tiles.map((t) => (
                              <div key={t.id} className={cn('rounded-md bg-card p-3', t.id === source && 'ring-2 ring-primary')}>
                                <dt className="text-xs text-muted-foreground">{t.label}</dt>
                                <dd className="whitespace-nowrap font-headline text-2xl font-semibold tabular-nums">{t.value}</dd>
                              </div>
                            ))}
                          </dl>
                          {lengthMatch?.between && (
                            <p className="mt-3 text-xs text-muted-foreground">
                              {Number(length).toLocaleString()} cm falls between sizes, so this is the next size up. If you're between sizes, the larger one usually fits better.
                            </p>
                          )}
                          {lengthMatch?.beyond && (
                            <p className="mt-3 text-xs text-warning">This is the largest size in the chart; your foot is longer than it fits. Check the brand's own chart.</p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Enter your foot length to see your size.</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Sizes vary between brands. Use this as a starting point and check the brand's own chart, or try them on.</p>
                  </CardContent>
                </Card>

                <Card className="minimal-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 font-headline text-lg"><Ruler className="h-5 w-5" aria-hidden /> Measure your foot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <ol className="list-decimal space-y-2 pl-5">
                      <li>Stand on a sheet of paper with your heel against a wall.</li>
                      <li>Mark the tip of your longest toe on the paper.</li>
                      <li>Measure from the wall to the mark in centimetres.</li>
                      <li>Do the same for your other foot and use the longer of the two.</li>
                    </ol>
                    <ul className="space-y-1.5 text-muted-foreground">
                      <li>Measure in the afternoon or evening, when feet are at their largest.</li>
                      <li>Stand while you measure: your foot spreads when it carries your weight.</li>
                      <li>A good fit leaves about 1 cm between your longest toe and the end of the shoe.</li>
                      <li>These charts are for standard widths. Wide or narrow feet may need a different size.</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card className="minimal-card">
                <CardHeader className="pb-3">
                  <CardTitle className="font-headline text-lg">Size chart: {CATEGORIES.find((c) => c.id === category)?.label}</CardTitle>
                  <p className="text-sm text-muted-foreground">Select a row to use that size.</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm tabular-nums">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          <th scope="col" className="py-2 pr-3 font-medium">UK</th>
                          <th scope="col" className="py-2 pr-3 font-medium">EU</th>
                          <th scope="col" className="py-2 pr-3 font-medium">US</th>
                          <th scope="col" className="py-2 font-medium">Foot length</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => {
                          const isActive = i === activeIndex;
                          return (
                            <tr key={`${r.uk}-${r.cm}`} className={cn('border-b border-border/60 last:border-0', isActive && 'bg-primary/10')} aria-current={isActive ? 'true' : undefined}>
                              <td className="py-0 pr-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIndex(i);
                                    if (source === 'length') setSource('uk');
                                  }}
                                  className={cn('w-full py-2 text-left font-medium outline-none focus-visible:underline', isActive && 'text-primary')}
                                  aria-label={`Use UK ${r.uk}, EU ${r.eu}, US ${r.us}`}
                                >
                                  {r.uk}
                                </button>
                              </td>
                              <td className="py-2 pr-3">{r.eu}</td>
                              <td className="py-2 pr-3">{r.us}</td>
                              <td className="py-2 text-muted-foreground">{r.cm} cm</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <ToolMethodology />
      </SidebarInset>
    </>
  );
}

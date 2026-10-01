import { useState } from 'react';
import {
  ArrowsDownUp,
  ArrowsIn,
  Clock,
  Drop,
  GasPump,
  Gauge,
  HardDrive,
  Lightning,
  Ruler,
  Scales,
  Square,
  Thermometer,
  WifiHigh,
  type Icon,
} from 'phosphor-react';
import { Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { SidebarContent } from '@/components/sidebar-content';
import { PageHeader } from '@/components/page-header';
import { PageIntro } from '@/components/page-intro';
import { ToolMethodology } from '@/components/tool-methodology';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { CopyButton } from '@/components/ui/copy-button';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/contexts/settings-context';
import { groupDigits } from '@/lib/format';
import { CATEGORIES, convert, roundForDisplay, type Category, type Unit } from '@/lib/units';
import { cn } from '@/lib/utils';

const ICONS: Record<string, Icon> = {
  length: Ruler,
  weight: Scales,
  temperature: Thermometer,
  volume: Drop,
  area: Square,
  speed: Gauge,
  pressure: ArrowsIn,
  energy: Lightning,
  fuel: GasPump,
  time: Clock,
  storage: HardDrive,
  data: WifiHigh,
};

const findUnit = (c: Category, id: string): Unit => c.units.find((x) => x.id === id) ?? c.units[0];

export default function UnitConverterPage() {
  const { settings: { numberFormat } } = useSettings();
  const g = (raw: string) => groupDigits(raw, numberFormat);

  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const category = CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[0];
  const [fromId, setFromId] = useState(category.pairs[0][0]);
  const [toId, setToId] = useState(category.pairs[0][1]);
  // Whichever side was typed in last holds the number; the other side is worked out.
  const [editing, setEditing] = useState<'from' | 'to'>('from');
  const [raw, setRaw] = useState('1');
  const [decimals, setDecimals] = useState(4);
  const [keepZeros, setKeepZeros] = useState(false);

  const from = findUnit(category, fromId);
  const to = findUnit(category, toId);
  const value = parseFloat(raw);
  const valid = raw.trim() !== '' && Number.isFinite(value);

  const derived = valid
    ? roundForDisplay(editing === 'from' ? convert(value, from, to) : convert(value, to, from), decimals, keepZeros)
    : '';

  const fromValue = editing === 'from' ? raw : derived;
  const toValue = editing === 'to' ? raw : derived;
  // The amount in the From unit, for the "every unit" list.
  const fromNumber = valid ? (editing === 'from' ? value : convert(value, to, from)) : NaN;

  const sentence = valid && derived !== '' ? `${g(fromValue)} ${from.symbol} = ${g(toValue)} ${to.symbol}` : '';

  const pickCategory = (c: Category) => {
    setCategoryId(c.id);
    setFromId(c.pairs[0][0]);
    setToId(c.pairs[0][1]);
    setEditing('from');
    setRaw('1');
  };

  const swap = () => {
    setFromId(toId);
    setToId(fromId);
    setEditing((e) => (e === 'from' ? 'to' : 'from'));
  };

  const applyPair = ([a, b]: [string, string]) => {
    // Keep the number the person typed, now in the pair's first unit.
    if (editing === 'to') setRaw(toValue);
    setEditing('from');
    setFromId(a);
    setToId(b);
  };

  const unitSelect = (id: string, value: string, onChange: (v: string) => void, label: string) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label={label} className="w-full data-[size=default]:h-12 sm:w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-[50vh]">
        {category.units.map((x) => (
          <SelectItem key={x.id} value={x.id}>
            {x.name} <span className="text-muted-foreground">({x.symbol})</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={Ruler} title="Unit Converter" />
        <div className="flex flex-col p-4 lg:p-8">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            <PageIntro title="Unit Converter">Metres, miles, kilos, pounds: sorted. Type on either side, and see your amount in every unit at once.</PageIntro>

            <fieldset className="pt-2">
              <legend className="mb-3 text-sm font-medium">What are you converting?</legend>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const CatIcon = ICONS[c.id] ?? Ruler;
                  return (
                    <Chip key={c.id} active={c.id === categoryId} onClick={() => pickCategory(c)}>
                      <CatIcon className="h-4 w-4" aria-hidden /> {c.name}
                    </Chip>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-start">
              <Card className="minimal-card lg:sticky lg:top-20">
                <CardHeader className="pb-3">
                  <CardTitle className="font-headline text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="uc-from">From</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <NumberInput
                        id="uc-from"
                        value={fromValue}
                        onValueChange={(v) => {
                          setEditing('from');
                          setRaw(v);
                        }}
                        placeholder="0"
                        className="h-12 flex-1 font-code text-xl md:text-xl"
                      />
                      {unitSelect('uc-from-unit', fromId, setFromId, 'From unit')}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" aria-hidden />
                    <Button variant="outline" size="sm" onClick={swap}>
                      <ArrowsDownUp className="h-4 w-4" /> Swap
                    </Button>
                    <span className="h-px flex-1 bg-border" aria-hidden />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="uc-to">To</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <NumberInput
                        id="uc-to"
                        value={toValue}
                        onValueChange={(v) => {
                          setEditing('to');
                          setRaw(v);
                        }}
                        placeholder="0"
                        className="h-12 flex-1 font-code text-xl md:text-xl"
                      />
                      {unitSelect('uc-to-unit', toId, setToId, 'To unit')}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-md bg-muted p-4" aria-live="polite">
                    <p className={cn('min-w-0 flex-1 break-words font-headline text-lg font-semibold tabular-nums sm:text-xl', !sentence && 'text-base font-normal text-muted-foreground')}>
                      {sentence || 'Enter a number to convert.'}
                    </p>
                    {sentence && <CopyButton value={() => sentence} label="" size="icon-sm" aria-label="Copy the conversion" title="Copy" toastTitle="Copied" toastDescription={sentence} />}
                  </div>

                  <div className="space-y-2">
                    <span className="block text-sm font-medium">Common conversions</span>
                    <div className="flex flex-wrap gap-1.5">
                      {category.pairs.map((p) => {
                        const active = p[0] === fromId && p[1] === toId;
                        return (
                          <Chip key={p.join('-')} active={active} onClick={() => applyPair(p)}>
                            {findUnit(category, p[0]).symbol} to {findUnit(category, p[1]).symbol}
                          </Chip>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="uc-decimals" className="font-normal">Decimal places</Label>
                      <Select value={String(decimals)} onValueChange={(v) => setDecimals(Number(v))}>
                        <SelectTrigger id="uc-decimals" className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4, 5, 6, 8, 10].map((d) => (
                            <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="uc-zeros" checked={keepZeros} onCheckedChange={setKeepZeros} />
                      <Label htmlFor="uc-zeros" className="cursor-pointer font-normal">Keep trailing zeros</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="minimal-card">
                <CardHeader className="pb-3">
                  <CardTitle className="font-headline text-lg">
                    {Number.isFinite(fromNumber) ? `${g(fromValue)} ${from.symbol} in every unit` : 'Every unit'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Select a unit to convert to it.</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-0.5">
                    {category.units.map((x) => {
                      const shown = Number.isFinite(fromNumber) ? roundForDisplay(convert(fromNumber, from, x), decimals, keepZeros) : '';
                      const isTo = x.id === toId;
                      const isFrom = x.id === fromId;
                      return (
                        <li
                          key={x.id}
                          className={cn(
                            'flex min-h-10 items-center gap-1 rounded-md pr-1 transition-colors duration-quick',
                            isTo ? 'bg-primary/10' : !isFrom && 'hover:bg-muted'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setToId(x.id)}
                            disabled={isFrom}
                            className="flex min-h-10 min-w-0 flex-1 items-center justify-between gap-3 rounded-md px-3 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default"
                            aria-pressed={isTo}
                          >
                            <span className={cn('min-w-0', isTo ? 'font-medium text-primary' : 'text-muted-foreground')}>
                              {x.name}
                              {isFrom && <span className="ml-1.5 text-xs">(from)</span>}
                            </span>
                            <span className="min-w-0 break-all text-right font-code tabular-nums text-foreground">
                              {shown ? `${g(shown)} ${x.symbol}` : ''}
                            </span>
                          </button>
                          <CopyButton
                            value={() => g(shown)}
                            label=""
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Copy ${x.name.toLowerCase()}`}
                            title={`Copy ${x.symbol}`}
                            toastTitle="Copied"
                            toastDescription={`${g(shown)} ${x.symbol}`}
                            disabled={!shown}
                          />
                        </li>
                      );
                    })}
                  </ul>
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

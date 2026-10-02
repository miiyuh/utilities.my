import { useEffect, useState } from 'react';
import { format, formatDistanceToNow, getDayOfYear, getISOWeek, isLeapYear } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Timer } from 'phosphor-react';
import { Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { SidebarContent } from '@/components/sidebar-content';
import { PageHeader } from '@/components/page-header';
import { PageIntro } from '@/components/page-intro';
import { ToolMethodology } from '@/components/tool-methodology';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Chip } from '@/components/ui/chip';
import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToolSettings } from '@/hooks/use-tool-settings';
import { cn } from '@/lib/utils';

type UnitMode = 'auto' | 's' | 'ms';
type Zone = 'local' | 'utc';

const PATTERN_KEY = 'utilities.my-unix-custom-pattern';
const DEFAULT_PATTERN = 'EEEE, d MMMM yyyy HH:mm:ss';

function loadPattern(): string {
  try {
    return localStorage.getItem(PATTERN_KEY) ?? DEFAULT_PATTERN;
  } catch {
    return DEFAULT_PATTERN;
  }
}

/** 12+ digits is milliseconds: as seconds that would be past the year 5000, as milliseconds it's 1973 onwards. */
const detectUnit = (digits: string): 's' | 'ms' => (digits.replace('-', '').length >= 12 ? 'ms' : 's');

interface Parts {
  y: number
  m: number
  d: number
  h: number
  min: number
  s: number
}

/** A date's calendar parts in the chosen zone. */
function partsOf(date: Date, zone: Zone): Parts {
  return zone === 'utc'
    ? { y: date.getUTCFullYear(), m: date.getUTCMonth(), d: date.getUTCDate(), h: date.getUTCHours(), min: date.getUTCMinutes(), s: date.getUTCSeconds() }
    : { y: date.getFullYear(), m: date.getMonth(), d: date.getDate(), h: date.getHours(), min: date.getMinutes(), s: date.getSeconds() };
}

function fromParts(p: Parts, zone: Zone): Date {
  return zone === 'utc' ? new Date(Date.UTC(p.y, p.m, p.d, p.h, p.min, p.s)) : new Date(p.y, p.m, p.d, p.h, p.min, p.s);
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function UnixTimestampConverterPage() {
  const { fns } = useToolSettings();
  const [date, setDate] = useState(() => new Date());
  const [unitMode, setUnitMode] = useState<UnitMode>('auto');
  const [zone, setZone] = useState<Zone>('local');
  const [draft, setDraft] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [error, setError] = useState<string | null>(null);
  const [pattern, setPattern] = useState(loadPattern);
  const [now, setNow] = useState(() => Date.now());
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PATTERN_KEY, pattern);
    } catch {
      // Not kept in a private window; nothing else to do.
    }
  }, [pattern]);

  const unit: 's' | 'ms' = unitMode === 'auto' ? detectUnit(draft) : unitMode;
  const zoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;

  /** Sets the moment from anything other than the timestamp box, and rewrites the box to match. */
  const setMoment = (d: Date) => {
    // A nudge past the last date JavaScript can hold gives an Invalid Date: stay put instead.
    if (Number.isNaN(d.getTime())) return;
    setDate(d);
    setError(null);
    setDraft(unit === 'ms' ? String(d.getTime()) : String(Math.floor(d.getTime() / 1000)));
  };

  const onTimestamp = (raw: string) => {
    const value = raw.replace(/[\s,_]/g, '');
    setDraft(value);
    if (value === '') return setError(null);
    if (!/^-?\d+$/.test(value)) return setError('Use digits only, like 1727740800.');
    const n = Number(value);
    const u = unitMode === 'auto' ? detectUnit(value) : unitMode;
    const d = new Date(u === 'ms' ? n : n * 1000);
    if (Number.isNaN(d.getTime())) return setError('That timestamp is outside the range a date can hold.');
    setError(null);
    setDate(d);
  };

  const pickUnit = (m: UnitMode) => {
    setUnitMode(m);
    // Re-read the digits under the new unit, so "1727740800" stays what it was typed as.
    const u = m === 'auto' ? detectUnit(draft) : m;
    if (/^-?\d+$/.test(draft)) {
      const d = new Date(u === 'ms' ? Number(draft) : Number(draft) * 1000);
      if (!Number.isNaN(d.getTime())) setDate(d);
    }
  };

  const p = partsOf(date, zone);
  const nudge = (ms: number) => setMoment(new Date(date.getTime() + ms));
  const dayEdge = (end: boolean) => setMoment(fromParts({ ...p, h: end ? 23 : 0, min: end ? 59 : 0, s: end ? 59 : 0 }, zone));

  const onPickDay = (d: Date | undefined) => {
    if (!d) return;
    setMoment(fromParts({ ...p, y: d.getFullYear(), m: d.getMonth(), d: d.getDate() }, zone));
    setPickerOpen(false);
  };
  const onPickTime = (v: string) => {
    if (!v) return;
    const [h = 0, min = 0, s = 0] = v.split(':').map((x) => Number(x) || 0);
    setMoment(fromParts({ ...p, h, min, s }, zone));
  };

  // Shift by the offset so date-fns (which formats in local time) shows the UTC wall clock.
  const utcWall = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  const utcHuman = `${format(utcWall, `${fns.long}, HH:mm:ss`)} UTC`;
  // The calendar row and your own format follow the zone the date was picked in.
  const zoned = zone === 'utc' ? utcWall : date;

  let custom = '';
  let customError: string | null = null;
  try {
    custom = pattern.trim() ? format(zoned, pattern) : '';
  } catch (e) {
    customError = e instanceof RangeError ? 'This pattern has a letter that isn’t a date code. Put plain words in single quotes.' : 'This pattern can’t be used.';
  }

  const seconds = Math.floor(date.getTime() / 1000);
  const rows: { label: string; value: string; code?: boolean }[] = [
    { label: 'Your time', value: format(date, `${fns.long}, ${fns.time}`) },
    { label: 'UTC', value: utcHuman },
    { label: 'Relative', value: formatDistanceToNow(date, { addSuffix: true }) },
    { label: 'Unix seconds', value: String(seconds), code: true },
    { label: 'Unix milliseconds', value: String(date.getTime()), code: true },
    { label: 'ISO 8601 (UTC)', value: date.toISOString().replace('.000Z', 'Z'), code: true },
    { label: 'ISO 8601 (your time)', value: format(date, "yyyy-MM-dd'T'HH:mm:ssxxx"), code: true },
    { label: 'HTTP and email (RFC 7231)', value: date.toUTCString(), code: true },
    { label: 'Calendar', value: `${format(zoned, 'EEEE')} · ISO week ${getISOWeek(zoned)} · day ${getDayOfYear(zoned)} of ${isLeapYear(zoned) ? 366 : 365}` },
  ];

  const nudges: { label: string; run: () => void }[] = [
    { label: 'Start of day', run: () => dayEdge(false) },
    { label: 'End of day', run: () => dayEdge(true) },
    { label: '−1 day', run: () => nudge(-86_400_000) },
    { label: '+1 day', run: () => nudge(86_400_000) },
    { label: '−1 hour', run: () => nudge(-3_600_000) },
    { label: '+1 hour', run: () => nudge(3_600_000) },
  ];

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={Timer} title="Unix Timestamp Converter" />
        <div className="flex flex-col p-4 lg:p-8">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            <PageIntro title="Unix Timestamp Converter">Turn a Unix timestamp into a real date and time, or a date back into a timestamp, as you type.</PageIntro>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
              <div className="space-y-6 lg:sticky lg:top-20">
                <Card className="minimal-card">
                  <CardContent className="flex flex-wrap items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Right now</p>
                      <p className="font-code text-lg tabular-nums">{Math.floor(now / 1000)}</p>
                    </div>
                    <CopyButton value={() => String(Math.floor(Date.now() / 1000))} size="sm" label="Copy" toastTitle="Copied" toastDescription="The current Unix time is on your clipboard." />
                    <Button variant="outline" size="sm" onClick={() => setMoment(new Date())}>Use now</Button>
                  </CardContent>
                </Card>

                <Card className="minimal-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-lg">Timestamp</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="ts-input">Unix timestamp</Label>
                      <Input
                        id="ts-input"
                        inputMode="numeric"
                        value={draft}
                        onChange={(e) => onTimestamp(e.target.value)}
                        placeholder="e.g. 1727740800"
                        aria-invalid={Boolean(error)}
                        aria-describedby="ts-help"
                        className="h-12 font-code text-xl md:text-xl"
                      />
                      <p id="ts-help" className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
                        {error ?? (unitMode === 'auto' ? `Read as ${unit === 'ms' ? 'milliseconds' : 'seconds'} (${unit === 'ms' ? '13' : '10'} digits is typical).` : `Read as ${unit === 'ms' ? 'milliseconds' : 'seconds'}.`)}
                      </p>
                    </div>
                    <fieldset>
                      <legend className="mb-2 text-sm font-medium">Unit</legend>
                      <div className="flex flex-wrap gap-1.5">
                        <Chip active={unitMode === 'auto'} onClick={() => pickUnit('auto')}>Detect</Chip>
                        <Chip active={unitMode === 's'} onClick={() => pickUnit('s')}>Seconds</Chip>
                        <Chip active={unitMode === 'ms'} onClick={() => pickUnit('ms')}>Milliseconds</Chip>
                      </div>
                    </fieldset>
                  </CardContent>
                </Card>

                <Card className="minimal-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-lg">Date and time</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <fieldset>
                      <legend className="mb-2 text-sm font-medium">Time zone</legend>
                      <div className="flex flex-wrap gap-1.5">
                        <Chip active={zone === 'local'} onClick={() => setZone('local')}>Your time ({zoneName.split('/').pop()?.replace(/_/g, ' ')})</Chip>
                        <Chip active={zone === 'utc'} onClick={() => setZone('utc')}>UTC</Chip>
                      </div>
                    </fieldset>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start font-normal">
                            <CalendarIcon className="h-4 w-4" />
                            {format(new Date(p.y, p.m, p.d), fns.long)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={new Date(p.y, p.m, p.d)} defaultMonth={new Date(p.y, p.m, p.d)} onSelect={onPickDay} autoFocus />
                        </PopoverContent>
                      </Popover>
                      <Label htmlFor="ts-time" className="sr-only">Time</Label>
                      <Input id="ts-time" type="time" step="1" value={`${pad(p.h)}:${pad(p.min)}:${pad(p.s)}`} onChange={(e) => onPickTime(e.target.value)} className="w-36 font-code" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {nudges.map((n) => (
                        <Button key={n.label} variant="outline" size="sm" onClick={n.run}>{n.label}</Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="minimal-card">
                <CardHeader className="pb-3">
                  <CardTitle className="font-headline text-lg">The same moment, in every format</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-0.5">
                    {rows.map((r) => (
                      <li key={r.label} className="flex min-h-12 items-center gap-3 rounded-md px-3 transition-colors duration-quick hover:bg-muted">
                        <div className="min-w-0 flex-1 py-1.5">
                          <p className="text-xs text-muted-foreground">{r.label}</p>
                          <p className={cn('break-all text-sm tabular-nums', r.code && 'font-code')}>{r.value}</p>
                        </div>
                        <CopyButton value={() => r.value} label="" size="icon-sm" variant="ghost" aria-label={`Copy ${r.label}`} title={`Copy ${r.label}`} toastTitle="Copied" toastDescription={r.value} />
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-1.5 border-t border-border pt-4">
                    <Label htmlFor="ts-pattern">Your own format</Label>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                      <Input id="ts-pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder={DEFAULT_PATTERN} aria-describedby="ts-pattern-help" className="font-code" />
                      <CopyButton value={() => custom} label="" size="icon" title="Copy your format" toastTitle="Copied" toastDescription={custom} disabled={!custom} />
                    </div>
                    <p className={cn('text-sm tabular-nums', customError ? 'text-destructive' : 'text-foreground')}>{customError ?? (custom || ' ')}</p>
                    <p id="ts-pattern-help" className="text-xs text-muted-foreground">
                      A date-fns pattern: yyyy year, MM month, dd day, HH hour, mm minutes, ss seconds, EEEE weekday. Put plain words in single quotes.
                    </p>
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

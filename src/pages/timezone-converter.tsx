import React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { SidebarContent } from '@/components/sidebar-content';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Combobox } from '@/components/ui/combobox';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CITY_ZONES, findCityZone, zoneLabel } from '@/lib/timezones';
import { Globe, X, ArrowLeft, ArrowRight, ArrowClockwise, CaretUp, CaretDown, Calendar as CalendarIcon } from 'phosphor-react';

dayjs.extend(utc);
dayjs.extend(timezone);

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const STORAGE_KEY = 'utilities.timezone-converter.zones';
/** Width of the zone-label column in px - must match the `w-40` class on labels. */
const LABEL_W = 160;

interface HourRange {
  start: number;
  end: number;
}

/** Compact 12-hour label used on the hour ruler. */
function hourRuler12(h: number): string {
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

/** Tailwind classes describing day / evening / night for a local hour. */
function cellTone(hour: number, isNow: boolean, isSelected: boolean): string {
  let base: string;
  if (hour >= 9 && hour < 18) base = 'bg-primary/15 text-foreground'; // working hours
  else if (hour >= 7 && hour < 21) base = 'bg-muted text-foreground'; // daytime
  else base = 'bg-background text-muted-foreground/70'; // night
  // Selection and "now" are drawn as an outline overlay on top of the grid
  // (see the range/now overlay boxes below), not a per-cell fill, so only
  // text emphasis is added here.
  if (isSelected) base += ' text-foreground font-medium';
  else if (isNow) base += ' text-foreground font-semibold';
  return base;
}

export default function TimezoneConverterPage() {
  const localZone = React.useMemo(() => dayjs.tz.guess(), []);

  const [zones, setZones] = React.useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [localZone, 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
  });

  const [dayOffset, setDayOffset] = React.useState(0);
  const [range, setRange] = React.useState<HourRange | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [use24h, setUse24h] = React.useState(true);
  const dragAnchor = React.useRef<number | null>(null);
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const [now, setNow] = React.useState(() => dayjs());

  React.useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Map a pointer X coordinate to an hour-column index (0–23) inside the grid.
  const columnFromClientX = React.useCallback((clientX: number): number => {
    const el = gridRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const cellW = (rect.width - LABEL_W) / HOURS.length;
    const raw = Math.floor((clientX - rect.left - LABEL_W) / cellW);
    return Math.min(HOURS.length - 1, Math.max(0, raw));
  }, []);

  const startDrag = (index: number) => {
    dragAnchor.current = index;
    setRange({ start: index, end: index });
    setDragging(true);
  };

  // While dragging, track the pointer across the whole window so fast drags
  // (and touch drags) never lose the selection between cells.
  React.useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const anchor = dragAnchor.current;
      if (anchor == null) return;
      const idx = columnFromClientX(e.clientX);
      setRange({ start: Math.min(anchor, idx), end: Math.max(anchor, idx) });
    };
    const onUp = () => {
      setDragging(false);
      dragAnchor.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, columnFromClientX]);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
    } catch {
      /* ignore */
    }
  }, [zones]);

  const homeZone = zones[0] ?? localZone;
  // Midnight of the viewed day in the home zone; each column is one absolute hour after it.
  const base = React.useMemo(
    () => now.tz(homeZone).startOf('day').add(dayOffset, 'day'),
    [now, homeZone, dayOffset]
  );
  const instants = React.useMemo(() => HOURS.map((i) => base.add(i, 'hour')), [base]);

  const nowIndex = dayOffset === 0 ? now.diff(base, 'hour', true) : -1;
  const nowColumn = Math.floor(nowIndex);

  // Selected range as absolute instants; end is exclusive (worldtimebuddy slot semantics).
  const rangeStart = range ? base.add(range.start, 'hour') : null;
  const rangeEnd = range ? base.add(range.end + 1, 'hour') : null;

  const timeFmt = use24h ? 'HH:mm' : 'h:mm A';
  const rangeTimeFmt = use24h ? 'HH:mm' : 'h:mm A';

  const changeDay = (next: number) => {
    setDayOffset(next);
    setRange(null);
    dragAnchor.current = null;
    setDragging(false);
  };

  const handleDatePick = (date: Date | undefined) => {
    if (!date) return;
    const today = now.tz(homeZone).startOf('day');
    const picked = dayjs(date).startOf('day');
    changeDay(picked.diff(today, 'day'));
  };

  const buildRangeSummary = () => {
    if (!rangeStart || !rangeEnd) return '';
    return zones.map((tz) => {
      const s = rangeStart.tz(tz);
      const e = rangeEnd.tz(tz);
      const endFmt = s.isSame(e, 'day') ? rangeTimeFmt : `ddd, MMM D · ${rangeTimeFmt}`;
      return `${zoneLabel(tz)}: ${s.format(`ddd, MMM D · ${rangeTimeFmt}`)} – ${e.format(endFmt)} (${tz})`;
    }).join('\n');
  };

  const addZone = (tz: string | null) => {
    if (!tz || zones.includes(tz)) return;
    setZones((prev) => [...prev, tz]);
  };
  const removeZone = (tz: string) => setZones((prev) => prev.filter((z) => z !== tz));
  const moveZone = (tz: string, dir: -1 | 1) => {
    setZones((prev) => {
      const i = prev.indexOf(tz);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const comboItems = React.useMemo(
    () =>
      CITY_ZONES.filter((c) => !zones.includes(c.timezone)).map((c) => ({
        value: c.timezone,
        label: `${c.flag} ${c.city}`,
        description: `${c.country} · ${c.timezone}`,
      })),
    [zones]
  );

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={Globe} title="Timezone Converter" />

        <div className="flex flex-1 flex-col px-4 p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-6">
            <div className="hidden sm:block">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-foreground border-b border-border pb-4">
                Timezone Converter
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                Compare a whole day across timezones on one aligned timeline, spot overlapping working
                hours instantly. Click an hour, or drag across hours, to select a time range in every zone.
              </p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:w-96">
                <Combobox
                  items={comboItems}
                  placeholder="Add a city or timezone…"
                  onValueChange={addZone}
                  resetOnSelect
                  inputClassName="h-8 py-1 px-3 text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm mr-2">
                  <Switch checked={use24h} onCheckedChange={setUse24h} />
                  <Label className="cursor-pointer select-none">24-hour</Label>
                </label>
                <Button variant="outline" size="default" className="h-8" onClick={() => changeDay(dayOffset - 1)}>
                  <ArrowLeft className="h-4 w-4" /> Prev
                </Button>
                <Button
                  variant={dayOffset === 0 ? 'secondary' : 'outline'}
                  size="default"
                  className="h-8"
                  onClick={() => changeDay(0)}
                >
                  Today
                </Button>
                <Button variant="outline" size="default" className="h-8" onClick={() => changeDay(dayOffset + 1)}>
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="default" className="h-8">
                      <CalendarIcon className="h-4 w-4" />
                      {base.format('MMM D, YYYY')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={base.toDate()}
                      onSelect={handleDatePick}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                {range && (
                  <Button variant="ghost" size="default" className="h-8" onClick={() => setRange(null)}>
                    <ArrowClockwise className="h-4 w-4" /> Clear selection
                  </Button>
                )}
              </div>
            </div>

            {/* Range summary - stays mounted through drags and clicks alike so it never flashes away. */}
            {rangeStart && rangeEnd && range && (
              <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 text-sm space-y-2 animate-in fade-in-0 duration-quick ease-smooth-out">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-medium text-foreground">
                      {rangeStart.tz(homeZone).format(`ddd, MMM D · ${rangeTimeFmt}`)} –{' '}
                      {rangeEnd.tz(homeZone).format(rangeStart.tz(homeZone).isSame(rangeEnd.tz(homeZone), 'day') ? rangeTimeFmt : `ddd, MMM D · ${rangeTimeFmt}`)}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      in {zoneLabel(homeZone)} · {range.end - range.start + 1}h
                    </span>
                  </div>
                  <CopyButton
                    value={buildRangeSummary}
                    label="Copy all zones"
                    size="sm"
                    toastDescription="Time range copied for all zones."
                  />
                </div>
                <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                  {zones.map((tz) => {
                    const s = rangeStart.tz(tz);
                    const e = rangeEnd.tz(tz);
                    const endFmt = s.isSame(e, 'day') ? rangeTimeFmt : `ddd · ${rangeTimeFmt}`;
                    return (
                      <div key={tz} className="flex items-center gap-1.5 tabular-nums">
                        <span className="flag-emoji">{findCityZone(tz)?.flag ?? '🌐'}</span>
                        <span className="text-muted-foreground truncate">{zoneLabel(tz)}</span>
                        <span className="ml-auto font-medium text-foreground">
                          {s.format(`ddd · ${rangeTimeFmt}`)} – {e.format(endFmt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grid */}
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <div ref={gridRef} className="min-w-[760px] select-none">
                  {/* Hour ruler */}
                  <div className="flex border-b border-border bg-muted/30">
                    <div className="w-40 shrink-0 px-3 py-2 text-xs font-medium text-muted-foreground">
                      {base.format('ddd, MMM D')}
                    </div>
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        className={cn(
                          'flex-1 text-center py-2 text-[10px] tabular-nums text-muted-foreground',
                          h === nowColumn && 'text-foreground font-semibold'
                        )}
                      >
                        {use24h ? String(h).padStart(2, '0') : hourRuler12(h)}
                      </div>
                    ))}
                  </div>

                  {/* Zone rows */}
                  <div className="relative">
                  {zones.map((tz, idx) => {
                    const city = findCityZone(tz);
                    const labelInstant = rangeStart ?? now;
                    const local = labelInstant.tz(tz);
                    return (
                      <div key={tz} className="flex items-stretch group">
                        {/* Label */}
                        <div className={cn(
                          "w-40 shrink-0 px-3 py-2 flex flex-col justify-center gap-0.5",
                          idx !== zones.length - 1 && "border-b border-border"
                        )}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="flag-emoji text-sm">{city?.flag ?? '🌐'}</span>
                            <span className="text-sm font-medium truncate">{zoneLabel(tz)}</span>
                            {idx === 0 && (
                              <span className="text-[9px] uppercase tracking-wide text-primary font-semibold">Home</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                            <span className="text-foreground font-medium">{local.format(timeFmt)}</span>
                            <span>GMT{local.format('Z').replace(':00', '')}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button aria-label="Move up" onClick={() => moveZone(tz, -1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={idx === 0}>
                              <CaretUp className="h-3 w-3" />
                            </button>
                            <button aria-label="Move down" onClick={() => moveZone(tz, 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={idx === zones.length - 1}>
                              <CaretDown className="h-3 w-3" />
                            </button>
                            <button aria-label="Remove" onClick={() => removeZone(tz)} className="text-muted-foreground hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Hour cells */}
                        {instants.map((inst, i) => {
                          const localHour = inst.tz(tz).hour();
                          const isMidnight = localHour === 0;
                          const inRange = range != null && i >= range.start && i <= range.end;
                          return (
                            <button
                              key={i}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                startDrag(i);
                              }}
                              title={inst.tz(tz).format(`ddd, MMM D · ${rangeTimeFmt}`)}
                              className={cn(
                                'flex-1 min-h-[3rem] flex flex-col items-center justify-center border-l border-l-border/50 text-xs tabular-nums transition-colors touch-none cursor-pointer',
                                idx !== zones.length - 1 && 'border-b border-b-border/50',
                                cellTone(localHour, i === nowColumn, inRange)
                              )}
                            >
                              <span>{use24h ? localHour : ((localHour % 12) || 12)}</span>
                              {isMidnight && (
                                <span className="text-[8px] text-muted-foreground leading-none mt-0.5">
                                  {inst.tz(tz).format('M/D')}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Selected-range overlay - a single outline box (no fill) spanning every zone row. */}
                  {range && (
                    <div
                      className="pointer-events-none absolute inset-y-0 rounded-md border-2 border-primary/60"
                      style={{
                        left: `calc(${LABEL_W}px + (100% - ${LABEL_W}px) * ${range.start} / 24)`,
                        width: `calc((100% - ${LABEL_W}px) * ${range.end - range.start + 1} / 24)`,
                      }}
                    />
                  )}

                  {/* "Now" column overlay - same treatment, one column wide. */}
                  {nowColumn >= 0 && nowColumn < HOURS.length && (
                    <div
                      className="pointer-events-none absolute inset-y-0 rounded-md border-2 border-foreground/50"
                      style={{
                        left: `calc(${LABEL_W}px + (100% - ${LABEL_W}px) * ${nowColumn} / 24)`,
                        width: `calc((100% - ${LABEL_W}px) / 24)`,
                      }}
                    />
                  )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-primary/15" /> Working hours (9–18)</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-muted" /> Daytime</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-background border border-border" /> Night</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded ring-2 ring-foreground/50" /> Now</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-primary/30 ring-1 ring-primary/60" /> Selected range (drag to extend)</span>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

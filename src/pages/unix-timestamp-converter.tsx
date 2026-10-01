import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowsLeftRight, Calendar as CalendarIcon, Timer, Clock } from 'phosphor-react';
import { Sidebar, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { format, parseISO, formatDistanceToNow, startOfDay, endOfDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { ToolMethodology } from '@/components/tool-methodology';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToolSettings } from "@/hooks/use-tool-settings";

type Unit = 's' | 'ms';
type DisplayFormatId = 'site' | 'my' | 'my-24' | 'dmy' | 'us' | 'iso' | 'custom';

// `site` resolves to the Settings preference; the rest are fixed date-fns patterns.
const DISPLAY_FORMATS: { id: DisplayFormatId; label: string; pattern?: string }[] = [
  { id: 'site', label: 'Site default' },
  { id: 'my', label: 'Malaysia / UK', pattern: 'd MMMM yyyy, h:mm a' },
  { id: 'my-24', label: 'Malaysia / UK (24-hour)', pattern: 'd MMMM yyyy, HH:mm' },
  { id: 'dmy', label: 'DD/MM/YYYY', pattern: 'dd/MM/yyyy HH:mm:ss' },
  { id: 'us', label: 'US', pattern: 'PPP p' },
  { id: 'iso', label: 'ISO 8601', pattern: 'yyyy-MM-dd HH:mm:ss' },
  { id: 'custom', label: 'Custom…' },
];

const DISPLAY_FORMAT_KEY = 'utilities.my-unix-display-format';

function loadDisplayFormat(): { id: DisplayFormatId; custom: string } {
  const fallback = { id: 'site' as DisplayFormatId, custom: 'EEEE, d MMMM yyyy HH:mm:ss' };
  try {
    const raw = localStorage.getItem(DISPLAY_FORMAT_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<{ id: DisplayFormatId; custom: string }>;
    const id = DISPLAY_FORMATS.some(f => f.id === parsed.id) ? parsed.id! : fallback.id;
    return { id, custom: typeof parsed.custom === 'string' ? parsed.custom : fallback.custom };
  } catch {
    return fallback;
  }
}
type EditingField = 'timestamp' | 'human' | null;

function toTimestampString(date: Date, unit: Unit): string {
  return unit === 'ms' ? String(date.getTime()) : String(Math.floor(date.getTime() / 1000));
}

function toHumanString(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}

export default function UnixTimestampConverterPage() {
  const [unit, setUnit] = useState<Unit>('s');
  const [date, setDate] = useState<Date>(() => new Date());
  const [editingField, setEditingField] = useState<EditingField>(null);

  const [timestampDraft, setTimestampDraft] = useState(() => toTimestampString(date, unit));
  const [humanDraft, setHumanDraft] = useState(() => toHumanString(date));
  const [timestampError, setTimestampError] = useState<string | null>(null);
  const [humanError, setHumanError] = useState<string | null>(null);

  const { fns } = useToolSettings();
  const [displayFormat, setDisplayFormat] = useState(loadDisplayFormat);
  useEffect(() => {
    try {
      localStorage.setItem(DISPLAY_FORMAT_KEY, JSON.stringify(displayFormat));
    } catch {
      // Storage unavailable; the choice just won't persist.
    }
  }, [displayFormat]);

  // Keep both text fields synced to the canonical `date`, but never clobber
  // the field the user is actively typing into.
  useEffect(() => {
    if (editingField !== 'timestamp') setTimestampDraft(toTimestampString(date, unit));
    if (editingField !== 'human') setHumanDraft(toHumanString(date));
  }, [date, unit, editingField]);

  const handleTimestampChange = (value: string) => {
    setEditingField('timestamp');
    setTimestampDraft(value);
    if (value.trim() === '') { setTimestampError(null); return; }
    const num = Number(value);
    if (!Number.isFinite(num)) { setTimestampError('Enter a valid number'); return; }
    const d = unit === 'ms' ? new Date(num) : new Date(num * 1000);
    if (isNaN(d.getTime())) { setTimestampError('Timestamp out of range'); return; }
    setTimestampError(null);
    setDate(d);
  };

  const handleHumanChange = (value: string) => {
    setEditingField('human');
    setHumanDraft(value);
    if (value.trim() === '') { setHumanError(null); return; }
    const d = parseISO(value);
    if (isNaN(d.getTime())) { setHumanError('Invalid date/time format'); return; }
    setHumanError(null);
    setDate(d);
  };

  const setCanonicalDate = (d: Date) => {
    setEditingField(null);
    setTimestampError(null);
    setHumanError(null);
    setDate(d);
  };

  const handleTimeOfDayChange = (value: string) => {
    const [hours, minutes, seconds] = value.split(':').map(Number);
    const next = new Date(date);
    next.setHours(hours || 0, minutes || 0, seconds || 0);
    setCanonicalDate(next);
  };

  const toggleUnit = () => {
    // The timestamp field is just a view of the canonical `date`; force it to
    // re-render under the new unit rather than reinterpreting stale digits.
    setEditingField(null);
    setUnit(u => (u === 's' ? 'ms' : 's'));
  };

  const handleSwap = () => {
    // Re-parse whichever text field currently holds a valid value, and make
    // that the canonical date - mirrors "swap" on a two-way converter.
    if (editingField === 'human' && !humanError) {
      const d = parseISO(humanDraft);
      if (!isNaN(d.getTime())) setCanonicalDate(d);
      return;
    }
    if (!timestampError) {
      const num = Number(timestampDraft);
      if (Number.isFinite(num)) {
        const d = unit === 'ms' ? new Date(num) : new Date(num * 1000);
        if (!isNaN(d.getTime())) setCanonicalDate(d);
      }
    }
  };

  const displayPattern =
    displayFormat.id === 'site'
      ? `${fns.long}, ${fns.time}`
      : displayFormat.id === 'custom'
        ? displayFormat.custom
        : DISPLAY_FORMATS.find(f => f.id === displayFormat.id)?.pattern ?? 'PPP p';
  let displayText = '';
  let displayError: string | null = null;
  try {
    displayText = displayPattern.trim() ? format(date, displayPattern) : '';
  } catch (e) {
    displayError = e instanceof Error ? e.message : 'Invalid format pattern';
  }

  const relative = formatDistanceToNow(date, { addSuffix: true });
  const isValid = !timestampError && !humanError;

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={Timer} title="Unix Timestamp Converter" />

        <div className="flex flex-1 flex-col px-4 p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8">
            <div className="mb-8 max-sm:sr-only">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Unix Timestamp Converter</h1>
              <p className="text-lg text-muted-foreground max-w-3xl">Convert Unix timestamps to human-readable dates and back, updates live as you type.</p>
            </div>

            <div className="max-w-2xl mx-auto w-full">
              <Card className="w-full shadow-sm">
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setCanonicalDate(new Date())}>
                      <Clock className="h-4 w-4" /> Now
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setCanonicalDate(startOfDay(date))}>
                      Start of day
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setCanonicalDate(endOfDay(date))}>
                      End of day
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleUnit}
                      className="ml-auto font-mono"
                      title="Toggle seconds / milliseconds"
                    >
                      {unit === 'ms' ? 'milliseconds' : 'seconds'}
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="timestamp" className="mb-1.5 block">
                      Unix Timestamp ({unit === 'ms' ? 'milliseconds' : 'seconds'})
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="timestamp"
                        type="text"
                        inputMode="numeric"
                        value={timestampDraft}
                        onChange={(e) => handleTimestampChange(e.target.value.trim())}
                        placeholder={unit === 'ms' ? 'e.g., 1678886400123' : 'e.g., 1678886400'}
                        className={cn('font-mono', timestampError && 'border-destructive focus-visible:ring-destructive/30')}
                      />
                      <CopyButton value={() => timestampDraft} label="" title="Copy timestamp" disabled={!timestampDraft} />
                    </div>
                    {timestampError && <p className="mt-1 text-xs text-destructive">{timestampError}</p>}
                  </div>

                  <div className="flex justify-center">
                    <Button variant="outline" size="icon" onClick={handleSwap} title="Re-sync from the field you last edited">
                      <ArrowsLeftRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="humanDate" className="mb-1.5 block">Human Readable Date &amp; Time</Label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" title="Pick a date">
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(d) => d && setCanonicalDate(d)}
                            autoFocus
                          />
                          <div className="p-3 border-t border-border">
                            <Input
                              type="time"
                              step="1"
                              value={format(date, 'HH:mm:ss')}
                              onChange={(e) => handleTimeOfDayChange(e.target.value)}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Input
                        id="humanDate"
                        type="text"
                        value={humanDraft}
                        onChange={(e) => handleHumanChange(e.target.value)}
                        placeholder="e.g., 2023-03-15T12:00:00"
                        className={cn('font-mono flex-1', humanError && 'border-destructive focus-visible:ring-destructive/30')}
                      />
                      <CopyButton value={() => humanDraft} label="" title="Copy date" disabled={!humanDraft} />
                    </div>
                    {humanError && <p className="mt-1 text-xs text-destructive">{humanError}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                      <div className="space-y-1.5 sm:w-56">
                        <Label htmlFor="displayFormat">Display format</Label>
                        <Select
                          value={displayFormat.id}
                          onValueChange={(id) => setDisplayFormat(f => ({ ...f, id: id as DisplayFormatId }))}
                        >
                          <SelectTrigger id="displayFormat" className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DISPLAY_FORMATS.map(f => (
                              <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {displayFormat.id === 'custom' && (
                        <div className="flex-1 space-y-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-fast ease-smooth-out">
                          <Label htmlFor="customFormat">Pattern (date-fns)</Label>
                          <Input
                            id="customFormat"
                            value={displayFormat.custom}
                            onChange={(e) => setDisplayFormat(f => ({ ...f, custom: e.target.value }))}
                            placeholder="e.g., EEEE, d MMMM yyyy HH:mm:ss"
                            className={cn('font-mono', displayError && 'border-destructive focus-visible:ring-destructive/30')}
                          />
                        </div>
                      )}
                    </div>
                    {displayError && <p className="text-xs text-destructive">{displayError}</p>}
                    {displayFormat.id === 'custom' && !displayError && (
                      <p className="text-xs text-muted-foreground">
                        Tokens: <code>d</code> day, <code>MMMM</code> month name, <code>yyyy</code> year, <code>HH</code>/<code>h</code> hour, <code>mm</code> minute, <code>a</code> AM/PM. Wrap literal text in <code>'single quotes'</code>.
                      </p>
                    )}
                  </div>

                  <div className={cn(
                    "p-5 bg-muted/40 border border-border rounded-2xl space-y-3 animate-in fade-in-0 duration-quick ease-smooth-out",
                    !isValid && "opacity-50"
                  )}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold text-foreground break-words min-w-0">{displayText || '-'}</span>
                      <Badge variant="secondary" className="text-xs">{relative}</Badge>
                      <CopyButton value={() => displayText} label="" size="icon-sm" title="Copy formatted date" disabled={!displayText} className="ml-auto" />
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Local ISO</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-foreground truncate">{format(date, "yyyy-MM-dd'T'HH:mm:ssxxx")}</span>
                        <CopyButton value={() => format(date, "yyyy-MM-dd'T'HH:mm:ssxxx")} label="" size="icon-sm" title="Copy Local ISO" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">UTC ISO</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-foreground truncate">{date.toISOString()}</span>
                        <CopyButton value={() => date.toISOString()} label="" size="icon-sm" title="Copy UTC ISO" />
                      </div>
                    </div>
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

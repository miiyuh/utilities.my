import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import {
  Globe,
  Copy,
  Clock,
  Calendar as CalendarIcon,
  Trash2,
  RefreshCcw,
} from 'lucide-react';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import { SidebarContent } from '@/components/sidebar-content';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Get timezone abbreviation
const getTimezoneAbbr = (tz: string, date: dayjs.Dayjs): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-MY', {
      timeZone: tz,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(date.toDate());
    return parts.find(part => part.type === 'timeZoneName')?.value || 'UTC';
  } catch {
    return 'UTC';
  }
};

// Timezone data with metadata
interface TimezoneItem {
  value: string;
  city: string;
  country: string;
  code: string;
}

const TIMEZONE_LIST: TimezoneItem[] = [
  { value: 'UTC', city: 'UTC', country: 'Coordinated Universal Time', code: 'un' },
  { value: 'America/New_York', city: 'New York', country: 'United States', code: 'us' },
  { value: 'America/Los_Angeles', city: 'Los Angeles', country: 'United States', code: 'us' },
  { value: 'America/Chicago', city: 'Chicago', country: 'United States', code: 'us' },
  { value: 'America/Denver', city: 'Denver', country: 'United States', code: 'us' },
  { value: 'America/Toronto', city: 'Toronto', country: 'Canada', code: 'ca' },
  { value: 'America/Vancouver', city: 'Vancouver', country: 'Canada', code: 'ca' },
  { value: 'America/Mexico_City', city: 'Mexico City', country: 'Mexico', code: 'mx' },
  { value: 'America/Sao_Paulo', city: 'São Paulo', country: 'Brazil', code: 'br' },
  { value: 'America/Buenos_Aires', city: 'Buenos Aires', country: 'Argentina', code: 'ar' },
  { value: 'Europe/London', city: 'London', country: 'United Kingdom', code: 'gb' },
  { value: 'Europe/Paris', city: 'Paris', country: 'France', code: 'fr' },
  { value: 'Europe/Berlin', city: 'Berlin', country: 'Germany', code: 'de' },
  { value: 'Europe/Rome', city: 'Rome', country: 'Italy', code: 'it' },
  { value: 'Europe/Madrid', city: 'Madrid', country: 'Spain', code: 'es' },
  { value: 'Europe/Amsterdam', city: 'Amsterdam', country: 'Netherlands', code: 'nl' },
  { value: 'Europe/Brussels', city: 'Brussels', country: 'Belgium', code: 'be' },
  { value: 'Europe/Vienna', city: 'Vienna', country: 'Austria', code: 'at' },
  { value: 'Europe/Zurich', city: 'Zurich', country: 'Switzerland', code: 'ch' },
  { value: 'Europe/Stockholm', city: 'Stockholm', country: 'Sweden', code: 'se' },
  { value: 'Europe/Oslo', city: 'Oslo', country: 'Norway', code: 'no' },
  { value: 'Europe/Copenhagen', city: 'Copenhagen', country: 'Denmark', code: 'dk' },
  { value: 'Europe/Helsinki', city: 'Helsinki', country: 'Finland', code: 'fi' },
  { value: 'Europe/Warsaw', city: 'Warsaw', country: 'Poland', code: 'pl' },
  { value: 'Europe/Prague', city: 'Prague', country: 'Czech Republic', code: 'cz' },
  { value: 'Europe/Athens', city: 'Athens', country: 'Greece', code: 'gr' },
  { value: 'Europe/Istanbul', city: 'Istanbul', country: 'Turkey', code: 'tr' },
  { value: 'Europe/Moscow', city: 'Moscow', country: 'Russia', code: 'ru' },
  { value: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan', code: 'jp' },
  { value: 'Asia/Shanghai', city: 'Shanghai', country: 'China', code: 'cn' },
  { value: 'Asia/Hong_Kong', city: 'Hong Kong', country: 'Hong Kong', code: 'hk' },
  { value: 'Asia/Singapore', city: 'Singapore', country: 'Singapore', code: 'sg' },
  { value: 'Asia/Seoul', city: 'Seoul', country: 'South Korea', code: 'kr' },
  { value: 'Asia/Bangkok', city: 'Bangkok', country: 'Thailand', code: 'th' },
  { value: 'Asia/Manila', city: 'Manila', country: 'Philippines', code: 'ph' },
  { value: 'Asia/Jakarta', city: 'Jakarta', country: 'Indonesia', code: 'id' },
  { value: 'Asia/Kuala_Lumpur', city: 'Kuala Lumpur', country: 'Malaysia', code: 'my' },
  { value: 'Asia/Ho_Chi_Minh', city: 'Ho Chi Minh', country: 'Vietnam', code: 'vn' },
  { value: 'Asia/Mumbai', city: 'Mumbai', country: 'India', code: 'in' },
  { value: 'Asia/Kolkata', city: 'Kolkata', country: 'India', code: 'in' },
  { value: 'Asia/Dubai', city: 'Dubai', country: 'United Arab Emirates', code: 'ae' },
  { value: 'Asia/Karachi', city: 'Karachi', country: 'Pakistan', code: 'pk' },
  { value: 'Asia/Dhaka', city: 'Dhaka', country: 'Bangladesh', code: 'bd' },
  { value: 'Australia/Sydney', city: 'Sydney', country: 'Australia', code: 'au' },
  { value: 'Australia/Melbourne', city: 'Melbourne', country: 'Australia', code: 'au' },
  { value: 'Australia/Brisbane', city: 'Brisbane', country: 'Australia', code: 'au' },
  { value: 'Pacific/Auckland', city: 'Auckland', country: 'New Zealand', code: 'nz' },
  { value: 'Africa/Cairo', city: 'Cairo', country: 'Egypt', code: 'eg' },
  { value: 'Africa/Lagos', city: 'Lagos', country: 'Nigeria', code: 'ng' },
  { value: 'Africa/Johannesburg', city: 'Johannesburg', country: 'South Africa', code: 'za' },
];

const FlagImage = ({ code, className }: { code: string; className?: string }) => {
  const url = code === 'un' 
    ? 'https://flagcdn.com/w80/un.png' 
    : `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
  
  return (
    <div className={cn("relative flex items-center justify-center bg-muted/30 overflow-hidden", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={url} 
        alt="" 
        className="w-full h-full object-contain" 
        loading="lazy"
      />
      <div className="absolute inset-0 pointer-events-none border border-black/5 rounded-[inherit]" />
    </div>
  );
};

export default function TimezoneConverterPage() {
  const { toast } = useToast();
  
  // State for reference timezone and time
  const [referenceTimezone, setReferenceTimezone] = useState(dayjs.tz.guess());
  const [referenceDate, setReferenceDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [referenceTime, setReferenceTime] = useState(dayjs().format('HH:mm'));
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Selected timezones to display
  const [selectedTimezones, setSelectedTimezones] = useState<string[]>([
    dayjs.tz.guess(),
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
  ]);

  const prevReferenceRef = useRef(referenceTimezone);

  const timezoneItems = useMemo(
    () =>
      TIMEZONE_LIST.map(tz => ({
        value: tz.value,
        label: tz.city,
        description: `${tz.country} · ${tz.value}`,
        leading: <FlagImage code={tz.code} className="w-8 h-4 rounded-[2px] shadow-sm" />,
      })),
    []
  );

  const availableAddItems = useMemo(
    () => timezoneItems.filter(item => !selectedTimezones.includes(item.value)),
    [selectedTimezones, timezoneItems]
  );

  useEffect(() => {
    setSelectedTimezones(prev => {
      const next = prev.filter(tz => tz !== referenceTimezone);
      const prevRef = prevReferenceRef.current;
      if (prevRef && prevRef !== referenceTimezone && !next.includes(prevRef)) {
        return [...next, prevRef];
      }
      return next;
    });
    prevReferenceRef.current = referenceTimezone;
  }, [referenceTimezone]);

  // Calculate the reference moment
  const referenceMoment = useMemo(() => {
    try {
      return dayjs.tz(`${referenceDate} ${referenceTime}`, 'YYYY-MM-DD HH:mm', referenceTimezone);
    } catch {
      return dayjs().tz(referenceTimezone);
    }
  }, [referenceDate, referenceTime, referenceTimezone]);

  // Get conversions for all selected timezones
  const conversions = useMemo(() => {
    return selectedTimezones.map(tz => {
      const converted = referenceMoment.clone().tz(tz);
      return {
        timezone: tz,
        time: converted.format('HH:mm'),
        date: converted.format('ddd, DD MMM YYYY'),
        utcOffset: converted.format('Z'),
        abbr: getTimezoneAbbr(tz, converted),
      };
    });
  }, [referenceMoment, selectedTimezones]);

  const addTimezone = (tz: string) => {
    if (selectedTimezones.includes(tz)) {
      toast({
        title: 'Already added',
        description: 'This timezone is already in your list.',
      });
      return;
    }
    setSelectedTimezones([...selectedTimezones, tz]);
  };

  const removeTimezone = (tz: string) => {
    if (selectedTimezones.length === 1) {
      toast({
        title: 'Cannot remove',
        description: 'You need at least one timezone.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedTimezones(selectedTimezones.filter(t => t !== tz));
  };

  const copyTimeInfo = (timezone: string, time: string, date: string) => {
    const text = `${time} (${timezone})\n${date}`;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Time information copied to clipboard.',
    });
  };

  const setToNow = () => {
    const now = dayjs();
    setReferenceDate(now.format('YYYY-MM-DD'));
    setReferenceTime(now.format('HH:mm'));
  };

  const tzData = TIMEZONE_LIST.find(tz => tz.value === referenceTimezone) || TIMEZONE_LIST[0];

  // dnd-kit state & handlers
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const from = selectedTimezones.indexOf(active.id as string);
      const to = selectedTimezones.indexOf(over.id as string);
      if (from !== -1 && to !== -1) setSelectedTimezones(prev => arrayMove(prev, from, to));
    }
  };

  const activeTzInfo = activeId ? TIMEZONE_LIST.find(t => t.value === activeId) : null;

  function SortableItem({ id, children }: { id: string; children: (opts: { isDragging: boolean }) => React.ReactNode }) {
    const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      touchAction: 'manipulation',
    };
    const handlePointerDown = (e: React.PointerEvent) => {
      const tgt = e.target as HTMLElement | null;
      if (!tgt) return;
      if (tgt.closest && tgt.closest('button, a, input, select, textarea')) return;
      listeners?.onPointerDown?.(e);
    };
    return (
      <div ref={setNodeRef} style={style} onPointerDown={handlePointerDown} className="col-span-1">
        {children({ isDragging })}
      </div>
    );
  }

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 md:px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="lg:hidden" />
            <Globe className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold font-headline">Timezone Converter</h1>
          </div>
          <ThemeToggleButton />
        </header>

        <div className="flex flex-1 flex-col overflow-auto">
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-6xl mx-auto space-y-8">
              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-5xl font-bold tracking-tight text-foreground">
                  Timezone Converter
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
                  Plan meetings, track travel, or stay in touch across borders.
                </p>
              </div>

              {/* Reference Time Input Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Reference Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Timezone Selector */}
                    <div className="space-y-2">
                      <Label htmlFor="ref-tz">Timezone</Label>
                      <Combobox
                        items={timezoneItems}
                        value={referenceTimezone}
                        onValueChange={setReferenceTimezone}
                        placeholder="Search timezones"
                        className="w-full"
                      />
                    </div>

                    {/* Date Picker */}
                    <div className="space-y-2">
                      <Label htmlFor="ref-date">Date</Label>
                      <div className="flex gap-2">
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="lg"
                              className="flex-1 justify-between font-normal"
                            >
                              <span className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                {dayjs(referenceDate).format('ddd, DD MMM YYYY')}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={dayjs(referenceDate).toDate()}
                              onSelect={date => {
                                if (!date) return;
                                setReferenceDate(dayjs(date).format('YYYY-MM-DD'));
                                setCalendarOpen(false);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={setToNow}
                          className="px-4"
                          title="Set to today"
                        >
                          <RefreshCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Time Picker */}
                  <div className="space-y-2">
                    <Label htmlFor="ref-time">Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="ref-time"
                        type="time"
                        value={referenceTime}
                        onChange={e => setReferenceTime(e.target.value)}
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  {/* Display Current Reference Info */}
                  <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Current Reference</div>
                        <div className="text-5xl font-mono font-bold text-primary tracking-tight">
                          {referenceMoment.format('HH:mm')}
                        </div>
                        <div className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                          <FlagImage code={tzData.code} className="w-8 h-4 rounded-[2px] shadow-sm" />
                          <span>{referenceMoment.format('ddd, DD MMM YYYY')}</span>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="font-medium">{referenceTimezone}</span>
                        </div>
                      </div>
                      <div className="sm:text-right pt-4 sm:pt-0 border-t sm:border-t-0 border-primary/10">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">UTC Offset</div>
                        <div className="text-3xl font-mono font-bold text-foreground">
                          {referenceMoment.format('Z')}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conversions Grid */}
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">Conversions</h2>
                    <p className="text-sm text-muted-foreground mt-1">Compare multiple timezones side-by-side.</p>
                  </div>
                  <div className="w-full sm:w-[360px]">
                    <Combobox
                      items={availableAddItems}
                      placeholder="Search and add a city..."
                      onValueChange={addTimezone}
                      resetOnSelect
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <SortableContext items={selectedTimezones} strategy={rectSortingStrategy}>
                      {selectedTimezones.map(tz => {
                        const conversion = conversions.find(c => c.timezone === tz) as (typeof conversions)[0];
                        const tzInfo = TIMEZONE_LIST.find(t => t.value === tz);
                        return (
                          <SortableItem key={tz} id={tz}>
                            {({ isDragging }) => (
                              <Card data-tz={tz} className={cn(
                                "flex flex-col h-full transition-all duration-200",
                                isDragging ? "opacity-60 cursor-grabbing scale-[1.02] shadow-2xl z-50" : "hover:shadow-md hover:border-primary/20"
                              )}>
                                <CardHeader className="pb-4">
                                  <CardTitle className="text-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <FlagImage 
                                        code={tzInfo?.code || 'un'} 
                                        className="w-16 h-8 rounded-sm shadow-sm" 
                                      />
                                      <div className="min-w-0">
                                        <div className="truncate font-bold leading-tight">{tzInfo?.city}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mt-0.5">{conversion.abbr}</div>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        copyTimeInfo(
                                          conversion.timezone,
                                          conversion.time,
                                          conversion.date
                                        )
                                      }
                                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                                      title="Copy"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col gap-6">
                                  <div>
                                    <div className="text-4xl font-mono font-bold text-primary tracking-tight">
                                      {conversion.time}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-2 font-medium">
                                      {conversion.date}
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-3 mt-auto">
                                    <div className="flex items-center justify-between py-2 border-y border-border/50">
                                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">UTC Offset</span>
                                      <span className="font-mono font-bold text-sm">{conversion.utcOffset}</span>
                                    </div>
                                    
                                    {conversion.timezone !== referenceTimezone && (
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="lg"
                                          onClick={() => {
                                            setReferenceTimezone(conversion.timezone);
                                            setReferenceTime(conversion.time);
                                            setReferenceDate(referenceMoment.clone().tz(conversion.timezone).format('YYYY-MM-DD'));
                                          }}
                                          className="flex-1 h-11 text-xs font-bold uppercase tracking-widest"
                                        >
                                          Set Reference
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          onClick={() => removeTimezone(conversion.timezone)}
                                          aria-label={`Remove ${tzInfo?.city}`}
                                          className="h-11 w-11 p-0 flex-shrink-0 group hover:bg-destructive hover:text-destructive-foreground"
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive transition-colors group-hover:text-white" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </SortableItem>
                        );
                      })}
                    </SortableContext>

                    <DragOverlay>
                      {activeId && activeTzInfo && (
                        <div className="w-64 bg-background border rounded-lg shadow-lg p-3 opacity-95">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FlagImage code={activeTzInfo.code} className="w-8 h-4 rounded-[2px] shadow-sm" />
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{activeTzInfo.city}</div>
                                <div className="text-xs text-muted-foreground">{activeId}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </DragOverlay>
                  </DndContext>
                </div>
              </div>

              {/* Usage Tips */}
              <Card className="bg-muted/20 border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Quick Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm text-muted-foreground">
                  <div className="flex gap-2">
                    <span className="text-primary font-bold">•</span>
                    <p><strong>Set Reference</strong> &ndash; Choose your base timezone and time to start converting.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-primary font-bold">•</span>
                    <p><strong>Add Cities</strong> &ndash; Search and add as many cities as you need to compare.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-primary font-bold">•</span>
                    <p><strong>Reorder</strong> &ndash; Drag and drop cards to organize your most important timezones.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-primary font-bold">•</span>
                    <p><strong>Sync</strong> &ndash; Click &quot;Set Reference&quot; on any card to instantly pivot the view to that city.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

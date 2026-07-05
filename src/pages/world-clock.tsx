import React from 'react';
import { Helmet } from 'react-helmet-async';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { SidebarContent } from '@/components/sidebar-content';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobeClock, type GlobeView, type GlobeMode } from '@/components/globe-clock';
import { cn } from '@/lib/utils';
import { CITY_ZONES, findCityZone, zoneLabel } from '@/lib/timezones';
import { Clock, Sun, Moon, X, MagnifyingGlass, DotsSixVertical } from 'phosphor-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

dayjs.extend(utc);
dayjs.extend(timezone);

const STORAGE_KEY = 'utilities.world-clock.zones';

interface PinnedCityRowProps {
  tz: string;
  isHome: boolean;
  isDay: boolean;
  flag: string;
  timeLabel: string;
  dateLabel: string;
  onRemove: () => void;
}

function PinnedCityRow({ tz, isHome, isDay, flag, timeLabel, dateLabel, onRemove }: PinnedCityRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tz });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${zoneLabel(tz)}`}
        className="shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
      >
        <DotsSixVertical className="h-4 w-4" />
      </button>
      <span className="flag-emoji">{flag}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{zoneLabel(tz)}</span>
          {isHome && (
            <span className="text-[9px] uppercase tracking-wide text-primary font-semibold">You</span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground tabular-nums">{dateLabel}</div>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full p-1',
          isDay ? 'bg-amber-400/15 text-amber-500' : 'bg-indigo-400/15 text-indigo-400'
        )}
      >
        {isDay ? <Sun className="h-3 w-3" weight="fill" /> : <Moon className="h-3 w-3" weight="fill" />}
      </span>
      <span className="font-mono text-sm font-semibold tabular-nums">{timeLabel}</span>
      <button
        aria-label={`Remove ${zoneLabel(tz)}`}
        onClick={onRemove}
        className="text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function WorldClockPage() {
  const localZone = React.useMemo(() => dayjs.tz.guess(), []);
  const [now, setNow] = React.useState(() => dayjs());
  const [search, setSearch] = React.useState('');
  const [use24h, setUse24h] = React.useState(true);
  const [showSeconds, setShowSeconds] = React.useState(true);
  const [view, setView] = React.useState<GlobeView>('globe');
  const [mode, setMode] = React.useState<GlobeMode>('cities');

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
    return [localZone, 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];
  });

  React.useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
    } catch {
      /* ignore */
    }
  }, [zones]);

  const addZone = (tz: string | null) => {
    if (!tz || zones.includes(tz)) return;
    setZones((prev) => [...prev, tz]);
  };
  const removeZone = (tz: string) => setZones((prev) => prev.filter((z) => z !== tz));
  const toggleZone = (tz: string) => {
    setZones((prev) => (prev.includes(tz) ? prev.filter((z) => z !== tz) : [...prev, tz]));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setZones((prev) => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
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

  const timeFmt = `${use24h ? 'HH:mm' : 'h:mm'}${showSeconds ? ':ss' : ''}${use24h ? '' : ' A'}`;

  const visibleZones = zones.filter((tz) => {
    if (!search.trim()) return true;
    const c = findCityZone(tz);
    const hay = `${zoneLabel(tz)} ${c?.country ?? ''} ${tz}`.toLowerCase();
    return hay.includes(search.trim().toLowerCase());
  });

  return (
    <>
      <Helmet>
        <title>World Clock | utilities.my</title>
        <meta name="description" content="An interactive globe world clock, spin the earth, flip to a Mercator map, and see live times and timezone regions." />
        <link rel="canonical" href="https://utilities.my/world-clock" />
      </Helmet>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={Clock} title="World Clock" />

        <div className="flex flex-1 flex-col px-4 p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8">
            <div className="hidden sm:block">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-foreground border-b border-border pb-4">
                World Clock
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                Spin the globe or flip to a flat map. Hover cities for live times, click to pin them to
                your list, or switch to timezone view to see the world&apos;s legal time regions.
              </p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">Projection</Label>
                  <Tabs value={view} onValueChange={(v) => setView(v as GlobeView)}>
                    <TabsList>
                      <TabsTrigger value="globe">Globe</TabsTrigger>
                      <TabsTrigger value="map">Mercator</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">Show</Label>
                  <Tabs value={mode} onValueChange={(m) => setMode(m as GlobeMode)}>
                    <TabsList>
                      <TabsTrigger value="cities">Cities</TabsTrigger>
                      <TabsTrigger value="timezones">Timezones</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="w-full sm:w-64">
                  <Label className="mb-1.5 block text-xs text-muted-foreground">Add city</Label>
                  <Combobox
                    items={comboItems}
                    placeholder="Add a city…"
                    onValueChange={addZone}
                    resetOnSelect
                    inputClassName="h-8 py-1 px-3 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={use24h} onCheckedChange={setUse24h} /> 24-hour
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={showSeconds} onCheckedChange={setShowSeconds} /> Seconds
                </label>
              </div>
            </div>

            {/* Map + side panel */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
              <Card className="p-2 sm:p-4 overflow-hidden">
                <GlobeClock
                  zones={zones}
                  view={view}
                  mode={mode}
                  now={now}
                  use24h={use24h}
                  onToggleCity={toggleZone}
                />
                <p className="mt-2 px-2 text-xs text-muted-foreground">
                  {view === 'globe' ? 'Drag to spin the globe. ' : ''}
                  {mode === 'cities'
                    ? 'Hover a dot for the live local time; click to pin or unpin a city.'
                    : 'Hover a region for its UTC offset and current time.'}
                </p>
              </Card>

              {/* Side panel */}
              <Card className="p-4 space-y-3 self-start">
                <div className="relative">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter pinned cities"
                    className="pl-9"
                  />
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={visibleZones} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      {visibleZones.map((tz) => {
                        const t = now.tz(tz);
                        const hour = t.hour();
                        const isDay = hour >= 6 && hour < 18;
                        const city = findCityZone(tz);
                        const isHome = tz === localZone;
                        return (
                          <PinnedCityRow
                            key={tz}
                            tz={tz}
                            isHome={isHome}
                            isDay={isDay}
                            flag={city?.flag ?? '🌐'}
                            timeLabel={t.format(timeFmt)}
                            dateLabel={`${t.format('ddd, MMM D')} · GMT${t.format('Z').replace(':00', '')}`}
                            onRemove={() => removeZone(tz)}
                          />
                        );
                      })}
                      {visibleZones.length === 0 && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          {zones.length === 0 ? 'Click a dot on the map or add a city above.' : `No pinned cities match “${search}”.`}
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

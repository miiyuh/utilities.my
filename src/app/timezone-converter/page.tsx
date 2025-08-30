
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, PlusCircle, XCircle, Pin, Home, ChevronLeft, ChevronRight, RotateCcw, Globe, ChevronUp, ChevronDown, Copy as CopyIcon, Info, HelpCircle, Share2, Clock, Plane, Download as DownloadIcon, MapPin, List } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezonePlugin from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import minMax from 'dayjs/plugin/minMax';
import isBetween from 'dayjs/plugin/isBetween';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import arraySupport from 'dayjs/plugin/arraySupport';


import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TimezoneCombobox } from "@/components/ui/timezone-combobox";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(advancedFormat);
dayjs.extend(isoWeek);
dayjs.extend(minMax);
dayjs.extend(isBetween);
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(arraySupport);


const MAX_LOCATIONS = 10;
const SLOT_WIDTH = 36; 
const SLOT_SPACING = 1; // from space-x-px, treated as 1px for calculation
const SLOT_INTERVAL_MINUTES = 30; // half-hour slots
const NUM_NAV_DAYS_EACH_SIDE = 2;


interface Location {
  id: string;
  selectedTimezone: string;
  isPinned?: boolean;
  workStartHour?: number; // 0-23
  workEndHour?: number;   // 1-24
}

interface TimeSlotData {
  key: string;
  dateTime: dayjs.Dayjs; 
  hourNumber: number; // 0-23
  minuteNumber?: number; // 0 or 30
  isDayTime: boolean;
  isWeekend: boolean;
  isStartOfNewDay?: boolean; 
}

let locationIdCounter = 0;
const generateLocationId = () => `loc-${locationIdCounter++}-${Date.now()}`;

const isValidTz = (tzName: string): boolean => {
  if (!tzName) return false;
  try {
    dayjs().tz(tzName); 
    return true;
  } catch (e) {
    return false;
  }
};

export default function TimezoneConverterPage() {
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const scrollableContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h'); 
  const [adderTimezoneValue, setAdderTimezoneValue] = useState('');
  const [compactMode, setCompactMode] = useState(false);
  const [colorCoding, setColorCoding] = useState(true);
  // New converter UI states (must be declared before any early return)
  const [baseDate, setBaseDate] = useState<Date>(dayjs().toDate());
  const [timeString, setTimeString] = useState<string>(dayjs().format('HH:mm'));
  const [durationMin, setDurationMin] = useState<number>(60);
  const [nowTick, setNowTick] = useState(0); // triggers re-render to move 'Now' marker
  // Public-first UI states
  const [activeTab, setActiveTab] = useState<'convert'|'world'|'all'|'event'|'travel'>('convert');
  const [worldShowSeconds, setWorldShowSeconds] = useState(false);
  const [eventTitle, setEventTitle] = useState('My Event');
  const [eventDate, setEventDate] = useState<Date>(dayjs().toDate());
  const [eventTime, setEventTime] = useState<string>(dayjs().format('HH:mm'));
  const [eventTz, setEventTz] = useState<string>('UTC');
  const [eventDurationMin, setEventDurationMin] = useState<number>(60);
  const [travelDepartDate, setTravelDepartDate] = useState<Date>(dayjs().toDate());
  const [travelDepartTime, setTravelDepartTime] = useState<string>(dayjs().format('HH:mm'));
  const [travelDepartTz, setTravelDepartTz] = useState<string>('UTC');
  const [travelArriveTz, setTravelArriveTz] = useState<string>('America/New_York');
  const [travelDurationMin, setTravelDurationMin] = useState<number>(360);

  const [selectedRange, setSelectedRange] = useState<{ start: dayjs.Dayjs; end: dayjs.Dayjs }>({ start: dayjs().utc().startOf('hour'), end: dayjs().utc().startOf('hour').add(1, 'hour') });
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [dragAnchorSlotTime, setDragAnchorSlotTime] = useState<dayjs.Dayjs | null>(null); 
  const headerScrollableRef = useRef<HTMLDivElement | null>(null);
  // Overlay selection drag state
  const [dragMode, setDragMode] = useState<null | 'move' | 'resize-left' | 'resize-right'>(null);
  const dragActiveLocIdRef = useRef<string | null>(null);
  const dragStartClientXRef = useRef<number>(0);
  const dragStartRangeRef = useRef<{ start: dayjs.Dayjs; end: dayjs.Dayjs } | null>(null);
  const dragContainerRef = useRef<HTMLDivElement | null>(null);
  

  const initialLocations = (): Location[] => {
    const guessedTimezone = dayjs.tz.guess();
    const validGuessedTz = isValidTz(guessedTimezone) ? guessedTimezone : 'UTC';
    return [
      { id: generateLocationId(), selectedTimezone: validGuessedTz, isPinned: true, workStartHour: 9, workEndHour: 17 },
      { id: generateLocationId(), selectedTimezone: 'America/New_York', workStartHour: 9, workEndHour: 17 },
      { id: generateLocationId(), selectedTimezone: 'Europe/London', workStartHour: 9, workEndHour: 17 },
    ].filter(loc => loc && isValidTz(loc.selectedTimezone)).slice(0, MAX_LOCATIONS);
  };
  const [locations, setLocations] = useState<Location[]>(initialLocations());

  useEffect(() => {
    setIsMounted(true);
    const guessedTimezone = dayjs.tz.guess();
    const validGuessedTz = isValidTz(guessedTimezone) ? guessedTimezone : 'UTC';
    
    const now = dayjs().utc().startOf('hour');
    setSelectedRange({ start: now, end: now.add(1, 'hour') });

    setLocations(prevLocs => {
      let newLocs = prevLocs.map(loc => ({...loc, selectedTimezone: isValidTz(loc.selectedTimezone) ? loc.selectedTimezone : 'UTC'}));
      const pinnedIndex = newLocs.findIndex(loc => loc.isPinned);

      if (pinnedIndex !== -1) {
        newLocs[pinnedIndex].selectedTimezone = validGuessedTz;
      } else if (newLocs.length > 0) {
        newLocs[0].selectedTimezone = validGuessedTz;
        newLocs[0].isPinned = true;
      } else {
        newLocs = [{ id: generateLocationId(), selectedTimezone: validGuessedTz, isPinned: true }];
      }
      
      const defaultTimezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];
      let defaultIdx = 0;
      for (let i = 0; i < newLocs.length; i++) {
          if (newLocs.filter((l, idx) => l.selectedTimezone === newLocs[i].selectedTimezone && idx < i).length > 0) {
             while(defaultIdx < defaultTimezones.length && newLocs.some(l => l.selectedTimezone === defaultTimezones[defaultIdx])) {
                 defaultIdx++;
             }
             if (defaultIdx < defaultTimezones.length) {
                 newLocs[i].selectedTimezone = defaultTimezones[defaultIdx];
                 defaultIdx++;
             }
          }
      }
      while (newLocs.length < 3 && defaultIdx < defaultTimezones.length) {
          const tzToAdd = defaultTimezones[defaultIdx];
          if (tzToAdd && !newLocs.some(l => l.selectedTimezone === tzToAdd)) {
              newLocs.push({id: generateLocationId(), selectedTimezone: tzToAdd});
          }
          defaultIdx++;
      }
  // Ensure work hours defaults
  newLocs = newLocs.map(l => ({...l, workStartHour: l.workStartHour ?? 9, workEndHour: l.workEndHour ?? 17 }));
  return newLocs.filter(loc => loc && isValidTz(loc.selectedTimezone)).slice(0, MAX_LOCATIONS);
    });
  }, []);

  // Deep link: hydrate from query once after mount, then keep URL in sync (debounced)
  const hydratedRef = useRef(false);
  const urlUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serializeToQuery = useCallback(() => {
    try {
      const tzs = locations.map(l => encodeURIComponent(l.selectedTimezone)).join(',');
      const ws = locations.map(l => String(l.workStartHour ?? 9)).join(',');
      const we = locations.map(l => String(l.workEndHour ?? 17)).join(',');
      const pIdx = Math.max(0, locations.findIndex(l => l.isPinned));
      const fmt = timeFormat === '12h' ? '12' : '24';
      const b = dayjs(baseDate).format('YYYY-MM-DD');
      const t = timeString;
      const d = String(durationMin);
      const params = new URLSearchParams();
      if (tzs) params.set('tz', tzs);
      if (ws) params.set('ws', ws);
      if (we) params.set('we', we);
      params.set('p', String(pIdx));
      params.set('fmt', fmt);
      params.set('b', b);
      params.set('t', t);
      params.set('d', d);
      return `${window.location.pathname}?${params.toString()}`;
    } catch {
      return window.location.pathname;
    }
  }, [locations, timeFormat, baseDate, timeString, durationMin]);
  const hydrateFromQuery = useCallback(() => {
    try {
      const url = new URL(window.location.href);
      const q = url.searchParams;
      const tzStr = q.get('tz');
      const wsStr = q.get('ws');
      const weStr = q.get('we');
      const pStr = q.get('p');
      const fmt = q.get('fmt');
      const b = q.get('b');
      const t = q.get('t');
      const d = q.get('d');
      if (fmt === '12' || fmt === '24') setTimeFormat(fmt === '12' ? '12h' : '24h');
      if (b) {
        const parsed = dayjs(b, 'YYYY-MM-DD', true);
        if (parsed.isValid()) setBaseDate(parsed.toDate());
      }
      if (t && /^(\d{1,2}):(\d{2})$/.test(t)) setTimeString(t);
      if (d && !Number.isNaN(Number(d))) setDurationMin(Math.max(30, Math.min(24*60, Number(d))));

      if (tzStr) {
        const tzs = tzStr.split(',').map(s => decodeURIComponent(s)).filter(isValidTz).slice(0, MAX_LOCATIONS);
        if (tzs.length) {
          const wsArr = (wsStr ? wsStr.split(',').map(n => Number(n)) : []).concat([]);
          const weArr = (weStr ? weStr.split(',').map(n => Number(n)) : []).concat([]);
          let newLocs: Location[] = tzs.map((tz, i) => ({
            id: generateLocationId(),
            selectedTimezone: tz,
            isPinned: false,
            workStartHour: Number.isFinite(wsArr[i]) ? wsArr[i] : 9,
            workEndHour: Number.isFinite(weArr[i]) ? weArr[i] : 17,
          }));
          let pIdx = Number(pStr);
          if (!Number.isFinite(pIdx) || pIdx < 0 || pIdx >= newLocs.length) pIdx = 0;
          newLocs = newLocs.map((l, i) => ({...l, isPinned: i === pIdx}));
          setLocations(newLocs);
        }
      }
    } catch {}
  }, [setLocations]);
  useEffect(() => {
    if (!isMounted || hydratedRef.current) return;
    hydrateFromQuery();
    hydratedRef.current = true;
  }, [isMounted, hydrateFromQuery]);
  useEffect(() => {
    if (!isMounted) return;
    if (urlUpdateTimer.current) clearTimeout(urlUpdateTimer.current);
    urlUpdateTimer.current = setTimeout(() => {
      const url = serializeToQuery();
      try { window.history.replaceState(null, '', url); } catch {}
    }, 250);
    return () => { if (urlUpdateTimer.current) clearTimeout(urlUpdateTimer.current); };
  }, [serializeToQuery, isMounted]);

  // Share link and summary for conversion-first UI
  const copyShareLink = async () => {
    try {
      const url = serializeToQuery();
      await navigator.clipboard.writeText(window.location.origin + url);
      toast({ title: 'Link copied', description: 'Shareable link copied to clipboard.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Could not copy link.', variant: 'destructive' });
    }
  };
  const copyConvertedSummary = async () => {
    try {
      const tzPrimary = getPrimaryTimezone();
      const primaryLocal = buildPrimaryLocal();
      const primaryUtc = primaryLocal.utc();
      const hrsFmt = timeFormat === '12h' ? 'h:mm A' : 'HH:mm';
      const lines: string[] = [];
      lines.push(`Base (${tzPrimary}): ${primaryLocal.format(hrsFmt)} — ${primaryLocal.format('ddd, MMM D, YYYY')}`);
      for (const loc of locations) {
        const local = primaryUtc.tz(loc.selectedTimezone);
        lines.push(`${loc.selectedTimezone}: ${local.format(hrsFmt)} — ${local.format('ddd, MMM D, YYYY')}`);
      }
      await navigator.clipboard.writeText(lines.join('\n'));
      toast({ title: 'Summary copied', description: 'Converted times copied to clipboard.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Could not copy summary.', variant: 'destructive' });
    }
  };

  // Heartbeat to update 'Now' marker and live clocks.
  // If showing seconds, align to the next second and tick every second; otherwise every 30s.
  useEffect(() => {
    let intervalId: number | undefined;
    let timeoutId: number | undefined;
    if (worldShowSeconds) {
      const schedule = () => {
        const ms = Date.now();
        const delay = 1000 - (ms % 1000);
        timeoutId = window.setTimeout(() => {
          setNowTick(t => t + 1);
          intervalId = window.setInterval(() => setNowTick(t => t + 1), 1000);
        }, delay);
      };
      schedule();
    } else {
      intervalId = window.setInterval(() => setNowTick(t => t + 1), 30000);
    }
    return () => {
      if (intervalId !== undefined) window.clearInterval(intervalId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [worldShowSeconds]);

 useEffect(() => {
    if (!isMounted || !selectedRange || !selectedRange.start.isValid() || locations.length === 0 || isDraggingSelection) return;
    
    setIsProgrammaticScroll(true);
    const effectiveSlotWidth = SLOT_WIDTH + SLOT_SPACING;

    locations.forEach(loc => {
      if (loc && loc.selectedTimezone && isValidTz(loc.selectedTimezone)) {
        const container = scrollableContainerRefs.current[loc.id];
        if (container) {
          const localSelectionStart = selectedRange.start.tz(loc.selectedTimezone);
          const targetSlotIndex = localSelectionStart.hour() * 2 + (localSelectionStart.minute() >= 30 ? 1 : 0);
          const desiredScrollPosition = targetSlotIndex * effectiveSlotWidth;
          
          if (container.scrollLeft !== desiredScrollPosition) {
            container.scrollLeft = desiredScrollPosition;
          }
        }
      }
    });

    // Sync header scroller as well
    if (headerScrollableRef.current) {
      const localSelectionStart = selectedRange.start.tz(locations[0]?.selectedTimezone || 'UTC');
      const targetSlotIndex = localSelectionStart.hour() * 2 + (localSelectionStart.minute() >= 30 ? 1 : 0);
      const desiredScrollPosition = targetSlotIndex * effectiveSlotWidth;
      if (headerScrollableRef.current.scrollLeft !== desiredScrollPosition) {
        headerScrollableRef.current.scrollLeft = desiredScrollPosition;
      }
    }

    const timer = setTimeout(() => setIsProgrammaticScroll(false), 200); 
    return () => clearTimeout(timer);
  }, [selectedRange, locations, isMounted, isDraggingSelection]);


  const handleGlobalDateChange = (date: Date | undefined) => {
    if (date && selectedRange && selectedRange.start.isValid() && dayjs(date).isValid()) {
      const newDatePart = dayjs(date); 
      const oldStartUTC = selectedRange.start;
      const duration = dayjs.duration(selectedRange.end.diff(selectedRange.start));

      const newStartDateUTC = newDatePart
          .hour(oldStartUTC.hour())
          .minute(oldStartUTC.minute())
          .second(oldStartUTC.second())
          .millisecond(oldStartUTC.millisecond())
          .utc();

      const newEndDateUTC = newStartDateUTC.add(duration);
      
      setSelectedRange({ start: newStartDateUTC, end: newEndDateUTC });
    }
  };

  const handleGoToToday = () => {
    const now = dayjs().utc().startOf('hour');
    setSelectedRange({ start: now, end: now.add(1, 'hour') });
    toast({title: "View Reset", description: "Showing current time."});
  };
  
  const handlePinLocation = (idToPin: string) => {
    setLocations(prevLocs => {
        const newLocs = prevLocs.map(loc => ({
            ...loc,
            isPinned: loc.id === idToPin,
        }));
        const pinnedItem = newLocs.find(loc => loc.isPinned);
        if (pinnedItem) {
            return [pinnedItem, ...newLocs.filter(loc => !loc.isPinned)];
        }
        return newLocs;
    });
    const newPinnedTz = locations.find(l => l.id === idToPin)?.selectedTimezone;
    if(newPinnedTz) toast({ title: "Primary Location Set", description: `${newPinnedTz.replace(/_/g, ' ')} is now primary.`});
  };

  const handleAddTimezoneFromSearch = () => {
    if (!adderTimezoneValue || !isValidTz(adderTimezoneValue)) {
      toast({ title: 'Invalid Timezone', description: 'Please select a valid timezone to add.', variant: 'destructive'});
      return;
    }
    if (locations.length >= MAX_LOCATIONS) {
      toast({ title: 'Location Limit Reached', description: `You can add up to ${MAX_LOCATIONS} locations.`, variant: 'default' });
      return;
    }
    if (locations.some(loc => loc.selectedTimezone === adderTimezoneValue)) {
      toast({ title: 'Timezone Exists', description: `${adderTimezoneValue.replace(/_/g, ' ')} is already in the list.`, variant: 'default'});
      setAdderTimezoneValue(''); 
      return;
    }
    
    const newLocationId = generateLocationId();
    setLocations(prev => [...prev, { id: newLocationId, selectedTimezone: adderTimezoneValue }]);
    toast({ title: 'Timezone Added', description: `${adderTimezoneValue.replace(/_/g, ' ')} has been added.`});
    setAdderTimezoneValue(''); 
  };

  const handleRemoveLocation = (idToRemove: string) => {
    if (locations.length <= 1) {
      toast({ title: 'Cannot Remove', description: 'At least one location is required.', variant: 'default' });
      return;
    }
    const removedIsPinned = locations.find(l => l.id === idToRemove)?.isPinned;
    setLocations(prev => {
      const newLocs = prev.filter(l => l.id !== idToRemove);
      if (removedIsPinned && newLocs.length > 0) {
        newLocs[0].isPinned = true; 
      }
      if (scrollableContainerRefs.current[idToRemove]) {
        delete scrollableContainerRefs.current[idToRemove];
      }
      return newLocs;
    });
  };

  const handleLocationTimezoneChange = (idToUpdate: string, newTimezone: string) => {
    if (isValidTz(newTimezone)) {
      setLocations(prev => prev.map(l => l.id === idToUpdate ? { ...l, selectedTimezone: newTimezone } : l));
    } else {
      toast({title: "Invalid Timezone", description: `Could not apply timezone: ${newTimezone}`, variant: "destructive"})
    }
  };

  // Synchronise horizontal scroll across time strips; debounced to avoid feedback loop.
  let scrollSyncTimer: ReturnType<typeof setTimeout> | null = null;
  const handleStripScroll = (scrolledLocId: string, event: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScroll || isDraggingSelection) return;
    const scrollLeft = event.currentTarget.scrollLeft;
    if (scrollSyncTimer) clearTimeout(scrollSyncTimer);
    setIsProgrammaticScroll(true);
    Object.entries(scrollableContainerRefs.current).forEach(([locId, container]) => {
      if (locId !== scrolledLocId && container && container.scrollLeft !== scrollLeft) {
        container.scrollLeft = scrollLeft;
      }
    });
    // Sync header scroller
    if (headerScrollableRef.current && headerScrollableRef.current.scrollLeft !== scrollLeft) {
      headerScrollableRef.current.scrollLeft = scrollLeft;
    }
    scrollSyncTimer = setTimeout(() => setIsProgrammaticScroll(false), 120);
  };

  // Header timeline scroll broadcast
  const handleHeaderScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScroll) return;
    const scrollLeft = e.currentTarget.scrollLeft;
    if (scrollSyncTimer) clearTimeout(scrollSyncTimer);
    setIsProgrammaticScroll(true);
    Object.values(scrollableContainerRefs.current).forEach(container => {
      if (container && container.scrollLeft !== scrollLeft) {
        container.scrollLeft = scrollLeft;
      }
    });
    scrollSyncTimer = setTimeout(() => setIsProgrammaticScroll(false), 120);
  };

  // Overlay drag/resize utilities
  const pxPerMinute = (SLOT_WIDTH + SLOT_SPACING) / SLOT_INTERVAL_MINUTES;
  const snapToInterval = (mins: number) => Math.round(mins / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;
  const getMinutesFromX = (container: HTMLDivElement, clientX: number) => {
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left + container.scrollLeft;
    return Math.max(0, Math.min(24 * 60, x / pxPerMinute));
  };
  const startOverlayDrag = (locId: string, mode: 'move' | 'resize-left' | 'resize-right', container: HTMLDivElement, clientX: number) => {
    setDragMode(mode);
    dragActiveLocIdRef.current = locId;
    dragStartClientXRef.current = clientX;
    dragStartRangeRef.current = { start: selectedRange.start, end: selectedRange.end };
    dragContainerRef.current = container;
    setIsDraggingSelection(true);
  };
  const handleOverlayMouseDown = (locId: string, mode: 'move' | 'resize-left' | 'resize-right', e: React.MouseEvent<HTMLDivElement>) => {
    const container = scrollableContainerRefs.current[locId];
    if (!container) return;
    e.preventDefault();
    startOverlayDrag(locId, mode, container, e.clientX);
  };
  const handleContainerClickSet = (locId: string, e: React.MouseEvent<HTMLDivElement>) => {
    // Click background to reposition start keeping current duration
    const container = scrollableContainerRefs.current[locId];
    if (!container) return;
    if (dragMode) return; // ignore if dragging
    const mins = getMinutesFromX(container, e.clientX);
    const snapped = snapToInterval(mins);
    const tz = locations.find(l => l.id === locId)?.selectedTimezone || 'UTC';
    const dayStartLocal = selectedRange.start.tz(tz).startOf('day');
    const newLocalStart = dayStartLocal.add(snapped, 'minute');
    const durationMin = dayjs.duration(selectedRange.end.diff(selectedRange.start)).asMinutes();
    const newStartUTC = newLocalStart.utc();
    const newEndUTC = newStartUTC.add(durationMin, 'minute');
    setSelectedRange({ start: newStartUTC, end: newEndUTC });
  };
  const onGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!dragMode || !dragContainerRef.current || !dragStartRangeRef.current || !dragActiveLocIdRef.current) return;
    const container = dragContainerRef.current;
    const tz = locations.find(l => l.id === dragActiveLocIdRef.current)?.selectedTimezone || 'UTC';
    const baseStartLocal = dragStartRangeRef.current.start.tz(tz);
    const baseEndLocal = dragStartRangeRef.current.end.tz(tz);
    const baseDurationMin = baseEndLocal.diff(baseStartLocal, 'minute');
    const startMinsAtDown = baseStartLocal.diff(baseStartLocal.startOf('day'), 'minute');
    const endMinsAtDown = baseEndLocal.diff(baseEndLocal.startOf('day'), 'minute');
    const deltaPx = e.clientX - dragStartClientXRef.current;
    const deltaMinRaw = deltaPx / pxPerMinute;
    const deltaMin = snapToInterval(deltaMinRaw);

    if (dragMode === 'move') {
      let newStartLocal = baseStartLocal.add(deltaMin, 'minute');
      let newEndLocal = newStartLocal.add(baseDurationMin, 'minute');
      setSelectedRange({ start: newStartLocal.utc(), end: newEndLocal.utc() });
    } else if (dragMode === 'resize-left') {
      let newStartLocal = baseStartLocal.add(deltaMin, 'minute');
      // Ensure at least one slot
      if (newStartLocal.isSameOrAfter(baseEndLocal.subtract(SLOT_INTERVAL_MINUTES, 'minute'))) {
        newStartLocal = baseEndLocal.subtract(SLOT_INTERVAL_MINUTES, 'minute');
      }
      setSelectedRange({ start: newStartLocal.utc(), end: baseEndLocal.utc() });
    } else if (dragMode === 'resize-right') {
      let newEndLocal = baseEndLocal.add(deltaMin, 'minute');
      if (newEndLocal.isSameOrBefore(baseStartLocal.add(SLOT_INTERVAL_MINUTES, 'minute'))) {
        newEndLocal = baseStartLocal.add(SLOT_INTERVAL_MINUTES, 'minute');
      }
      setSelectedRange({ start: baseStartLocal.utc(), end: newEndLocal.utc() });
    }
  }, [dragMode, locations]);
  const onGlobalMouseUp = useCallback(() => {
    if (dragMode) {
      setDragMode(null);
      setIsDraggingSelection(false);
      dragActiveLocIdRef.current = null;
      dragContainerRef.current = null;
      dragStartRangeRef.current = null;
    }
  }, [dragMode]);

  useEffect(() => {
    document.addEventListener('mousemove', onGlobalMouseMove);
    document.addEventListener('mouseup', onGlobalMouseUp);
    document.addEventListener('mouseleave', onGlobalMouseUp);
    return () => {
      document.removeEventListener('mousemove', onGlobalMouseMove);
      document.removeEventListener('mouseup', onGlobalMouseUp);
      document.removeEventListener('mouseleave', onGlobalMouseUp);
    };
  }, [onGlobalMouseMove, onGlobalMouseUp]);

  const handleTimeStripArrowScroll = (locId: string, direction: 'prev' | 'next') => {
    const container = scrollableContainerRefs.current[locId];
    if (container) {
      const scrollAmount = container.clientWidth * 0.50 * (direction === 'prev' ? -1 : 1);
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getNowOffsetPx = (tz: string) => {
    try {
      const local = dayjs().tz(tz);
      const minutes = local.diff(local.startOf('day'), 'minute');
      return minutes * pxPerMinute;
    } catch {
      return 0;
    }
  };
  const formatGmtOffset = (tz: string) => {
    try {
      const offsetMin = dayjs().tz(tz).utcOffset();
      const sign = offsetMin >= 0 ? '+' : '-';
      const abs = Math.abs(offsetMin);
      const h = Math.floor(abs / 60);
      const m = abs % 60;
      return `GMT${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`;
    } catch {
      return 'GMT±0';
    }
  };

  const getSelectionHours = () => {
    if (!selectedRange || !selectedRange.start.isValid() || !selectedRange.end.isValid()) return 1;
    const hrs = dayjs.duration(selectedRange.end.diff(selectedRange.start)).asHours();
    return Math.max(1, Math.round(hrs));
  };
  const setSelectionHours = (newLen: number) => {
    const len = Math.max(1, Math.min(24, Math.round(newLen)));
    const startUTC = selectedRange.start;
    setSelectedRange({ start: startUTC, end: startUTC.add(len, 'hour') });
  };
  const shiftSelection = (deltaHours: number) => {
    const startUTC = selectedRange.start.add(deltaHours, 'hour');
    const endUTC = selectedRange.end.add(deltaHours, 'hour');
    setSelectedRange({ start: startUTC, end: endUTC });
  };

  const moveLocationUp = (id: string) => {
    setLocations(prev => {
      const idx = prev.findIndex(l => l.id === id);
      if (idx <= 0) return prev;
      const copy = [...prev];
      [copy[idx-1], copy[idx]] = [copy[idx], copy[idx-1]];
      return copy;
    });
  };
  const moveLocationDown = (id: string) => {
    setLocations(prev => {
      const idx = prev.findIndex(l => l.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const copy = [...prev];
      [copy[idx+1], copy[idx]] = [copy[idx], copy[idx+1]];
      return copy;
    });
  };

  const copySummary = async () => {
    try {
      const lines: string[] = [];
      const hrsFmt = timeFormat === '12h' ? 'h:mm A' : 'HH:mm';
      lines.push(`Timezone Converter — ${selectedRange.start.utc().format('YYYY-MM-DD HH:mm')}Z to ${selectedRange.end.utc().format('YYYY-MM-DD HH:mm')}Z`);
      for (const loc of locations) {
        const startLocal = selectedRange.start.tz(loc.selectedTimezone);
        const endLocal = selectedRange.end.tz(loc.selectedTimezone).subtract(1, 'minute');
        const dateDisplayFormat = 'ddd, MMM D, YYYY';
        const dateStr = startLocal.isSame(endLocal, 'day')
          ? startLocal.format(dateDisplayFormat)
          : `${startLocal.format(dateDisplayFormat)} - ${endLocal.format(dateDisplayFormat)}`;
        lines.push(`${loc.selectedTimezone}: ${startLocal.format(hrsFmt)} – ${endLocal.format(hrsFmt)} (${dateStr})`);
      }
      await navigator.clipboard.writeText(lines.join('\n'));
      toast({ title: 'Summary Copied', description: 'Selection summary copied to clipboard.' });
    } catch {
      toast({ title: 'Copy Failed', description: 'Could not copy summary.', variant: 'destructive' });
    }
  };

  // Calendar export helpers
  const getPrimaryTimezone = () => locations.find(l => l.isPinned)?.selectedTimezone || locations[0]?.selectedTimezone || 'UTC';
  const formatForICS = (d: dayjs.Dayjs) => d.utc().format('YYYYMMDD[T]HHmmss[Z]');
  const buildSummaryLines = () => {
    const lines: string[] = [];
    const hrsFmt = timeFormat === '12h' ? 'h:mm A' : 'HH:mm';
    lines.push(`UTC: ${selectedRange.start.utc().format('YYYY-MM-DD HH:mm')}Z – ${selectedRange.end.utc().format('YYYY-MM-DD HH:mm')}Z`);
    for (const loc of locations) {
      const startLocal = selectedRange.start.tz(loc.selectedTimezone);
      const endLocal = selectedRange.end.tz(loc.selectedTimezone).subtract(1, 'minute');
      lines.push(`${loc.selectedTimezone}: ${startLocal.format(hrsFmt)} – ${endLocal.format(hrsFmt)} (${startLocal.format('ddd, MMM D')}${startLocal.isSame(endLocal, 'day') ? '' : ' - ' + endLocal.format('ddd, MMM D')})`);
    }
    return lines.join('\n');
  };
  const downloadICS = () => {
    try {
      const dtStamp = dayjs().utc();
      const uid = `${dtStamp.valueOf()}@utilities.my`;
      const dtStart = formatForICS(selectedRange.start);
      const dtEnd = formatForICS(selectedRange.end);
      const summary = 'Timezone Converter';
      const description = buildSummaryLines().replace(/\n/g, '\\n');
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//utilities.my//Timezone Converter//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatForICS(dtStamp)}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'timezone-event.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'ICS Downloaded', description: 'Calendar file saved.' });
    } catch {
      toast({ title: 'Export Failed', description: 'Could not generate ICS.', variant: 'destructive' });
    }
  };
  const openGoogleCalendar = () => {
    try {
      const text = encodeURIComponent('Timezone Converter');
      const dates = `${selectedRange.start.utc().format('YYYYMMDD[T]HHmmss[Z]')}/${selectedRange.end.utc().format('YYYYMMDD[T]HHmmss[Z]')}`;
      const details = encodeURIComponent(buildSummaryLines());
      const ctz = encodeURIComponent(getPrimaryTimezone());
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&ctz=${ctz}`;
      window.open(url, '_blank');
    } catch {
      toast({ title: 'Open Failed', description: 'Could not open Google Calendar.', variant: 'destructive' });
    }
  };
  const openGoogleCalendarForRange = (start: dayjs.Dayjs, end: dayjs.Dayjs) => {
    try {
    const title = (typeof eventTitle === 'string' && eventTitle.trim().length > 0) ? eventTitle.trim() : 'Timezone Converter';
    const text = encodeURIComponent(title);
      const dates = `${start.utc().format('YYYYMMDD[T]HHmmss[Z]')}/${end.utc().format('YYYYMMDD[T]HHmmss[Z]')}`;
      const details = encodeURIComponent(buildSummaryLines());
      const ctz = encodeURIComponent(getPrimaryTimezone());
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&ctz=${ctz}`;
      window.open(url, '_blank');
    } catch {
      toast({ title: 'Open Failed', description: 'Could not open Google Calendar.', variant: 'destructive' });
    }
  };
  const downloadICSForRange = (start: dayjs.Dayjs, end: dayjs.Dayjs) => {
    try {
      const dtStamp = dayjs().utc();
      const uid = `${dtStamp.valueOf()}@utilities.my`;
      const dtStart = formatForICS(start);
      const dtEnd = formatForICS(end);
    const summary = (typeof eventTitle === 'string' && eventTitle.trim().length > 0) ? eventTitle.trim() : 'Scheduled Events';
      const description = buildSummaryLines().replace(/\n/g, '\\n');
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//utilities.my//Scheduled Events//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatForICS(dtStamp)}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'timezone-event.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'ICS Downloaded', description: 'Calendar file saved.' });
    } catch {
      toast({ title: 'Export Failed', description: 'Could not generate ICS.', variant: 'destructive' });
    }
  };
  
  const generateTimeSlots = useCallback((locationTimezone: string, displayDateUTC: dayjs.Dayjs): TimeSlotData[] => {
    if (!isMounted || !isValidTz(locationTimezone) || !displayDateUTC.isValid()) return [];

    const slots: TimeSlotData[] = [];
    const localDisplayDayStart = displayDateUTC.tz(locationTimezone).startOf('day');
    const DAY_START_HOUR = 7; 
    const DAY_END_HOUR = 19; 

    for (let i = 0; i < (24 * (60 / SLOT_INTERVAL_MINUTES)); i++) { 
      const slotTimeInLocationTZ = localDisplayDayStart.add(i * SLOT_INTERVAL_MINUTES, 'minute');
      const hourOfDay = slotTimeInLocationTZ.hour();
      const minuteOfHour = slotTimeInLocationTZ.minute();
      const dayOfWeek = slotTimeInLocationTZ.day(); 
      
      const isDay = hourOfDay >= DAY_START_HOUR && hourOfDay < DAY_END_HOUR;
      const isWknd = dayOfWeek === 0 || dayOfWeek === 6; 

      slots.push({
        key: `${locationTimezone}-${slotTimeInLocationTZ.toISOString()}-${i}`,
        dateTime: slotTimeInLocationTZ, 
        hourNumber: hourOfDay,
        minuteNumber: minuteOfHour,
        isDayTime: isDay,
        isWeekend: isWknd,
      });
    }
    return slots;
  }, [isMounted]); 

  const dateNavItems = React.useMemo(() => {
    if (!selectedRange || !selectedRange.start.isValid()) return [];
    const currentDayForNav = selectedRange.start.startOf('day'); 
    const items = [];
    for (let i = -NUM_NAV_DAYS_EACH_SIDE; i <= NUM_NAV_DAYS_EACH_SIDE; i++) {
      const day = currentDayForNav.add(i, 'day');
      items.push({
        date: day,
        label: day.format('D'),
        isCurrentSelected: day.isSame(currentDayForNav, 'day'),
      });
    }
    return items;
  }, [selectedRange]);
  
  if (!isMounted || !selectedRange || !selectedRange.start.isValid()) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:p-6">
        <p>Loading World Time View...</p>
      </div>
    );
  }

  const referenceDateForCalendar = selectedRange.start.toDate();

  // NEW CONVERTER STATES/HELPERS
  const parseTimeString = (s: string) => {
    const m = s.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return { h: 0, min: 0 };
    let h = Math.max(0, Math.min(23, parseInt(m[1], 10)));
    let min = Math.max(0, Math.min(59, parseInt(m[2], 10)));
    return { h, min };
  };
  const buildPrimaryLocal = () => {
    const tz = getPrimaryTimezone();
    const d = dayjs(baseDate);
    const { h, min } = parseTimeString(timeString);
    const dateStr = d.format('YYYY-MM-DD');
    const timeStr = `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
    return dayjs.tz(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm', tz);
  };
  const classifyQuality = (local: dayjs.Dayjs, loc: Location) => {
    const ws = loc.workStartHour ?? 9;
    const we = loc.workEndHour ?? 17;
    const hr = local.hour();
    if (hr >= ws && hr < we) return { label: 'Good', color: 'text-emerald-600 dark:text-emerald-400' };
    if (hr >= (ws-1) && hr < (we+1)) return { label: 'Okay', color: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Bad', color: 'text-rose-600 dark:text-rose-400' };
  };
  const computeSuggestions = () => {
    const tzPrimary = getPrimaryTimezone();
    const baseLocal = buildPrimaryLocal();
    const startWindow = baseLocal.startOf('day');
    const endWindow = startWindow.add(3, 'day');
    const step = SLOT_INTERVAL_MINUTES;
    type Sug = { start: dayjs.Dayjs; end: dayjs.Dayjs; score: number };
    const sugs: Sug[] = [];
    for (let t = startWindow; t.isBefore(endWindow); t = t.add(step, 'minute')) {
      const end = t.add(durationMin, 'minute');
      let score = 0;
      for (const loc of locations) {
        const localStart = t.tz(loc.selectedTimezone);
        const ws = loc.workStartHour ?? 9;
        const we = loc.workEndHour ?? 17;
        const inWork = localStart.hour() >= ws && localStart.hour() < we;
        const shoulder = localStart.hour() >= (ws-1) && localStart.hour() < (we+1);
        score += inWork ? 2 : (shoulder ? 1 : 0);
      }
      sugs.push({ start: t, end, score });
    }
    sugs.sort((a,b) => b.score - a.score || a.start.valueOf() - b.start.valueOf());
    return sugs.slice(0, 10);
  };

  // Helpers for public-first tabs
  const buildLocalFrom = (date: Date, timeStr: string, tz: string) => {
    const d = dayjs(date);
    const m = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    const hh = m ? Math.min(23, Math.max(0, Number(m[1]))) : 0;
    const mm = m ? Math.min(59, Math.max(0, Number(m[2]))) : 0;
    return dayjs.tz(`${d.format('YYYY-MM-DD')} ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`, 'YYYY-MM-DD HH:mm', tz);
  };
  const fmtHrs = (d: dayjs.Dayjs) => d.format(timeFormat === '12h' ? 'h:mm A' : 'HH:mm');

  // Early return: Public-first UI
  {
    const tzPrimary = getPrimaryTimezone();
    const primaryLocal = buildPrimaryLocal();
    const primaryUtc = primaryLocal.utc();
    const conversions = locations.map(loc => ({ loc, local: primaryUtc.tz(loc.selectedTimezone) }));
    const hrsFmt = timeFormat === '12h' ? 'h:mm A' : 'HH:mm';
    const worldNow = (tz: string) => dayjs().tz(tz);
    const eventStartLocal = buildLocalFrom(eventDate, eventTime, eventTz || tzPrimary);
    const eventEndLocal = eventStartLocal.add(eventDurationMin, 'minute');
    const travelDepartLocal = buildLocalFrom(travelDepartDate, travelDepartTime, travelDepartTz || tzPrimary);
    const travelArriveLocal = travelDepartLocal.tz('UTC').add(travelDurationMin, 'minute').tz(travelArriveTz || tzPrimary);

    return (
      <>
        <Sidebar collapsible="icon" variant="sidebar" side="left">
          <SidebarContent />
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="lg:hidden" />
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold font-headline">Timezone Converter</h1>
              </div>
            </div>
            <ThemeToggleButton />
          </header>
          <div className="flex flex-1 flex-col p-4 lg:p-8">
            <div className="w-full max-w-7xl mx-auto space-y-6">
              <div className="mb-8">
                <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Timezone Converter</h1>
                <p className="text-lg text-muted-foreground">Everyday tools for converting times, checking world clocks, planning events, and travel.</p>
              </div>
              {/* Favorites (public friendly) */}
              <Card className="minimal-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="font-headline text-lg tracking-tight">Favorites</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button aria-label="Favorites help" className="text-muted-foreground hover:text-foreground">
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Pin a timezone to make it primary. Add more to compare across tabs.</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Switch id="time-format-toggle2" checked={timeFormat === '12h'} onCheckedChange={(c)=> setTimeFormat(c?'12h':'24h')} />
                      <Label htmlFor="time-format-toggle2" className="text-xs">12-hour</Label>
                    </div>
                    <div className="flex items-center gap-2 flex-grow min-w-[240px]">
                      <TimezoneCombobox value={adderTimezoneValue} onValueChange={setAdderTimezoneValue} placeholder="Add timezone..." className="h-9 text-sm flex-grow" />
                      <Button size="sm" onClick={handleAddTimezoneFromSearch}>Add</Button>
                    </div>
                  </div>
                  <div className="divide-y rounded-md border">
                    {locations.map(loc => (
                      <div key={loc.id} className="flex items-center justify-between gap-3 p-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Button variant="ghost" size="icon" onClick={() => handlePinLocation(loc.id)} title="Make primary" className={cn("h-7 w-7", loc.isPinned? 'text-primary':'text-muted-foreground hover:text-primary')}>
                            {loc.isPinned ? <Home className="h-4 w-4"/> : <Pin className="h-4 w-4"/>}
                          </Button>
                          <TimezoneCombobox value={loc.selectedTimezone} onValueChange={(tz)=> handleLocationTimezoneChange(loc.id, tz)} className="h-8 text-xs w-[220px]" />
                          <span className="text-[10px] text-muted-foreground truncate">{loc.selectedTimezone.replace(/_/g,' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveLocation(loc.id)} disabled={locations.length<=1} className="text-muted-foreground hover:text-destructive h-7 w-7"><XCircle className="h-4 w-4"/></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>


              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v)=> setActiveTab(v as any)}>
                <TabsList>
                  <TabsTrigger value="convert" className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5"/> Quick Convert</TabsTrigger>
                  <TabsTrigger value="world" className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5"/> World Clock</TabsTrigger>
                  <TabsTrigger value="all" className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5"/> All Timezones</TabsTrigger>
                  <TabsTrigger value="event" className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5"/> Event & Countdown</TabsTrigger>
                  <TabsTrigger value="travel" className="flex items-center gap-1.5"><Plane className="h-3.5 w-3.5"/> Travel</TabsTrigger>
                </TabsList>

                <TabsContent value="convert">
                  <Card className="minimal-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="font-headline text-lg tracking-tight">Quick Convert</CardTitle>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button aria-label="Quick Convert help" className="text-muted-foreground hover:text-foreground">
                                <HelpCircle className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Set a date/time in your primary timezone. We show the same instant everywhere.</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-2 p-2 border rounded-md bg-background">
                        <div className="flex items-center flex-wrap gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm"><CalendarIcon className="h-4 w-4 mr-1"/> {dayjs(baseDate).format('MMM D, YYYY')}</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar mode="single" selected={baseDate} onSelect={(d)=> d && setBaseDate(d)} />
                            </PopoverContent>
                          </Popover>
                          <input value={timeString} onChange={(e)=> setTimeString(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm w-[88px] flex-none" placeholder="HH:mm" />
                          <span className="text-xs text-muted-foreground">in</span>
                          <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">{tzPrimary.replace(/_/g,' ')}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 px-2" title="Set to current local time" onClick={()=> { setBaseDate(new Date()); setTimeString(dayjs().format('HH:mm')); }}>
                                  <Clock className="h-3.5 w-3.5 mr-1"/> Now
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Use the current local time</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center gap-2 md:justify-self-end">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={copyConvertedSummary}>
                                  <CopyIcon className="h-3.5 w-3.5 mr-1"/> Copy summary
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy all conversions</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={copyShareLink}>
                                  <Share2 className="h-3.5 w-3.5 mr-1"/> Share link
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Share this view</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <Alert className="p-2 py-1.5 rounded-md bg-muted/40 border-muted/60 text-muted-foreground">
                        <p className="text-[11px] leading-snug flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 opacity-70" aria-hidden />
                          <span><span className="font-medium">Tip:</span> Your primary timezone is the one with the home pin. Change it in Favorites above.</span>
                        </p>
                      </Alert>
                      <div className="rounded-md border overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                          {conversions.map(({loc, local}) => {
                            const dayDiff = local.startOf('day').diff(primaryLocal.startOf('day'), 'day');
                            const dayBadge = dayDiff === 0 ? null : (
                              <Badge className={cn("ml-1", dayDiff>0? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300')}>
                                {dayDiff === 1 ? 'Tomorrow' : dayDiff === -1 ? 'Yesterday' : (dayDiff>0? `+${dayDiff}d` : `${dayDiff}d`)}
                              </Badge>
                            );
                            const city = loc.selectedTimezone.split('/').pop()?.replace(/_/g,' ') ?? loc.selectedTimezone.replace(/_/g,' ');
                            return (
                              <div key={`conv-${loc.id}`} className="p-2">
                                <div className="text-2xl font-semibold tracking-tight">{local.format(hrsFmt)}</div>
                                <div className="text-[11px] text-muted-foreground truncate">{city} • {local.format('ddd, MMM D')} {dayBadge}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="all">
                  <Card className="minimal-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="font-headline text-lg tracking-tight">All Timezones</CardTitle>
                        <Badge variant="outline" className="flex items-center gap-1 text-emerald-600 border-emerald-300/50 dark:text-emerald-300">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                          Live
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button aria-label="All Timezones help" className="text-muted-foreground hover:text-foreground">
                                <HelpCircle className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Live times for all supported timezones with country flags.</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Switch id="all-show-seconds" checked={worldShowSeconds} onCheckedChange={setWorldShowSeconds} />
                          <Label htmlFor="all-show-seconds" className="text-xs">Show seconds</Label>
                        </div>
                      </div>
                      <div className="rounded-md border overflow-hidden">
                        {(() => {
                          // Get all supported timezones
                          const allTimezones = Intl.supportedValuesOf('timeZone');
                          
                          // Comprehensive mapping of timezones to country codes
                          const timezoneToCountryCode: Record<string, string> = {
                            // Africa
                            'Africa/Abidjan': 'ci',
                            'Africa/Accra': 'gh',
                            'Africa/Addis_Ababa': 'et',
                            'Africa/Algiers': 'dz',
                            'Africa/Asmara': 'er',
                            'Africa/Bamako': 'ml',
                            'Africa/Bangui': 'cf',
                            'Africa/Banjul': 'gm',
                            'Africa/Bissau': 'gw',
                            'Africa/Blantyre': 'mw',
                            'Africa/Brazzaville': 'cg',
                            'Africa/Bujumbura': 'bi',
                            'Africa/Cairo': 'eg',
                            'Africa/Casablanca': 'ma',
                            'Africa/Ceuta': 'es',
                            'Africa/Conakry': 'gn',
                            'Africa/Dakar': 'sn',
                            'Africa/Dar_es_Salaam': 'tz',
                            'Africa/Djibouti': 'dj',
                            'Africa/Douala': 'cm',
                            'Africa/El_Aaiun': 'eh',
                            'Africa/Freetown': 'sl',
                            'Africa/Gaborone': 'bw',
                            'Africa/Harare': 'zw',
                            'Africa/Johannesburg': 'za',
                            'Africa/Juba': 'ss',
                            'Africa/Kampala': 'ug',
                            'Africa/Khartoum': 'sd',
                            'Africa/Kigali': 'rw',
                            'Africa/Kinshasa': 'cd',
                            'Africa/Lagos': 'ng',
                            'Africa/Libreville': 'ga',
                            'Africa/Lome': 'tg',
                            'Africa/Luanda': 'ao',
                            'Africa/Lubumbashi': 'cd',
                            'Africa/Lusaka': 'zm',
                            'Africa/Maputo': 'mz',
                            'Africa/Maseru': 'ls',
                            'Africa/Mbabane': 'sz',
                            'Africa/Mogadishu': 'so',
                            'Africa/Monrovia': 'lr',
                            'Africa/Nairobi': 'ke',
                            'Africa/Ndjamena': 'td',
                            'Africa/Niamey': 'ne',
                            'Africa/Nouakchott': 'mr',
                            'Africa/Ouagadougou': 'bf',
                            'Africa/Porto-Novo': 'bj',
                            'Africa/Sao_Tome': 'st',
                            'Africa/Tripoli': 'ly',
                            'Africa/Tunis': 'tn',
                            'Africa/Windhoek': 'na',
                            
                            // America
                            'America/Adak': 'us',
                            'America/Anchorage': 'us',
                            'America/Anguilla': 'ai',
                            'America/Antigua': 'ag',
                            'America/Araguaina': 'br',
                            'America/Argentina/Buenos_Aires': 'ar',
                            'America/Argentina/Catamarca': 'ar',
                            'America/Argentina/Cordoba': 'ar',
                            'America/Argentina/Jujuy': 'ar',
                            'America/Argentina/La_Rioja': 'ar',
                            'America/Argentina/Mendoza': 'ar',
                            'America/Argentina/Rio_Gallegos': 'ar',
                            'America/Argentina/Salta': 'ar',
                            'America/Argentina/San_Juan': 'ar',
                            'America/Argentina/San_Luis': 'ar',
                            'America/Argentina/Tucuman': 'ar',
                            'America/Argentina/Ushuaia': 'ar',
                            'America/Aruba': 'aw',
                            'America/Asuncion': 'py',
                            'America/Atikokan': 'ca',
                            'America/Bahia': 'br',
                            'America/Bahia_Banderas': 'mx',
                            'America/Barbados': 'bb',
                            'America/Belem': 'br',
                            'America/Belize': 'bz',
                            'America/Blanc-Sablon': 'ca',
                            'America/Boa_Vista': 'br',
                            'America/Bogota': 'co',
                            'America/Boise': 'us',
                            'America/Cambridge_Bay': 'ca',
                            'America/Campo_Grande': 'br',
                            'America/Cancun': 'mx',
                            'America/Caracas': 've',
                            'America/Cayenne': 'gf',
                            'America/Cayman': 'ky',
                            'America/Chicago': 'us',
                            'America/Chihuahua': 'mx',
                            'America/Ciudad_Juarez': 'mx',
                            'America/Costa_Rica': 'cr',
                            'America/Creston': 'ca',
                            'America/Cuiaba': 'br',
                            'America/Curacao': 'cw',
                            'America/Danmarkshavn': 'gl',
                            'America/Dawson': 'ca',
                            'America/Dawson_Creek': 'ca',
                            'America/Denver': 'us',
                            'America/Detroit': 'us',
                            'America/Dominica': 'dm',
                            'America/Edmonton': 'ca',
                            'America/Eirunepe': 'br',
                            'America/El_Salvador': 'sv',
                            'America/Fort_Nelson': 'ca',
                            'America/Fortaleza': 'br',
                            'America/Glace_Bay': 'ca',
                            'America/Goose_Bay': 'ca',
                            'America/Grand_Turk': 'tc',
                            'America/Grenada': 'gd',
                            'America/Guadeloupe': 'gp',
                            'America/Guatemala': 'gt',
                            'America/Guayaquil': 'ec',
                            'America/Guyana': 'gy',
                            'America/Halifax': 'ca',
                            'America/Havana': 'cu',
                            'America/Hermosillo': 'mx',
                            'America/Indiana/Indianapolis': 'us',
                            'America/Indiana/Knox': 'us',
                            'America/Indiana/Marengo': 'us',
                            'America/Indiana/Petersburg': 'us',
                            'America/Indiana/Tell_City': 'us',
                            'America/Indiana/Vevay': 'us',
                            'America/Indiana/Vincennes': 'us',
                            'America/Indiana/Winamac': 'us',
                            'America/Inuvik': 'ca',
                            'America/Iqaluit': 'ca',
                            'America/Jamaica': 'jm',
                            'America/Juneau': 'us',
                            'America/Kentucky/Louisville': 'us',
                            'America/Kentucky/Monticello': 'us',
                            'America/Kralendijk': 'bq',
                            'America/La_Paz': 'bo',
                            'America/Lima': 'pe',
                            'America/Los_Angeles': 'us',
                            'America/Lower_Princes': 'sx',
                            'America/Maceio': 'br',
                            'America/Managua': 'ni',
                            'America/Manaus': 'br',
                            'America/Marigot': 'mf',
                            'America/Martinique': 'mq',
                            'America/Matamoros': 'mx',
                            'America/Mazatlan': 'mx',
                            'America/Menominee': 'us',
                            'America/Merida': 'mx',
                            'America/Metlakatla': 'us',
                            'America/Mexico_City': 'mx',
                            'America/Miquelon': 'pm',
                            'America/Moncton': 'ca',
                            'America/Monterrey': 'mx',
                            'America/Montevideo': 'uy',
                            'America/Montserrat': 'ms',
                            'America/Nassau': 'bs',
                            'America/New_York': 'us',
                            'America/Nome': 'us',
                            'America/Noronha': 'br',
                            'America/North_Dakota/Beulah': 'us',
                            'America/North_Dakota/Center': 'us',
                            'America/North_Dakota/New_Salem': 'us',
                            'America/Nuuk': 'gl',
                            'America/Ojinaga': 'mx',
                            'America/Panama': 'pa',
                            'America/Paramaribo': 'sr',
                            'America/Phoenix': 'us',
                            'America/Port-au-Prince': 'ht',
                            'America/Port_of_Spain': 'tt',
                            'America/Porto_Velho': 'br',
                            'America/Puerto_Rico': 'pr',
                            'America/Punta_Arenas': 'cl',
                            'America/Rankin_Inlet': 'ca',
                            'America/Recife': 'br',
                            'America/Regina': 'ca',
                            'America/Resolute': 'ca',
                            'America/Rio_Branco': 'br',
                            'America/Santarem': 'br',
                            'America/Santiago': 'cl',
                            'America/Santo_Domingo': 'do',
                            'America/Sao_Paulo': 'br',
                            'America/Scoresbysund': 'gl',
                            'America/Sitka': 'us',
                            'America/St_Barthelemy': 'bl',
                            'America/St_Johns': 'ca',
                            'America/St_Kitts': 'kn',
                            'America/St_Lucia': 'lc',
                            'America/St_Thomas': 'vi',
                            'America/St_Vincent': 'vc',
                            'America/Swift_Current': 'ca',
                            'America/Tegucigalpa': 'hn',
                            'America/Thule': 'gl',
                            'America/Tijuana': 'mx',
                            'America/Toronto': 'ca',
                            'America/Tortola': 'vg',
                            'America/Vancouver': 'ca',
                            'America/Whitehorse': 'ca',
                            'America/Winnipeg': 'ca',
                            'America/Yakutat': 'us',
                            'America/Yellowknife': 'ca',
                            
                            // Antarctica
                            'Antarctica/Casey': 'aq',
                            'Antarctica/Davis': 'aq',
                            'Antarctica/DumontDUrville': 'aq',
                            'Antarctica/Macquarie': 'au',
                            'Antarctica/Mawson': 'aq',
                            'Antarctica/McMurdo': 'aq',
                            'Antarctica/Palmer': 'aq',
                            'Antarctica/Rothera': 'aq',
                            'Antarctica/Syowa': 'aq',
                            'Antarctica/Troll': 'aq',
                            'Antarctica/Vostok': 'aq',
                            
                            // Arctic
                            'Arctic/Longyearbyen': 'sj',
                            
                            // Asia
                            'Asia/Aden': 'ye',
                            'Asia/Almaty': 'kz',
                            'Asia/Amman': 'jo',
                            'Asia/Anadyr': 'ru',
                            'Asia/Aqtau': 'kz',
                            'Asia/Aqtobe': 'kz',
                            'Asia/Ashgabat': 'tm',
                            'Asia/Atyrau': 'kz',
                            'Asia/Baghdad': 'iq',
                            'Asia/Bahrain': 'bh',
                            'Asia/Baku': 'az',
                            'Asia/Bangkok': 'th',
                            'Asia/Barnaul': 'ru',
                            'Asia/Beirut': 'lb',
                            'Asia/Bishkek': 'kg',
                            'Asia/Brunei': 'bn',
                            'Asia/Chita': 'ru',
                            'Asia/Choibalsan': 'mn',
                            'Asia/Colombo': 'lk',
                            'Asia/Damascus': 'sy',
                            'Asia/Dhaka': 'bd',
                            'Asia/Dili': 'tl',
                            'Asia/Dubai': 'ae',
                            'Asia/Dushanbe': 'tj',
                            'Asia/Famagusta': 'cy',
                            'Asia/Gaza': 'ps',
                            'Asia/Hebron': 'ps',
                            'Asia/Ho_Chi_Minh': 'vn',
                            'Asia/Hong_Kong': 'hk',
                            'Asia/Hovd': 'mn',
                            'Asia/Irkutsk': 'ru',
                            'Asia/Jakarta': 'id',
                            'Asia/Jayapura': 'id',
                            'Asia/Jerusalem': 'il',
                            'Asia/Kabul': 'af',
                            'Asia/Kamchatka': 'ru',
                            'Asia/Karachi': 'pk',
                            'Asia/Kathmandu': 'np',
                            'Asia/Khandyga': 'ru',
                            'Asia/Kolkata': 'in',
                            'Asia/Krasnoyarsk': 'ru',
                            'Asia/Kuala_Lumpur': 'my',
                            'Asia/Kuching': 'my',
                            'Asia/Kuwait': 'kw',
                            'Asia/Macau': 'mo',
                            'Asia/Magadan': 'ru',
                            'Asia/Makassar': 'id',
                            'Asia/Manila': 'ph',
                            'Asia/Muscat': 'om',
                            'Asia/Nicosia': 'cy',
                            'Asia/Novokuznetsk': 'ru',
                            'Asia/Novosibirsk': 'ru',
                            'Asia/Omsk': 'ru',
                            'Asia/Oral': 'kz',
                            'Asia/Phnom_Penh': 'kh',
                            'Asia/Pontianak': 'id',
                            'Asia/Pyongyang': 'kp',
                            'Asia/Qatar': 'qa',
                            'Asia/Qostanay': 'kz',
                            'Asia/Qyzylorda': 'kz',
                            'Asia/Riyadh': 'sa',
                            'Asia/Sakhalin': 'ru',
                            'Asia/Samarkand': 'uz',
                            'Asia/Seoul': 'kr',
                            'Asia/Shanghai': 'cn',
                            'Asia/Singapore': 'sg',
                            'Asia/Srednekolymsk': 'ru',
                            'Asia/Taipei': 'tw',
                            'Asia/Tashkent': 'uz',
                            'Asia/Tbilisi': 'ge',
                            'Asia/Tehran': 'ir',
                            'Asia/Thimphu': 'bt',
                            'Asia/Tokyo': 'jp',
                            'Asia/Tomsk': 'ru',
                            'Asia/Ulaanbaatar': 'mn',
                            'Asia/Urumqi': 'cn',
                            'Asia/Ust-Nera': 'ru',
                            'Asia/Vientiane': 'la',
                            'Asia/Vladivostok': 'ru',
                            'Asia/Yakutsk': 'ru',
                            'Asia/Yangon': 'mm',
                            'Asia/Yekaterinburg': 'ru',
                            'Asia/Yerevan': 'am',
                            
                            // Atlantic
                            'Atlantic/Azores': 'pt',
                            'Atlantic/Bermuda': 'bm',
                            'Atlantic/Canary': 'es',
                            'Atlantic/Cape_Verde': 'cv',
                            'Atlantic/Faroe': 'fo',
                            'Atlantic/Madeira': 'pt',
                            'Atlantic/Reykjavik': 'is',
                            'Atlantic/South_Georgia': 'gs',
                            'Atlantic/St_Helena': 'sh',
                            'Atlantic/Stanley': 'fk',
                            
                            // Australia
                            'Australia/Adelaide': 'au',
                            'Australia/Brisbane': 'au',
                            'Australia/Broken_Hill': 'au',
                            'Australia/Darwin': 'au',
                            'Australia/Eucla': 'au',
                            'Australia/Hobart': 'au',
                            'Australia/Lindeman': 'au',
                            'Australia/Lord_Howe': 'au',
                            'Australia/Melbourne': 'au',
                            'Australia/Perth': 'au',
                            'Australia/Sydney': 'au',
                            
                            // Europe
                            'Europe/Amsterdam': 'nl',
                            'Europe/Andorra': 'ad',
                            'Europe/Astrakhan': 'ru',
                            'Europe/Athens': 'gr',
                            'Europe/Belgrade': 'rs',
                            'Europe/Berlin': 'de',
                            'Europe/Bratislava': 'sk',
                            'Europe/Brussels': 'be',
                            'Europe/Bucharest': 'ro',
                            'Europe/Budapest': 'hu',
                            'Europe/Busingen': 'de',
                            'Europe/Chisinau': 'md',
                            'Europe/Copenhagen': 'dk',
                            'Europe/Dublin': 'ie',
                            'Europe/Gibraltar': 'gi',
                            'Europe/Guernsey': 'gg',
                            'Europe/Helsinki': 'fi',
                            'Europe/Isle_of_Man': 'im',
                            'Europe/Istanbul': 'tr',
                            'Europe/Jersey': 'je',
                            'Europe/Kaliningrad': 'ru',
                            'Europe/Kiev': 'ua',
                            'Europe/Kirov': 'ru',
                            'Europe/Lisbon': 'pt',
                            'Europe/Ljubljana': 'si',
                            'Europe/London': 'gb',
                            'Europe/Luxembourg': 'lu',
                            'Europe/Madrid': 'es',
                            'Europe/Malta': 'mt',
                            'Europe/Mariehamn': 'ax',
                            'Europe/Minsk': 'by',
                            'Europe/Monaco': 'mc',
                            'Europe/Moscow': 'ru',
                            'Europe/Oslo': 'no',
                            'Europe/Paris': 'fr',
                            'Europe/Podgorica': 'me',
                            'Europe/Prague': 'cz',
                            'Europe/Riga': 'lv',
                            'Europe/Rome': 'it',
                            'Europe/Samara': 'ru',
                            'Europe/San_Marino': 'sm',
                            'Europe/Sarajevo': 'ba',
                            'Europe/Saratov': 'ru',
                            'Europe/Simferopol': 'ru',
                            'Europe/Skopje': 'mk',
                            'Europe/Sofia': 'bg',
                            'Europe/Stockholm': 'se',
                            'Europe/Tallinn': 'ee',
                            'Europe/Tirane': 'al',
                            'Europe/Ulyanovsk': 'ru',
                            'Europe/Uzhgorod': 'ua',
                            'Europe/Vaduz': 'li',
                            'Europe/Vatican': 'va',
                            'Europe/Vienna': 'at',
                            'Europe/Vilnius': 'lt',
                            'Europe/Volgograd': 'ru',
                            'Europe/Warsaw': 'pl',
                            'Europe/Zagreb': 'hr',
                            'Europe/Zaporozhye': 'ua',
                            'Europe/Zurich': 'ch',
                            
                            // Indian
                            'Indian/Antananarivo': 'mg',
                            'Indian/Chagos': 'io',
                            'Indian/Christmas': 'cx',
                            'Indian/Cocos': 'cc',
                            'Indian/Comoro': 'km',
                            'Indian/Kerguelen': 'tf',
                            'Indian/Mahe': 'sc',
                            'Indian/Maldives': 'mv',
                            'Indian/Mauritius': 'mu',
                            'Indian/Mayotte': 'yt',
                            'Indian/Reunion': 're',
                            
                            // Pacific
                            'Pacific/Apia': 'ws',
                            'Pacific/Auckland': 'nz',
                            'Pacific/Bougainville': 'pg',
                            'Pacific/Chatham': 'nz',
                            'Pacific/Chuuk': 'fm',
                            'Pacific/Easter': 'cl',
                            'Pacific/Efate': 'vu',
                            'Pacific/Fakaofo': 'tk',
                            'Pacific/Fiji': 'fj',
                            'Pacific/Funafuti': 'tv',
                            'Pacific/Galapagos': 'ec',
                            'Pacific/Gambier': 'pf',
                            'Pacific/Guadalcanal': 'sb',
                            'Pacific/Guam': 'gu',
                            'Pacific/Honolulu': 'us',
                            'Pacific/Kanton': 'ki',
                            'Pacific/Kiritimati': 'ki',
                            'Pacific/Kosrae': 'fm',
                            'Pacific/Kwajalein': 'mh',
                            'Pacific/Majuro': 'mh',
                            'Pacific/Marquesas': 'pf',
                            'Pacific/Midway': 'um',
                            'Pacific/Nauru': 'nr',
                            'Pacific/Niue': 'nu',
                            'Pacific/Norfolk': 'nf',
                            'Pacific/Noumea': 'nc',
                            'Pacific/Pago_Pago': 'as',
                            'Pacific/Palau': 'pw',
                            'Pacific/Pitcairn': 'pn',
                            'Pacific/Pohnpei': 'fm',
                            'Pacific/Port_Moresby': 'pg',
                            'Pacific/Rarotonga': 'ck',
                            'Pacific/Saipan': 'mp',
                            'Pacific/Tahiti': 'pf',
                            'Pacific/Tarawa': 'ki',
                            'Pacific/Tongatapu': 'to',
                            'Pacific/Wake': 'um',
                            'Pacific/Wallis': 'wf'
                          };
                          
                          // Generate flag emoji from country code
                          const getFlagEmoji = (countryCode: string): string => {
                            if (!countryCode || countryCode === 'un') return '🏳️';
                            if (countryCode === 'gb') return '🇬🇧';
                            
                            const codePoints = countryCode
                              .toUpperCase()
                              .split('')
                              .map(char => 127397 + char.charCodeAt(0));
                            return String.fromCodePoint(...codePoints);
                          };
                          
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                              {allTimezones.map(tz => {
                                const now = dayjs().tz(tz);
                                const city = tz.split('/').pop()?.replace(/_/g,' ') ?? tz.replace(/_/g,' ');
                                const countryCode = timezoneToCountryCode[tz] || 'un';
                                const flag = getFlagEmoji(countryCode);
                                
                                return (
                                  <div key={`all-${tz}`} className="p-3 flex items-center justify-between">
                                    <div className="min-w-0">
                                      <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                        <span className="mr-1">{flag}</span>
                                        {city}
                                      </div>
                                      <div className="text-2xl font-semibold tracking-tight">
                                        {now.format(timeFormat === '12h' ? (worldShowSeconds? 'h:mm:ss A':'h:mm A') : (worldShowSeconds? 'HH:mm:ss':'HH:mm'))}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {now.format('ddd, MMM D')} • GMT{(now.utcOffset()>=0?'+':'')}{Math.floor(Math.abs(now.utcOffset())/60)}{Math.abs(now.utcOffset())%60? ':'+String(Math.abs(now.utcOffset())%60).padStart(2,'0') : ''}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="world">
                  <Card className="minimal-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="font-headline text-lg tracking-tight">World Clock</CardTitle>
                        <Badge variant="outline" className="flex items-center gap-1 text-emerald-600 border-emerald-300/50 dark:text-emerald-300">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                          Live
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button aria-label="World Clock help" className="text-muted-foreground hover:text-foreground">
                                <HelpCircle className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Live local times with GMT offsets and date. Toggle seconds if you need precision.</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Switch id="show-seconds" checked={worldShowSeconds} onCheckedChange={setWorldShowSeconds} />
                          <Label htmlFor="show-seconds" className="text-xs">Show seconds</Label>
                        </div>
                      </div>
                      <div className="rounded-md border overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                          {locations.map(loc => {
                            const now = worldNow(loc.selectedTimezone);
                            const dayDelta = now.startOf('day').diff(dayjs().tz(tzPrimary).startOf('day'), 'day');
                            const city = loc.selectedTimezone.split('/').pop()?.replace(/_/g,' ') ?? loc.selectedTimezone.replace(/_/g,' ');
                            return (
                              <div key={`wc-${loc.id}`} className="p-3 flex items-center justify-between">
                                <div className="min-w-0">
                                  <div className="text-xs text-muted-foreground truncate flex items-center gap-1">{city}
                                    {dayDelta !== 0 && (
                                      <Badge className="ml-0.5 bg-muted text-muted-foreground">{dayDelta>0? `+${dayDelta}d` : `${dayDelta}d`}</Badge>
                                    )}
                                  </div>
                                  <div className="text-2xl font-semibold tracking-tight">{now.format(timeFormat === '12h' ? (worldShowSeconds? 'h:mm:ss A':'h:mm A') : (worldShowSeconds? 'HH:mm:ss':'HH:mm'))}</div>
                                  <div className="text-xs text-muted-foreground">{now.format('ddd, MMM D')} • GMT{(now.utcOffset()>=0?'+':'')}{Math.floor(Math.abs(now.utcOffset())/60)}{Math.abs(now.utcOffset())%60? ':'+String(Math.abs(now.utcOffset())%60).padStart(2,'0') : ''}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="event">
                  <Card className="minimal-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="font-headline text-lg tracking-tight">Event & Countdown</CardTitle>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button aria-label="Event help" className="text-muted-foreground hover:text-foreground">
                                <HelpCircle className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Create an event time, see local times per timezone, and share to calendars.</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background">
                        <input value={eventTitle} onChange={(e)=> setEventTitle(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm flex-grow min-w-[180px]" placeholder="Event title" />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm"><CalendarIcon className="h-4 w-4 mr-1"/> {dayjs(eventDate).format('MMM D, YYYY')}</Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={eventDate} onSelect={(d)=> d && setEventDate(d)} />
                          </PopoverContent>
                        </Popover>
                        <input value={eventTime} onChange={(e)=> setEventTime(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm w-[90px]" placeholder="HH:mm" />
                        <TimezoneCombobox value={eventTz} onValueChange={setEventTz} className="h-9 text-sm w-[220px]" />
                        <span className="text-xs text-muted-foreground">Duration</span>
                        <div className="flex items-center gap-1">
                          {[30,60,90,120].map(m => (
                            <Button key={m} size="sm" variant={eventDurationMin===m? 'default':'outline'} onClick={()=> setEventDurationMin(m)} className="h-8">{m>=60? `${m/60}h`:`${m}m`}</Button>
                          ))}
                          <input
                            type="number"
                            min={1}
                            max={1440}
                            value={Number.isFinite(eventDurationMin)? eventDurationMin : 60}
                            onChange={(e)=> {
                              const v = Number(e.currentTarget.value);
                              if (!Number.isFinite(v)) return;
                              const clamped = Math.max(1, Math.min(1440, Math.round(v)));
                              setEventDurationMin(clamped);
                            }}
                            className="h-8 w-[88px] rounded-md border bg-background px-2 text-sm"
                            placeholder="mins"
                            title="Custom duration (minutes)"
                          />
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={()=> openGoogleCalendarForRange(eventStartLocal, eventEndLocal)}>
                                <Share2 className="h-3.5 w-3.5 mr-1"/> Google
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Open in Google Calendar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={()=> downloadICSForRange(eventStartLocal, eventEndLocal)}>
                                <DownloadIcon className="h-3.5 w-3.5 mr-1"/> .ics
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download calendar file</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-sm">Countdown: <span className="font-semibold">{dayjs.duration(eventStartLocal.diff(dayjs().tz(eventTz || tzPrimary))).humanize(true)}</span></div>
                      </div>
                      <div className="rounded-md border overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                          {locations.map(loc => {
                            const localStart = eventStartLocal.tz(loc.selectedTimezone);
                            const localEnd = eventEndLocal.tz(loc.selectedTimezone);
                            const eventRefDay = eventStartLocal.startOf('day');
                            const localDayDelta = localStart.startOf('day').diff(eventRefDay, 'day');
                            const city = loc.selectedTimezone.split('/').pop()?.replace(/_/g,' ') ?? loc.selectedTimezone.replace(/_/g,' ');
                            return (
                              <div key={`evt-${loc.id}`} className="p-2">
                                <div className="text-[11px] text-muted-foreground mb-0.5 truncate flex items-center gap-1">{city}
                                  {localDayDelta !== 0 && (
                                    <Badge className="ml-0.5 bg-muted text-muted-foreground">{localDayDelta>0? `+${localDayDelta}d` : `${localDayDelta}d`}</Badge>
                                  )}
                                </div>
                                <div className="text-2xl font-semibold tracking-tight">{localStart.format(hrsFmt)} – {localEnd.format(hrsFmt)}</div>
                                <div className="text-[11px] text-muted-foreground">{localStart.format('ddd, MMM D')}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="travel">
                  <Card className="minimal-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="font-headline text-lg tracking-tight">Travel Planner</CardTitle>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button aria-label="Travel help" className="text-muted-foreground hover:text-foreground">
                                <HelpCircle className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Set departure time and duration; arrival adjusts for timezone differences automatically.</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background">
                        <div className="flex items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm"><CalendarIcon className="h-4 w-4 mr-1"/> {dayjs(travelDepartDate).format('MMM D, YYYY')}</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar mode="single" selected={travelDepartDate} onSelect={(d)=> d && setTravelDepartDate(d)} />
                            </PopoverContent>
                          </Popover>
                          <input value={travelDepartTime} onChange={(e)=> setTravelDepartTime(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm w-[90px]" placeholder="HH:mm" />
                          <TimezoneCombobox value={travelDepartTz} onValueChange={setTravelDepartTz} className="h-9 text-sm w-[220px]" />
                          <span className="text-xs text-muted-foreground" title="to">→</span>
                          <TimezoneCombobox value={travelArriveTz} onValueChange={setTravelArriveTz} className="h-9 text-sm w-[220px]" />
                          <span className="text-xs text-muted-foreground">Duration</span>
                          <div className="flex items-center gap-1">
                            {[60,120,240,360,480].map(m => (
                              <Button key={m} size="sm" variant={travelDurationMin===m? 'default':'outline'} onClick={()=> setTravelDurationMin(m)} className="h-8">{m>=60? `${m/60}h`:`${m}m`}</Button>
                            ))}
                            <input
                              type="number"
                              min={1}
                              max={1440}
                              value={Number.isFinite(travelDurationMin)? travelDurationMin : 60}
                              onChange={(e)=> {
                                const v = Number(e.currentTarget.value);
                                if (!Number.isFinite(v)) return;
                                const clamped = Math.max(1, Math.min(1440, Math.round(v)));
                                setTravelDurationMin(clamped);
                              }}
                              className="h-8 w-[88px] rounded-md border bg-background px-2 text-sm"
                              placeholder="mins"
                              title="Custom duration (minutes)"
                            />
                          </div>
                        </div>
                      </div>
                      <Alert className="p-2 py-1.5 rounded-md bg-muted/40 border-muted/60 text-muted-foreground">
                        <p className="text-[11px] leading-snug flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 opacity-70" aria-hidden />
                          <span><span className="font-medium">Tip:</span> Duration is flight time only; real arrivals vary with layovers, taxi, and delays.</span>
                        </p>
                      </Alert>
                      <div className="rounded-md border p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Departure</div>
                          <div className="text-2xl font-semibold tracking-tight">{travelDepartLocal.format(hrsFmt)}</div>
                          <div className="text-xs text-muted-foreground">{travelDepartLocal.format('ddd, MMM D')} • {travelDepartTz.replace(/_/g,' ')}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Arrival (estimated)</div>
                          <div className="text-2xl font-semibold tracking-tight">{travelArriveLocal.format(hrsFmt)}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">{travelArriveLocal.format('ddd, MMM D')} • {travelArriveTz.replace(/_/g,' ')}
                            {(() => {
                              const depOff = travelDepartLocal.utcOffset();
                              const arrOff = travelArriveLocal.utcOffset();
                              const shiftMin = arrOff - depOff;
                              if (!Number.isFinite(shiftMin) || shiftMin === 0) return null;
                              const sign = shiftMin > 0 ? '+' : '';
                              const hrs = Math.floor(Math.abs(shiftMin)/60);
                              const mins = Math.abs(shiftMin)%60;
                              return <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">TZ shift: {sign}{hrs}{mins? `:${String(mins).padStart(2,'0')}`:''}h</Badge>;
                            })()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </>
    );
  }

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
  <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold font-headline">Timezone Converter</h1>
            </div>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-6">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Timezone Converter</h1>
              <p className="text-lg text-muted-foreground">Convert times between different timezones.</p>
            </div>
            
            <div className="space-y-6">
              <Card className="minimal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-headline text-lg tracking-tight">Global Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Global Controls Wrapper */}
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-2 border rounded-md bg-background">
                {/* Date Navigation Group */}
                <div className="flex items-center gap-1 flex-wrap">
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                            <CalendarIcon className="h-4 w-4" />
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={referenceDateForCalendar}
                            onSelect={handleGlobalDateChange}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <div className="flex items-center rounded-md border bg-background overflow-hidden shadow-sm">
                        {dateNavItems.filter(item => item.date.isBefore(selectedRange.start.startOf('day'))).map(item => (
                            <Button
                                key={`prev-${item.date.toISOString()}`}
                                variant={"outline"}
                                size="sm"
                                className="h-9 px-2.5 md:px-3 rounded-none border-r text-xs md:text-sm text-muted-foreground hover:bg-accent focus-visible:z-10"
                                onClick={() => handleGlobalDateChange(item.date.toDate())}
                            >
                                {item.label}
                            </Button>
                        ))}
                         <div className="flex items-center bg-primary/10 text-primary h-9 px-2.5 md:px-3 border-r">
                            <span className="text-xs md:text-sm font-semibold">{selectedRange.start.format('MMM D')}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 ml-1 md:ml-1.5 p-0 hover:bg-primary/20" onClick={handleGoToToday} title="Go to Today">
                                <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        {dateNavItems.filter(item => item.date.isAfter(selectedRange.start.startOf('day'))).map(item => (
                            <Button
                                key={`next-${item.date.toISOString()}`}
                                variant={"outline"}
                                size="sm"
                                className="h-9 px-2.5 md:px-3 rounded-none border-r last:border-r-0 text-xs md:text-sm text-muted-foreground hover:bg-accent focus-visible:z-10"
                                onClick={() => handleGlobalDateChange(item.date.toDate())}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </div>
                </div>
                {/* Settings & Add Timezone Group */}
                <div className="flex items-center gap-x-3 gap-y-2 flex-wrap justify-end">
                    {/* 12/24h Toggle Group */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                        <Switch
                            id="time-format-toggle"
                            checked={timeFormat === '12h'}
                            onCheckedChange={(checked) => setTimeFormat(checked ? '12h' : '24h')}
                            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input h-5 w-9 [&>span]:h-4 [&>span]:w-4 [&>span[data-state=checked]]:translate-x-4"
                        />
                        <Label htmlFor="time-format-toggle" className="text-xs md:text-sm whitespace-nowrap">12-hour</Label>
                    </div>
                    {/* Timezone Adder Group */}
                    <div className="flex items-center gap-1.5 flex-grow min-w-[200px] sm:min-w-[250px] md:flex-grow-0">
                        <TimezoneCombobox 
                            value={adderTimezoneValue}
                            onValueChange={setAdderTimezoneValue}
                            placeholder="Search and add timezone..."
                            className="flex-grow h-9 text-xs md:text-sm"
                        />
                        <Button onClick={handleAddTimezoneFromSearch} size="sm" className="h-9 px-3 text-xs md:text-sm shrink-0">
                            <PlusCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-1.5" /> Add
                        </Button>
                    </div>
                      </div>
                      {/* Selection Controls */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" className="h-8" onClick={()=> shiftSelection(-1)} title="Shift selection left 1 hour">← 1h</Button>
                          <Button variant="outline" size="sm" className="h-8" onClick={()=> shiftSelection(+1)} title="Shift selection right 1 hour">1h →</Button>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Length</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=> setSelectionHours(getSelectionHours()-1)}>-</Button>
                          <span className="w-10 text-center text-sm font-medium">{getSelectionHours()}h</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=> setSelectionHours(getSelectionHours()+1)}>+</Button>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center space-x-1.5">
                            <Switch id="compact-mode" checked={compactMode} onCheckedChange={setCompactMode} className="h-5 w-9 [&>span]:h-4 [&>span]:w-4 [&>span[data-state=checked]]:translate-x-4" />
                            <Label htmlFor="compact-mode" className="text-xs">Compact</Label>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Switch id="color-coding" checked={colorCoding} onCheckedChange={setColorCoding} className="h-5 w-9 [&>span]:h-4 [&>span]:w-4 [&>span[data-state=checked]]:translate-x-4" />
                            <Label htmlFor="color-coding" className="text-xs">Color coding</Label>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={copySummary}>
                          <CopyIcon className="h-3.5 w-3.5 mr-1"/> Copy summary
                        </Button>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" onClick={openGoogleCalendar} title="Open in Google Calendar">Google Cal</Button>
                          <Button variant="outline" size="sm" onClick={downloadICS} title="Download .ics file">.ics</Button>
                        </div>
                      </div>
                    </div>
                </CardContent>
              </Card>

              <Card className="minimal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-headline text-lg tracking-tight">World Time View</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                {/* Header timeline scroller aligned to primary timezone */}
                {(() => {
                  const primaryTz = locations.find(l => l.isPinned)?.selectedTimezone || locations[0]?.selectedTimezone || 'UTC';
                  const headerSlots = generateTimeSlots(primaryTz, selectedRange.start);
                  const headerHours = headerSlots.filter(s => s.minuteNumber === 0);
                  return (
                    <div className="flex items-center min-w-0">
                      <Button variant="ghost" size="icon" className="h-8 w-7 shrink-0 opacity-60 hover:opacity-100 rounded-none" onClick={() => {
                        const id = locations[0]?.id; if (!id) return; handleTimeStripArrowScroll(id, 'prev');
                      }}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div
                        ref={headerScrollableRef}
                        onScroll={handleHeaderScroll}
                        className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-muted/20 flex-grow h-full"
                      >
                        <div className="relative min-w-max">
                          {/* Now marker */}
                          <div className="absolute top-0 bottom-0 w-px bg-primary/80" style={{ left: `${getNowOffsetPx(primaryTz)}px` }} aria-hidden />
                          <div className="flex space-x-px min-w-max items-stretch">
                            {headerHours.map((slot) => (
                              <div key={`hdr-hour-${slot.key}`}
                                   className={cn("relative flex items-center justify-center rounded-sm border bg-muted/40 text-muted-foreground font-semibold")}
                                   style={{ width: `${(SLOT_WIDTH * 2) + SLOT_SPACING}px`, height: '32px' }}
                                   aria-hidden>
                                <span className="text-[10px] leading-none">
                                  {slot.dateTime.format(timeFormat === '12h' ? 'h A' : 'HH:00')}
                                </span>
                                {/* Half-hour tick aligned with row internal gap */}
                                <div className="absolute top-0 bottom-0 w-px bg-border" style={{ left: `${SLOT_WIDTH + SLOT_SPACING}px` }} aria-hidden />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-7 shrink-0 opacity-60 hover:opacity-100 rounded-none" onClick={() => {
                        const id = locations[0]?.id; if (!id) return; handleTimeStripArrowScroll(id, 'next');
                      }}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })()}

                {locations.map((loc) => {
                  if (!loc || !loc.selectedTimezone || !isValidTz(loc.selectedTimezone)) return null;
                  
                  const localSelectedStart = selectedRange.start.tz(loc.selectedTimezone);
                  const localSelectedEnd = selectedRange.end.tz(loc.selectedTimezone);
                  if (!localSelectedStart.isValid() || !localSelectedEnd.isValid()) return null;

                  const timeSlots = generateTimeSlots(loc.selectedTimezone, selectedRange.start); 
                  const timeFormatString = timeFormat === '12h' ? 'h:mm A' : 'HH:mm';
                  
                  const rangeStartStr = localSelectedStart.format(timeFormatString);
                  const rangeEndStr = localSelectedEnd.subtract(1, 'minute').format(timeFormatString); 
                  
                  const dateDisplayFormat = "ddd, MMM D, YYYY";
                  let rangeDateStr = localSelectedStart.format(dateDisplayFormat);
                  if (!localSelectedStart.isSame(localSelectedEnd.subtract(1, 'minute'), 'day')) {
                      rangeDateStr = `${localSelectedStart.format(dateDisplayFormat)} - ${localSelectedEnd.subtract(1, 'minute').format(dateDisplayFormat)}`;
                  }

                  return (
                    <div key={loc.id} className="py-1.5 border-b last:border-b-0">
                      <div className="flex flex-col md:flex-row items-stretch gap-x-2 gap-y-1.5">
                        {/* Left: Controls and Timezone Info */}
                        <div className="w-full md:w-[220px] lg:w-[260px] shrink-0 pr-1 md:pr-2 space-y-0.5 flex-col">
                          <div className="flex items-center gap-1 justify-between">
                              <div className="flex items-center gap-1 flex-grow min-w-0">
                                  <Button variant="ghost" size="icon" onClick={() => handlePinLocation(loc.id)} title={`Set ${loc.selectedTimezone.split('/').pop()?.replace(/_/g, ' ')} as primary`} 
                                          className={cn("h-6 w-6 p-1 shrink-0", loc.isPinned ? "text-primary" : "text-muted-foreground hover:text-primary")}>
                                      {loc.isPinned ? <Home className="h-4 w-4"/> : <Pin className="h-4 w-4" />}
                                  </Button>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 p-1" onClick={()=> moveLocationUp(loc.id)} title="Move up"><ChevronUp className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 p-1" onClick={()=> moveLocationDown(loc.id)} title="Move down"><ChevronDown className="h-4 w-4"/></Button>
                                  </div>
                                  <TimezoneCombobox
                                    value={loc.selectedTimezone}
                                    onValueChange={(tz) => handleLocationTimezoneChange(loc.id, tz)}
                                    placeholder="Select timezone"
                                    className="text-xs font-semibold w-full h-7 truncate"
                                  />
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveLocation(loc.id)} disabled={locations.length <= 1} className="text-muted-foreground hover:text-destructive h-6 w-6 p-1 shrink-0">
                                  <XCircle className="h-4 w-4" />
                              </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate ml-1 mt-1 flex items-center gap-1">
                            <span className="truncate">{loc.selectedTimezone.replace(/_/g, ' ')}</span>
                            <span className="px-1.5 py-0.5 rounded bg-muted text-[9px] border text-muted-foreground shrink-0">{formatGmtOffset(loc.selectedTimezone)}</span>
                          </p>
                          
                          <div className="mt-1.5 pt-1.5 md:border-t md:border-muted/30">
                            <p className="text-lg font-bold ml-1 truncate leading-tight">
                                {rangeStartStr} - {rangeEndStr}
                            </p>
                            <p className="text-[10px] text-muted-foreground ml-1 truncate">
                                {rangeDateStr}
                            </p>
                          </div>
                        </div>
                        
                        {/* Right: Time Slot Panel */}
                        <div className="flex-grow flex items-center min-w-0">
                           <Button variant="ghost" size="icon" className="h-full w-7 shrink-0 opacity-60 hover:opacity-100 rounded-none" onClick={() => handleTimeStripArrowScroll(loc.id, 'prev')}>
                               <ChevronLeft className="h-4 w-4"/>
                           </Button>
                           <div
                            ref={el => { scrollableContainerRefs.current[loc.id] = el; }}
                            onScroll={(e) => handleStripScroll(loc.id, e)}
                            className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-muted/20 flex-grow h-full"
                            style={{ cursor: isDraggingSelection ? 'grabbing': 'default'}}
                          >
                            <div className="relative min-w-max h-full" onDoubleClick={(e) => handleContainerClickSet(loc.id, e)}>
                              {/* Hour separators */}
                              <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none" aria-hidden>
                                {Array.from({ length: 25 }).map((_, h) => (
                                  <div key={`hr-${loc.id}-${h}`} className="absolute top-0 bottom-0 w-px bg-border/60" style={{ left: `${h * 60 * pxPerMinute}px` }} />
                                ))}
                              </div>
                              {/* Now marker */}
                              <div className="absolute top-0 bottom-0 w-px bg-primary/80" style={{ left: `${getNowOffsetPx(loc.selectedTimezone)}px` }} aria-hidden />
                              <div className="flex space-x-px min-w-max h-full items-stretch">
                              {timeSlots.map(slot => {
                                const localStart = selectedRange.start.tz(loc.selectedTimezone);
                                const localEnd = selectedRange.end.tz(loc.selectedTimezone);
                                const isSlotInRange = slot.dateTime.isSameOrAfter(localStart) && slot.dateTime.isBefore(localEnd);
                                const sameDayAsView = slot.dateTime.isSame(localStart, 'day');
                                const slotEnd = slot.dateTime.add(SLOT_INTERVAL_MINUTES, 'minute');
                                const nowLocal = dayjs().tz(loc.selectedTimezone);
                                const isNow = sameDayAsView && nowLocal.isSameOrAfter(slot.dateTime) && nowLocal.isBefore(slotEnd);
                                
                                const slotBgColor = isSlotInRange
                                  ? "bg-primary/40 dark:bg-primary/50 border-primary/60"
                                  : colorCoding
                                    ? (slot.isWeekend
                                        ? (slot.isDayTime ? "bg-amber-100/70 dark:bg-amber-900/30" : "bg-amber-200/20 dark:bg-amber-800/10")
                                        : (slot.isDayTime ? "bg-sky-100/70 dark:bg-sky-900/30" : "bg-slate-100/70 dark:bg-slate-800/20"))
                                    : "bg-background";
                                
                                const slotTextColor = isSlotInRange
                                  ? "text-primary-foreground dark:text-primary-foreground" 
                                  : colorCoding
                                    ? (slot.isWeekend
                                        ? (slot.isDayTime ? "text-amber-700 dark:text-amber-300" : "text-amber-600 dark:text-amber-400")
                                        : (slot.isDayTime ? "text-sky-700 dark:text-sky-300" : "text-slate-600 dark:text-slate-400"))
                                    : "text-foreground";

                                return (
                                  <div
                                    key={slot.key}
                                    className={cn(
                                      "relative flex flex-col items-center justify-center rounded-sm border select-none",
                                      compactMode ? "h-[40px] py-0.5" : "h-[52px] py-0.5",
                                      "hover:border-primary/40",
                                      slotBgColor,
                                      slotTextColor
                                    )}
                                    style={{width: `${SLOT_WIDTH}px`}}
                                    aria-hidden
                                  >
                                    <span className={cn(compactMode?"text-sm":"text-base","font-medium", isSlotInRange ? "font-bold" : "")}>{slot.dateTime.format(timeFormat === '12h' ? 'h' : 'H')}</span>
                                    <span className={cn(compactMode?"text-[8px]":"text-[9px]","opacity-80 -mt-0.5")}>{timeFormat === '12h' ? `${slot.dateTime.format('mm')} ${slot.dateTime.format('A')}` : slot.dateTime.format('mm')}</span>
                                    {isNow && !isSlotInRange && (
                                      <span className="absolute top-0.5 right-0.5 text-[9px] px-1 rounded-sm bg-primary/80 text-primary-foreground">Now</span>
                                    )}
                                  </div>
                                );
                            })}
                              </div>
                              {/* Selection overlay for this row (mapped to local time) */}
                              {(() => {
                                const tz = loc.selectedTimezone;
                                const localStart = selectedRange.start.tz(tz);
                                const localEnd = selectedRange.end.tz(tz);
                                const minutesFromDayStart = localStart.diff(localStart.startOf('day'), 'minute');
                                const durationMin = Math.max(SLOT_INTERVAL_MINUTES, localEnd.diff(localStart, 'minute'));
                                const leftPx = minutesFromDayStart * pxPerMinute;
                                const widthPx = durationMin * pxPerMinute;
                                return (
                                  <div
                                    className={cn("absolute top-0 bottom-0 rounded-sm border border-primary/70 bg-primary/30 backdrop-blur-[1px] shadow-sm cursor-grab", dragMode ? 'cursor-grabbing' : 'cursor-grab')}
                                    style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                                    role="slider"
                                    aria-label={`Selected ${localStart.format('LLL')} to ${localEnd.format('LLL')}`}
                                    onMouseDown={(e) => handleOverlayMouseDown(loc.id, 'move', e)}
                                  >
                                    {/* resize handles */}
                                    <div
                                      className="absolute inset-y-0 left-0 w-2 cursor-col-resize bg-primary/60/0 hover:bg-primary/20"
                                      onMouseDown={(e) => handleOverlayMouseDown(loc.id, 'resize-left', e)}
                                      aria-hidden
                                    />
                                    <div
                                      className="absolute inset-y-0 right-0 w-2 cursor-col-resize bg-primary/60/0 hover:bg-primary/20"
                                      onMouseDown={(e) => handleOverlayMouseDown(loc.id, 'resize-right', e)}
                                      aria-hidden
                                    />
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                           <Button variant="ghost" size="icon" className="h-full w-7 shrink-0 opacity-60 hover:opacity-100 rounded-none" onClick={() => handleTimeStripArrowScroll(loc.id, 'next')}>
                               <ChevronRight className="h-4 w-4"/>
                           </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </CardContent>
                <div className="pt-2 pb-3">
                  <p className="text-[10px] md:text-xs text-muted-foreground w-full text-center">
                    Click a time slot to set a reference. Drag to select a custom range. Use controls above to shift and resize.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

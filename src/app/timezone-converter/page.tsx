
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
// Removed unused Card components imports after audit
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, PlusCircle, XCircle, Pin, Home, ChevronLeft, ChevronRight, RotateCcw, Globe } from 'lucide-react';
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
const NUM_NAV_DAYS_EACH_SIDE = 2;


interface Location {
  id: string;
  selectedTimezone: string;
  isPinned?: boolean;
}

interface TimeSlotData {
  key: string;
  dateTime: dayjs.Dayjs; 
  hourNumber: number; // 0-23
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

  const [selectedRange, setSelectedRange] = useState<{ start: dayjs.Dayjs; end: dayjs.Dayjs }>({ start: dayjs().utc().startOf('hour'), end: dayjs().utc().startOf('hour').add(1, 'hour') });
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [dragAnchorSlotTime, setDragAnchorSlotTime] = useState<dayjs.Dayjs | null>(null); 
  

  const initialLocations = (): Location[] => {
    const guessedTimezone = dayjs.tz.guess();
    const validGuessedTz = isValidTz(guessedTimezone) ? guessedTimezone : 'UTC';
    return [
      { id: generateLocationId(), selectedTimezone: validGuessedTz, isPinned: true },
      { id: generateLocationId(), selectedTimezone: 'America/New_York' },
      { id: generateLocationId(), selectedTimezone: 'Europe/London' },
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
      return newLocs.filter(loc => loc && isValidTz(loc.selectedTimezone)).slice(0, MAX_LOCATIONS);
    });
  }, []);

 useEffect(() => {
    if (!isMounted || !selectedRange || !selectedRange.start.isValid() || locations.length === 0 || isDraggingSelection) return;
    
    setIsProgrammaticScroll(true);
    const effectiveSlotWidth = SLOT_WIDTH + SLOT_SPACING;

    locations.forEach(loc => {
      if (loc && loc.selectedTimezone && isValidTz(loc.selectedTimezone)) {
        const container = scrollableContainerRefs.current[loc.id];
        if (container) {
          const localSelectionStart = selectedRange.start.tz(loc.selectedTimezone);
          const targetHourIndex = localSelectionStart.hour(); 
          const desiredScrollPosition = targetHourIndex * effectiveSlotWidth;
          
          if (container.scrollLeft !== desiredScrollPosition) {
            container.scrollLeft = desiredScrollPosition;
          }
        }
      }
    });

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
    scrollSyncTimer = setTimeout(() => setIsProgrammaticScroll(false), 120);
  };

  const handleSlotMouseDown = (slotDateTimeInOriginalTz: dayjs.Dayjs) => {
    setIsDraggingSelection(true);
    const anchorUTC = slotDateTimeInOriginalTz.utc();
    setDragAnchorSlotTime(anchorUTC);
    setSelectedRange({ start: anchorUTC, end: anchorUTC.add(1, 'hour') });
  };

  const handleSlotMouseEnter = (slotDateTimeInOriginalTz: dayjs.Dayjs) => {
    if (isDraggingSelection && dragAnchorSlotTime) {
      const currentSlotUTC = slotDateTimeInOriginalTz.utc();
  const newStartUTC = dayjs.min(dragAnchorSlotTime, currentSlotUTC);
  const newEndUTC = dayjs.max(dragAnchorSlotTime, currentSlotUTC).add(1, 'hour'); 
      setSelectedRange({ start: newStartUTC, end: newEndUTC });
    }
  };
  
  const handleGlobalMouseUp = useCallback(() => {
    if (isDraggingSelection) {
      setIsDraggingSelection(false);
      setDragAnchorSlotTime(null); 
    }
  }, [isDraggingSelection]);

  const handleSingleSlotSelect = (slotDateTimeInOriginalTz: dayjs.Dayjs) => {
    const startUTC = slotDateTimeInOriginalTz.utc();
    const endUTC = startUTC.add(1, 'hour');
    setSelectedRange({ start: startUTC, end: endUTC });
    setIsDraggingSelection(false); 
    setDragAnchorSlotTime(null);
  };

  useEffect(() => {
    if (isDraggingSelection) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mouseleave', handleGlobalMouseUp); 
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('mouseleave', handleGlobalMouseUp);
      }
    }
  }, [isDraggingSelection, handleGlobalMouseUp]);

  const handleTimeStripArrowScroll = (locId: string, direction: 'prev' | 'next') => {
    const container = scrollableContainerRefs.current[locId];
    if (container) {
      const scrollAmount = container.clientWidth * 0.50 * (direction === 'prev' ? -1 : 1);
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  const generateTimeSlots = useCallback((locationTimezone: string, displayDateUTC: dayjs.Dayjs): TimeSlotData[] => {
    if (!isMounted || !isValidTz(locationTimezone) || !displayDateUTC.isValid()) return [];

    const slots: TimeSlotData[] = [];
    const localDisplayDayStart = displayDateUTC.tz(locationTimezone).startOf('day');
    const DAY_START_HOUR = 7; 
    const DAY_END_HOUR = 19; 

    for (let i = 0; i < 24; i++) { 
      const slotTimeInLocationTZ = localDisplayDayStart.add(i, 'hour');
      const hourOfDay = slotTimeInLocationTZ.hour();
      const dayOfWeek = slotTimeInLocationTZ.day(); 
      
      const isDay = hourOfDay >= DAY_START_HOUR && hourOfDay < DAY_END_HOUR;
      const isWknd = dayOfWeek === 0 || dayOfWeek === 6; 

      slots.push({
        key: `${locationTimezone}-${slotTimeInLocationTZ.toISOString()}-${i}`,
        dateTime: slotTimeInLocationTZ, 
        hourNumber: hourOfDay,
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

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
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
            
            <div className="space-y-2">
              <p className="text-muted-foreground text-center">Visually compare times across multiple timezones. Select a date and time range to see corresponding local times worldwide.</p>
            </div>
            
            <div className="bg-card rounded-lg border p-4 space-y-3">
              {/* Global Controls Wrapper */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-2 border rounded-md shadow-sm bg-muted/20">
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
              </div>

              <div className="space-y-1.5">
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
                          <p className="text-[10px] text-muted-foreground truncate ml-1 mt-1">{loc.selectedTimezone.replace(/_/g, ' ')}</p>
                          
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
                            <div className="flex space-x-px min-w-max h-full items-stretch">
                              {timeSlots.map(slot => {
                                const isSlotInRange = selectedRange && slot.dateTime.isBetween(selectedRange.start.tz(loc.selectedTimezone), selectedRange.end.tz(loc.selectedTimezone), 'hour', '[)');
                                
                                const slotBgColor = isSlotInRange
                                  ? "bg-primary/40 dark:bg-primary/50 border-primary/60"
                                  : slot.isWeekend
                                    ? (slot.isDayTime ? "bg-amber-100/70 dark:bg-amber-900/30" : "bg-amber-200/20 dark:bg-amber-800/10")
                                    : (slot.isDayTime ? "bg-sky-100/70 dark:bg-sky-900/30" : "bg-slate-100/70 dark:bg-slate-800/20");
                                
                                const slotTextColor = isSlotInRange
                                  ? "text-primary-foreground dark:text-primary-foreground" 
                                  : slot.isWeekend
                                    ? (slot.isDayTime ? "text-amber-700 dark:text-amber-300" : "text-amber-600 dark:text-amber-400")
                                    : (slot.isDayTime ? "text-sky-700 dark:text-sky-300" : "text-slate-600 dark:text-slate-400");

                                return (
                                <button
                                  key={slot.key}
                                  type="button"
                                  onMouseDown={() => handleSlotMouseDown(slot.dateTime)}
                                  onMouseEnter={() => handleSlotMouseEnter(slot.dateTime)}
                                  onClick={() => handleSingleSlotSelect(slot.dateTime)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      handleSingleSlotSelect(slot.dateTime);
                                    }
                                    if (e.key === 'ArrowRight') {
                                      const next = slot.dateTime.add(1,'hour');
                                      handleSingleSlotSelect(next);
                                    }
                                    if (e.key === 'ArrowLeft') {
                                      const prev = slot.dateTime.subtract(1,'hour');
                                      handleSingleSlotSelect(prev);
                                    }
                                  }}
                                  aria-pressed={isSlotInRange}
                                  aria-label={`Hour ${slot.dateTime.format(timeFormat === '12h' ? 'h A' : 'HH:00')} ${slot.isWeekend ? 'weekend' : 'weekday'} ${slot.isDayTime ? 'daytime' : 'night'}`}
                                  className={cn(
                                    "relative flex flex-col items-center justify-center rounded-sm border select-none focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-1",
                                    "leading-tight transition-colors duration-75 h-[52px] py-0.5",
                                    "hover:border-primary/70 hover:bg-primary/5 dark:hover:bg-white/5",
                                    isSlotInRange ? 'cursor-pointer' : 'cursor-pointer',
                                    slotBgColor,
                                    slotTextColor
                                  )}
                                  style={{width: `${SLOT_WIDTH}px`}}
                                >
                                  <span className={cn("text-base font-medium", isSlotInRange ? "font-bold" : "")}>{slot.dateTime.format(timeFormat === '12h' ? 'h' : 'H')}</span>
                                  {timeFormat === '12h' && <span className="text-[9px] opacity-80 -mt-0.5">{slot.dateTime.format('A')}</span>}
                                </button>
                              );
                            })}
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
              </div>
              
              <div className="pt-2 pb-3">
                <p className="text-[10px] md:text-xs text-muted-foreground w-full text-center">
                  Click an hour slot to set a 1-hour reference. Drag to select a custom range.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

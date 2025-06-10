
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, CalendarIcon, PlusCircle, XCircle, Pin, ChevronLeft, ChevronRight, Home } from 'lucide-react';
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

const MAX_LOCATIONS = 10;
const DAY_START_HOUR = 7; 
const DAY_END_HOUR = 19; 
const SLOT_WIDTH = 36; 
const DAY_MARKER_SLOT_WIDTH = 48; 
const SLOT_SPACING = 1; // Corresponds to space-x-px

interface Location {
  id: string;
  selectedTimezone: string;
  isPinned?: boolean;
}

interface TimeSlot {
  key: string;
  dateTime: dayjs.Dayjs; // This dateTime is always in the timezone of its row
  hourNumber: number;
  isDayTime: boolean;
  isWeekend: boolean;
  isStartOfNewDayMarker: boolean;
}

let locationIdCounter = 0;
const generateLocationId = () => `loc-${locationIdCounter++}-${Date.now()}`;

const isValidTz = (tzName: string): boolean => {
  if (!tzName) return false;
  try {
    dayjs().tz(tzName); // Test conversion
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

  const [selectedRange, setSelectedRange] = useState<{ start: dayjs.Dayjs; end: dayjs.Dayjs } | null>(() => {
    const now = dayjs().startOf('hour');
    return { start: now.utc(), end: now.add(1, 'hour').utc() }; // Default to 1 hour selection, in UTC
  });
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [dragAnchorSlotTime, setDragAnchorSlotTime] = useState<dayjs.Dayjs | null>(null); // Anchor time in UTC

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
    
    const now = dayjs().startOf('hour');
    setSelectedRange({ start: now.utc(), end: now.add(1, 'hour').utc() });

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
          if (!newLocs.some(l => l.selectedTimezone === defaultTimezones[defaultIdx])) {
              newLocs.push({id: generateLocationId(), selectedTimezone: defaultTimezones[defaultIdx]});
          }
          defaultIdx++;
      }
      return newLocs.filter(loc => loc && isValidTz(loc.selectedTimezone)).slice(0, MAX_LOCATIONS);
    });
  }, []);

 useEffect(() => {
    if (!isMounted || !selectedRange || !selectedRange.start.isValid() || locations.length === 0 || isDraggingSelection) return;
    
    setIsProgrammaticScroll(true);

    locations.forEach(loc => {
      if (loc && loc.selectedTimezone && isValidTz(loc.selectedTimezone)) {
        const container = scrollableContainerRefs.current[loc.id];
        if (container) {
          const localSelectionStart = selectedRange.start.tz(loc.selectedTimezone);
          // Determine the first slot's time in this strip based on how generateTimeSlots works
          // generateTimeSlots centers around selectedRange.start, usually startOf('day').subtract(1, 'day')
          const firstSlotDateTimeInStrip = selectedRange.start.tz(loc.selectedTimezone).startOf('day').subtract(1, 'day');
          
          let scrollOffset = 0;
          let currentHourIter = firstSlotDateTimeInStrip;

          // Calculate offset to the target slot (start of the selected hour)
          while(currentHourIter.isBefore(localSelectionStart.startOf('hour'), 'hour')) {
              if (currentHourIter.hour() === 0 && !currentHourIter.isSame(firstSlotDateTimeInStrip, 'hour')) {
                  scrollOffset += (DAY_MARKER_SLOT_WIDTH + SLOT_SPACING);
              } else {
                  scrollOffset += (SLOT_WIDTH + SLOT_SPACING);
              }
              currentHourIter = currentHourIter.add(1, 'hour');
          }
          
          // Try to center the target or at least bring it into view from the left
          const targetScrollLeft = Math.max(0, scrollOffset - (container.clientWidth / 3));
          container.scrollLeft = targetScrollLeft;
        }
      }
    });

    const timer = setTimeout(() => setIsProgrammaticScroll(false), 250); 
    return () => clearTimeout(timer);
  }, [selectedRange, locations, isMounted, isDraggingSelection]);


  const handleGlobalDateChange = (date: Date | undefined) => {
    if (date && selectedRange && dayjs(date).isValid()) {
      const newDatePart = dayjs(date); // This is in local timezone of the calendar
      const oldStartUTC = selectedRange.start;
      const duration = dayjs.duration(selectedRange.end.diff(selectedRange.start));

      // Preserve time of day from oldStartUTC, but change the date part based on newDatePart
      // Convert newDatePart to UTC first based on user's local timezone (where calendar was clicked)
      const newStartDateUTC = dayjs(newDatePart).hour(oldStartUTC.hour()).minute(oldStartUTC.minute()).second(oldStartUTC.second()).utc();
      
      const newEndDateUTC = newStartDateUTC.add(duration);
      
      setSelectedRange({ start: newStartDateUTC, end: newEndDateUTC });
    }
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

  const handleAddLocationFromSearch = () => {
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

  const handleStripScroll = (scrolledLocId: string, event: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScroll || isDraggingSelection) return; 
    const scrollLeft = event.currentTarget.scrollLeft;
    setIsProgrammaticScroll(true);
    Object.keys(scrollableContainerRefs.current).forEach(locId => {
      if (locId !== scrolledLocId) {
        const container = scrollableContainerRefs.current[locId];
        if (container) container.scrollLeft = scrollLeft;
      }
    });
    const timer = setTimeout(() => setIsProgrammaticScroll(false), 100); 
    return () => clearTimeout(timer);
  };

  const handleSlotMouseDown = (slotDateTimeInOriginalTz: dayjs.Dayjs) => {
    setIsDraggingSelection(true);
    const anchorUTC = slotDateTimeInOriginalTz.utc();
    setDragAnchorSlotTime(anchorUTC);
    setSelectedRange({ start: anchorUTC, end: anchorUTC.add(1, 'hour') }); // Initial 1hr selection
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
      document.addEventListener('mouseleave', handleGlobalMouseUp); // Handle mouse leaving window
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('mouseleave', handleGlobalMouseUp);
      }
    }
  }, [isDraggingSelection, handleGlobalMouseUp]);

  const handleTimeStripArrowScroll = (locId: string, direction: 'prev' | 'next') => {
    const container = scrollableContainerRefs.current[locId];
    if (container) {
      const scrollAmount = container.clientWidth * 0.50 * (direction === 'prev' ? -1 : 1); // Scroll by half viewport
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const generateTimeSlots = useCallback((locationTimezone: string, viewCenterTimeInUTC: dayjs.Dayjs): TimeSlot[] => {
    if (!isMounted || !isValidTz(locationTimezone) || !viewCenterTimeInUTC.isValid()) return [];

    const slots: TimeSlot[] = [];
    const localViewCenter = viewCenterTimeInUTC.tz(locationTimezone);
    // Generate slots for previous day, current day, and next day relative to the view center
    const stripStartTime = localViewCenter.startOf('day').subtract(1, 'day');
    const totalHoursToGenerate = 72; // 3 days worth of slots

    for (let i = 0; i < totalHoursToGenerate; i++) { 
      const slotTimeInLocationTZ = stripStartTime.add(i, 'hour');
      const hourOfDay = slotTimeInLocationTZ.hour();
      const dayOfWeek = slotTimeInLocationTZ.day(); 
      
      const isDay = hourOfDay >= DAY_START_HOUR && hourOfDay < DAY_END_HOUR;
      const isWknd = dayOfWeek === 0 || dayOfWeek === 6; 
      
      // A slot is a day marker if it's the first hour of the day (00:00)
      const isNewDayMarker = hourOfDay === 0;

      slots.push({
        key: `${locationTimezone}-${slotTimeInLocationTZ.toISOString()}-${i}`,
        dateTime: slotTimeInLocationTZ, 
        hourNumber: hourOfDay,
        isDayTime: isDay,
        isWeekend: isWknd,
        isStartOfNewDayMarker: isNewDayMarker,
      });
    }
    return slots;
  }, [isMounted]); 
  
  if (!isMounted || !selectedRange || !selectedRange.start.isValid()) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:p-6">
        <p>Loading World Time View...</p>
      </div>
    );
  }

  const referenceDateForCalendar = selectedRange.start.toDate(); // Use UTC start for calendar default

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden">
              <PanelLeft />
            </SidebarTrigger>
            <h1 className="text-xl font-semibold font-headline">World Time View</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-2 md:p-4 lg:p-6">
          <Card className="w-full max-w-full mx-auto shadow-lg"> {/* Max width full for better space usage */}
            <CardHeader className="pb-3 pt-4 px-3 md:px-4">
              <CardTitle className="text-xl md:text-2xl font-headline text-center">World Time View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-2 md:p-3 lg:p-4">
              <div className="p-2 border rounded-md shadow-sm bg-muted/20 space-y-2.5">
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant={"outline"} size="icon" className="shrink-0 h-8 w-8 md:h-9 md:w-9">
                              <CalendarIcon className="h-4 w-4 md:h-5 md:w-5" />
                               <span className="sr-only">Open Calendar</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={referenceDateForCalendar} onSelect={handleGlobalDateChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <p className="text-xs md:text-sm font-medium whitespace-nowrap">
                            {selectedRange.start.format('ddd, MMM D, YYYY')} (UTC)
                        </p>
                    </div>
                     <div className="flex items-center space-x-1.5">
                        <Switch
                            id="time-format-toggle"
                            checked={timeFormat === '12h'}
                            onCheckedChange={(checked) => setTimeFormat(checked ? '12h' : '24h')}
                            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input h-5 w-9 [&>span]:h-4 [&>span]:w-4 [&>span[data-state=checked]]:translate-x-4"
                        />
                        <Label htmlFor="time-format-toggle" className="text-xs md:text-sm whitespace-nowrap">12-hour</Label>
                    </div>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <TimezoneCombobox 
                        value={adderTimezoneValue}
                        onValueChange={setAdderTimezoneValue}
                        placeholder="Search and add timezone..."
                        className="flex-grow h-9 text-xs md:text-sm"
                    />
                    <Button onClick={handleAddLocationFromSearch} size="sm" className="h-9 px-3 text-xs md:text-sm">
                        <PlusCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" /> Add
                    </Button>
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
                  const dateFormatString = "ddd, MMM D";

                  return (
                    <div key={loc.id} className="py-1.5 border-b last:border-b-0">
                      <div className="flex flex-col md:flex-row items-stretch gap-x-2 gap-y-1.5">
                        {/* Left: Controls and Timezone Info */}
                        <div className="w-full md:w-[200px] lg:w-[240px] shrink-0 pr-1 md:pr-2 space-y-0.5 flex-col">
                          <div className="flex items-center gap-1 justify-between">
                            <div className="flex items-center gap-1 flex-grow min-w-0">
                                <Button variant="ghost" size="icon" onClick={() => handlePinLocation(loc.id)} title={`Set ${loc.selectedTimezone.split('/').pop()?.replace(/_/g, ' ')} as primary`} 
                                        className={cn("h-6 w-6 p-0.5 shrink-0", loc.isPinned ? "text-primary" : "text-muted-foreground hover:text-primary")}>
                                    {loc.isPinned ? <Home className="h-4 w-4"/> : <Pin className="h-4 w-4" />}
                                </Button>
                                <TimezoneCombobox
                                  value={loc.selectedTimezone}
                                  onValueChange={(tz) => handleLocationTimezoneChange(loc.id, tz)}
                                  placeholder="Select timezone"
                                  className="text-xs font-semibold w-full h-7 truncate"
                                />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveLocation(loc.id)} disabled={locations.length <= 1} className="text-muted-foreground hover:text-destructive h-6 w-6 p-0.5 shrink-0">
                                <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate ml-1">{loc.selectedTimezone.replace(/_/g, ' ')}</p>
                          <p className="text-xs font-semibold ml-1 mt-0.5 truncate">
                            {localSelectedStart.format(timeFormatString)} - {localSelectedEnd.format(timeFormatString)}
                          </p>
                          <p className="text-[10px] text-muted-foreground ml-1 truncate">
                            {localSelectedStart.format(dateFormatString)}
                            {!localSelectedStart.isSame(localSelectedEnd.subtract(1, 'millisecond'), 'day') ? ` - ${localSelectedEnd.subtract(1, 'millisecond').format(dateFormatString)}` : ''}
                          </p>
                        </div>
                        
                        {/* Right: Time Slot Panel */}
                        <div className="flex-grow flex items-center min-w-0">
                           <Button variant="ghost" size="icon" className="h-full w-7 shrink-0 opacity-60 hover:opacity-100 rounded-none" onClick={() => handleTimeStripArrowScroll(loc.id, 'prev')}>
                               <ChevronLeft className="h-4 w-4"/>
                           </Button>
                           <div
                            ref={el => scrollableContainerRefs.current[loc.id] = el}
                            onScroll={(e) => handleStripScroll(loc.id, e)}
                            className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-muted/20 flex-grow h-full"
                            style={{ cursor: isDraggingSelection ? 'grabbing': 'default'}}
                          >
                            <div className="flex space-x-px min-w-max h-full items-stretch"> {/* items-stretch for consistent height */}
                              {timeSlots.map(slot => {
                                const isSlotInRange = slot.dateTime.isBetween(localSelectedStart, localSelectedEnd, 'hour', '[)');
                                
                                const slotBgColor = isSlotInRange
                                  ? "bg-primary/30 dark:bg-primary/40 border-primary/50"
                                  : slot.isStartOfNewDayMarker 
                                    ? "bg-muted dark:bg-muted/40"
                                    : slot.isWeekend
                                      ? (slot.isDayTime ? "bg-amber-100 dark:bg-amber-700/10" : "bg-amber-200/20 dark:bg-amber-800/10")
                                      : (slot.isDayTime ? "bg-sky-100 dark:bg-sky-700/10" : "bg-slate-100 dark:bg-slate-700/10");
                                
                                const slotTextColor = isSlotInRange
                                  ? "text-primary-foreground dark:text-primary-foreground" 
                                  : slot.isStartOfNewDayMarker
                                    ? "text-foreground"
                                    : slot.isWeekend
                                      ? (slot.isDayTime ? "text-amber-700 dark:text-amber-300" : "text-amber-600 dark:text-amber-400")
                                      : (slot.isDayTime ? "text-sky-700 dark:text-sky-300" : "text-slate-600 dark:text-slate-400");

                                const currentSlotWidth = slot.isStartOfNewDayMarker ? DAY_MARKER_SLOT_WIDTH : SLOT_WIDTH;

                                return (
                                <div
                                  key={slot.key}
                                  onMouseDown={() => handleSlotMouseDown(slot.dateTime)}
                                  onMouseEnter={() => handleSlotMouseEnter(slot.dateTime)}
                                  onClick={() => handleSingleSlotSelect(slot.dateTime)}
                                  className={cn(
                                    "flex flex-col items-center justify-center rounded-sm border cursor-grab select-none",
                                    "leading-tight transition-colors duration-75 h-full py-0.5", 
                                    "hover:border-primary/70 hover:bg-primary/5 dark:hover:bg-white/5",
                                    slotBgColor,
                                    slotTextColor
                                  )}
                                  style={{width: `${currentSlotWidth}px`}}
                                >
                                  {slot.isStartOfNewDayMarker ? (
                                    <>
                                      <span className="text-[9px] font-medium uppercase tracking-wider">{slot.dateTime.format('ddd')}</span>
                                      <span className="text-[10px] font-bold uppercase">{slot.dateTime.format('MMM D')}</span>
                                    </>
                                  ) : (
                                    <>
                                    <span className={cn("text-xs md:text-sm font-medium", isSlotInRange ? "font-bold" : "")}>
                                      {slot.dateTime.format(timeFormat === '12h' ? 'h' : 'H')}
                                    </span>
                                    {timeFormat === '12h' && <span className="text-[8px] md:text-[9px] opacity-80 -mt-0.5">{slot.dateTime.format('A')}</span>}
                                    </>
                                  )}
                                </div>
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
            </CardContent>
             <CardFooter className="pt-2 pb-3 px-3 md:px-4">
                <p className="text-[10px] md:text-xs text-muted-foreground w-full text-center">
                  Drag on time strips to select a range. Pin a location to make it primary. Click calendar to change date.
                </p>
              </CardFooter>
          </Card>
        </div>
      </SidebarInset>
    </>
  );
}


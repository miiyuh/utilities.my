
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
import timezone from 'dayjs/plugin/timezone';
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
dayjs.extend(timezone);
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
const SLOT_WIDTH = 36; // For hourly slots
const DAY_MARKER_SLOT_WIDTH = 48; 
const SLOT_SPACING = 1; // Corresponds to space-x-px
const SLOTS_PER_DAY = 24; // Hourly slots

interface Location {
  id: string;
  selectedTimezone: string;
  isPinned?: boolean;
}

interface TimeSlot {
  key: string;
  dateTime: dayjs.Dayjs;
  hourNumber: number;
  isDayTime: boolean;
  isWeekend: boolean;
  isStartOfNewDayMarker: boolean; // True if this slot represents a day transition label
}

let locationIdCounter = 0;
const generateLocationId = () => `loc-${locationIdCounter++}-${Date.now()}`;

const isValidTz = (tzName: string): boolean => {
  if (!tzName) return false;
  try {
    const testDate = dayjs().tz(tzName);
    return testDate.isValid();
  } catch (e) {
    return false;
  }
};

export default function TimezoneConverterPage() {
  const { toast } = useToast();
  const [referenceDateTime, setReferenceDateTime] = useState<dayjs.Dayjs>(dayjs().startOf('hour'));
  const [isMounted, setIsMounted] = useState(false);
  const scrollableContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h'); 
  const [adderTimezoneValue, setAdderTimezoneValue] = useState('');

  const [selectedRange, setSelectedRange] = useState<{ start: dayjs.Dayjs; end: dayjs.Dayjs } | null>(() => {
    const now = dayjs().startOf('hour');
    return { start: now, end: now.add(1, 'hour') }; // Default to 1 hour selection
  });
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [dragAnchorSlotTime, setDragAnchorSlotTime] = useState<dayjs.Dayjs | null>(null);
  const [dragOriginalLocationId, setDragOriginalLocationId] = useState<string | null>(null);


  const initialLocations = (): Location[] => {
    const guessedTimezone = dayjs.tz.guess();
    const validGuessedTz = isValidTz(guessedTimezone) ? guessedTimezone : 'UTC';
    return [
      { id: generateLocationId(), selectedTimezone: validGuessedTz, isPinned: true },
      { id: generateLocationId(), selectedTimezone: 'America/New_York' },
      { id: generateLocationId(), selectedTimezone: 'Europe/London' },
    ].filter(Boolean).slice(0, MAX_LOCATIONS);
  };
  const [locations, setLocations] = useState<Location[]>(initialLocations());

  useEffect(() => {
    setIsMounted(true);
    const guessedTimezone = dayjs.tz.guess();
    const validGuessedTz = isValidTz(guessedTimezone) ? guessedTimezone : 'UTC';
    
    setReferenceDateTime(dayjs().startOf('hour')); 
    setSelectedRange({ start: dayjs().startOf('hour'), end: dayjs().add(1, 'hour').startOf('hour')});

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
      
      // Ensure other default locations are unique
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
    if (!isMounted || !selectedRange || !selectedRange.start.isValid() || locations.length === 0) return;
    setIsProgrammaticScroll(true);
    const pinnedLocation = locations.find(l => l.isPinned) || locations[0];

    locations.forEach(loc => {
      if (loc && loc.selectedTimezone && isValidTz(loc.selectedTimezone)) {
        const container = scrollableContainerRefs.current[loc.id];
        if (container) {
          // Calculate scroll based on the start of the selected range in the pinned/primary timezone
          const primarySelectionStartInLocTZ = selectedRange.start.tz(loc.selectedTimezone);
          const referenceSlotIndex = primarySelectionStartInLocTZ.hour();
          
          // Calculate needed scroll. Consider if a day marker is before this slot.
          let pixelsToScroll = 0;
          for(let i=0; i < referenceSlotIndex; i++) {
              const slotTime = primarySelectionStartInLocTZ.startOf('day').add(i, 'hour');
              if (slotTime.hour() === 0 && i !== 0) { // is a day marker (but not the very first slot)
                  pixelsToScroll += (DAY_MARKER_SLOT_WIDTH + SLOT_SPACING);
              } else {
                  pixelsToScroll += (SLOT_WIDTH + SLOT_SPACING);
              }
          }
          const targetScrollLeft = pixelsToScroll - (container.clientWidth / 4); // Center-ish
          container.scrollLeft = Math.max(0, targetScrollLeft);
        }
      }
    });

    const timer = setTimeout(() => {
      setIsProgrammaticScroll(false);
    }, 200); 
    return () => clearTimeout(timer);
  }, [selectedRange, locations, isMounted]);


  const handleGlobalDateChange = (date: Date | undefined) => {
    if (date && selectedRange && dayjs(date).isValid()) {
      const newDatePart = dayjs(date);
      const oldStartDate = selectedRange.start;
      const duration = dayjs.duration(selectedRange.end.diff(selectedRange.start));

      const newStartDate = oldStartDate
        .year(newDatePart.year())
        .month(newDatePart.month())
        .date(newDatePart.date());
      const newEndDate = newStartDate.add(duration);
      
      setReferenceDateTime(newStartDate);
      setSelectedRange({ start: newStartDate, end: newEndDate });
    }
  };
  
  const handlePinLocation = (idToPin: string) => {
    setLocations(prevLocs => {
        const newLocs = prevLocs.map(loc => ({
            ...loc,
            isPinned: loc.id === idToPin,
        }));
        // Ensure the pinned location is at the top
        const pinnedItem = newLocs.find(loc => loc.isPinned);
        if (pinnedItem) {
            return [pinnedItem, ...newLocs.filter(loc => !loc.isPinned)];
        }
        return newLocs; // Should not happen if an item was found
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
        newLocs[0].isPinned = true; // Pin the new top one
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

  const handleSlotMouseDown = (slotDateTimeInOriginalTz: dayjs.Dayjs, originalLocId: string) => {
    setIsDraggingSelection(true);
    setDragAnchorSlotTime(slotDateTimeInOriginalTz); // Anchor time in its original timezone
    setDragOriginalLocationId(originalLocId);
    
    // Convert anchor to UTC for consistent range setting
    const anchorUTC = slotDateTimeInOriginalTz.utc();
    setSelectedRange({ start: anchorUTC, end: anchorUTC.add(1, 'hour') }); // Initial 1hr selection
  };

  const handleSlotMouseEnter = (slotDateTimeInOriginalTz: dayjs.Dayjs) => {
    if (isDraggingSelection && dragAnchorSlotTime && dragOriginalLocationId) {
      const currentSlotUTC = slotDateTimeInOriginalTz.utc();
      const anchorUTC = dragAnchorSlotTime.utc(); // Convert anchor to UTC here too for comparison
      
      const newStartUTC = dayjs.min(anchorUTC, currentSlotUTC);
      const newEndUTC = dayjs.max(anchorUTC, currentSlotUTC).add(1, 'hour'); // Ranges are inclusive start, exclusive end (1hr per slot)
      setSelectedRange({ start: newStartUTC, end: newEndUTC });
    }
  };
  
  const handleGlobalMouseUp = useCallback(() => {
    if (isDraggingSelection) {
      setIsDraggingSelection(false);
      setDragAnchorSlotTime(null); 
      setDragOriginalLocationId(null);
    }
  }, [isDraggingSelection]);

  useEffect(() => {
    if (isDraggingSelection) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDraggingSelection, handleGlobalMouseUp]);

  const handleTimeStripArrowScroll = (locId: string, direction: 'prev' | 'next') => {
    const container = scrollableContainerRefs.current[locId];
    if (container) {
      const scrollAmount = container.clientWidth * 0.75 * (direction === 'prev' ? -1 : 1);
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const generateTimeSlots = useCallback((locationTimezone: string): TimeSlot[] => {
    if (!isMounted || !isValidTz(locationTimezone) || !selectedRange) return [];

    const slots: TimeSlot[] = [];
    // Generate slots for a window around the current view, e.g., -24 to +48 hours from selection start in this TZ
    const viewCenterTime = selectedRange.start.tz(locationTimezone);
    const stripStartTime = viewCenterTime.subtract(24, 'hour').startOf('day');
    const totalHoursToGenerate = 72; // 3 days worth of slots

    for (let i = 0; i < totalHoursToGenerate * SLOTS_PER_DAY / 24; i++) { 
      const slotTimeInLocationTZ = stripStartTime.add(i, 'hour');
      const hourOfDay = slotTimeInLocationTZ.hour();
      const dayOfWeek = slotTimeInLocationTZ.day(); 
      
      const isDay = hourOfDay >= DAY_START_HOUR && hourOfDay < DAY_END_HOUR;
      const isWknd = dayOfWeek === 0 || dayOfWeek === 6; 
      
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
  }, [isMounted, selectedRange]); 
  
  if (!isMounted || !selectedRange || !selectedRange.start.isValid()) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:p-6">
        <p>Loading World Time View...</p>
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
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden">
              <PanelLeft />
            </SidebarTrigger>
            <h1 className="text-xl font-semibold font-headline">World Time View</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <Card className="w-full max-w-full mx-auto shadow-lg"> {/* Changed to max-w-full */}
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-center">World Time View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-2 border rounded-md shadow-sm bg-muted/20 space-y-3">
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-2 md:gap-4">
                    <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant={"outline"} size="icon" className="shrink-0">
                              <CalendarIcon className="h-5 w-5" />
                               <span className="sr-only">Open Calendar</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={selectedRange.start.toDate()} onSelect={handleGlobalDateChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <p className="text-sm font-medium">
                            {selectedRange.start.format('ddd, MMM D, YYYY')}
                        </p>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch
                            id="time-format-toggle"
                            checked={timeFormat === '12h'}
                            onCheckedChange={(checked) => setTimeFormat(checked ? '12h' : '24h')}
                        />
                        <Label htmlFor="time-format-toggle" className="text-xs whitespace-nowrap">12-hour</Label>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 px-1">
                    <TimezoneCombobox 
                        value={adderTimezoneValue}
                        onValueChange={setAdderTimezoneValue}
                        placeholder="Search and add timezone..."
                        className="flex-grow"
                    />
                    <Button onClick={handleAddLocationFromSearch} size="sm">
                        <PlusCircle className="h-4 w-4 mr-1 md:mr-2" /> Add
                    </Button>
                 </div>
              </div>

              <div className="space-y-1.5"> {/* Reduced space between location rows */}
                {locations.map((loc) => {
                  if (!loc || !loc.selectedTimezone || !isValidTz(loc.selectedTimezone)) return null;
                  
                  const localSelectionStart = selectedRange.start.tz(loc.selectedTimezone);
                  const localSelectionEnd = selectedRange.end.tz(loc.selectedTimezone);
                  if (!localSelectionStart.isValid() || !localSelectionEnd.isValid()) return null;

                  const timeSlots = generateTimeSlots(loc.selectedTimezone);
                  const timeFormatString = timeFormat === '12h' ? 'h:mm A' : 'HH:mm';

                  return (
                    <div key={loc.id} className="py-2 border-b last:border-b-0"> {/* Minimal padding, border between rows */}
                      <div className="flex items-stretch gap-x-2"> {/* Use items-stretch */}
                        {/* Left: Controls and Timezone Info */}
                        <div className="flex flex-col w-[180px] sm:w-[200px] md:w-[240px] shrink-0 pr-2 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handlePinLocation(loc.id)} title={`Set ${loc.selectedTimezone.split('/').pop()?.replace(/_/g, ' ')} as primary`} 
                                    className={cn("h-6 w-6 p-0.5", loc.isPinned ? "text-primary" : "text-muted-foreground hover:text-primary")}>
                                {loc.isPinned ? <Home className="h-4 w-4"/> : <Pin className="h-4 w-4" />}
                            </Button>
                            <div className="flex-grow min-w-0">
                                <TimezoneCombobox
                                  value={loc.selectedTimezone}
                                  onValueChange={(tz) => handleLocationTimezoneChange(loc.id, tz)}
                                  placeholder="Select timezone"
                                  className="text-sm font-semibold w-full h-8"
                                />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveLocation(loc.id)} disabled={locations.length <= 1} className="text-muted-foreground hover:text-destructive h-6 w-6 p-0.5">
                                <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground truncate ml-1">{loc.selectedTimezone.replace(/_/g, ' ')}</p>
                          <p className="text-sm font-semibold ml-1 mt-1">
                            {localSelectionStart.format(timeFormatString)} - {localSelectionEnd.format(timeFormatString)}
                          </p>
                          <p className="text-xs text-muted-foreground ml-1">
                            {localSelectionStart.format('ddd, MMM D')}
                            {!localSelectionStart.isSame(localSelectionEnd.subtract(1, 'hour'), 'day') ? ` - ${localSelectionEnd.subtract(1, 'hour').format('ddd, MMM D')}` : ''}
                          </p>
                        </div>
                        
                        {/* Right: Time Slot Panel */}
                        <div className="flex-grow flex items-center min-w-0">
                           <Button variant="ghost" size="icon" className="h-full w-8 shrink-0 opacity-70 hover:opacity-100" onClick={() => handleTimeStripArrowScroll(loc.id, 'prev')}>
                               <ChevronLeft/>
                           </Button>
                           <div
                            ref={el => scrollableContainerRefs.current[loc.id] = el}
                            onScroll={(e) => handleStripScroll(loc.id, e)}
                            className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-muted/20 flex-grow h-full" // Ensure div takes height for centering items
                            style={{ cursor: isDraggingSelection ? 'grabbing': 'default'}}
                          >
                            <div className="flex space-x-px min-w-max h-full"> {/* h-full for child centering */}
                              {timeSlots.map(slot => {
                                const isSelected = slot.dateTime.isBetween(selectedRange.start.tz(loc.selectedTimezone), selectedRange.end.tz(loc.selectedTimezone), 'hour', '[)');
                                const slotCurrentWidth = slot.isStartOfNewDayMarker ? DAY_MARKER_SLOT_WIDTH : SLOT_WIDTH;
                                
                                const slotBgColor = isSelected
                                  ? "bg-primary/30 dark:bg-primary/40 border-primary/50"
                                  : slot.isWeekend
                                    ? (slot.isDayTime ? "bg-amber-100 dark:bg-amber-700/20" : "bg-amber-200/30 dark:bg-amber-800/20")
                                    : (slot.isDayTime ? "bg-sky-100 dark:bg-sky-700/20" : "bg-slate-100 dark:bg-slate-700/20");
                                
                                const slotTextColor = isSelected
                                  ? "text-primary-foreground dark:text-primary-foreground" 
                                  : slot.isWeekend
                                    ? (slot.isDayTime ? "text-amber-700 dark:text-amber-300" : "text-amber-600 dark:text-amber-400")
                                    : (slot.isDayTime ? "text-sky-700 dark:text-sky-300" : "text-slate-600 dark:text-slate-400");


                                return (
                                <div
                                  key={slot.key}
                                  onMouseDown={() => handleSlotMouseDown(slot.dateTime, loc.id)}
                                  onMouseEnter={() => handleSlotMouseEnter(slot.dateTime)}
                                  className={cn(
                                    "flex flex-col items-center justify-center rounded-sm border cursor-grab select-none",
                                    "leading-tight transition-colors duration-100 h-full", // h-full here
                                    "hover:border-primary/70 hover:bg-primary/10 dark:hover:bg-white/10",
                                    slotBgColor,
                                    slotTextColor
                                  )}
                                  style={{width: `${slotCurrentWidth}px`}}
                                >
                                  {slot.isStartOfNewDayMarker ? (
                                    <>
                                      <span className="text-[10px] font-medium uppercase">{slot.dateTime.format('ddd')}</span>
                                      <span className="text-xs uppercase">{slot.dateTime.format('MMM D')}</span>
                                    </>
                                  ) : (
                                    <span className={cn("text-sm font-medium", isSelected ? "font-bold" : "")}>
                                      {slot.dateTime.format(timeFormat === '12h' ? 'h' : 'H')}
                                      {timeFormat === '12h' && <span className="text-[9px] opacity-80 ml-px">{slot.dateTime.format('A')}</span>}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            </div>
                          </div>
                           <Button variant="ghost" size="icon" className="h-full w-8 shrink-0 opacity-70 hover:opacity-100" onClick={() => handleTimeStripArrowScroll(loc.id, 'next')}>
                               <ChevronRight/>
                           </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground w-full text-center">
                  Drag on time strips to select a range. Pin a location to make it primary. Click calendar to change date.
                </p>
              </CardFooter>
          </Card>
        </div>
      </SidebarInset>
    </>
  );
}


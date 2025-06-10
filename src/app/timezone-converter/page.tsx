
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, CalendarIcon, PlusCircle, XCircle, PinIcon } from 'lucide-react';
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
import isoWeek from 'dayjs/plugin/isoWeek'; // For day() to get day of week consistently
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


const MAX_LOCATIONS = 10;
const DAY_START_HOUR = 7; 
const DAY_END_HOUR = 19; // Up to 18:59 is daytime
const VISIBLE_DAYS_IN_NAV = 7; // e.g., 3 before, current, 3 after

interface Location {
  id: string;
  selectedTimezone: string;
}

interface HourSlot {
  key: string;
  dateTime: dayjs.Dayjs;
  hourNumber: number;
  isDayTime: boolean;
  isWeekend: boolean;
  isReferenceHour: boolean;
  displayDayDateLabel: boolean; // True if this is the first hour of a new day relative to the previous slot
  previousSlotDateTime?: dayjs.Dayjs; // To help determine if day changed
}

let locationIdCounter = 0;
const generateLocationId = () => `loc-${locationIdCounter++}-${Date.now()}`;

const isValidTz = (tzName: string): boolean => {
  if (!tzName) return false;
  try {
    // Attempting a conversion is a more robust check than dayjs.tz.zone
    const testDate = dayjs().tz(tzName);
    return testDate.isValid();
  } catch (e) {
    return false;
  }
};

export default function TimezoneConverterPage() {
  const { toast } = useToast();
  const [referenceDateTime, setReferenceDateTime] = useState<dayjs.Dayjs>(dayjs());
  const [isMounted, setIsMounted] = useState(false);
  const scrollableContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false);

  const initialLocations = (): Location[] => {
    const guessedTimezone = dayjs.tz.guess();
    return [
      { id: generateLocationId(), selectedTimezone: isValidTz(guessedTimezone) ? guessedTimezone : 'UTC' },
      { id: generateLocationId(), selectedTimezone: 'America/New_York' },
      { id: generateLocationId(), selectedTimezone: 'Europe/London' },
    ].filter(Boolean).slice(0, MAX_LOCATIONS);
  };
  const [locations, setLocations] = useState<Location[]>(initialLocations());

  useEffect(() => {
    setIsMounted(true);
    const guessedTimezone = dayjs.tz.guess();
    const validGuessedTz = isValidTz(guessedTimezone) ? guessedTimezone : 'UTC';
    setReferenceDateTime(dayjs()); 

    setLocations(prevLocs => {
      let newLocs = prevLocs.map(loc => ({...loc, selectedTimezone: isValidTz(loc.selectedTimezone) ? loc.selectedTimezone : 'UTC'}));
      
      if (newLocs.length > 0 && newLocs[0]) {
        newLocs[0].selectedTimezone = validGuessedTz;
      } else {
        newLocs = [{ id: generateLocationId(), selectedTimezone: validGuessedTz }, ...newLocs.slice(1)];
      }
      
      const defaultTz2 = 'America/New_York';
      const defaultTz3 = 'Europe/London';

      if (newLocs.length >= 2 && newLocs[1]) {
         if (newLocs[1].selectedTimezone === validGuessedTz) {
            newLocs[1].selectedTimezone = defaultTz2 === validGuessedTz ? 'Asia/Tokyo' : defaultTz2;
         }
      } else if (newLocs.length < 2) {
         newLocs.push({id: generateLocationId(), selectedTimezone: defaultTz2 === validGuessedTz ? 'Asia/Tokyo' : defaultTz2 });
      }

      if (newLocs.length >= 3 && newLocs[2]) {
         if (newLocs[2].selectedTimezone === validGuessedTz || newLocs[2].selectedTimezone === newLocs[1]?.selectedTimezone) {
            newLocs[2].selectedTimezone = defaultTz3 === validGuessedTz || defaultTz3 === newLocs[1]?.selectedTimezone ? 'Australia/Sydney' : defaultTz3;
         }
      } else if (newLocs.length < 3) {
        newLocs.push({id: generateLocationId(), selectedTimezone: defaultTz3 === validGuessedTz || defaultTz3 === newLocs[1]?.selectedTimezone ? 'Australia/Sydney' : defaultTz3 });
      }
      
      return newLocs.filter(loc => loc && isValidTz(loc.selectedTimezone)).slice(0, MAX_LOCATIONS);
    });

  }, []);


  const handleGlobalDateChange = (date: Date | undefined) => {
    if (date && referenceDateTime && dayjs(date).isValid()) {
      const newDatePart = dayjs(date);
      const newDateTime = referenceDateTime
        .year(newDatePart.year())
        .month(newDatePart.month())
        .date(newDatePart.date());
      setReferenceDateTime(newDateTime);
    }
  };
  
  const handleDateNavClick = (date: dayjs.Dayjs) => {
     if (date && referenceDateTime && date.isValid()) {
        const newDateTime = referenceDateTime
        .year(date.year())
        .month(date.month())
        .date(date.date());
      setReferenceDateTime(newDateTime);
     }
  };

  const handleSetAsReference = (locationTimezone: string) => {
    if (!referenceDateTime || !isMounted || !isValidTz(locationTimezone)) return;
    
    // Get the current referenceDateTime, but interpreted in the target location's timezone
    // Then convert this moment back to the system's default/UTC to store as the new global reference
    const newGlobalReference = referenceDateTime.tz(locationTimezone); 
    setReferenceDateTime(newGlobalReference);
    toast({ title: "Reference Updated", description: `Timeline now centered around current time in ${locationTimezone.replace(/_/g, ' ')}.`});
  };


  const handleHourSlotClick = (slotDateTime: dayjs.Dayjs) => {
     if (slotDateTime && slotDateTime.isValid()) {
        setReferenceDateTime(slotDateTime);
     }
  };

  const handleAddLocation = () => {
    if (locations.length >= MAX_LOCATIONS) {
      toast({ title: 'Location Limit Reached', description: `You can add up to ${MAX_LOCATIONS} locations.`, variant: 'default' });
      return;
    }
    const newLocationId = generateLocationId();
    const existingTimezones = locations.map(l => l.selectedTimezone);
    let defaultNewTimezone = 'Asia/Tokyo';
    const commonTimezones = ['Australia/Sydney', 'Europe/Paris', 'America/Los_Angeles', 'Asia/Dubai', 'Pacific/Honolulu', 'Africa/Johannesburg', 'Asia/Kolkata', 'America/Chicago', 'Asia/Shanghai'];
    for (const tz of commonTimezones) {
        if (!existingTimezones.includes(tz) && isValidTz(tz)) {
            defaultNewTimezone = tz;
            break;
        }
    }
    if (existingTimezones.includes(defaultNewTimezone) || !isValidTz(defaultNewTimezone)) {
         const allSupported = Intl.supportedValuesOf('timeZone');
         defaultNewTimezone = allSupported.find(tz => !existingTimezones.includes(tz) && isValidTz(tz)) || 'UTC';
    }
    setLocations(prev => [...prev, { id: newLocationId, selectedTimezone: defaultNewTimezone }]);
  };

  const handleRemoveLocation = (idToRemove: string) => {
    if (locations.length <= 1) {
      toast({ title: 'Cannot Remove', description: 'At least one location is required.', variant: 'default' });
      return;
    }
    setLocations(prev => prev.filter(l => {
      if (l.id === idToRemove) {
        if (scrollableContainerRefs.current[idToRemove]) {
          delete scrollableContainerRefs.current[idToRemove];
        }
        return false;
      }
      return true;
    }));
  };

  const handleLocationTimezoneChange = (idToUpdate: string, newTimezone: string) => {
    if (isValidTz(newTimezone)) {
      setLocations(prev => prev.map(l => l.id === idToUpdate ? { ...l, selectedTimezone: newTimezone } : l));
    } else {
      toast({title: "Invalid Timezone", description: `Could not apply timezone: ${newTimezone}`, variant: "destructive"})
    }
  };

  const handleStripScroll = (scrolledLocId: string, event: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScroll) return;

    const scrollLeft = event.currentTarget.scrollLeft;
    
    setIsProgrammaticScroll(true);
    
    Object.keys(scrollableContainerRefs.current).forEach(locId => {
      if (locId !== scrolledLocId) {
        const container = scrollableContainerRefs.current[locId];
        if (container) {
          container.scrollLeft = scrollLeft;
        }
      }
    });
    
    setTimeout(() => {
      setIsProgrammaticScroll(false);
    }, 50); 
  };

  const generateHourSlots = useCallback((locationTimezone: string, globalRefDateTime: dayjs.Dayjs): HourSlot[] => {
    if (!isMounted || !isValidTz(locationTimezone) || !globalRefDateTime.isValid()) return [];

    const slots: HourSlot[] = [];
    // Start from the beginning of the day of the globalRefDateTime in the *location's timezone*
    // and show 24 hours from there.
    const startOfStripDayInLocationTZ = globalRefDateTime.tz(locationTimezone).startOf('day');

    for (let i = 0; i < 24; i++) { // Generate 24 slots for the day
      const slotTimeInLocationTZ = startOfStripDayInLocationTZ.add(i, 'hour');
      const hourOfDay = slotTimeInLocationTZ.hour();
      const dayOfWeek = slotTimeInLocationTZ.day(); // 0 for Sunday, 6 for Saturday

      const isDay = hourOfDay >= DAY_START_HOUR && hourOfDay < DAY_END_HOUR;
      const isWknd = dayOfWeek === 0 || dayOfWeek === 6;

      // Check if this slotTimeInLocationTZ corresponds to the globalRefDateTime's exact hour
      const isRef = slotTimeInLocationTZ.isSame(globalRefDateTime.tz(locationTimezone), 'hour');
      
      let displayDayDate = false;
      if (i === 0) { // First slot always shows its date info
        displayDayDate = true;
      } else {
        const prevSlotTime = startOfStripDayInLocationTZ.add(i - 1, 'hour');
        if (!slotTimeInLocationTZ.isSame(prevSlotTime, 'day')) {
          displayDayDate = true;
        }
      }

      slots.push({
        key: `${locationTimezone}-${slotTimeInLocationTZ.toISOString()}-${i}`,
        dateTime: slotTimeInLocationTZ, // This is the actual time of the slot in its own TZ
        hourNumber: hourOfDay,
        isDayTime: isDay,
        isWeekend: isWknd,
        isReferenceHour: isRef,
        displayDayDateLabel: displayDayDate,
        previousSlotDateTime: i > 0 ? startOfStripDayInLocationTZ.add(i-1, 'hour') : undefined
      });
    }
    return slots;
  }, [isMounted]);
  
  const dateNavItems = Array.from({ length: VISIBLE_DAYS_IN_NAV }).map((_, i) => {
    const offset = i - Math.floor(VISIBLE_DAYS_IN_NAV / 2);
    return referenceDateTime.add(offset, 'day');
  });


  if (!isMounted || !referenceDateTime || !referenceDateTime.isValid()) {
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
          <Card className="w-full max-w-5xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-center">World Time View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-2 border rounded-md shadow-sm bg-muted/20">
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant={"outline"} size="icon" className="shrink-0">
                          <CalendarIcon className="h-5 w-5" />
                           <span className="sr-only">Open Calendar</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={referenceDateTime.toDate()} onSelect={handleGlobalDateChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <div className="flex items-center justify-center gap-0.5 overflow-x-auto scrollbar-thin py-1">
                        {dateNavItems.map(dateItem => (
                            <Button
                                key={dateItem.toISOString()}
                                variant={dateItem.isSame(referenceDateTime, 'day') ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleDateNavClick(dateItem)}
                                className={cn(
                                    "flex flex-col items-center justify-center h-auto px-2 py-1.5 leading-tight text-xs min-w-[40px]",
                                    dateItem.isSame(referenceDateTime, 'day') ? "shadow-md" : ""
                                )}
                            >
                                <span>{dateItem.format('ddd')}</span>
                                <span>{dateItem.format('D')}</span>
                                {dateItem.day() === 0 || dateItem.day() === 6 ? <span className="text-[8px] opacity-80">{dateItem.format('MMM')}</span> : null}
                            </Button>
                        ))}
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                {locations.map((loc) => {
                  if (!loc || !loc.selectedTimezone || !referenceDateTime || !isValidTz(loc.selectedTimezone)) return null;
                  
                  const hourSlots = generateHourSlots(loc.selectedTimezone, referenceDateTime);
                  const currentLocalTimeForFirstSlot = hourSlots.length > 0 ? hourSlots[0].dateTime : dayjs().tz(loc.selectedTimezone); // Fallback for safety
                  const utcOffset = currentLocalTimeForFirstSlot.format('Z');
                  const timezoneAbbr = currentLocalTimeForFirstSlot.format('z');

                  return (
                    <div key={loc.id} className="p-3 border rounded-md shadow-sm">
                      <div className="flex flex-col md:flex-row items-stretch gap-3">
                        {/* Left: Controls and Timezone Info */}
                        <div className="flex md:flex-col items-center justify-start md:justify-center gap-1 md:w-auto py-1 md:py-0 shrink-0 md:pr-2 md:border-r">
                           <Button variant="ghost" size="icon" onClick={() => handleSetAsReference(loc.selectedTimezone)} title={`Set reference to ${loc.selectedTimezone.replace(/_/g, ' ')}`} className="text-muted-foreground hover:text-primary h-6 w-6 p-1">
                            <PinIcon className="h-3.5 w-3.5" />
                          </Button>
                           <Button variant="ghost" size="icon" onClick={() => handleRemoveLocation(loc.id)} disabled={locations.length <= 1} className="text-muted-foreground hover:text-destructive h-6 w-6 p-1">
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="flex-grow md:w-1/4 lg:w-1/5 space-y-0.5 pr-3 border-b md:border-b-0 md:border-r pb-3 md:pb-0 mb-3 md:mb-0 shrink-0">
                          <TimezoneCombobox
                            value={loc.selectedTimezone}
                            onValueChange={(tz) => handleLocationTimezoneChange(loc.id, tz)}
                            placeholder="Select timezone"
                            className="text-sm font-semibold w-full"
                          />
                          <p className="text-xs text-muted-foreground truncate mt-1">{loc.selectedTimezone.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{timezoneAbbr} (GMT{utcOffset})</p>
                        </div>
                        
                        {/* Right: Hour Strip */}
                        <div className="flex-grow md:w-3/4 lg:w-4/5 flex flex-col">
                           <div
                            ref={el => scrollableContainerRefs.current[loc.id] = el}
                            onScroll={(e) => handleStripScroll(loc.id, e)}
                            className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                          >
                            <div className="flex space-x-px min-w-max py-1"> {/* Use space-x-px for minimal gap */}
                              {hourSlots.map(slot => (
                                <div
                                  key={slot.key}
                                  onClick={() => handleHourSlotClick(slot.dateTime)}
                                  className={cn(
                                    "flex flex-col items-center justify-center p-1 rounded-sm w-[38px] h-[48px] text-center border cursor-pointer relative",
                                    "leading-tight transition-colors duration-100 text-xs",
                                    "hover:border-primary/70 hover:bg-primary/10 dark:hover:bg-white/10",
                                    slot.isReferenceHour && "border-2 border-primary ring-2 ring-primary/50 shadow-md z-10",
                                    !slot.isReferenceHour && [
                                      slot.isWeekend 
                                        ? (slot.isDayTime ? "bg-amber-100 dark:bg-amber-800/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700" 
                                                          : "bg-amber-200/60 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400/80 border-amber-300/70 dark:border-amber-800/60")
                                        : (slot.isDayTime ? "bg-sky-100 dark:bg-sky-800/30 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700" 
                                                          : "bg-slate-200 dark:bg-slate-700/40 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600")
                                    ]
                                  )}
                                >
                                  {slot.displayDayDateLabel && (
                                      <div className="absolute -top-4 left-0 w-full text-[9px] font-medium text-muted-foreground whitespace-nowrap">
                                          {slot.dateTime.format('ddd MMM D')}
                                      </div>
                                  )}
                                  <span className={cn("text-base font-medium", slot.isReferenceHour && "text-primary dark:text-accent-foreground")}>
                                    {slot.hourNumber}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
               <Button variant="outline" onClick={handleAddLocation} disabled={locations.length >= MAX_LOCATIONS} className="w-full mt-2">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Location ({locations.length}/{MAX_LOCATIONS})
              </Button>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground w-full text-center">
                  Click an hour slot to set it as global reference. Scroll strips horizontally. Dates at top navigate days.
                </p>
              </CardFooter>
          </Card>
        </div>
      </SidebarInset>
    </>
  );
}

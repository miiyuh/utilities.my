
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, CalendarIcon, ClockIcon, PlusCircle, XCircle, PinIcon } from 'lucide-react';
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

const MAX_LOCATIONS = 10;
const HOURS_AROUND_REFERENCE = 12; 
const DAY_START_HOUR = 7; 
const DAY_END_HOUR = 19; 


interface Location {
  id: string;
  selectedTimezone: string;
}

interface HourSlot {
  key: string;
  dateTime: dayjs.Dayjs;
  isRefHour: boolean;
  isDifferentDayFromRowMain: boolean;
  isDayTime: boolean;
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
  const [referenceDateTime, setReferenceDateTime] = useState<dayjs.Dayjs>(dayjs());
  const [isMounted, setIsMounted] = useState(false);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
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

  const handleGlobalTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (referenceDateTime) {
      const timeValue = e.target.value;
      const parts = timeValue.split(':').map(Number);
      const hours = parts[0] !== undefined ? parts[0] : referenceDateTime.hour();
      const minutes = parts[1] !== undefined ? parts[1] : referenceDateTime.minute();
      const seconds = parts[2] !== undefined ? parts[2] : referenceDateTime.second();

      if (!isNaN(hours) && !isNaN(minutes)) {
        const newDateTime = referenceDateTime.hour(hours).minute(minutes).second(seconds || 0).millisecond(0);
        setReferenceDateTime(newDateTime);
      }
    }
  };

  const handleSetAsReference = (locationTimezone: string) => {
    if (!referenceDateTime || !isMounted || !isValidTz(locationTimezone)) return;
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
    
    // Use a timeout to allow the programmatic scroll to finish before re-enabling user-triggered sync
    setTimeout(() => {
      setIsProgrammaticScroll(false);
    }, 100); // Adjust timeout as needed, 100ms is a common starting point
  };

  const generateHourSlots = useCallback((locationTimezone: string, mainRowDateTime: dayjs.Dayjs): HourSlot[] => {
    if (!isMounted || !isValidTz(locationTimezone) || !mainRowDateTime.isValid()) return [];

    const baseTimeInLocation = mainRowDateTime;
    const slots: HourSlot[] = [];

    for (let i = -HOURS_AROUND_REFERENCE; i <= HOURS_AROUND_REFERENCE; i++) {
      const slotTime = baseTimeInLocation.add(i, 'hour');
      const hourOfDay = slotTime.hour();
      const isDay = hourOfDay >= DAY_START_HOUR && hourOfDay < DAY_END_HOUR;

      slots.push({
        key: `${locationTimezone}-${slotTime.toISOString()}-${i}`,
        dateTime: slotTime,
        isRefHour: i === 0,
        isDifferentDayFromRowMain: !slotTime.isSame(mainRowDateTime, 'day'),
        isDayTime: isDay,
      });
    }
    return slots;
  }, [isMounted]);


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
              <div className="p-4 border rounded-md shadow-sm bg-muted/20">
                 <div className="flex flex-col items-center gap-2 md:flex-row md:flex-wrap md:justify-between md:gap-2 md:gap-y-3 lg:gap-x-4">
                  <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                    <Label className="text-base font-medium whitespace-nowrap md:text-lg">Reference:</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal min-w-[180px] sm:w-auto",
                            !referenceDateTime && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {referenceDateTime ? referenceDateTime.format("MMM D, YYYY") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={referenceDateTime.toDate()} onSelect={handleGlobalDateChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <div className="relative w-full sm:w-auto min-w-[120px]">
                      <ClockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="time" value={referenceDateTime.format("HH:mm:ss")} onChange={handleGlobalTimeChange} className="pl-10" step="1" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="time-format-toggle"
                      checked={timeFormat === '24h'}
                      onCheckedChange={(checked) => setTimeFormat(checked ? '24h' : '12h')}
                    />
                    <Label htmlFor="time-format-toggle" className="text-sm whitespace-nowrap">24-hour format</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {locations.map((loc) => {
                  if (!loc || !loc.selectedTimezone || !referenceDateTime || !isValidTz(loc.selectedTimezone)) return null;
                  const localTimeForRow = referenceDateTime.tz(loc.selectedTimezone);
                  if (!localTimeForRow.isValid()) return null;

                  const hourSlots = generateHourSlots(loc.selectedTimezone, localTimeForRow);
                  const utcOffset = localTimeForRow.format('Z');
                  const timezoneAbbr = localTimeForRow.format('z');

                  return (
                    <div key={loc.id} className="p-3 border rounded-md shadow-sm">
                      <div className="flex flex-col md:flex-row items-stretch gap-3">
                        <div className="flex md:flex-col items-center justify-start md:justify-center gap-1 md:w-auto py-1 md:py-0 shrink-0">
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

                          <p className="text-2xl font-bold pt-2">
                            {localTimeForRow.format(timeFormat === '12h' ? 'h:mm A' : 'HH:mm')}
                          </p>
                          <p className="text-sm text-muted-foreground">{localTimeForRow.format('ddd, MMM D, YYYY')}</p>
                        </div>
                        
                        <div className="flex-grow md:w-3/4 lg:w-4/5 flex flex-col">
                          <div className="text-center text-sm font-medium text-muted-foreground py-1.5 border-b mb-1">
                            {localTimeForRow.format('dddd, MMMM D, YYYY')}
                          </div>
                          <div
                            ref={el => scrollableContainerRefs.current[loc.id] = el}
                            onScroll={(e) => handleStripScroll(loc.id, e)}
                            className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                          >
                            <div className="flex space-x-0.5 min-w-max">
                              {hourSlots.map(slot => {
                                const showDayAbbreviation = slot.isDifferentDayFromRowMain;
                                return (
                                <div
                                  key={slot.key}
                                  onClick={() => handleHourSlotClick(slot.dateTime)}
                                  className={cn(
                                    "flex flex-col items-center justify-center p-1.5 rounded-md w-[52px] h-[52px] text-center text-[10px] border cursor-pointer",
                                    "leading-tight transition-colors duration-150",
                                    "hover:border-primary/70 hover:bg-primary/5 dark:hover:bg-white/5",
                                    slot.isRefHour && [
                                      "border-primary ring-1 ring-primary shadow-md font-semibold",
                                      "bg-primary/20 text-primary-foreground dark:bg-accent dark:text-accent-foreground",
                                    ],
                                    !slot.isRefHour && [
                                      slot.isDayTime
                                        ? "bg-background text-foreground dark:bg-muted/30 dark:text-foreground"
                                        : "bg-muted/60 text-muted-foreground dark:bg-muted/50 dark:text-muted-foreground",
                                      slot.isDifferentDayFromRowMain && "opacity-80 dark:opacity-75"
                                    ]
                                  )}
                                >
                                  <span className={cn("text-lg font-bold", slot.isRefHour ? "" : "text-foreground/90 dark:text-foreground/80")}>
                                    {slot.dateTime.format(timeFormat === '12h' ? 'h' : 'H')}
                                  </span>
                                  {timeFormat === '12h' && (
                                    <span className={cn("text-[10px] uppercase", slot.isRefHour ? "opacity-90" : "text-muted-foreground")}>
                                      {slot.dateTime.format('A')}
                                    </span>
                                  )}
                                  {showDayAbbreviation && (
                                    <span className={cn("text-[9px] uppercase mt-0.5", slot.isRefHour ? "opacity-80" : "text-muted-foreground/70")}>
                                      {slot.dateTime.format('ddd')}
                                    </span>
                                  )}
                                </div>
                              )})}
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
                  Click an hour slot to set it as reference. Pin a location to center timeline on its current time. Times update automatically.
                </p>
              </CardFooter>
          </Card>
        </div>
      </SidebarInset>
    </>
  );
}


    
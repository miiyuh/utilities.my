
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, CalendarIcon, ClockIcon, PlusCircle, XCircle, PinIcon } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrAfter'; // Corrected import, though not directly used, good for consistency
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'; // Corrected import
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
const HOURS_AROUND_REFERENCE = 7; // e.g., 7 before + current + 7 after = 15 slots
const DAY_START_HOUR = 7; // 7 AM
const DAY_END_HOUR = 18; // 6 PM (inclusive, so up to 18:59)


interface Location {
  id: string;
  selectedTimezone: string;
}

interface HourSlot {
  key: string;
  dateTime: dayjs.Dayjs;
  isRefHour: boolean;
  isDifferentDayFromRow: boolean;
  isDifferentMonthFromRow: boolean;
  isDayTime: boolean;
}

let locationIdCounter = 0;
const generateLocationId = () => `loc-${locationIdCounter++}-${Date.now()}`;

export default function TimezoneConverterPage() {
  const { toast } = useToast();
  const [referenceDateTime, setReferenceDateTime] = useState<dayjs.Dayjs>(dayjs.utc());
  const [isMounted, setIsMounted] = useState(false);

  const [locations, setLocations] = useState<Location[]>([
    { id: generateLocationId(), selectedTimezone: 'UTC' },
    { id: generateLocationId(), selectedTimezone: 'America/New_York' },
    { id: generateLocationId(), selectedTimezone: 'Europe/London' },
  ]);

  useEffect(() => {
    setIsMounted(true);
    setReferenceDateTime(dayjs()); // Set to client's local time AFTER mount
    setLocations(prevLocs => {
      const newLocs = [...prevLocs];
      const guessedTimezone = dayjs.tz.guess();
      if (newLocs.length > 0) {
        newLocs[0].selectedTimezone = guessedTimezone;
      } else {
        newLocs.push({ id: generateLocationId(), selectedTimezone: guessedTimezone });
      }
      // Ensure initial 3 locations are distinct if possible
      if (newLocs.length >= 3) {
          const tzSet = new Set<string>();
          tzSet.add(newLocs[0].selectedTimezone);

          if (!tzSet.has('America/New_York')) {
              newLocs[1].selectedTimezone = 'America/New_York';
              tzSet.add('America/New_York');
          } else if (!tzSet.has('Europe/London')) {
              newLocs[1].selectedTimezone = 'Europe/London';
              tzSet.add('Europe/London');
          } else {
              newLocs[1].selectedTimezone = 'Asia/Tokyo'; // fallback
              tzSet.add('Asia/Tokyo');
          }
          
          if (!tzSet.has('Europe/London')) {
              newLocs[2].selectedTimezone = 'Europe/London';
          } else if (!tzSet.has('Asia/Tokyo')) {
              newLocs[2].selectedTimezone = 'Asia/Tokyo';
          } else {
               newLocs[2].selectedTimezone = 'Australia/Sydney'; // fallback
          }
      }
      return newLocs;
    });
  }, []);


  const handleGlobalDateChange = (date: Date | undefined) => {
    if (date && referenceDateTime) {
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
      
      const newDateTime = referenceDateTime.hour(hours).minute(minutes).second(seconds).millisecond(0);
      setReferenceDateTime(newDateTime);
    }
  };

  const handleSetAsReference = (locationTimezone: string) => {
    if (!referenceDateTime) return;
    // The referenceDateTime already represents an instant.
    // We want the new referenceDateTime to be such that the local time in `locationTimezone` *at its reference hour slot*
    // becomes the anchor. The reference hour slot for any row is `referenceDateTime.tz(locationTimezone)`.
    // So, we are effectively re-centering on the current time of that location.
    const newRef = referenceDateTime.tz(locationTimezone);
    setReferenceDateTime(newRef); // This sets the new reference to be the local time of the pinned zone
    toast({ title: "Reference Updated", description: `Timeline now centered around current time in ${locationTimezone.replace(/_/g, ' ')}.`});
  };

  const handleHourSlotClick = (slotDateTime: dayjs.Dayjs) => {
    setReferenceDateTime(slotDateTime);
    toast({ title: "Reference Time Updated", description: `Timeline now centered around ${slotDateTime.format('h:mm A, MMM D')} in ${slotDateTime.tz()?.format('Z z')}.` });
  };

  const handleAddLocation = () => {
    if (locations.length >= MAX_LOCATIONS) {
      toast({ title: 'Location Limit Reached', description: `You can add up to ${MAX_LOCATIONS} locations.`, variant: 'default' });
      return;
    }
    const newLocationId = generateLocationId();
    const existingTimezones = locations.map(l => l.selectedTimezone);
    let defaultNewTimezone = 'Asia/Tokyo';
    const commonTimezones = ['Australia/Sydney', 'Europe/Paris', 'America/Los_Angeles', 'Asia/Dubai', 'Pacific/Honolulu'];
    for (const tz of commonTimezones) {
        if (!existingTimezones.includes(tz)) {
            defaultNewTimezone = tz;
            break;
        }
    }
    // Fallback if all common are used
    if (existingTimezones.includes(defaultNewTimezone)) {
         const allSupported = Intl.supportedValuesOf('timeZone');
         defaultNewTimezone = allSupported.find(tz => !existingTimezones.includes(tz)) || 'UTC';
    }
    setLocations(prev => [...prev, { id: newLocationId, selectedTimezone: defaultNewTimezone }]);
  };

  const handleRemoveLocation = (idToRemove: string) => {
    if (locations.length <= 1) {
      toast({ title: 'Cannot Remove', description: 'At least one location is required.', variant: 'default' });
      return;
    }
    setLocations(prev => prev.filter(l => l.id !== idToRemove));
  };

  const handleLocationTimezoneChange = (idToUpdate: string, newTimezone: string) => {
    setLocations(prev => prev.map(l => l.id === idToUpdate ? { ...l, selectedTimezone: newTimezone } : l));
  };
  
  const generateHourSlots = useCallback((locationTimezone: string): HourSlot[] => {
    if (!referenceDateTime || !isMounted) return [];

    const baseTimeInLocation = referenceDateTime.tz(locationTimezone);
    const slots: HourSlot[] = [];
    const totalSlots = HOURS_AROUND_REFERENCE * 2 + 1; 

    for (let i = -HOURS_AROUND_REFERENCE; i <= HOURS_AROUND_REFERENCE; i++) {
      const slotTime = baseTimeInLocation.add(i, 'hour');
      const hourOfDay = slotTime.hour();
      const isDay = hourOfDay >= DAY_START_HOUR && hourOfDay <= DAY_END_HOUR;
      
      slots.push({
        key: `${locationTimezone}-${slotTime.toISOString()}-${i}`,
        dateTime: slotTime,
        isRefHour: i === 0,
        isDifferentDayFromRow: !slotTime.isSame(baseTimeInLocation, 'day'),
        isDifferentMonthFromRow: !slotTime.isSame(baseTimeInLocation, 'month'),
        isDayTime: isDay,
      });
    }
    return slots;
  }, [referenceDateTime, isMounted]);


  if (!isMounted || !referenceDateTime) {
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
          <Card className="w-full max-w-7xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-center">World Time View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 p-4 border rounded-md shadow-sm bg-muted/20">
                <Label className="text-lg font-medium text-center block">Set Reference Date & Time</Label>
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full sm:w-auto justify-start text-left font-normal min-w-[200px]",
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
                  <div className="relative w-full sm:w-auto min-w-[150px]">
                    <ClockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="time" value={referenceDateTime.format("HH:mm:ss")} onChange={handleGlobalTimeChange} className="pl-10" step="1" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {locations.map((loc) => {
                  const localTimeForRow = referenceDateTime.tz(loc.selectedTimezone);
                  const hourSlots = generateHourSlots(loc.selectedTimezone);
                  const utcOffset = localTimeForRow.format('Z'); // e.g. +08:00
                  const timezoneAbbr = localTimeForRow.format('z'); // e.g. MYT
                  
                  return (
                    <div key={loc.id} className="p-3 border rounded-md shadow-sm">
                      <div className="flex flex-col md:flex-row items-stretch gap-3">
                        <div className="flex md:flex-col items-center justify-start md:justify-center gap-1 md:w-12 py-1 md:py-0 shrink-0">
                           <Button variant="ghost" size="icon" onClick={() => handleSetAsReference(loc.selectedTimezone)} title={`Set reference to ${loc.selectedTimezone.replace(/_/g, ' ')}`} className="text-muted-foreground hover:text-primary h-7 w-7">
                            <PinIcon className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" onClick={() => handleRemoveLocation(loc.id)} disabled={locations.length <= 1} className="text-muted-foreground hover:text-destructive h-7 w-7">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex-grow md:w-1/4 lg:w-1/5 space-y-1 pr-3 border-b md:border-b-0 md:border-r pb-3 md:pb-0 mb-3 md:mb-0 shrink-0">
                          <TimezoneCombobox
                            value={loc.selectedTimezone}
                            onValueChange={(tz) => handleLocationTimezoneChange(loc.id, tz)}
                            placeholder="Select timezone"
                            className="text-sm font-semibold w-full"
                          />
                          <p className="text-xs text-muted-foreground truncate">{loc.selectedTimezone.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-muted-foreground">{timezoneAbbr} (GMT{utcOffset})</p>
                          
                          <p className="text-2xl font-bold pt-1">{localTimeForRow.format('h:mm')}<span className="text-lg font-normal">{localTimeForRow.format('A')}</span></p>
                          <p className="text-sm text-muted-foreground">{localTimeForRow.format('ddd, MMM D')}</p>
                        </div>

                        <div className="flex-grow md:w-3/4 lg:w-4/5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                          <div className="flex space-x-0.5 min-w-max">
                            {hourSlots.map(slot => (
                              <div
                                key={slot.key}
                                onClick={() => handleHourSlotClick(slot.dateTime)}
                                className={cn(
                                  "flex flex-col items-center justify-center p-1.5 rounded-md w-[60px] h-[65px] text-[10px] border cursor-pointer",
                                  "leading-tight transition-colors duration-150 hover:border-primary/70 hover:bg-primary/5",
                                  slot.isRefHour ? "border-primary ring-1 ring-primary shadow-md bg-primary/10" 
                                                : slot.isDayTime ? "bg-background dark:bg-muted/20" : "bg-muted/50 dark:bg-muted/40",
                                  (slot.isDifferentDayFromRow || slot.isDifferentMonthFromRow) && !slot.isRefHour ? "opacity-75" : "",
                                  slot.isDayTime ? "text-foreground" : "text-muted-foreground",
                                  slot.isRefHour && slot.isDayTime ? "text-primary-foreground dark:text-primary font-semibold" : "",
                                  slot.isRefHour && !slot.isDayTime ? "text-primary-foreground dark:text-primary font-semibold": "",
                                )}
                              >
                                <span className={cn("font-medium uppercase", (slot.isDifferentDayFromRow) ? "opacity-80" : "opacity-90")}>{slot.dateTime.format('ddd')}</span>
                                <span className={cn("uppercase", slot.isDifferentMonthFromRow ? "font-semibold" : "", (slot.isDifferentDayFromRow) ? "opacity-80" : "opacity-90")}>
                                  {slot.isDifferentMonthFromRow || slot.isDifferentDayFromRow || slot.isRefHour ? slot.dateTime.format('MMM D') : ""}
                                </span>
                                <span className={cn("text-base font-semibold mt-0.5", (slot.isDifferentDayFromRow && !slot.isRefHour) ? "opacity-70" : "")}>{slot.dateTime.format('h')}</span>
                                <span className={cn("uppercase", (slot.isDifferentDayFromRow) ? "opacity-80" : "opacity-90")}>{slot.dateTime.format('A')}</span>
                              </div>
                            ))}
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

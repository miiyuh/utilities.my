
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, CalendarIcon, ClockIcon, PlusCircle, XCircle } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const defaultTimezones = Intl.supportedValuesOf('timeZone');
const MAX_TARGETS = 5;

interface TargetTimezone {
  id: string;
  selectedTimezone: string;
  convertedDateTime: string | null;
}

let targetIdCounter = 0;
const generateTargetId = () => `target-${targetIdCounter++}`;

export default function TimezoneConverterPage() {
  const { toast } = useToast();
  const [sourceDateTime, setSourceDateTime] = useState<dayjs.Dayjs>(dayjs());
  const [sourceTimezone, setSourceTimezone] = useState<string>(dayjs.tz.guess());
  
  const [targets, setTargets] = useState<TargetTimezone[]>(() => [
    { id: generateTargetId(), selectedTimezone: dayjs.tz.guess(), convertedDateTime: null },
    { id: generateTargetId(), selectedTimezone: 'UTC', convertedDateTime: null },
  ]);

  const calculateConvertedTimes = useCallback(() => {
    if (!sourceDateTime || !sourceTimezone) {
      setTargets(prevTargets => 
        prevTargets.map(t => ({ ...t, convertedDateTime: 'Source data incomplete.' }))
      );
      return;
    }

    setTargets(prevTargets => 
      prevTargets.map(target => {
        if (!target.selectedTimezone) {
          return { ...target, convertedDateTime: 'Please select target timezone.' };
        }
        try {
          const sourceInSourceTz = dayjs(sourceDateTime.format("YYYY-MM-DD HH:mm:ss")).tz(sourceTimezone, true);
          const targetInTargetTz = sourceInSourceTz.tz(target.selectedTimezone);
          return { ...target, convertedDateTime: targetInTargetTz.format("YYYY-MM-DD HH:mm:ss (z)") };
        } catch (error) {
          toast({ title: `Error converting to ${target.selectedTimezone}`, description: String(error), variant: 'destructive' });
          return { ...target, convertedDateTime: 'Error during conversion.' };
        }
      })
    );
  }, [sourceDateTime, sourceTimezone, toast]); // `targets` itself is not a dependency here as we are setting it

  useEffect(() => {
    calculateConvertedTimes();
  }, [sourceDateTime, sourceTimezone, targets.map(t => t.selectedTimezone).join(','), calculateConvertedTimes]);


  const handleDateChange = (date: Date | undefined) => {
    if (date) {
        const newDatePart = dayjs(date);
        const newDateTime = sourceDateTime
            .year(newDatePart.year())
            .month(newDatePart.month())
            .date(newDatePart.date());
        setSourceDateTime(newDateTime);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value; // HH:mm or HH:mm:ss
    const parts = timeValue.split(':').map(Number);
    const hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    const seconds = parts[2] || 0;
    
    const newDateTime = sourceDateTime.hour(hours).minute(minutes).second(seconds).millisecond(0);
    setSourceDateTime(newDateTime);
  };

  const handleAddTarget = () => {
    if (targets.length >= MAX_TARGETS) {
      toast({ title: 'Target Limit Reached', description: `You can add up to ${MAX_TARGETS} target timezones.`, variant: 'default' });
      return;
    }
    const newTargetId = generateTargetId();
    // Try to pick a different default timezone if possible
    const existingTargetTimezones = targets.map(t => t.selectedTimezone);
    let defaultNewTimezone = 'America/New_York';
    if (existingTargetTimezones.includes(defaultNewTimezone)) {
        defaultNewTimezone = defaultTimezones.find(tz => !existingTargetTimezones.includes(tz)) || 'Europe/London';
    }

    setTargets(prev => [...prev, { id: newTargetId, selectedTimezone: defaultNewTimezone, convertedDateTime: null }]);
  };

  const handleRemoveTarget = (idToRemove: string) => {
    if (targets.length <= 1) {
      toast({ title: 'Cannot Remove', description: 'At least one target timezone is required.', variant: 'default' });
      return;
    }
    setTargets(prev => prev.filter(t => t.id !== idToRemove));
  };

  const handleTargetTimezoneChange = (idToUpdate: string, newTimezone: string) => {
    setTargets(prev => prev.map(t => t.id === idToUpdate ? { ...t, selectedTimezone: newTimezone } : t));
  };

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
            <h1 className="text-xl font-semibold font-headline">Timezone Converter</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-3xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Timezone Converter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Source Section */}
                <div className="space-y-4 p-4 border rounded-md shadow-sm">
                  <h3 className="text-lg font-medium">Source Time</h3>
                  <div className="space-y-2">
                    <Label>Source Date & Time</Label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-2/3 justify-start text-left font-normal",
                              !sourceDateTime && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {sourceDateTime ? sourceDateTime.format("MMM D, YYYY") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={sourceDateTime.toDate()}
                            onSelect={handleDateChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <div className="relative w-1/3">
                          <ClockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                              type="time"
                              value={sourceDateTime.format("HH:mm:ss")}
                              onChange={handleTimeChange}
                              className="pl-10"
                              step="1"
                          />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sourceTimezone">Source Timezone</Label>
                    <Select value={sourceTimezone} onValueChange={setSourceTimezone}>
                      <SelectTrigger id="sourceTimezone">
                        <SelectValue placeholder="Select source timezone" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {defaultTimezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Targets Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Target Timezones</h3>
                        <Button variant="outline" size="sm" onClick={handleAddTarget} disabled={targets.length >= MAX_TARGETS}>
                            <PlusCircle className="mr-2 h-4 w-4"/> Add Target
                        </Button>
                    </div>
                  {targets.map((target, index) => (
                    <div key={target.id} className="p-4 border rounded-md shadow-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <Label htmlFor={`targetTimezone-${target.id}`}>Target Timezone {index + 1}</Label>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveTarget(target.id)} 
                            disabled={targets.length <= 1}
                            className="text-muted-foreground hover:text-destructive h-7 w-7"
                            title="Remove target timezone"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <Select 
                        value={target.selectedTimezone} 
                        onValueChange={(newValue) => handleTargetTimezoneChange(target.id, newValue)}
                      >
                        <SelectTrigger id={`targetTimezone-${target.id}`}>
                          <SelectValue placeholder="Select target timezone" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {defaultTimezones.map(tz => <SelectItem key={`${target.id}-${tz}`} value={tz}>{tz}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="space-y-1">
                        <Label htmlFor={`convertedTime-${target.id}`}>Converted Date & Time</Label>
                        <Input 
                            id={`convertedTime-${target.id}`} 
                            type="text" 
                            value={target.convertedDateTime || 'Calculating...'} 
                            readOnly 
                            className="font-mono bg-muted/30" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground w-full text-center">
                  Times update automatically. Max {MAX_TARGETS} target timezones.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

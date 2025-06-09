
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, CalendarIcon, ClockIcon } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { format, parseISO } from 'date-fns';
import { toZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const defaultTimezones = Intl.supportedValuesOf('timeZone');

export default function TimezoneConverterPage() {
  const { toast } = useToast();
  const [sourceDateTime, setSourceDateTime] = useState<Date>(new Date());
  const [sourceTimezone, setSourceTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [targetTimezone, setTargetTimezone] = useState<string>('UTC');
  const [convertedDateTime, setConvertedDateTime] = useState<string>('');

  useEffect(() => {
    convertTime();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceDateTime, sourceTimezone, targetTimezone]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
        const newDateTime = new Date(sourceDateTime);
        newDateTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        setSourceDateTime(newDateTime);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newDateTime = new Date(sourceDateTime);
    newDateTime.setHours(hours, minutes, 0, 0); // Reset seconds and milliseconds
    setSourceDateTime(newDateTime);
  };

  const convertTime = () => {
    if (!sourceDateTime || !sourceTimezone || !targetTimezone) {
      setConvertedDateTime('Please select all fields.');
      return;
    }
    try {
      const utcDate = zonedTimeToUtc(sourceDateTime, sourceTimezone);
      const targetDate = toZonedTime(utcDate, targetTimezone);
      setConvertedDateTime(format(targetDate, "yyyy-MM-dd HH:mm:ss (zzz)"));
      toast({ title: 'Time Converted', description: `Converted to ${targetTimezone}` });
    } catch (error) {
      setConvertedDateTime('Error during conversion.');
      toast({ title: 'Conversion Error', description: String(error), variant: 'destructive' });
    }
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
            <Card className="w-full max-w-2xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Timezone Converter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                          {sourceDateTime ? format(sourceDateTime, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={sourceDateTime}
                          onSelect={handleDateChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="relative w-1/3">
                        <ClockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="time"
                            value={format(sourceDateTime, "HH:mm")}
                            onChange={handleTimeChange}
                            className="pl-10"
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

                <div className="space-y-2">
                  <Label htmlFor="targetTimezone">Target Timezone</Label>
                  <Select value={targetTimezone} onValueChange={setTargetTimezone}>
                    <SelectTrigger id="targetTimezone">
                      <SelectValue placeholder="Select target timezone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {defaultTimezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={convertTime} className="w-full">Convert Time</Button>

                {convertedDateTime && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label>Converted Date & Time</Label>
                    <Input type="text" value={convertedDateTime} readOnly className="font-mono bg-muted/50" />
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground w-full text-center">
                  Uses your browser's current time as a default.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

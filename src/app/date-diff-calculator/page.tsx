
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, CalendarIcon, ClockIcon } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { format, differenceInYears, differenceInMonths, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, isValid } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DateDiff {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
}

export default function DateDiffCalculatorPage() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [diffResult, setDiffResult] = useState<DateDiff | null>(null);

  const handleDateTimeChange = (datePart: Date | undefined, timePart: string, setter: React.Dispatch<React.SetStateAction<Date>>, originalDate: Date) => {
    let newDate = datePart ? new Date(datePart) : new Date(originalDate); // Use original if datePart is undefined
    
    if (timePart) {
        const [hours, minutes] = timePart.split(':').map(Number);
        newDate.setHours(hours || 0, minutes || 0, 0, 0); 
    } else if (datePart) { // if only date is changed, keep original time
        newDate.setHours(originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds(), originalDate.getMilliseconds());
    }
    
    setter(newDate);
  };


  const calculateDiff = () => {
    if (!isValid(startDate) || !isValid(endDate)) {
      toast({ title: 'Invalid Dates', description: 'Please ensure both dates are valid.', variant: 'destructive' });
      setDiffResult(null);
      return;
    }

    if (endDate < startDate) {
        toast({ title: 'Invalid Range', description: 'End date must be after start date.', variant: 'destructive' });
        setDiffResult(null);
        return;
    }

    let tempStartDate = new Date(startDate);
    
    const years = differenceInYears(endDate, tempStartDate);
    tempStartDate = new Date(tempStartDate.setFullYear(tempStartDate.getFullYear() + years));
    
    const months = differenceInMonths(endDate, tempStartDate);
    tempStartDate = new Date(tempStartDate.setMonth(tempStartDate.getMonth() + months));

    const days = differenceInDays(endDate, tempStartDate);
    tempStartDate = new Date(tempStartDate.setDate(tempStartDate.getDate() + days));

    const hours = differenceInHours(endDate, tempStartDate);
    tempStartDate = new Date(tempStartDate.setHours(tempStartDate.getHours() + hours));

    const minutes = differenceInMinutes(endDate, tempStartDate);
    tempStartDate = new Date(tempStartDate.setMinutes(tempStartDate.getMinutes() + minutes));

    const seconds = differenceInSeconds(endDate, tempStartDate);

    setDiffResult({
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
      totalDays: differenceInDays(endDate, startDate),
      totalHours: differenceInHours(endDate, startDate),
      totalMinutes: differenceInMinutes(endDate, startDate),
      totalSeconds: differenceInSeconds(endDate, startDate),
    });
    toast({ title: 'Difference Calculated!' });
  };
  
  useEffect(() => {
    calculateDiff();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);


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
            <h1 className="text-xl font-semibold font-headline">Date Difference Calculator</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-2xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Date Difference Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date & Time</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={(d) => handleDateTimeChange(d, format(startDate, "HH:mm"), setStartDate, startDate)} initialFocus /></PopoverContent>
                    </Popover>
                    <Input type="time" value={format(startDate, "HH:mm")} onChange={(e) => handleDateTimeChange(startDate, e.target.value, setStartDate, startDate)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date & Time</Label>
                     <Popover>
                      <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={(d) => handleDateTimeChange(d, format(endDate, "HH:mm"), setEndDate, endDate)} initialFocus /></PopoverContent>
                    </Popover>
                    <Input type="time" value={format(endDate, "HH:mm")} onChange={(e) => handleDateTimeChange(endDate, e.target.value, setEndDate, endDate)} />
                  </div>
                </div>

                <Button onClick={calculateDiff} className="w-full">Calculate Difference</Button>

                {diffResult && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Result:</h3>
                    <p className="text-muted-foreground">
                      The difference is: <br/>
                      <span className="font-semibold text-foreground">{diffResult.years}</span> years, <span className="font-semibold text-foreground">{diffResult.months}</span> months, <span className="font-semibold text-foreground">{diffResult.days}</span> days, <br/>
                      <span className="font-semibold text-foreground">{diffResult.hours}</span> hours, <span className="font-semibold text-foreground">{diffResult.minutes}</span> minutes, and <span className="font-semibold text-foreground">{diffResult.seconds}</span> seconds.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>Total Days: <span className="font-semibold text-foreground">{diffResult.totalDays}</span></p>
                        <p>Total Hours: <span className="font-semibold text-foreground">{diffResult.totalHours}</span></p>
                        <p>Total Minutes: <span className="font-semibold text-foreground">{diffResult.totalMinutes}</span></p>
                        <p>Total Seconds: <span className="font-semibold text-foreground">{diffResult.totalSeconds}</span></p>
                    </div>
                  </div>
                )}
              </CardContent>
               <CardFooter>
                 <p className="text-xs text-muted-foreground w-full text-center">
                  Results update automatically as you change dates/times.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

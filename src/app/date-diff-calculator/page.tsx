
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { format, differenceInYears, differenceInMonths, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, isValid, startOfDay } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
// Removed table layout for results; using flex rows instead
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

const CURRENT_YEAR = new Date().getFullYear();

export default function DateDiffCalculatorPage() {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [diffResult, setDiffResult] = useState<DateDiff | null>(null);
  const [includeTime, setIncludeTime] = useState(false); // time selection hidden by default
  const [error, setError] = useState<string | null>(null); // inline error message

  const handleDateTimeChange = (datePart: Date | undefined, timePart: string, setter: React.Dispatch<React.SetStateAction<Date>>, originalDate: Date) => {
  const newDate = datePart ? new Date(datePart) : new Date(originalDate); 
    
    if (timePart) {
        const timePartsArray = timePart.split(':').map(Number);
        const hours = timePartsArray[0];
        const minutes = timePartsArray[1];
        const seconds = timePartsArray[2]; // Might be undefined if timePart doesn't include seconds
        newDate.setHours(hours || 0, minutes || 0, seconds || 0, 0); 
    } else if (datePart) { 
        newDate.setHours(originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds(), originalDate.getMilliseconds());
    }
    
    setter(newDate);
  };

  const calculateDiff = useCallback(() => {
    if (!isValid(startDate) || !isValid(endDate)) {
      setDiffResult(null);
      setError('Invalid dates. Please ensure both dates are valid.');
      return;
    }

    // Effective dates (strip time if not included)
    const effectiveStart = includeTime ? startDate : startOfDay(startDate);
    const effectiveEnd = includeTime ? endDate : startOfDay(endDate);

  if (effectiveEnd < effectiveStart) {
    setDiffResult(null);
    setError('Invalid range. End date must be after start date.');
    return;
  }

    const tempStartDate = new Date(effectiveStart);
    
    const years = differenceInYears(effectiveEnd, tempStartDate);
    tempStartDate.setFullYear(tempStartDate.getFullYear() + years);
    
    const months = differenceInMonths(effectiveEnd, tempStartDate);
    tempStartDate.setMonth(tempStartDate.getMonth() + months);

    const days = differenceInDays(effectiveEnd, tempStartDate);
    tempStartDate.setDate(tempStartDate.getDate() + days);

    const hours = differenceInHours(effectiveEnd, tempStartDate);
    tempStartDate.setHours(tempStartDate.getHours() + hours);

    const minutes = differenceInMinutes(effectiveEnd, tempStartDate);
    tempStartDate.setMinutes(tempStartDate.getMinutes() + minutes);

    const seconds = differenceInSeconds(effectiveEnd, tempStartDate);

  setDiffResult({
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
      totalDays: differenceInDays(effectiveEnd, effectiveStart),
      totalHours: differenceInHours(effectiveEnd, effectiveStart),
      totalMinutes: differenceInMinutes(effectiveEnd, effectiveStart),
      totalSeconds: differenceInSeconds(effectiveEnd, effectiveStart),
    });
  setError(null);
  }, [startDate, endDate, includeTime]);
  
  useEffect(() => {
    calculateDiff();
  }, [calculateDiff]);

  // Derive filtered rows & summary for UX (hide zero-value units)
  const resultRows = useMemo(() => {
    if (!diffResult) return [] as { label: string; value: number; isTotal?: boolean }[]
    const rows: { label: string; value: number; isTotal?: boolean }[] = [
      { label: 'Years', value: diffResult.years },
      { label: 'Months', value: diffResult.months },
      { label: 'Days', value: diffResult.days },
      { label: 'Hours', value: diffResult.hours },
      { label: 'Minutes', value: diffResult.minutes },
      { label: 'Seconds', value: diffResult.seconds },
      { label: 'Total Days', value: diffResult.totalDays, isTotal: true },
      { label: 'Total Hours', value: diffResult.totalHours, isTotal: true },
      { label: 'Total Minutes', value: diffResult.totalMinutes, isTotal: true },
      { label: 'Total Seconds', value: diffResult.totalSeconds, isTotal: true },
    ]
    return rows.filter(r => r.value !== 0)
  }, [diffResult])

  const summary = useMemo(() => {
    if (!diffResult) return ''
    const ordered = [
      ['year', diffResult.years] as [string, number],
      ['month', diffResult.months] as [string, number],
      ['day', diffResult.days] as [string, number],
      ['hour', diffResult.hours] as [string, number],
      ['minute', diffResult.minutes] as [string, number],
      ['second', diffResult.seconds] as [string, number],
    ].filter(([, v]) => v > 0)
    if (!ordered.length) return 'No difference (dates are the same).'
    const top = ordered.slice(0, 3).map(([l, v]) => `${v.toLocaleString()} ${l}${v!==1?'s':''}`)
    return top.join(', ')
  }, [diffResult])


  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
  <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 md:px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="lg:hidden" />
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold font-headline">Date Difference Calculator</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8">
            {/* Big heading (consistent with other pages) */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Date Difference Calculator</h1>
              <p className="text-lg text-muted-foreground">Calculate the difference between two dates.</p>
            </div>
            
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-6 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Switch id="include-time" checked={includeTime} onCheckedChange={setIncludeTime} />
                    <label htmlFor="include-time" className="text-sm font-medium select-none">Include time</label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label htmlFor="startDateInput">Start Date & Time</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button id="startDateInput" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-12 text-base", !startDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "d MMMM yyyy") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar 
                            mode="single" 
                            selected={startDate} 
                            onSelect={(d) => handleDateTimeChange(d, format(startDate, "HH:mm:ss"), setStartDate, startDate)} 
                            initialFocus 
                            captionLayout="dropdown-buttons"
                            fromYear={CURRENT_YEAR - 100}
                            toYear={CURRENT_YEAR + 50}
                        />
                      </PopoverContent>
                    </Popover>
                    {includeTime && (
                      <Input type="time" value={format(startDate, "HH:mm:ss")} onChange={(e) => handleDateTimeChange(startDate, e.target.value, setStartDate, startDate)} step="1" className="h-10" />
                    )}
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="endDateInput">End Date & Time</Label>
                     <Popover>
                      <PopoverTrigger asChild>
                        <Button id="endDateInput" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-12 text-base", !endDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "d MMMM yyyy") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar 
                            mode="single" 
                            selected={endDate} 
                            onSelect={(d) => handleDateTimeChange(d, format(endDate, "HH:mm:ss"), setEndDate, endDate)} 
                            initialFocus 
                            captionLayout="dropdown-buttons"
                            fromYear={CURRENT_YEAR - 100}
                            toYear={CURRENT_YEAR + 50}
                        />
                      </PopoverContent>
                    </Popover>
                    {includeTime && (
                      <Input type="time" value={format(endDate, "HH:mm:ss")} onChange={(e) => handleDateTimeChange(endDate, e.target.value, setEndDate, endDate)} step="1" className="h-10" />
                    )}
                  </div>
                </div>

                {error && (
                  <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-sm px-4 py-2 flex items-start gap-2">
                    <span className="font-medium">Error:</span>
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-stretch gap-4">
                  {diffResult && (
                    <div className="flex-1 h-12 rounded-md border border-border/60 bg-background/40 px-4 flex items-center text-sm text-muted-foreground">
                      <span className="font-medium text-foreground mr-1">Summary:</span> {summary}
                    </div>
                  )}
                </div>

                {diffResult && (
                  <div className="space-y-4 pt-6 border-t">
                    <h3 className="text-lg font-semibold">Result</h3>
                    {resultRows.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No difference – both date & time values are identical.</p>
                    ) : (
                      <div className="space-y-2">
                        {resultRows.map((r, i) => {
                          const prev = resultRows[i-1]
                          const needsGroupBorder = r.isTotal && (!prev || !prev.isTotal)
                          return (
                            <div
                              key={r.label}
                              className={cn(
                                'flex items-baseline gap-3 px-2 py-2 rounded-md transition-colors hover:bg-muted/40',
                                needsGroupBorder && 'border-t pt-4 mt-2'
                              )}
                            >
                              <span className={cn('diff-number text-2xl md:text-3xl leading-none text-primary')}>
                                {r.value.toLocaleString()}
                              </span>
                              <span className={cn('text-sm md:text-base font-medium text-muted-foreground')}>{r.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="pt-6 border-t text-center">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Auto-updates on change</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

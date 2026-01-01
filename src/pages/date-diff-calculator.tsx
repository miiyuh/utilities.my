import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Copy, RotateCcw, Check } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { format, differenceInYears, differenceInMonths, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, isValid, startOfDay, addYears, addMonths, addDays, addHours, addMinutes, addWeeks } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';

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

function TimePicker({ date, onChange, is24Hour }: { date: Date; onChange: (date: Date) => void; is24Hour: boolean }) {
  const hours = is24Hour ? Array.from({ length: 24 }, (_, i) => i) : Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const isPm = date.getHours() >= 12;
  const currentHour = is24Hour ? date.getHours() : (date.getHours() % 12 || 12);
  const currentMinute = date.getMinutes();

  const handleHourChange = (hour: number) => {
    const newDate = new Date(date);
    if (is24Hour) {
      newDate.setHours(hour);
    } else {
      const isPm = newDate.getHours() >= 12;
      if (isPm && hour !== 12) newDate.setHours(hour + 12);
      else if (!isPm && hour === 12) newDate.setHours(0);
      else if (isPm && hour === 12) newDate.setHours(12);
      else newDate.setHours(hour);
    }
    onChange(newDate);
  };

  const handleMinuteChange = (minute: number) => {
    const newDate = new Date(date);
    newDate.setMinutes(minute);
    onChange(newDate);
  };

  const handleAmPmChange = (pm: boolean) => {
    const newDate = new Date(date);
    const currentHours = newDate.getHours();
    if (pm && currentHours < 12) newDate.setHours(currentHours + 12);
    else if (!pm && currentHours >= 12) newDate.setHours(currentHours - 12);
    onChange(newDate);
  };

  return (
    <div className="flex h-[300px] divide-x border-l">
      <ScrollArea className="h-full w-16">
        <div className="flex flex-col p-2 gap-1">
          {hours.map((h) => (
            <Button
              key={h}
              variant={currentHour === h ? "default" : "ghost"}
              size="sm"
              className="shrink-0 aspect-square h-10 w-full"
              onClick={() => handleHourChange(h)}
            >
              {is24Hour ? h.toString().padStart(2, '0') : h}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="vertical" className="invisible" />
      </ScrollArea>
      <ScrollArea className="h-full w-16">
        <div className="flex flex-col p-2 gap-1">
          {minutes.map((m) => (
            <Button
              key={m}
              variant={currentMinute === m ? "default" : "ghost"}
              size="sm"
              className="shrink-0 aspect-square h-10 w-full"
              onClick={() => handleMinuteChange(m)}
            >
              {m.toString().padStart(2, '0')}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="vertical" className="invisible" />
      </ScrollArea>
      {!is24Hour && (
        <div className="flex flex-col p-2 gap-2 justify-center w-16 bg-muted/10">
          <Button
            variant={!isPm ? "default" : "outline"}
            size="sm"
            className="w-full"
            onClick={() => handleAmPmChange(false)}
          >
            AM
          </Button>
          <Button
            variant={isPm ? "default" : "outline"}
            size="sm"
            className="w-full"
            onClick={() => handleAmPmChange(true)}
          >
            PM
          </Button>
        </div>
      )}
    </div>
  );
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
  const [includeTime, setIncludeTime] = useState(false);
  const [is24Hour, setIs24Hour] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const handleDateChange = (date: Date | undefined, isStart: boolean) => {
    if (!date) return;
    const setter = isStart ? setStartDate : setEndDate;
    const current = isStart ? startDate : endDate;
    
    const newDate = new Date(date);
    newDate.setHours(current.getHours(), current.getMinutes(), current.getSeconds());
    
    setter(newDate);
    
    if (!includeTime) {
      if (isStart) setIsStartOpen(false);
      else setIsEndOpen(false);
    }
  };

  const handleTimeChange = (newDate: Date, isStart: boolean) => {
    const setter = isStart ? setStartDate : setEndDate;
    setter(newDate);
  };

  const handleReset = () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(now);
    setEndDate(tomorrow);
    setError(null);
  };

  const handleQuickSelect = (type: 'today' | 'tomorrow' | 'next-week' | 'next-month' | 'next-year', isStart: boolean) => {
    const now = new Date();
    let target = new Date();
    
    switch (type) {
      case 'today':
        target = now;
        break;
      case 'tomorrow':
        target.setDate(now.getDate() + 1);
        break;
      case 'next-week':
        target = addWeeks(now, 1);
        break;
      case 'next-month':
        target = addMonths(now, 1);
        break;
      case 'next-year':
        target = addYears(now, 1);
        break;
    }
    
    if (isStart) {
      setStartDate(target);
      setIsStartOpen(false);
    } else {
      setEndDate(target);
      setIsEndOpen(false);
    }
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

    let tempStartDate = new Date(effectiveStart);
    
    const years = differenceInYears(effectiveEnd, tempStartDate);
    tempStartDate = addYears(tempStartDate, years);
    
    const months = differenceInMonths(effectiveEnd, tempStartDate);
    tempStartDate = addMonths(tempStartDate, months);

    const days = differenceInDays(effectiveEnd, tempStartDate);
    tempStartDate = addDays(tempStartDate, days);

    const hours = differenceInHours(effectiveEnd, tempStartDate);
    tempStartDate = addHours(tempStartDate, hours);

    const minutes = differenceInMinutes(effectiveEnd, tempStartDate);
    tempStartDate = addMinutes(tempStartDate, minutes);

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

  // Split results into breakdown and totals
  const breakdownRows = useMemo(() => {
    if (!diffResult) return [];
    const rows = [
      { label: 'Years', value: diffResult.years },
      { label: 'Months', value: diffResult.months },
      { label: 'Days', value: diffResult.days },
      { label: 'Hours', value: diffResult.hours },
      { label: 'Minutes', value: diffResult.minutes },
      { label: 'Seconds', value: diffResult.seconds },
    ];
    return rows.filter(r => r.value !== 0);
  }, [diffResult]);

  const totalRows = useMemo(() => {
    if (!diffResult) return [];
    const rows = [
      { label: 'Total Days', value: diffResult.totalDays },
      { label: 'Total Hours', value: diffResult.totalHours },
      { label: 'Total Minutes', value: diffResult.totalMinutes },
      { label: 'Total Seconds', value: diffResult.totalSeconds },
    ];
    return rows.filter(r => r.value !== 0);
  }, [diffResult]);

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

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "The summary has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const timeFormat = is24Hour ? "HH:mm" : "hh:mm aa";
  const displayFormat = includeTime ? `d MMMM yyyy ${timeFormat}` : "d MMMM yyyy";

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
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">Date Difference Calculator</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">Calculate the difference between two dates with precision.</p>
            </div>
            
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="space-y-6 bg-card p-6 rounded-sm border border-border shadow-sm">
                <div className="flex items-center justify-between gap-6 flex-wrap border-b pb-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <Switch id="include-time" checked={includeTime} onCheckedChange={setIncludeTime} />
                      <label htmlFor="include-time" className="text-sm font-medium select-none cursor-pointer">Include time</label>
                    </div>
                    {includeTime && (
                      <div className="flex items-center gap-3">
                        <Switch id="is-24h" checked={is24Hour} onCheckedChange={setIs24Hour} />
                        <label htmlFor="is-24h" className="text-sm font-medium select-none cursor-pointer">24-hour format</label>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset} className="rounded-sm h-8">
                      <RotateCcw className="h-3.5 w-3.5 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="startDateInput">Start Date {includeTime && "& Time"}</Label>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => handleQuickSelect('today', true)}>Today</Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => handleQuickSelect('tomorrow', true)}>Tomorrow</Button>
                      </div>
                    </div>
                    <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
                      <PopoverTrigger asChild>
                        <Button id="startDateInput" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-10 text-sm rounded-sm", !startDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, displayFormat) : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-sm" align="start">
                        <div className="flex flex-col md:flex-row">
                          <Calendar 
                              mode="single" 
                              selected={startDate} 
                              onSelect={(d) => handleDateChange(d, true)} 
                              initialFocus 
                              required
                              captionLayout="dropdown-buttons"
                              fromYear={CURRENT_YEAR - 100}
                              toYear={CURRENT_YEAR + 50}
                              className="rounded-sm"
                          />
                          {includeTime && (
                            <TimePicker date={startDate} onChange={(d) => handleTimeChange(d, true)} is24Hour={is24Hour} />
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="endDateInput">End Date {includeTime && "& Time"}</Label>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => handleQuickSelect('next-week', false)}>+1W</Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => handleQuickSelect('next-month', false)}>+1M</Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => handleQuickSelect('next-year', false)}>+1Y</Button>
                      </div>
                    </div>
                     <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
                      <PopoverTrigger asChild>
                        <Button id="endDateInput" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-10 text-sm rounded-sm", !endDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, displayFormat) : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-sm" align="start">
                        <div className="flex flex-col md:flex-row">
                          <Calendar 
                              mode="single" 
                              selected={endDate} 
                              onSelect={(d) => handleDateChange(d, false)} 
                              initialFocus 
                              required
                              captionLayout="dropdown-buttons"
                              fromYear={CURRENT_YEAR - 100}
                              toYear={CURRENT_YEAR + 50}
                              className="rounded-sm"
                          />
                          {includeTime && (
                            <TimePicker date={endDate} onChange={(d) => handleTimeChange(d, false)} is24Hour={is24Hour} />
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {error && (
                  <div role="alert" className="rounded-sm border border-destructive/30 bg-destructive/10 text-destructive text-sm px-4 py-2 flex items-start gap-2">
                    <span className="font-medium">Error:</span>
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-stretch gap-4">
                  {diffResult && (
                    <div className="flex-1 h-12 rounded-sm border border-border/60 bg-background/40 px-4 flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center overflow-hidden">
                        <span className="font-medium text-foreground mr-1 shrink-0">Summary:</span> 
                        <span className="truncate">{summary}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>

                {diffResult && (
                  <div className="space-y-6 pt-6 border-t">
                    <h3 className="text-lg font-semibold">Result</h3>
                    {breakdownRows.length === 0 && totalRows.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No difference - both date & time values are identical.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Breakdown</h4>
                          {breakdownRows.map((r) => (
                            <div
                              key={r.label}
                              className="flex items-baseline gap-3 px-3 py-2 rounded-sm transition-colors hover:bg-muted/40 border border-transparent hover:border-border/50"
                            >
                              <span className="text-5xl font-serif text-primary tabular-nums">
                                {r.value.toLocaleString()}
                              </span>
                              <span className="text-sm font-medium text-muted-foreground">{r.label}</span>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Totals</h4>
                          {totalRows.map((r) => (
                            <div
                              key={r.label}
                              className="flex items-baseline gap-3 px-3 py-2 rounded-sm transition-colors hover:bg-muted/40 border border-transparent hover:border-border/50"
                            >
                              <span className="text-5xl font-serif text-primary tabular-nums">
                                {r.value.toLocaleString()}
                              </span>
                              <span className="text-sm font-medium text-muted-foreground">{r.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}


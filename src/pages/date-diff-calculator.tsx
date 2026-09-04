import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, ArrowCounterClockwise } from 'phosphor-react';
import { Sidebar, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { format, differenceInYears, differenceInMonths, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, isValid, startOfDay, addYears, addMonths, addDays, addHours, addMinutes, addWeeks } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PageHeader } from "@/components/page-header";
import { CopyButton } from "@/components/ui/copy-button";

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
    <div className="flex h-[300px] divide-x border-l border-border">
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

  const timeFormat = is24Hour ? "HH:mm" : "hh:mm aa";
  const displayFormat = includeTime ? `d MMMM yyyy ${timeFormat}` : "d MMMM yyyy";

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={CalendarIcon} title="Date Difference Calculator" />

        <div className="flex flex-1 flex-col px-4 p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8">
            <div className="mb-8 hidden sm:block">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Date Difference Calculator</h1>
              <p className="text-lg text-muted-foreground max-w-3xl">Calculate the difference between two dates with precision.</p>
            </div>

            <Card className="w-full shadow-sm">
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-6 flex-wrap border-b border-border pb-4">
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
                  <Button type="button" variant="outline" size="sm" onClick={handleReset} className="h-8">
                    <ArrowCounterClockwise className="h-3.5 w-3.5" />
                    Reset
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label htmlFor="startDateInput">Start Date {includeTime && "& Time"}</Label>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => handleQuickSelect('today', true)}>Today</Button>
                        <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => handleQuickSelect('tomorrow', true)}>Tomorrow</Button>
                      </div>
                    </div>
                    <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" id="startDateInput" variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                          <CalendarIcon className="h-4 w-4" />
                          {startDate ? format(startDate, displayFormat) : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="flex flex-col md:flex-row">
                          <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={(d) => handleDateChange(d, true)}
                              required
                              captionLayout="dropdown"
                              startMonth={new Date(CURRENT_YEAR - 100, 0)}
                              endMonth={new Date(CURRENT_YEAR + 50, 11)}
                          />
                          {includeTime && (
                            <TimePicker date={startDate} onChange={(d) => handleTimeChange(d, true)} is24Hour={is24Hour} />
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label htmlFor="endDateInput">End Date {includeTime && "& Time"}</Label>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => handleQuickSelect('next-week', false)}>+1W</Button>
                        <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => handleQuickSelect('next-month', false)}>+1M</Button>
                        <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => handleQuickSelect('next-year', false)}>+1Y</Button>
                      </div>
                    </div>
                    <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" id="endDateInput" variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                          <CalendarIcon className="h-4 w-4" />
                          {endDate ? format(endDate, displayFormat) : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="flex flex-col md:flex-row">
                          <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={(d) => handleDateChange(d, false)}
                              required
                              captionLayout="dropdown"
                              startMonth={new Date(CURRENT_YEAR - 100, 0)}
                              endMonth={new Date(CURRENT_YEAR + 50, 11)}
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
                  <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive text-sm px-4 py-2 flex items-start gap-2">
                    <span className="font-medium">Error:</span>
                    <span>{error}</span>
                  </div>
                )}

                {diffResult && (
                  <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-muted/40 text-sm text-muted-foreground animate-in fade-in-0 duration-quick ease-smooth-out">
                    <div className="flex items-center overflow-hidden">
                      <span className="font-medium text-foreground mr-1 shrink-0">Summary:</span>
                      <span className="truncate">{summary}</span>
                    </div>
                    <CopyButton
                      value={summary}
                      label=""
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      toastTitle="Copied to clipboard"
                      toastDescription="The summary has been copied to your clipboard."
                    />
                  </div>
                )}

                {diffResult && (
                  <div className="space-y-6 pt-6 border-t border-border">
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
                              className="flex items-baseline gap-3 px-3 py-2 rounded-xl transition-colors duration-quick hover:bg-muted/40 border border-transparent hover:border-border/50"
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
                              className="flex items-baseline gap-3 px-3 py-2 rounded-xl transition-colors duration-quick hover:bg-muted/40 border border-transparent hover:border-border/50"
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
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}


"use client";

import React, { useState, useEffect } from 'react';
// Removed unused Card component imports after lint cleanup
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowRightLeft, Copy, CalendarIcon, Timer } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { format, parseISO, fromUnixTime, getUnixTime } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function UnixTimestampConverterPage() {
  const { toast } = useToast();
  const [timestamp, setTimestamp] = useState<string>(() => Math.floor(Date.now() / 1000).toString());
  const [humanDate, setHumanDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (selectedDate) {
      setHumanDate(format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss"));
      setTimestamp(getUnixTime(selectedDate).toString());
    }
  }, [selectedDate]);

  const handleTimestampToDate = () => {
    try {
      const numTimestamp = parseInt(timestamp, 10);
      if (isNaN(numTimestamp)) throw new Error("Invalid timestamp");
      const dateObj = fromUnixTime(numTimestamp);
      setSelectedDate(dateObj); // This will trigger useEffect
      toast({ title: 'Converted to Date', description: `Timestamp ${timestamp} is ${format(dateObj, "PPPpp")}` });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Conversion Error', description: message, variant: 'destructive' });
    }
  };

  const handleDateToTimestamp = () => {
    try {
      const dateObj = parseISO(humanDate);
      if (isNaN(dateObj.getTime())) throw new Error("Invalid date format");
      setSelectedDate(dateObj); // This will trigger useEffect
      toast({ title: 'Converted to Timestamp', description: `Date ${humanDate} is ${getUnixTime(dateObj)}` });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Conversion Error', description: message, variant: 'destructive' });
    }
  };
  
  const handleHumanDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHumanDate = e.target.value;
    setHumanDate(newHumanDate);
    try {
        const dateObj = parseISO(newHumanDate);
        if (!isNaN(dateObj.getTime())) {
            setSelectedDate(dateObj);
        }
  } catch {
        // Silently fail if typing invalid date, useEffect won't update timestamp
    }
  };


  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} Copied!`, description: `${text} copied to clipboard.` });
  } catch {
      toast({ title: 'Copy Failed', variant: 'destructive' });
    }
  };

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 md:px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="lg:hidden" />
            <Timer className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold font-headline">Unix Timestamp Converter</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Unix Timestamp Converter</h1>
              <p className="text-lg text-muted-foreground">Convert Unix timestamps to human-readable dates and vice-versa.</p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="timestamp">Unix Timestamp (seconds)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="timestamp"
                      type="number"
                      value={timestamp}
                      onChange={(e) => setTimestamp(e.target.value)}
                      placeholder="e.g., 1678886400"
                      className="h-12 text-base"
                    />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(timestamp, 'Timestamp')} title="Copy Timestamp" className="h-12 w-12">
                        <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-center my-6">
                  <Button variant="ghost" size="icon" onClick={() => { 
                      const tempTs = timestamp;
                      const tempDate = humanDate;
                      setTimestamp(getUnixTime(parseISO(tempDate)).toString());
                      setHumanDate(format(fromUnixTime(parseInt(tempTs,10)), "yyyy-MM-dd'T'HH:mm:ss"));
                      setSelectedDate(fromUnixTime(parseInt(tempTs,10)));
                      toast({title: "Swapped values"});
                    }} className="h-14 w-14">
                    <ArrowRightLeft className="h-6 w-6" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="humanDate">Human Readable Date & Time</Label>
                   <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal h-12 text-base",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP HH:mm:ss") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                         <div className="p-3 border-t border-border">
                            <Input 
                                type="time" 
                                value={selectedDate ? format(selectedDate, 'HH:mm:ss') : ''}
                                onChange={(e) => {
                                    if (selectedDate) {
                                        const [hours, minutes, seconds] = e.target.value.split(':').map(Number);
                                        const newDate = new Date(selectedDate);
                                        newDate.setHours(hours, minutes, seconds || 0);
                                        setSelectedDate(newDate);
                                    }
                                }}
                                step="1"
                                className="h-10"
                            />
                        </div>
                      </PopoverContent>
                    </Popover>
                  <div className="flex items-center gap-3 mt-3">
                    <Input
                        id="humanDate"
                        type="text"
                        value={humanDate}
                        onChange={handleHumanDateChange}
                        placeholder="e.g., 2023-03-15T12:00:00"
                        className="bg-muted/30 h-12 text-base"
                        readOnly 
                      />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(humanDate, 'Date')} title="Copy Date" className="h-12 w-12">
                        <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between gap-4 pt-6">
                  <Button onClick={handleTimestampToDate} className="flex-1 h-12">Timestamp to Date</Button>
                  <Button onClick={handleDateToTimestamp} className="flex-1 h-12">Date to Timestamp</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

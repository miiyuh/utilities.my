
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, ArrowRightLeft, Copy, CalendarIcon } from 'lucide-react';
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
    } catch (e: any) {
      toast({ title: 'Conversion Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDateToTimestamp = () => {
    try {
      const dateObj = parseISO(humanDate);
      if (isNaN(dateObj.getTime())) throw new Error("Invalid date format");
      setSelectedDate(dateObj); // This will trigger useEffect
      toast({ title: 'Converted to Timestamp', description: `Date ${humanDate} is ${getUnixTime(dateObj)}` });
    } catch (e: any) {
      toast({ title: 'Conversion Error', description: e.message, variant: 'destructive' });
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
    } catch (error) {
        // Silently fail if typing invalid date, useEffect won't update timestamp
    }
  };


  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} Copied!`, description: `${text} copied to clipboard.` });
    } catch (err) {
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
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden">
              <PanelLeft />
            </SidebarTrigger>
            <h1 className="text-xl font-semibold font-headline">Unix Timestamp Converter</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-lg mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Unix Timestamp Converter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="timestamp">Unix Timestamp (seconds)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="timestamp"
                      type="number"
                      value={timestamp}
                      onChange={(e) => setTimestamp(e.target.value)}
                      placeholder="e.g., 1678886400"
                    />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(timestamp, 'Timestamp')} title="Copy Timestamp">
                        <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-center my-4">
                  <Button variant="ghost" size="icon" onClick={() => { 
                      const tempTs = timestamp;
                      const tempDate = humanDate;
                      setTimestamp(getUnixTime(parseISO(tempDate)).toString());
                      setHumanDate(format(fromUnixTime(parseInt(tempTs,10)), "yyyy-MM-dd'T'HH:mm:ss"));
                      setSelectedDate(fromUnixTime(parseInt(tempTs,10)));
                      toast({title: "Swapped values"});
                    }}>
                    <ArrowRightLeft className="h-6 w-6" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="humanDate">Human Readable Date & Time</Label>
                   <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
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
                            />
                        </div>
                      </PopoverContent>
                    </Popover>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                        id="humanDate"
                        type="text"
                        value={humanDate}
                        onChange={handleHumanDateChange}
                        placeholder="e.g., 2023-03-15T12:00:00"
                        className="bg-muted/30"
                        readOnly 
                      />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(humanDate, 'Date')} title="Copy Date">
                        <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button onClick={handleTimestampToDate}>Timestamp to Date</Button>
                <Button onClick={handleDateToTimestamp}>Date to Timestamp</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

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
  // Mode toggle: seconds (default) or milliseconds
  const [useMilliseconds, setUseMilliseconds] = useState(false);

  // Primary fields
  const [timestamp, setTimestamp] = useState<string>(() => Math.floor(Date.now() / 1000).toString());
  const [humanDate, setHumanDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Validation state
  const [timestampError, setTimestampError] = useState<string | null>(null);
  const [humanDateError, setHumanDateError] = useState<string | null>(null);

  // When selectedDate changes, update both visible fields
  useEffect(() => {
    if (!selectedDate) return;
    setHumanDate(format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss"));
    setTimestamp(useMilliseconds ? selectedDate.getTime().toString() : getUnixTime(selectedDate).toString());
    setTimestampError(null);
    setHumanDateError(null);
  }, [selectedDate, useMilliseconds]);

  // Debounced auto-convert from timestamp -> date
  useEffect(() => {
    const id = setTimeout(() => {
      if (!timestamp) return;
      // Accept numeric strings only
      const num = Number(timestamp);
      if (!Number.isFinite(num)) {
        setTimestampError('Invalid number');
        return;
      }

      try {
        const d = useMilliseconds ? new Date(num) : fromUnixTime(Math.floor(num));
        if (isNaN(d.getTime())) {
          setTimestampError('Invalid timestamp');
          return;
        }
        setSelectedDate(d);
        setTimestampError(null);
      } catch {
        setTimestampError('Invalid timestamp');
      }
    }, 250);

    return () => clearTimeout(id);
  }, [timestamp, useMilliseconds]);

  // Debounced auto-convert from humanDate -> timestamp
  useEffect(() => {
    const id = setTimeout(() => {
      if (!humanDate) return;
      try {
        const d = parseISO(humanDate);
        if (isNaN(d.getTime())) {
          setHumanDateError('Invalid date format');
          return;
        }
        setHumanDateError(null);
        setSelectedDate(d);
      } catch {
        setHumanDateError('Invalid date format');
      }
    }, 250);

    return () => clearTimeout(id);
  }, [humanDate]);

  const handleTimestampToDate = () => {
    try {
      const numTimestamp = Number(timestamp);
      if (!Number.isFinite(numTimestamp)) throw new Error('Invalid timestamp');

      const dateObj = useMilliseconds ? new Date(numTimestamp) : fromUnixTime(Math.floor(numTimestamp));
      if (isNaN(dateObj.getTime())) throw new Error('Invalid timestamp');

      setSelectedDate(dateObj); // This will trigger useEffect
      setTimestampError(null);
      toast({ title: 'Converted to Date', description: `Timestamp ${timestamp} is ${format(dateObj, 'PPPpp')}` });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setTimestampError(message);
      toast({ title: 'Conversion Error', description: message, variant: 'destructive' });
    }
  };

  const handleDateToTimestamp = () => {
    try {
      const dateObj = parseISO(humanDate);
      if (isNaN(dateObj.getTime())) throw new Error('Invalid date format');

      setSelectedDate(dateObj); // This will trigger useEffect
      const ts = useMilliseconds ? dateObj.getTime().toString() : getUnixTime(dateObj).toString();
      setTimestamp(ts);
      setHumanDateError(null);
      toast({ title: 'Converted to Timestamp', description: `Date ${humanDate} is ${ts}` });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setHumanDateError(message);
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

  const handleSwap = () => {
    try {
      const tsNum = Number(timestamp);
      let dateFromTs: Date | null = null;
      if (Number.isFinite(tsNum)) {
        dateFromTs = useMilliseconds ? new Date(tsNum) : fromUnixTime(Math.floor(tsNum));
        if (isNaN(dateFromTs.getTime())) dateFromTs = null;
      }

      let dateFromIso: Date | null = null;
      try {
        const d = parseISO(humanDate);
        if (!isNaN(d.getTime())) dateFromIso = d;
      } catch {}

      if (!dateFromTs && !dateFromIso) {
        toast({ title: 'Swap Failed', description: 'No valid values to swap', variant: 'destructive' });
        return;
      }

      if (dateFromIso) {
        const ts = useMilliseconds ? dateFromIso.getTime().toString() : getUnixTime(dateFromIso).toString();
        setTimestamp(ts);
      }

      if (dateFromTs) {
        const hd = format(dateFromTs, "yyyy-MM-dd'T'HH:mm:ss");
        setHumanDate(hd);
        setSelectedDate(dateFromTs);
      }

      toast({ title: 'Swapped values' });
    } catch {
      toast({ title: 'Swap Error', description: 'Unable to swap values', variant: 'destructive' });
    }
  };

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
                  <Label htmlFor="timestamp">Unix Timestamp ({useMilliseconds ? 'milliseconds' : 'seconds'})</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="timestamp"
                      type="text"
                      value={timestamp}
                      onChange={(e) => setTimestamp(e.target.value.trim())}
                      placeholder={useMilliseconds ? "e.g., 1678886400123" : "e.g., 1678886400"}
                      className={`h-12 text-base bg-muted/20 text-foreground border ${timestampError ? 'border-destructive' : 'border-border'}`}
                    />

                    <div className="flex items-stretch gap-2">
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(timestamp, 'Timestamp')} title="Copy Timestamp" className="h-12 w-12 bg-muted/20 border border-border">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" title={useMilliseconds ? 'Using milliseconds' : 'Using seconds'} onClick={() => setUseMilliseconds((v) => !v)} className="h-12 w-12 bg-muted/20 border border-border">
                        <span className="font-mono text-sm">{useMilliseconds ? 'ms' : 's'}</span>
                      </Button>
                    </div>
                  </div>
                  {timestampError && <p className="text-sm text-destructive mt-1">{timestampError}</p> }
                </div>

                <div className="flex justify-center my-6">
                  <Button variant="outline" size="icon" onClick={() => handleSwap()} className="h-14 w-14 bg-muted/20 border border-border rounded-md">
                    <ArrowRightLeft className="h-6 w-6 text-foreground" />
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
                      className={`h-12 text-base bg-muted/20 text-foreground border ${humanDateError ? 'border-destructive' : 'border-border'}`}
                    />
                    <div className="flex items-stretch gap-2">
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(humanDate, 'Date')} title="Copy Date" className="h-12 w-12 bg-muted/20 border border-border">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setSelectedDate(new Date())} title="Set Now" className="h-12 w-12 bg-muted/20 border border-border">
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {humanDateError && <p className="text-sm text-destructive mt-1">{humanDateError}</p>}

                  {/* Extra derived formats */}
                  {selectedDate && (
                    <div className="mt-3 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-muted-foreground">Local ISO</div>
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-foreground">{selectedDate.toISOString().replace('Z', '')}</div>
                          <Button variant="outline" size="icon" onClick={() => copyToClipboard(selectedDate.toISOString(), 'ISO UTC')} className="h-7 w-7 bg-muted/10 border border-border">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-muted-foreground">UTC ISO</div>
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-foreground">{selectedDate.toISOString()}</div>
                          <Button variant="outline" size="icon" onClick={() => copyToClipboard(selectedDate.toISOString(), 'ISO UTC')} className="h-7 w-7 bg-muted/10 border border-border">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between gap-4 pt-6">
                  <Button onClick={handleTimestampToDate} className="flex-1 h-12 border border-border">Timestamp to Date</Button>
                  <Button onClick={handleDateToTimestamp} className="flex-1 h-12 border border-border">Date to Timestamp</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}


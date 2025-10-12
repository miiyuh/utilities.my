"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Globe,
  Copy,
  Plus,
  X,
  Clock,
  Search,
  Share2,
} from "lucide-react";
import {
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Card, CardContent } from "@/components/ui/card";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

// Helper function to get timezone abbreviation
const getTimezoneAbbreviation = (date: dayjs.Dayjs, timezone: string): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(date.toDate());
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value;
    
    if (timeZoneName && timeZoneName !== timezone) {
      return timeZoneName;
    }
    
    return date.format('Z');
  } catch {
    return date.format('Z');
  }
};

interface TimezoneInfo {
  id: string;
  name: string;
  time: string;
  date: string;
  abbreviation: string;
  flag: string;
  cityName: string;
}

// Popular timezones for quick selection
const POPULAR_TIMEZONES = [
  { value: "UTC", label: "UTC", flag: "🌍", city: "UTC" },
  { value: "America/New_York", label: "New York", flag: "🇺🇸", city: "New York" },
  { value: "America/Los_Angeles", label: "Los Angeles", flag: "🇺🇸", city: "Los Angeles" },
  { value: "America/Chicago", label: "Chicago", flag: "🇺🇸", city: "Chicago" },
  { value: "Europe/London", label: "London", flag: "🇬🇧", city: "London" },
  { value: "Europe/Paris", label: "Paris", flag: "🇫🇷", city: "Paris" },
  { value: "Europe/Berlin", label: "Berlin", flag: "🇩🇪", city: "Berlin" },
  { value: "Asia/Tokyo", label: "Tokyo", flag: "🇯🇵", city: "Tokyo" },
  { value: "Asia/Shanghai", label: "Shanghai", flag: "🇨🇳", city: "Shanghai" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", flag: "🇭🇰", city: "Hong Kong" },
  { value: "Asia/Singapore", label: "Singapore", flag: "🇸🇬", city: "Singapore" },
  { value: "Asia/Seoul", label: "Seoul", flag: "🇰🇷", city: "Seoul" },
  { value: "Asia/Mumbai", label: "Mumbai", flag: "🇮🇳", city: "Mumbai" },
  { value: "Asia/Dubai", label: "Dubai", flag: "🇦🇪", city: "Dubai" },
  { value: "Australia/Sydney", label: "Sydney", flag: "🇦🇺", city: "Sydney" },
  { value: "America/Toronto", label: "Toronto", flag: "🇨🇦", city: "Toronto" },
  { value: "America/Sao_Paulo", label: "São Paulo", flag: "🇧🇷", city: "São Paulo" },
  { value: "Europe/Moscow", label: "Moscow", flag: "🇷🇺", city: "Moscow" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur", flag: "🇲🇾", city: "Kuala Lumpur" },
  { value: "Pacific/Auckland", label: "Auckland", flag: "🇳🇿", city: "Auckland" },
];

// Simple timezone card component
function TimezoneCard({ info, onRemove, onCopy }: {
  info: TimezoneInfo;
  onRemove: (id: string) => void;
  onCopy: (text: string) => void;
}) {
  return (
    <Card className="relative group">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl" style={{fontFamily: 'Noto Color Emoji'}}>{info.flag}</span>
            <div>
              <h3 className="font-semibold text-lg">{info.cityName}</h3>
              <p className="text-sm text-muted-foreground">{info.abbreviation}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(info.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="text-3xl font-mono font-bold">{info.time}</div>
          <div className="text-sm text-muted-foreground">{info.date}</div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCopy(`${info.cityName}: ${info.time} ${info.date}`)}
          className="w-full mt-3"
        >
          <Copy className="h-3 w-3 mr-2" />
          Copy
        </Button>
      </CardContent>
    </Card>
  );
}



export default function TimezoneConverterPage() {
  const { toast } = useToast();
  const [sourceTime, setSourceTime] = useState<string>(() =>
    dayjs().format("YYYY-MM-DDTHH:mm")
  );
  const [targetTimezones, setTargetTimezones] = useState<string[]>([
    "UTC",
    "America/New_York",
    "Europe/London",
    "Asia/Tokyo",
  ]);
  const [timezoneInfos, setTimezoneInfos] = useState<TimezoneInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentLocalTime, setCurrentLocalTime] = useState(dayjs());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLocalTime(dayjs());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const convertTime = useCallback(() => {
    try {
      const sourceDate = dayjs(sourceTime);

      if (!sourceDate.isValid()) {
        toast({
          title: "Invalid Date",
          description: "Please enter a valid date and time.",
          variant: "destructive",
        });
        return;
      }

      const infos: TimezoneInfo[] = targetTimezones.map((tzId) => {
        const converted = sourceDate.tz(tzId);
        const tz = POPULAR_TIMEZONES.find((tz) => tz.value === tzId);
        const flag = tz?.flag || "🌍";
        const cityName = tz?.city || tzId.split('/').pop() || tzId;

        return {
          id: tzId,
          name: tz?.label || tzId,
          time: converted.format("HH:mm"),
          date: converted.format("MMM D, YYYY"),
          abbreviation: getTimezoneAbbreviation(converted, tzId),
          flag,
          cityName,
        };
      });

      setTimezoneInfos(infos);
    } catch (error) {
      toast({
        title: "Conversion Error",
        description: "Failed to convert time. Please check your inputs.",
        variant: "destructive",
      });
    }
  }, [sourceTime, targetTimezones, toast]);

  useEffect(() => {
    convertTime();
  }, [convertTime]);

  const addTimezone = (timezone: string) => {
    if (!targetTimezones.includes(timezone)) {
      setTargetTimezones([...targetTimezones, timezone]);
    }
  };

  const removeTimezone = (timezone: string) => {
    setTargetTimezones(targetTimezones.filter((tz) => tz !== timezone));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Time copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy Failed",
        variant: "destructive",
      });
    }
  };

  const setToCurrentTime = () => {
    setSourceTime(dayjs().format("YYYY-MM-DDTHH:mm"));
  };

  const filteredTimezones = POPULAR_TIMEZONES.filter(tz => 
    tz.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tz.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateShareableLink = async () => {
    const params = new URLSearchParams({
      time: sourceTime,
      targets: targetTimezones.join(',')
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    await copyToClipboard(shareUrl);
    toast({
      title: "Link Copied",
      description: "Shareable link copied to clipboard!",
    });
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
            <Globe className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold font-headline">
              Timezone Converter
            </h1>
          </div>
          <ThemeToggleButton />
        </header>

        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 lg:pb-24">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Timezone Converter</h1>
              <p className="text-lg text-muted-foreground">Convert times between different timezones instantly. Perfect for scheduling meetings across time zones.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Input Section */}
              <Card>
                <CardContent className="p-6 space-y-6">
                  {/* Current Time Display */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4 text-center border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-mono font-bold mb-2 text-blue-900 dark:text-blue-100">
                      {currentLocalTime.format('HH:mm:ss')}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      {currentLocalTime.format('dddd, MMMM D, YYYY')} • {dayjs.tz.guess()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source-time">Select Date & Time</Label>
                    <div className="flex gap-2">
                      <Input
                        id="source-time"
                        type="datetime-local"
                        value={sourceTime}
                        onChange={(e) => setSourceTime(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={setToCurrentTime}
                      >
                        Now
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Add Timezone</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search for cities or countries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {searchTerm && filteredTimezones.length > 0 && (
                      <div className="max-h-48 overflow-y-auto border rounded-md">
                        {filteredTimezones.slice(0, 6).map((tz) => (
                          <button
                            key={tz.value}
                            onClick={() => {
                              addTimezone(tz.value);
                              setSearchTerm("");
                            }}
                            disabled={targetTimezones.includes(tz.value)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-left"
                          >
                            <span style={{fontFamily: 'Noto Color Emoji'}}>{tz.flag}</span>
                            <span>{tz.city}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={generateShareableLink}
                      variant="outline"
                      className="flex-1"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Results Section */}
              <Card>
                <CardContent className="p-6">
                  {timezoneInfos.length > 0 ? (
                    <div className="space-y-4">
                      {timezoneInfos.map((info) => (
                        <TimezoneCard
                          key={info.id}
                          info={info}
                          onRemove={removeTimezone}
                          onCopy={copyToClipboard}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Globe className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-semibold mb-2">No timezones added</h3>
                      <p className="text-muted-foreground">
                        Search and add timezones to see time conversions
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>


          </div>
        </div>
      </SidebarInset>
    </>
  );
}
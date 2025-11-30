"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Globe,
  X,
  Search,
  Share2,
  Home,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Link2,
} from "lucide-react";
import {
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Reorder, useDragControls } from "framer-motion";

dayjs.extend(utc);
dayjs.extend(timezone);

// Timezone data with metadata
interface TimezoneData {
  value: string;
  label: string;
  flag: string;
  city: string;
  country: string;
}

// Expanded timezone list
const TIMEZONES: TimezoneData[] = [
  { value: "UTC", label: "UTC", flag: "🌍", city: "UTC", country: "Coordinated Universal Time" },
  { value: "America/New_York", label: "New York", flag: "🇺🇸", city: "New York", country: "United States" },
  { value: "America/Los_Angeles", label: "Los Angeles", flag: "🇺🇸", city: "Los Angeles", country: "United States" },
  { value: "America/Chicago", label: "Chicago", flag: "🇺🇸", city: "Chicago", country: "United States" },
  { value: "America/Denver", label: "Denver", flag: "🇺🇸", city: "Denver", country: "United States" },
  { value: "America/Phoenix", label: "Phoenix", flag: "🇺🇸", city: "Phoenix", country: "United States" },
  { value: "America/Anchorage", label: "Anchorage", flag: "🇺🇸", city: "Anchorage", country: "United States" },
  { value: "Pacific/Honolulu", label: "Honolulu", flag: "🇺🇸", city: "Honolulu", country: "United States" },
  { value: "Europe/London", label: "London", flag: "🇬🇧", city: "London", country: "United Kingdom" },
  { value: "Europe/Paris", label: "Paris", flag: "🇫🇷", city: "Paris", country: "France" },
  { value: "Europe/Berlin", label: "Berlin", flag: "🇩🇪", city: "Berlin", country: "Germany" },
  { value: "Europe/Rome", label: "Rome", flag: "🇮🇹", city: "Rome", country: "Italy" },
  { value: "Europe/Madrid", label: "Madrid", flag: "🇪🇸", city: "Madrid", country: "Spain" },
  { value: "Europe/Amsterdam", label: "Amsterdam", flag: "🇳🇱", city: "Amsterdam", country: "Netherlands" },
  { value: "Europe/Brussels", label: "Brussels", flag: "🇧🇪", city: "Brussels", country: "Belgium" },
  { value: "Europe/Vienna", label: "Vienna", flag: "🇦🇹", city: "Vienna", country: "Austria" },
  { value: "Europe/Zurich", label: "Zurich", flag: "🇨🇭", city: "Zurich", country: "Switzerland" },
  { value: "Europe/Stockholm", label: "Stockholm", flag: "🇸🇪", city: "Stockholm", country: "Sweden" },
  { value: "Europe/Oslo", label: "Oslo", flag: "🇳🇴", city: "Oslo", country: "Norway" },
  { value: "Europe/Copenhagen", label: "Copenhagen", flag: "🇩🇰", city: "Copenhagen", country: "Denmark" },
  { value: "Europe/Helsinki", label: "Helsinki", flag: "🇫🇮", city: "Helsinki", country: "Finland" },
  { value: "Europe/Warsaw", label: "Warsaw", flag: "🇵🇱", city: "Warsaw", country: "Poland" },
  { value: "Europe/Prague", label: "Prague", flag: "🇨🇿", city: "Prague", country: "Czech Republic" },
  { value: "Europe/Athens", label: "Athens", flag: "🇬🇷", city: "Athens", country: "Greece" },
  { value: "Europe/Istanbul", label: "Istanbul", flag: "🇹🇷", city: "Istanbul", country: "Turkey" },
  { value: "Europe/Moscow", label: "Moscow", flag: "🇷🇺", city: "Moscow", country: "Russia" },
  { value: "Asia/Tokyo", label: "Tokyo", flag: "🇯🇵", city: "Tokyo", country: "Japan" },
  { value: "Asia/Shanghai", label: "Shanghai", flag: "🇨🇳", city: "Shanghai", country: "China" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", flag: "🇭🇰", city: "Hong Kong", country: "Hong Kong" },
  { value: "Asia/Singapore", label: "Singapore", flag: "🇸🇬", city: "Singapore", country: "Singapore" },
  { value: "Asia/Seoul", label: "Seoul", flag: "🇰🇷", city: "Seoul", country: "South Korea" },
  { value: "Asia/Taipei", label: "Taipei", flag: "🇹🇼", city: "Taipei", country: "Taiwan" },
  { value: "Asia/Mumbai", label: "Mumbai", flag: "🇮🇳", city: "Mumbai", country: "India" },
  { value: "Asia/Kolkata", label: "Kolkata", flag: "🇮🇳", city: "Kolkata", country: "India" },
  { value: "Asia/Dubai", label: "Dubai", flag: "🇦🇪", city: "Dubai", country: "United Arab Emirates" },
  { value: "Asia/Bangkok", label: "Bangkok", flag: "🇹🇭", city: "Bangkok", country: "Thailand" },
  { value: "Asia/Jakarta", label: "Jakarta", flag: "🇮🇩", city: "Jakarta", country: "Indonesia" },
  { value: "Asia/Manila", label: "Manila", flag: "🇵🇭", city: "Manila", country: "Philippines" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur", flag: "🇲🇾", city: "Kuala Lumpur", country: "Malaysia" },
  { value: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh", flag: "🇻🇳", city: "Ho Chi Minh", country: "Vietnam" },
  { value: "Asia/Karachi", label: "Karachi", flag: "🇵🇰", city: "Karachi", country: "Pakistan" },
  { value: "Asia/Dhaka", label: "Dhaka", flag: "🇧🇩", city: "Dhaka", country: "Bangladesh" },
  { value: "Asia/Riyadh", label: "Riyadh", flag: "🇸🇦", city: "Riyadh", country: "Saudi Arabia" },
  { value: "Asia/Tehran", label: "Tehran", flag: "🇮🇷", city: "Tehran", country: "Iran" },
  { value: "Asia/Jerusalem", label: "Jerusalem", flag: "🇵🇸", city: "Jerusalem", country: "Palestine" },
  { value: "Australia/Sydney", label: "Sydney", flag: "🇦🇺", city: "Sydney", country: "Australia" },
  { value: "Australia/Melbourne", label: "Melbourne", flag: "🇦🇺", city: "Melbourne", country: "Australia" },
  { value: "Australia/Brisbane", label: "Brisbane", flag: "🇦🇺", city: "Brisbane", country: "Australia" },
  { value: "Australia/Perth", label: "Perth", flag: "🇦🇺", city: "Perth", country: "Australia" },
  { value: "Pacific/Auckland", label: "Auckland", flag: "🇳🇿", city: "Auckland", country: "New Zealand" },
  { value: "America/Toronto", label: "Toronto", flag: "🇨🇦", city: "Toronto", country: "Canada" },
  { value: "America/Vancouver", label: "Vancouver", flag: "🇨🇦", city: "Vancouver", country: "Canada" },
  { value: "America/Mexico_City", label: "Mexico City", flag: "🇲🇽", city: "Mexico City", country: "Mexico" },
  { value: "America/Sao_Paulo", label: "São Paulo", flag: "🇧🇷", city: "São Paulo", country: "Brazil" },
  { value: "America/Buenos_Aires", label: "Buenos Aires", flag: "🇦🇷", city: "Buenos Aires", country: "Argentina" },
  { value: "America/Lima", label: "Lima", flag: "🇵🇪", city: "Lima", country: "Peru" },
  { value: "America/Bogota", label: "Bogota", flag: "🇨🇴", city: "Bogota", country: "Colombia" },
  { value: "Africa/Cairo", label: "Cairo", flag: "🇪🇬", city: "Cairo", country: "Egypt" },
  { value: "Africa/Lagos", label: "Lagos", flag: "🇳🇬", city: "Lagos", country: "Nigeria" },
  { value: "Africa/Johannesburg", label: "Johannesburg", flag: "🇿🇦", city: "Johannesburg", country: "South Africa" },
  { value: "Africa/Nairobi", label: "Nairobi", flag: "🇰🇪", city: "Nairobi", country: "Kenya" },
];

// Get timezone abbreviation
const getTimezoneAbbr = (tz: string, date: dayjs.Dayjs): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(date.toDate());
    return parts.find(part => part.type === 'timeZoneName')?.value || 'GMT';
  } catch {
    return 'GMT';
  }
};

// Get UTC offset for a timezone
const getUtcOffset = (tz: string, date: dayjs.Dayjs): number => {
  try {
    return date.tz(tz).utcOffset();
  } catch {
    return 0;
  }
};

// Format offset as string
const formatOffset = (offset: number): string => {
  const hours = Math.floor(Math.abs(offset) / 60);
  const mins = Math.abs(offset) % 60;
  const sign = offset >= 0 ? '+' : '-';
  return `GMT${sign}${hours}${mins ? `:${mins.toString().padStart(2, '0')}` : ''}`;
};

// Check if hour is during typical work hours (9am-6pm)
const isWorkHour = (hour: number): boolean => hour >= 9 && hour < 18;

// Check if hour is during night (10pm-6am)
const isNightHour = (hour: number): boolean => hour >= 22 || hour < 6;

interface LocationRow {
  id: string;
  timezone: string;
  isHome: boolean;
}

// Scroll Sync Context
const ScrollSyncContext = React.createContext<{
  register: (id: string, node: HTMLDivElement | null) => void;
  onScroll: (id: string, scrollLeft: number) => void;
} | null>(null);

const ScrollSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isScrolling = useRef<boolean>(false);

  const register = useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) refs.current.set(id, node);
    else refs.current.delete(id);
  }, []);

  const onScroll = useCallback((sourceId: string, scrollLeft: number) => {
    if (isScrolling.current) return;
    isScrolling.current = true;
    
    requestAnimationFrame(() => {
      refs.current.forEach((el, id) => {
        if (id !== sourceId && el) {
          el.scrollLeft = scrollLeft;
        }
      });
      isScrolling.current = false;
    });
  }, []);

  return (
    <ScrollSyncContext.Provider value={{ register, onScroll }}>
      {children}
    </ScrollSyncContext.Provider>
  );
};

// Hour tile component
function HourTile({
  hour,
  date,
  timezone,
  isCurrentHour,
  isSelected,
  onHover,
  onClick,
}: {
  hour: number;
  date: dayjs.Dayjs;
  timezone: string;
  isCurrentHour: boolean;
  isSelected: boolean;
  onHover: (hour: number | null) => void;
  onClick: (hour: number) => void;
}) {
  const timeInTz = date.tz(timezone).hour(hour).minute(0);
  const isWork = isWorkHour(hour);
  const isNight = isNightHour(hour);
  const abbr = getTimezoneAbbr(timezone, timeInTz);
  const isNewDay = hour === 0;
  const dayLabel = timeInTz.format('ddd').toUpperCase();
  const dateLabel = timeInTz.format('MMM D').toUpperCase();

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center min-w-[44px] h-16 cursor-pointer
        transition-all duration-150 select-none border-r border-border/30
        ${isWork ? 'bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-800/50' : ''}
        ${isNight ? 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700' : ''}
        ${!isWork && !isNight ? 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-800/30' : ''}
        ${isCurrentHour ? 'ring-2 ring-primary ring-inset' : ''}
        ${isSelected ? 'bg-primary/20 dark:bg-primary/30' : ''}
      `}
      onMouseEnter={() => onHover(hour)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(hour)}
    >
      {isNewDay && (
        <div className="absolute -top-5 left-0 right-0 text-[10px] font-semibold text-center text-muted-foreground whitespace-nowrap">
          <span className="text-primary">{dayLabel}</span> {dateLabel}
        </div>
      )}
      <span className="text-sm font-medium">
        {hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}
        <span className="text-[10px] ml-0.5">{hour < 12 ? 'am' : 'pm'}</span>
      </span>
      <span className="text-[9px] text-muted-foreground">{abbr}</span>
    </div>
  );
}

// Location row component
function LocationRowComponent({
  location,
  baseDate,
  hoveredHour,
  selectedHour,
  onHoverHour,
  onSelectHour,
  onRemove,
  onSetHome,
  homeTimezone,
}: {
  location: LocationRow;
  baseDate: dayjs.Dayjs;
  hoveredHour: number | null;
  selectedHour: number | null;
  onHoverHour: (hour: number | null) => void;
  onSelectHour: (hour: number) => void;
  onRemove: (id: string) => void;
  onSetHome: (id: string) => void;
  homeTimezone: string;
}) {
  const tzData = TIMEZONES.find(tz => tz.value === location.timezone);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const scrollSync = React.useContext(ScrollSyncContext);
  
  // Calculate offset difference from home
  const homeOffset = getUtcOffset(homeTimezone, baseDate);
  const thisOffset = getUtcOffset(location.timezone, baseDate);
  const offsetDiff = (thisOffset - homeOffset) / 60;
  
  // Current time in this timezone
  const nowInTz = dayjs().tz(location.timezone);
  const currentHour = nowInTz.hour();
  
  // Display time (either hovered/selected or current)
  const displayHour = hoveredHour ?? selectedHour ?? currentHour;
  const displayTime = baseDate.tz(location.timezone).hour(displayHour).minute(0);
  
  // Generate hours starting from the offset
  const hours = useMemo(() => {
    const result: number[] = [];
    // Start from hour that corresponds to home's hour 0
    const startHour = (24 - offsetDiff + 24) % 24;
    for (let i = 0; i < 24; i++) {
      result.push((Math.floor(startHour) + i) % 24);
    }
    return result;
  }, [offsetDiff]);

  // Register with scroll sync
  useEffect(() => {
    scrollSync?.register(location.id, containerRef.current);
    return () => scrollSync?.register(location.id, null);
  }, [location.id, scrollSync]);

  // Scroll to current time on mount
  useEffect(() => {
    if (containerRef.current) {
      const currentHourIndex = hours.indexOf(currentHour);
      if (currentHourIndex !== -1) {
        const scrollPosition = currentHourIndex * 44 - (containerRef.current.offsetWidth / 2) + 22;
        containerRef.current.scrollLeft = scrollPosition;
      }
    }
  }, [hours, currentHour]);

  return (
    <Reorder.Item
      value={location}
      id={location.id}
      dragListener={false}
      dragControls={dragControls}
      as="div"
      className="flex border-b border-border bg-card hover:bg-muted/30 transition-colors group relative"
    >
      {/* Location info */}
      <div className="flex-shrink-0 w-48 md:w-56 p-3 border-r border-border flex items-center gap-2 bg-card z-20">
        <div 
          onPointerDown={(e) => dragControls.start(e)}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {location.isHome && (
              <Home className="h-3 w-3 text-primary flex-shrink-0" />
            )}
            <span className="text-lg" style={{fontFamily: 'Noto Color Emoji'}}>{tzData?.flag || '🌍'}</span>
            <span className="font-semibold truncate">{tzData?.city || location.timezone}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatOffset(thisOffset)}</span>
            {offsetDiff !== 0 && (
              <span className={offsetDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {offsetDiff > 0 ? '+' : ''}{offsetDiff}h
              </span>
            )}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-lg font-mono font-bold">
            {displayTime.format('h:mm')}
            <span className="text-xs ml-0.5">{displayTime.format('a')}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {displayTime.format('ddd, MMM D')}
          </div>
        </div>
      </div>

      {/* Hour tiles */}
      <div 
        ref={containerRef}
        onScroll={(e) => scrollSync?.onScroll(location.id, e.currentTarget.scrollLeft)}
        className="flex-1 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex pt-6 min-w-max">
          {hours.map((hour) => (
            <HourTile
              key={hour}
              hour={hour}
              date={baseDate}
              timezone={location.timezone}
              isCurrentHour={hour === currentHour}
              isSelected={hour === selectedHour}
              onHover={onHoverHour}
              onClick={onSelectHour}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 w-20 flex items-center justify-center gap-1 border-l border-border bg-card z-20">
        <button
          onClick={() => onSetHome(location.id)}
          className={`p-1.5 rounded hover:bg-muted transition-colors ${location.isHome ? 'text-primary' : 'text-muted-foreground'}`}
          title="Set as home"
        >
          <Home className="h-4 w-4" />
        </button>
        <button
          onClick={() => onRemove(location.id)}
          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Remove"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Reorder.Item>
  );
}

export default function TimezoneConverterPage() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<LocationRow[]>([
    { id: '1', timezone: dayjs.tz.guess(), isHome: true },
    { id: '2', timezone: 'America/New_York', isHome: false },
    { id: '3', timezone: 'Europe/London', isHome: false },
    { id: '4', timezone: 'Asia/Tokyo', isHome: false },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [baseDate, setBaseDate] = useState(dayjs());
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [use24Hour, setUse24Hour] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update base date every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedHour === null) {
        setBaseDate(dayjs());
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [selectedHour]);

  // Focus search input when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const homeTimezone = locations.find(l => l.isHome)?.timezone || dayjs.tz.guess();

  const filteredTimezones = useMemo(() => {
    if (!searchTerm) return TIMEZONES.slice(0, 8);
    const term = searchTerm.toLowerCase();
    return TIMEZONES.filter(tz => 
      tz.city.toLowerCase().includes(term) || 
      tz.country.toLowerCase().includes(term) ||
      tz.value.toLowerCase().includes(term)
    ).slice(0, 8);
  }, [searchTerm]);

  const addLocation = (timezone: string) => {
    if (locations.some(l => l.timezone === timezone)) {
      toast({
        title: "Already added",
        description: "This timezone is already in your list.",
      });
      return;
    }
    setLocations([...locations, {
      id: Date.now().toString(),
      timezone,
      isHome: false,
    }]);
    setSearchTerm("");
    setShowSearch(false);
  };

  const removeLocation = (id: string) => {
    if (locations.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one timezone.",
        variant: "destructive",
      });
      return;
    }
    const location = locations.find(l => l.id === id);
    setLocations(prev => {
      const newLocations = prev.filter(l => l.id !== id);
      // If removing home, set first as home
      if (location?.isHome && newLocations.length > 0) {
        newLocations[0].isHome = true;
      }
      return newLocations;
    });
  };

  const setHome = (id: string) => {
    setLocations(prev => prev.map(l => ({
      ...l,
      isHome: l.id === id,
    })));
  };

  const moveDate = (days: number) => {
    setBaseDate(prev => prev.add(days, 'day'));
    setSelectedHour(null);
  };

  const resetToNow = () => {
    setBaseDate(dayjs());
    setSelectedHour(null);
  };

  const generateShareableLink = async () => {
    const params = new URLSearchParams({
      locations: locations.map(l => l.timezone).join(','),
      home: homeTimezone,
      date: baseDate.format('YYYY-MM-DD'),
      ...(selectedHour !== null && { hour: selectedHour.toString() }),
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share this link to show others the same view.",
      });
    } catch {
      toast({
        title: "Copy failed",
        variant: "destructive",
      });
    }
  };

  return (
    <ScrollSyncProvider>
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
              World Time Buddy
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUse24Hour(!use24Hour)}
              className="text-xs"
            >
              {use24Hour ? '24h' : '12h'}
            </Button>
            <ThemeToggleButton />
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Controls bar */}
          <div className="sticky top-0 z-30 bg-background border-b border-border px-4 py-3">
            <div className="max-w-full mx-auto flex flex-wrap items-center gap-3">
              {/* Date navigation */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveDate(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="px-3 py-1 text-sm font-medium min-w-[140px] text-center">
                  {baseDate.format('ddd, MMM D, YYYY')}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveDate(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={resetToNow} className="gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Now
              </Button>

              <div className="flex-1" />

              {/* Add location */}
              <div className="relative">
                {showSearch ? (
                  <div className="relative z-50">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search city or timezone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                      className="pl-9 w-64"
                    />
                    {(searchTerm || showSearch) && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                        {filteredTimezones.map(tz => (
                          <button
                            key={tz.value}
                            onClick={() => addLocation(tz.value)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left transition-colors"
                          >
                            <span className="text-lg" style={{fontFamily: 'Noto Color Emoji'}}>{tz.flag}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{tz.city}</div>
                              <div className="text-xs text-muted-foreground truncate">{tz.country}</div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatOffset(getUtcOffset(tz.value, baseDate))}
                            </span>
                          </button>
                        ))}
                        {filteredTimezones.length === 0 && (
                          <div className="px-4 py-3 text-sm text-muted-foreground">
                            No timezones found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowSearch(true)} className="gap-1">
                    <Search className="h-3.5 w-3.5" />
                    Add Location
                  </Button>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={generateShareableLink} className="gap-1">
                <Link2 className="h-3.5 w-3.5" />
                Share
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-muted/30 border-b border-border px-4 py-2">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700" />
                <span>Work hours (9am-6pm)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700" />
                <span>Transition</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-600" />
                <span>Night (10pm-6am)</span>
              </div>
              <div className="ml-auto text-muted-foreground">
                Hover over hours to compare • Click to select
              </div>
            </div>
          </div>

          {/* Timezone rows */}
          <div className="flex-1 overflow-y-auto">
            <Reorder.Group axis="y" values={locations} onReorder={setLocations} className="flex flex-col">
              {locations.map((location) => (
                <LocationRowComponent
                  key={location.id}
                  location={location}
                  baseDate={baseDate}
                  hoveredHour={hoveredHour}
                  selectedHour={selectedHour}
                  onHoverHour={setHoveredHour}
                  onSelectHour={setSelectedHour}
                  onRemove={removeLocation}
                  onSetHome={setHome}
                  homeTimezone={homeTimezone}
                />
              ))}
            </Reorder.Group>
          </div>

          {/* Empty state */}
          {locations.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Globe className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No locations added</h3>
                <p className="text-muted-foreground mb-4">
                  Add locations to compare times across different timezones
                </p>
                <Button onClick={() => setShowSearch(true)}>
                  <Search className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </div>
            </div>
          )}

          {/* Footer info */}
          <div className="border-t border-border bg-muted/30 px-4 py-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">Tip:</strong> Hover over time slots to see equivalent times across all locations
              </span>
              <span className="ml-auto">
                {selectedHour !== null ? (
                  <span>
                    Selected: {baseDate.tz(homeTimezone).hour(selectedHour).format('h:mm A')} ({homeTimezone})
                    <Button variant="link" size="sm" className="h-auto p-0 ml-2 text-xs" onClick={() => setSelectedHour(null)}>
                      Clear
                    </Button>
                  </span>
                ) : (
                  <span>Current time: {dayjs().format('h:mm A')}</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </SidebarInset>
    </ScrollSyncProvider>
  );
}
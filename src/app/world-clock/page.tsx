"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Search, SortAsc, SortDesc, Globe2, Sun, Moon, Clock12, Clock4, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface WorldClockItem {
  timezone: string;
  city: string;
  country: string;
  continent: string;
  flag: string;
  currentTime: string;
  date: string;
  utcOffset: string;
  isDaytime: boolean;
  timeFormat24: string;
  timeFormat12: string;
}

// Comprehensive list of world timezones with emojis
const WORLD_TIMEZONES = [
  // Americas
  { timezone: 'America/New_York', city: 'New York', country: 'United States', continent: 'Americas', flag: '🇺🇸' },
  { timezone: 'America/Los_Angeles', city: 'Los Angeles', country: 'United States', continent: 'Americas', flag: '🇺🇸' },
  { timezone: 'America/Chicago', city: 'Chicago', country: 'United States', continent: 'Americas', flag: '🇺🇸' },
  { timezone: 'America/Denver', city: 'Denver', country: 'United States', continent: 'Americas', flag: '🇺🇸' },
  { timezone: 'America/Phoenix', city: 'Phoenix', country: 'United States', continent: 'Americas', flag: '🇺🇸' },
  { timezone: 'America/Anchorage', city: 'Anchorage', country: 'United States', continent: 'Americas', flag: '🇺🇸' },
  { timezone: 'America/Toronto', city: 'Toronto', country: 'Canada', continent: 'Americas', flag: '🇨🇦' },
  { timezone: 'America/Vancouver', city: 'Vancouver', country: 'Canada', continent: 'Americas', flag: '🇨🇦' },
  { timezone: 'America/Montreal', city: 'Montreal', country: 'Canada', continent: 'Americas', flag: '🇨🇦' },
  { timezone: 'America/Mexico_City', city: 'Mexico City', country: 'Mexico', continent: 'Americas', flag: '🇲🇽' },
  { timezone: 'America/Sao_Paulo', city: 'São Paulo', country: 'Brazil', continent: 'Americas', flag: '🇧🇷' },
  { timezone: 'America/Buenos_Aires', city: 'Buenos Aires', country: 'Argentina', continent: 'Americas', flag: '🇦🇷' },
  { timezone: 'America/Lima', city: 'Lima', country: 'Peru', continent: 'Americas', flag: '🇵🇪' },
  { timezone: 'America/Bogota', city: 'Bogotá', country: 'Colombia', continent: 'Americas', flag: '🇨🇴' },
  { timezone: 'America/Santiago', city: 'Santiago', country: 'Chile', continent: 'Americas', flag: '🇨🇱' },
  { timezone: 'America/Caracas', city: 'Caracas', country: 'Venezuela', continent: 'Americas', flag: '🇻🇪' },
  
  // Europe
  { timezone: 'Europe/London', city: 'London', country: 'United Kingdom', continent: 'Europe', flag: '🇬🇧' },
  { timezone: 'Europe/Paris', city: 'Paris', country: 'France', continent: 'Europe', flag: '🇫🇷' },
  { timezone: 'Europe/Berlin', city: 'Berlin', country: 'Germany', continent: 'Europe', flag: '🇩🇪' },
  { timezone: 'Europe/Rome', city: 'Rome', country: 'Italy', continent: 'Europe', flag: '🇮🇹' },
  { timezone: 'Europe/Madrid', city: 'Madrid', country: 'Spain', continent: 'Europe', flag: '🇪🇸' },
  { timezone: 'Europe/Amsterdam', city: 'Amsterdam', country: 'Netherlands', continent: 'Europe', flag: '🇳🇱' },
  { timezone: 'Europe/Zurich', city: 'Zurich', country: 'Switzerland', continent: 'Europe', flag: '🇨🇭' },
  { timezone: 'Europe/Vienna', city: 'Vienna', country: 'Austria', continent: 'Europe', flag: '🇦🇹' },
  { timezone: 'Europe/Brussels', city: 'Brussels', country: 'Belgium', continent: 'Europe', flag: '🇧🇪' },
  { timezone: 'Europe/Stockholm', city: 'Stockholm', country: 'Sweden', continent: 'Europe', flag: '🇸🇪' },
  { timezone: 'Europe/Oslo', city: 'Oslo', country: 'Norway', continent: 'Europe', flag: '🇳🇴' },
  { timezone: 'Europe/Copenhagen', city: 'Copenhagen', country: 'Denmark', continent: 'Europe', flag: '🇩🇰' },
  { timezone: 'Europe/Helsinki', city: 'Helsinki', country: 'Finland', continent: 'Europe', flag: '🇫🇮' },
  { timezone: 'Europe/Warsaw', city: 'Warsaw', country: 'Poland', continent: 'Europe', flag: '🇵🇱' },
  { timezone: 'Europe/Prague', city: 'Prague', country: 'Czech Republic', continent: 'Europe', flag: '🇨🇿' },
  { timezone: 'Europe/Budapest', city: 'Budapest', country: 'Hungary', continent: 'Europe', flag: '🇭🇺' },
  { timezone: 'Europe/Bucharest', city: 'Bucharest', country: 'Romania', continent: 'Europe', flag: '🇷🇴' },
  { timezone: 'Europe/Athens', city: 'Athens', country: 'Greece', continent: 'Europe', flag: '🇬🇷' },
  { timezone: 'Europe/Moscow', city: 'Moscow', country: 'Russia', continent: 'Europe', flag: '🇷🇺' },
  { timezone: 'Europe/Istanbul', city: 'Istanbul', country: 'Turkey', continent: 'Europe', flag: '🇹🇷' },
  
  // Asia
  { timezone: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan', continent: 'Asia', flag: '🇯🇵' },
  { timezone: 'Asia/Shanghai', city: 'Shanghai', country: 'China', continent: 'Asia', flag: '🇨🇳' },
  { timezone: 'Asia/Hong_Kong', city: 'Hong Kong', country: 'Hong Kong', continent: 'Asia', flag: '🇭🇰' },
  { timezone: 'Asia/Singapore', city: 'Singapore', country: 'Singapore', continent: 'Asia', flag: '🇸🇬' },
  { timezone: 'Asia/Seoul', city: 'Seoul', country: 'South Korea', continent: 'Asia', flag: '🇰🇷' },
  { timezone: 'Asia/Dubai', city: 'Dubai', country: 'UAE', continent: 'Asia', flag: '🇦🇪' },
  { timezone: 'Asia/Bangkok', city: 'Bangkok', country: 'Thailand', continent: 'Asia', flag: '🇹🇭' },
  { timezone: 'Asia/Manila', city: 'Manila', country: 'Philippines', continent: 'Asia', flag: '🇵🇭' },
  { timezone: 'Asia/Jakarta', city: 'Jakarta', country: 'Indonesia', continent: 'Asia', flag: '🇮🇩' },
  { timezone: 'Asia/Kuala_Lumpur', city: 'Kuala Lumpur', country: 'Malaysia', continent: 'Asia', flag: '🇲🇾' },
  { timezone: 'Asia/Ho_Chi_Minh', city: 'Ho Chi Minh City', country: 'Vietnam', continent: 'Asia', flag: '🇻🇳' },
  { timezone: 'Asia/Taipei', city: 'Taipei', country: 'Taiwan', continent: 'Asia', flag: '🇹🇼' },
  { timezone: 'Asia/Riyadh', city: 'Riyadh', country: 'Saudi Arabia', continent: 'Asia', flag: '🇸🇦' },
  { timezone: 'Asia/Tel_Aviv', city: 'Tel Aviv', country: 'Palestine', continent: 'Asia', flag: '🇵🇸' },
  { timezone: 'Asia/Kolkata', city: 'Kolkata', country: 'India', continent: 'Asia', flag: '🇮🇳' },
  { timezone: 'Asia/Karachi', city: 'Karachi', country: 'Pakistan', continent: 'Asia', flag: '🇵🇰' },
  { timezone: 'Asia/Dhaka', city: 'Dhaka', country: 'Bangladesh', continent: 'Asia', flag: '🇧🇩' },
  { timezone: 'Asia/Colombo', city: 'Colombo', country: 'Sri Lanka', continent: 'Asia', flag: '🇱🇰' },
  
  // Africa
  { timezone: 'Africa/Cairo', city: 'Cairo', country: 'Egypt', continent: 'Africa', flag: '🇪🇬' },
  { timezone: 'Africa/Lagos', city: 'Lagos', country: 'Nigeria', continent: 'Africa', flag: '🇳🇬' },
  { timezone: 'Africa/Johannesburg', city: 'Johannesburg', country: 'South Africa', continent: 'Africa', flag: '🇿🇦' },
  { timezone: 'Africa/Nairobi', city: 'Nairobi', country: 'Kenya', continent: 'Africa', flag: '🇰🇪' },
  { timezone: 'Africa/Casablanca', city: 'Casablanca', country: 'Morocco', continent: 'Africa', flag: '🇲🇦' },
  { timezone: 'Africa/Algiers', city: 'Algiers', country: 'Algeria', continent: 'Africa', flag: '🇩🇿' },
  { timezone: 'Africa/Tunis', city: 'Tunis', country: 'Tunisia', continent: 'Africa', flag: '🇹🇳' },
  { timezone: 'Africa/Addis_Ababa', city: 'Addis Ababa', country: 'Ethiopia', continent: 'Africa', flag: '🇪🇹' },
  
  // Oceania
  { timezone: 'Australia/Sydney', city: 'Sydney', country: 'Australia', continent: 'Oceania', flag: '🇦🇺' },
  { timezone: 'Australia/Melbourne', city: 'Melbourne', country: 'Australia', continent: 'Oceania', flag: '🇦🇺' },
  { timezone: 'Australia/Perth', city: 'Perth', country: 'Australia', continent: 'Oceania', flag: '🇦🇺' },
  { timezone: 'Australia/Brisbane', city: 'Brisbane', country: 'Australia', continent: 'Oceania', flag: '🇦🇺' },
  { timezone: 'Australia/Adelaide', city: 'Adelaide', country: 'Australia', continent: 'Oceania', flag: '🇦🇺' },
  { timezone: 'Pacific/Auckland', city: 'Auckland', country: 'New Zealand', continent: 'Oceania', flag: '🇳🇿' },
  { timezone: 'Pacific/Fiji', city: 'Suva', country: 'Fiji', continent: 'Oceania', flag: '🇫🇯' },
  { timezone: 'Pacific/Honolulu', city: 'Honolulu', country: 'Hawaii', continent: 'Oceania', flag: '🇺🇸' },
  
  // UTC
  { timezone: 'UTC', city: 'UTC', country: 'Coordinated Universal Time', continent: 'UTC', flag: '🌍' },
];

type SortOption = 'city' | 'continent' | 'time' | 'utc-offset' | 'country';
type SortOrder = 'asc' | 'desc';

export default function WorldClockPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('continent');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [filteredTimezones, setFilteredTimezones] = useState(WORLD_TIMEZONES);
  const [use24HourFormat, setUse24HourFormat] = useState(true);
  const [showSeconds, setShowSeconds] = useState(false);
  const [showControls, setShowControls] = useState(false); // Collapsed by default on mobile
  const [activeTab, setActiveTab] = useState('all');

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Generate world clock data
  const worldClockData = useMemo<WorldClockItem[]>(() => {
    return filteredTimezones.map(tz => {
      const time = currentTime.tz(tz.timezone);
      const hour = time.hour();
      const isDaytime = hour >= 6 && hour < 18;

      return {
        timezone: tz.timezone,
        city: tz.city,
        country: tz.country,
        continent: tz.continent,
        flag: tz.flag,
        currentTime: time.format('HH:mm:ss'),
        date: time.format('MMM DD, YYYY'),
        utcOffset: time.format('Z'),
        isDaytime,
        timeFormat24: time.format('HH:mm:ss'),
        timeFormat12: time.format('h:mm:ss A'),
      };
    });
  }, [currentTime, filteredTimezones]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = worldClockData;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.continent.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort data
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortBy) {
        case 'city':
          aValue = a.city;
          bValue = b.city;
          break;
        case 'continent':
          aValue = a.continent === 'UTC' ? 'AAA_UTC' : a.continent; // Put UTC first
          bValue = b.continent === 'UTC' ? 'AAA_UTC' : b.continent;
          break;
        case 'country':
          aValue = a.country;
          bValue = b.country;
          break;
        case 'time':
          aValue = currentTime.tz(a.timezone).valueOf();
          bValue = currentTime.tz(b.timezone).valueOf();
          break;
        case 'utc-offset':
          aValue = currentTime.tz(a.timezone).utcOffset();
          bValue = currentTime.tz(b.timezone).utcOffset();
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    return filtered;
  }, [worldClockData, searchTerm, sortBy, sortOrder, currentTime]);

  // Update filtered timezones when search changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = WORLD_TIMEZONES.filter(tz =>
        tz.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tz.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tz.continent.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTimezones(filtered);
    } else {
      setFilteredTimezones(WORLD_TIMEZONES);
    }
  }, [searchTerm]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const groupedByContinent = useMemo(() => {
    const grouped: Record<string, WorldClockItem[]> = {};
    processedData.forEach(item => {
      if (!grouped[item.continent]) {
        grouped[item.continent] = [];
      }
      grouped[item.continent].push(item);
    });
    return grouped;
  }, [processedData]);

  const continentOptions = useMemo(() => {
    const continents = Object.keys(groupedByContinent).sort();
    return [{ value: 'all', label: `All (${processedData.length})` }].concat(
      continents.map(continent => ({
        value: continent,
        label: `${continent} (${groupedByContinent[continent].length})`
      }))
    );
  }, [groupedByContinent, processedData.length]);

  const displayData = useMemo(() => {
    if (activeTab === 'all') {
      return groupedByContinent;
    } else {
      return { [activeTab]: groupedByContinent[activeTab] || [] };
    }
  }, [activeTab, groupedByContinent]);

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
            <Clock className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold font-headline">World Clock</h1>
          </div>
          <ThemeToggleButton />
        </header>

        <div className="flex flex-1 flex-col p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">
                World Clock
              </h1>
              <p className="text-lg text-muted-foreground">
                View current time in all major cities and timezones around the world. Perfect for global teams and travelers.
              </p>
            </div>

            {/* Controls */}
            <Card>
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Controls</span>
                    <span className="sm:hidden text-sm">Settings</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowControls(!showControls)}
                    className="flex items-center gap-1 h-8 px-2"
                  >
                    {showControls ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        <span className="text-xs">Hide</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        <span className="text-xs">Show</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className={`space-y-4 sm:space-y-6 px-4 sm:px-6 ${showControls ? 'block pb-4 sm:pb-6' : 'hidden'}`}>
                {/* iPad optimized layout: Search gets full width on top, then 2x2 grid for other controls */}
                <div className="space-y-4 md:space-y-6">
                  {/* Search - Full width on iPad for better usability */}
                  <div className="w-full">
                    <Label htmlFor="search" className="text-xs sm:text-sm md:text-base mb-2 block">Search Cities or Countries</Label>
                    <div className="relative">
                      <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      <Input
                        id="search"
                        placeholder="Search cities, countries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 sm:pl-10 md:pl-12 h-9 sm:h-12 md:h-14 text-xs sm:text-sm md:text-base w-full"
                      />
                    </div>
                  </div>

                  {/* Sorting Controls - 2 columns on iPad */}
                  <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2">
                    {/* Sort By */}
                    <div className="space-y-2 md:space-y-3 min-w-0">
                      <Label htmlFor="sort-by" className="text-xs sm:text-sm md:text-base">Sort By</Label>
                      <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                        <SelectTrigger className="h-9 sm:h-12 md:h-14 text-xs sm:text-sm md:text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="continent">Continent</SelectItem>
                          <SelectItem value="city">City</SelectItem>
                          <SelectItem value="country">Country</SelectItem>
                          <SelectItem value="time">Current Time</SelectItem>
                          <SelectItem value="utc-offset">UTC Offset</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Sort Order */}
                    <div className="space-y-2 md:space-y-3 min-w-0">
                      <Label className="text-xs sm:text-sm md:text-base">Sort Order</Label>
                      <Button
                        variant="outline"
                        onClick={toggleSortOrder}
                        className="w-full h-9 sm:h-12 md:h-14 flex items-center justify-center gap-1 sm:gap-2 md:gap-3 text-xs sm:text-sm md:text-base"
                      >
                        {sortOrder === 'asc' ? (
                          <>
                            <SortAsc className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                            <span className="hidden sm:inline">Ascending</span>
                            <span className="sm:hidden">Asc</span>
                          </>
                        ) : (
                          <>
                            <SortDesc className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                            <span className="hidden sm:inline">Descending</span>
                            <span className="sm:hidden">Desc</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Time Format */}
                    <div className="space-y-2 md:space-y-3 min-w-0">
                      <Label htmlFor="time-format" className="text-xs sm:text-sm md:text-base">Time Format</Label>
                      <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 border rounded-lg h-9 sm:h-12 md:h-14">
                        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 text-xs sm:text-sm md:text-base">
                          <Clock12 className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                          <span>12h</span>
                        </div>
                        <Switch
                          id="time-format"
                          checked={use24HourFormat}
                          onCheckedChange={setUse24HourFormat}
                          className="md:scale-125"
                        />
                        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 text-xs sm:text-sm md:text-base">
                          <Clock4 className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                          <span>24h</span>
                        </div>
                      </div>
                    </div>

                    {/* Show Seconds */}
                    <div className="space-y-2 md:space-y-3 min-w-0">
                      <Label htmlFor="show-seconds" className="text-xs sm:text-sm md:text-base">Show Seconds</Label>
                      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 border rounded-lg h-9 sm:h-12 md:h-14">
                        <Switch
                          id="show-seconds"
                          checked={showSeconds}
                          onCheckedChange={setShowSeconds}
                          className="md:scale-125"
                        />
                        <span className="text-xs sm:text-sm md:text-base">{showSeconds ? 'Visible' : 'Hidden'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm md:text-base text-muted-foreground pt-2 border-t border-border">
                  <span>Total: {processedData.length}</span>
                  <span>•</span>
                  <span className="hidden sm:inline">Updated: {use24HourFormat ? currentTime.format('HH:mm') : currentTime.format('h:mm A')}</span>
                  <span className="sm:hidden">{use24HourFormat ? currentTime.format('HH:mm') : currentTime.format('h:mm A')}</span>
                  <span>•</span>
                  <span>{use24HourFormat ? '24h' : '12h'}</span>
                </div>
              </CardContent>
            </Card>

            {/* World Clock with Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="mb-4 sm:mb-6">
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-0.5 sm:gap-1 h-auto p-0.5 sm:p-1">
                  {continentOptions.map((option) => (
                    <TabsTrigger 
                      key={option.value} 
                      value={option.value}
                      className="text-xs sm:text-sm px-1 sm:px-2 md:px-4 py-1.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {continentOptions.map((option) => (
                <TabsContent key={option.value} value={option.value} className="mt-0">
                  <div className="space-y-4 sm:space-y-8">
                    {Object.entries(displayData).map(([continent, items]) => (
                      <Card key={continent}>
                        <CardHeader className={`${activeTab === 'all' ? 'block pb-3 sm:pb-6' : 'hidden'}`}>
                          <CardTitle className="flex items-center gap-2">
                            <Globe2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-base sm:text-lg">{continent} ({items.length})</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2 sm:pt-6">
                          {/* Mobile: 2 cols, Tablet: 3 cols, iPad Pro: 4-5 cols, Desktop: 5-6 cols */}
                          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                            {items.map((item) => (
                              <div
                                key={`${item.timezone}-${item.city}`}
                                className="group relative border border-border sm:border-2 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer bg-card hover:bg-card/80 backdrop-blur-sm"
                              >
                                
                                {/* Header with flag and location */}
                                <div className="relative flex items-start justify-between mb-1.5 sm:mb-2 md:mb-4">
                                  <div className="flex items-center gap-1 sm:gap-2 md:gap-3 min-w-0 flex-1">
                                    <div className="relative flex-shrink-0">
                                      <span 
                                        className="text-base sm:text-lg md:text-2xl lg:text-3xl drop-shadow-sm"
                                        style={{ fontFamily: "'Noto Color Emoji', sans-serif" }}
                                      >
                                        {item.flag}
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h3 className="font-bold text-xs sm:text-sm md:text-base truncate group-hover:text-primary transition-colors leading-tight">
                                        {item.city}
                                      </h3>
                                      <p className="text-xs sm:text-xs md:text-sm text-muted-foreground truncate">
                                        {item.country}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Day/Night indicator */}
                                  <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                                    {item.isDaytime ? (
                                      <div className="flex items-center gap-1 text-amber-500">
                                        <Sun className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 drop-shadow-sm" />
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-blue-400">
                                        <Moon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 drop-shadow-sm" />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Time display */}
                                <div className="relative space-y-1 sm:space-y-2 md:space-y-3">
                                  <div className="font-mono text-base sm:text-lg md:text-2xl lg:text-3xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
                                    {use24HourFormat
                                      ? currentTime.tz(item.timezone).format(showSeconds ? 'HH:mm:ss' : 'HH:mm')
                                      : currentTime.tz(item.timezone).format(showSeconds ? 'h:mm:ss A' : 'h:mm A')}
                                  </div>
                                  
                                  {/* Date */}
                                  <div className="text-xs sm:text-xs md:text-sm font-medium text-muted-foreground">
                                    {currentTime.tz(item.timezone).format('DD MMM YYYY')}
                                  </div>
                                  
                                  {/* UTC Offset Badge */}
                                  <div className="flex items-center justify-start pt-1 sm:pt-1.5 md:pt-2">
                                    <Badge 
                                      variant="secondary" 
                                      className="text-xs font-mono font-medium px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-0.5 md:py-1 bg-muted/80 group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                                    >
                                      UTC{item.utcOffset}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {processedData.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Globe2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No timezones found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms or clear the search to see all timezones.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

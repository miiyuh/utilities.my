import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Search, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { WorldMapClock, MAJOR_CITIES } from '@/components/world-map-clock';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface CityListItem {
  timezone: string;
  city: string;
  country: string;
  continent: string;
  flag: string;
  currentTime: string;
  date: string;
  utcOffset: string;
  isDaytime: boolean;
}

export default function WorldClockPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [use24HourFormat, setUse24HourFormat] = useState(true);
  const [showSeconds, setShowSeconds] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Generate city list data
  const cityListData = useMemo<CityListItem[]>(() => {
    return MAJOR_CITIES.map(city => {
      const time = currentTime.tz(city.timezone);
      const hour = time.hour();
      const isDaytime = hour >= 6 && hour < 18;

      return {
        timezone: city.timezone,
        city: city.city,
        country: city.country,
        continent: city.continent,
        flag: city.flag,
        currentTime: time.format('HH:mm:ss'),
        date: time.format('MMM DD, YYYY'),
        utcOffset: time.format('Z'),
        isDaytime,
      };
    });
  }, [currentTime]);

  // Filter cities by search term
  const filteredCities = useMemo(() => {
    if (!searchTerm) return cityListData;
    
    return cityListData.filter(item =>
      item.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.continent.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cityListData, searchTerm]);

  // Group cities by continent
  const groupedByContinent = useMemo(() => {
    const grouped: Record<string, CityListItem[]> = {};
    filteredCities.forEach(item => {
      if (!grouped[item.continent]) {
        grouped[item.continent] = [];
      }
      grouped[item.continent].push(item);
    });
    return grouped;
  }, [filteredCities]);

  const continents = useMemo(() => {
    return Object.keys(groupedByContinent).sort();
  }, [groupedByContinent]);

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
                View current time in all major cities around the world. Click on a city marker on the map to see its time.
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
                <div className="space-y-4 md:space-y-6">
                  {/* View Mode */}
                  <div className="w-full">
                    <Label className="text-xs sm:text-sm md:text-base mb-2 block">View Mode</Label>
                    <Select value={viewMode} onValueChange={(value: 'map' | 'list') => setViewMode(value)}>
                      <SelectTrigger className="h-9 sm:h-12 md:h-14 text-xs sm:text-sm md:text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="map">Map View</SelectItem>
                        <SelectItem value="list">List View</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search */}
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

                  {/* Format Controls */}
                  <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2">
                    {/* Time Format */}
                    <div className="space-y-2 md:space-y-3">
                      <Label htmlFor="time-format" className="text-xs sm:text-sm md:text-base">Time Format</Label>
                      <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 border rounded-lg h-9 sm:h-12 md:h-14">
                        <span className="text-xs sm:text-sm md:text-base">12h</span>
                        <Switch
                          id="time-format"
                          checked={use24HourFormat}
                          onCheckedChange={setUse24HourFormat}
                          className="md:scale-125"
                        />
                        <span className="text-xs sm:text-sm md:text-base">24h</span>
                      </div>
                    </div>

                    {/* Show Seconds */}
                    <div className="space-y-2 md:space-y-3">
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
                  <span>Total: {filteredCities.length}</span>
                  <span>•</span>
                  <span>{use24HourFormat ? currentTime.format('HH:mm') : currentTime.format('h:mm A')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Map View */}
            {viewMode === 'map' && (
              <Card className="overflow-hidden">
                <CardContent className="relative p-0 h-[500px] sm:h-[600px] md:h-[700px]">
                  <WorldMapClock
                    currentTime={currentTime}
                    use24HourFormat={use24HourFormat}
                    showSeconds={showSeconds}
                  />
                </CardContent>
              </Card>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-6">
                {continents.map(continent => (
                  <Card key={continent}>
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl">
                        {continent} ({groupedByContinent[continent].length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {groupedByContinent[continent].map(city => (
                          <div
                            key={`${city.timezone}-${city.city}`}
                            className="border border-border rounded-lg p-3 sm:p-4 md:p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300 bg-card"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl" style={{ fontFamily: "'Noto Color Emoji', sans-serif" }}>
                                  {city.flag}
                                </span>
                                <div>
                                  <h3 className="font-bold text-sm sm:text-base">{city.city}</h3>
                                  <p className="text-xs sm:text-sm text-muted-foreground">{city.country}</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="font-mono text-xl sm:text-2xl font-bold">
                                {use24HourFormat
                                  ? currentTime.tz(city.timezone).format(showSeconds ? 'HH:mm:ss' : 'HH:mm')
                                  : currentTime.tz(city.timezone).format(showSeconds ? 'h:mm:ss A' : 'h:mm A')}
                              </div>
                              
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {currentTime.tz(city.timezone).format('DD MMM YYYY')}
                              </p>
                              
                              <div className="flex items-center justify-between pt-2 border-t border-border">
                                <Badge variant="secondary" className="text-xs font-mono">
                                  UTC{city.utcOffset}
                                </Badge>
                                {city.isDaytime ? (
                                  <span className="text-sm text-amber-500">☀️ Day</span>
                                ) : (
                                  <span className="text-sm text-blue-400">🌙 Night</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredCities.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No cities found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms or clear the search to see all cities.
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


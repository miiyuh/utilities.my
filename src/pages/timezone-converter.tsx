import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Globe,
  Copy,
  Plus,
  X,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import { SidebarContent } from '@/components/sidebar-content';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Get timezone abbreviation
const getTimezoneAbbr = (tz: string, date: dayjs.Dayjs): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(date.toDate());
    return parts.find(part => part.type === 'timeZoneName')?.value || 'UTC';
  } catch {
    return 'UTC';
  }
};

// Timezone data with metadata
interface TimezoneItem {
  value: string;
  city: string;
  country: string;
  flag: string;
}

const TIMEZONE_LIST: TimezoneItem[] = [
  { value: 'UTC', city: 'UTC', country: 'Coordinated Universal Time', flag: '🌍' },
  { value: 'America/New_York', city: 'New York', country: 'United States', flag: '🇺🇸' },
  { value: 'America/Los_Angeles', city: 'Los Angeles', country: 'United States', flag: '🇺🇸' },
  { value: 'America/Chicago', city: 'Chicago', country: 'United States', flag: '🇺🇸' },
  { value: 'America/Denver', city: 'Denver', country: 'United States', flag: '🇺🇸' },
  { value: 'America/Toronto', city: 'Toronto', country: 'Canada', flag: '🇨🇦' },
  { value: 'America/Vancouver', city: 'Vancouver', country: 'Canada', flag: '🇨🇦' },
  { value: 'America/Mexico_City', city: 'Mexico City', country: 'Mexico', flag: '🇲🇽' },
  { value: 'America/Sao_Paulo', city: 'São Paulo', country: 'Brazil', flag: '🇧🇷' },
  { value: 'America/Buenos_Aires', city: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷' },
  { value: 'Europe/London', city: 'London', country: 'United Kingdom', flag: '🇬🇧' },
  { value: 'Europe/Paris', city: 'Paris', country: 'France', flag: '🇫🇷' },
  { value: 'Europe/Berlin', city: 'Berlin', country: 'Germany', flag: '🇩🇪' },
  { value: 'Europe/Rome', city: 'Rome', country: 'Italy', flag: '🇮🇹' },
  { value: 'Europe/Madrid', city: 'Madrid', country: 'Spain', flag: '🇪🇸' },
  { value: 'Europe/Amsterdam', city: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱' },
  { value: 'Europe/Brussels', city: 'Brussels', country: 'Belgium', flag: '🇧🇪' },
  { value: 'Europe/Vienna', city: 'Vienna', country: 'Austria', flag: '🇦🇹' },
  { value: 'Europe/Zurich', city: 'Zurich', country: 'Switzerland', flag: '🇨🇭' },
  { value: 'Europe/Stockholm', city: 'Stockholm', country: 'Sweden', flag: '🇸🇪' },
  { value: 'Europe/Oslo', city: 'Oslo', country: 'Norway', flag: '🇳🇴' },
  { value: 'Europe/Copenhagen', city: 'Copenhagen', country: 'Denmark', flag: '🇩🇰' },
  { value: 'Europe/Helsinki', city: 'Helsinki', country: 'Finland', flag: '🇫🇮' },
  { value: 'Europe/Warsaw', city: 'Warsaw', country: 'Poland', flag: '🇵🇱' },
  { value: 'Europe/Prague', city: 'Prague', country: 'Czech Republic', flag: '🇨🇿' },
  { value: 'Europe/Athens', city: 'Athens', country: 'Greece', flag: '🇬🇷' },
  { value: 'Europe/Istanbul', city: 'Istanbul', country: 'Turkey', flag: '🇹🇷' },
  { value: 'Europe/Moscow', city: 'Moscow', country: 'Russia', flag: '🇷🇺' },
  { value: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan', flag: '🇯🇵' },
  { value: 'Asia/Shanghai', city: 'Shanghai', country: 'China', flag: '🇨🇳' },
  { value: 'Asia/Hong_Kong', city: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰' },
  { value: 'Asia/Singapore', city: 'Singapore', country: 'Singapore', flag: '🇸🇬' },
  { value: 'Asia/Seoul', city: 'Seoul', country: 'South Korea', flag: '🇰🇷' },
  { value: 'Asia/Bangkok', city: 'Bangkok', country: 'Thailand', flag: '🇹🇭' },
  { value: 'Asia/Manila', city: 'Manila', country: 'Philippines', flag: '🇵🇭' },
  { value: 'Asia/Jakarta', city: 'Jakarta', country: 'Indonesia', flag: '🇮🇩' },
  { value: 'Asia/Kuala_Lumpur', city: 'Kuala Lumpur', country: 'Malaysia', flag: '🇲🇾' },
  { value: 'Asia/Ho_Chi_Minh', city: 'Ho Chi Minh', country: 'Vietnam', flag: '🇻🇳' },
  { value: 'Asia/Mumbai', city: 'Mumbai', country: 'India', flag: '🇮🇳' },
  { value: 'Asia/Kolkata', city: 'Kolkata', country: 'India', flag: '🇮🇳' },
  { value: 'Asia/Dubai', city: 'Dubai', country: 'United Arab Emirates', flag: '🇦🇪' },
  { value: 'Asia/Karachi', city: 'Karachi', country: 'Pakistan', flag: '🇵🇰' },
  { value: 'Asia/Dhaka', city: 'Dhaka', country: 'Bangladesh', flag: '🇧🇩' },
  { value: 'Australia/Sydney', city: 'Sydney', country: 'Australia', flag: '🇦🇺' },
  { value: 'Australia/Melbourne', city: 'Melbourne', country: 'Australia', flag: '🇦🇺' },
  { value: 'Australia/Brisbane', city: 'Brisbane', country: 'Australia', flag: '🇦🇺' },
  { value: 'Pacific/Auckland', city: 'Auckland', country: 'New Zealand', flag: '🇳🇿' },
  { value: 'Africa/Cairo', city: 'Cairo', country: 'Egypt', flag: '🇪🇬' },
  { value: 'Africa/Lagos', city: 'Lagos', country: 'Nigeria', flag: '🇳🇬' },
  { value: 'Africa/Johannesburg', city: 'Johannesburg', country: 'South Africa', flag: '🇿🇦' },
];

export default function TimezoneConverterPage() {
  const { toast } = useToast();
  
  // State for reference timezone and time
  const [referenceTimezone, setReferenceTimezone] = useState(dayjs.tz.guess());
  const [referenceDate, setReferenceDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [referenceTime, setReferenceTime] = useState(dayjs().format('HH:mm'));
  
  // Selected timezones to display
  const [selectedTimezones, setSelectedTimezones] = useState<string[]>([
    dayjs.tz.guess(),
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
  ]);
  
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Calculate the reference moment
  const referenceMoment = useMemo(() => {
    try {
      return dayjs.tz(`${referenceDate} ${referenceTime}`, 'YYYY-MM-DD HH:mm', referenceTimezone);
    } catch {
      return dayjs().tz(referenceTimezone);
    }
  }, [referenceDate, referenceTime, referenceTimezone]);

  // Get conversions for all selected timezones
  const conversions = useMemo(() => {
    return selectedTimezones.map(tz => {
      const converted = referenceMoment.clone().tz(tz);
      return {
        timezone: tz,
        time: converted.format('HH:mm'),
        date: converted.format('ddd, D MMM YYYY'),
        utcOffset: converted.format('Z'),        abbr: getTimezoneAbbr(tz, converted),      };
    });
  }, [referenceMoment, selectedTimezones]);

  const addTimezone = (tz: string) => {
    if (selectedTimezones.includes(tz)) {
      toast({
        title: 'Already added',
        description: 'This timezone is already in your list.',
      });
      return;
    }
    setSelectedTimezones([...selectedTimezones, tz]);
    setShowAddMenu(false);
  };

  const removeTimezone = (tz: string) => {
    if (selectedTimezones.length === 1) {
      toast({
        title: 'Cannot remove',
        description: 'You need at least one timezone.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedTimezones(selectedTimezones.filter(t => t !== tz));
  };

  const copyTimeInfo = (timezone: string, time: string, date: string) => {
    const text = `${time} (${timezone})\n${date}`;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Time information copied to clipboard.',
    });
  };

  const setToNow = () => {
    const now = dayjs();
    setReferenceDate(now.format('YYYY-MM-DD'));
    setReferenceTime(now.format('HH:mm'));
  };

  const tzData = TIMEZONE_LIST.find(tz => tz.value === referenceTimezone) || TIMEZONE_LIST[0];

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
            <h1 className="text-xl font-semibold font-headline">Timezone Converter</h1>
          </div>
          <ThemeToggleButton />
        </header>

        <div className="flex flex-1 flex-col overflow-auto">
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-6xl mx-auto space-y-8">
              {/* Main Heading */}
              <div>
                <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">
                  Timezone Converter
                </h1>
                <p className="text-lg text-muted-foreground">
                  Enter a time in your reference timezone and instantly see what time it is worldwide.
                </p>
              </div>

              {/* Reference Time Input Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Reference Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Timezone Selector */}
                    <div className="space-y-2">
                      <Label htmlFor="ref-tz">Timezone</Label>
                      <Select value={referenceTimezone} onValueChange={setReferenceTimezone}>
                        <SelectTrigger id="ref-tz" className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {TIMEZONE_LIST.map(tz => (
                            <SelectItem key={tz.value} value={tz.value}>
                              <span className="flex items-center gap-2">
                                <span className="flag-emoji">{tz.flag}</span>
                                <span>
                                  {tz.city} ({tz.value})
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Picker */}
                    <div className="space-y-2">
                      <Label htmlFor="ref-date">Date</Label>
                      <div className="flex gap-2">
                        <Input
                          id="ref-date"
                          type="date"
                          value={referenceDate}
                          onChange={e => setReferenceDate(e.target.value)}
                          className="h-11 flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={setToNow}
                          className="h-11 px-4"
                          title="Set to today"
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Time Picker */}
                  <div className="space-y-2">
                    <Label htmlFor="ref-time">Time</Label>
                    <Input
                      id="ref-time"
                      type="time"
                      value={referenceTime}
                      onChange={e => setReferenceTime(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  {/* Display Current Reference Info */}
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Reference Time</div>
                        <div className="text-3xl font-mono font-bold text-primary">
                          {referenceMoment.format('HH:mm')}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          {referenceMoment.format('ddd, MMMM D, YYYY')} (<span className="flag-emoji">{tzData.flag}</span> {referenceTimezone})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">UTC Offset</div>
                        <div className="text-2xl font-mono font-bold text-foreground">
                          {referenceMoment.format('Z')}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conversions Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Conversions</h2>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddMenu(!showAddMenu)}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Timezone
                    </Button>
                    {showAddMenu && (
                      <div className="absolute right-0 top-full mt-2 bg-popover border rounded-lg shadow-lg z-50 w-72 max-h-96 overflow-y-auto">
                        {TIMEZONE_LIST.map(tz => (
                          <button
                            key={tz.value}
                            onClick={() => addTimezone(tz.value)}
                            disabled={selectedTimezones.includes(tz.value)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="flag-emoji">{tz.flag}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{tz.city}</div>
                              <div className="text-xs text-muted-foreground">{tz.country}</div>
                            </div>
                            {selectedTimezones.includes(tz.value) && (
                              <Badge variant="secondary" className="ml-auto">Added</Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {conversions.map(conversion => {
                    const tzInfo = TIMEZONE_LIST.find(t => t.value === conversion.timezone);
                    return (
                      <Card key={conversion.timezone} className="flex flex-col">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center justify-between">
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="flag-emoji">{tzInfo?.flag}</span>
                              <div className="min-w-0">
                                <div className="truncate">{tzInfo?.city}</div>
                                <div className="text-xs font-normal text-muted-foreground">{conversion.abbr}</div>
                              </div>
                            </span>
                            <button
                              onClick={() =>
                                copyTimeInfo(
                                  conversion.timezone,
                                  conversion.time,
                                  conversion.date
                                )
                              }
                              className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                              title="Copy"
                            >
                              <Copy className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                          <div>
                            <div className="text-4xl font-mono font-bold text-primary">
                              {conversion.time}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              {conversion.date}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <span className="text-xs text-muted-foreground">UTC Offset</span>
                            <span className="font-mono font-semibold">{conversion.utcOffset}</span>
                          </div>
                          {conversion.timezone !== referenceTimezone && (
                            <button
                              onClick={() => {
                                setReferenceTimezone(conversion.timezone);
                                setReferenceTime(conversion.time);
                                setReferenceDate(referenceMoment.clone().tz(conversion.timezone).format('YYYY-MM-DD'));
                              }}
                              className="w-full py-2 px-3 text-sm font-medium bg-muted hover:bg-muted/80 rounded transition-colors"
                            >
                              Use as Reference
                            </button>
                          )}
                          <button
                            onClick={() => removeTimezone(conversion.timezone)}
                            className="w-full py-2 px-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded transition-colors flex items-center justify-center gap-1"
                          >
                            <X className="h-4 w-4" />
                            Remove
                          </button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Usage Tips */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base">How to use</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    • <strong>Set your reference timezone</strong> &ndash; Choose the timezone you&apos;re working with or in.
                  </p>
                  <p>
                    • <strong>Pick a date and time</strong> &ndash; Enter the time you want to convert.
                  </p>
                  <p>
                    • <strong>View conversions</strong> &ndash; Instantly see what time it is in all your selected timezones.
                  </p>
                  <p>
                    • <strong>Add/remove timezones</strong> &ndash; Use the button to add more locations or remove ones you don&apos;t need.
                  </p>
                  <p>
                    • <strong>Switch reference</strong> &ndash; Click &quot;Use as Reference&quot; on any card to make it your new reference timezone.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

// Shared city / timezone dataset used by the timezone comparison and world clock tools.

export interface CityZone {
  timezone: string;
  city: string;
  country: string;
  flag: string;
  /** Latitude in degrees (positive = north). */
  lat: number;
  /** Longitude in degrees (positive = east). */
  lon: number;
}

export const CITY_ZONES: CityZone[] = [
  { timezone: 'Pacific/Honolulu', city: 'Honolulu', country: 'United States', flag: '🇺🇸', lat: 21.3069, lon: -157.8583 },
  { timezone: 'America/Anchorage', city: 'Anchorage', country: 'United States', flag: '🇺🇸', lat: 61.2181, lon: -149.9003 },
  { timezone: 'America/Los_Angeles', city: 'Los Angeles', country: 'United States', flag: '🇺🇸', lat: 34.0522, lon: -118.2437 },
  { timezone: 'America/Denver', city: 'Denver', country: 'United States', flag: '🇺🇸', lat: 39.7392, lon: -104.9903 },
  { timezone: 'America/Chicago', city: 'Chicago', country: 'United States', flag: '🇺🇸', lat: 41.8781, lon: -87.6298 },
  { timezone: 'America/New_York', city: 'New York', country: 'United States', flag: '🇺🇸', lat: 40.7128, lon: -74.006 },
  { timezone: 'America/Toronto', city: 'Toronto', country: 'Canada', flag: '🇨🇦', lat: 43.6532, lon: -79.3832 },
  { timezone: 'America/Mexico_City', city: 'Mexico City', country: 'Mexico', flag: '🇲🇽', lat: 19.4326, lon: -99.1332 },
  { timezone: 'America/Bogota', city: 'Bogotá', country: 'Colombia', flag: '🇨🇴', lat: 4.711, lon: -74.0721 },
  { timezone: 'America/Sao_Paulo', city: 'São Paulo', country: 'Brazil', flag: '🇧🇷', lat: -23.5505, lon: -46.6333 },
  { timezone: 'America/Argentina/Buenos_Aires', city: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷', lat: -34.6037, lon: -58.3816 },
  { timezone: 'Atlantic/Reykjavik', city: 'Reykjavík', country: 'Iceland', flag: '🇮🇸', lat: 64.1466, lon: -21.9426 },
  { timezone: 'Europe/London', city: 'London', country: 'United Kingdom', flag: '🇬🇧', lat: 51.5074, lon: -0.1278 },
  { timezone: 'Europe/Dublin', city: 'Dublin', country: 'Ireland', flag: '🇮🇪', lat: 53.3498, lon: -6.2603 },
  { timezone: 'Europe/Lisbon', city: 'Lisbon', country: 'Portugal', flag: '🇵🇹', lat: 38.7223, lon: -9.1393 },
  { timezone: 'Europe/Paris', city: 'Paris', country: 'France', flag: '🇫🇷', lat: 48.8566, lon: 2.3522 },
  { timezone: 'Europe/Madrid', city: 'Madrid', country: 'Spain', flag: '🇪🇸', lat: 40.4168, lon: -3.7038 },
  { timezone: 'Europe/Berlin', city: 'Berlin', country: 'Germany', flag: '🇩🇪', lat: 52.52, lon: 13.405 },
  { timezone: 'Europe/Rome', city: 'Rome', country: 'Italy', flag: '🇮🇹', lat: 41.9028, lon: 12.4964 },
  { timezone: 'Europe/Amsterdam', city: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱', lat: 52.3676, lon: 4.9041 },
  { timezone: 'Europe/Stockholm', city: 'Stockholm', country: 'Sweden', flag: '🇸🇪', lat: 59.3293, lon: 18.0686 },
  { timezone: 'Europe/Athens', city: 'Athens', country: 'Greece', flag: '🇬🇷', lat: 37.9838, lon: 23.7275 },
  { timezone: 'Europe/Istanbul', city: 'Istanbul', country: 'Turkey', flag: '🇹🇷', lat: 41.0082, lon: 28.9784 },
  { timezone: 'Europe/Moscow', city: 'Moscow', country: 'Russia', flag: '🇷🇺', lat: 55.7558, lon: 37.6173 },
  { timezone: 'Africa/Cairo', city: 'Cairo', country: 'Egypt', flag: '🇪🇬', lat: 30.0444, lon: 31.2357 },
  { timezone: 'Africa/Lagos', city: 'Lagos', country: 'Nigeria', flag: '🇳🇬', lat: 6.5244, lon: 3.3792 },
  { timezone: 'Africa/Johannesburg', city: 'Johannesburg', country: 'South Africa', flag: '🇿🇦', lat: -26.2041, lon: 28.0473 },
  { timezone: 'Africa/Nairobi', city: 'Nairobi', country: 'Kenya', flag: '🇰🇪', lat: -1.2921, lon: 36.8219 },
  { timezone: 'Asia/Dubai', city: 'Dubai', country: 'UAE', flag: '🇦🇪', lat: 25.2048, lon: 55.2708 },
  { timezone: 'Asia/Tehran', city: 'Tehran', country: 'Iran', flag: '🇮🇷', lat: 35.6892, lon: 51.389 },
  { timezone: 'Asia/Karachi', city: 'Karachi', country: 'Pakistan', flag: '🇵🇰', lat: 24.8607, lon: 67.0011 },
  { timezone: 'Asia/Kolkata', city: 'Mumbai', country: 'India', flag: '🇮🇳', lat: 19.076, lon: 72.8777 },
  { timezone: 'Asia/Dhaka', city: 'Dhaka', country: 'Bangladesh', flag: '🇧🇩', lat: 23.8103, lon: 90.4125 },
  { timezone: 'Asia/Bangkok', city: 'Bangkok', country: 'Thailand', flag: '🇹🇭', lat: 13.7563, lon: 100.5018 },
  { timezone: 'Asia/Jakarta', city: 'Jakarta', country: 'Indonesia', flag: '🇮🇩', lat: -6.2088, lon: 106.8456 },
  { timezone: 'Asia/Singapore', city: 'Singapore', country: 'Singapore', flag: '🇸🇬', lat: 1.3521, lon: 103.8198 },
  { timezone: 'Asia/Kuala_Lumpur', city: 'Kuala Lumpur', country: 'Malaysia', flag: '🇲🇾', lat: 3.139, lon: 101.6869 },
  { timezone: 'Asia/Hong_Kong', city: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰', lat: 22.3193, lon: 114.1694 },
  { timezone: 'Asia/Shanghai', city: 'Shanghai', country: 'China', flag: '🇨🇳', lat: 31.2304, lon: 121.4737 },
  { timezone: 'Asia/Manila', city: 'Manila', country: 'Philippines', flag: '🇵🇭', lat: 14.5995, lon: 120.9842 },
  { timezone: 'Asia/Seoul', city: 'Seoul', country: 'South Korea', flag: '🇰🇷', lat: 37.5665, lon: 126.978 },
  { timezone: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan', flag: '🇯🇵', lat: 35.6762, lon: 139.6503 },
  { timezone: 'Australia/Perth', city: 'Perth', country: 'Australia', flag: '🇦🇺', lat: -31.9505, lon: 115.8605 },
  { timezone: 'Australia/Sydney', city: 'Sydney', country: 'Australia', flag: '🇦🇺', lat: -33.8688, lon: 151.2093 },
  { timezone: 'Pacific/Auckland', city: 'Auckland', country: 'New Zealand', flag: '🇳🇿', lat: -36.8485, lon: 174.7633 },
];

export function findCityZone(timezone: string): CityZone | undefined {
  return CITY_ZONES.find((c) => c.timezone === timezone);
}

/** Human label for a timezone, falling back to the raw IANA name. */
export function zoneLabel(timezone: string): string {
  const c = findCityZone(timezone);
  return c ? c.city : timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;
}

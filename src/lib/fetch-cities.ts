/**
 * Loads major cities from a local dataset and fixes missing/invalid timezones
 * using the city-timezones mapping plus country fallbacks.
 */

export interface CityData {
  timezone: string;
  city: string;
  country: string;
  continent: string;
  flag: string;
  latitude: number;
  longitude: number;
}

// Raw shape from src/data/cities.json
type RawCity = {
  country: string;
  capital: string;
  lat: number;
  long: number;
  timezone: string;
};

const CITIES_DATA_URL = new URL('../data/cities.json', import.meta.url).href;
const CITY_TIMEZONE_SOURCE = 'https://raw.githubusercontent.com/kevinroberts/city-timezones/master/data/cityMap.json';

// Comprehensive list of major world cities with coordinates and timezones
const WORLD_CITIES: CityData[] = [
  // Americas - North America
  { timezone: 'America/New_York', city: 'New York', country: 'United States', continent: 'Americas', flag: '🇺🇸', latitude: 40.7128, longitude: -74.0060 },
  { timezone: 'America/Los_Angeles', city: 'Los Angeles', country: 'United States', continent: 'Americas', flag: '🇺🇸', latitude: 34.0522, longitude: -118.2437 },
  { timezone: 'America/Chicago', city: 'Chicago', country: 'United States', continent: 'Americas', flag: '🇺🇸', latitude: 41.8781, longitude: -87.6298 },
  { timezone: 'America/Denver', city: 'Denver', country: 'United States', continent: 'Americas', flag: '🇺🇸', latitude: 39.7392, longitude: -104.9903 },
  { timezone: 'America/Anchorage', city: 'Anchorage', country: 'United States', continent: 'Americas', flag: '🇺🇸', latitude: 61.2181, longitude: -149.9003 },
  { timezone: 'Pacific/Honolulu', city: 'Honolulu', country: 'United States', continent: 'Americas', flag: '🇺🇸', latitude: 21.3099, longitude: -157.8581 },
  { timezone: 'America/Phoenix', city: 'Phoenix', country: 'United States', continent: 'Americas', flag: '🇺🇸', latitude: 33.4484, longitude: -112.0742 },
  { timezone: 'America/Detroit', city: 'Detroit', country: 'United States', continent: 'Americas', flag: '🇺🇸', latitude: 42.3314, longitude: -83.0458 },
  { timezone: 'America/Toronto', city: 'Toronto', country: 'Canada', continent: 'Americas', flag: '🇨🇦', latitude: 43.6532, longitude: -79.3832 },
  { timezone: 'America/Vancouver', city: 'Vancouver', country: 'Canada', continent: 'Americas', flag: '🇨🇦', latitude: 49.2827, longitude: -123.1207 },
  { timezone: 'America/Montreal', city: 'Montreal', country: 'Canada', continent: 'Americas', flag: '🇨🇦', latitude: 45.5017, longitude: -73.5673 },
  { timezone: 'America/Mexico_City', city: 'Mexico City', country: 'Mexico', continent: 'Americas', flag: '🇲🇽', latitude: 19.4326, longitude: -99.1332 },
  { timezone: 'America/Mexico_City', city: 'Guadalajara', country: 'Mexico', continent: 'Americas', flag: '🇲🇽', latitude: 20.6595, longitude: -103.2494 },
  { timezone: 'America/Mexico_City', city: 'Cancun', country: 'Mexico', continent: 'Americas', flag: '🇲🇽', latitude: 21.1629, longitude: -87.0739 },

  // Americas - Central America
  { timezone: 'America/Guatemala', city: 'Guatemala City', country: 'Guatemala', continent: 'Americas', flag: '🇬🇹', latitude: 14.6349, longitude: -90.5069 },
  { timezone: 'America/Costa_Rica', city: 'San Jose', country: 'Costa Rica', continent: 'Americas', flag: '🇨🇷', latitude: 9.9281, longitude: -84.0907 },
  { timezone: 'America/Panama', city: 'Panama City', country: 'Panama', continent: 'Americas', flag: '🇵🇦', latitude: 8.9824, longitude: -79.5199 },

  // Americas - South America
  { timezone: 'America/Sao_Paulo', city: 'Sao Paulo', country: 'Brazil', continent: 'Americas', flag: '🇧🇷', latitude: -23.5505, longitude: -46.6333 },
  { timezone: 'America/Sao_Paulo', city: 'Rio de Janeiro', country: 'Brazil', continent: 'Americas', flag: '🇧🇷', latitude: -22.9068, longitude: -43.1729 },
  { timezone: 'America/Manaus', city: 'Manaus', country: 'Brazil', continent: 'Americas', flag: '🇧🇷', latitude: -3.1190, longitude: -60.0217 },
  { timezone: 'America/Buenos_Aires', city: 'Buenos Aires', country: 'Argentina', continent: 'Americas', flag: '🇦🇷', latitude: -34.6037, longitude: -58.3816 },
  { timezone: 'America/Cordoba', city: 'Cordoba', country: 'Argentina', continent: 'Americas', flag: '🇦🇷', latitude: -31.4135, longitude: -64.1811 },
  { timezone: 'America/Santiago', city: 'Santiago', country: 'Chile', continent: 'Americas', flag: '🇨🇱', latitude: -33.4489, longitude: -70.6693 },
  { timezone: 'America/Lima', city: 'Lima', country: 'Peru', continent: 'Americas', flag: '🇵🇪', latitude: -12.0464, longitude: -77.0428 },
  { timezone: 'America/Bogota', city: 'Bogota', country: 'Colombia', continent: 'Americas', flag: '🇨🇴', latitude: 4.7110, longitude: -74.0055 },
  { timezone: 'America/Caracas', city: 'Caracas', country: 'Venezuela', continent: 'Americas', flag: '🇻🇪', latitude: 10.4806, longitude: -66.9036 },
  { timezone: 'America/La_Paz', city: 'La Paz', country: 'Bolivia', continent: 'Americas', flag: '🇧🇴', latitude: -16.2902, longitude: -63.5887 },

  // Europe - Western Europe
  { timezone: 'Europe/London', city: 'London', country: 'United Kingdom', continent: 'Europe', flag: '🇬🇧', latitude: 51.5074, longitude: -0.1278 },
  { timezone: 'Europe/London', city: 'Manchester', country: 'United Kingdom', continent: 'Europe', flag: '🇬🇧', latitude: 53.4808, longitude: -2.2426 },
  { timezone: 'Europe/Paris', city: 'Paris', country: 'France', continent: 'Europe', flag: '🇫🇷', latitude: 48.8566, longitude: 2.3522 },
  { timezone: 'Europe/Paris', city: 'Marseille', country: 'France', continent: 'Europe', flag: '🇫🇷', latitude: 43.2965, longitude: 5.3698 },
  { timezone: 'Europe/Amsterdam', city: 'Amsterdam', country: 'Netherlands', continent: 'Europe', flag: '🇳🇱', latitude: 52.3676, longitude: 4.9041 },
  { timezone: 'Europe/Amsterdam', city: 'Rotterdam', country: 'Netherlands', continent: 'Europe', flag: '🇳🇱', latitude: 51.9225, longitude: 4.4792 },
  { timezone: 'Europe/Brussels', city: 'Brussels', country: 'Belgium', continent: 'Europe', flag: '🇧🇪', latitude: 50.8503, longitude: 4.3517 },
  { timezone: 'Europe/Zurich', city: 'Zurich', country: 'Switzerland', continent: 'Europe', flag: '🇨🇭', latitude: 47.3769, longitude: 8.5472 },
  { timezone: 'Europe/Zurich', city: 'Geneva', country: 'Switzerland', continent: 'Europe', flag: '🇨🇭', latitude: 46.2044, longitude: 6.1432 },
  { timezone: 'Europe/Lisbon', city: 'Lisbon', country: 'Portugal', continent: 'Europe', flag: '🇵🇹', latitude: 38.7223, longitude: -9.1393 },

  // Europe - Central Europe
  { timezone: 'Europe/Berlin', city: 'Berlin', country: 'Germany', continent: 'Europe', flag: '🇩🇪', latitude: 52.5200, longitude: 13.4050 },
  { timezone: 'Europe/Berlin', city: 'Munich', country: 'Germany', continent: 'Europe', flag: '🇩🇪', latitude: 48.1351, longitude: 11.5820 },
  { timezone: 'Europe/Berlin', city: 'Hamburg', country: 'Germany', continent: 'Europe', flag: '🇩🇪', latitude: 53.5511, longitude: 9.4979 },
  { timezone: 'Europe/Vienna', city: 'Vienna', country: 'Austria', continent: 'Europe', flag: '🇦🇹', latitude: 48.2082, longitude: 16.3738 },
  { timezone: 'Europe/Prague', city: 'Prague', country: 'Czech Republic', continent: 'Europe', flag: '🇨🇿', latitude: 50.0755, longitude: 14.4378 },
  { timezone: 'Europe/Warsaw', city: 'Warsaw', country: 'Poland', continent: 'Europe', flag: '🇵🇱', latitude: 52.2297, longitude: 21.0122 },
  { timezone: 'Europe/Budapest', city: 'Budapest', country: 'Hungary', continent: 'Europe', flag: '🇭🇺', latitude: 47.4979, longitude: 19.0402 },
  { timezone: 'Europe/Bucharest', city: 'Bucharest', country: 'Romania', continent: 'Europe', flag: '🇷🇴', latitude: 44.4268, longitude: 26.1025 },

  // Europe - Southern Europe
  { timezone: 'Europe/Madrid', city: 'Madrid', country: 'Spain', continent: 'Europe', flag: '🇪🇸', latitude: 40.4168, longitude: -3.7038 },
  { timezone: 'Europe/Madrid', city: 'Barcelona', country: 'Spain', continent: 'Europe', flag: '🇪🇸', latitude: 41.3851, longitude: 2.1734 },
  { timezone: 'Europe/Rome', city: 'Rome', country: 'Italy', continent: 'Europe', flag: '🇮🇹', latitude: 41.9028, longitude: 12.4964 },
  { timezone: 'Europe/Rome', city: 'Milan', country: 'Italy', continent: 'Europe', flag: '🇮🇹', latitude: 45.4642, longitude: 9.1900 },
  { timezone: 'Europe/Athens', city: 'Athens', country: 'Greece', continent: 'Europe', flag: '🇬🇷', latitude: 37.9838, longitude: 23.7275 },

  // Europe - Nordic & Eastern Europe
  { timezone: 'Europe/Stockholm', city: 'Stockholm', country: 'Sweden', continent: 'Europe', flag: '🇸🇪', latitude: 59.3293, longitude: 18.0686 },
  { timezone: 'Europe/Copenhagen', city: 'Copenhagen', country: 'Denmark', continent: 'Europe', flag: '🇩🇰', latitude: 55.6761, longitude: 12.5683 },
  { timezone: 'Europe/Helsinki', city: 'Helsinki', country: 'Finland', continent: 'Europe', flag: '🇫🇮', latitude: 60.1695, longitude: 24.9354 },
  { timezone: 'Europe/Oslo', city: 'Oslo', country: 'Norway', continent: 'Europe', flag: '🇳🇴', latitude: 59.9139, longitude: 10.7522 },
  { timezone: 'Europe/Moscow', city: 'Moscow', country: 'Russia', continent: 'Europe', flag: '🇷🇺', latitude: 55.7558, longitude: 37.6173 },
  { timezone: 'Europe/Moscow', city: 'Saint Petersburg', country: 'Russia', continent: 'Europe', flag: '🇷🇺', latitude: 59.9311, longitude: 30.3609 },
  { timezone: 'Europe/Kyiv', city: 'Kyiv', country: 'Ukraine', continent: 'Europe', flag: '🇺🇦', latitude: 50.4501, longitude: 30.5234 },

  // Europe - Turkey and Middle East
  { timezone: 'Europe/Istanbul', city: 'Istanbul', country: 'Turkey', continent: 'Europe', flag: '🇹🇷', latitude: 41.0082, longitude: 28.9784 },
  { timezone: 'Europe/Istanbul', city: 'Ankara', country: 'Turkey', continent: 'Europe', flag: '🇹🇷', latitude: 39.9334, longitude: 32.8597 },

  // Middle East & West Asia
  { timezone: 'Asia/Jerusalem', city: 'Jerusalem', country: 'Palestine', continent: 'Asia', flag: '🇵🇸', latitude: 31.7683, longitude: 35.2137 },
  { timezone: 'Asia/Baghdad', city: 'Baghdad', country: 'Iraq', continent: 'Asia', flag: '🇮🇶', latitude: 33.3128, longitude: 44.3615 },
  { timezone: 'Asia/Tehran', city: 'Tehran', country: 'Iran', continent: 'Asia', flag: '🇮🇷', latitude: 35.6892, longitude: 51.3890 },
  { timezone: 'Asia/Riyadh', city: 'Riyadh', country: 'Saudi Arabia', continent: 'Asia', flag: '🇸🇦', latitude: 24.7136, longitude: 46.6753 },
  { timezone: 'Asia/Dubai', city: 'Dubai', country: 'United Arab Emirates', continent: 'Asia', flag: '🇦🇪', latitude: 25.2048, longitude: 55.2708 },
  { timezone: 'Asia/Dubai', city: 'Abu Dhabi', country: 'United Arab Emirates', continent: 'Asia', flag: '🇦🇪', latitude: 24.4539, longitude: 54.3773 },
  { timezone: 'Asia/Amman', city: 'Amman', country: 'Jordan', continent: 'Asia', flag: '🇯🇴', latitude: 31.9454, longitude: 35.9284 },
  { timezone: 'Asia/Beirut', city: 'Beirut', country: 'Lebanon', continent: 'Asia', flag: '🇱🇧', latitude: 33.8886, longitude: 35.4955 },

  // South Asia
  { timezone: 'Asia/Kolkata', city: 'Mumbai', country: 'India', continent: 'Asia', flag: '🇮🇳', latitude: 19.0760, longitude: 72.8777 },
  { timezone: 'Asia/Kolkata', city: 'Delhi', country: 'India', continent: 'Asia', flag: '🇮🇳', latitude: 28.6139, longitude: 77.2090 },
  { timezone: 'Asia/Kolkata', city: 'Bangalore', country: 'India', continent: 'Asia', flag: '🇮🇳', latitude: 12.9716, longitude: 77.5946 },
  { timezone: 'Asia/Kolkata', city: 'Kolkata', country: 'India', continent: 'Asia', flag: '🇮🇳', latitude: 22.5726, longitude: 88.3639 },
  { timezone: 'Asia/Kolkata', city: 'Chennai', country: 'India', continent: 'Asia', flag: '🇮🇳', latitude: 13.0827, longitude: 80.2707 },
  { timezone: 'Asia/Karachi', city: 'Karachi', country: 'Pakistan', continent: 'Asia', flag: '🇵🇰', latitude: 24.8607, longitude: 67.0011 },
  { timezone: 'Asia/Karachi', city: 'Lahore', country: 'Pakistan', continent: 'Asia', flag: '🇵🇰', latitude: 31.5204, longitude: 74.3587 },
  { timezone: 'Asia/Dhaka', city: 'Dhaka', country: 'Bangladesh', continent: 'Asia', flag: '🇧🇩', latitude: 23.8103, longitude: 90.4125 },
  { timezone: 'Asia/Colombo', city: 'Colombo', country: 'Sri Lanka', continent: 'Asia', flag: '🇱🇰', latitude: 6.9271, longitude: 80.7744 },
  { timezone: 'Asia/Kathmandu', city: 'Kathmandu', country: 'Nepal', continent: 'Asia', flag: '🇳🇵', latitude: 27.7172, longitude: 85.3240 },

  // Southeast Asia
  { timezone: 'Asia/Bangkok', city: 'Bangkok', country: 'Thailand', continent: 'Asia', flag: '🇹🇭', latitude: 13.7563, longitude: 100.5018 },
  { timezone: 'Asia/Ho_Chi_Minh', city: 'Ho Chi Minh City', country: 'Vietnam', continent: 'Asia', flag: '🇻🇳', latitude: 10.8231, longitude: 106.6297 },
  { timezone: 'Asia/Ho_Chi_Minh', city: 'Hanoi', country: 'Vietnam', continent: 'Asia', flag: '🇻🇳', latitude: 21.0285, longitude: 105.8542 },
  { timezone: 'Asia/Manila', city: 'Manila', country: 'Philippines', continent: 'Asia', flag: '🇵🇭', latitude: 14.5995, longitude: 120.9842 },
  { timezone: 'Asia/Manila', city: 'Cebu', country: 'Philippines', continent: 'Asia', flag: '🇵🇭', latitude: 10.3157, longitude: 123.8854 },
  { timezone: 'Asia/Jakarta', city: 'Jakarta', country: 'Indonesia', continent: 'Asia', flag: '🇮🇩', latitude: -6.2088, longitude: 106.8456 },
  { timezone: 'Asia/Jakarta', city: 'Surabaya', country: 'Indonesia', continent: 'Asia', flag: '🇮🇩', latitude: -7.2504, longitude: 112.7508 },
  { timezone: 'Asia/Kuala_Lumpur', city: 'Kuala Lumpur', country: 'Malaysia', continent: 'Asia', flag: '🇲🇾', latitude: 3.1390, longitude: 101.6869 },
  { timezone: 'Asia/Singapore', city: 'Singapore', country: 'Singapore', continent: 'Asia', flag: '🇸🇬', latitude: 1.3521, longitude: 103.8198 },

  // East Asia
  { timezone: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan', continent: 'Asia', flag: '🇯🇵', latitude: 35.6762, longitude: 139.6503 },
  { timezone: 'Asia/Tokyo', city: 'Osaka', country: 'Japan', continent: 'Asia', flag: '🇯🇵', latitude: 34.6937, longitude: 135.5023 },
  { timezone: 'Asia/Tokyo', city: 'Kyoto', country: 'Japan', continent: 'Asia', flag: '🇯🇵', latitude: 35.0116, longitude: 135.7681 },
  { timezone: 'Asia/Seoul', city: 'Seoul', country: 'South Korea', continent: 'Asia', flag: '🇰🇷', latitude: 37.5665, longitude: 126.9780 },
  { timezone: 'Asia/Seoul', city: 'Busan', country: 'South Korea', continent: 'Asia', flag: '🇰🇷', latitude: 35.0796, longitude: 129.0331 },
  { timezone: 'Asia/Shanghai', city: 'Shanghai', country: 'China', continent: 'Asia', flag: '🇨🇳', latitude: 31.2304, longitude: 121.4737 },
  { timezone: 'Asia/Shanghai', city: 'Beijing', country: 'China', continent: 'Asia', flag: '🇨🇳', latitude: 39.9042, longitude: 116.4074 },
  { timezone: 'Asia/Shanghai', city: 'Guangzhou', country: 'China', continent: 'Asia', flag: '🇨🇳', latitude: 23.1291, longitude: 113.2644 },
  { timezone: 'Asia/Shanghai', city: 'Shenzhen', country: 'China', continent: 'Asia', flag: '🇨🇳', latitude: 22.5431, longitude: 114.0579 },
  { timezone: 'Asia/Shanghai', city: 'Chongqing', country: 'China', continent: 'Asia', flag: '🇨🇳', latitude: 29.5630, longitude: 106.5516 },
  { timezone: 'Asia/Hong_Kong', city: 'Hong Kong', country: 'Hong Kong', continent: 'Asia', flag: '🇭🇰', latitude: 22.3193, longitude: 114.1694 },
  { timezone: 'Asia/Taipei', city: 'Taipei', country: 'Taiwan', continent: 'Asia', flag: '🇹🇼', latitude: 25.0330, longitude: 121.5654 },

  // Africa - North Africa
  { timezone: 'Africa/Cairo', city: 'Cairo', country: 'Egypt', continent: 'Africa', flag: '🇪🇬', latitude: 30.0444, longitude: 31.2357 },
  { timezone: 'Africa/Casablanca', city: 'Casablanca', country: 'Morocco', continent: 'Africa', flag: '🇲🇦', latitude: 33.5731, longitude: -7.5898 },
  { timezone: 'Africa/Casablanca', city: 'Fez', country: 'Morocco', continent: 'Africa', flag: '🇲🇦', latitude: 34.0334, longitude: -5.0026 },
  { timezone: 'Africa/Algiers', city: 'Algiers', country: 'Algeria', continent: 'Africa', flag: '🇩🇿', latitude: 36.7538, longitude: 3.0588 },
  { timezone: 'Africa/Tunis', city: 'Tunis', country: 'Tunisia', continent: 'Africa', flag: '🇹🇳', latitude: 36.8065, longitude: 10.1686 },

  // Africa - West & Central Africa
  { timezone: 'Africa/Lagos', city: 'Lagos', country: 'Nigeria', continent: 'Africa', flag: '🇳🇬', latitude: 6.5244, longitude: 3.3792 },
  { timezone: 'Africa/Lagos', city: 'Abuja', country: 'Nigeria', continent: 'Africa', flag: '🇳🇬', latitude: 9.0765, longitude: 7.3986 },
  { timezone: 'Africa/Accra', city: 'Accra', country: 'Ghana', continent: 'Africa', flag: '🇬🇭', latitude: 5.6037, longitude: -0.1870 },
  { timezone: 'Africa/Dakar', city: 'Dakar', country: 'Senegal', continent: 'Africa', flag: '🇸🇳', latitude: 14.7167, longitude: -17.4677 },
  { timezone: 'Africa/Douala', city: 'Douala', country: 'Cameroon', continent: 'Africa', flag: '🇨🇲', latitude: 4.0511, longitude: 9.7679 },

  // Africa - East Africa
  { timezone: 'Africa/Nairobi', city: 'Nairobi', country: 'Kenya', continent: 'Africa', flag: '🇰🇪', latitude: -1.2921, longitude: 36.8219 },
  { timezone: 'Africa/Dar_es_Salaam', city: 'Dar es Salaam', country: 'Tanzania', continent: 'Africa', flag: '🇹🇿', latitude: -6.8000, longitude: 39.2833 },
  { timezone: 'Africa/Kampala', city: 'Kampala', country: 'Uganda', continent: 'Africa', flag: '🇺🇬', latitude: 0.3476, longitude: 32.5825 },
  { timezone: 'Africa/Addis_Ababa', city: 'Addis Ababa', country: 'Ethiopia', continent: 'Africa', flag: '🇪🇹', latitude: 9.0320, longitude: 38.7469 },

  // Africa - Southern Africa
  { timezone: 'Africa/Johannesburg', city: 'Johannesburg', country: 'South Africa', continent: 'Africa', flag: '🇿🇦', latitude: -26.2044, longitude: 28.0456 },
  { timezone: 'Africa/Johannesburg', city: 'Cape Town', country: 'South Africa', continent: 'Africa', flag: '🇿🇦', latitude: -33.9249, longitude: 18.4241 },
  { timezone: 'Africa/Harare', city: 'Harare', country: 'Zimbabwe', continent: 'Africa', flag: '🇿🇼', latitude: -17.8252, longitude: 31.0335 },
  { timezone: 'Africa/Lusaka', city: 'Lusaka', country: 'Zambia', continent: 'Africa', flag: '🇿🇲', latitude: -10.3369, longitude: 28.3713 },
  { timezone: 'Africa/Maputo', city: 'Maputo', country: 'Mozambique', continent: 'Africa', flag: '🇲🇿', latitude: -23.8636, longitude: 35.3298 },

  // Oceania - Australia
  { timezone: 'Australia/Sydney', city: 'Sydney', country: 'Australia', continent: 'Oceania', flag: '🇦🇺', latitude: -33.8688, longitude: 151.2093 },
  { timezone: 'Australia/Melbourne', city: 'Melbourne', country: 'Australia', continent: 'Oceania', flag: '🇦🇺', latitude: -37.8136, longitude: 144.9631 },
  { timezone: 'Australia/Brisbane', city: 'Brisbane', country: 'Australia', continent: 'Oceania', flag: '🇦🇺', latitude: -27.4698, longitude: 153.0251 },
  { timezone: 'Australia/Perth', city: 'Perth', country: 'Australia', continent: 'Oceania', flag: '🇦🇺', latitude: -31.9505, longitude: 115.8605 },
  { timezone: 'Australia/Adelaide', city: 'Adelaide', country: 'Australia', continent: 'Oceania', flag: '🇦🇺', latitude: -34.9285, longitude: 138.6007 },

  // Oceania - Pacific
  { timezone: 'Pacific/Auckland', city: 'Auckland', country: 'New Zealand', continent: 'Oceania', flag: '🇳🇿', latitude: -37.0882, longitude: 174.7765 },
  { timezone: 'Pacific/Auckland', city: 'Wellington', country: 'New Zealand', continent: 'Oceania', flag: '🇳🇿', latitude: -41.2865, longitude: 174.7762 },
  { timezone: 'Pacific/Fiji', city: 'Suva', country: 'Fiji', continent: 'Oceania', flag: '🇫🇯', latitude: -18.1248, longitude: 178.4501 },
  { timezone: 'Pacific/Port_Moresby', city: 'Port Moresby', country: 'Papua New Guinea', continent: 'Oceania', flag: '🇵🇬', latitude: -9.4438, longitude: 147.1803 },
];

// Timezone mapping by country
const countryTimezoneMap: Record<string, string> = {
  'United States': 'America/New_York',
  'Canada': 'America/Toronto',
  'Mexico': 'America/Mexico_City',
  'Brazil': 'America/Sao_Paulo',
  'Argentina': 'America/Buenos_Aires',
  'Chile': 'America/Santiago',
  'Colombia': 'America/Bogota',
  'Peru': 'America/Lima',
  'Venezuela': 'America/Caracas',
  'Bolivia': 'America/La_Paz',
  'United Kingdom': 'Europe/London',
  'France': 'Europe/Paris',
  'Germany': 'Europe/Berlin',
  'Italy': 'Europe/Rome',
  'Spain': 'Europe/Madrid',
  'Portugal': 'Europe/Lisbon',
  'Netherlands': 'Europe/Amsterdam',
  'Belgium': 'Europe/Brussels',
  'Switzerland': 'Europe/Zurich',
  'Austria': 'Europe/Vienna',
  'Sweden': 'Europe/Stockholm',
  'Norway': 'Europe/Oslo',
  'Denmark': 'Europe/Copenhagen',
  'Finland': 'Europe/Helsinki',
  'Poland': 'Europe/Warsaw',
  'Czech Republic': 'Europe/Prague',
  'Hungary': 'Europe/Budapest',
  'Romania': 'Europe/Bucharest',
  'Greece': 'Europe/Athens',
  'Russia': 'Europe/Moscow',
  'Ukraine': 'Europe/Kyiv',
  'Turkey': 'Europe/Istanbul',
  'Brunei': 'Asia/Brunei',
  'Qatar': 'Asia/Qatar',
  'Oman': 'Asia/Muscat',
  'Kuwait': 'Asia/Kuwait',
  'Iraq': 'Asia/Baghdad',
  'Iran': 'Asia/Tehran',
  'Pakistan': 'Asia/Karachi',
  'India': 'Asia/Kolkata',
  'Bangladesh': 'Asia/Dhaka',
  'Sri Lanka': 'Asia/Colombo',
  'Nepal': 'Asia/Kathmandu',
  'Thailand': 'Asia/Bangkok',
  'Vietnam': 'Asia/Ho_Chi_Minh',
  'Philippines': 'Asia/Manila',
  'Indonesia': 'Asia/Jakarta',
  'Malaysia': 'Asia/Kuala_Lumpur',
  'Singapore': 'Asia/Singapore',
  'China': 'Asia/Shanghai',
  'Taiwan': 'Asia/Taipei',
  'Hong Kong': 'Asia/Hong_Kong',
  'Japan': 'Asia/Tokyo',
  'South Korea': 'Asia/Seoul',
  'Australia': 'Australia/Sydney',
  'New Zealand': 'Pacific/Auckland',
  'Nigeria': 'Africa/Lagos',
  'Kenya': 'Africa/Nairobi',
  'South Africa': 'Africa/Johannesburg',
  'Morocco': 'Africa/Casablanca',
  'Algeria': 'Africa/Algiers',
  'Tunisia': 'Africa/Tunis',
  'Ethiopia': 'Africa/Addis_Ababa',
  'Ghana': 'Africa/Accra',
  'Tanzania': 'Africa/Dar_es_Salaam',
  'Uganda': 'Africa/Kampala',
  'Zimbabwe': 'Africa/Harare',
  'Zambia': 'Africa/Lusaka',
  'Mozambique': 'Africa/Maputo',
  'Cameroon': 'Africa/Douala',
  'Senegal': 'Africa/Dakar',
  'Guatemala': 'America/Guatemala',
  'Costa Rica': 'America/Costa_Rica',
  'Panama': 'America/Panama',
  'Fiji': 'Pacific/Fiji',
  'Papua New Guinea': 'Pacific/Port_Moresby',
};

// Normalizes country names to match our timezone mapping
const COUNTRY_ALIASES: Record<string, string> = {
  'Brunei Darussalam': 'Brunei',
  'Russian Federation': 'Russia',
  'Korea, South': 'South Korea',
  'Republic of Korea': 'South Korea',
  'Korea, North': 'North Korea',
  'United States of America': 'United States',
  'USA': 'United States',
  'UK': 'United Kingdom',
  'UAE': 'United Arab Emirates',
  'United Kingdom of Great Britain and Northern Ireland': 'United Kingdom',
  'Viet Nam': 'Vietnam',
};

const normalizeCountryName = (name: string): string => {
  return COUNTRY_ALIASES[name] || name;
};

// Normalize city keys for stable lookup (case/diacritics insensitive)
const normalizeCityKey = (city: string): string =>
  city
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
const isValidTimezone = (tz?: string | null): tz is string => {
  if (!tz) return false;

  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const mapTimezoneToContinent = (tz: string): string => {
  const prefix = tz.split('/')[0];

  switch (prefix) {
    case 'America':
    case 'Atlantic':
      return 'Americas';
    case 'Europe':
      return 'Europe';
    case 'Africa':
      return 'Africa';
    case 'Asia':
      return 'Asia';
    case 'Australia':
    case 'Pacific':
      return 'Oceania';
    case 'Indian':
      return 'Asia';
    case 'Antarctica':
      return 'Antarctica';
    default:
      return 'Other';
  }
};

const loadCityTimezoneLookup = async (): Promise<Map<string, string>> => {
  const lookup = new Map<string, string>();

  try {
    const response = await fetch(CITY_TIMEZONE_SOURCE);
    if (!response.ok) return lookup;

    const tzData = await response.json() as Record<string, string>;
    Object.entries(tzData).forEach(([city, tz]) => {
      const key = normalizeCityKey(city);
      if (key && tz) {
        lookup.set(key, tz);
      }
    });
  } catch (error) {
    console.warn('Failed to load city-timezones lookup, falling back to country mapping only:', error);
  }

  return lookup;
};

const loadLocalCities = async (): Promise<RawCity[]> => {
  const response = await fetch(CITIES_DATA_URL);
  if (!response.ok) {
    throw new Error(`Local cities dataset returned status ${response.status}`);
  }

  const json = await response.json();
  if (!Array.isArray(json)) {
    throw new Error('Local cities dataset is not an array');
  }

  return json as RawCity[];
};

const resolveTimezone = (
  city: RawCity,
  cityTimezoneLookup: Map<string, string>,
  countryName: string
): string => {
  const providedTimezone = city.timezone?.trim();

  if (isValidTimezone(providedTimezone)) {
    return providedTimezone;
  }

  const normalizedCityKey = normalizeCityKey(city.capital);

  const mappedTimezone = cityTimezoneLookup.get(normalizedCityKey);

  if (isValidTimezone(mappedTimezone)) {
    return mappedTimezone;
  }

  const countryTimezone = countryTimezoneMap[countryName];
  if (isValidTimezone(countryTimezone)) {
    return countryTimezone;
  }

  return 'UTC';
};

const buildCityKey = (cityName: string, country: string): string => {
  return `${normalizeCityKey(cityName)}|${country}`;
};

type CityAccumulator = {
  data: CityData;
  hasTimezone: boolean;
};

export async function fetchMajorCities(): Promise<CityData[]> {
  try {
    const [cityTimezoneLookup, rawCities] = await Promise.all([
      loadCityTimezoneLookup(),
      loadLocalCities(),
    ]);

    const cityMap = new Map<string, CityAccumulator>();

    rawCities.forEach((rawCity) => {
      const cityName = String(rawCity.capital || '').trim();
      if (!cityName) return;

      let countryName = normalizeCountryName(String(rawCity.country || '').trim());

      // Handle special case for Palestine and remove other Israeli entries
      if (countryName === 'Israel') {
        if (cityName.toLowerCase().includes('jerusalem')) {
          countryName = 'Palestine';
        } else {
          return;
        }
      }

      if (!Number.isFinite(rawCity.lat) || !Number.isFinite(rawCity.long)) {
        return;
      }

      const timezone = resolveTimezone(rawCity, cityTimezoneLookup, countryName);
      const key = buildCityKey(cityName, countryName);

      const candidate: CityAccumulator = {
        data: {
          timezone,
          city: cityName,
          country: countryName,
          continent: mapTimezoneToContinent(timezone),
          flag: '🌍',
          latitude: rawCity.lat,
          longitude: rawCity.long,
        },
        hasTimezone: timezone !== 'UTC',
      };

      const existing = cityMap.get(key);
      if (!existing || (!existing.hasTimezone && candidate.hasTimezone)) {
        cityMap.set(key, candidate);
      }
    });

    // Add curated WORLD_CITIES for coverage when missing from dataset
    WORLD_CITIES.forEach((city) => {
      const key = buildCityKey(city.city, city.country);
      if (!cityMap.has(key)) {
        cityMap.set(key, { data: city, hasTimezone: city.timezone !== 'UTC' });
      }
    });

    const allCities = Array.from(cityMap.values())
      .map((entry) => entry.data)
      .sort((a, b) => a.city.localeCompare(b.city));

    console.log(`Loaded ${allCities.length} cities from local dataset + city-timezones`);
    return allCities;
  } catch (error) {
    console.warn('Failed to load local dataset, falling back to WORLD_CITIES:', error);
    const cities = [...WORLD_CITIES].sort((a, b) => a.city.localeCompare(b.city));
    return cities;
  }
}

// Fallback list of major cities (for backward compatibility)
export const MAJOR_CITIES = WORLD_CITIES.slice(0, 34);

import React, { useMemo, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { fetchMajorCities } from '@/lib/fetch-cities';

// Keep dayjs timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

interface CityData {
  timezone: string;
  city: string;
  country: string;
  continent: string;
  flag: string;
  latitude: number;
  longitude: number;
}

// Track which map instances were auto-fitted so we don't re-run on re-mount
const initializedMaps = new WeakSet<L.Map>();

// Minimal Terminator layer typing for the external plugin
type TerminatorLayerType = L.Layer & {
  setTime?: (date?: Date) => void;
  setDate?: (date?: Date) => void;
  setStyle?: (opts: Record<string, unknown>) => void;
  bringToBack?: () => void;
};

export const MAJOR_CITIES: CityData[] = [
  { timezone: 'America/New_York', city: 'New York', country: 'United States', continent: 'Americas', flag: '🇺🇸', latitude: 40.7128, longitude: -74.0060 },
  { timezone: 'Europe/London', city: 'London', country: 'United Kingdom', continent: 'Europe', flag: '🇬🇧', latitude: 51.5074, longitude: -0.1278 },
  { timezone: 'Europe/Paris', city: 'Paris', country: 'France', continent: 'Europe', flag: '🇫🇷', latitude: 48.8566, longitude: 2.3522 },
  { timezone: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan', continent: 'Asia', flag: '🇯🇵', latitude: 35.6762, longitude: 139.6503 },
  { timezone: 'Australia/Sydney', city: 'Sydney', country: 'Australia', continent: 'Oceania', flag: '🇦🇺', latitude: -33.8688, longitude: 151.2093 },
];

/**
 * TerminatorLayer — adds the day/night terminator using the newer @joergdietrich/leaflet.terminator
 * This implementation uses a single-world longitudeRange (360) and a semi-transparent night fill.
 */
function TerminatorLayer() {
  const map = useMap();

  useEffect(() => {
    let termLayer: TerminatorLayerType | null = null;
    let intervalId: number | undefined;

    const init = async () => {
      try {
        // Dynamically import the newer plugin (already installed)
        const mod = await import('@joergdietrich/leaflet.terminator');
        const createTerminator = (mod.default || mod) as (opts?: Record<string, unknown>) => TerminatorLayerType;

        const nightFill = 'rgba(2,6,23,0.45)';

        // Create terminator for the current time; longitudeRange: 360 keeps it single-world
        const t = createTerminator({ resolution: 2, longitudeRange: 360, time: new Date() });

        // Apply styles and ensure it doesn't intercept pointer events
        t.setStyle?.({
          color: 'rgba(59,130,246,0.4)',
          weight: 2,
          opacity: 0.6,
          fillColor: nightFill,
          fillOpacity: 0.45,
          interactive: false,
        });

        t.addTo(map);
        t.bringToBack?.();

        termLayer = t;

        // Keep the terminator in sync every minute
        intervalId = window.setInterval(() => {
          if (typeof t.setTime === 'function') t.setTime(new Date());
        }, 60_000);
      } catch (err) {
        // If import fails, log for debugging
        console.warn('Failed to initialize terminator', err);
      }
    };

    init();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (termLayer) {
        try { map.removeLayer(termLayer); } catch {}
      }
    };
  }, [map]);

  return null;
}

/**
 * Ensures the user can't zoom out beyond the world-fit height but allows a small margin.
 * Also auto-zooms once on first load to a comfortable default.
 */
function MinZoomToMapHeight() {
  const map = useMap();

  useEffect(() => {
    const worldBounds = L.latLngBounds([[-90, -180], [90, 180]]);

    const recompute = () => {
      // compute zoom to fit longitude (world width) based on container width
      const size = map.getSize();
      const width = Math.max(1, size.x);
      const worldTileSize = 256; // pixels at zoom 0
      const zoomForWidth = Math.log2(width / worldTileSize);

      // also compute height-constrained zoom (fit-inside)
      const zoomInside = map.getBoundsZoom(worldBounds, true);

      // choose the width-based zoom as the limiting minZoom (user requested longitude-based limit)
      const margin = 0.5; // small breathing room
      const minZoom = Math.max(0, zoomForWidth - margin);

      map.setMinZoom(minZoom);

      if (!initializedMaps.has(map)) {
        // initial zoom: pick the tighter fit (so the whole world is visible but not tiny)
        const initialZoom = Math.max(minZoom, Math.min(zoomInside, zoomForWidth));
        map.setView([20, 0], initialZoom);
        initializedMaps.add(map);
      }
    };

    map.whenReady(recompute);
    map.on('resize', recompute);
    window.addEventListener('resize', recompute);

    return () => {
      map.off('resize', recompute);
      window.removeEventListener('resize', recompute);
    };
  }, [map]);

  return null;
}

interface WorldMapClockProps {
  currentTime: dayjs.Dayjs;
  use24HourFormat: boolean;
  showSeconds: boolean;
  selectedCities?: string[];
}

export const WorldMapClock: React.FC<WorldMapClockProps> = ({
  currentTime,
  use24HourFormat,
  showSeconds,
  selectedCities,
}) => {
  const [cities, setCities] = useState<CityData[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const fetched = await fetchMajorCities();
        if (fetched && fetched.length) setCities(fetched);
        else setCities(MAJOR_CITIES);
      } catch (err) {
        console.error('Failed to fetch cities:', err);
        setCities(MAJOR_CITIES);
      }
    };
    load();
  }, []);

  const citiesToDisplay = useMemo(() => {
    if (selectedCities && selectedCities.length) return cities.filter(c => selectedCities.includes(c.timezone));
    return cities;
  }, [cities, selectedCities]);

  const createCustomIcon = (isDay: boolean) => L.divIcon({
    html: `<div style="display:flex;align-items:center;justify-content:center;width:12px;height:12px;background:${isDay ? '#fbbf24' : '#60a5fa'};border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    className: 'world-clock-marker',
  });

  return (
    <div className="absolute inset-0 w-full h-full rounded-lg overflow-hidden border-1 border-border flex items-center justify-center">
      <div className="w-full aspect-[4/3]">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          className="leaflet-container"
          maxBounds={[[-90, -180], [90, 180]]}
          maxBoundsViscosity={1.0}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            noWrap={true}
          />

          <TerminatorLayer />
          <MinZoomToMapHeight />

          {citiesToDisplay.map(city => {
            const tzTime = currentTime.tz(city.timezone);
            const hour = tzTime.hour();
            const isDay = hour >= 6 && hour < 18;

            return (
              <Marker key={`${city.timezone}-${city.city}`} position={[city.latitude, city.longitude]} icon={createCustomIcon(isDay)}>
                <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                  <div className="world-clock-tooltip-content">
                    <div className="font-bold text-sm mb-1">{city.city}, {city.country}</div>
                    <div className="font-mono text-sm font-semibold mb-1">
                      {use24HourFormat ? tzTime.format(showSeconds ? 'HH:mm:ss' : 'HH:mm') : tzTime.format(showSeconds ? 'h:mm:ss A' : 'h:mm A')}
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{tzTime.format('DD MMM YYYY')}</div>
                    <div className="text-xs text-muted-foreground font-mono">UTC{tzTime.format('Z')}</div>
                    <div className="text-xs mt-2 pt-1 border-t">{isDay ? '☀️ Daytime' : '🌙 Nighttime'}</div>
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <style>{`
        .leaflet-container { font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: hsl(var(--background)); }
        .world-clock-marker { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
        .world-clock-tooltip-content { background: hsl(var(--card)); color: hsl(var(--foreground)); padding: 8px 12px; border-radius: 6px; border: 1px solid hsl(var(--border)); white-space: nowrap; }
        .leaflet-tooltip { background: transparent; border: none; box-shadow: none; padding: 0 !important; }
        .leaflet-control-attribution { background: hsl(var(--card)) !important; color: hsl(var(--foreground)) !important; }
        .leaflet-terminator { stroke: rgba(59,130,246,0.4); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
      `}</style>
    </div>
  );
};
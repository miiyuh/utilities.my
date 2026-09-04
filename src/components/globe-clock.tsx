import React from 'react';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  geoOrthographic,
  geoMercator,
  geoPath,
  geoCircle,
  geoGraticule10,
  geoDistance,
  type GeoProjection,
} from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry } from 'geojson';
import landTopo from 'world-atlas/land-110m.json';
import { CITY_ZONES } from '@/lib/timezones';
import { subsolarPoint, antipode, nightRing } from '@/lib/solar';
import { cn } from '@/lib/utils';

/** d3-geo Euler rotation [λ, φ, γ] in degrees. */
type EulerRotation = [number, number, number];

dayjs.extend(utc);
dayjs.extend(timezone);

export type GlobeView = 'globe' | 'map';
export type GlobeMode = 'cities' | 'timezones';

interface TzProps {
  zone: number;
  time_zone: string;
  tz_name1st: string | null;
}

interface GlobeClockProps {
  zones: string[];
  view: GlobeView;
  mode: GlobeMode;
  now: Dayjs;
  use24h: boolean;
  onToggleCity: (tz: string) => void;
}

interface TooltipState {
  x: number;
  y: number;
  lines: string[];
}

const landFeatures = feature(
  landTopo as unknown as Topology,
  (landTopo as unknown as { objects: { land: GeometryCollection } }).objects.land
) as FeatureCollection<Geometry>;

const graticule = geoGraticule10();

/** Muted categorical tint for a UTC offset (-12 … +14). */
function offsetColor(zone: number): string {
  const hue = ((zone + 12) / 26) * 330;
  return `oklch(0.62 0.11 ${hue.toFixed(1)})`;
}

export function GlobeClock({ zones, view, mode, now, use24h, onToggleCity }: GlobeClockProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const [width, setWidth] = React.useState(720);

  const home = zones[0] ? CITY_ZONES.find((c) => c.timezone === zones[0]) : undefined;
  const instructionsId = React.useId();
  const [rotation, setRotation] = React.useState<EulerRotation>(() =>
    home ? [-home.lon, -home.lat / 2, 0] : [0, -15, 0]
  );

  const [tzFeatures, setTzFeatures] = React.useState<FeatureCollection<Geometry, TzProps> | null>(null);
  const [tzLoading, setTzLoading] = React.useState(false);
  const [tzError, setTzError] = React.useState(false);
  const [hoverZone, setHoverZone] = React.useState<number | null>(null);
  const [tooltip, setTooltip] = React.useState<TooltipState | null>(null);
  // On touch devices there's no hover, so tapping a region/city "pins" the
  // tooltip open (and keeps rotation paused) instead of it flashing away the
  // instant the finger lifts and pointerleave fires.
  const [pinned, setPinned] = React.useState(false);

  const dragStartRef = React.useRef<{ x: number; y: number; rotation: EulerRotation } | null>(null);
  const hoverPauseRef = React.useRef(false);
  const [dragging, setDragging] = React.useState(false);

  // --- responsive sizing -----------------------------------------------------
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = view === 'globe' ? Math.min(width, 560) : Math.min(Math.round(width * 0.55), 520);

  // --- projection ------------------------------------------------------------
  const projection = React.useMemo<GeoProjection>(() => {
    if (view === 'globe') {
      return geoOrthographic()
        .scale(Math.min(width, height) / 2 - 8)
        .translate([width / 2, height / 2])
        .rotate(rotation)
        // Slightly under 90° - right at the horizon, floating-point error can
        // put a coastline vertex on the wrong side of the clip circle from one
        // frame to the next, so silhouette edges flicker in and out.
        .clipAngle(89.999);
    }
    return geoMercator()
      .scale(width / (2 * Math.PI))
      .translate([width / 2, height / 2])
      // Bounds the projection's otherwise-unbounded vertical extent - without
      // this, polygons that reach toward the poles (Antarctica, high-latitude
      // timezone wedges) project to enormous or infinite y and can smear
      // across the whole map instead of clipping neatly at the frame edge.
      .clipExtent([[0, 0], [width, height]]);
  }, [view, width, height, rotation]);

  const path = React.useMemo(() => geoPath(projection), [projection]);

  // --- night hemisphere (recomputed once a minute) ---------------------------
  const minuteStamp = Math.floor(now.valueOf() / 60_000);
  const nightPath = React.useMemo(() => {
    const sun = subsolarPoint(new Date(minuteStamp * 60_000));
    if (view === 'globe') {
      // On the globe the night side is exactly a hemisphere - a 90°-radius
      // spherical circle around the antipode of the sun - which geoPath
      // projects perfectly under orthographic.
      const night = geoCircle().center(antipode(sun)).radius(90)();
      return path(night);
    }
    // Mercator (and any other cylindrical projection) can't render that same
    // spherical circle: once it wraps near a pole the projected path folds
    // over itself into the diagonal streaks/blobs this used to show. Instead
    // walk the actual terminator curve, which is a well-behaved simple ring.
    return path({ type: 'Polygon', coordinates: [nightRing(sun)] });
  }, [minuteStamp, path, view]);

  // --- lazy timezone polygons -----------------------------------------------
  React.useEffect(() => {
    if (mode !== 'timezones' || tzFeatures || tzLoading) return;
    setTzLoading(true);
    fetch('/data/timezones.topo.json')
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((topo: Topology) => {
        const key = Object.keys(topo.objects)[0];
        const loaded = feature(topo, topo.objects[key] as GeometryCollection<TzProps>) as FeatureCollection<Geometry, TzProps>;
        setTzFeatures(loaded);
      })
      .catch(() => setTzError(true))
      .finally(() => setTzLoading(false));
  }, [mode, tzFeatures, tzLoading]);

  // --- idle auto-rotation (globe only, respects reduced motion) --------------
  React.useEffect(() => {
    if (view !== 'globe' || dragging) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => {
      if (hoverPauseRef.current) return;
      setRotation(([l, p, g]) => [l + 0.15, p, g]);
    }, 66);
    return () => clearInterval(id);
  }, [view, dragging]);

  // --- drag to rotate - locked to the polar axis (yaw + pitch only, no roll) -
  // A full trackball (quaternion) rotation lets the globe tumble so the poles
  // drift sideways or upside-down. Dragging left/right instead only changes
  // longitude and up/down only changes latitude (clamped to ±90°), so the
  // north/south poles always stay pinned at top/bottom, like Google Earth.
  const onPointerDown = (e: React.PointerEvent) => {
    if (view !== 'globe') return;
    dragStartRef.current = { x: e.clientX, y: e.clientY, rotation };
    setDragging(true);
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragStartRef.current;
    if (!drag) return;
    const globeRadius = Math.min(width, height) / 2 - 8;
    const degreesPerPixel = 70 / globeRadius;
    const lambda = drag.rotation[0] + (e.clientX - drag.x) * degreesPerPixel;
    const phi = Math.max(-90, Math.min(90, drag.rotation[1] - (e.clientY - drag.y) * degreesPerPixel));
    setRotation([lambda, phi, 0]);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    dragStartRef.current = null;
    setDragging(false);
    svgRef.current?.releasePointerCapture(e.pointerId);
  };

  // --- helpers ----------------------------------------------------------------
  const timeFmt = use24h ? 'HH:mm' : 'h:mm A';
  const selected = React.useMemo(() => new Set(zones), [zones]);

  const cityVisible = (lon: number, lat: number): boolean => {
    if (view === 'map') return true;
    return geoDistance([lon, lat], [-rotation[0], -rotation[1]]) < Math.PI / 2 - 0.05;
  };

  const showTooltip = (e: { clientX: number; clientY: number }, lines: string[]) => {
    const rect = containerRef.current!.getBoundingClientRect();
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, lines });
  };

  /** Tap-to-pin handler shared by city markers and timezone regions: shows
   *  the tooltip like hover would, but keeps it (and the paused rotation)
   *  open until the user taps the background or another target. */
  const pinTooltip = (e: React.MouseEvent, zone: number | null, lines: string[]) => {
    e.stopPropagation();
    hoverPauseRef.current = true;
    setPinned(true);
    setHoverZone(zone);
    showTooltip(e, lines);
  };

  const clearPinned = () => {
    if (!pinned) return;
    setPinned(false);
    setHoverZone(null);
    setTooltip(null);
    hoverPauseRef.current = false;
  };

  // --- keyboard rotation -----------------------------------------------------
  // Dragging is the only way to turn the globe with a pointer, so arrow keys
  // mirror it: left/right change longitude, up/down change latitude with the
  // same ±90° clamp, and Shift takes bigger steps. Escape releases a pinned
  // city, which is what clicking the ocean does.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearPinned();
      return;
    }
    if (view !== 'globe') return;
    const step = e.shiftKey ? 15 : 5;
    switch (e.key) {
      case 'ArrowLeft':
        setRotation(([l, p, g]) => [l - step, p, g]);
        break;
      case 'ArrowRight':
        setRotation(([l, p, g]) => [l + step, p, g]);
        break;
      case 'ArrowUp':
        setRotation(([l, p, g]) => [l, Math.min(90, p + step), g]);
        break;
      case 'ArrowDown':
        setRotation(([l, p, g]) => [l, Math.max(-90, p - step), g]);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const zoneTime = (p: TzProps): string => {
    if (p.tz_name1st) {
      try {
        return now.tz(p.tz_name1st).format(timeFmt);
      } catch {
        /* fall through to raw offset */
      }
    }
    return now.utcOffset(p.zone * 60).format(timeFmt);
  };

  const formatUtcOffset = (zone: number): string => {
    const sign = zone >= 0 ? '+' : '-';
    const abs = Math.abs(zone);
    const hours = Math.floor(abs);
    const minutes = Math.round((abs - hours) * 60);
    return `UTC${sign}${hours}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      onPointerEnter={() => { hoverPauseRef.current = true; }}
      onPointerLeave={() => { if (!pinned) { hoverPauseRef.current = false; setTooltip(null); } }}
    >
      {/*
        Not role="img": this is a focusable widget with its own key handling, and
        an img is a non-interactive leaf. There is no ARIA role for a draggable
        map, so "application" is the documented escape hatch, and
        aria-describedby carries the key bindings. oxlint does not count
        "application" among its interactive roles, hence the two annotations
        below. The side panel lists every city and time, so nothing here is the
        only route to the data.
      */}
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="application"
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-label="Interactive world clock map"
        aria-describedby={`${instructionsId}-globe`}
        className={cn(
          'block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          view === 'globe' && (dragging ? 'cursor-grabbing' : 'cursor-grab'),
        )}
        onClick={clearPinned}
        onKeyDown={onKeyDown}
        onFocus={() => { hoverPauseRef.current = true; }}
        onBlur={() => { if (!pinned) { hoverPauseRef.current = false; } }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ touchAction: view === 'globe' ? 'none' : 'auto' }}
      >
        {/* Ocean / sphere */}
        <path d={path({ type: 'Sphere' }) ?? undefined} fill="var(--muted)" fillOpacity={0.35} stroke="var(--border)" />
        {/* Graticule */}
        <path d={path(graticule) ?? undefined} fill="none" stroke="var(--border)" strokeOpacity={0.35} strokeWidth={0.5} />
        {/* Land */}
        {landFeatures.features.map((f, i) => {
          const d = path(f);
          return d ? (
            <path key={i} d={d} fill="var(--muted-foreground)" fillOpacity={0.35} stroke="var(--border)" strokeWidth={0.5} />
          ) : null;
        })}

        {/* Timezone polygons */}
        {mode === 'timezones' && tzFeatures &&
          tzFeatures.features.map((f, i) => {
            const d = path(f);
            if (!d) return null;
            const p = f.properties;
            return (
              <path
                key={i}
                d={d}
                fill={offsetColor(p.zone)}
                fillOpacity={hoverZone === p.zone ? 0.55 : 0.28}
                stroke="var(--border)"
                strokeWidth={0.6}
                onPointerEnter={() => setHoverZone(p.zone)}
                onPointerMove={(e) => showTooltip(e, [formatUtcOffset(p.zone), zoneTime(p)])}
                onPointerLeave={() => { if (!pinned) { setHoverZone(null); setTooltip(null); } }}
                onClick={(e) => pinTooltip(e, p.zone, [formatUtcOffset(p.zone), zoneTime(p)])}
              />
            );
          })}

        {/* Night hemisphere */}
        {nightPath && <path d={nightPath} fill="#000" fillOpacity={0.32} pointerEvents="none" />}

        {/* City markers */}
        {(mode === 'cities' ? CITY_ZONES : CITY_ZONES.filter((c) => selected.has(c.timezone))).map((c) => {
          if (!cityVisible(c.lon, c.lat)) return null;
          const pos = projection([c.lon, c.lat]);
          if (!pos) return null;
          const [x, y] = pos;
          const isSel = selected.has(c.timezone);
          const local = now.tz(c.timezone);
          return (
            <g
              key={c.timezone}
              transform={`translate(${x},${y})`}
              className="cursor-pointer"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                onToggleCity(c.timezone);
                pinTooltip(e, null, [`${c.flag} ${c.city}, ${c.country}`, `${local.format(timeFmt)} · GMT${local.format('Z').replace(':00', '')}`]);
              }}
              onPointerMove={(e) =>
                showTooltip(e, [`${c.flag} ${c.city}, ${c.country}`, `${local.format(timeFmt)} · GMT${local.format('Z').replace(':00', '')}`])
              }
              onPointerLeave={() => { if (!pinned) setTooltip(null); }}
            >
              {/* Invisible larger hit target - a 3–5px dot is too small to
                  reliably tap on touch screens or hover precisely with a mouse. */}
              <circle r={12} fill="transparent" pointerEvents="all" />
              <circle
                r={isSel ? 5 : 3}
                fill={isSel ? 'var(--primary)' : 'var(--foreground)'}
                fillOpacity={isSel ? 1 : 0.55}
                stroke="var(--background)"
                strokeWidth={1}
                pointerEvents="none"
              />
              {isSel && (
                <text
                  x={8}
                  y={4}
                  fontSize={11}
                  fill="var(--foreground)"
                  stroke="var(--background)"
                  strokeWidth={3}
                  paintOrder="stroke"
                  className="font-medium"
                >
                  {c.city} {local.format(timeFmt)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <p id={`${instructionsId}-globe`} className="sr-only">
        Arrow keys turn the globe, hold Shift for larger steps. Escape releases a
        pinned city. Every city and its current time is also listed beside the map.
      </p>

      {/* Loading / error states for the timezone layer */}
      {mode === 'timezones' && tzLoading && (
        <div className="absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
          Loading timezone boundaries…
        </div>
      )}
      {mode === 'timezones' && tzError && (
        <div className="absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-destructive/10 px-3 py-1 text-xs text-destructive">
          Couldn’t load timezone boundaries.
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          {tooltip.lines.map((l, i) => (
            <div key={i} className={i === 0 ? 'font-medium' : 'text-muted-foreground tabular-nums'}>
              {l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

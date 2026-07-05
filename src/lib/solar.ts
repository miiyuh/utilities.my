// Low-precision solar position (±0.3°) - enough to draw a day/night terminator.
// Based on the standard "Position of the Sun" approximation (NOAA / Astronomical Almanac).

const rad = Math.PI / 180;

/** [longitude, latitude] in degrees of the point where the sun is directly overhead. */
export function subsolarPoint(date: Date): [number, number] {
  // Days since J2000.0 (2000-01-01T12:00Z)
  const n = date.getTime() / 86400000 + 2440587.5 - 2451545.0;

  const meanLongitude = (280.46 + 0.9856474 * n) % 360;
  const meanAnomaly = ((357.528 + 0.9856003 * n) % 360) * rad;
  const eclipticLongitude =
    (meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * rad;
  const obliquity = (23.439 - 0.0000004 * n) * rad;

  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude)) / rad;
  const rightAscension =
    Math.atan2(Math.cos(obliquity) * Math.sin(eclipticLongitude), Math.cos(eclipticLongitude)) / rad;

  // Greenwich mean sidereal time in degrees → subsolar longitude
  const gmst = (280.46061837 + 360.98564736629 * n) % 360;
  const lon = ((rightAscension - gmst) % 360 + 540) % 360 - 180;

  return [lon, declination];
}

/** Antipode of a [lon, lat] point - center of the night hemisphere for the subsolar point. */
export function antipode([lon, lat]: [number, number]): [number, number] {
  return [lon > 0 ? lon - 180 : lon + 180, -lat];
}

/**
 * Night-side region as a closed [lon, lat] ring, for cylindrical projections
 * (e.g. Mercator) where a spherical "circle 90° from the sun" - perfectly
 * valid on a globe - cannot be projected directly: it isn't a simple curve
 * in (lon, lat) space, so feeding it through geoPath produces a wildly
 * distorted shape. This instead walks the actual terminator curve (where the
 * sun is exactly on the horizon) longitude-by-longitude and closes the ring
 * at whichever pole is in permanent night, which projects cleanly.
 */
export function nightRing([lon0, lat0]: [number, number]): [number, number][] {
  const lat0r = lat0 * rad;
  const ring: [number, number][] = [];
  for (let lon = -180; lon <= 180; lon += 2) {
    const dLon = (lon - lon0) * rad;
    // Terminator: sin(lat0)sin(lat) + cos(lat0)cos(lat)cos(dLon) = 0
    const lat = Math.atan2(-Math.cos(lat0r) * Math.cos(dLon), Math.sin(lat0r) || 1e-6) / rad;
    ring.push([lon, lat]);
  }
  const nightPoleLat = lat0 >= 0 ? -90 : 90;
  ring.push([180, nightPoleLat], [-180, nightPoleLat], ring[0]);
  return ring;
}

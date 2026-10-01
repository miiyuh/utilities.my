// Site-wide date and number formatting. Tools read the user's preference from
// Settings through `useToolSettings`; these helpers stay pure so they can be
// used outside React (e.g. the Palang IC renderer).

export type DatePreset = 'my' | 'us' | 'iso';
export type TimeFormat = '12h' | '24h';
export type NumberFormat = 'period' | 'comma';

interface DateParts {
  /** 1 October 2026 */
  long: string;
  /** Thu, 1 Oct */
  weekday: string;
  /** 01/10/2026 */
  numeric: string;
  /** 1/10 */
  dayMonth: string;
}

export interface DatePatterns extends DateParts {
  /** 3:16 PM / 15:16 */
  time: string;
  /** 3:16:05 PM / 15:16:05 */
  timeSec: string;
}

export const DATE_PRESETS: Record<DatePreset, { label: string; fns: DateParts; dayjs: DateParts }> = {
  my: {
    label: 'Malaysia / UK',
    fns: { long: 'd MMMM yyyy', weekday: 'EEE, d MMM', numeric: 'dd/MM/yyyy', dayMonth: 'd/M' },
    dayjs: { long: 'D MMMM YYYY', weekday: 'ddd, D MMM', numeric: 'DD/MM/YYYY', dayMonth: 'D/M' },
  },
  us: {
    label: 'US',
    fns: { long: 'MMMM d, yyyy', weekday: 'EEE, MMM d', numeric: 'MM/dd/yyyy', dayMonth: 'M/d' },
    dayjs: { long: 'MMMM D, YYYY', weekday: 'ddd, MMM D', numeric: 'MM/DD/YYYY', dayMonth: 'M/D' },
  },
  iso: {
    label: 'ISO 8601',
    fns: { long: 'yyyy-MM-dd', weekday: 'EEE yyyy-MM-dd', numeric: 'yyyy-MM-dd', dayMonth: 'MM-dd' },
    dayjs: { long: 'YYYY-MM-DD', weekday: 'ddd YYYY-MM-DD', numeric: 'YYYY-MM-DD', dayMonth: 'MM-DD' },
  },
};

export function fnsPatterns(preset: DatePreset, timeFormat: TimeFormat): DatePatterns {
  const p = (DATE_PRESETS[preset] ?? DATE_PRESETS.my).fns;
  return timeFormat === '24h'
    ? { ...p, time: 'HH:mm', timeSec: 'HH:mm:ss' }
    : { ...p, time: 'h:mm a', timeSec: 'h:mm:ss a' };
}

export function dayjsPatterns(preset: DatePreset, timeFormat: TimeFormat): DatePatterns {
  const p = (DATE_PRESETS[preset] ?? DATE_PRESETS.my).dayjs;
  return timeFormat === '24h'
    ? { ...p, time: 'HH:mm', timeSec: 'HH:mm:ss' }
    : { ...p, time: 'h:mm A', timeSec: 'h:mm:ss A' };
}

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

export function separators(numberFormat: NumberFormat): { group: string; decimal: string } {
  return numberFormat === 'comma' ? { group: '.', decimal: ',' } : { group: ',', decimal: '.' };
}

/** Grouped, locale-aware display of a number: 1234.5 → "1,234.5" (or "1.234,5"). */
export function formatNumber(n: number, numberFormat: NumberFormat, maxDecimals = 2, minDecimals = 0): string {
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat(numberFormat === 'comma' ? 'de-DE' : 'en-US', {
    minimumFractionDigits: Math.min(minDecimals, maxDecimals),
    maximumFractionDigits: maxDecimals,
  }).format(n);
}

/**
 * Groups the integer part of a raw numeric string ("-1234.50" with a "."
 * decimal) without touching the fraction, so partially typed values such as
 * "1234." or "0.0" survive a round trip through an input.
 */
export function groupDigits(raw: string, numberFormat: NumberFormat): string {
  const m = /^(-?)(\d*)(\.?)(\d*)$/.exec(raw);
  if (!m) return raw;
  const [, sign, int, dot, frac] = m;
  const { group, decimal } = separators(numberFormat);
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  return `${sign}${grouped}${dot ? decimal : ''}${frac}`;
}

/**
 * Inverse of `groupDigits`: strips group separators and normalises the
 * decimal to ".". Returns null when the text is not a (partial) number.
 */
export function parseGrouped(text: string, numberFormat: NumberFormat): string | null {
  const { group, decimal } = separators(numberFormat);
  const stripped = text.trim().split(group).join('').split(decimal).join('.');
  return /^-?\d*\.?\d*$/.test(stripped) ? stripped : null;
}

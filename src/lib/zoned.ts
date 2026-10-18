// Time-zone helpers on date-fns + @date-fns/tz. A TZDate is a Date whose
// getters, and date-fns functions given it (format, startOfDay, addDays),
// work in its zone. Adding hours stays in absolute time, so it is DST-safe.

import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'

export { TZDate }

/** The device's IANA time zone, e.g. "Asia/Kuala_Lumpur". */
export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/** The same instant, read in `zone` (an IANA name or an offset like "+05:30"). */
export function inZone(instant: Date | number, zone: string): TZDate {
  return new TZDate(+instant, zone)
}

/** A fixed UTC offset in hours (5.5, -3.5) as a zone string: "+05:30". */
export function offsetZone(hours: number): string {
  const sign = hours < 0 ? '-' : '+'
  const minutes = Math.round(Math.abs(hours) * 60)
  return `${sign}${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** The zone's offset at this instant for a "GMT" label: "+08", "+05:30", "-03:30". */
export function gmtOffset(date: TZDate): string {
  return format(date, 'xxx').replace(':00', '')
}

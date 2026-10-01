// "Add to calendar" for a planned time: links that open a pre-filled event in
// Google Calendar or Outlook, and an .ics file for Apple Calendar and the rest.
// Times are sent in UTC, so each calendar shows them in its owner's timezone.

export interface CalendarEvent {
  title: string
  start: Date
  end: Date
  details: string
}

/** 20261002T090000Z */
const compactUtc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
/** 2026-10-02T09:00:00Z */
const isoUtc = (d: Date) => d.toISOString().replace(/\.\d{3}/, '')

export function googleCalendarUrl(e: CalendarEvent): string {
  const p = new URLSearchParams({ action: 'TEMPLATE', text: e.title, dates: `${compactUtc(e.start)}/${compactUtc(e.end)}`, details: e.details })
  return `https://calendar.google.com/calendar/render?${p}`
}

/** Outlook on the web: `live` for personal Outlook.com accounts, `office` for work or school (Microsoft 365). */
export function outlookUrl(e: CalendarEvent, kind: 'live' | 'office'): string {
  const host = kind === 'live' ? 'outlook.live.com' : 'outlook.office.com'
  const p = new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: e.title, startdt: isoUtc(e.start), enddt: isoUtc(e.end), body: e.details })
  return `https://${host}/calendar/0/deeplink/compose?${p}`
}

/** Escapes text for an iCalendar property value (RFC 5545 §3.3.11). */
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** Folds a content line to 75 octets, continuing lines with a leading space (RFC 5545 §3.1). */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const parts: string[] = []
  let current = ''
  let size = 0
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length
    if (size + n > (parts.length ? 74 : 75)) {
      parts.push(current)
      current = ''
      size = 0
    }
    current += ch
    size += n
  }
  parts.push(current)
  return parts.join('\r\n ')
}

/** An iCalendar file with one event, for Apple Calendar, Outlook desktop, Thunderbird and others. */
export function buildIcs(e: CalendarEvent): string {
  const uid = `${compactUtc(e.start)}-${Math.random().toString(36).slice(2)}@utilities.my`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//utilities.my//Timezone Converter//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${compactUtc(new Date())}`,
    `DTSTART:${compactUtc(e.start)}`,
    `DTEND:${compactUtc(e.end)}`,
    `SUMMARY:${icsText(e.title)}`,
    `DESCRIPTION:${icsText(e.details)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .map(fold)
    .join('\r\n') + '\r\n'
}

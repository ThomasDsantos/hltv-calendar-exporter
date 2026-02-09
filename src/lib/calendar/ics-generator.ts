import { CalendarEvent } from '../extractors/types';
import { formatDateToICS, generateUID } from '../utils/date-utils';

/**
 * Generate ICS file content for one or more calendar events
 */
export function generateICS(events: CalendarEvent[]): string {
  const vcalendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HLTV Calendar Exporter//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const event of events) {
    vcalendar.push(...generateVEvent(event));
  }

  vcalendar.push('END:VCALENDAR');

  return vcalendar.join('\r\n');
}

function generateVEvent(event: CalendarEvent): string[] {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${generateUID()}`,
    `DTSTAMP:${formatDateToICS(new Date())}`,
    `DTSTART:${formatDateToICS(event.startDate)}`,
    `DTEND:${formatDateToICS(event.endDate)}`,
    `SUMMARY:${escapeICSText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICSText(event.location)}`);
  }

  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  lines.push('END:VEVENT');

  return lines;
}

/**
 * Escape special characters for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Download ICS file to user's device
 */
export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

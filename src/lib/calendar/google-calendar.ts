import { CalendarEvent } from '../extractors/types';
import { formatDateToGoogleCalendar } from '../utils/date-utils';

const GOOGLE_CALENDAR_BASE_URL = 'https://calendar.google.com/calendar/render';

/**
 * Generate Google Calendar URL for a single event
 */
export function generateGoogleCalendarURL(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDateToGoogleCalendar(event.startDate)}/${formatDateToGoogleCalendar(event.endDate)}`,
    details: event.description,
  });

  if (event.location) {
    params.set('location', event.location);
  }

  return `${GOOGLE_CALENDAR_BASE_URL}?${params.toString()}`;
}

/**
 * Open Google Calendar in a new tab with the event pre-filled
 */
export function openGoogleCalendar(event: CalendarEvent): void {
  const url = generateGoogleCalendarURL(event);
  window.open(url, '_blank');
}

import { CalendarEvent } from '../extractors/types';
import { formatDateToOutlook } from '../utils/date-utils';

const OUTLOOK_LIVE_BASE_URL = 'https://outlook.live.com/calendar/0/deeplink/compose';
const OUTLOOK_OFFICE_BASE_URL = 'https://outlook.office.com/calendar/0/deeplink/compose';

export type OutlookVariant = 'live' | 'office';

/**
 * Generate Outlook Calendar URL for a single event
 */
export function generateOutlookCalendarURL(
  event: CalendarEvent,
  variant: OutlookVariant = 'live'
): string {
  const baseUrl = variant === 'office' ? OUTLOOK_OFFICE_BASE_URL : OUTLOOK_LIVE_BASE_URL;

  const params = new URLSearchParams({
    subject: event.title,
    startdt: formatDateToOutlook(event.startDate),
    enddt: formatDateToOutlook(event.endDate),
    body: event.description,
    path: '/calendar/action/compose',
    rru: 'addevent',
  });

  if (event.location) {
    params.set('location', event.location);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Open Outlook Calendar in a new tab with the event pre-filled
 */
export function openOutlookCalendar(event: CalendarEvent, variant: OutlookVariant = 'live'): void {
  const url = generateOutlookCalendarURL(event, variant);
  window.open(url, '_blank');
}

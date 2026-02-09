/**
 * Format a date to ISO string without dashes/colons for ICS format
 * e.g., 20260210T150000Z
 */
export function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Format a date to ISO string for Google Calendar
 * e.g., 20260210T150000Z
 */
export function formatDateToGoogleCalendar(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Format a date to ISO string for Outlook
 * e.g., 2026-02-10T15:00:00Z
 */
export function formatDateToOutlook(date: Date): string {
  return date.toISOString().replace(/\.\d{3}/, '');
}

/**
 * Parse HLTV Unix timestamp (in milliseconds) to Date
 */
export function parseHLTVTimestamp(unixMs: string | number): Date {
  const ms = typeof unixMs === 'string' ? parseInt(unixMs, 10) : unixMs;
  return new Date(ms);
}

/**
 * Generate a unique ID for ICS events
 */
export function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}@hltv-calendar-exporter`;
}

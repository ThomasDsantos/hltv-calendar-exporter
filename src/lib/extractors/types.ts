export interface HLTVMatch {
  id: string;
  team1: string;
  team2: string;
  date: Date;
  tournament: string;
  matchUrl: string;
  bestOf?: number;
  stage?: string;
}

export type CalendarProvider = 'google' | 'outlook' | 'ics';

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  url?: string;
}

export function matchToCalendarEvent(match: HLTVMatch): CalendarEvent {
  const durationHours = getDurationFromBestOf(match.bestOf);
  const endDate = new Date(match.date.getTime() + durationHours * 60 * 60 * 1000);

  return {
    title: `${match.team1} vs ${match.team2} - ${match.tournament}`,
    description: `Watch at ${match.matchUrl}`,
    startDate: match.date,
    endDate,
    url: match.matchUrl,
  };
}

function getDurationFromBestOf(bestOf?: number): number {
  switch (bestOf) {
    case 1:
      return 1;
    case 3:
      return 2.5;
    case 5:
      return 4;
    default:
      return 2;
  }
}

import { HLTVMatch } from './types';
import { parseHLTVTimestamp } from '../utils/date-utils';

/**
 * Extract match data from an individual match page (hltv.org/matches/{id}/{slug})
 */
export function extractMatchFromMatchPage(): HLTVMatch | null {
  try {
    const team1El = document.querySelector('.team1-gradient .teamName');
    const team2El = document.querySelector('.team2-gradient .teamName');
    const timeEl = document.querySelector('[data-unix]');
    const eventEl = document.querySelector('.event a');
    const formatEl = document.querySelector('.preformatted-text');

    if (!team1El || !team2El || !timeEl) {
      return null;
    }

    const team1 = team1El.textContent?.trim() || 'Team 1';
    const team2 = team2El.textContent?.trim() || 'Team 2';
    const unixTimestamp = timeEl.getAttribute('data-unix');
    const format = formatEl?.textContent?.trim() || '';

    if (!unixTimestamp) {
      return null;
    }

    const matchIdMatch = window.location.pathname.match(/\/matches\/(\d+)\//);
    const matchId = matchIdMatch ? matchIdMatch[1] : Date.now().toString();

    const tournament = eventEl?.textContent?.trim()
      || extractTournamentFromURL(window.location.pathname, team2)
      || 'CS Match';

    return {
      id: matchId,
      team1,
      team2,
      date: parseHLTVTimestamp(unixTimestamp),
      tournament,
      matchUrl: window.location.href,
      bestOf: parseBestOf(format),
      stage: parseStage(format),
    };
  } catch {
    return null;
  }
}

/**
 * Extract a single match from a listing element
 */
export function extractMatchFromListingElement(matchEl: Element): HLTVMatch | null {
  try {
    const linkEl = matchEl.querySelector('a[href*="/matches/"]') as HTMLAnchorElement;
    const timeEl = matchEl.querySelector('[data-unix]');
    const teamNameEls = matchEl.querySelectorAll('.match-teamname');
    const formatEl = matchEl.querySelector('.match-format');

    if (!linkEl || !timeEl || teamNameEls.length < 2) {
      return null;
    }

    const href = linkEl.getAttribute('href') || '';
    const matchIdMatch = href.match(/\/matches\/(\d+)\//);
    const matchId = matchIdMatch ? matchIdMatch[1] : Date.now().toString();

    const unixTimestamp = timeEl.getAttribute('data-unix');
    if (!unixTimestamp) return null;

    const team1 = teamNameEls[0]?.textContent?.trim() || 'Team 1';
    const team2 = teamNameEls[1]?.textContent?.trim() || 'Team 2';
    const tournament = extractTournamentName(matchEl, href, team2);
    const format = formatEl?.textContent?.trim() || '';

    return {
      id: matchId,
      team1,
      team2,
      date: parseHLTVTimestamp(unixTimestamp),
      tournament,
      matchUrl: `https://www.hltv.org${href}`,
      bestOf: parseBestOf(format),
    };
  } catch {
    return null;
  }
}

/**
 * Extract tournament name with multiple fallback strategies
 */
function extractTournamentName(matchEl: Element, href: string, team2: string): string {
  // 1. data-event-headline attribute on .match-event
  const eventEl = matchEl.querySelector('.match-event');
  if (eventEl) {
    const headline = eventEl.getAttribute('data-event-headline');
    if (headline) return headline;

    const textContent = eventEl.textContent?.trim();
    if (textContent) return textContent;
  }

  // 2. Page-level event name (for /events/*/matches pages)
  const pageEventName = document.querySelector('.event-hub-title')?.textContent?.trim();
  if (pageEventName) return pageEventName;

  // 3. Extract from match URL slug (e.g. /matches/123/team1-vs-team2-tournament-name)
  return extractTournamentFromURL(href, team2) || 'CS Match';
}

/**
 * Extract tournament name from a match URL slug
 * e.g. /matches/2389843/leo-vs-lazer-cats-cct-season-3-europe-series-15
 *   → "CCT Season 3 Europe Series 15"
 */
function extractTournamentFromURL(href: string, team2: string): string | null {
  const slugMatch = href.match(/\/matches\/\d+\/(.+)/);
  if (!slugMatch) return null;

  const slug = slugMatch[1];
  const t2 = team2.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Match URL pattern: {team1}-vs-{team2}-{event-slug}
  const vsPattern = new RegExp(`^.+-vs-.*?${t2}-(.+)$`, 'i');
  const match = slug.match(vsPattern);
  if (!match) return null;

  const eventSlug = match[1];
  // Convert slug to title case: "cct-season-3-europe-series-15" → "CCT Season 3 Europe Series 15"
  return eventSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function parseBestOf(format: string): number | undefined {
  const lower = format.toLowerCase();
  if (lower.includes('bo1') || lower.includes('best of 1')) return 1;
  if (lower.includes('bo3') || lower.includes('best of 3')) return 3;
  if (lower.includes('bo5') || lower.includes('best of 5')) return 5;
  return undefined;
}

function parseStage(format: string): string | undefined {
  const match = format.match(/\((.*?)\)/);
  return match ? match[1] : undefined;
}

import './styles.css';
import { extractMatchFromMatchPage } from '../lib/extractors/match-extractor';
import { matchToCalendarEvent, CalendarProvider, HLTVMatch } from '../lib/extractors/types';
import { generateICS, downloadICS } from '../lib/calendar/ics-generator';
import { openGoogleCalendar } from '../lib/calendar/google-calendar';
import { openOutlookCalendar } from '../lib/calendar/outlook-calendar';

const CALENDAR_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>`;

const GOOGLE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`;

const OUTLOOK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.154-.352.23-.58.23h-8.547v-6.959l1.6 1.229c.102.086.227.129.375.129.148 0 .273-.043.375-.129l6.778-5.207c.086-.059.143-.095.17-.107.029-.012.07-.018.125-.018.148 0 .27.043.363.129.094.086.14.199.14.34v-.69h.44zm-.238-1.657c.16.152.238.348.238.588v.46l-7.547 5.8-7.818-6V6.32c0-.242.08-.438.238-.59.16-.152.352-.228.58-.228h13.73c.227 0 .42.076.58.228zM8.073 8.994L0 14.39V6.32c0-.586.22-1.088.659-1.506.44-.418.982-.627 1.63-.627h5.784v4.807zm-6.444 7.193l5.842-4.49 1.22.938c.103.086.228.129.376.129.148 0 .273-.043.375-.129l1.191-.91v6.959H1.63c-.227 0-.42-.076-.58-.23-.158-.152-.238-.346-.238-.576v-1.69l.817-.001z"/></svg>`;

const ICS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`;

function init() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }
}

function injectButton() {
  const match = extractMatchFromMatchPage();
  if (!match) return;

  const dateEl = document.querySelector('.timeAndEvent .date');
  if (!dateEl) return;

  const dropdown = document.createElement('div');
  dropdown.className = 'hltv-cal-dropdown hltv-cal-match-inline';

  const btn = document.createElement('button');
  btn.className = 'hltv-cal-match-btn';
  btn.innerHTML = `${CALENDAR_ICON} Add to Calendar`;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleCalendarClick(dropdown, match);
  });

  const menu = document.createElement('div');
  menu.className = 'hltv-cal-dropdown-menu';
  menu.innerHTML = `
    <button class="hltv-cal-dropdown-item" data-provider="google">
      ${GOOGLE_ICON}
      <span>Google Calendar</span>
    </button>
    <button class="hltv-cal-dropdown-item" data-provider="outlook">
      ${OUTLOOK_ICON}
      <span>Outlook</span>
    </button>
    <button class="hltv-cal-dropdown-item" data-provider="ics">
      ${ICS_ICON}
      <span>Download .ics</span>
    </button>
  `;

  menu.querySelectorAll('.hltv-cal-dropdown-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const provider = (item as HTMLElement).dataset.provider as CalendarProvider;
      exportMatch(match, provider);
      closeAllDropdowns();
    });
  });

  dropdown.appendChild(btn);
  dropdown.appendChild(menu);

  // Insert right after the date element, under the time
  dateEl.parentNode?.insertBefore(dropdown, dateEl.nextSibling);

  document.addEventListener('click', closeAllDropdowns);
}

function handleCalendarClick(dropdown: Element, match: HLTVMatch) {
  chrome.runtime.sendMessage({ type: 'getSettings' }, (settings) => {
    const provider = settings?.defaultProvider;
    if (provider && provider !== 'unset') {
      exportMatch(match, provider as CalendarProvider);
    } else {
      toggleDropdown(dropdown);
    }
  });
}

function toggleDropdown(dropdown: Element) {
  const menu = dropdown.querySelector('.hltv-cal-dropdown-menu');
  if (menu) {
    const isOpen = menu.classList.contains('show');
    closeAllDropdowns();
    if (!isOpen) {
      menu.classList.add('show');
    }
  }
}

function closeAllDropdowns() {
  document.querySelectorAll('.hltv-cal-dropdown-menu.show').forEach((menu) => {
    menu.classList.remove('show');
  });
}

function exportMatch(match: HLTVMatch, provider: CalendarProvider) {
  const event = matchToCalendarEvent(match);

  switch (provider) {
    case 'google':
      openGoogleCalendar(event);
      showToast('Opening Google Calendar...');
      break;
    case 'outlook':
      openOutlookCalendar(event);
      showToast('Opening Outlook...');
      break;
    case 'ics': {
      const icsContent = generateICS([event]);
      const filename = `${match.team1}-vs-${match.team2}.ics`.replace(/\s+/g, '-');
      downloadICS(icsContent, filename);
      showToast('ICS file downloaded!', 'success');
      break;
    }
  }
}

function showToast(message: string, type: 'info' | 'success' | 'error' = 'info') {
  document.querySelectorAll('.hltv-cal-toast').forEach((t) => t.remove());

  const toast = document.createElement('div');
  toast.className = `hltv-cal-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

init();

import './styles.css';
import { extractMatchFromListingElement } from '../lib/extractors/match-extractor';
import { matchToCalendarEvent, CalendarProvider, HLTVMatch } from '../lib/extractors/types';
import { generateICS, downloadICS } from '../lib/calendar/ics-generator';
import { openGoogleCalendar } from '../lib/calendar/google-calendar';
import { openOutlookCalendar } from '../lib/calendar/outlook-calendar';

const selectedMatches = new Map<string, HLTVMatch>();

function init() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}

function setup() {
  injectButtons();
  createBulkExportBar();

  // Re-inject on dynamic content changes (HLTV uses some dynamic loading)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        injectButtons();
      }
    }
  });

  const matchesContainer = document.querySelector('.upcomingMatchesSection, .results-all, .event-matches-content, .event-hub-content');
  if (matchesContainer) {
    observer.observe(matchesContainer, { childList: true, subtree: true });
  }
}

function injectButtons() {
  const matchElements = document.querySelectorAll('.match:not([data-hltv-cal-injected])');

  matchElements.forEach((matchEl) => {
    matchEl.setAttribute('data-hltv-cal-injected', 'true');

    const match = extractMatchFromListingElement(matchEl);
    if (!match) return;

    const btnWrapper = matchEl.querySelector('.match-btn-wrapper');
    if (!btnWrapper) return;

    // Create quick add button (styled like .match-btn)
    const quickBtn = document.createElement('div');
    quickBtn.className = 'match-btn hltv-cal-add-btn';
    quickBtn.innerHTML = `<i class="fa fa-calendar"></i>`;
    quickBtn.title = 'Add to calendar';

    quickBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleCalendarClick(quickBtn, match);
    });

    // Create checkbox button (styled like .match-btn)
    const selectBtn = document.createElement('div');
    selectBtn.className = 'match-btn hltv-cal-select-btn';
    selectBtn.title = 'Select for bulk export';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'hltv-cal-checkbox';
    checkbox.checked = selectedMatches.has(match.id);

    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      if (checkbox.checked) {
        selectedMatches.set(match.id, match);
      } else {
        selectedMatches.delete(match.id);
      }
      updateBulkExportBar();
    });

    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    selectBtn.appendChild(checkbox);

    // Append both to the btn wrapper (after existing analytics/pin buttons)
    btnWrapper.appendChild(quickBtn);
    btnWrapper.appendChild(selectBtn);
  });
}

function handleCalendarClick(btn: HTMLElement, match: HLTVMatch) {
  chrome.runtime.sendMessage({ type: 'getSettings' }, (settings) => {
    const provider = settings?.defaultProvider;
    if (provider && provider !== 'unset') {
      exportSingleMatch(match, provider as CalendarProvider);
    } else {
      showQuickExportMenu(btn, match);
    }
  });
}

function showQuickExportMenu(btn: HTMLElement, match: HLTVMatch) {
  // Remove any existing menus
  document.querySelectorAll('.hltv-cal-quick-menu').forEach((m) => m.remove());

  const menu = document.createElement('div');
  menu.className = 'hltv-cal-dropdown-menu hltv-cal-quick-menu show';

  menu.innerHTML = `
    <button class="hltv-cal-dropdown-item" data-provider="google">Google Calendar</button>
    <button class="hltv-cal-dropdown-item" data-provider="outlook">Outlook</button>
    <button class="hltv-cal-dropdown-item" data-provider="ics">Download .ics</button>
  `;

  // Position relative to the button
  const rect = btn.getBoundingClientRect();
  menu.style.position = 'absolute';
  menu.style.zIndex = '10001';
  menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
  menu.style.right = `${document.documentElement.clientWidth - rect.right - window.scrollX}px`;

  menu.querySelectorAll('.hltv-cal-dropdown-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const provider = (item as HTMLElement).dataset.provider as CalendarProvider;
      exportSingleMatch(match, provider);
      menu.remove();
    });
  });

  document.body.appendChild(menu);

  // Close menu on click outside
  const closeHandler = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      menu.remove();
      document.removeEventListener('click', closeHandler);
    }
  };
  setTimeout(() => document.addEventListener('click', closeHandler), 0);
}

function createBulkExportBar() {
  const bar = document.createElement('div');
  bar.className = 'hltv-cal-bulk-bar hidden';
  bar.id = 'hltv-cal-bulk-bar';

  bar.innerHTML = `
    <div class="hltv-cal-bulk-info">
      <span id="hltv-cal-selected-count">0</span> matches selected
    </div>
    <div class="hltv-cal-bulk-actions">
      <button class="hltv-cal-bulk-clear" id="hltv-cal-clear-btn">Clear</button>
      <button class="hltv-cal-bulk-export" id="hltv-cal-export-ics">Download .ics file</button>
    </div>
  `;

  document.body.appendChild(bar);

  // Event listeners
  document.getElementById('hltv-cal-clear-btn')?.addEventListener('click', () => {
    selectedMatches.clear();
    document.querySelectorAll('.hltv-cal-checkbox').forEach((cb) => {
      (cb as HTMLInputElement).checked = false;
    });
    updateBulkExportBar();
  });

  document.getElementById('hltv-cal-export-ics')?.addEventListener('click', () => {
    exportSelectedMatches();
  });
}

function updateBulkExportBar() {
  const bar = document.getElementById('hltv-cal-bulk-bar');
  const countEl = document.getElementById('hltv-cal-selected-count');

  if (bar && countEl) {
    const count = selectedMatches.size;
    countEl.textContent = count.toString();

    if (count > 0) {
      bar.classList.remove('hidden');
    } else {
      bar.classList.add('hidden');
    }
  }
}

function exportSingleMatch(match: HLTVMatch, provider: CalendarProvider) {
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

function exportSelectedMatches() {
  if (selectedMatches.size === 0) {
    showToast('No matches selected', 'error');
    return;
  }

  const matches = Array.from(selectedMatches.values());
  const events = matches.map(matchToCalendarEvent);
  const icsContent = generateICS(events);

  const date = new Date().toISOString().split('T')[0];
  const filename = `hltv-matches-${date}.ics`;
  downloadICS(icsContent, filename);

  showToast(`Downloaded ${matches.length} matches!`, 'success');
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

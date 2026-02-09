# HLTV Calendar Exporter

Browser extension to export HLTV Counter-Strike matches to your calendar.

## Features

- **Add individual matches** - Click the calendar button on any match page or listing
- **Bulk export** - Select multiple matches and download a single .ics file
- **Multiple calendar providers**:
  - ICS download (works with any calendar app)
  - Google Calendar (opens with pre-filled event)
  - Outlook (Office 365 and Outlook.com)

## Installation

### Chrome

1. Clone or download this repository
2. Run `npm install` and `npm run build`
3. Open `chrome://extensions` in Chrome
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked" and select the `dist` folder

### Firefox

1. Clone or download this repository
2. Run `npm install` and `npm run build`
3. Open `about:debugging#/runtime/this-firefox`
4. Click "Load Temporary Add-on..."
5. Select any file in the `dist` folder

## Usage

### On Match Pages

1. Navigate to any HLTV match page (e.g., `hltv.org/matches/12345/...`)
2. Click the "Add to Calendar" button
3. Choose your calendar provider

### On Matches Listing

1. Navigate to `hltv.org/matches`
2. **Single match**: Click the calendar icon next to any match
3. **Multiple matches**: Use the checkboxes to select matches, then click "Download .ics file" in the bottom bar

## Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── background/           # Service worker
├── content/              # Content scripts injected into HLTV
├── popup/                # Extension popup UI
├── lib/
│   ├── calendar/         # Calendar URL/ICS generators
│   ├── extractors/       # DOM data extraction
│   └── utils/            # Utilities
└── assets/icons/         # Extension icons
```

## Supported Pages

- `hltv.org/matches` - Matches listing with bulk export
- `hltv.org/matches/*` - Individual match pages

## Technical Notes

- Uses Manifest V3 for Chrome/Firefox compatibility
- ICS files follow the iCalendar specification (RFC 5545)
- Match duration is estimated based on format (Bo1: 1h, Bo3: 2.5h, Bo5: 4h)
- Timestamps from HLTV are in milliseconds (Unix epoch)

## License

MIT

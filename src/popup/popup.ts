// Popup script for HLTV Calendar Exporter

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const settings = await chrome.storage.sync.get(['defaultProvider', 'outlookVariant']);

  const providerSelect = document.getElementById('default-provider') as HTMLSelectElement;
  const outlookSelect = document.getElementById('outlook-variant') as HTMLSelectElement;

  if (settings.defaultProvider) {
    providerSelect.value = settings.defaultProvider;
  }

  if (settings.outlookVariant) {
    outlookSelect.value = settings.outlookVariant;
  }

  // Save settings on change
  providerSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ defaultProvider: providerSelect.value });
  });

  outlookSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ outlookVariant: outlookSelect.value });
  });

  // Quick action button
  document.getElementById('open-hltv')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.hltv.org/matches' });
    window.close();
  });
});

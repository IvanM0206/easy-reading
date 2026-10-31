// Service worker: atajo de teclado, indicador "ON" en el ícono e inyección en pestañas abiertas.
const BADGE_COLOR = "#0B7A75";

function setBadge(on) {
  chrome.action.setBadgeText({ text: on ? "ON" : "" });
  chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
}

function syncBadge() {
  chrome.storage.sync.get({ on: false }, (v) => setBadge(v.on));
}

// Chrome no carga los content scripts en las pestañas que ya estaban abiertas al instalar,
// actualizar o recargar la extensión. Sin esto, esas pestañas siguen con la versión anterior.
async function injectIntoOpenTabs() {
  const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*", "file:///*"] });
  for (const tab of tabs) {
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] }).catch(() => {});
  }
}

chrome.runtime.onInstalled.addListener(() => {
  syncBadge();
  injectIntoOpenTabs();
});
chrome.runtime.onStartup.addListener(syncBadge);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.on) setBadge(changes.on.newValue);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle-focus") return;
  chrome.storage.sync.get({ on: false }, (v) => chrome.storage.sync.set({ on: !v.on }));
});

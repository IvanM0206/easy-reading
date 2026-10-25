// Service worker: atajo de teclado e indicador "ON" en el ícono.
const BADGE_COLOR = "#0B7A75";

function setBadge(on) {
  chrome.action.setBadgeText({ text: on ? "ON" : "" });
  chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
}

function syncBadge() {
  chrome.storage.sync.get({ on: false }, (v) => setBadge(v.on));
}

chrome.runtime.onInstalled.addListener(syncBadge);
chrome.runtime.onStartup.addListener(syncBadge);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.on) setBadge(changes.on.newValue);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle-focus") return;
  chrome.storage.sync.get({ on: false }, (v) => chrome.storage.sync.set({ on: !v.on }));
});

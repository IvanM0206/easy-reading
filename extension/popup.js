const EFFECTS = ["dim", "blur"];
const DEFAULTS = { on: false, effect: "dim", zone: 4, strength: 6, dimColor: "auto" };
const S = { ...DEFAULTS };
const $ = (id) => document.getElementById(id);
const EFFECT_HINTS = {
  dim: "Atenúa el resto del texto. Con intensidad alta lo oculta casi por completo.",
  blur: "Desenfoque suave de toda la página. Puede ir lento en equipos modestos.",
};
const COLOR_NAMES = {
  auto: "fondo de la página",
  "#ffffff": "blanco",
  "#f4ecd8": "sepia",
  "#8a8f98": "gris",
  "#1b2430": "azul noche",
  "#000000": "negro",
};

function render() {
  $("onoff").setAttribute("aria-checked", String(S.on));
  document.querySelectorAll("[data-effect]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.effect === S.effect));
  });
  $("effectHint").textContent = EFFECT_HINTS[S.effect] || "";
  $("colorField").hidden = S.effect !== "dim";

  const preset = S.dimColor in COLOR_NAMES;
  document.querySelectorAll("[data-color]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.color === S.dimColor));
  });
  document.querySelector(".swatch.custom").classList.toggle("on", !preset);
  if (!preset) $("customColor").value = S.dimColor;
  $("colorO").textContent = preset ? COLOR_NAMES[S.dimColor] : S.dimColor;

  $("zone").value = S.zone;
  $("zoneO").textContent = S.zone;
  $("strength").value = S.strength;
  $("strengthO").textContent = S.strength;
}

function set(patch) {
  Object.assign(S, patch);
  chrome.storage.sync.set(patch);
  render();
}

$("onoff").addEventListener("click", () => set({ on: !S.on }));
document.querySelectorAll("[data-effect]").forEach((b) => {
  b.addEventListener("click", () => set({ effect: b.dataset.effect }));
});
document.querySelectorAll("[data-color]").forEach((b) => {
  b.addEventListener("click", () => set({ dimColor: b.dataset.color }));
});
$("customColor").addEventListener("input", (e) => set({ dimColor: e.target.value }));
$("zone").addEventListener("input", (e) => set({ zone: parseInt(e.target.value, 10) }));
$("strength").addEventListener("input", (e) => set({ strength: parseInt(e.target.value, 10) }));

chrome.storage.sync.get(DEFAULTS, (v) => {
  Object.assign(S, v);
  // El efecto "Rápido" se quitó: quien lo tenía elegido pasa a Resaltado.
  if (!EFFECTS.includes(S.effect)) set({ effect: DEFAULTS.effect });
  render();
});

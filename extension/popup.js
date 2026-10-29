const DEFAULTS = { on: false, effect: "blur", zone: 4, strength: 6 };
const S = { ...DEFAULTS };
const $ = (id) => document.getElementById(id);
const EFFECT_HINTS = {
  blur: "Desenfoque suave de toda la página. Puede ir lento en equipos modestos.",
  tiles: "Experimental: desenfoque por bloques, más liviano. Pueden verse líneas en los bordes de los bloques.",
  dim: "Solo atenúa el resto del texto. Es el más liviano.",
};

function render() {
  $("onoff").setAttribute("aria-checked", String(S.on));
  document.querySelectorAll("[data-effect]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.effect === S.effect));
  });
  $("effectHint").textContent = EFFECT_HINTS[S.effect] || "";
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
$("zone").addEventListener("input", (e) => set({ zone: parseInt(e.target.value, 10) }));
$("strength").addEventListener("input", (e) => set({ strength: parseInt(e.target.value, 10) }));

chrome.storage.sync.get(DEFAULTS, (v) => {
  Object.assign(S, v);
  render();
});

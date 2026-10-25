// Content script: dibuja una capa fija sobre la página que desenfoca o atenúa todo
// menos un círculo alrededor del cursor. No modifica el texto ni el DOM del sitio.
(() => {
  if (window.__focoLecturaLoaded) return;
  window.__focoLecturaLoaded = true;

  const DEFAULTS = { on: false, effect: "blur", zone: 4, strength: 6 };
  const S = { ...DEFAULTS };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let host = null;
  let veil = null;
  let raf = 0;
  let px = innerWidth / 2;
  let py = innerHeight / 2;
  let cx = px;
  let cy = py;

  const STYLE = `
    #veil { position: absolute; inset: 0; pointer-events: none; }
    #veil.blur { backdrop-filter: blur(var(--b, 8px)); -webkit-backdrop-filter: blur(var(--b, 8px)); }
    #veil.dim { background: var(--bg, #fff); opacity: var(--o, .7); }
    @media print { #veil { display: none; } }
  `;

  // Color de fondo real de la página, para que el modo "atenuar" se funda con ella.
  function pageBackground() {
    for (const el of [document.body, document.documentElement]) {
      if (!el) continue;
      const c = getComputedStyle(el).backgroundColor;
      if (c && c !== "transparent" && !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(c)) return c;
    }
    return matchMedia("(prefers-color-scheme: dark)").matches ? "#1b1b1b" : "#ffffff";
  }

  function create() {
    host = document.createElement("div");
    host.id = "foco-lectura-host";
    host.style.cssText =
      "all: initial !important; position: fixed !important; inset: 0 !important;" +
      "z-index: 2147483647 !important; pointer-events: none !important; display: block !important;";
    const root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = STYLE;
    veil = document.createElement("div");
    veil.id = "veil";
    root.append(style, veil);
    document.documentElement.appendChild(host);
  }

  function frame() {
    raf = 0;
    const k = reduceMotion ? 1 : 0.28;
    cx += (px - cx) * k;
    cy += (py - cy) * k;
    const moving = Math.abs(px - cx) > 0.4 || Math.abs(py - cy) > 0.4;
    if (!moving) { cx = px; cy = py; }

    const r = 50 + S.zone * 20;
    const f = r * 0.7;
    const mask = `radial-gradient(circle at ${cx}px ${cy}px, transparent ${r}px, #000 ${r + f}px)`;
    veil.style.webkitMaskImage = mask;
    veil.style.maskImage = mask;
    if (moving) kick();
  }

  function kick() {
    if (!raf && veil) raf = requestAnimationFrame(frame);
  }

  function onMove(e) {
    px = e.clientX;
    py = e.clientY;
    kick();
  }

  function apply() {
    if (!S.on) {
      removeEventListener("pointermove", onMove, true);
      if (host) host.style.setProperty("display", "none", "important");
      return;
    }
    if (!host) create();
    host.style.setProperty("display", "block", "important");
    veil.className = S.effect;
    veil.style.setProperty("--b", S.strength * 1.6 + "px");
    veil.style.setProperty("--o", (0.15 + S.strength * 0.085).toFixed(2));
    veil.style.setProperty("--bg", pageBackground());
    addEventListener("pointermove", onMove, { capture: true, passive: true });
    kick();
  }

  chrome.storage.sync.get(DEFAULTS, (v) => {
    Object.assign(S, v);
    apply();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    for (const key of Object.keys(changes)) if (key in DEFAULTS) S[key] = changes[key].newValue;
    apply();
  });
})();

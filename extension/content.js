// Content script: dibuja una capa fija sobre la página que desenfoca o atenúa todo
// menos un círculo alrededor del cursor. No modifica el texto ni el DOM del sitio.
//
// Efectos:
// - "blur": una sola capa con backdrop-filter y una máscara que sigue al cursor.
//   Se ve suave, pero el navegador re-desenfoca toda la pantalla cada vez que la máscara se mueve.
// - "tiles": la misma idea cortada en bloques. Al mover el cursor solo cambian los bloques
//   cercanos, así que el navegador redibuja una zona chica. Una "lente" del tamaño de esos
//   bloques recupera el borde circular, y un atenuado suave disimula las uniones entre bloques.
// - "dim": solo atenúa; no desenfoca.
(() => {
  if (window.__focoLecturaLoaded) return;
  window.__focoLecturaLoaded = true;

  const DEFAULTS = { on: false, effect: "blur", zone: 4, strength: 6 };
  const S = { ...DEFAULTS };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TILE = 160;

  let host = null;
  let wrap = null;
  let veil = null;
  let grid = null;
  let lens = null;
  let shade = null;
  let cells = [];
  let cols = 0;
  let rows = 0;
  let range = null; // bloques ocultos: { c0, c1, r0, r1 }
  let raf = 0;
  let px = innerWidth / 2;
  let py = innerHeight / 2;
  let cx = px;
  let cy = py;

  const STYLE = `
    #wrap, #veil, #grid, #shade { position: absolute; inset: 0; pointer-events: none; }
    #veil.blur, .tile, #lens { backdrop-filter: blur(var(--b, 8px)); -webkit-backdrop-filter: blur(var(--b, 8px)); }
    #veil.dim { background: var(--bg, #fff); opacity: var(--o, .7); }
    .tile, #lens { position: absolute; }
    #shade { background: var(--bg, #fff); opacity: var(--so, .4); }
    @media print { #wrap { display: none; } }
  `;

  // Color de fondo real de la página, para que el atenuado se funda con ella.
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
    wrap = document.createElement("div");
    wrap.id = "wrap";
    veil = document.createElement("div");
    veil.id = "veil";
    grid = document.createElement("div");
    grid.id = "grid";
    shade = document.createElement("div");
    shade.id = "shade";
    wrap.append(veil, grid, shade);
    root.append(style, wrap);
    document.documentElement.appendChild(host);
  }

  function buildGrid() {
    grid.textContent = "";
    cells = [];
    range = null;
    cols = Math.ceil(innerWidth / TILE);
    rows = Math.ceil(innerHeight / TILE);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const d = document.createElement("div");
        d.className = "tile";
        d.style.cssText = `left:${c * TILE}px;top:${r * TILE}px;width:${TILE}px;height:${TILE}px`;
        grid.appendChild(d);
        cells.push(d);
      }
    }
    lens = document.createElement("div");
    lens.id = "lens";
    grid.appendChild(lens);
  }

  function setRangeVisibility(rg, value) {
    if (!rg) return;
    for (let r = rg.r0; r <= rg.r1; r++) {
      for (let c = rg.c0; c <= rg.c1; c++) cells[r * cols + c].style.visibility = value;
    }
  }

  // Oculta los bloques que tocan el círculo y pone la lente justo encima de ellos.
  function updateTiles(radius, mask) {
    const clamp = (v, max) => Math.max(0, Math.min(max, v));
    const next = {
      c0: clamp(Math.floor((cx - radius) / TILE), cols - 1),
      c1: clamp(Math.floor((cx + radius) / TILE), cols - 1),
      r0: clamp(Math.floor((cy - radius) / TILE), rows - 1),
      r1: clamp(Math.floor((cy + radius) / TILE), rows - 1),
    };
    const same = range && next.c0 === range.c0 && next.c1 === range.c1 && next.r0 === range.r0 && next.r1 === range.r1;
    if (!same) {
      setRangeVisibility(range, "");
      setRangeVisibility(next, "hidden");
      range = next;
      lens.style.left = next.c0 * TILE + "px";
      lens.style.top = next.r0 * TILE + "px";
      lens.style.width = (next.c1 - next.c0 + 1) * TILE + "px";
      lens.style.height = (next.r1 - next.r0 + 1) * TILE + "px";
    }
    const lensMask = mask(cx - range.c0 * TILE, cy - range.r0 * TILE);
    lens.style.webkitMaskImage = lensMask;
    lens.style.maskImage = lensMask;
    const shadeMask = mask(cx, cy);
    shade.style.webkitMaskImage = shadeMask;
    shade.style.maskImage = shadeMask;
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
    const mask = (x, y) => `radial-gradient(circle at ${x}px ${y}px, transparent ${r}px, #000 ${r + f}px)`;
    if (S.effect === "tiles") {
      updateTiles(r + f, mask);
    } else {
      const m = mask(cx, cy);
      veil.style.webkitMaskImage = m;
      veil.style.maskImage = m;
    }
    if (moving) kick();
  }

  function kick() {
    if (!raf && wrap) raf = requestAnimationFrame(frame);
  }

  function onMove(e) {
    px = e.clientX;
    py = e.clientY;
    kick();
  }

  function onResize() {
    if (S.effect === "tiles") buildGrid();
    kick();
  }

  function apply() {
    if (!S.on) {
      removeEventListener("pointermove", onMove, true);
      removeEventListener("resize", onResize);
      if (host) host.style.setProperty("display", "none", "important");
      return;
    }
    if (!host) create();
    host.style.setProperty("display", "block", "important");

    const tiles = S.effect === "tiles";
    veil.hidden = tiles;
    grid.hidden = !tiles;
    shade.hidden = !tiles;
    if (tiles && cells.length === 0) buildGrid();
    if (!tiles && cells.length) { grid.textContent = ""; cells = []; range = null; }

    veil.className = tiles ? "" : S.effect;
    wrap.style.setProperty("--b", S.strength * 1.6 + "px");
    wrap.style.setProperty("--o", (0.15 + S.strength * 0.085).toFixed(2));
    wrap.style.setProperty("--so", (0.25 + S.strength * 0.03).toFixed(2));
    wrap.style.setProperty("--bg", pageBackground());
    addEventListener("pointermove", onMove, { capture: true, passive: true });
    addEventListener("resize", onResize);
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

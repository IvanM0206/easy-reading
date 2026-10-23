(function () {
var SAMPLE = [
  "En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor. Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lentejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda. El resto della concluían sayo de velarte, calzas de velludo para las fiestas con sus pantuflos de lo mesmo, y los días de entresemana se honraba con su vellori de lo más fino.",
  "Tenía en su casa una ama que pasaba de los cuarenta, y una sobrina que no llegaba a los veinte, y un mozo de campo y plaza, que así ensillaba el rocín como tomaba la podadera. Frisaba la edad de nuestro hidalgo con los cincuenta años; era de complexión recia, seco de carnes, enjuto de rostro, gran madrugador y amigo de la caza.",
  "Es, pues, de saber, que este sobredicho hidalgo, los ratos que estaba ocioso, que eran los más del año, se daba a leer libros de caballerías, con tanta afición y gusto, que olvidó casi de todo punto el ejercicio de la caza, y aun la administración de su hacienda. Y llegó a tanto su curiosidad y desatino en esto, que vendió muchas hanegas de tierra de sembradura para comprar libros de caballerías en que leer, y así llevó a su casa todos cuantos pudo haber dellos.",
  "En resolución, él se enfrascó tanto en su lectura, que se le pasaban las noches leyendo de claro en claro, y los días de turbio en turbio; y así, del poco dormir y del mucho leer, se le secó el celebro de manera que vino a perder el juicio."
].join("\n\n");

var $ = function (id) { return document.getElementById(id); };
var veil = $("veil"), reader = $("reader"), panelSpeed = $("speedField");
var coarse = window.matchMedia("(pointer: coarse)").matches;
var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

var S = { mode: coarse ? "line" : "cursor", effect: "blur", on: true, zone: 4, strength: 6, fs: 20, spd: 3, line: 0, playing: false, text: SAMPLE };
try {
  var saved = JSON.parse(localStorage.getItem("foco-lectura") || "{}");
  ["mode", "effect", "on", "zone", "strength", "fs", "spd"].forEach(function (k) { if (saved[k] !== undefined) S[k] = saved[k]; });
} catch (e) {}
function save() {
  try {
    localStorage.setItem("foco-lectura", JSON.stringify({ mode: S.mode, effect: S.effect, on: S.on, zone: S.zone, strength: S.strength, fs: S.fs, spd: S.spd }));
  } catch (e) {}
}

/* Posición del puntero (en coordenadas del viewport). Arranca a media altura para que el efecto se vea antes de mover el mouse. */
var px = window.innerWidth / 2, py = window.innerHeight * 0.45;
var cx = px, cy = py, raf = 0;
var lh = 35, lines = 1;

function renderText() {
  reader.textContent = "";
  S.text.split(/\n\s*\n/).forEach(function (chunk) {
    var t = chunk.replace(/\s+/g, " ").trim();
    if (!t) return;
    var p = document.createElement("p");
    p.textContent = t;
    reader.appendChild(p);
  });
  measure();
}

function measure() {
  var cs = getComputedStyle(reader);
  lh = parseFloat(cs.lineHeight) || S.fs * 1.75;
  lines = Math.max(1, Math.round(reader.offsetHeight / lh));
  if (S.line > lines - 1) S.line = lines - 1;
  kick();
}

function lineY() { return reader.getBoundingClientRect().top + (S.line + 0.5) * lh; }

function frame() {
  raf = 0;
  var tx, ty;
  if (S.mode === "cursor") { tx = px; ty = py; }
  else { tx = window.innerWidth / 2; ty = lineY(); }
  var k = reduce ? 1 : 0.28;
  cx += (tx - cx) * k; cy += (ty - cy) * k;
  var moving = Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4;
  if (!moving) { cx = tx; cy = ty; }

  var mask;
  if (S.mode === "cursor") {
    var r = 50 + S.zone * 20, f = r * 0.7;
    mask = "radial-gradient(circle at " + cx + "px " + cy + "px, transparent " + r + "px, #000 " + (r + f) + "px)";
  } else {
    var h = lh * (0.6 + S.zone * 0.15), g = lh * 1.6;
    mask = "linear-gradient(to bottom, #000 " + (cy - h - g) + "px, transparent " + (cy - h) + "px, transparent " + (cy + h) + "px, #000 " + (cy + h + g) + "px)";
  }
  veil.style.webkitMaskImage = mask;
  veil.style.maskImage = mask;
  if (moving) kick();
}
function kick() { if (!raf) raf = requestAnimationFrame(frame); }

function applyEffect() {
  veil.className = S.effect;
  veil.style.setProperty("--b", (S.strength * 1.6) + "px");
  veil.style.setProperty("--o", (0.15 + S.strength * 0.085).toFixed(2));
  veil.hidden = !S.on;
}

function applyUI() {
  document.querySelectorAll("[data-mode]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.mode === S.mode)); });
  document.querySelectorAll("[data-effect]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.effect === S.effect)); });
  $("onoff").setAttribute("aria-checked", String(S.on));
  panelSpeed.hidden = S.mode !== "line";
  $("zone").value = S.zone; $("zoneO").textContent = S.zone;
  $("strength").value = S.strength; $("strengthO").textContent = S.strength;
  $("fs").value = S.fs; $("fsO").textContent = S.fs + " px";
  $("spd").value = S.spd; $("spdO").textContent = S.spd + " s";
  document.documentElement.style.setProperty("--fs", S.fs + "px");
  $("hint").innerHTML = S.mode === "cursor"
    ? "Mové el cursor sobre el texto. La zona nítida te sigue y el resto queda " + (S.effect === "blur" ? "desenfocado" : "atenuado") + ". Si leés sin mover el mouse, probá el modo Línea."
    : "Usá <kbd>↑</kbd> <kbd>↓</kbd> para cambiar de línea, tocá una línea para saltar a ella o <kbd>Espacio</kbd> para avanzar solo.";
  applyEffect();
  measure();
}

/* Eventos */
window.addEventListener("pointermove", function (e) { px = e.clientX; py = e.clientY; if (S.mode === "cursor") kick(); }, { passive: true });
window.addEventListener("scroll", kick, { passive: true });
window.addEventListener("resize", measure);

reader.addEventListener("click", function (e) {
  if (S.mode !== "line") return;
  var top = reader.getBoundingClientRect().top;
  setLine(Math.floor((e.clientY - top) / lh), false);
});

document.querySelectorAll("[data-mode]").forEach(function (b) {
  b.addEventListener("click", function () { S.mode = b.dataset.mode; stop(); save(); applyUI(); });
});
document.querySelectorAll("[data-effect]").forEach(function (b) {
  b.addEventListener("click", function () { S.effect = b.dataset.effect; save(); applyUI(); });
});
$("onoff").addEventListener("click", function () { S.on = !S.on; save(); applyUI(); });
[["zone", "zone"], ["strength", "strength"], ["fs", "fs"], ["spd", "spd"]].forEach(function (p) {
  $(p[0]).addEventListener("input", function (e) { S[p[1]] = parseFloat(e.target.value); save(); applyUI(); });
});

/* Modo línea: avance manual y automático */
var timer = 0;
function setLine(n, scroll) {
  S.line = Math.max(0, Math.min(lines - 1, n));
  if (scroll !== false) {
    var y = lineY();
    if (y > window.innerHeight * 0.68 || y < $("onoff").getBoundingClientRect().bottom + 60) {
      window.scrollBy({ top: y - window.innerHeight * 0.4, behavior: reduce ? "auto" : "smooth" });
    }
  }
  kick();
}
function stop() {
  S.playing = false; clearInterval(timer); timer = 0;
  $("play").setAttribute("aria-pressed", "false"); $("play").textContent = "Avanzar solo";
}
function start() {
  S.playing = true;
  $("play").setAttribute("aria-pressed", "true"); $("play").textContent = "Pausar";
  clearInterval(timer);
  timer = setInterval(function () {
    if (S.line >= lines - 1) { stop(); return; }
    setLine(S.line + 1);
  }, S.spd * 1000);
}
$("play").addEventListener("click", function () { S.playing ? stop() : start(); });
$("spd").addEventListener("change", function () { if (S.playing) start(); });

document.addEventListener("keydown", function (e) {
  var tag = (e.target.tagName || "").toLowerCase();
  if (tag === "textarea" || tag === "input") return;
  if (e.key === "f" || e.key === "F") { S.on = !S.on; save(); applyUI(); return; }
  if (S.mode !== "line") return;
  if (e.key === "ArrowDown") { e.preventDefault(); setLine(S.line + 1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); setLine(S.line - 1); }
  else if (e.key === " " && tag !== "button") { e.preventDefault(); S.playing ? stop() : start(); }
});

/* Texto propio */
$("useText").addEventListener("click", function () {
  var v = $("mytext").value.trim();
  if (!v) return;
  S.text = v; S.line = 0; stop(); renderText(); window.scrollTo({ top: 0 });
});
$("resetText").addEventListener("click", function () {
  S.text = SAMPLE; S.line = 0; stop(); $("mytext").value = ""; renderText();
});

renderText();
applyUI();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
})();

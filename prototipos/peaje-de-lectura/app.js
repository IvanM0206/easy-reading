(function () {
var SAMPLE = [
  "En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor. Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lentejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda. El resto della concluían sayo de velarte, calzas de velludo para las fiestas con sus pantuflos de lo mesmo, y los días de entresemana se honraba con su vellori de lo más fino.",
  "Tenía en su casa una ama que pasaba de los cuarenta, y una sobrina que no llegaba a los veinte, y un mozo de campo y plaza, que así ensillaba el rocín como tomaba la podadera. Frisaba la edad de nuestro hidalgo con los cincuenta años; era de complexión recia, seco de carnes, enjuto de rostro, gran madrugador y amigo de la caza.",
  "Es, pues, de saber, que este sobredicho hidalgo, los ratos que estaba ocioso, que eran los más del año, se daba a leer libros de caballerías, con tanta afición y gusto, que olvidó casi de todo punto el ejercicio de la caza, y aun la administración de su hacienda. Y llegó a tanto su curiosidad y desatino en esto, que vendió muchas hanegas de tierra de sembradura para comprar libros de caballerías en que leer, y así llevó a su casa todos cuantos pudo haber dellos.",
  "Con estas razones perdía el pobre caballero el juicio, y desvelábase por entenderlas y desentrañarles el sentido, que no se lo sacara ni las entendiera el mismo Aristóteles, si resucitara para sólo ello.",
  "En resolución, él se enfrascó tanto en su lectura, que se le pasaban las noches leyendo de claro en claro, y los días de turbio en turbio; y así, del poco dormir y del mucho leer, se le secó el celebro de manera que vino a perder el juicio."
];
var $ = function (id) { return document.getElementById(id); };

var S = { interval: 45, goal: 5, speed: 3, waitPause: true, allowSkip: true };
try {
  var saved = JSON.parse(localStorage.getItem("peaje-lectura") || "{}");
  Object.keys(S).forEach(function (k) { if (saved[k] !== undefined) S[k] = saved[k]; });
} catch (e) {}
function save() { try { localStorage.setItem("peaje-lectura", JSON.stringify(S)); } catch (e) {} }

SAMPLE.forEach(function (t) { var p = document.createElement("p"); p.textContent = t; $("reader").appendChild(p); });

/* Tiempo activo de lectura: solo cuenta con la pestaña visible y actividad en los últimos 10 s */
var active = 0, total = 0, paid = 0, skipped = 0;
var lastActivity = Date.now(), lastScroll = 0, lastTick = Date.now(), pendingSince = 0, tollOpen = false;
["pointermove", "keydown", "wheel", "touchstart", "scroll"].forEach(function (ev) {
  window.addEventListener(ev, function () { lastActivity = Date.now(); if (ev === "scroll") lastScroll = lastActivity; }, { passive: true });
});

function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

function tick() {
  var now = Date.now(), dt = (now - lastTick) / 1000; lastTick = now;
  if (!tollOpen && document.visibilityState === "visible" && now - lastActivity < 10000) {
    active += dt; total += dt;
  }
  if (!tollOpen && active >= S.interval) {
    if (!pendingSince) pendingSince = now;
    var quiet = now - lastScroll > 1200, tooLong = now - pendingSince > 20000;
    if (!S.waitPause || quiet || tooLong) openToll();
  }
  renderClock();
}
function renderClock() {
  var left = Math.max(0, S.interval - active);
  $("left").textContent = fmt(left);
  $("fill").style.width = Math.min(100, active / S.interval * 100) + "%";
  $("stats").textContent = "En esta sesión: " + fmt(total) + " de lectura activa, " + paid + " peajes pagados, " + skipped + " salteados.";
}
setInterval(tick, 250);

/* Snake */
var N = 16, cv = $("cv"), ctx = cv.getContext("2d");
var snake, dir, queue, apple, eaten, loop = 0, state = "ready";
var SPEEDS = [0, 260, 200, 150, 115, 85];

function cssv(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function fit() {
  var dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 320;
  cv.width = Math.round(w * dpr); cv.height = Math.round(w * dpr);
}
function resetSnake() {
  snake = [{ x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }];
  dir = { x: 1, y: 0 }; queue = []; state = "ready"; placeApple(); draw();
  $("tollMsg").textContent = "Comé " + (S.goal - eaten) + (S.goal - eaten === 1 ? " manzana" : " manzanas") + " para seguir leyendo. Tocá una flecha para empezar.";
}
function placeApple() {
  var free = [];
  for (var x = 0; x < N; x++) for (var y = 0; y < N; y++) {
    if (!snake.some(function (s) { return s.x === x && s.y === y; })) free.push({ x: x, y: y });
  }
  apple = free[Math.floor(Math.random() * free.length)];
}
function drawDots() {
  var d = $("dots"); d.textContent = "";
  for (var i = 0; i < S.goal; i++) { var e = document.createElement("i"); if (i < eaten) e.className = "on"; d.appendChild(e); }
}
function draw() {
  var c = cv.width / N;
  ctx.fillStyle = cssv("--ctl"); ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = cssv("--line");
  for (var i = 1; i < N; i++) { ctx.fillRect(i * c, 0, 1, cv.height); ctx.fillRect(0, i * c, cv.width, 1); }
  ctx.fillStyle = cssv("--apple");
  ctx.beginPath(); ctx.arc((apple.x + .5) * c, (apple.y + .5) * c, c * .36, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = cssv("--accent");
  snake.forEach(function (s, i) {
    var pad = i === 0 ? c * .06 : c * .12;
    ctx.fillRect(s.x * c + pad, s.y * c + pad, c - pad * 2, c - pad * 2);
  });
}
function turn(dx, dy) {
  if (state === "won" || state === "crashed") return;
  var last = queue.length ? queue[queue.length - 1] : dir;
  if ((dx === -last.x && dy === -last.y) || (dx === last.x && dy === last.y)) return;
  if (queue.length < 2) queue.push({ x: dx, y: dy });
  if (state === "ready") { state = "run"; $("tollMsg").textContent = "Comé " + (S.goal - eaten) + (S.goal - eaten === 1 ? " manzana" : " manzanas") + " para seguir leyendo."; loop = setInterval(step, SPEEDS[S.speed]); }
}
function step() {
  if (queue.length) dir = queue.shift();
  var h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  var hitWall = h.x < 0 || h.y < 0 || h.x >= N || h.y >= N;
  var hitSelf = snake.some(function (s, i) { return i < snake.length - 1 && s.x === h.x && s.y === h.y; });
  if (hitWall || hitSelf) {
    clearInterval(loop); loop = 0; state = "crashed";
    $("tollMsg").textContent = "Chocaste. Tus manzanas se conservan, volvé a intentar.";
    setTimeout(function () { if (tollOpen) resetSnake(); }, 900);
    return;
  }
  snake.unshift(h);
  if (h.x === apple.x && h.y === apple.y) {
    eaten++; drawDots();
    if (eaten >= S.goal) { win(); return; }
    placeApple();
  } else { snake.pop(); }
  draw();
}

/* Peaje */
function openToll() {
  tollOpen = true; pendingSince = 0; eaten = 0;
  $("skip").hidden = !S.allowSkip;
  $("toll").hidden = false;
  document.body.style.overflow = "hidden";
  fit(); drawDots(); resetSnake();
  $("card").focus({ preventScroll: true });
}
function closeToll() {
  clearInterval(loop); loop = 0; tollOpen = false; state = "ready";
  $("toll").hidden = true; document.body.style.overflow = "";
  active = 0; lastActivity = Date.now(); lastTick = Date.now(); renderClock();
}
function win() {
  clearInterval(loop); loop = 0; state = "won"; paid++;
  $("tollMsg").textContent = "Peaje pagado. Seguí leyendo.";
  draw();
  setTimeout(function () { if (tollOpen) closeToll(); }, 700);
}
$("skip").addEventListener("click", function () { skipped++; closeToll(); });
$("testNow").addEventListener("click", function () { if (!tollOpen) openToll(); });

document.addEventListener("keydown", function (e) {
  if (!tollOpen) return;
  var m = { ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0] }[e.key];
  if (m) { e.preventDefault(); turn(m[0], m[1]); }
});
document.querySelectorAll(".dpad button").forEach(function (b) {
  b.addEventListener("click", function () {
    var v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[b.dataset.d]; turn(v[0], v[1]);
  });
});
var t0 = null;
cv.addEventListener("touchstart", function (e) { t0 = e.touches[0]; }, { passive: true });
cv.addEventListener("touchend", function (e) {
  if (!t0) return;
  var t = e.changedTouches[0], dx = t.clientX - t0.clientX, dy = t.clientY - t0.clientY; t0 = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0); else turn(0, dy > 0 ? 1 : -1);
}, { passive: true });
window.addEventListener("resize", function () { if (tollOpen) { fit(); draw(); } });

/* Ajustes */
function applyUI() {
  $("interval").value = S.interval; $("intervalO").textContent = fmt(S.interval);
  $("goal").value = S.goal; $("goalO").textContent = S.goal;
  $("speed").value = S.speed; $("speedO").textContent = S.speed + " de 5";
  $("waitPause").checked = S.waitPause; $("allowSkip").checked = S.allowSkip;
  renderClock();
}
[["interval", "interval"], ["goal", "goal"], ["speed", "speed"]].forEach(function (p) {
  $(p[0]).addEventListener("input", function (e) { S[p[1]] = parseInt(e.target.value, 10); save(); applyUI(); });
});
["waitPause", "allowSkip"].forEach(function (k) {
  $(k).addEventListener("change", function (e) { S[k] = e.target.checked; save(); });
});
applyUI();
})();

/* ==========================================================================
   Intro — the curtain before the film
   --------------------------------------------------------------------------
   First visit of a session only (the <head> decides, before first paint, by
   setting html.is-loading). The wordmark and a line that follows the film's
   REAL loading — manifests, the first atlas, its upload to the GPU — then
   the curtain lifts and the opening headline starts (film.js waits for it).
   Never a trap: it lifts after 5 s whatever happened.
   ========================================================================== */
(function () {
  "use strict";
  var html = document.documentElement;
  var root = document.querySelector(".intro");
  var api = { progress: function () {}, done: function () {} };
  window.NRIntro = api;
  if (!root || !html.classList.contains("is-loading")) return;

  var bar = root.querySelector(".intro__bar span");
  var pct = root.querySelector(".intro__pct");
  var t0 = performance.now(), shown = 0, target = 0.06, finished = false, lifted = false;
  var MIN = 1300, MAX = 5000;

  function tick() {
    if (lifted) return;
    shown += (target - shown) * 0.12;
    if (target >= 1 && shown > 0.995) shown = 1;
    bar.style.transform = "scaleX(" + shown.toFixed(4) + ")";
    pct.textContent = String(Math.round(shown * 100)).padStart(2, "0");
    if (finished && shown === 1 && performance.now() - t0 >= MIN) return lift();
    requestAnimationFrame(tick);
  }

  function lift() {
    if (lifted) return;
    lifted = true;
    try { sessionStorage.setItem("nr-intro", "1"); } catch (e) { /* private window */ }
    html.classList.add("is-lifting");
    setTimeout(function () {
      html.classList.remove("is-loading", "is-lifting");
      root.remove();
      window.dispatchEvent(new Event("intro:done"));
    }, 1000);
    /* the film's headline may start as the curtain moves, not after it */
    setTimeout(function () { window.dispatchEvent(new Event("intro:lift")); }, 250);
  }

  api.progress = function (p) { target = Math.max(target, Math.min(1, p)); };
  api.done = function () { finished = true; target = 1; };
  setTimeout(function () { api.done(); }, MAX - 900);
  setTimeout(lift, MAX);
  requestAnimationFrame(tick);
})();

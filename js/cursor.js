/* ==========================================================================
   Cursor — a fine pointer only
   --------------------------------------------------------------------------
   A dot that IS the pointer (moved in the event itself: no lag), and a ring
   that follows it a breath later. The ring opens over anything clickable,
   says "Drag" over the cup while it can be turned, and "Scroll" over the
   opening of the film until the reader has started. Touch screens, coarse
   pointers and reduced motion keep the system cursor.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var html = document.documentElement;
  var el = document.createElement("div");
  el.className = "cursor";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = '<span class="cursor__ring"><span class="cursor__label"></span></span><span class="cursor__dot"></span>';
  document.body.appendChild(el);
  var ring = el.firstChild, dot = el.lastChild, label = ring.firstChild;
  var stage = document.querySelector(".stage");
  var film = document.querySelector("[data-film]");
  var T = function (s) { return window.NR ? window.NR.t(s) : s; };

  var x = -100, y = -100, rx = -100, ry = -100, running = false, shown = false, scrolled = false;
  var HOT = "a, button, [role='button'], [data-opt], label, summary";

  function loop() {
    rx += (x - rx) * 0.28; ry += (y - ry) * 0.28;
    ring.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)";
    if (Math.abs(x - rx) + Math.abs(y - ry) > 0.2) requestAnimationFrame(loop);
    else running = false;
  }

  function state(target) {
    var hot = target && target.closest && target.closest(HOT);
    var mode = "";
    if (hot) mode = "hot";
    else if (stage && stage.classList.contains("is-interactive") && target && !target.closest(".panelbox, .site-header")) mode = "drag";
    else if (!scrolled && film && target && film.contains(target) && window.scrollY < innerHeight * 0.5) mode = "scroll";
    /* the espresso footer: an ink cursor vanished on it (measured) */
    el.classList.toggle("is-inverse", !!(target && target.closest && target.closest(".site-footer")));
    if (el.dataset.mode !== mode) {
      el.dataset.mode = mode;
      label.textContent = mode === "drag" ? T("Drag") : mode === "scroll" ? T("Scroll") : "";
    }
  }

  document.addEventListener("mousemove", function (e) {
    x = e.clientX; y = e.clientY;
    dot.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    if (!shown) { shown = true; rx = x; ry = y; html.classList.add("has-cursor"); el.classList.add("is-on"); }
    state(e.target);
    if (!running) { running = true; requestAnimationFrame(loop); }
  }, { passive: true });
  document.addEventListener("mouseleave", function () { el.classList.remove("is-on"); shown = false; });
  document.addEventListener("mousedown", function () { el.classList.add("is-down"); });
  document.addEventListener("mouseup", function () { el.classList.remove("is-down"); });
  window.addEventListener("scroll", function () { if (window.scrollY > innerHeight * 0.5) scrolled = true; }, { passive: true });
})();

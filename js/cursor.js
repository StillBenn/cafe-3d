/* ==========================================================================
   Cursor — a fine pointer only
   --------------------------------------------------------------------------
   A dot that IS the pointer (moved in the event itself: no lag), and a ring
   that follows it a breath later. The ring opens over anything clickable and
   says "Drag" over the cup while it can be turned. (A "Scroll" ring over the
   film was taken out on 11.10 — it sat on the picture like a sticker.) Touch
   screens, coarse pointers and reduced motion keep the system cursor.
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
  var T = function (s) { return window.NR ? window.NR.t(s) : s; };

  var x = -100, y = -100, rx = -100, ry = -100, running = false, shown = false;
  var HOT = "a, button, [role='button'], [data-opt], label, summary";

  function loop() {
    rx += (x - rx) * 0.28; ry += (y - ry) * 0.28;
    ring.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)";
    if (Math.abs(x - rx) + Math.abs(y - ry) > 0.2) requestAnimationFrame(loop);
    else running = false;
  }

  function state(target) {
    var hot = target && target.closest && target.closest(HOT);
    if (hot && hot.disabled) hot = null;            /* a disabled chip is not an invitation */
    var mode = "";
    if (hot) mode = "hot";
    else if (stage && stage.classList.contains("is-interactive") && target && !target.closest(".panelbox, .site-header")
      && !document.documentElement.matches(".is-fal, .is-ticket, .is-bill")) mode = "drag";   /* the cup under a sheet is not in reach */
    /* the espresso footer: an ink cursor vanished on it (measured) */
    el.classList.toggle("is-inverse", !!(target && target.closest && target.closest(".site-footer")));
    if (el.dataset.mode !== mode) {
      el.dataset.mode = mode;
      label.textContent = mode === "drag" ? T("Drag") : "";
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
})();

/* ==========================================================================
   Damped scrolling
   --------------------------------------------------------------------------
   A mouse wheel does not produce motion, it produces STEPS: one notch is a
   fixed jump, and on a page whose whole subject is a fixed 3D object those
   steps read as the page stuttering. This eases the real scroll position
   towards a target instead, so a notch becomes a short glide and a run of
   notches becomes one continuous movement.

   The scroll POSITION is what gets eased, not a fake transform. Everything
   that reads window.scrollY — the cards, the rail, the header, the 3D scene
   — therefore follows the same eased value with no changes of its own, and
   there is only ever one source of truth for "where are we".

   Deliberately limited:
   · Fine pointers only. Touch scrolling is already inertial and smooth, and
     hijacking it is how sites end up feeling broken on a phone.
   · Off entirely under prefers-reduced-motion.
   · Never preventDefault a zoom gesture (ctrl + wheel).
   · Anything that scrolls the page without us — a scrollbar drag, find-in-
     page, a screen reader — is detected and adopted rather than fought.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  if (reduced || !fine) return;

  var root = document.documentElement;
  /* The CSS smooth-scroll would be a second animator racing this one. */
  root.style.scrollBehavior = "auto";

  var RATE = 9;          /* higher = tighter follow; 9 glides without lag */
  var SETTLE = 0.35;     /* px: below this we snap and stop the loop */

  var target = window.scrollY;
  var current = target;
  var written = Math.round(current);   /* the last position WE put there */
  var max = 0;
  var running = false;
  var last = 0;

  function measure() {
    max = Math.max(0, root.scrollHeight - window.innerHeight);
    if (target > max) target = max;
  }

  function clamp(v) { return v < 0 ? 0 : v > max ? max : v; }

  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    /* Frame-rate independent easing: the same glide at 60Hz and 144Hz, and
       no lurch when a frame is dropped. */
    current += (target - current) * (1 - Math.exp(-RATE * dt));

    if (Math.abs(target - current) < SETTLE) {
      current = target;
      running = false;
    }
    written = Math.round(current);
    window.scrollTo(0, current);
    if (running) requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  window.addEventListener("wheel", function (e) {
    if (e.ctrlKey) return;                       /* pinch zoom is not a scroll */
    e.preventDefault();
    /* deltaMode 1 is lines, 2 is pages — normalise both to pixels. */
    var d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
    measure();
    target = clamp(target + d);
    start();
  }, { passive: false });

  /* Keys are handled here too, or the page would glide under the wheel and
     snap under the space bar. */
  var KEYS = {
    PageDown: function () { return window.innerHeight * 0.9; },
    PageUp: function () { return -window.innerHeight * 0.9; },
    ArrowDown: function () { return 110; },
    ArrowUp: function () { return -110; },
    Home: function () { return -Infinity; },
    End: function () { return Infinity; },
    " ": function (e) { return window.innerHeight * (e.shiftKey ? -0.9 : 0.9); }
  };
  window.addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var step = KEYS[e.key];
    if (!step) return;
    e.preventDefault();
    measure();
    var d = step(e);
    target = clamp(d === Infinity ? max : d === -Infinity ? 0 : target + d);
    start();
  });

  /* In-page links glide instead of teleporting. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    measure();
    target = clamp(el.getBoundingClientRect().top + window.scrollY);
    start();
    if (history.replaceState) history.replaceState(null, "", "#" + id);
  });

  /* Someone else moved the page: a scrollbar drag, find-in-page, a restored
     position. Adopt it rather than yanking them back.

     Compared against the last position WE wrote, not against `current`.
     Scroll events are delivered asynchronously, so mid-glide `current` has
     already moved on by the time the handler runs — comparing to it made a
     fast glide look like an outside interruption and cut itself short.
     Measured: a 500px wheel notch stopped dead at 370. */
  window.addEventListener("scroll", function () {
    if (Math.abs(window.scrollY - written) > 2) {
      current = target = written = window.scrollY;
    }
  }, { passive: true });

  window.addEventListener("resize", measure);
  if ("ResizeObserver" in window) new ResizeObserver(measure).observe(document.body);
  measure();
})();

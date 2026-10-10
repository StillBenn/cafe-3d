/* ==========================================================================
   Page behaviour — scroll reveal and header state.
   Progressive enhancement only: without JS every section is fully readable,
   so reveal targets are only hidden once we know we can bring them back.
   ========================================================================== */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var targets = document.querySelectorAll(".reveal");

  if (!reduced && "IntersectionObserver" in window && targets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target;
        t.classList.add("is-in");
        /* the arrival uses long staggered transitions; once it has played,
           the options get their own quick hover timing back */
        setTimeout(function () { t.classList.add("is-settled"); }, 1700);
        io.unobserve(t);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* Phone option tabs in 02: one group at a time, arrow keys move between
     tabs (the WAI-ARIA tabs pattern). On wide screens CSS hides the bar and
     shows every group, so the classes set here simply go unused. */
  var tabs = [].slice.call(document.querySelectorAll(".opttab"));
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      var group = document.getElementById(t.getAttribute("aria-controls"));
      if (group) group.classList.toggle("is-on", on);
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t); });
    t.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      selectTab(tabs[(i + d + tabs.length) % tabs.length], true);
    });
  });

  /* Visit: open or closed right now, in the café's own time zone */
  var openEl = document.querySelector("[data-open]");
  if (openEl && window.Intl) {
    var HOURS = { weekday: [7, 20], weekend: [8, 21] };
    var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Istanbul", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    var openText = function () {
      var parts = {}; fmt.formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
      var day = parts.weekday, h = +parts.hour + +parts.minute / 60;
      var we = day === "Sat" || day === "Sun", span = we ? HOURS.weekend : HOURS.weekday;
      var tr = function (s) { return window.NR ? window.NR.t(s) : s; };
      var hh = function (n) { return (n < 10 ? "0" : "") + n + ":00"; };
      var isOpen = h >= span[0] && h < span[1];
      var next;
      if (isOpen) next = hh(span[1]);
      else if (h < span[0]) next = hh(span[0]);
      else next = hh((day === "Fri" || day === "Sat") ? HOURS.weekend[0] : HOURS.weekday[0]);   /* tomorrow */
      openEl.classList.toggle("is-open", isOpen);
      openEl.querySelector("[data-open-text]").textContent = tr(isOpen ? "Open now — closes %s" : "Closed — opens %s").replace("%s", next);
      openEl.hidden = false;
    };
    openText();
    setInterval(openText, 60000);
    if (window.NR) window.NR.onChange.push(openText);
  }

  var steps = document.querySelectorAll("[data-rail]");
  var sections = [];
  steps.forEach(function (el) {
    var target = document.getElementById(el.dataset.rail);
    if (target) sections.push({ el: el, target: target, top: 0, bottom: 0 });
  });

  var header = document.querySelector(".site-header");

  /* Section positions are cached, not read per scroll event. Reading
     offsetTop inside a scroll handler forces the browser to recompute layout
     before it can answer — on every single event, behind a fixed WebGL canvas.
     That is a scroll-jank generator, and it is invisible until you look for
     it. They only change when the page is re-laid-out, so that is when they
     are measured. */
  function measureSections() {
    for (var i = 0; i < sections.length; i++) {
      var t = sections[i].target;
      sections[i].top = t.offsetTop;
      sections[i].bottom = t.offsetTop + t.offsetHeight;
    }
  }

  var ticking = false;

  function apply() {
    ticking = false;
    var y = window.scrollY;

    if (header) header.classList.toggle("is-stuck", y > 40);

    if (!sections.length) return;
    /* Whichever section owns the middle of the screen. A plain "is it
       visible" test lights two marks at once on a page of full-height
       sections, which always overlap at the seam. */
    var mid = y + window.innerHeight / 2;
    var best = null;
    for (var i = 0; i < sections.length; i++) {
      if (mid >= sections[i].top && mid < sections[i].bottom) best = sections[i].el;
    }
    for (var j = 0; j < sections.length; j++) {
      sections[j].el.classList.toggle("is-here", sections[j].el === best);
    }
    document.documentElement.classList.toggle("is-past-rail", !best && mid >= sections[sections.length - 1].bottom);
  }

  /* One rAF-batched update for both jobs: the handler itself does nothing but
     set a flag, so a burst of scroll events costs one pass, not twenty. */
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(apply);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { measureSections(); apply(); });
  if ("ResizeObserver" in window) {
    new ResizeObserver(function () { measureSections(); apply(); }).observe(document.body);
  }

  measureSections();
  apply();

  /* --- Cards in motion (styles: "Cards in motion" in site.css) -------------- */

  /* Arrival order: each card's contents get an index in reading order. */
  document.querySelectorAll(".panelbox.reveal, .panel__card.reveal").forEach(function (card) {
    var parts = card.classList.contains("panel__card")
      ? Array.prototype.slice.call(card.children)
      : Array.prototype.slice.call(card.querySelectorAll(".panelbox__head > *, .drink, .opt, .total, .panelbox__foot"));
    parts.forEach(function (el, i) { el.style.setProperty("--i", i); });
  });

  /* A changed value rolls in instead of blinking: the order summary, the
     chosen names, the price. (The scene and the language switch both write
     these; watching the nodes catches every writer.) */
  if ("MutationObserver" in window && !reduced) {
    var swap = new MutationObserver(function (list) {
      list.forEach(function (m) {
        var el = m.target.nodeType === 3 ? m.target.parentElement : m.target;
        if (!el || !el.closest) return;
        el = el.closest("[data-value], [data-price]");
        if (!el) return;
        el.classList.remove("is-swapped");
        void el.offsetWidth;                 /* restart the animation */
        el.classList.add("is-swapped");
      });
    });
    document.querySelectorAll("[data-value], [data-price]").forEach(function (el) {
      swap.observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  /* The hand: a light that follows the pointer across an option, a tilt of
     at most two degrees, and the primary buttons leaning a few pixels towards
     the cursor. Mouse only, and never with reduced motion. */
  if (reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  document.querySelectorAll(".drink:not(.drink--static)").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      card.style.setProperty("--ry", ((x - 0.5) * 3.2).toFixed(2) + "deg");
      card.style.setProperty("--rx", ((0.5 - y) * 3.2).toFixed(2) + "deg");
    });
    card.addEventListener("pointerleave", function () {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });

  document.querySelectorAll(".btn--primary").forEach(function (btn) {
    btn.addEventListener("pointermove", function (e) {
      var r = btn.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) * 0.16;
      var dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
      dx = Math.max(-6, Math.min(6, dx)); dy = Math.max(-4, Math.min(4, dy));
      btn.style.transform = "translate3d(" + dx.toFixed(1) + "px," + (dy - 2).toFixed(1) + "px,0)";
    });
    btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
  });
})();

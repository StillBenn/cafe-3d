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
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add("is-in"); });
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
})();

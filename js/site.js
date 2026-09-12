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

  /* The rail follows whichever section owns the middle of the screen. A
     plain "is it visible" test lights two marks at once on a page where
     sections are a full screen tall and always overlap at the seam. */
  var steps = document.querySelectorAll("[data-rail]");
  if (steps.length) {
    var sections = [];
    steps.forEach(function (el) {
      var target = document.getElementById(el.dataset.rail);
      if (target) sections.push({ el: el, target: target });
    });
    var syncRail = function () {
      var mid = window.scrollY + window.innerHeight / 2;
      var best = null;
      sections.forEach(function (s) {
        var top = s.target.offsetTop;
        var bottom = top + s.target.offsetHeight;
        if (mid >= top && mid < bottom) best = s.el;
      });
      sections.forEach(function (s) { s.el.classList.toggle("is-here", s.el === best); });
    };
    window.addEventListener("scroll", syncRail, { passive: true });
    window.addEventListener("resize", syncRail);
    syncRail();
  }

  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();

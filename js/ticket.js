/* ==========================================================================
   03 — Pick it up: the order, printed
   --------------------------------------------------------------------------
   The hero promises three steps: choose the coffee, design the cup, pick it
   up. "Place order" in 02 opens this ticket — it feeds out of an imaginary
   counter printer, carries a picture of the cup exactly as it was designed
   (cropped from the live canvas by js/scene.js), and walks through the
   brew the film showed: grinding, brewing, pouring, ready.
   It is a demo and says so: nothing is charged.
   ========================================================================== */
(function () {
  "use strict";
  var root = document.getElementById("ticket");
  var openers = document.querySelectorAll("[data-order]");
  if (!root || !openers.length) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var html = document.documentElement;
  var paper = root.querySelector(".ticket__paper");
  var steps = [].slice.call(root.querySelectorAll("[data-step]"));
  var timers = [];
  var lastFocus = null;
  var current = null;               /* the order on the ticket, kept for a language switch */

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function money(v) { return "$" + v.toFixed(2); }

  function barcode(seed) {
    /* decorative bars from the order number: a printed receipt, not a code */
    var svg = '<svg viewBox="0 0 240 40" preserveAspectRatio="none" aria-hidden="true">';
    var x = 0, r = seed;
    while (x < 240) {
      r = (r * 9301 + 49297) % 233280;
      var w = 1 + (r % 4);
      if ((r >> 3) % 3) svg += '<rect x="' + x + '" y="0" width="' + w + '" height="40"/>';
      x += w + 1 + ((r >> 5) % 2);
    }
    return svg + "</svg>";
  }

  function fill() {
    if (!current) return;
    var o = window.NR && window.NR.cup ? window.NR.cup.order() : null;
    if (!o) return;
    var list = root.querySelector("[data-ticket-lines]");
    list.innerHTML = "";
    o.lines.forEach(function (l, i) {
      var li = document.createElement("li");
      li.style.setProperty("--i", i);
      li.innerHTML = '<span class="ticket__k"></span><span class="ticket__v"></span><span class="ticket__p"></span>';
      li.children[0].textContent = l[0];
      li.children[1].textContent = l[1];
      li.children[2].textContent = l[2] ? "+" + l[2].toFixed(2) : "";
      if (i === 0) li.children[2].textContent = money(l[2]);
      list.appendChild(li);
    });
    /* set like the 02 card beside it: a small sans "$", the figure in the serif */
    var tot = root.querySelector("[data-ticket-total]");
    tot.innerHTML = '<span class="total__cur">$</span>';
    tot.appendChild(document.createTextNode(o.total.toFixed(2)));
    root.querySelector("[data-ticket-no]").textContent = current.no;
    root.querySelector("[data-ticket-time]").textContent = current.time;
  }

  function progress() {
    steps.forEach(function (s) { s.classList.remove("is-done", "is-now"); });
    timers.forEach(clearTimeout); timers = [];
    if (reduced) { steps.forEach(function (s) { s.classList.add("is-done"); }); return; }
    steps.forEach(function (s, i) {
      timers.push(setTimeout(function () {
        if (i) steps[i - 1].classList.replace("is-now", "is-done");
        s.classList.add(i === steps.length - 1 ? "is-done" : "is-now");
      }, 1100 + i * 1500));
    });
  }

  function open(e) {
    lastFocus = e && e.currentTarget;
    var now = new Date(Date.now() + 4 * 60 * 1000);       /* ready in four minutes */
    var n = 1000 + Math.floor(Math.random() * 9000);
    current = { no: "NR-" + n, time: pad(now.getHours()) + ":" + pad(now.getMinutes()) };
    fill();
    var img = root.querySelector("[data-ticket-img]");
    var shot = window.NR && window.NR.cup ? window.NR.cup.snapshot() : null;
    if (shot) { img.src = shot; img.hidden = false; } else { img.hidden = true; }
    root.querySelector(".ticket__barcode").innerHTML = barcode(n);
    root.hidden = false;
    html.classList.add("is-ticket");
    /* the paper feeds out after the frame that shows it, so the transition runs */
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add("is-open"); }); });
    progress();
    root.querySelector(".ticket__done").focus({ preventScroll: true });
  }

  function close() {
    if (root.hidden) return;
    root.classList.remove("is-open");
    timers.forEach(clearTimeout); timers = [];
    html.classList.remove("is-ticket");
    setTimeout(function () { root.hidden = true; }, reduced ? 0 : 420);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  [].forEach.call(openers, function (b) { b.addEventListener("click", open); });
  root.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) close(); });
  document.addEventListener("keydown", function (e) {
    if (root.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    /* keep the keyboard inside the ticket while it is open */
    var f = [].slice.call(paper.querySelectorAll("button, a[href]"));
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  if (window.NR) window.NR.onChange.push(fill);
})();

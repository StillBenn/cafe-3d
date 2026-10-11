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
    /* a full order (name, extras, beans: up to seven lines) gets the compact
       ticket — smaller picture, no barcode — so Done stays on the screen */
    root.classList.toggle("is-long", o.lines.length > 5);
    root.querySelector("[data-ticket-no]").textContent = current.no;
    whenOptions();
    drawStamps();
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

  var T = function (s) { return window.NR ? window.NR.t(s) : s; };
  var whenEl = root.querySelector("[data-ticket-when]");
  function readyAt(mins) {
    var d = new Date((current ? current.at : Date.now()) + mins * 60 * 1000);
    return pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  /* the ready time is itself the choice: "11:48 · in 4 min", or later */
  function whenOptions() {
    if (!whenEl || !current) return;
    [].forEach.call(whenEl.options, function (op) {
      op.textContent = readyAt(+op.value) + " · " + T("in %s min").replace("%s", op.value);
    });
  }
  if (whenEl) whenEl.addEventListener("change", function () { current.time = readyAt(+whenEl.value); });

  /* Loyalty: a stamp for every order on this device; the tenth is on us. */
  function stamp() {
    var n = 0;
    try { n = (parseInt(localStorage.getItem("nr-stamps"), 10) || 0) % 10 + 1; localStorage.setItem("nr-stamps", String(n)); } catch (e) { n = 1; }
    current.stamps = n;
  }
  function drawStamps() {
    var box = root.querySelector("[data-stamps]");
    if (!box || !current) return;
    var n = current.stamps || 1, dots = "";
    for (var i = 1; i <= 10; i++) dots += '<i class="' + (i <= n ? "is-on" : "") + (i === 10 ? " is-gift" : "") + '"></i>';
    box.querySelector(".ticket__dots").innerHTML = dots;
    box.querySelector("[data-stamps-text]").textContent = n < 10
      ? T("%s of 10 stamps — the tenth cup is on us").replace("%s", n)
      : T("Your tenth cup — this one is on us");
    box.classList.toggle("is-gift", n === 10);
  }

  /* A picture for a story: 1080x1920, the cup as designed, its name, the order. */
  async function story() {
    var cup = window.NR && window.NR.cup;
    if (!cup) return;
    var shot = cup.snapshot(1400), o = cup.order();
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    var c = document.createElement("canvas"); c.width = 1080; c.height = 1920;
    var g = c.getContext("2d");
    var css = getComputedStyle(document.documentElement), tok = function (n, d) { return (css.getPropertyValue(n) || d).trim(); };
    var bg = g.createLinearGradient(0, 0, 0, 1920); bg.addColorStop(0, tok("--c-cream", "#f4efe5")); bg.addColorStop(1, tok("--c-cream-2", "#ece4d6"));
    g.fillStyle = bg; g.fillRect(0, 0, 1080, 1920);
    g.textAlign = "center"; g.fillStyle = "#1e1611";
    g.font = '400 76px Newsreader, Georgia, serif'; g.fillText("Nordic Roast", 528, 200);
    g.fillStyle = "#a8551f"; g.fillText(".", 528 + g.measureText("Nordic Roast").width / 2 + 10, 200);
    g.fillStyle = "#7c6b5d"; g.font = '400 30px "IBM Plex Mono", monospace';
    g.fillText(T("MODA · ISTANBUL"), 540, 262);
    if (shot) {
      var img = new Image(); img.src = shot;
      await new Promise(function (r) { img.onload = r; img.onerror = r; });
      var bw = 860, bh = 1000, k = Math.min(bw / img.width, bh / img.height);
      g.drawImage(img, 540 - img.width * k / 2, 330 + (bh - img.height * k) / 2, img.width * k, img.height * k);
    }
    var y = 1450;
    var name = o.lines.filter(function (l) { return l[0] === T("Printed"); })[0];
    if (name) { g.fillStyle = "#1e1611"; g.font = 'italic 400 88px Newsreader, Georgia, serif'; g.fillText(name[1], 540, y); y += 90; }
    g.fillStyle = "#1e1611"; g.font = '400 40px Inter, system-ui, sans-serif';
    g.fillText(o.lines[0][1] + " · " + o.lines[2][1], 540, y);
    g.fillStyle = "#7c6b5d"; g.font = '400 30px "IBM Plex Mono", monospace';
    g.fillText(current.no + "  ·  " + T("Ready at") + " " + current.time, 540, y + 64);
    g.fillStyle = "#a8551f"; g.font = '400 28px "IBM Plex Mono", monospace';
    g.fillText(T("Designed at larisel.com/cafe-3d"), 540, 1830);
    var blob = await new Promise(function (r) { c.toBlob(r, "image/png"); });
    var file = new File([blob], "nordic-roast-cup.png", { type: "image/png" });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] }) && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ files: [file], title: "Nordic Roast" });
        return;
      }
    } catch (e) { if (e && e.name === "AbortError") return; }
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "nordic-roast-cup.png";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    if (window.NRToast) window.NRToast(T("Saved — ready for your story"));
  }
  root.addEventListener("click", function (e) { if (e.target.closest("[data-story]")) story(); });

  function open(e) {
    lastFocus = e && e.currentTarget;
    var n = 1000 + Math.floor(Math.random() * 9000);
    current = { no: "NR-" + n, at: Date.now() };
    if (whenEl) whenEl.value = "4";
    current.time = readyAt(4);                          /* ready in four minutes, unless the reader picks later */
    stamp();
    /* remembered for next time: "your usual" */
    try { if (window.NR && window.NR.cup && window.NR.cup.encode) localStorage.setItem("nr-usual", window.NR.cup.encode()); } catch (er) { /* private mode */ }
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
    var f = [].slice.call(paper.querySelectorAll("button, a[href], select"));
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  if (window.NR) window.NR.onChange.push(fill);
})();

/* ==========================================================================
   At the table — the QR on every table opens the page as ?masa=7
   --------------------------------------------------------------------------
   The reader is sitting in the café: no curtain and no film (the <head>
   marks html.is-table before first paint), straight to 01. The cup is a
   ceramic one — "to go" makes no sense at a table — and the ticket says the
   order comes to the table instead of asking when to pick it up.
   A bar under the header carries the two things a table needs from the
   counter: a waiter, and the bill. The bill holds every order placed from
   this table in this visit (sessionStorage) and splits three ways — one
   bill, each the cup with their name on it, or evenly.
   A demo, and it says so: nobody is called and nothing is charged.
   ========================================================================== */
(function () {
  "use strict";
  var html = document.documentElement;
  var m = /[?&]masa=(\d{1,2})(?:&|$)/.exec(location.search);
  var no = m ? parseInt(m[1], 10) : 0;
  if (!no || no > 60) { html.classList.remove("is-table"); return; }
  html.classList.add("is-table");

  var T = function (s) { return window.NR ? window.NR.t(s) : s; };
  var toast = function (s) { if (window.NRToast) window.NRToast(s); };
  var KEY = "nr-bill-" + no;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function money(v) { return "$" + v.toFixed(2); }
  function load() { try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(list) { try { sessionStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* full or private: the bill lives for this page only */ } }
  var bill = load();

  document.querySelectorAll("[data-table-no], [data-ticket-table], [data-bill-table]").forEach(function (el) { el.textContent = String(no); });

  /* --- straight to 01, as a cut; again whenever the film re-measures, until
     the reader scrolls on their own (the same landing as a shared cup) */
  var landing = true;
  function land() {
    if (!landing) return;
    var o = document.getElementById("order");
    if (o) window.scrollTo({ top: o.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
  }
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (ev) {
    window.addEventListener(ev, function () { landing = false; }, { passive: true, once: true });
  });
  window.addEventListener("film:layout", function () { setTimeout(land, 30); });
  setTimeout(land, 60);

  /* --- the ceramic cup: chosen through the page's own control, once the
     scene is listening (it is a module: it may still be loading) */
  var tries = 0;
  (function here() {
    var btn = document.querySelector('[data-group="service"] [data-opt="here"]');
    if (window.NR && window.NR.cup && btn) {
      if (btn.getAttribute("aria-pressed") !== "true") btn.click();
      return;
    }
    if (++tries < 100) setTimeout(here, 50);
  })();

  /* --- a waiter: one call at a time; the button says it was heard */
  var callBtn = document.querySelector("[data-call-waiter]"), callT = 0;
  if (callBtn) callBtn.addEventListener("click", function () {
    if (callBtn.classList.contains("is-busy")) return;
    callBtn.classList.add("is-busy");
    toast(T("A waiter is coming to table %s").replace("%s", no));
    clearTimeout(callT);
    callT = setTimeout(function () { callBtn.classList.remove("is-busy"); }, 45000);
  });

  /* --- every order from this table goes on its bill, with a small picture
     of the cup (the ticket's own snapshot, shrunk: sessionStorage is small) */
  function thumb(src) {
    return new Promise(function (res) {
      if (!src) return res("");
      var img = new Image();
      img.onload = function () {
        var h = 112, w = Math.max(1, Math.round(img.width * h / img.height));
        var c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        try { res(c.toDataURL("image/png")); } catch (e) { res(""); }
      };
      img.onerror = function () { res(""); };
      img.src = src;
    });
  }
  document.addEventListener("nr:ordered", function (e) {
    var d = e.detail || {};
    thumb(d.img).then(function (src) {
      bill.push({ no: d.no, code: d.code || "", name: d.name || "", total: +d.total || 0, img: src });
      save(bill);
      asked = false;
      count();
      if (root && !root.hidden) draw();
    });
  });

  var countEl = document.querySelector("[data-bill-count]");
  function count() {
    if (!countEl) return;
    countEl.textContent = String(bill.length);
    countEl.hidden = !bill.length;
  }
  count();

  /* --- the bill ------------------------------------------------------------ */
  var root = document.getElementById("bill");
  if (!root) return;
  var paper = root.querySelector(".bill__paper");
  var listEl = root.querySelector("[data-bill-list]");
  var splitOut = root.querySelector("[data-bill-split-out]");
  var askBtn = root.querySelector("[data-bill-ask]");
  var split = "one", pay = "card", people = 2, lastFocus = null, asked = false;

  function sum() { return bill.reduce(function (s, o) { return s + o.total; }, 0); }
  function title(o) {
    var cup = window.NR && window.NR.cup;
    return o.code && cup && cup.describe ? cup.describe(o.code) : T("Coffee");
  }
  function upper(s) { return s.toLocaleUpperCase(html.lang || "en"); }

  function draw() {
    var empty = !bill.length;
    root.querySelector("[data-bill-empty]").hidden = !empty;
    root.querySelector("[data-bill-body]").hidden = empty;
    listEl.innerHTML = "";
    bill.forEach(function (o, i) {
      var li = document.createElement("li");
      li.className = "bill__item";
      li.style.setProperty("--i", i);
      li.innerHTML = '<span class="bill__pic"></span><span class="bill__what"><strong></strong><span></span></span><span class="bill__price"></span>';
      if (o.img) { var im = new Image(); im.alt = ""; im.src = o.img; li.querySelector(".bill__pic").appendChild(im); }
      li.querySelector("strong").textContent = title(o);
      li.querySelector(".bill__what span").textContent = o.name ? "“" + upper(o.name) + "”" : o.no;
      li.querySelector(".bill__price").textContent = money(o.total);
      listEl.appendChild(li);
    });
    var tot = root.querySelector("[data-bill-total]");
    tot.innerHTML = '<span class="total__cur">$</span>';
    tot.appendChild(document.createTextNode(sum().toFixed(2)));
    drawSplit();
    root.querySelectorAll("[data-split]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.split === split)); });
    root.querySelectorAll("[data-pay]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.pay === pay)); });
    root.classList.toggle("is-asked", asked);
    askBtn.disabled = asked;
  }

  function row(label, value, cls) {
    var r = document.createElement("p");
    r.className = "bill__row" + (cls ? " " + cls : "");
    r.innerHTML = "<span></span><strong></strong>";
    r.children[0].textContent = label; r.children[1].textContent = value;
    return r;
  }
  function drawSplit() {
    splitOut.innerHTML = "";
    if (split === "cups") {
      /* the name printed on each cup says whose it is; cups without a name
         stay together, for the table to settle */
      var by = {}, order = [];
      bill.forEach(function (o) {
        var k = o.name ? upper(o.name) : "";
        if (!(k in by)) { by[k] = 0; order.push(k); }
        by[k] += o.total;
      });
      order.sort(function (a, b) { return (a === "") - (b === ""); });
      order.forEach(function (k) { splitOut.appendChild(row(k || T("Orders without a name"), money(by[k]))); });
    } else if (split === "even") {
      var step = document.createElement("div");
      step.className = "bill__people";
      step.innerHTML = '<button class="iconbtn" type="button" data-people="-1"><span aria-hidden="true">−</span></button>' +
        '<span class="bill__n"></span><button class="iconbtn" type="button" data-people="1"><span aria-hidden="true">+</span></button>';
      step.querySelector('[data-people="-1"]').setAttribute("aria-label", T("One person fewer"));
      step.querySelector('[data-people="1"]').setAttribute("aria-label", T("One person more"));
      step.querySelector(".bill__n").textContent = T("%s people").replace("%s", people);
      splitOut.appendChild(step);
      /* cents that do not divide go to the first share, so the shares add up */
      var cents = Math.round(sum() * 100), each = Math.floor(cents / people), rest = cents - each * people;
      splitOut.appendChild(row(T("Each pays"), rest ? money((each + rest) / 100) + " · " + money(each / 100) : money(each / 100), "bill__row--each"));
    }
  }

  root.addEventListener("click", function (e) {
    var s = e.target.closest("[data-split]"), p = e.target.closest("[data-pay]"), n = e.target.closest("[data-people]");
    if (s) { split = s.dataset.split; draw(); }
    else if (p) { pay = p.dataset.pay; draw(); }
    else if (n) { people = Math.min(12, Math.max(2, people + +n.dataset.people)); drawSplit(); var again = splitOut.querySelector('[data-people="' + n.dataset.people + '"]'); if (again) again.focus(); }
    else if (e.target.closest("[data-bill-ask]")) {
      asked = true; draw();
      root.querySelector(".bill__x").focus({ preventScroll: true });
      toast(T(pay === "card" ? "The bill is coming to table %s — card reader included" : "The bill is coming to table %s").replace("%s", no));
    } else if (e.target.closest("[data-bill-order]")) {
      close();
      var o = document.getElementById("order");
      if (o) window.scrollTo({ top: o.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
    } else if (e.target.closest("[data-bill-close]")) close();
  });

  var hideT = 0;
  function open(e) {
    clearTimeout(hideT);
    lastFocus = e && e.currentTarget;
    draw();
    root.hidden = false;
    html.classList.add("is-bill");
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add("is-open"); }); });
    var first = root.querySelector(".bill__x");
    if (first) first.focus({ preventScroll: true });
  }
  function close() {
    if (root.hidden) return;
    root.classList.remove("is-open");
    html.classList.remove("is-bill");
    clearTimeout(hideT);
    hideT = setTimeout(function () { root.hidden = true; }, reduced ? 0 : 380);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  var opener = document.querySelector("[data-bill-open]");
  if (opener) opener.addEventListener("click", open);
  document.addEventListener("keydown", function (e) {
    if (root.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    /* the keyboard stays inside the bill while it is open */
    var f = [].slice.call(paper.querySelectorAll("button:not([disabled])")).filter(function (b) { return b.offsetParent; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  if (window.NR) window.NR.onChange.push(function () { if (root && !root.hidden) draw(); });
})();

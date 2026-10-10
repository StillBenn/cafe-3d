/* ==========================================================================
   Sound — off until asked for
   --------------------------------------------------------------------------
   Nothing plays until the reader presses the sound button in the header
   (browsers allow audio only after a gesture anyway). Everything is made
   here with the Web Audio API — no files to download: a quiet room, then
   what the film shows, mixed by where the reader is in it —
     roast  : a low drum rumble and beans crackling (first crack)
     grind  : a soft burr hum
     pour   : a thin stream of water, the bloom's fizz
     café   : the morning murmur, a cup set down now and then
   plus small sounds for the hand: a tick on every choice, a two-note chime
   when the order goes in, paper feeding out for the ticket.
   Low on purpose: atmosphere, never a soundtrack.
   ========================================================================== */
(function () {
  "use strict";
  var btn = document.querySelector("[data-sound]");
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!btn || !AC) { if (btn) btn.hidden = true; return; }

  var ctx = null, master = null, on = false, raf = 0;
  var layers = {};
  var noiseBuf = null, brownBuf = null;

  function makeNoise(brown) {
    var len = ctx.sampleRate * 3, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0), last = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return b;
  }
  function source(buf) {
    var s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
    s.loopStart = Math.random(); s.start(0, Math.random() * 2); return s;
  }
  function filt(type, f, q) { var n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; if (q) n.Q.value = q; return n; }
  function gain(v) { var g = ctx.createGain(); g.gain.value = v; return g; }
  function chain() { for (var i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]); return arguments[arguments.length - 1]; }

  /* a short decaying burst — the unit of crackle, tick and rustle */
  function burst(t, dur, f, q, level, out) {
    var s = ctx.createBufferSource(); s.buffer = noiseBuf;
    var bp = filt("bandpass", f, q), g = gain(0);
    g.gain.setValueAtTime(level, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    chain(s, bp, g, out); s.start(t, Math.random() * 2, dur + 0.02);
  }
  function tone(t, f, dur, level, out) {
    var o = ctx.createOscillator(), g = gain(0);
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(level, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    chain(o, g, out); o.start(t); o.stop(t + dur + 0.05);
  }

  function build() {
    ctx = new AC();
    noiseBuf = makeNoise(false); brownBuf = makeNoise(true);
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
    master = gain(0); chain(master, filt("lowpass", 9000), comp, ctx.destination);

    /* room: air, always */
    layers.room = gain(0.05); chain(source(brownBuf), filt("lowpass", 700), layers.room, master);
    /* roast: drum rumble */
    layers.roast = gain(0); chain(source(brownBuf), filt("lowpass", 140), gain(2.2), layers.roast, master);
    layers.crackle = gain(0); layers.crackle.connect(master);
    /* grind: burr hum + its grit, trembling */
    layers.grind = gain(0);
    var saw = ctx.createOscillator(); saw.type = "sawtooth"; saw.frequency.value = 94;
    var trem = ctx.createOscillator(); trem.frequency.value = 21; var td = gain(0.35); var tg = gain(0.65);
    chain(trem, td, tg.gain); trem.start();
    chain(saw, filt("lowpass", 520), gain(0.18), tg, layers.grind, master); saw.start();
    chain(source(noiseBuf), filt("bandpass", 2300, 1.1), gain(0.22), tg);
    /* pour: a thin stream — band-passed noise with a nervous amplitude */
    layers.pour = gain(0);
    var flutter = gain(0.6);
    chain(source(noiseBuf), filt("highpass", 500), filt("bandpass", 1900, 0.7), flutter, layers.pour, master);
    var fl = source(noiseBuf); var fll = filt("lowpass", 9); var flg = gain(1.6); chain(fl, fll, flg, flutter.gain);
    /* café: murmur, slow-moving */
    layers.cafe = gain(0);
    var mur = gain(1); chain(source(brownBuf), filt("bandpass", 480, 0.6), gain(1.4), mur, layers.cafe, master);
    var lfo = ctx.createOscillator(); lfo.frequency.value = 0.13; var lg = gain(0.35); chain(lfo, lg, mur.gain); lfo.start();
    layers.clink = gain(0); layers.clink.connect(master);
    layers.ui = gain(0.9); layers.ui.connect(master);
  }

  /* where the reader is: film chapter and progress, or past it (the page) */
  function mix() {
    var pos = window.__filmPos, L = window.__filmLayout;
    var past = L ? Math.min(1, Math.max(0, (scrollY - L.start) / (innerHeight * 0.8))) : 1;
    var w = { roast: 0, grind: 0, pour: 0, cafe: 0.35 + 0.65 * past, crackle: 0 };
    if (pos && past < 1) {
      var k = 1 - past, c = pos.ch, l = pos.local;
      if (c === 0) { w.roast = 0.9 * k; w.crackle = (0.35 + 0.65 * Math.sin(Math.PI * l)) * k; }
      else if (c === 1) { w.grind = (l < 0.62 ? 1 : Math.max(0, 1 - (l - 0.62) * 5)) * 0.8 * k; w.roast = 0.15 * k; }
      else if (c === 2) { w.pour = (l > 0.08 && l < 0.55 ? 1 : l <= 0.08 ? l / 0.08 : Math.max(0, 1 - (l - 0.55) * 6)) * 0.9 * k; w.crackle = l > 0.12 && l < 0.6 ? 0.25 * k : 0; w.cafe = Math.max(w.cafe, 0.25 * l); }
      else { w.pour = (l < 0.3 ? 0.8 : Math.max(0, 0.8 - (l - 0.3) * 4)) * k; w.cafe = Math.max(w.cafe, 0.3 + 0.6 * l); }
    }
    var t = ctx.currentTime;
    ["roast", "grind", "pour", "cafe"].forEach(function (n) {
      layers[n].gain.setTargetAtTime(w[n] * ({ roast: 0.1, grind: 0.3, pour: 0.6, cafe: 0.16 })[n], t, 0.25);   /* balanced by measurement: every scene about -34 dBFS */
    });
    /* crackle: beans in the roaster, then the bloom's fizz — random clicks */
    if (w.crackle > 0.02 && Math.random() < w.crackle * 0.18) {   /* ~10 a second at most */
      burst(t + Math.random() * 0.05, 0.012 + Math.random() * 0.02, 1800 + Math.random() * 3200, 2.5, 0.05 + Math.random() * 0.12 * w.crackle, master);
    }
    /* a cup set down somewhere in the room */
    if (w.cafe > 0.5 && Math.random() < 0.0035) {
      var f = 2300 + Math.random() * 900;
      tone(t, f, 0.5, 0.025, master); tone(t + 0.003, f * 1.51, 0.35, 0.012, master);
    }
    raf = requestAnimationFrame(mix);
  }

  function set(next) {
    on = next;
    btn.setAttribute("aria-pressed", String(on));
    document.documentElement.classList.toggle("has-sound", on);
    if (on) {
      if (!ctx) build();
      ctx.resume();
      master.gain.setTargetAtTime(0.6, ctx.currentTime, 0.4);
      if (!raf) raf = requestAnimationFrame(mix);
    } else if (ctx) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      cancelAnimationFrame(raf); raf = 0;
      setTimeout(function () { if (!on) ctx.suspend(); }, 600);
    }
  }
  btn.addEventListener("click", function () { set(!on); });
  /* ?probe: let the automated test measure the levels */
  if (/[?&]probe/.test(location.search)) window.__sound = { ctx: function () { return ctx; }, master: function () { return master; } };
  document.addEventListener("visibilitychange", function () {
    if (!ctx || !on) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  /* the hand: ticks on choices, a chime for the order, paper for the ticket */
  document.addEventListener("click", function (e) {
    if (!on || !ctx) return;
    var t = ctx.currentTime;
    if (e.target.closest("[data-opt], .opttab, .lang__btn")) {
      burst(t, 0.03, 4200, 1.4, 0.18, layers.ui); tone(t, 1750, 0.06, 0.05, layers.ui);
    } else if (e.target.closest("[data-order]")) {
      tone(t, 1318.5, 0.9, 0.09, layers.ui); tone(t + 0.12, 1975.5, 1.1, 0.07, layers.ui);
      for (var i = 0; i < 9; i++) burst(t + 0.25 + i * 0.075, 0.06, 2600 + Math.random() * 1600, 0.8, 0.05, layers.ui);
    }
  }, true);
})();

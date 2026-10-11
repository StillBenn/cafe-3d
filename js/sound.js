/* ==========================================================================
   Sound — off until asked for
   --------------------------------------------------------------------------
   Nothing plays until the reader presses the sound button in the header
   (browsers allow audio only after a gesture anyway). Everything is made
   here with the Web Audio API — no files to download:

     music  : a slow, warm electric-piano bed (FM, four chords a phrase,
              strummed and never twice the same) with a few melody notes
     room   : one shared reverb (a generated impulse) that every layer sends
              into, so the sounds sit in the same café instead of on top of it
     scenes : mixed by where the reader is in the film —
       roast  : a low drum rumble and beans crackling (first crack)
       grind  : a soft burr hum
       pour   : a thin stream of water with the bubbles of a real pour, the
                bloom's fizz
       café   : distant voices, a cup set down now and then, the hiss of the
                steam wand
   plus small sounds for the hand: a tick on every choice, a two-note chime
   when the order goes in, paper feeding out for the ticket.
   Low on purpose: atmosphere, never a soundtrack. Levels balanced by
   measurement (?probe): every scene about -34 dBFS, the music under it.
   ========================================================================== */
(function () {
  "use strict";
  var btn = document.querySelector("[data-sound]");
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!btn || !AC) { if (btn) btn.hidden = true; return; }

  var ctx = null, master = null, verb = null, on = false, raf = 0, clock = 0;
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
  /* a small room: 2.4 s of decaying stereo noise, darker as it fades */
  function makeImpulse() {
    var sr = ctx.sampleRate, len = Math.floor(sr * 2.4), b = ctx.createBuffer(2, len, sr);
    for (var c = 0; c < 2; c++) {
      var d = b.getChannelData(c), lp = 0;
      for (var i = 0; i < len; i++) {
        var t = i / sr, k = 0.18 + 0.8 * Math.exp(-t / 0.5);     /* high end dies first */
        lp += (Math.random() * 2 - 1 - lp) * k;
        d[i] = lp * Math.exp(-t / 0.62) * (i < sr * 0.012 ? i / (sr * 0.012) : 1);
      }
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
  /* a layer: dry to the master, a share of it into the room */
  function out(node, wet) { node.connect(master); if (wet) { var s = gain(wet); node.connect(s); s.connect(verb); } return node; }

  /* a short decaying burst — the unit of crackle, tick and rustle */
  function burst(t, dur, f, q, level, dest) {
    var s = ctx.createBufferSource(); s.buffer = noiseBuf;
    var bp = filt("bandpass", f, q), g = gain(0);
    g.gain.setValueAtTime(level, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    chain(s, bp, g, dest); s.start(t, Math.random() * 2, dur + 0.02);
  }
  function tone(t, f, dur, level, dest) {
    var o = ctx.createOscillator(), g = gain(0);
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(level, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    chain(o, g, dest); o.start(t); o.stop(t + dur + 0.05);
  }
  /* a bubble: a sine that rises as it rings — what makes running water read
     as water and not as hiss */
  function bloop(t, f, level, dest) {
    var o = ctx.createOscillator(), g = gain(0), d = 0.03 + Math.random() * 0.05;
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * (1.6 + Math.random()), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(level, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    chain(o, g, dest); o.start(t); o.stop(t + d + 0.02);
  }

  /* --- the music: an FM electric piano ------------------------------------
     carrier and modulator at the same pitch, the modulation index falling as
     the note rings — the bell-then-warmth of a Rhodes. A second carrier a
     few cents sharp gives it its slow chorus. */
  function epiano(t, midi, vel, dur, dest) {
    var f = 440 * Math.pow(2, (midi - 69) / 12);
    var car = ctx.createOscillator(), car2 = ctx.createOscillator(), mod = ctx.createOscillator();
    var mi = gain(0), amp = gain(0);
    car.frequency.value = f; car2.frequency.value = f * 1.0035; mod.frequency.value = f;
    mi.gain.setValueAtTime(f * 1.8 * vel, t); mi.gain.exponentialRampToValueAtTime(f * 0.12, t + 1.4);
    chain(mod, mi); mi.connect(car.frequency); mi.connect(car2.frequency);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.06 * vel, t + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.022 * vel, t + 0.6);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    car.connect(amp); car2.connect(amp); amp.connect(dest);
    [car, car2, mod].forEach(function (o) { o.start(t); o.stop(t + dur + 0.05); });
  }
  /* Fmaj9 – Em7 – Dm9 – Cmaj7: a slow fall, morning not night */
  var CHORDS = [
    [41, 57, 60, 64, 67], [40, 55, 59, 62, 67], [38, 53, 57, 60, 64], [36, 52, 55, 59, 62]
  ];
  var PENTA = [72, 74, 76, 79, 81, 84];
  var BAR = 4.6, nextBar = 0, bar = 0, music = null;
  function scheduleMusic() {
    if (!on || !ctx) return;
    var now = ctx.currentTime;
    while (nextBar < now + 1.2) {
      var ch = CHORDS[bar % 4], t = Math.max(nextBar, now + 0.05);
      ch.forEach(function (m, i) {
        /* strummed upward, each note a touch different in weight */
        epiano(t + i * (0.018 + Math.random() * 0.02), m, i === 0 ? 0.55 : 0.32 + Math.random() * 0.14, BAR + 1.6, music);
      });
      /* now and then a melody note or two over the top */
      if (Math.random() < 0.55) {
        var n = 1 + Math.floor(Math.random() * 2);
        for (var k = 0; k < n; k++) epiano(t + BAR * (0.4 + k * 0.22 + Math.random() * 0.1), PENTA[Math.floor(Math.random() * PENTA.length)], 0.22 + Math.random() * 0.1, 2.6, music);
      }
      nextBar = t + BAR; bar++;
    }
  }

  function build() {
    ctx = new AC();
    noiseBuf = makeNoise(false); brownBuf = makeNoise(true);
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
    master = gain(0); chain(master, filt("lowpass", 9000), comp, ctx.destination);
    verb = ctx.createConvolver(); verb.buffer = makeImpulse();
    chain(verb, filt("highpass", 160), gain(0.55), master);

    /* music: warm, under everything */
    music = gain(1);
    layers.music = gain(0);
    out(chain(music, filt("lowpass", 2600), layers.music), 0.55);

    /* room: air, always */
    layers.room = gain(0.05); chain(source(brownBuf), filt("lowpass", 700), layers.room, master);
    /* roast: drum rumble */
    layers.roast = gain(0); out(chain(source(brownBuf), filt("lowpass", 140), gain(2.2), layers.roast), 0.15);
    layers.crackle = gain(0); out(layers.crackle, 0.3);
    layers.crackle.gain.value = 1;
    /* grind: burr hum + its grit, trembling */
    layers.grind = gain(0);
    var saw = ctx.createOscillator(); saw.type = "sawtooth"; saw.frequency.value = 94;
    var trem = ctx.createOscillator(); trem.frequency.value = 21; var td = gain(0.35); var tg = gain(0.65);
    chain(trem, td, tg.gain); trem.start();
    chain(saw, filt("lowpass", 520), gain(0.18), tg, layers.grind); saw.start();
    chain(source(noiseBuf), filt("bandpass", 2300, 1.1), gain(0.22), tg);
    out(layers.grind, 0.2);
    /* pour: a thin stream — band-passed noise with a nervous amplitude */
    layers.pour = gain(0);
    var flutter = gain(0.6);
    chain(source(noiseBuf), filt("highpass", 500), filt("bandpass", 1900, 0.7), flutter, layers.pour);
    var fl = source(noiseBuf); var fll = filt("lowpass", 9); var flg = gain(1.6); chain(fl, fll, flg, flutter.gain);
    out(layers.pour, 0.35);
    layers.bubble = gain(1); out(layers.bubble, 0.45);
    /* café: several distant voices — each a formant band of noise opening
       and closing at the pace of speech — never one steady hum */
    layers.cafe = gain(0);
    [380, 640, 1150, 2100].forEach(function (f, i) {
      var v = gain(0); var lfo = ctx.createOscillator(); lfo.frequency.value = 2.6 + i * 0.9 + Math.random();
      var depth = gain(0.5); chain(lfo, depth, v.gain); lfo.start();
      var slow = ctx.createOscillator(); slow.frequency.value = 0.07 + Math.random() * 0.1;
      var sd = gain(0.4); chain(slow, sd, v.gain); slow.start();
      chain(source(i % 2 ? noiseBuf : brownBuf), filt("bandpass", f, 3.5), gain(i % 2 ? 0.5 : 1.6), v, layers.cafe);
    });
    out(layers.cafe, 0.6);
    layers.clink = gain(1); out(layers.clink, 0.5);
    layers.ui = gain(0.9); out(layers.ui, 0.25);
  }

  /* where the reader is: film chapter and progress, or past it (the page) */
  var lastMix = 0;
  function mix() {
    /* the random events below are rolled once a frame: scaled to the frame's
       length, so a 144 Hz screen hears what a 60 Hz one does */
    var now = performance.now(), fk = lastMix ? Math.min(4, (now - lastMix) / 16.67) : 1;
    lastMix = now;
    var pos = window.__filmPos, L = window.__filmLayout;
    var past = L ? Math.min(1, Math.max(0, (scrollY - L.start) / (innerHeight * 0.8))) : 1;
    var w = { roast: 0, grind: 0, pour: 0, cafe: 0.35 + 0.65 * past, crackle: 0, music: 0.7 + 0.3 * past };
    if (pos && past < 1) {
      var k = 1 - past, c = pos.ch, l = pos.local;
      if (c === 0) { w.roast = 0.9 * k; w.crackle = (0.35 + 0.65 * Math.sin(Math.PI * l)) * k; }
      else if (c === 1) { w.grind = (l < 0.62 ? 1 : Math.max(0, 1 - (l - 0.62) * 5)) * 0.8 * k; w.roast = 0.15 * k; }
      else if (c === 2) { w.pour = (l > 0.08 && l < 0.62 ? 1 : l <= 0.08 ? l / 0.08 : Math.max(0, 1 - (l - 0.62) * 6)) * 0.9 * k; w.crackle = l > 0.12 && l < 0.66 ? 0.25 * k : 0; w.cafe = Math.max(w.cafe, 0.25 * l); }
      else { w.pour = (l < 0.3 ? 0.8 : Math.max(0, 0.8 - (l - 0.3) * 4)) * k; w.cafe = Math.max(w.cafe, 0.3 + 0.6 * l); }
    }
    var t = ctx.currentTime;
    var LEVEL = { roast: 0.1, grind: 0.36, pour: 0.3, cafe: 0.5, music: 0.55 };   /* balanced by measurement: every scene -33..-35 dBFS */
    ["roast", "grind", "pour", "cafe", "music"].forEach(function (n) {
      layers[n].gain.setTargetAtTime(w[n] * LEVEL[n], t, 0.3);
    });
    /* crackle: beans in the roaster, then the bloom's fizz — random clicks */
    if (w.crackle > 0.02 && Math.random() < w.crackle * 0.18 * fk) {   /* ~10 a second at most */
      burst(t + Math.random() * 0.05, 0.012 + Math.random() * 0.02, 1800 + Math.random() * 3200, 2.5, 0.05 + Math.random() * 0.12 * w.crackle, layers.crackle);
    }
    /* bubbles in the stream while it pours */
    if (w.pour > 0.1 && Math.random() < w.pour * 0.5 * fk) {
      bloop(t + Math.random() * 0.03, 380 + Math.random() * 900, 0.006 + Math.random() * 0.01 * w.pour, layers.bubble);
    }
    /* a cup set down somewhere in the room; once in a while the steam wand */
    if (w.cafe > 0.5 && Math.random() < 0.0035 * fk) {
      var f = 2300 + Math.random() * 900;
      tone(t, f, 0.5, 0.025, layers.clink); tone(t + 0.003, f * 1.51, 0.35, 0.012, layers.clink);
    }
    if (w.cafe > 0.6 && Math.random() < 0.0006 * fk) {
      var s = ctx.createBufferSource(); s.buffer = noiseBuf; var g = gain(0), d = 2 + Math.random() * 2;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.012, t + 0.4); g.gain.setTargetAtTime(0.0001, t + d, 0.4);
      chain(s, filt("bandpass", 5200, 0.9), g, layers.clink); s.start(t, Math.random(), d + 2);
    }
    if (t > clock) { scheduleMusic(); clock = t + 0.25; }
    raf = requestAnimationFrame(mix);
  }

  function set(next) {
    on = next;
    btn.setAttribute("aria-pressed", String(on));
    document.documentElement.classList.toggle("has-sound", on);
    if (on) {
      if (!ctx) build();
      ctx.resume();
      if (nextBar < ctx.currentTime) nextBar = ctx.currentTime + 0.3;   /* a still-valid schedule is kept: no two chords at once */
      master.gain.setTargetAtTime(0.6, ctx.currentTime, 0.4);
      if (!raf) raf = requestAnimationFrame(mix);
    } else if (ctx) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      cancelAnimationFrame(raf); raf = 0; lastMix = 0;
      setTimeout(function () { if (!on) ctx.suspend(); }, 600);
    }
  }
  btn.addEventListener("click", function () { set(!on); });
  /* ?probe: let the automated test measure the levels */
  if (/[?&]probe/.test(location.search)) window.__sound = { ctx: function () { return ctx; }, master: function () { return master; } };
  document.addEventListener("visibilitychange", function () {
    if (!ctx || !on) return;
    if (document.hidden) ctx.suspend(); else { ctx.resume(); if (nextBar < ctx.currentTime) nextBar = ctx.currentTime + 0.3; }
  });

  /* the hand: ticks on choices, a chime for the order, paper for the ticket */
  document.addEventListener("click", function (e) {
    if (!on || !ctx) return;
    var t = ctx.currentTime;
    if (e.target.closest("[data-opt], .opttab, .lang__btn, [data-beans]")) {
      burst(t, 0.03, 4200, 1.4, 0.18, layers.ui); tone(t, 1750, 0.06, 0.05, layers.ui);
    } else if (e.target.closest("[data-order]")) {
      tone(t, 1318.5, 0.9, 0.09, layers.ui); tone(t + 0.12, 1975.5, 1.1, 0.07, layers.ui);
      for (var i = 0; i < 9; i++) burst(t + 0.25 + i * 0.075, 0.06, 2600 + Math.random() * 1600, 0.8, 0.05, layers.ui);
    }
  }, true);
})();

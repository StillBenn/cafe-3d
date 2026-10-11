/* ==========================================================================
   Sound — off until asked for
   --------------------------------------------------------------------------
   Nothing plays until the reader presses the sound button in the header
   (browsers allow audio only after a gesture anyway). Everything is made
   here with the Web Audio API — no files to download:

     music  : a slow, soft bed — a felt-damped electric piano (FM, an
              eight-chord phrase, gently rolled and never twice the same),
              a warm pad that opens under each chord, a round low bass, and
              now and then a melody note with a quiet echo
     room   : one shared reverb (a generated impulse) that every layer sends
              into, so the sounds sit in the same café instead of on top of it
     scenes : mixed by where the reader is in the film —
       roast  : a low drum rumble and beans crackling (first crack)
       grind  : a soft burr hum
       pour   : a thin stream of water with the bubbles of a real pour, the
                bloom's fizz
       café   : only a cup set down now and then. (Distant "voices" made of
                noise bands opening and closing at speech pace were cut on
                11.10: their steady 2.5 Hz pulse — measured at 17.7% of the
                page's level — read as a passing steam train.)
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
  /* a soft room: 3 s of decaying stereo noise, darker as it fades */
  function makeImpulse() {
    var sr = ctx.sampleRate, len = Math.floor(sr * 3.0), b = ctx.createBuffer(2, len, sr);
    for (var c = 0; c < 2; c++) {
      var d = b.getChannelData(c), lp = 0;
      for (var i = 0; i < len; i++) {
        var t = i / sr, k = 0.18 + 0.8 * Math.exp(-t / 0.5);     /* high end dies first */
        lp += (Math.random() * 2 - 1 - lp) * k;
        d[i] = lp * Math.exp(-t / 0.8) * (i < sr * 0.02 ? i / (sr * 0.02) : 1);
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

  /* --- the music ------------------------------------------------------------
     A felt-damped electric piano: carrier and modulator at the same pitch, a
     low modulation index falling as the note rings — the warmth of a Rhodes
     without its bell. A second carrier 0.5 Hz sharp gives it a slow shimmer
     — a fixed offset, not a ratio: a few cents beat faster the higher the
     note, and above ~1 Hz the beat reads as a pulse. */
  function epiano(t, midi, vel, dur, dest) {
    var f = 440 * Math.pow(2, (midi - 69) / 12);
    var car = ctx.createOscillator(), car2 = ctx.createOscillator(), mod = ctx.createOscillator();
    var mi = gain(0), amp = gain(0);
    car.frequency.value = f; car2.frequency.value = f + 0.5; mod.frequency.value = f;
    mi.gain.setValueAtTime(f * 0.9 * vel, t); mi.gain.exponentialRampToValueAtTime(f * 0.05, t + 1.8);
    chain(mod, mi); mi.connect(car.frequency); mi.connect(car2.frequency);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.05 * vel, t + 0.022);
    amp.gain.exponentialRampToValueAtTime(0.018 * vel, t + 0.9);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    car.connect(amp); car2.connect(amp); amp.connect(dest);
    [car, car2, mod].forEach(function (o) { o.start(t); o.stop(t + dur + 0.05); });
  }
  /* the pad: two soft triangles 0.6 Hz apart on each upper chord tone (the
     same slow shimmer on every note), breathing in over two seconds and out
     over three */
  function pad(t, midis, dur, dest) {
    var g = gain(0);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(1, t + 2.2);
    g.gain.setValueAtTime(1, t + dur - 2.5); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    g.connect(dest);
    midis.forEach(function (m) {
      var f = 440 * Math.pow(2, (m - 69) / 12);
      [-0.3, 0.3].forEach(function (c) {
        var o = ctx.createOscillator(), og = gain(0.006);
        o.type = "triangle"; o.frequency.value = f + c;
        chain(o, og, g); o.start(t); o.stop(t + dur + 0.05);
      });
    });
  }
  /* the bass: a round sine on the root with a little of its octave, so a
     laptop speaker still hears where the harmony stands */
  function bass(t, midi, dur, dest) {
    var f = 440 * Math.pow(2, (midi - 69) / 12), g = gain(0);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.028, t + 1.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(dest);
    [[f, 1], [f * 2, 0.22]].forEach(function (p) {
      var o = ctx.createOscillator(), og = gain(p[1]); o.frequency.value = p[0];
      chain(o, og, g); o.start(t); o.stop(t + dur + 0.05);
    });
  }
  /* eight chords, a slow morning: Fmaj9 Em7 Dm9 Cmaj9 | Am9 Fmaj9 Cmaj9 G6/9 */
  var CHORDS = [
    [41, 57, 60, 64, 67], [40, 55, 59, 62, 67], [38, 53, 57, 60, 64], [36, 52, 55, 59, 62],
    [33, 55, 60, 64, 71], [41, 57, 64, 67, 72], [36, 55, 62, 64, 71], [31, 59, 62, 64, 69]
  ];
  var BAR = 6, nextBar = 0, bar = 0, music = null, melody = null, padBus = null;
  function scheduleMusic() {
    if (!on || !ctx) return;
    var now = ctx.currentTime;
    while (nextBar < now + 1.2) {
      var ch = CHORDS[bar % CHORDS.length], t = Math.max(nextBar, now + 0.05);
      bass(t, ch[0] < 36 ? ch[0] + 12 : ch[0], BAR + 1.2, music);
      pad(t, ch.slice(2), BAR + 2.4, padBus);
      ch.slice(1).forEach(function (m, i) {
        /* a slow roll upward, each note a touch different in weight */
        epiano(t + 0.03 + i * (0.03 + Math.random() * 0.025), m, 0.3 + Math.random() * 0.12, BAR + 1.4, music);
      });
      /* now and then a melody note from the chord, an octave up, with its echo */
      if (Math.random() < 0.45) {
        var top = ch.slice(2), n = Math.random() < 0.3 ? 2 : 1;
        for (var k = 0; k < n; k++) {
          epiano(t + BAR * (0.45 + k * 0.2 + Math.random() * 0.08), top[Math.floor(Math.random() * top.length)] + 12, 0.18 + Math.random() * 0.08, 3.2, melody);
        }
      }
      nextBar = t + BAR; bar++;
    }
  }

  function build() {
    ctx = new AC();
    noiseBuf = makeNoise(false); brownBuf = makeNoise(true);
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
    master = gain(0); chain(master, filt("lowpass", 7000), comp, ctx.destination);
    verb = ctx.createConvolver(); verb.buffer = makeImpulse();
    chain(verb, filt("highpass", 160), gain(0.55), master);

    /* music: warm, under everything — piano and bass dry-ish, the pad
       through a slowly breathing low-pass, the melody with a quiet echo */
    music = gain(1);
    layers.music = gain(0);
    out(chain(music, filt("lowpass", 2200), layers.music), 0.6);
    padBus = gain(1);
    var padLp = filt("lowpass", 900, 0.4), padLfo = ctx.createOscillator(), padDepth = gain(260);
    padLfo.frequency.value = 0.045; chain(padLfo, padDepth, padLp.frequency); padLfo.start();
    chain(padBus, padLp, music);
    melody = gain(1); melody.connect(music);
    var echo = ctx.createDelay(1), fb = gain(0.26), echoLp = filt("lowpass", 1600), echoWet = gain(0.3);
    echo.delayTime.value = 0.42;
    chain(melody, echo, echoLp, fb, echo); echoLp.connect(echoWet); echoWet.connect(music);

    /* room: a little air, always */
    layers.room = gain(0.035); chain(source(brownBuf), filt("lowpass", 380), layers.room, master);
    /* roast: drum rumble */
    layers.roast = gain(0); out(chain(source(brownBuf), filt("lowpass", 140), gain(2.2), layers.roast), 0.15);
    layers.crackle = gain(0); out(layers.crackle, 0.3);
    layers.crackle.gain.value = 1;
    /* grind: burr hum + its grit, trembling */
    layers.grind = gain(0);
    var saw = ctx.createOscillator(); saw.type = "sawtooth"; saw.frequency.value = 94;
    var trem = ctx.createOscillator(); trem.frequency.value = 21; var td = gain(0.25); var tg = gain(0.75);
    chain(trem, td, tg.gain); trem.start();
    chain(saw, filt("lowpass", 420), gain(0.18), tg, layers.grind); saw.start();
    chain(source(noiseBuf), filt("bandpass", 2100, 1.1), filt("lowpass", 3200), gain(0.12), tg);
    out(layers.grind, 0.2);
    /* pour: a thin stream — band-passed noise with a nervous amplitude */
    layers.pour = gain(0);
    var flutter = gain(0.6);
    chain(source(noiseBuf), filt("highpass", 420), filt("bandpass", 1500, 0.8), filt("lowpass", 3400), flutter, layers.pour);
    var fl = source(noiseBuf); var fll = filt("lowpass", 9); var flg = gain(1.6); chain(fl, fll, flg, flutter.gain);
    out(layers.pour, 0.35);
    layers.bubble = gain(1); out(layers.bubble, 0.45);
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
    var w = { roast: 0, grind: 0, pour: 0, cafe: 0.35 + 0.65 * past, crackle: 0, music: 0.6 + 0.4 * past };
    if (pos && past < 1) {
      var k = 1 - past, c = pos.ch, l = pos.local;
      if (c === 0) { w.roast = 0.9 * k; w.crackle = (0.35 + 0.65 * Math.sin(Math.PI * l)) * k; }
      else if (c === 1) { w.grind = (l < 0.62 ? 1 : Math.max(0, 1 - (l - 0.62) * 5)) * 0.8 * k; w.roast = 0.15 * k; }
      else if (c === 2) { w.pour = (l > 0.08 && l < 0.62 ? 1 : l <= 0.08 ? l / 0.08 : Math.max(0, 1 - (l - 0.62) * 6)) * 0.9 * k; w.crackle = l > 0.12 && l < 0.66 ? 0.25 * k : 0; w.cafe = Math.max(w.cafe, 0.25 * l); }
      else { w.pour = (l < 0.3 ? 0.8 : Math.max(0, 0.8 - (l - 0.3) * 4)) * k; w.cafe = Math.max(w.cafe, 0.3 + 0.6 * l); }
    }
    var t = ctx.currentTime;
    var LEVEL = { roast: 0.1, grind: 0.3, pour: 0.24, music: 1.2 };   /* balanced by measurement (?probe) */
    ["roast", "grind", "pour", "music"].forEach(function (n) {
      layers[n].gain.setTargetAtTime(w[n] * LEVEL[n], t, 0.3);
    });
    /* crackle: beans in the roaster, then the bloom's fizz — random clicks */
    if (w.crackle > 0.02 && Math.random() < w.crackle * 0.18 * fk) {   /* ~10 a second at most */
      burst(t + Math.random() * 0.05, 0.012 + Math.random() * 0.02, 1400 + Math.random() * 2400, 2.5, 0.04 + Math.random() * 0.09 * w.crackle, layers.crackle);
    }
    /* bubbles in the stream while it pours */
    if (w.pour > 0.1 && Math.random() < w.pour * 0.5 * fk) {
      bloop(t + Math.random() * 0.03, 380 + Math.random() * 900, 0.006 + Math.random() * 0.01 * w.pour, layers.bubble);
    }
    /* a cup set down somewhere in the room, now and then — a soft porcelain
       tink, far off */
    if (w.cafe > 0.5 && Math.random() < 0.0025 * fk) {
      var f = 1900 + Math.random() * 600;
      tone(t, f, 0.6, 0.012, layers.clink); tone(t + 0.004, f * 1.51, 0.4, 0.005, layers.clink);
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
      burst(t, 0.025, 3600, 1.4, 0.1, layers.ui); tone(t, 1600, 0.07, 0.035, layers.ui);
    } else if (e.target.closest("[data-order]")) {
      tone(t, 1318.5, 0.9, 0.09, layers.ui); tone(t + 0.12, 1975.5, 1.1, 0.07, layers.ui);
      for (var i = 0; i < 9; i++) burst(t + 0.25 + i * 0.075, 0.06, 2400 + Math.random() * 1200, 0.8, 0.03, layers.ui);
    }
  }, true);
})();

/* ==========================================================================
   Scroll-scrubbed film
   --------------------------------------------------------------------------
   A rendered frame sequence drawn by WebGL. Scroll position picks a point on
   the film's timeline; the two frames either side of that point are blended
   by the fractional part, so a slow scroll glides instead of stepping from
   one still to the next.

   The film is a list of CHAPTERS, each encoded on its own (frames, atlas,
   manifest), so re-rendering one chapter never touches the others. To the
   playhead they are one continuous take: frame indices run straight through.

   Two layers, so it NEVER stutters:
   · ATLAS — a whole chapter, small, on one sheet (~400 KB). Every frame
     exists the moment its chapter's sheet is on the GPU.
   · FULL frames — sharp, decoded on demand. When the pair under the playhead
     is ready it is blended in over ~100 ms; when scrolling outruns decoding the
     player falls back to the atlas for the same frames instead of freezing on
     an old one. A frozen frame reads as lag; a momentarily softer one reads as
     motion blur.

   Memory is the real constraint. A decoded 1600x900 frame is 5.8 MB and an
   uploaded atlas 20-35 MB, so full frames stay COMPRESSED (Blob) once
   downloaded, only a window around the playhead is decoded (ImageBitmap,
   LRU), and only the atlases of the chapter under the playhead and the one
   the reader is heading for live on the GPU.
   ========================================================================== */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uA;
uniform sampler2D uB;
uniform sampler2D uAtlasA;   /* the two frames of a pair can sit in different chapters */
uniform sampler2D uAtlasB;
uniform float uMix;
uniform float uHi;
uniform float uTime;
uniform float uGrain;
uniform vec2 uScale;
uniform vec2 uOffset;
uniform vec4 uCellA;      /* col, row, 1/cols, 1/rows */
uniform vec4 uCellB;
uniform vec2 uInset;      /* half a texel of one cell, so cells never bleed */
uniform float uVig;       /* vignette; 0 on the last frames, which must equal the page */
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec2 cell(vec2 uv, vec4 c) {
  uv = clamp(uv, uInset, 1.0 - uInset);
  return vec2((c.x + uv.x) * c.z, (c.y + uv.y) * c.w);
}
void main() {
  vec2 uv = vUv * uScale + uOffset;
  uv.y = 1.0 - uv.y;                                   /* bitmaps are top-down */
  vec3 lo = mix(texture2D(uAtlasA, cell(uv, uCellA)).rgb, texture2D(uAtlasB, cell(uv, uCellB)).rgb, uMix);
  vec3 c = lo;
  if (uHi > 0.0) {
    vec3 hi = mix(texture2D(uA, uv).rgb, texture2D(uB, uv).rgb, uMix);
    c = mix(lo, hi, uHi);
  }
  vec2 d = vUv - 0.5;
  c *= 1.0 - dot(d, d) * uVig;                         /* vignette */
  c += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * uGrain;
  gl_FragColor = vec4(c, 1.0);
}`;

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const BITMAP = { premultiplyAlpha: "none", colorSpaceConversion: "none" };

/* -------------------------------------------------------------- frame store */
class FrameStore {
  constructor(count, urlOf, maxDecoded) {
    this.count = count;
    this.urlOf = urlOf;
    this.blobs = new Array(count);
    this.asked = new Uint8Array(count);
    this.bitmaps = new Map();          /* index -> ImageBitmap, insertion order = LRU */
    this.pending = new Map();          /* index -> Promise while decoding */
    this.maxDecoded = maxDecoded;
    this.maxPending = 3;               /* the pair under the playhead must never queue behind lookahead */
    this.loaded = 0;
    this.bytes = 0;
    this.decodeMs = [];
    this.focus = 0;                    /* playhead, set by the film every frame */
    this.dir = 1;
  }

  /* Download outward from the reader, ahead of them first. The atlas already
     covers every frame, so what is worth bandwidth is sharpness where the
     reader is about to be, not a coarse pass over a film they may never reach. */
  next() {
    let best = -1, bestD = Infinity;
    for (let i = 0; i < this.count; i++) {
      if (this.asked[i]) continue;
      const ahead = (i - this.focus) * this.dir;
      const d = ahead >= 0 ? ahead : -ahead * 2.5;
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  download() {
    const worker = async () => {
      for (let i = this.next(); i >= 0; i = this.next()) {
        this.asked[i] = 1;
        try {
          const blob = await (await fetch(this.urlOf(i))).blob();
          this.blobs[i] = blob;
          this.loaded++;
          this.bytes += blob.size;
        } catch (e) { /* a missing frame falls back to the atlas */ }
      }
    };
    for (let k = 0; k < 6; k++) worker();
  }

  get(i) {
    const b = this.bitmaps.get(i);
    if (b) { this.bitmaps.delete(i); this.bitmaps.set(i, b); }   /* touch */
    return b || null;
  }

  /* `urgent` decodes are the frames on screen: they may exceed the pending cap */
  decode(i, urgent) {
    if (i < 0 || i >= this.count || this.bitmaps.has(i) || this.pending.has(i) || !this.blobs[i]) return;
    if (!urgent && this.pending.size >= this.maxPending) return;
    const t = performance.now();
    const p = createImageBitmap(this.blobs[i], BITMAP)
      .then((bmp) => {
        this.pending.delete(i);
        this.decodeMs.push(performance.now() - t);
        if (this.decodeMs.length > 30) this.decodeMs.shift();
        this.bitmaps.set(i, bmp);
        while (this.bitmaps.size > this.maxDecoded) {
          const [old, ob] = this.bitmaps.entries().next().value;
          this.bitmaps.delete(old);
          ob.close();
        }
      })
      .catch(() => this.pending.delete(i));
    this.pending.set(i, p);
  }
}

/* -------------------------------------------------------------- renderer */
class GLRenderer {
  constructor(canvas) {
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) throw new Error("no webgl");
    this.gl = gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    this.u = {};
    for (const n of ["uA", "uB", "uAtlasA", "uAtlasB", "uMix", "uHi", "uTime", "uGrain", "uScale", "uOffset", "uCellA", "uCellB", "uInset", "uVig"]) {
      this.u[n] = gl.getUniformLocation(prog, n);
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.tex = [this.makeTex(0), this.makeTex(1)];
    this.held = [-1, -1];             /* frame index currently in each full-frame texture */
    this.blank = this.makeTex(2);
    this.bound = [this.blank, null];  /* texture on atlas units 2 and 3 */
    this.bindAtlas(3, null);
    gl.uniform1i(this.u.uA, 0);
    gl.uniform1i(this.u.uB, 1);
    gl.uniform1i(this.u.uAtlasA, 2);
    gl.uniform1i(this.u.uAtlasB, 3);
    this.atlases = new Map();         /* chapter -> { tex, meta } */
    this.frameW = 16; this.frameH = 9;
  }

  makeTex(unit) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    return t;
  }

  addAtlas(k, bmp, meta) {
    const gl = this.gl;
    const tex = this.makeTex(4);      /* a spare unit: 0-3 keep what is on screen */
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);   /* RGBA: the bitmap's own layout, no CPU repack */
    this.atlases.set(k, { tex, meta });
    gl.uniform2f(this.u.uInset, 0.5 / meta.cw, 0.5 / meta.ch);
  }

  dropAtlas(k) {
    const at = this.atlases.get(k);
    if (!at) return;
    this.gl.deleteTexture(at.tex);    /* deleting also unbinds it from units 2/3 */
    this.atlases.delete(k);
    this.bound = this.bound.map((t) => (t === at.tex ? null : t));
  }

  bindAtlas(unit, at) {
    const tex = at ? at.tex : this.blank;
    if (this.bound[unit - 2] === tex) return;
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    this.bound[unit - 2] = tex;
  }

  upload(slot, index, bmp) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[slot]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);   /* RGBA: the bitmap's own layout, no CPU repack */
    this.held[slot] = index;
  }

  /* Put frame a in slot 0 and b in slot 1, re-using what is already on the
     GPU. Moving forward by one frame is a swap plus ONE upload, not two. */
  show(a, bmpA, b, bmpB) {
    if (this.held[1] === a && this.held[0] !== a) {
      this.tex.reverse(); this.held.reverse();
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex[0]);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tex[1]);
    }
    if (this.held[0] !== a) this.upload(0, a, bmpA);
    if (this.held[1] !== b) this.upload(1, b, bmpB);
  }

  cellOf(at, local) {
    if (!at) return [0, 0, 1, 1];
    const m = at.meta;
    return [local % m.cols, Math.floor(local / m.cols), 1 / m.cols, 1 / m.rows];
  }

  /* atA/atB: the atlas of each frame's chapter; la/lb: index inside it */
  draw(atA, la, atB, lb, mix, hi, time, grain, cw, ch, vig = 0.55) {
    const gl = this.gl;
    gl.viewport(0, 0, cw, ch);
    /* object-fit: cover, done in the shader */
    const fa = this.frameW / this.frameH, ca = cw / ch;
    let sx = 1, sy = 1;
    if (ca > fa) sy = fa / ca; else sx = ca / fa;
    gl.uniform2f(this.u.uScale, sx, sy);
    gl.uniform2f(this.u.uOffset, (1 - sx) / 2, (1 - sy) / 2);
    this.bindAtlas(2, atA);
    this.bindAtlas(3, atB);
    gl.uniform4fv(this.u.uCellA, this.cellOf(atA, la));
    gl.uniform4fv(this.u.uCellB, this.cellOf(atB, lb));
    gl.uniform1f(this.u.uMix, mix);
    gl.uniform1f(this.u.uHi, hi);
    gl.uniform1f(this.u.uTime, time);
    gl.uniform1f(this.u.uGrain, grain);
    gl.uniform1f(this.u.uVig, vig);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

/* -------------------------------------------------------------- film */
export async function mountFilm(root) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const params = new URLSearchParams(location.search);
  const filmUrl = new URL(root.dataset.manifest, location.href);
  const film = await (await fetch(filmUrl)).json();
  /* ?m=<file> loads an alternative manifest in every chapter folder — used to
     compare encodings (WebP vs AVIF decode time) on a real device. */
  const alt = params.get("m");
  const chName = alt && /^[\w.-]+\.json$/.test(alt) ? alt : "manifest.json";
  const aspect = innerHeight > innerWidth ? "9x16" : "16x9";
  const chapters = await Promise.all(film.chapters.map(async (c) => {
    const dir = new URL(c.dir, filmUrl);
    const m = await (await fetch(new URL(chName, dir))).json();
    return { dir, v: m.variants[aspect], count: m.frames, first: 0, q: m.rev ? `?r=${m.rev}` : "" };
  }));
  let n = 0;
  for (const c of chapters) { c.first = n; n += c.count; }
  const chOf = (i) => { let k = chapters.length - 1; while (k > 0 && i < chapters[k].first) k--; return k; };
  const variant = chapters[0].v;
  const pad = (i) => String(i + 1).padStart(4, "0");
  const urlOf = (i) => {
    const c = chapters[chOf(i)];
    return new URL(`${c.v.path}${pad(i - c.first)}.${c.v.ext}${c.q}`, c.dir).href;
  };

  const stage = root.querySelector(".film__stage");
  const canvas = root.querySelector(".film__canvas");
  /* data-in / data-out are fractions of the beat's own chapter (data-ch,
     1-based), so retiming one chapter never moves another chapter's words */
  const beats = [...root.querySelectorAll("[data-in]")].filter((el) => {
    /* a beat for a chapter the manifest does not list (yet) stays hidden */
    return (parseInt(el.dataset.ch, 10) || 1) <= chapters.length;
  }).map((el) => {
    const c = chapters[(parseInt(el.dataset.ch, 10) || 1) - 1];
    const g = (x) => (c.first + parseFloat(x) * (c.count - 1)) / Math.max(1, n - 1);
    return {
      el,
      a: g(el.dataset.in),
      b: g(el.dataset.out),
      lines: [...el.querySelectorAll(".film__line > span")],
      rest: [...el.querySelectorAll(".film__label, .film__lead")],
    };
  });
  const html = document.documentElement;
  const setMode = (m) => { if (html.dataset.film !== m) html.dataset.film = m; };
  const still = () => {
    root.classList.add("is-still");
    root.style.height = "";
    beats.forEach((bt, k) => bt.el.classList.toggle("is-on", k === 0));
    new IntersectionObserver(([e]) => setMode(e.isIntersecting ? "dark" : "")).observe(root);
  };

  if (reduced) { still(); return; }

  const fine = matchMedia("(pointer: fine)").matches;
  const mem = navigator.deviceMemory || 4;
  const store = new FrameStore(n, urlOf, fine ? 32 : mem >= 6 ? 20 : 12);
  let renderer = null;
  try { renderer = new GLRenderer(canvas); } catch (e) { still(); return; }
  renderer.frameW = variant.w; renderer.frameH = variant.h;

  /* Atlas sheets are small compressed files: fetched once and kept, so a
     chapter's GPU copy can be dropped and re-made without the network. */
  const sheets = new Array(chapters.length);
  const sheet = (k) => (sheets[k] ||= fetch(new URL(chapters[k].v.atlas.file + chapters[k].q, chapters[k].dir).href).then((r) => {
    if (!r.ok) throw new Error(r.status);
    return r.blob();
  }));
  let wanted = new Set([0]);
  const making = new Set();
  const ensureAtlas = (k) => {
    if (k < 0 || k >= chapters.length || renderer.atlases.has(k) || making.has(k)) return;
    making.add(k);
    sheet(k)
      .then((blob) => createImageBitmap(blob, BITMAP))
      .then((bmp) => { if (wanted.has(k)) renderer.addAtlas(k, bmp, chapters[k].v.atlas); bmp.close(); kick(); })
      .catch(() => {})
      .finally(() => making.delete(k));
  };

  /* The first atlas comes first: once it is on the GPU the opening chapter can
     be scrubbed, before a single full frame has arrived. */
  try {
    const bmp = await createImageBitmap(await sheet(0), BITMAP);
    renderer.addAtlas(0, bmp, chapters[0].v.atlas);
    bmp.close();
  } catch (e) { still(); return; }
  store.download();
  setTimeout(() => chapters.forEach((_, k) => sheet(k).catch(() => {})), 2500);

  /* Every frame is the same scroll distance, so the film is as long as it has
     frames. On the site it is followed by a HOLD: the last frame stays while
     the film fades out over the live WebGL cup drawn behind it in the same
     pose (scene.js reads where that happens from the film:layout event). */
  const handoff = !!film.handoff;
  const HOLD_VH = handoff ? film.holdVh || 45 : 0;
  const last = chapters[chapters.length - 1];
  root.style.height = `${((n - 1) * film.vhPerFrame + HOLD_VH + 100).toFixed(1)}vh`;

  let cw = 0, ch = 0, top = 0, span = 1, holdPx = 0;
  const measure = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cw = Math.round(stage.clientWidth * dpr);
    ch = Math.round(stage.clientHeight * dpr);
    canvas.width = cw; canvas.height = ch;
    const r = root.getBoundingClientRect();
    top = r.top + scrollY;
    span = Math.max(1, ((n - 1) * film.vhPerFrame / 100) * innerHeight);
    holdPx = (HOLD_VH / 100) * innerHeight;
    const detail = { start: top + span, end: top + span + holdPx, aspect, handoff };
    window.__filmLayout = detail;
    window.dispatchEvent(new CustomEvent("film:layout", { detail }));
  };
  measure();
  addEventListener("resize", measure);
  if ("ResizeObserver" in window) new ResizeObserver(measure).observe(root);

  /* Only run while the film is on screen. */
  let visible = true;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) kick(); else setMode("");
  }).observe(root);

  const hud = params.has("debug") ? root.querySelector(".film__hud") : null;
  if (hud) hud.hidden = false;
  const forceLo = params.has("lo");     /* debug: atlas only, to see the fallback layer */
  /* ?probe: per-frame log for the automated smoothness test (_film/perf.mjs) */
  const probe = params.has("probe") ? (window.__film = { log: [] }) : null;

  /* Touch scrolling is native and inertial, wheel scrolling is already eased
     by scroll.js — the frame still gets its own light easing so a flick reads
     as a camera move rather than a jump cut. */
  const RATE = fine ? 18 : 11;
  let shown = 0, lastT = performance.now(), running = false, fpsT = lastT, fpsN = 0, fps = 0, stageO = 1, endShown = -1;
  let vel = 0, lastTarget = 0, hi = 0, hiFrames = 0, loFrames = 0, ahead = 3;
  /* The opening beat (data-in="0") must not wait for a scroll: a visitor who
     has not scrolled yet is exactly who needs the headline. It enters on a
     clock once the first frame is up, and leaves by scroll like every other. */
  let introT0 = 0, introP = 0;
  const INTRO_MS = 1300;

  function frame(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000) || 0.016;
    lastT = now;
    const p = Math.min(1, Math.max(0, (scrollY - top) / span));
    const hold = handoff ? Math.min(1, Math.max(0, (scrollY - top - span) / Math.max(1, holdPx))) : 0;
    const target = p * (n - 1);
    shown += (target - shown) * (1 - Math.exp(-RATE * dt));
    if (Math.abs(target - shown) < 0.002) shown = target;
    vel += ((target - lastTarget) / dt - vel) * 0.25;          /* frames per second, smoothed */
    lastTarget = target;

    const a = Math.floor(shown), b = Math.min(n - 1, a + 1), t = shown - a;
    const dir = vel >= 0 ? 1 : -1;
    store.focus = a; store.dir = dir;

    /* GPU memory: keep the atlas under the playhead and the neighbour the
       reader is heading for — added past the chapter's middle, dropped only a
       quarter back, so hovering around the middle never thrashes uploads */
    const ka = chOf(a), kb = chOf(b);
    const c = chapters[ka];
    const local = (shown - c.first) / Math.max(1, c.count - 1);
    wanted = new Set([ka, kb]);
    if (local > 0.5 || (local > 0.25 && renderer.atlases.has(ka + 1))) wanted.add(ka + 1);
    if (local < 0.5 || (local < 0.75 && renderer.atlases.has(ka - 1))) wanted.add(ka - 1);
    for (const k of wanted) ensureAtlas(k);
    for (const k of [...renderer.atlases.keys()]) if (!wanted.has(k)) renderer.dropAtlas(k);
    const atA = renderer.atlases.get(ka) || null, atB = renderer.atlases.get(kb) || null;

    /* the pair on screen first (urgent), then further ahead the faster we go */
    store.decode(a, true); store.decode(b, true);
    ahead = Math.min(16, Math.max(3, Math.ceil(Math.abs(vel) * 0.22)));
    for (let k = 2; k <= ahead; k++) store.decode(a + dir * k, false);

    const bmpA = store.get(a), bmpB = store.get(b);
    let hiTarget = 0;
    if (bmpA && bmpB && !forceLo) { renderer.show(a, bmpA, b, bmpB); hiTarget = 1; }
    /* Sharp frames ease IN (no pop); a missing pair drops to the atlas at once,
       because the textures still hold the OLD frames and must not be shown.
       With no atlas yet (a chapter's sheet still on its way) sharp is all there
       is; with neither, the canvas keeps its last picture. */
    const lo = atA && atB;
    hi = hiTarget ? (lo ? hi + (1 - hi) * (1 - Math.exp(-dt / 0.09)) : 1) : 0;
    if (hiTarget) hiFrames++; else loFrames++;

    /* The last frames ARE the page: vignette, grain and the type scrim fade
       out over the end of the last chapter, then the film itself fades over
       the live cup during the hold. */
    const endP = handoff && shown >= last.first ? smooth(0.7, 0.96, (shown - last.first) / Math.max(1, last.count - 1)) : 0;
    if (lo || hiTarget) renderer.draw(atA, a - c.first, atB, b - chapters[kb].first, t, hi, now / 1000, 0.045 * (1 - endP), cw, ch, 0.55 * (1 - endP));
    if (Math.abs(endP - endShown) > 0.002) { endShown = endP; root.style.setProperty("--film-end", endP.toFixed(3)); }
    const o = handoff ? 1 - smooth(0.1, 0.9, hold) : 1;
    if (Math.abs(o - stageO) > 0.001) { stageO = o; stage.style.opacity = o.toFixed(3); }
    /* the page's header and rail follow what is behind them: the night film,
       the cream end of it, or (once it has ended / mostly scrolled away) the page */
    const past = scrollY - top - span - holdPx;
    setMode(handoff ? (past >= 0 ? "" : endP < 0.5 ? "dark" : "light") : past > innerHeight * 0.5 ? "" : "dark");
    if (probe) probe.log.push([now, shown, hi, store.pending.size]);
    if (!introT0) { introT0 = now; root.classList.add("is-live"); }
    introP = Math.min(1, (now - introT0) / INTRO_MS);

    /* headlines: a strict sequence — a beat leaves completely before the next
       one starts, so two headlines never share the screen */
    for (const bt of beats) {
      const len = bt.b - bt.a;
      const inP = bt.a <= 0 ? introP : smooth(bt.a, bt.a + len * 0.28, p);
      const outP = smooth(bt.b - len * 0.22, bt.b, p);
      const on = inP > 0 && outP < 1;
      bt.el.classList.toggle("is-on", on);
      if (!on) continue;
      bt.lines.forEach((ln, k) => {
        const li = easeOut(Math.min(1, Math.max(0, inP * 1.25 - k * 0.18)));
        const lo = easeOut(Math.min(1, Math.max(0, outP * 1.25 - k * 0.12)));
        ln.style.transform = `translate3d(0, ${(1 - li) * 105 - lo * 105}%, 0)`;
      });
      /* label and lead leave WITH the headline, not after it — a lead left on
         screen once its title has gone reads as an orphaned caption */
      const r = inP * (1 - smooth(0, 0.7, outP));
      bt.rest.forEach((el) => { el.style.opacity = r.toFixed(3); el.style.transform = `translate3d(0, ${(1 - r) * 12}px, 0)`; });
    }

    if (hud && (fpsN++, now - fpsT > 500)) {
      fps = Math.round((fpsN * 1000) / (now - fpsT)); fpsT = now; fpsN = 0;
      const avg = store.decodeMs.length ? store.decodeMs.reduce((s, v) => s + v, 0) / store.decodeMs.length : 0;
      const sharp = hiFrames + loFrames ? Math.round((hiFrames * 100) / (hiFrames + loFrames)) : 0;
      hud.textContent = `ch ${ka + 1}/${chapters.length}  frame ${shown.toFixed(1)}/${n - 1}  fps ${fps}  sharp ${sharp}%  v ${vel.toFixed(0)}f/s  ahead ${ahead}  loaded ${store.loaded}/${n} (${(store.bytes / 1048576).toFixed(1)} MB)  decoded ${store.bitmaps.size}  atlases ${[...renderer.atlases.keys()].map((k) => k + 1).join(",")}  decode ${avg.toFixed(1)} ms  ${variant.w}x${variant.h} ${variant.ext}`;
    }

    /* Keep running only while something is still changing on screen: the
       playhead easing, a decode in flight, the sharp layer fading in (which
       also covers "the pair has not downloaded yet"), the intro. */
    if (visible && (Math.abs(target - shown) > 0.001 || store.pending.size || making.size || introP < 1 || hi < 0.999 || hud)) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  function kick() {
    if (running) return;
    running = true;
    lastT = performance.now();
    requestAnimationFrame(frame);
  }
  addEventListener("scroll", kick, { passive: true });
  kick();
}

const el = document.querySelector("[data-film]");
if (el) mountFilm(el);

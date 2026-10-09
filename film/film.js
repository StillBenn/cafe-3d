/* ==========================================================================
   Scroll-scrubbed film
   --------------------------------------------------------------------------
   A rendered frame sequence drawn by WebGL. Scroll position picks a point on
   the film's timeline; the two frames either side of that point are blended
   by the fractional part, so a slow scroll glides instead of stepping from
   one still to the next.

   Memory is the real constraint, not bandwidth. A decoded 1280x720 frame is
   3.7 MB; a whole chapter decoded at once would be half a gigabyte and a
   phone would kill the tab. So:
   · every frame is kept COMPRESSED (a Blob, ~50 KB) once downloaded;
   · only a small window around the playhead is decoded (ImageBitmap, LRU);
   · the GPU holds exactly two frames — the pair being blended.

   Download order is temporal level-of-detail: every 16th frame first, then
   8th, 4th, 2nd, all. The film is scrubbable end to end within the first
   few hundred KB, and simply gets smoother as the rest arrives.
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
uniform float uMix;
uniform float uTime;
uniform float uGrain;
uniform vec2 uScale;
uniform vec2 uOffset;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 uv = vUv * uScale + uOffset;
  uv.y = 1.0 - uv.y;                                  /* bitmaps are top-down */
  vec3 c = mix(texture2D(uA, uv).rgb, texture2D(uB, uv).rgb, uMix);
  vec2 d = vUv - 0.5;
  c *= 1.0 - dot(d, d) * 0.55;                        /* vignette */
  c += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * uGrain;
  gl_FragColor = vec4(c, 1.0);
}`;

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/* -------------------------------------------------------------- frame store */
class FrameStore {
  constructor(count, urlOf, maxDecoded) {
    this.count = count;
    this.urlOf = urlOf;
    this.blobs = new Array(count);
    this.bitmaps = new Map();          /* index -> ImageBitmap, insertion order = LRU */
    this.pending = new Map();          /* index -> Promise while decoding */
    this.maxDecoded = maxDecoded;
    this.loaded = 0;
    this.bytes = 0;
    this.decodeMs = [];
  }

  download(onFirst) {
    const order = [];
    const seen = new Set();
    for (const stride of [16, 8, 4, 2, 1]) {
      for (let i = 0; i < this.count; i += stride) {
        if (!seen.has(i)) { seen.add(i); order.push(i); }
      }
      if (!seen.has(this.count - 1)) { seen.add(this.count - 1); order.push(this.count - 1); }
    }
    let next = 0;
    const worker = async () => {
      while (next < order.length) {
        const i = order[next++];
        try {
          const res = await fetch(this.urlOf(i));
          const blob = await res.blob();
          this.blobs[i] = blob;
          this.loaded++;
          this.bytes += blob.size;
          if (i === 0 && onFirst) onFirst();
        } catch (e) { /* a missing frame is covered by its neighbours */ }
      }
    };
    for (let k = 0; k < 6; k++) worker();
  }

  /* nearest index that has been DOWNLOADED (searching outward) */
  nearestBlob(i) {
    for (let r = 0; r < this.count; r++) {
      if (i - r >= 0 && this.blobs[i - r]) return i - r;
      if (i + r < this.count && this.blobs[i + r]) return i + r;
    }
    return -1;
  }

  get(i) {
    const b = this.bitmaps.get(i);
    if (b) { this.bitmaps.delete(i); this.bitmaps.set(i, b); }   /* touch */
    return b || null;
  }

  decode(i) {
    if (i < 0 || i >= this.count || this.bitmaps.has(i) || this.pending.has(i) || !this.blobs[i]) return;
    const t = performance.now();
    const p = createImageBitmap(this.blobs[i]).then((bmp) => {
      this.pending.delete(i);
      this.decodeMs.push(performance.now() - t);
      if (this.decodeMs.length > 30) this.decodeMs.shift();
      this.bitmaps.set(i, bmp);
      while (this.bitmaps.size > this.maxDecoded) {
        const [old, ob] = this.bitmaps.entries().next().value;
        this.bitmaps.delete(old);
        ob.close();
      }
    }).catch(() => this.pending.delete(i));
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
    for (const n of ["uA", "uB", "uMix", "uTime", "uGrain", "uScale", "uOffset"]) this.u[n] = gl.getUniformLocation(prog, n);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.tex = [this.makeTex(0), this.makeTex(1)];
    this.held = [-1, -1];             /* frame index currently in each texture */
    gl.uniform1i(this.u.uA, 0);
    gl.uniform1i(this.u.uB, 1);
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
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
    return t;
  }

  upload(slot, index, bmp) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[slot]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, bmp);
    this.held[slot] = index;
    this.frameW = bmp.width; this.frameH = bmp.height;
  }

  /* Put frame a in slot 0 and frame b in slot 1, re-using what is already on
     the GPU. Moving forward by one frame is a swap plus ONE upload, not two. */
  show(a, bmpA, b, bmpB) {
    if (this.held[1] === a && this.held[0] !== a) {
      this.tex.reverse(); this.held.reverse();
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex[0]);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tex[1]);
    }
    if (this.held[0] !== a && bmpA) this.upload(0, a, bmpA);
    if (this.held[1] !== b && bmpB) this.upload(1, b, bmpB);
  }

  draw(mix, time, grain, cw, ch) {
    const gl = this.gl;
    gl.viewport(0, 0, cw, ch);
    /* object-fit: cover, done in the shader */
    const fa = this.frameW / this.frameH, ca = cw / ch;
    let sx = 1, sy = 1;
    if (ca > fa) sy = fa / ca; else sx = ca / fa;
    gl.uniform2f(this.u.uScale, sx, sy);
    gl.uniform2f(this.u.uOffset, (1 - sx) / 2, (1 - sy) / 2);
    gl.uniform1f(this.u.uMix, mix);
    gl.uniform1f(this.u.uTime, time);
    gl.uniform1f(this.u.uGrain, grain);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

/* -------------------------------------------------------------- film */
export async function mountFilm(root) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* ?m=<file> loads an alternative manifest next to the default one — used to
     compare encodings (WebP vs AVIF decode time) on a real device. */
  const alt = new URLSearchParams(location.search).get("m");
  const manifestUrl = alt && /^[\w.-]+\.json$/.test(alt)
    ? new URL(alt, new URL(root.dataset.manifest, location.href)).href
    : root.dataset.manifest;
  const manifest = await (await fetch(manifestUrl)).json();
  const portrait = () => innerHeight > innerWidth;
  const variant = manifest.variants[portrait() ? "9x16" : "16x9"];
  const base = new URL(manifestUrl, location.href);
  const pad = (i) => String(i + 1).padStart(4, "0");
  const urlOf = (i) => new URL(`${variant.path}${pad(i)}.${variant.ext}`, base).href;

  const stage = root.querySelector(".film__stage");
  const canvas = root.querySelector(".film__canvas");
  const beats = [...root.querySelectorAll("[data-in]")].map((el) => ({
    el,
    a: parseFloat(el.dataset.in),
    b: parseFloat(el.dataset.out),
    lines: [...el.querySelectorAll(".film__line > span")],
    rest: [...el.querySelectorAll(".film__label, .film__lead")],
  }));

  if (reduced) {
    root.classList.add("is-still");
    beats.forEach((bt, k) => bt.el.classList.toggle("is-on", k === 0));
    return;
  }

  const n = manifest.frames;
  const fine = matchMedia("(pointer: fine)").matches;
  const store = new FrameStore(n, urlOf, fine ? 24 : 12);
  let renderer = null;
  try { renderer = new GLRenderer(canvas); } catch (e) { root.classList.add("is-still"); return; }

  store.download(() => root.classList.add("is-ready"));

  let cw = 0, ch = 0, top = 0, span = 1;
  const measure = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cw = Math.round(stage.clientWidth * dpr);
    ch = Math.round(stage.clientHeight * dpr);
    canvas.width = cw; canvas.height = ch;
    const r = root.getBoundingClientRect();
    top = r.top + scrollY;
    span = Math.max(1, root.offsetHeight - innerHeight);
  };
  measure();
  addEventListener("resize", measure);
  if ("ResizeObserver" in window) new ResizeObserver(measure).observe(root);

  /* Only run while the film is on screen. */
  let visible = true;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) kick();
  }).observe(root);

  const hud = new URLSearchParams(location.search).has("debug") ? root.querySelector(".film__hud") : null;
  if (hud) hud.hidden = false;

  /* Touch scrolling is native and inertial, wheel scrolling is already eased
     by scroll.js — the frame still gets its own light easing so a flick reads
     as a camera move rather than a jump cut. */
  const RATE = fine ? 18 : 11;
  let shown = 0, last = performance.now(), running = false, fpsT = last, fpsN = 0, fps = 0;
  /* The opening beat (data-in="0") must not wait for a scroll: a visitor who
     has not scrolled yet is exactly who needs the headline. It enters on a
     clock once the first frame is up, and leaves by scroll like every other. */
  let introT0 = 0, introP = 0;
  const INTRO_MS = 1300;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const p = Math.min(1, Math.max(0, (scrollY - top) / span));
    const target = p * (n - 1);
    shown += (target - shown) * (1 - Math.exp(-RATE * dt));
    if (Math.abs(target - shown) < 0.002) shown = target;

    const a = Math.floor(shown), b = Math.min(n - 1, a + 1), t = shown - a;
    /* decode the pair, then a few frames ahead in the direction of travel */
    const dir = target >= shown ? 1 : -1;
    store.decode(a); store.decode(b);
    for (let k = 2; k <= 5; k++) store.decode(a + dir * k);

    let bmpA = store.get(a), bmpB = store.get(b), ia = a, ib = b, mix = t;
    if (!bmpA || !bmpB) {
      /* not decoded yet: hold the nearest frame we DO have, no blend */
      const near = bmpA ? a : bmpB ? b : null;
      if (near !== null) { ia = ib = near; bmpA = bmpB = store.get(near); mix = 0; }
      else {
        const nb = store.nearestBlob(a);
        if (nb >= 0) store.decode(nb);
        ia = ib = renderer.held[0]; mix = 0;
      }
    }
    if (bmpA) renderer.show(ia, bmpA, ib, bmpB);
    if (renderer.held[0] >= 0) {
      renderer.draw(ia === ib ? 0 : mix, now / 1000, 0.045, cw, ch);
      root.classList.add("is-live");
      if (!introT0) introT0 = now;
    }
    introP = introT0 ? Math.min(1, (now - introT0) / INTRO_MS) : 0;

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
      hud.textContent = `frame ${shown.toFixed(2)}/${n - 1}  fps ${fps}  loaded ${store.loaded}/${n} (${(store.bytes / 1048576).toFixed(1)} MB)  decoded ${store.bitmaps.size}  decode ${avg.toFixed(1)} ms  ${variant.w}x${variant.h} ${variant.ext}`;
    }

    if (visible && (Math.abs(target - shown) > 0.001 || store.pending.size || store.loaded < n || introP < 1 || hud)) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  function kick() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  addEventListener("scroll", kick, { passive: true });
  kick();
}

const el = document.querySelector("[data-film]");
if (el) mountFilm(el);

/* ==========================================================================
   The coffee reading — "Fincanını kapat"
   --------------------------------------------------------------------------
   After a Turkish coffee, in Istanbul, the cup is turned over onto its
   saucer, left to cool, and what the grounds left on the porcelain is read.
   This is that ritual, in 3D: make a wish, turn the cup, wait, lift it — and
   the shapes in the grounds are read one by one, the cup turning to show
   each. Loaded only when opened (js/site.js imports it on the first click).

   Honest by construction: the shapes are really IN the grounds — drawn into
   the telve's own pattern, eroded at the edges like everything around them —
   so the reading names exactly what the reader can see. The same person gets
   the same reading for the whole day (the name on the cup and the date seed
   it): re-rolling for a better one is not how a fal works.
   "Fala inanma, falsız da kalma."
   ========================================================================== */
import * as THREE from "./vendor/three/three.module.min.js";

const T = (s) => (window.NR ? window.NR.t(s) : s);
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --- what a shape means, and where it sits --------------------------------- */
const SYMBOLS = {
  bird:     { name: "Bird",     say: "News is on its way — from far off, and good." },
  fish:     { name: "Fish",     say: "Kısmet: plenty, from where you did not expect it." },
  road:     { name: "Road",     say: "A journey shows — short, or just across the Bosphorus." },
  heart:    { name: "Heart",    say: "Someone thinks of you more than you know." },
  key:      { name: "Key",      say: "A door you thought was shut is opening." },
  tree:     { name: "Tree",     say: "You are putting down roots: health, and quiet." },
  eye:      { name: "Eye",      say: "There is an evil eye about — keep a blue bead in your pocket." },
  ring:     { name: "Ring",     say: "A promise will be made — or kept." },
  mountain: { name: "Mountain", say: "Something stands in the way, but the path goes over it." },
  house:    { name: "House",    say: "A change at home, and it lets the light in." },
  moon:     { name: "Crescent", say: "The wish you made will come — give it a little time." },
  star:     { name: "Star",     say: "Luck is on your side; be brave this week." }
};
const PLACES = [
  { where: "By the handle", means: "about you, and your home" },
  { where: "Near the rim",  means: "soon" },
  { where: "Down in the cup", means: "in time — or from the past" }
];

/* a small seeded generator: the same seed, the same reading */
function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/* --- the shapes, drawn in a 100x100 box ------------------------------------ */
function drawShape(g, kind) {
  g.lineCap = "round"; g.lineJoin = "round";
  const P = () => g.beginPath();
  switch (kind) {
    case "bird": P(); g.lineWidth = 13; g.moveTo(8, 58); g.quadraticCurveTo(28, 28, 50, 54); g.quadraticCurveTo(72, 28, 92, 58); g.stroke(); P(); g.arc(50, 56, 6, 0, 7); g.fill(); break;
    case "fish": P(); g.ellipse(44, 50, 30, 16, 0, 0, 7); g.fill(); P(); g.moveTo(70, 50); g.lineTo(94, 32); g.lineTo(90, 50); g.lineTo(94, 68); g.closePath(); g.fill(); break;
    case "road": P(); g.lineWidth = 14; g.moveTo(30, 96); g.bezierCurveTo(78, 74, 18, 46, 60, 26); g.quadraticCurveTo(76, 16, 68, 4); g.stroke(); break;
    case "heart": P(); g.moveTo(50, 88); g.bezierCurveTo(14, 64, 6, 40, 22, 26); g.bezierCurveTo(36, 14, 48, 24, 50, 36); g.bezierCurveTo(52, 24, 64, 14, 78, 26); g.bezierCurveTo(94, 40, 86, 64, 50, 88); g.fill(); break;
    case "key": P(); g.lineWidth = 13; g.arc(24, 50, 15, 0, 7); g.stroke(); P(); g.moveTo(39, 50); g.lineTo(92, 50); g.moveTo(80, 50); g.lineTo(80, 66); g.moveTo(68, 50); g.lineTo(68, 62); g.stroke(); break;
    case "tree": P(); g.fillRect(45, 56, 10, 40); P(); g.arc(50, 34, 22, 0, 7); g.arc(32, 46, 15, 0, 7); g.arc(68, 46, 15, 0, 7); g.fill(); break;
    case "eye": P(); g.lineWidth = 12; g.moveTo(8, 50); g.quadraticCurveTo(50, 12, 92, 50); g.quadraticCurveTo(50, 88, 8, 50); g.stroke(); P(); g.arc(50, 50, 12, 0, 7); g.fill(); break;
    case "ring": P(); g.lineWidth = 13; g.arc(50, 58, 25, 0, 7); g.stroke(); P(); g.moveTo(50, 12); g.lineTo(60, 24); g.lineTo(50, 36); g.lineTo(40, 24); g.closePath(); g.fill(); break;
    case "mountain": P(); g.moveTo(4, 90); g.lineTo(38, 22); g.lineTo(56, 56); g.lineTo(68, 40); g.lineTo(96, 90); g.closePath(); g.fill(); break;
    case "house": P(); g.moveTo(14, 46); g.lineTo(50, 12); g.lineTo(86, 46); g.lineTo(78, 46); g.lineTo(78, 92); g.lineTo(22, 92); g.lineTo(22, 46); g.closePath(); g.fill(); g.globalCompositeOperation = "destination-out"; P(); g.fillRect(40, 58, 20, 34); g.globalCompositeOperation = "lighter"; break;
    case "moon": P(); g.arc(50, 50, 38, 0.6, 5.7); g.arc(66, 44, 30, 5.2, 1.1, true); g.closePath(); g.fill(); break;
    case "star": P(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 17 : 42; g.lineTo(50 + Math.cos(a) * r, 52 + Math.sin(a) * r); } g.closePath(); g.fill(); break;
  }
}

/* The three shapes, each in its own colour channel, so the shader can light
   up one of them at a time. u runs around the cup, v from the bottom (0) to
   the rim (1); the canvas is drawn upside down to match (flipY). */
function symbolTexture(picks) {
  const W = 2048, H = 1024;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "lighter";
  const canFilter = "filter" in g;
  picks.forEach((s, i) => {
    const col = ["#ff0000", "#00ff00", "#0000ff"][i];
    const size = s.size * W;                      /* the shape's width in pixels */
    for (const du of [-1, 0, 1]) {                /* drawn again either side of the seam */
      g.save();
      g.translate((s.u + du) * W, (1 - s.v) * H);
      g.rotate(s.rot);
      g.scale(size / 100, size / 100 * 0.92);
      g.translate(-50, -50);
      g.fillStyle = g.strokeStyle = col;
      if (canFilter) g.filter = "blur(" + (size * 0.045).toFixed(1) + "px)";   /* soft: the edge the grounds erode */
      else { g.shadowColor = col; g.shadowBlur = 6; }
      drawShape(g, s.kind);
      g.restore();
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/* --- the telve: a shader on the cup's inside ------------------------------- */
const NOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*snoise(p);p=p*2.03+17.1;a*=.5;}return s*.5+.5;}
`;

function telveMaterial(symTex, seed) {
  const one = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  one.needsUpdate = true;
  const mat = new THREE.MeshPhysicalMaterial({
    map: one, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.18, color: 0xffffff
  });
  const U = {
    uSym: { value: symTex }, uSeed: { value: new THREE.Vector3(seed * 13.7, seed * 7.3, seed * 3.1) },
    uReveal: { value: 0 }, uHi: { value: new THREE.Vector3(0, 0, 0) }, uTime: { value: 0 }
  };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform sampler2D uSym; uniform vec3 uSeed; uniform float uReveal; uniform vec3 uHi; uniform float uTime;\nfloat telveD; \n" + NOISE)
      .replace("#include <map_fragment>", /* glsl */`
        {
          float a = vMapUv.x * 6.2831853, v = vMapUv.y;
          vec3 p = vec3(cos(a) * 1.7, sin(a) * 1.7, v * 3.2) + uSeed;
          vec3 q = p + .7 * vec3(snoise(p * .7 + 1.7), snoise(p * .7 + 4.2), snoise(p * .7 + 7.3));
          /* the cup stood on its head: the grounds ran towards the rim, so the
             pattern is streaked along v, with fine veins where they trickled */
          vec3 qs = vec3(q.x * 2.2, q.y * 2.2, q.z * .75);
          float n1 = fbm(q * 1.4);
          float n2 = fbm(qs * 1.6 + 9.1);
          float ridge = pow(1. - abs(snoise(qs * 2.4 + 3.3)), 6.);
          float base = mix(n1, n2, .30) + .10 * ridge;
          /* whole stretches of clean porcelain between the grounds — an even
             lace over everything read as marble */
          float cov = smoothstep(.36, .64, fbm(p * .55 + 2.));
          base *= mix(.72, 1.1, cov);
          float pool = smoothstep(.34, .02, v);                         /* the bottom, where the coffee stood */
          float rimband = smoothstep(.78, .92, v) * smoothstep(1., .95, v);
          base += .22 * pool + .08 * rimband;
          /* the shapes: made of the same grounds, mid to thick, their edges
             eaten away like everything around them, with a lighter margin
             so they read as shapes */
          vec4 sym = texture2D(uSym, vMapUv);
          float s = max(max(sym.r, sym.g), sym.b);
          float ero = fbm(p * 6.5 + 3.3) - .5;
          float symD = smoothstep(.40, .62, s + ero * .45);
          float halo = smoothstep(.02, .30, s) * (1. - smoothstep(.34, .54, s));
          base = mix(base, .30, halo * .85);
          /* inside, the shape is grounds too: thick and thin, with a few holes */
          symD *= smoothstep(.18, .36, fbm(p * 9. + 1.));
          base = max(base, mix(.50, .84, fbm(p * 4. + 5.)) * symD);
          /* four tones, as on real porcelain: a pale stain, a thin brown film,
             the thick dark grounds, and a dusting of specks at their edges */
          float fine = snoise(p * 150.) * .5 + .5, grain = snoise(p * 48.) * .5 + .5;
          float tStain = smoothstep(.36, .50, base);
          /* grainy edges, not contour lines */
          float tFilm = smoothstep(.50, .61, base + (fine - .5) * .14);
          float tThick = smoothstep(.62, .71, base + (grain - .5) * .12 + (fine - .5) * .08);
          float speck = step(.82, fine) * smoothstep(.50, .62, base) * (1. - tThick);
          vec3 porcelain = vec3(.94, .91, .86);
          vec3 cThick = mix(vec3(.10, .055, .03), vec3(.24, .15, .09), grain);
          vec3 col = porcelain;
          col = mix(col, vec3(.80, .68, .54), tStain * .8);
          col = mix(col, vec3(.50, .35, .23), tFilm * .85);
          col = mix(col, cThick, tThick);
          col = mix(col, cThick * 1.1, speck * .8);
          float dens = max(tThick, tFilm * .6);
          /* the shape being read: a warm glow in its own channel */
          float hi = dot(sym.rgb, uHi);
          col += vec3(.95, .6, .2) * smoothstep(.12, .55, hi) * .16 * (.8 + .2 * sin(uTime * 2.6));
          col = mix(porcelain * vec3(.97, .95, .92), col, uReveal);
          diffuseColor.rgb *= pow(col, vec3(2.2));
          telveD = dens * uReveal;
        }
      `)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .92, telveD);");
  };
  mat.userData.U = U;
  return mat;
}

/* --- the cup and its saucer (centimetres) ---------------------------------- */
function porcelain() {
  return new THREE.MeshPhysicalMaterial({ color: 0xf6f1e8, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.2 });
}
function gold() { return new THREE.MeshStandardMaterial({ color: 0xc9a46a, metalness: 1, roughness: 0.28 }); }

function lathe(points, segs = 128) {
  return new THREE.LatheGeometry(points.map((p) => new THREE.Vector2(p[0], p[1])), segs);
}
function spaced(ctrl, n) {
  const c = new THREE.SplineCurve(ctrl.map((p) => new THREE.Vector2(p[0], p[1])));
  return c.getSpacedPoints(n).map((v) => [Math.max(0, v.x), v.y]);
}

function buildCup(telve) {
  const cup = new THREE.Group();
  const outer = spaced([[0, 0.02], [1.45, 0.02], [1.62, 0.18], [1.5, 0.42], [1.82, 0.62], [2.35, 1.6], [2.72, 3.2], [2.92, 4.6], [3.02, 5.2]], 48);
  outer.push([3.0, 5.3], [2.9, 5.34], [2.8, 5.28]);
  const body = new THREE.Mesh(lathe(outer), porcelain());
  cup.add(body);
  /* the inside, its own surface so the grounds have their own UVs: v runs
     with the curve's length, from the middle of the bottom to the rim */
  const inner = spaced([[0, 0.66], [0.9, 0.7], [1.6, 0.98], [2.18, 1.9], [2.52, 3.2], [2.7, 4.5], [2.8, 5.28]], 96);
  const insideMesh = new THREE.Mesh(lathe(inner, 160), telve);
  insideMesh.geometry.computeVertexNormals();
  /* a lathe's normals face out; the inside is seen from within */
  insideMesh.material.side = THREE.BackSide;
  cup.add(insideMesh);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.02, 0.03, 8, 160), gold());
  rim.rotation.x = Math.PI / 2; rim.position.y = 5.2;
  cup.add(rim);
  /* the handle: a small loop on the side */
  /* its open side against the wall, both ends sunk in the porcelain and
     never through to the inside: the wall leans out ~13 degrees, so the loop
     leans with it (upright, its lower end stood off the wall) */
  const hg = new THREE.TorusGeometry(0.8, 0.19, 16, 48, Math.PI * 1.35);
  const handle = new THREE.Mesh(hg, porcelain());
  handle.position.set(3.2, 3.3, 0);
  handle.rotation.z = -Math.PI * 0.675 - 0.226;
  cup.add(handle);
  /* what is left of the coffee: a thin dark film in the bottom, before the cup is turned */
  const liquid = new THREE.Mesh(new THREE.CircleGeometry(1.32, 64), new THREE.MeshPhysicalMaterial({ color: 0x1a0d06, roughness: 0.08, clearcoat: 1 }));
  liquid.rotation.x = -Math.PI / 2; liquid.position.y = 0.95;
  cup.add(liquid);
  cup.userData = { inside: insideMesh, liquid, handleAngle: 0 };
  return cup;
}

function buildSaucer() {
  const prof = spaced([[0, 0.02], [2.3, 0.02], [2.45, 0.16], [3.6, 0.36], [4.8, 0.62], [5.25, 0.82]], 48);
  prof.push([5.2, 0.92], [5.05, 0.88]);
  prof.push(...spaced([[4.95, 0.84], [3.8, 0.58], [2.6, 0.42], [1.6, 0.38], [0, 0.37]], 24));
  const s = new THREE.Group();
  s.add(new THREE.Mesh(lathe(prof), porcelain()));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(5.16, 0.03, 8, 200), gold());
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.9;
  s.add(rim);
  return s;
}

function env(renderer) {
  const c = document.createElement("canvas"); c.width = 64; c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#fff4e2"); grad.addColorStop(0.35, "#a8927a"); grad.addColorStop(0.7, "#2a1f18"); grad.addColorStop(1, "#0d0907");
  g.fillStyle = grad; g.fillRect(0, 0, 64, 256);
  const box = g.createLinearGradient(0, 30, 0, 90);
  box.addColorStop(0, "rgba(255,240,220,0)"); box.addColorStop(0.5, "rgba(255,240,220,1)"); box.addColorStop(1, "rgba(255,240,220,0)");
  g.fillStyle = box; g.fillRect(0, 30, 64, 60);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer);
  const out = pm.fromEquirectangular(tex).texture;
  tex.dispose(); pm.dispose();
  return out;
}

/* --- the reading ------------------------------------------------------------ */
function reading(name) {
  let day = "";
  const d = new Date(); day = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  let who = (name || "").trim().toLowerCase();
  if (!who) {
    try { who = localStorage.getItem("nr-fal-id") || ""; if (!who) { who = "x" + Math.random().toString(36).slice(2, 9); localStorage.setItem("nr-fal-id", who); } } catch (e) { who = "guest"; }
  }
  const r = rng(who + "|" + day);
  const kinds = Object.keys(SYMBOLS);
  const picks = [];
  for (let i = 0; i < 3; i++) {
    const k = kinds.splice(Math.floor(r() * kinds.length), 1)[0];
    picks.push(k);
  }
  /* by the handle (the lathe puts angle u at (sin, cos): the handle, on +x,
     is u 0.25), under the rim a third of the way round, down in the cup at
     two thirds — never on the bottom disc, where the lathe pinches a shape */
  const H = 0.25;
  return [
    { kind: picks[0], place: 0, u: (H + 0.05 + r() * 0.04) % 1, v: 0.56 + r() * 0.06, size: 0.125, rot: (r() - 0.5) * 0.5 },
    { kind: picks[1], place: 1, u: (H + 0.36 + r() * 0.06) % 1, v: 0.79 + r() * 0.03, size: 0.11, rot: (r() - 0.5) * 0.6 },
    { kind: picks[2], place: 2, u: (H + 0.66 + r() * 0.06) % 1, v: 0.41 + r() * 0.05, size: 0.12, rot: (r() - 0.5) * 0.6 }
  ];
}

/* --- the experience --------------------------------------------------------- */
let api = null;

/* Throws if the reading cannot be shown (no WebGL): js/site.js says so. */
export function open(opts = {}) {
  if (!api) api = build();
  api.show(opts);
}

function build() {
  const root = document.getElementById("fal");
  const canvas = root.querySelector(".fal__canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.environment = env(renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const key = new THREE.DirectionalLight(0xffe2bd, 2.6); key.position.set(-6, 12, 7); scene.add(key);
  const rimL = new THREE.DirectionalLight(0xffc796, 1.4); rimL.position.set(8, 6, -8); scene.add(rimL);
  scene.add(new THREE.HemisphereLight(0x7a6150, 0x0d0907, 0.6));
  const fill = new THREE.DirectionalLight(0xfff0dc, 0.75); fill.position.set(2, 5, 16); scene.add(fill);   /* the porcelain read khaki without it */

  /* a soft contact shadow under the saucer: a radial gradient, not a light */
  const sc = document.createElement("canvas"); sc.width = sc.height = 128;
  const sg = sc.getContext("2d"); const gr = sg.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, "rgba(0,0,0,.55)"); gr.addColorStop(1, "rgba(0,0,0,0)"); sg.fillStyle = gr; sg.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; scene.add(shadow);

  const saucer = buildSaucer(); scene.add(saucer);
  const turn = new THREE.Group(); scene.add(turn);         /* turns the cup to show a shape */
  let cup = null, telve = null, picks = [], symTex = null;

  /* sid: one id per opening. Every timer and animation remembers the id it
     was started under and does nothing once it is stale — a reading closed
     mid-flip and opened again must not inherit the old flip, the old
     cool-down or the old reveal (review, 12.10). */
  const S = { sid: 0, phase: "idle", flip: 0, lift: 0, look: 0, turnTo: 0, turnFrom: 0, turnT: 1, show: -1, raf: 0, auto: 0, hideT: 0, waited: false };
  const textEl = root.querySelector("[data-fal-text]");
  const listEl = root.querySelector("[data-fal-list]");
  const endEl = root.querySelector("[data-fal-end]");
  const btn = root.querySelector("[data-fal-go]");
  let lastFocus = null, opts = {};

  function dispose(o) {
    o.traverse((m) => {
      if (m.geometry) m.geometry.dispose();
      if (m.material) { if (m.material.map) m.material.map.dispose(); m.material.dispose(); }
    });
  }
  function setup(name) {
    if (cup) { turn.remove(cup); dispose(cup); }
    if (symTex) symTex.dispose();
    picks = reading(name);
    symTex = symbolTexture(picks);
    telve = telveMaterial(symTex, (name || "x").length * 0.37 + new Date().getDate() * 0.11);
    cup = buildCup(telve);
    cup.position.y = 0.37;
    turn.add(cup);
    S.flip = 0; S.lift = 0; S.look = 0; S.show = -1;
    S.turnFrom = S.turnTo = 0; S.turnT = 1; turn.rotation.y = 0;
    telve.userData.U.uReveal.value = 0; telve.userData.U.uHi.value.set(0, 0, 0);
    cup.userData.liquid.visible = true;
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", () => { if (!root.hidden) resize(); });

  /* the far wall faces the camera when the cup has turned by PI - 2PI u */
  function faceU(u) { return Math.PI - u * Math.PI * 2; }
  const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);

  let last = 0;
  function frame(now) {
    S.raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60; last = now;
    telve.userData.U.uTime.value = now / 1000;
    /* the cup: turned over onto the saucer (flip 0..1), lifted back (lift) */
    const f = ease(S.flip), l = ease(S.lift);
    const up = Math.sin(Math.PI * Math.min(1, S.flip)) * 2.2 * (1 - l) + Math.sin(Math.PI * Math.min(1, S.lift)) * 2.2;
    const flipped = f * (1 - l);
    cup.rotation.x = Math.PI * flipped;
    cup.position.y = 0.37 + flipped * 5.37 + up;           /* upside down, its rim (5.34) rests on the saucer (0.4) */
    cup.position.z = -Math.sin(Math.PI * flipped) * 0.6;
    /* the turn: to the shape being read */
    if (S.turnT < 1) S.turnT = Math.min(1, S.turnT + dt / 1.1);
    const tk = reduced ? 1 : ease(S.turnT);
    turn.rotation.y = S.turnFrom + (S.turnTo - S.turnFrom) * tk;
    /* the camera: across the table, then over the cup to look in */
    const lk = ease(S.look);
    const camR = 21 - lk * 6.5, camH = 6.5 + lk * 9.5;
    camera.position.set(Math.sin(0.15) * camR, camH, Math.cos(0.15) * camR);
    camera.lookAt(0, 2.6 + lk * 1.2, 0);
    renderer.render(scene, camera);
  }

  /* a tween of S[key] that stops as soon as its opening is gone */
  function anim(key, to, secs, done) {
    const id = S.sid, from = S[key], t0 = performance.now();
    if (reduced) { S[key] = to; if (done) done(); return; }
    (function step(now) {
      if (id !== S.sid) return;
      const k = Math.min(1, (now - t0) / (secs * 1000));
      S[key] = from + (to - from) * k;
      if (k < 1) requestAnimationFrame(step); else if (done) done();
    })(performance.now());
  }
  function later(ms, fn) { const id = S.sid; setTimeout(() => { if (id === S.sid) fn(); }, ms); }

  /* the words for the phase the reading is in — drawn again on a language
     change (the page's walker would keep the old language in nodes it did
     not write itself) */
  function paint() {
    const lead = (s) => { textEl.innerHTML = "<p class=\"fal__lead\"></p>"; textEl.firstChild.textContent = s; };
    if (S.phase === "wish") { lead(T("Hold a wish in your mind. Then turn the cup over onto its saucer.")); btn.textContent = T("Turn the cup over"); }
    else if (S.phase === "cool") {
      lead(T("Let it cool. The grounds are settling."));
      if (S.waited) textEl.insertAdjacentHTML("beforeend", "<span class=\"fal__wait\"><i class=\"is-on\"></i></span>");
      btn.textContent = T("Turn the cup over");
    } else if (S.phase === "cooled") { lead(T("It has cooled. Lift the cup — gently.")); btn.textContent = T("Lift the cup"); }
    else if (S.phase === "lift") { lead(T("It has cooled. Lift the cup — gently.")); btn.textContent = T("Lift the cup"); }
    else if (S.phase === "read") drawReading();
  }

  function go(phase) {
    S.phase = phase;
    root.dataset.phase = phase;
    if (phase === "wish") {
      paint();
      btn.hidden = false; btn.disabled = false;
    } else if (phase === "cool") {
      btn.disabled = true;
      S.waited = false;
      anim("flip", 1, 1.2, () => {
        paint();
        textEl.insertAdjacentHTML("beforeend", "<span class=\"fal__wait\"><i></i></span>");
        S.waited = true;
        const bar = textEl.querySelector(".fal__wait i");
        requestAnimationFrame(() => { if (bar) bar.classList.add("is-on"); });
        later(reduced ? 200 : 3600, () => { go("cooled"); btn.disabled = false; btn.focus({ preventScroll: true }); });
      });
    } else if (phase === "cooled") {
      paint();
    } else if (phase === "lift") {
      btn.disabled = true;
      cup.userData.liquid.visible = false;
      anim("lift", 1, 1.1, () => {
        anim("look", 1, 1.4);
        const U = telve.userData.U, id = S.sid, t0 = performance.now();
        (function rev(now) { if (id !== S.sid) return; const k = Math.min(1, (now - t0) / 1600); U.uReveal.value = ease(k); if (k < 1) requestAnimationFrame(rev); })(performance.now());
        later(reduced ? 100 : 1500, read);
      });
    }
  }

  function show(i) {
    S.show = i;
    telve.userData.U.uHi.value.set(i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0);
    S.turnFrom = turn.rotation.y;
    let to = faceU(picks[i].u);
    while (to - S.turnFrom > Math.PI) to -= Math.PI * 2;
    while (to - S.turnFrom < -Math.PI) to += Math.PI * 2;
    S.turnTo = to; S.turnT = 0;
    listEl.querySelectorAll("button").forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
  }
  function stopAuto() { clearInterval(S.auto); S.auto = 0; }

  function drawReading() {
    const name = (opts.name || "").trim();
    textEl.innerHTML = "<p class=\"fal__lead\"></p>";
    textEl.firstChild.textContent = name ? T("%s, three things are in your cup.").replace("%s", name) : T("Three things are in your cup.");
    listEl.innerHTML = "";
    picks.forEach((p, i) => {
      const S0 = SYMBOLS[p.kind], P0 = PLACES[p.place];
      const li = document.createElement("li");
      li.style.setProperty("--i", i);
      li.innerHTML = "<button type=\"button\" class=\"fal__item\"><span class=\"fal__where label\"></span><strong></strong><span class=\"fal__say\"></span></button>";
      li.querySelector(".fal__where").textContent = T(P0.where) + " — " + T(P0.means);
      li.querySelector("strong").textContent = T(S0.name);
      li.querySelector(".fal__say").textContent = T(S0.say);
      li.querySelector("button").addEventListener("click", () => { stopAuto(); show(i); });
      listEl.appendChild(li);
    });
    listEl.querySelectorAll("button").forEach((b, k) => b.setAttribute("aria-pressed", String(k === S.show)));
  }
  function read() {
    S.phase = "read"; root.dataset.phase = "read";
    drawReading();
    listEl.hidden = false;
    endEl.hidden = false;
    btn.hidden = true;
    show(0);
    const first = listEl.querySelector("button");
    if (first) first.focus({ preventScroll: true });
    /* then the next, and the next — the reader can take over at any time */
    stopAuto();
    let k = 0;
    S.auto = setInterval(() => { if (S.phase !== "read" || ++k > 2) return stopAuto(); show(k); }, 3200);
  }

  btn.addEventListener("click", () => {
    if (S.phase === "wish") go("cool");
    else if (S.phase === "cooled") go("lift");
  });
  root.addEventListener("click", (e) => { if (e.target.closest("[data-fal-close]")) hide(); });
  /* in the capture phase, and kept here: one Escape closes the reading only,
     not the ticket under it too; Tab stays inside while it is open */
  document.addEventListener("keydown", (e) => {
    if (root.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); hide(); return; }
    if (e.key !== "Tab") return;
    const f = [].slice.call(root.querySelectorAll("button:not([disabled])")).filter((b) => b.offsetParent);
    if (!f.length) return;
    e.stopImmediatePropagation();
    const first = f[0], lastB = f[f.length - 1];
    if (!root.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastB.focus(); }
    else if (!e.shiftKey && document.activeElement === lastB) { e.preventDefault(); first.focus(); }
  }, true);

  function showReading(o) {
    if (!root.hidden && root.classList.contains("is-open")) return;     /* already open (a double click while loading) */
    clearTimeout(S.hideT);
    S.sid++; stopAuto();
    opts = o || {};
    lastFocus = document.activeElement;
    setup(opts.name || "");
    listEl.hidden = true; listEl.innerHTML = "";
    endEl.hidden = true;
    root.hidden = false;
    document.documentElement.classList.add("is-fal");
    document.dispatchEvent(new CustomEvent("nr:overlay", { detail: true }));   /* the page's own scene can rest */
    resize();
    last = 0;
    cancelAnimationFrame(S.raf); S.raf = requestAnimationFrame(frame);
    requestAnimationFrame(() => root.classList.add("is-open"));
    go("wish");
    btn.focus({ preventScroll: true });
  }
  function hide() {
    if (root.hidden) return;
    S.sid++; stopAuto();
    S.phase = "idle";
    root.classList.remove("is-open");
    document.documentElement.classList.remove("is-fal");
    document.dispatchEvent(new CustomEvent("nr:overlay", { detail: false }));
    clearTimeout(S.hideT);
    S.hideT = setTimeout(() => { root.hidden = true; cancelAnimationFrame(S.raf); }, reduced ? 0 : 420);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  if (window.NR) window.NR.onChange.push(() => { if (!root.hidden) paint(); });

  /* ?probe: a test can jump straight to the reading */
  if (/[?&]probe/.test(location.search)) window.__fal = { read: () => { S.flip = 1; S.lift = 1; S.look = 1; cup.userData.liquid.visible = false; telve.userData.U.uReveal.value = 1; read(); }, picks: () => picks };
  return { show: showReading, hide };
}

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
   so the reading names exactly what the reader can see. The same cup gives
   the same reading all day (the name on the cup, the date and which cup of
   the day it is seed it): opening it again is not a re-roll — only "another
   cup" is a new one, as it would be at the table.
   "Fala inanma, falsız da kalma."
   ========================================================================== */
import * as THREE from "./vendor/three/three.module.min.js";

const T = (s) => (window.NR ? window.NR.t(s) : s);
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --- what a shape means, and where it sits ---------------------------------
   12.10 ("make the reading detailed and beautiful — something that satisfies"):
   each shape has its subject and a few sentences of its own, the way a
   reader at the table would say it; the reading around them has an opening
   that depends on how full the cup is, an answer to the wish, and the time. */
const SYMBOLS = {
  bird:     { name: "Bird",     area: "News",          say: "A bird carries news. It is coming from someone far away, and it is good — answer it when it arrives; it opens a door." },
  fish:     { name: "Fish",     area: "Kısmet",        say: "The fish is kısmet: plenty from a direction you are not watching. Money or an offer — say yes before you overthink it." },
  road:     { name: "Road",     area: "Journey",       say: "A road opens in the grounds. A trip is near — short, maybe just across the Bosphorus — and something you need is at the other end of it." },
  heart:    { name: "Heart",    area: "Love",          say: "A heart, clear as a drawing. Someone thinks of you more than they let on; a small gesture from you will be enough." },
  key:      { name: "Key",      area: "A way through", say: "A key: a matter you thought was locked is about to open. The answer is simpler than it looked — ask once more." },
  tree:     { name: "Tree",     area: "Health",        say: "A tree with its roots in the grounds — health, and quiet. You are putting down roots somewhere; let them take their time." },
  eye:      { name: "Eye",      area: "The evil eye",  say: "An eye: nazar. Someone is watching your good luck a little too closely. Keep your plans to yourself for a while, and a blue bead in your pocket." },
  ring:     { name: "Ring",     area: "A promise",     say: "A ring: a promise. One will be made to you, or one you made will finally be kept — either way, it binds you to something good." },
  mountain: { name: "Mountain", area: "Effort",        say: "A mountain stands in the way, but look closer: the path goes over it, not around. It will take effort, and it will be worth it." },
  house:    { name: "House",    area: "Home",          say: "A house: a change at home. A move, a new face at the table, or a room you finally make your own — it lets the light in." },
  moon:     { name: "Crescent", area: "Your wish",     say: "A crescent, the sign of a wish. The one you made at the start of this cup will come — not today, but it is on its way." },
  star:     { name: "Star",     area: "Luck",          say: "A star: luck is on your side this week. Whatever you have been putting off, begin it now." }
};
const PLACES = [
  { where: "By the handle", means: "about you, and your home" },
  { where: "Near the rim",  means: "soon" },
  { where: "Down in the cup", means: "in time, or from the past" }
];
const OPENINGS = {
  full:  "Your cup is crowded — a lot on your mind lately. The good news: most of it is about to settle.",
  mid:   "Your cup is lively but clear — busy days, and an open road.",
  light: "Your cup is light and open — you carry less than you think, and things are clearing."
};
const YES = ["moon", "star", "key", "ring", "fish"];          /* the shapes that answer a wish with yes */
const HARD = ["mountain", "eye"];

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
function today() { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
/* which cup of the day this is (0 = the first); next = true pours a new one */
let cupMem = 0;
function cupOfDay(next) {
  let n = cupMem;
  try { const v = (localStorage.getItem("nr-fal-cup") || "").split("|"); n = v[0] === today() ? Number(v[1]) || 0 : 0; } catch (e) { /* private mode: this page remembers */ }
  if (next) { n += 1; try { localStorage.setItem("nr-fal-cup", today() + "|" + n); } catch (e) { /* as above */ } }
  cupMem = n;
  return n;
}
function reading3D(name, n) {
  const day = today();
  let who = (name || "").trim().toLowerCase();
  if (!who) {
    try { who = localStorage.getItem("nr-fal-id") || ""; if (!who) { who = "x" + Math.random().toString(36).slice(2, 9); localStorage.setItem("nr-fal-id", who); } } catch (e) { who = "guest"; }
  }
  const r = rng(who + "|" + day + (n ? "|" + n : ""));
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

/* --- reading a photo of a real cup ------------------------------------------
   On the device, nothing is sent anywhere. The photo is scaled down and the
   inside of the cup (the circle in the middle: the reader fills the frame
   with the cup, from above, handle on the right) is split into grounds and
   porcelain at the photo's own threshold (Otsu).
   12.10, a real photo shot at an angle: the dried pool at the bottom was read
   as one huge "shape", its mark sat in the middle of it, and the other two
   cards were made up. Now:
   - the pool (dark AND smooth, and big) is set aside: it is the bottom of
     the cup, not a figure — and so are the light reflections on it;
   - the figures are the busiest small areas of the grounds, where dark and
     porcelain meet most at about half and half — up to three, apart, one per
     part of the cup where the cup allows;
   - each is measured from the strokes really inside it (long, solid, holed,
     heavy at the bottom) and given the symbol that silhouette suggests;
   - nothing is invented: a cup with one clear figure gets one card.
   The reading rings each figure on the photo and lights its strokes.
   The same photo always gives the same reading. */
function otsu(vals) {
  const hist = new Array(64).fill(0);
  vals.forEach((v) => hist[Math.min(63, Math.floor(v * 64))]++);
  const total = vals.length;
  let sum = 0; for (let i = 0; i < 64; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, at = 32;
  for (let i = 0; i < 64; i++) {
    wB += hist[i]; if (!wB) continue;
    const wF = total - wB; if (!wF) break;
    sumB += i * hist[i];
    const mB = sumB / wB, mF = (sum - sumB) / wF, between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) { best = between; at = i; }
  }
  return (at + 0.5) / 64;
}

const PHOTO_N = 128;                         /* the grid the photo is read on */

function analysePhoto(img) {
  const N = PHOTO_N, NN = N * N;
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  if (!side) return { ok: false, open: true };
  const cv = document.createElement("canvas"); cv.width = cv.height = N;
  const g = cv.getContext("2d", { willReadFrequently: true });
  /* the middle square of the photo: the cup, shot from above */
  g.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, N, N);
  const px = g.getImageData(0, 0, N, N).data;
  const C = (N - 1) / 2, R0 = N * 0.47;
  /* a cell is grounds when it is much darker than the porcelain AROUND it
     (a wall in shade is darker than the lit side but still porcelain — read
     against one threshold for the whole photo, it was taken for grounds),
     and warmer: grounds are brown, porcelain is neutral */
  const L = new Float32Array(NN), warm = new Float32Array(NN), inside = new Uint8Array(NN);
  const lit = [];
  for (let i = 0; i < NN; i++) {
    const k = i * 4;
    L[i] = (0.2126 * px[k] + 0.7152 * px[k + 1] + 0.0722 * px[k + 2]) / 255;
    warm[i] = Math.max(0, px[k] - px[k + 2]) / 255;
    if (Math.hypot((i % N) - C, ((i / N) | 0) - C) < R0) { inside[i] = 1; lit.push(L[i]); }
  }
  lit.sort((a, b) => a - b);
  const white = lit[Math.floor(lit.length * 0.95)] || 1;
  /* the local white: the brightest porcelain in blocks of 8, spread two
     blocks each way, never below half of the cup's own white */
  const B = 8, NB = N / B, bmax = new Float32Array(NB * NB), wmax = new Float32Array(NB * NB);
  for (let i = 0; i < NN; i++) if (inside[i]) { const b = ((((i / N) | 0) / B) | 0) * NB + (((i % N) / B) | 0); if (L[i] > bmax[b]) bmax[b] = L[i]; }
  for (let by = 0; by < NB; by++) for (let bx = 0; bx < NB; bx++) {
    let m = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const y = by + dy, x = bx + dx; if (x >= 0 && y >= 0 && x < NB && y < NB) m = Math.max(m, bmax[y * NB + x]); }
    wmax[by * NB + bx] = Math.max(m, white * 0.55);
  }
  const localWhite = (x, y) => {
    const fx = Math.min(NB - 1, Math.max(0, (x + 0.5) / B - 0.5)), fy = Math.min(NB - 1, Math.max(0, (y + 0.5) / B - 0.5));
    const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(NB - 1, x0 + 1), y1 = Math.min(NB - 1, y0 + 1), ax = fx - x0, ay = fy - y0;
    return (wmax[y0 * NB + x0] * (1 - ax) + wmax[y0 * NB + x1] * ax) * (1 - ay) + (wmax[y1 * NB + x0] * (1 - ax) + wmax[y1 * NB + x1] * ax) * ay;
  };
  const F = new Float32Array(NN), vals = [];
  for (let i = 0; i < NN; i++) {
    if (!inside[i]) continue;
    const ln = Math.min(1, L[i] / localWhite(i % N, (i / N) | 0));
    F[i] = Math.min(1, Math.max(0, (1 - ln) * 0.75 + warm[i] * 0.9));
    vals.push(F[i]);
  }
  const insideN = vals.length;
  const mean = vals.reduce((a, b) => a + b, 0) / insideN;
  const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / insideN);
  if (sd < 0.05) return { ok: false };               /* one even tone: no grounds to read */
  const t = otsu(vals);
  const dark = new Uint8Array(NN);
  let darkN = 0;
  for (let i = 0; i < NN; i++) if (inside[i] && F[i] > t) { dark[i] = 1; darkN++; }
  if (darkN / insideN < 0.03 || darkN / insideN > 0.95) return { ok: false };

  /* summed-area tables: the total over any box in four reads */
  const W1 = N + 1;
  const table = (f) => {
    const s = new Float64Array(W1 * W1);
    for (let y = 0; y < N; y++) { let row = 0; for (let x = 0; x < N; x++) { row += f(y * N + x); s[(y + 1) * W1 + x + 1] = s[y * W1 + x + 1] + row; } }
    return s;
  };
  const sum = (s, x0, y0, x1, y1) => {
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(N - 1, x1); y1 = Math.min(N - 1, y1);
    return s[(y1 + 1) * W1 + x1 + 1] - s[y0 * W1 + x1 + 1] - s[(y1 + 1) * W1 + x0] + s[y0 * W1 + x0];
  };
  const area = (x0, y0, x1, y1) => (Math.min(N - 1, x1) - Math.max(0, x0) + 1) * (Math.min(N - 1, y1) - Math.max(0, y0) + 1);

  /* the pool: grounds that are dark, smooth AND deep — far from any
     porcelain (a drip down the wall is smooth too, but thin) — over a big
     area. Depth is the distance to the nearest light cell (two-pass chamfer). */
  const T1 = table((i) => L[i]), T2 = table((i) => L[i] * L[i]);
  const depth = new Float32Array(NN);
  for (let i = 0; i < NN; i++) depth[i] = dark[i] ? 1e9 : 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x; if (!depth[i]) continue;
    if (x > 0) depth[i] = Math.min(depth[i], depth[i - 1] + 1);
    if (y > 0) depth[i] = Math.min(depth[i], depth[i - N] + 1);
    if (x > 0 && y > 0) depth[i] = Math.min(depth[i], depth[i - N - 1] + 1.414);
    if (x < N - 1 && y > 0) depth[i] = Math.min(depth[i], depth[i - N + 1] + 1.414);
  }
  for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) {
    const i = y * N + x; if (!depth[i]) continue;
    if (x < N - 1) depth[i] = Math.min(depth[i], depth[i + 1] + 1);
    if (y < N - 1) depth[i] = Math.min(depth[i], depth[i + N] + 1);
    if (x < N - 1 && y < N - 1) depth[i] = Math.min(depth[i], depth[i + N + 1] + 1.414);
    if (x > 0 && y < N - 1) depth[i] = Math.min(depth[i], depth[i + N - 1] + 1.414);
  }
  const deep = new Uint8Array(NN);
  for (let i = 0; i < NN; i++) {
    if (!dark[i] || depth[i] < N * 0.045) continue;
    const x = i % N, y = (i / N) | 0, n = area(x - 2, y - 2, x + 2, y + 2);
    const m = sum(T1, x - 2, y - 2, x + 2, y + 2) / n, v = sum(T2, x - 2, y - 2, x + 2, y + 2) / n - m * m;
    if (v < 0.05 * 0.05) deep[i] = 1;
  }
  const pool = new Uint8Array(NN), seen = new Uint8Array(NN);
  const flood = (s, ok) => {
    const cells = [s]; seen[s] = 1;
    for (let q = 0; q < cells.length; q++) {
      const i = cells[q], x = i % N, y = (i / N) | 0;
      if (x > 0 && ok(i - 1) && !seen[i - 1]) { seen[i - 1] = 1; cells.push(i - 1); }
      if (x < N - 1 && ok(i + 1) && !seen[i + 1]) { seen[i + 1] = 1; cells.push(i + 1); }
      if (y > 0 && ok(i - N) && !seen[i - N]) { seen[i - N] = 1; cells.push(i - N); }
      if (y < N - 1 && ok(i + N) && !seen[i + N]) { seen[i + N] = 1; cells.push(i + N); }
    }
    return cells;
  };
  for (let s = 0; s < NN; s++) {
    if (!deep[s] || seen[s]) continue;
    const cells = flood(s, (j) => deep[j] === 1);
    if (cells.length > insideN * 0.02) cells.forEach((i) => (pool[i] = 1));
  }
  /* ...with its own edge, and the light glints lying on it */
  const TP = table((i) => pool[i]);
  const usable = new Uint8Array(NN);
  let usableN = 0, usableDark = 0;
  for (let i = 0; i < NN; i++) {
    if (!inside[i]) continue;
    const x = i % N, y = (i / N) | 0;
    const near = sum(TP, x - 6, y - 6, x + 6, y + 6) / area(x - 6, y - 6, x + 6, y + 6);
    if (pool[i] || (dark[i] && near > 0.12) || (!dark[i] && near > 0.45)) { pool[i] = 1; continue; }
    usable[i] = 1; usableN++; if (dark[i]) usableDark++;
  }
  if (usableN < insideN * 0.15) return { ok: false };

  /* the strokes, piece by piece: a piece that fits a reading circle is a
     figure of its own (a ring, a drop, a peak) and is read whole, once; the
     lace of grounds that runs all round the cup is read area by area */
  const piece = new Int32Array(NN).fill(-1), pieces = [];
  seen.fill(0);
  for (let s0 = 0; s0 < NN; s0++) {
    if (!usable[s0] || !dark[s0] || seen[s0]) continue;
    const cells = flood(s0, (j) => usable[j] === 1 && dark[j] === 1);
    let sx = 0, sy = 0;
    cells.forEach((i) => { sx += i % N; sy += (i / N) | 0; });
    const cx = sx / cells.length, cy = sy / cells.length;
    let rad = 0;
    cells.forEach((i) => { rad = Math.max(rad, Math.hypot((i % N) - cx, ((i / N) | 0) - cy)); });
    cells.forEach((i) => (piece[i] = pieces.length));
    pieces.push({ cells, cx, cy, rad, used: false });
  }

  /* where grounds and porcelain meet */
  const edge = (i) => {
    if (!usable[i]) return 0;
    const x = i % N, y = (i / N) | 0;
    return (x < N - 1 && usable[i + 1] && dark[i] !== dark[i + 1]) || (y < N - 1 && usable[i + N] && dark[i] !== dark[i + N]) ? 1 : 0;
  };
  const TU = table((i) => usable[i]), TD = table((i) => usable[i] && dark[i] ? 1 : 0), TE = table(edge);

  /* the busiest small areas, about half grounds and half porcelain */
  const h = Math.round(N * 0.1), A = (2 * h + 1) * (2 * h + 1);
  const cands = [];
  for (let cy = h; cy < N - h; cy += 3) for (let cx = h; cx < N - h; cx += 3) {
    if (Math.hypot(cx - C, cy - C) > R0 - h * 1.15) continue;          /* its ring stays inside the cup */
    const u = sum(TU, cx - h, cy - h, cx + h, cy + h);
    if (u < A * 0.7) continue;
    const f = sum(TD, cx - h, cy - h, cx + h, cy + h) / u, e = sum(TE, cx - h, cy - h, cx + h, cy + h) / u;
    const s = e * Math.max(0, 1 - Math.abs(f - 0.45) * 2.2);
    if (s > 0.02) cands.push({ cx, cy, s });
  }
  if (!cands.length) return { ok: false };
  cands.sort((a, b) => b.s - a.s);
  const best = cands[0].s;
  /* where it sits: the handle is held on the right, as the custom asks */
  const placeOf = (x, y) => {
    const rr = Math.hypot(x - C, y - C) / R0, ang = Math.atan2(y - C, x - C);
    return rr > 0.36 && Math.abs(ang) < 0.9 ? 0 : rr > 0.6 ? 1 : 2;
  };
  const chosen = [];
  for (const pass of [0, 1]) {
    for (const w of cands) {
      if (chosen.length === 3 || w.s < best * 0.3) break;
      if (chosen.includes(w) || chosen.some((o) => Math.hypot(o.cx - w.cx, o.cy - w.cy) < h * 2.7)) continue;
      const place = placeOf(w.cx, w.cy);
      if (pass === 0 && chosen.some((o) => o.place === place)) continue;
      w.place = place;
      chosen.push(w);
    }
  }

  /* each figure: the strokes inside its circle, measured */
  const measure = (cells) => {
    let sx = 0, sy = 0, x0 = N, y0 = N, x1 = 0, y1 = 0;
    cells.forEach((i) => { const x = i % N, y = (i / N) | 0; sx += x; sy += y; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    const n = cells.length, cx = sx / n, cy = sy / n;
    let xx = 0, yy = 0, xy = 0;
    cells.forEach((i) => { const dx = (i % N) - cx, dy = ((i / N) | 0) - cy; xx += dx * dx; yy += dy * dy; xy += dx * dy; });
    xx /= n; yy /= n; xy /= n;
    const tr = xx + yy, det = xx * yy - xy * xy, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
    const l1 = tr / 2 + disc, l2 = Math.max(0.25, tr / 2 - disc);
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    /* holes: porcelain inside the figure's box that cannot reach the box's edge */
    const inBox = new Uint8Array(bw * bh), out = new Uint8Array(bw * bh), stack = [];
    cells.forEach((i) => { inBox[((i / N | 0) - y0) * bw + (i % N) - x0] = 1; });
    for (let x = 0; x < bw; x++) stack.push(x, (bh - 1) * bw + x);
    for (let y = 0; y < bh; y++) stack.push(y * bw, y * bw + bw - 1);
    while (stack.length) {
      const j = stack.pop();
      if (inBox[j] || out[j]) continue;
      out[j] = 1;
      const x = j % bw, y = (j / bw) | 0;
      if (x > 0) stack.push(j - 1); if (x < bw - 1) stack.push(j + 1);
      if (y > 0) stack.push(j - bw); if (y < bh - 1) stack.push(j + bw);
    }
    let hole = 0; for (let j = 0; j < bw * bh; j++) if (!inBox[j] && !out[j]) hole++;
    return {
      area: n, elong: Math.sqrt(l1 / l2), solid: n / (bw * bh), holes: hole >= 3,
      flat: Math.abs(Math.atan2(2 * xy, xx - yy) / 2) < 0.55, low: cy > (y0 + y1) / 2
    };
  };
  /* the silhouette, read the way a reader would: a hole is a ring (or an
     eye, or a key, as it stretches); long and lying down swims or flies, long
     and standing is a road; spiky is a star, a peak is a mountain, a block a
     house, the rest round — a heart, or a moon when it hangs from the top */
  const kindOf = (b) => {
    if (b.holes) return b.elong < 1.6 ? "ring" : b.elong < 2.6 ? "eye" : "key";
    if (b.elong >= 3.2) return b.solid < 0.4 ? "road" : "fish";
    if (b.elong >= 2.0) return b.flat ? (b.solid < 0.55 ? "bird" : "fish") : (b.solid < 0.5 ? "tree" : "road");
    if (b.solid < 0.42) return "star";
    if (b.low && b.solid < 0.7) return "mountain";
    if (b.solid >= 0.78) return "house";
    return b.low ? "heart" : "moon";
  };
  const FALLBACK = ["star", "moon", "heart", "bird", "key", "road", "fish", "tree", "ring", "house", "eye", "mountain"];
  const used = new Set(), picks = [];
  /* the strokes inside a circle, and the biggest connected one: the body */
  const within = (cx, cy, hh) => {
    const mask = new Uint8Array(NN), strokes = [];
    for (let y = cy - hh; y <= cy + hh; y++) for (let x = cx - hh; x <= cx + hh; x++) {
      if (x < 0 || y < 0 || x >= N || y >= N) continue;
      const i = y * N + x;
      if (Math.hypot(x - cx, y - cy) <= hh + 0.5 && usable[i] && dark[i]) { mask[i] = 1; strokes.push(i); }
    }
    seen.fill(0);
    let body = [];
    strokes.forEach((s) => { if (seen[s]) return; const cells = flood(s, (j) => mask[j] === 1); if (cells.length > body.length) body = cells; });
    return { mask, body };
  };
  const take = (w, n) => {
    w.h = h;
    let { mask, body } = within(w.cx, w.cy, w.h);
    /* a figure of its own: the circle goes round all of it, and it is read
       only once (two arcs of one big ring were two cards — review, 12.10) */
    const pc = body.length ? pieces[piece[body[0]]] : null;
    if (pc && pc.cells.length >= 25 && pc.rad <= h * 2.2) {
      if (pc.used) { w.drop = true; return; }
      pc.used = true;
      w.cx = Math.round(pc.cx); w.cy = Math.round(pc.cy);
      w.h = Math.max(Math.round(h * 0.8), Math.min(Math.round(h * 2.2), Math.ceil(pc.rad + 2)));
      w.place = placeOf(w.cx, w.cy);
      mask = new Uint8Array(NN); pc.cells.forEach((i) => (mask[i] = 1));
      body = pc.cells;
    } else {
      /* the ring goes round the figure, not across it: centre it on the body
         (a busy area is found at the edge of a shape) and, while the body still
         runs out of the circle, let the circle grow a little (a figure that is
         a piece of its own is read whole, above). Always kept inside the cup
         and clear of the other figures. */
      for (let step = 0; step < 7 && body.length; step++) {
        let bx = 0, by = 0, out = 0;
        body.forEach((i) => { const x = i % N, y = (i / N) | 0; bx += x; by += y; if (Math.hypot(x - w.cx, y - w.cy) >= w.h - 1) out++; });
        bx = Math.round(bx / body.length); by = Math.round(by / body.length);
        /* lace never ends inside a circle: it may widen a little, not without end */
        const grow = out > body.length * 0.06 && w.h < Math.round(h * 1.35) ? Math.min(Math.round(h * 1.35), Math.round(w.h * 1.18)) : w.h;
        const d = Math.hypot(bx - C, by - C), lim = R0 - grow * 1.15;
        if (d > lim) { bx = Math.round(C + (bx - C) * lim / d); by = Math.round(C + (by - C) * lim / d); }
        if (bx === w.cx && by === w.cy && grow === w.h) break;
        if (picks.some((p) => Math.hypot(p.x * N - 0.5 - bx, p.y * N - 0.5 - by) < p.r * N + grow + 2)) break;
        w.cx = bx; w.cy = by; w.h = grow; w.place = placeOf(bx, by);
        ({ mask, body } = within(bx, by, w.h));
      }
    }
    /* two circles that overlap read as one muddle: the stronger one stays */
    if (picks.some((p) => Math.hypot(p.x * N - w.cx - 0.5, p.y * N - w.cy - 0.5) < (p.r * N + w.h + 0.5) * 1.08 + 1)) return;
    const b = measure(body.length ? body : [w.cy * N + w.cx]);
    let kind = kindOf(b);
    if (used.has(kind)) kind = FALLBACK[(body.length + n) % FALLBACK.length];
    for (let k = 0; used.has(kind) && k < FALLBACK.length; k++) kind = FALLBACK[(FALLBACK.indexOf(kind) + 1) % FALLBACK.length];
    used.add(kind);
    picks.push({ kind, place: w.place, x: (w.cx + 0.5) / N, y: (w.cy + 0.5) / N, r: (w.h + 0.5) / N, mask });
  };
  chosen.forEach(take);
  /* a figure dropped (read already, or overlapping a stronger one): the next
     busy area that stands clear of the others takes its place */
  let tries = 0;
  for (const w of cands) {
    if (picks.length >= 3 || w.s < best * 0.3 || tries > 24) break;
    if (chosen.includes(w)) continue;
    if (picks.some((p) => Math.hypot(p.x * N - 0.5 - w.cx, p.y * N - 0.5 - w.cy) < (p.r * N + h + 0.5) * 1.08 + 1)) continue;
    w.place = placeOf(w.cx, w.cy);
    tries++;
    take(w, picks.length + 3);
  }
  return { ok: true, density: usableDark / usableN, picks, debug: { cands: cands.slice(0, 14).map((w) => [w.cx, w.cy, +w.s.toFixed(3), placeOf(w.cx, w.cy)]), dark, pool, usable, h } };
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
  const $ = (sel) => root.querySelector(sel);
  const textEl = $("[data-fal-text]"), readingEl = $("[data-fal-reading]"), endEl = $("[data-fal-end]");
  const actionsEl = $("[data-fal-actions]"), privacyEl = $("[data-fal-privacy]");
  const btn = $("[data-fal-go]"), fileEl = $("[data-fal-file]");
  const photoFig = $("[data-fal-photo]"), photoImg = $("[data-fal-photo-img]"), marksEl = $("[data-fal-marks]"), glowEl = $("[data-fal-glow]");
  /* side by side, the words scroll in their own box: the wheel over the cup
     scrolls them too, so nothing below the fold is out of reach */
  const panelEl = $(".fal__panel");
  $(".fal__stage").addEventListener("wheel", (e) => {
    if (panelEl.scrollHeight <= panelEl.clientHeight) return;
    panelEl.scrollTop += e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? panelEl.clientHeight : 1);
  }, { passive: true });
  const steps = [].slice.call(root.querySelectorAll("[data-fal-step]"));
  let lastFocus = null, opts = {}, reading = null, photoUrl = "";

  function dispose(o) {
    o.traverse((m) => {
      if (m.geometry) m.geometry.dispose();
      if (m.material) { if (m.material.map) m.material.map.dispose(); m.material.dispose(); }
    });
  }
  function setup(name, next) {
    const n = cupOfDay(next);
    if (cup) { turn.remove(cup); dispose(cup); }
    if (symTex) symTex.dispose();
    picks = reading3D(name, n);
    symTex = symbolTexture(picks);
    telve = telveMaterial(symTex, (name || "x").length * 0.37 + new Date().getDate() * 0.11 + n * 0.53);
    cup = buildCup(telve);
    cup.position.y = 0.37;
    turn.add(cup);
    S.flip = 0; S.lift = 0; S.look = 0; S.show = -1;
    S.turnFrom = S.turnTo = 0; S.turnT = 1; turn.rotation.y = 0;
    telve.userData.U.uReveal.value = 0; telve.userData.U.uHi.value.set(0, 0, 0);
    cup.userData.liquid.visible = true;
  }

  /* the header stays over the reading: the panel starts under it */
  function headerHeight() {
    const h = document.querySelector(".site-header");
    root.style.setProperty("--hdr-h", (h ? Math.round(h.getBoundingClientRect().height) : 76) + "px");
  }
  function resize() {
    headerHeight();
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", () => { if (!root.hidden) { resize(); drawGlow(); } });

  /* how full the grounds are (the reading's opening): the cup's own, from
     its shapes — light, lively or crowded, the same for the same cup */
  function cupDensity() { return 0.1 + rng(picks.map((p) => p.kind + p.u.toFixed(5)).join("|"))() * 0.45; }

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
    const camR = 21 - lk * 6.5, camH = 6.5 + lk * 9.5, aimY = 2.6 + lk * 1.2;
    /* a narrow stage (a smaller window, beside the words): step back along
       the same line until the saucer fits, instead of cutting it */
    const back = Math.max(1, 1.15 / camera.aspect);
    camera.position.set(Math.sin(0.15) * camR * back, aimY + (camH - aimY) * back, Math.cos(0.15) * camR * back);
    camera.lookAt(0, aimY, 0);
    renderer.render(scene, camera);
  }
  function startLoop() { cancelAnimationFrame(S.raf); last = 0; S.raf = requestAnimationFrame(frame); }
  function stopLoop() { cancelAnimationFrame(S.raf); S.raf = 0; }

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
  const sfx = (name) => document.dispatchEvent(new CustomEvent("nr:sfx", { detail: name }));

  /* the four steps along the top of the panel */
  const STEP_OF = { wish: 0, cool: 1, cooled: 2, lift: 3, photo: 3, read: 3 };
  function stepper() {
    const k = STEP_OF[S.phase] ?? 0;
    steps.forEach((li, i) => {
      li.classList.toggle("is-done", i < k || S.phase === "read");
      if (i === k && S.phase !== "read") li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
  }

  /* the words for the phase the reading is in — drawn again on a language
     change (the page's walker would keep the old language in nodes it did
     not write itself) */
  function lead(s) { textEl.innerHTML = "<p class=\"fal__lead\"></p>"; textEl.firstChild.textContent = s; }
  function paint() {
    stepper();
    if (S.phase === "wish") { lead(S.failed === "open" ? T("This photo could not be opened — try a JPG or PNG.") : S.failed ? T("We could not see the coffee grounds. Take the photo from straight above, in good light, with the cup filling the frame.") : T("Make a wish. Then turn the cup over onto its saucer — or upload a photo of your own cup.")); btn.textContent = T("Turn the cup over"); }
    else if (S.phase === "cool") {
      lead(T("Let it cool. The grounds are settling."));
      if (S.waited) textEl.insertAdjacentHTML("beforeend", "<span class=\"fal__wait\"><i class=\"is-on\"></i></span>");
      btn.textContent = T("Turn the cup over");
    } else if (S.phase === "cooled" || S.phase === "lift") { lead(T("It has cooled. Lift the cup — gently.")); btn.textContent = T("Lift the cup"); }
    else if (S.phase === "photo") {
      lead(T("Reading the grounds in your photo…"));
    } else if (S.phase === "read") drawReading();
  }

  function go(phase) {
    S.phase = phase;
    root.dataset.phase = phase;
    if (phase === "wish") {
      paint();
      actionsEl.hidden = false; privacyEl.hidden = false; btn.disabled = false;
    } else if (phase === "cool") {
      actionsEl.hidden = true; privacyEl.hidden = true;
      S.waited = false;
      paint();
      anim("flip", 1, 1.2, () => {
        sfx("clink");
        textEl.insertAdjacentHTML("beforeend", "<span class=\"fal__wait\"><i></i></span>");
        S.waited = true;
        const bar = textEl.querySelector(".fal__wait i");
        requestAnimationFrame(() => { if (bar) bar.classList.add("is-on"); });
        later(reduced ? 200 : 3600, () => {
          go("cooled");
          actionsEl.hidden = false; $("[data-fal-upload]").hidden = true;
          btn.focus({ preventScroll: true });
        });
      });
    } else if (phase === "cooled") {
      paint();
    } else if (phase === "lift") {
      btn.disabled = true;
      cup.userData.liquid.visible = false;
      anim("lift", 1, 1.1, () => {
        sfx("clink");
        anim("look", 1, 1.4);
        const U = telve.userData.U, id = S.sid, t0 = performance.now();
        (function rev(now) { if (id !== S.sid) return; const k = Math.min(1, (now - t0) / 1600); U.uReveal.value = ease(k); if (k < 1) requestAnimationFrame(rev); })(performance.now());
        later(reduced ? 100 : 1500, () => read({ picks, density: cupDensity(), source: "cup" }));
      });
    }
  }

  /* --- the reading itself ---------------------------------------------------- */
  function show(i) {
    S.show = i;
    if (reading && reading.source === "cup") {
      telve.userData.U.uHi.value.set(i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0);
      S.turnFrom = turn.rotation.y;
      let to = faceU(picks[i].u);
      while (to - S.turnFrom > Math.PI) to -= Math.PI * 2;
      while (to - S.turnFrom < -Math.PI) to += Math.PI * 2;
      S.turnTo = to; S.turnT = 0;
    }
    marksEl.querySelectorAll("li").forEach((m, k) => m.classList.toggle("is-on", k === i));
    readingEl.querySelectorAll(".fal__item").forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
    drawGlow();
  }
  /* the outline of a figure's strokes: the mask softened (two binomial
     passes) and cut at half by marching squares — smooth line segments in
     grid units, x0 y0 x1 y1 at a time (the grid's own steps looked like
     stairs) */
  function contour(mask) {
    const N = PHOTO_N;
    let v = Float32Array.from(mask), w = new Float32Array(N * N);
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; w[i] = (v[x > 0 ? i - 1 : i] + 2 * v[i] + v[x < N - 1 ? i + 1 : i]) / 4; }
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; v[i] = (w[y > 0 ? i - N : i] + 2 * w[i] + w[y < N - 1 ? i + N : i]) / 4; }
    }
    const out = [], t = 0.5;
    const at = (p, q) => (t - p) / (q - p || 1e-6);
    for (let y = 0; y < N - 1; y++) for (let x = 0; x < N - 1; x++) {
      const a = v[y * N + x], b = v[y * N + x + 1], c = v[(y + 1) * N + x + 1], d = v[(y + 1) * N + x];
      const id = (a > t ? 1 : 0) | (b > t ? 2 : 0) | (c > t ? 4 : 0) | (d > t ? 8 : 0);
      if (id === 0 || id === 15) continue;
      const X = x + 0.5, Y = y + 0.5;
      const T = [X + at(a, b), Y], R = [X + 1, Y + at(b, c)], B = [X + at(d, c), Y + 1], L = [X, Y + at(a, d)];
      const seg = (p, q) => out.push(p[0], p[1], q[0], q[1]);
      switch (id) {
        case 1: case 14: seg(L, T); break;
        case 2: case 13: seg(T, R); break;
        case 3: case 12: seg(L, R); break;
        case 4: case 11: seg(R, B); break;
        case 6: case 9: seg(T, B); break;
        case 7: case 8: seg(L, B); break;
        case 5: seg(L, T); seg(R, B); break;
        case 10: seg(T, R); seg(L, B); break;
      }
    }
    return out;
  }
  /* on the photo: a ring round each figure; the one being read is lit like
     a loupe (the rest of the cup dims a little) and its strokes are traced */
  function drawGlow() {
    const cv = glowEl, ctx = cv.getContext("2d");
    const size = Math.round(photoFig.clientWidth * Math.min(2, window.devicePixelRatio || 1));
    if (cv.width !== size) cv.width = cv.height = size;
    ctx.clearRect(0, 0, size, size);
    if (!size || !reading || reading.source !== "photo") return;
    const cur = reading.picks[S.show];
    if (cur) {
      const cx = cur.x * size, cy = cur.y * size, r = cur.r * size * 1.08;
      ctx.fillStyle = "rgba(13, 9, 7, 0.46)";
      ctx.fillRect(0, 0, size, size);
      ctx.globalCompositeOperation = "destination-out";
      const hole = ctx.createRadialGradient(cx, cy, r * 0.82, cx, cy, r * 1.06);
      hole.addColorStop(0, "#000"); hole.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = hole;
      ctx.fillRect(0, 0, size, size);
      ctx.globalCompositeOperation = "source-over";
      if (!cur.trace) cur.trace = contour(cur.mask);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.98, 0, Math.PI * 2); ctx.clip();
      const k = size / PHOTO_N;
      ctx.lineWidth = Math.max(1.2, size / 400); ctx.lineCap = ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(246, 206, 160, 0.95)";
      ctx.shadowColor = "rgba(232, 178, 122, 0.8)"; ctx.shadowBlur = size / 90;
      ctx.beginPath();
      for (let j = 0; j < cur.trace.length; j += 4) { ctx.moveTo(cur.trace[j] * k, cur.trace[j + 1] * k); ctx.lineTo(cur.trace[j + 2] * k, cur.trace[j + 3] * k); }
      ctx.stroke();
      ctx.restore();
    }
    reading.picks.forEach((p, i) => {
      const on = i === S.show;
      ctx.beginPath(); ctx.arc(p.x * size, p.y * size, p.r * size * 1.08, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1, size / 380) * (on ? 1.5 : 1);
      ctx.strokeStyle = on ? "rgba(232, 178, 122, 0.95)" : "rgba(244, 239, 229, 0.55)";
      ctx.stroke();
    });
  }
  function stopAuto() { clearInterval(S.auto); S.auto = 0; }

  function drawReading() {
    if (!reading) return;
    const name = (opts.name || "").trim();
    const lc = (s) => s.toLocaleLowerCase(document.documentElement.lang || "en");
    const kinds = reading.picks.map((p) => p.kind);
    const fullness = reading.density > 0.42 ? "full" : reading.density < 0.2 ? "light" : "mid";
    const yes = kinds.find((k) => YES.includes(k)), hard = kinds.find((k) => HARD.includes(k));
    let wish;
    if (yes) wish = T("Yes — it will happen. The %s in your cup says so.").replace("%s", lc(T(SYMBOLS[yes].name)));
    else if (hard) wish = T("It will happen, but not on its own. Ask again in three days.");
    else wish = T("The cup is on your side — give it a little time.");
    readingEl.innerHTML =
      "<p class=\"fal__hello\"></p><p class=\"fal__open\"></p><ol class=\"fal__list\"></ol>" +
      "<dl class=\"fal__more\"><div><dt class=\"label\"></dt><dd></dd></div><div><dt class=\"label\"></dt><dd></dd></div></dl>";
    readingEl.querySelector(".fal__hello").textContent = name ? T("%s, here is what your cup says.").replace("%s", name) : T("Here is what your cup says.");
    readingEl.querySelector(".fal__open").textContent = T(OPENINGS[fullness]);
    const list = readingEl.querySelector(".fal__list");
    reading.picks.forEach((p, i) => {
      const S0 = SYMBOLS[p.kind], P0 = PLACES[p.place];
      const li = document.createElement("li");
      li.style.setProperty("--i", i);
      li.innerHTML = "<button type=\"button\" class=\"fal__item\"><span class=\"fal__num\" aria-hidden=\"true\"></span><span class=\"fal__where label\"></span><span class=\"fal__name\"><strong></strong><em class=\"fal__area\"></em></span><span class=\"fal__say\"></span></button>";
      li.querySelector(".fal__num").textContent = String(i + 1);
      li.querySelector(".fal__where").textContent = T(P0.where) + " — " + T(P0.means);
      li.querySelector("strong").textContent = T(S0.name);
      li.querySelector(".fal__area").textContent = T(S0.area);
      li.querySelector(".fal__say").textContent = T(S0.say);
      li.querySelector("button").addEventListener("click", () => { stopAuto(); show(i); });
      list.appendChild(li);
    });
    const dts = readingEl.querySelectorAll(".fal__more dt"), dds = readingEl.querySelectorAll(".fal__more dd");
    dts[0].textContent = T("Your wish"); dds[0].textContent = wish;
    dts[1].textContent = T("When?"); dds[1].textContent = T("Within three: three days, three weeks or three months. The cup never says which.");
    if (S.show >= 0) show(S.show);
  }
  function read(rd) {
    reading = rd;
    S.phase = "read"; root.dataset.phase = "read";
    stepper();
    textEl.innerHTML = "";
    actionsEl.hidden = true; privacyEl.hidden = true;
    drawReading();
    readingEl.hidden = false;
    endEl.hidden = false;
    S.show = -1; show(0);
    const first = readingEl.querySelector(".fal__item");
    if (first) first.focus({ preventScroll: true });
    /* then the next, and the next — the reader can take over at any time */
    stopAuto();
    let k = 0;
    S.auto = setInterval(() => { if (S.phase !== "read" || ++k >= reading.picks.length) return stopAuto(); show(k); }, 3400);
  }

  /* --- a photo of the reader's own cup ---------------------------------------- */
  /* back to the cup, with the reason; the photo button keeps the focus */
  function photoFailed(why) {
    S.failed = why;
    photoFig.hidden = true; photoFig.classList.remove("is-scanning"); root.classList.remove("is-photo");
    startLoop();
    go("wish");
    fileEl.focus({ preventScroll: true });
  }
  function readPhoto(file) {
    if (!file) return;                                /* the picker was cancelled */
    if (!/^image\//.test(file.type || "image/")) { S.sid++; stopAuto(); photoFailed("open"); return; }
    S.sid++; stopAuto();
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = URL.createObjectURL(file);
    S.phase = "photo"; S.failed = false; root.dataset.phase = "photo";
    root.classList.add("is-photo");                  /* the photo takes the stage: no 3D cup behind it */
    actionsEl.hidden = true; privacyEl.hidden = true; readingEl.hidden = true; endEl.hidden = true;
    marksEl.innerHTML = "";
    glowEl.getContext("2d").clearRect(0, 0, glowEl.width, glowEl.height);
    stopLoop();
    photoFig.hidden = false; photoFig.classList.add("is-scanning");
    paint();
    const id = S.sid, img = photoImg;
    img.onload = () => {
      if (id !== S.sid) return;
      const t0 = performance.now();
      let res;
      try { res = analysePhoto(img); } catch (err) { res = { ok: false, open: true }; }
      later(Math.max(reduced ? 0 : 1800 - (performance.now() - t0), 0), () => {
        photoFig.classList.remove("is-scanning");
        if (!res.ok) { photoFailed(res.open ? "open" : "grounds"); return; }
        /* read the way a reader turns the cup: the handle, the rim, the
           bottom. Only what was found — no card is made up to fill three */
        res.picks.sort((a, b) => a.place - b.place);
        /* the number sits on its own ring — top right unless that is on the
           photo's edge or toward another ring (a "2" sat on ring 3's line) */
        const ANG = [-0.25, -0.75, 0.25, 0.75, -0.5, 0, 1, 0.5].map((t) => t * Math.PI);
        res.picks.forEach((p, i) => {
          let at = ANG[0], best = -Infinity;
          ANG.forEach((a) => {
            const bx = p.x + Math.cos(a) * p.r * 1.08, by = p.y + Math.sin(a) * p.r * 1.08;
            if (Math.hypot(bx - 0.5, by - 0.5) > 0.46) return;
            const clear = Math.min(1, ...res.picks.filter((q) => q !== p).map((q) => Math.hypot(bx - q.x, by - q.y) - q.r * 1.08));
            if (clear > best + 0.02) { best = clear; at = a; }
          });
          const m = document.createElement("li");
          m.textContent = String(i + 1);
          m.style.setProperty("--i", i);
          m.style.left = ((p.x + Math.cos(at) * p.r * 1.08) * 100).toFixed(2) + "%";
          m.style.top = ((p.y + Math.sin(at) * p.r * 1.08) * 100).toFixed(2) + "%";
          marksEl.appendChild(m);
        });
        read({ picks: res.picks, density: res.density, source: "photo" });
      });
    };
    img.onerror = () => { if (id !== S.sid) return; photoFailed("open"); };     /* e.g. HEIC where the browser cannot open it */
    img.src = photoUrl;
  }
  fileEl.addEventListener("change", () => { const f = fileEl.files && fileEl.files[0]; fileEl.value = ""; readPhoto(f); });

  btn.addEventListener("click", () => {
    if (S.phase === "wish") go("cool");
    else if (S.phase === "cooled") go("lift");
  });
  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-fal-close]")) hide();
    else if (e.target.closest("[data-fal-again]")) restart();
  });
  /* the header stays with the reading (its language switch included); a
     link in it leaves the reading for that part of the page */
  document.addEventListener("click", (e) => {
    if (root.hidden) return;
    /* ...and so does the bill's "Order a coffee" (the bill opens over it) */
    if (e.target.closest(".site-header a[href^='#'], [data-bill-order]")) hide(true);
  });
  document.addEventListener("keydown", (e) => {
    /* the bill, opened over the reading from the header, closes first */
    if (root.hidden || e.key !== "Escape" || document.documentElement.classList.contains("is-bill")) return;
    e.preventDefault(); e.stopImmediatePropagation(); hide();
  }, true);

  /* the page behind the reading is out of reach while it is open — but the
     header is not: it carries the language switch */
  const behind = () => [document.getElementById("main"), document.querySelector(".site-footer"), document.querySelector(".rail")].filter(Boolean);

  function fresh(next) {
    reading = null; S.failed = false;
    root.classList.remove("is-photo");
    if (photoUrl) { URL.revokeObjectURL(photoUrl); photoUrl = ""; }
    photoFig.hidden = true; photoFig.classList.remove("is-scanning"); marksEl.innerHTML = "";
    glowEl.getContext("2d").clearRect(0, 0, glowEl.width, glowEl.height);
    readingEl.hidden = true; readingEl.innerHTML = ""; endEl.hidden = true;
    textEl.innerHTML = "";
    btn.hidden = false; $("[data-fal-upload]").hidden = false;
    setup(opts.name || "", next);
    resize(); startLoop();
    go("wish");
  }
  function restart() { S.sid++; stopAuto(); fresh(true); btn.focus({ preventScroll: true }); }

  function showReading(o) {
    if (!root.hidden && root.classList.contains("is-open")) return;     /* already open (a double click while loading) */
    clearTimeout(S.hideT);
    S.sid++; stopAuto();
    opts = o || {};
    lastFocus = document.activeElement;
    root.hidden = false;
    document.documentElement.classList.add("is-fal");
    behind().forEach((el) => { el.inert = true; });
    document.dispatchEvent(new CustomEvent("nr:overlay", { detail: true }));   /* the page's own scene can rest */
    /* a phone out of canvas memory throws here: give the page back, never a
       locked page under an invisible layer (js/site.js shows the reason) */
    try { fresh(); } catch (err) { hide(true); throw err; }
    requestAnimationFrame(() => root.classList.add("is-open"));
    btn.focus({ preventScroll: true });
  }
  function hide(leaving) {
    if (root.hidden) return;
    S.sid++; stopAuto();
    S.phase = "idle";
    root.classList.remove("is-open");
    document.documentElement.classList.remove("is-fal");
    behind().forEach((el) => { el.inert = false; });
    document.dispatchEvent(new CustomEvent("nr:overlay", { detail: false }));
    clearTimeout(S.hideT);
    S.hideT = setTimeout(() => { root.hidden = true; stopLoop(); if (photoUrl) { URL.revokeObjectURL(photoUrl); photoUrl = ""; } }, reduced ? 0 : 420);
    if (!leaving && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  /* another language can change the header's height (and the words) */
  if (window.NR) window.NR.onChange.push(() => { if (!root.hidden) { headerHeight(); paint(); } });

  /* ?probe: a test can jump straight to the reading, or read a test photo */
  if (/[?&]probe/.test(location.search)) window.__fal = {
    read: () => { S.flip = 1; S.lift = 1; S.look = 1; cup.userData.liquid.visible = false; telve.userData.U.uReveal.value = 1; read({ picks, density: cupDensity(), source: "cup" }); },
    picks: () => (reading ? reading.picks : picks),
    photo: (blob) => readPhoto(new File([blob], "cup.jpg", { type: blob.type || "image/jpeg" })),
    analyse: (img) => analysePhoto(img)
  };
  return { show: showReading, hide };
}

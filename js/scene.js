/* ==========================================================================
   The stage — a cup you order, then design
   --------------------------------------------------------------------------
   One fixed canvas behind the page. Scroll drives where the cup sits; the
   drink choice drives what is in it; the configurator drives what it is made
   of. Geometry lives in cup.js; this file is the scene, the choreography and
   the wiring.

   Decisions worth knowing:
   · Every option change is animated, never snapped. Colours ease to their
     target in the render loop and the cup tweens between sizes. A value that
     jumps is what makes a configurator feel like a form instead of a product.
   · Geometry is rebuilt only when the SIZE changes; colour, sleeve and lid
     are material and visibility changes.
   · Steam only exists for hot drinks, and rises from the spout when the lid
     is on. It is the detail that makes the coffee read as hot.
   · Rendering stops when the tab is hidden or reduced motion is requested.
   ========================================================================== */

import * as THREE from "./vendor/three/three.module.min.js";
import {
  SIZES, CUP_COLOURS, SERVICES, FINISHES, PATTERNS, SLEEVES, LIDS, MILKS, SHOTS, GRINDS, BEANS,
  paperRoughness, ribNormal, printMap, patternMask, latteMap, corkMap,
  bodyProfile, sleeveProfile, lidProfile, buildSpout,
  mugSize, mugOuterProfile, mugInnerProfile, mugHandle
} from "./cup.js?v=16";

/* milk: made with milk (it cannot be taken out); shots: built on espresso
   (cold brew has none to double) */
export const DRINKS = {
  filter:    { label: "Filter",     price: 4.20, liquid: 0x4a2a14, hot: true,  milk: false, shots: false },
  flatwhite: { label: "Flat white", price: 5.40, liquid: 0xb08a5f, hot: true,  milk: true,  shots: true },
  cortado:   { label: "Cortado",    price: 4.80, liquid: 0x96633c, hot: true,  milk: true,  shots: true },
  coldbrew:  { label: "Cold brew",  price: 5.80, liquid: 0x25140a, hot: false, milk: false, shots: false },
  espresso:  { label: "Espresso",   price: 3.20, liquid: 0x1d0f07, hot: true,  milk: false, shots: true }
};

const canvas = document.querySelector(".stage");
if (canvas) boot(canvas);

function boot(canvas) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    return;   /* No WebGL: the page is still a complete, readable site. */
  }

  /* Full Retina, capped at 2: the cup is the product, and at 1.75 its rim
     and the printed wordmark were visibly soft on 4K and phone screens. A 3x
     phone at 2 is still 4/9 of the fragments of its native resolution. */
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;

  const scene = new THREE.Scene();
  const BASE_FOV = 30, CAM_Z = 7.6;
  const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.1, 60);
  camera.position.set(0, 0.62, CAM_Z);
  camera.lookAt(0, 0.02, 0);

  /* --- Light -------------------------------------------------------------
     A large soft key from the front-left, a cool bounce from the right, and
     a hard rim from behind. The rim is what stops a bone-coloured cup
     dissolving into a cream page. */
  const key = new THREE.DirectionalLight(0xfff3e2, 1.85);
  key.position.set(-3.4, 5.4, 4.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);   /* re-rendered every frame; 2048 was free money burnt */
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 20;
  key.shadow.camera.left = -4; key.shadow.camera.right = 4;
  key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  key.shadow.bias = -0.0006;
  key.shadow.radius = 4;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xdae6ff, 0.5);
  fill.position.set(4.2, 1.8, 2.4);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 1.15);
  rim.position.set(1.2, 3.4, -4.6);
  scene.add(rim);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd6ccbc, 0.38));
  scene.environment = buildEnv();

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 26),
    new THREE.ShadowMaterial({ opacity: 0.16 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  /* --- Materials ---------------------------------------------------------- */
  const roughTex = paperRoughness();
  const ribTex = ribNormal();
  /* the print's resolution follows the screen: 2048 px around the cup on an
     ordinary display or a phone, 4096 on a 1440p/4K one */
  const PRINT_SCALE = Math.min(window.devicePixelRatio, 2) * window.innerWidth > 2400 ? 4 : 2;
  let print = printMap(PRINT_SCALE);
  print.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const matBody = new THREE.MeshPhysicalMaterial({
    color: CUP_COLOURS.bone.hex,
    map: print,
    roughnessMap: roughTex,
    roughness: 0.88, metalness: 0.0,
    clearcoat: 0.12, clearcoatRoughness: 0.8,
    envMapIntensity: 0.55,
    side: THREE.DoubleSide
  });
  /* The all-over pattern: a mask laid on in the shader, BEFORE the print
     multiplies through — so the logo still sits on top of it — in a shade of
     the cup's own colour that eases with it. patternMix fades a pattern in
     and out; switching between two is a fade out, a swap, a fade in. */
  const patternU = {
    patternMap: { value: patternMask("plain", 1) },
    patternColor: { value: new THREE.Color(0x000000) },
    patternMix: { value: 0 }
  };
  matBody.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, patternU);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform sampler2D patternMap;\nuniform vec3 patternColor;\nuniform float patternMix;")
      .replace("#include <map_fragment>",
        "{ float pm = texture2D(patternMap, vMapUv).r * patternMix; diffuseColor.rgb = mix(diffuseColor.rgb, patternColor, pm); }\n#include <map_fragment>");
  };
  const matSleeve = new THREE.MeshStandardMaterial({
    color: SLEEVES.kraft.hex,
    normalMap: ribTex,
    roughnessMap: roughTex,
    roughness: 0.95, metalness: 0.0, envMapIntensity: 0.35
  });
  matSleeve.normalScale.set(0.5, 0.5);

  const matLid = new THREE.MeshPhysicalMaterial({
    color: LIDS.bone.hex, roughness: 0.38, metalness: 0.0,
    clearcoat: 0.85, clearcoatRoughness: 0.22, envMapIntensity: 1.0
  });
  const matHole = new THREE.MeshBasicMaterial({ color: 0x120c08 });
  const matCoffee = new THREE.MeshPhysicalMaterial({
    color: DRINKS.filter.liquid, roughness: 0.18, metalness: 0.0,
    clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.5,
    map: latteMap("heart")
  });
  /* Latte art: the map is a foam MASK, not a picture multiplied over the
     coffee — the foam is laid on in its own colour, faded by latteMix. */
  const latteU = { latteColor: { value: new THREE.Color(0xf1e6d2) }, latteMix: { value: 0 } };
  matCoffee.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, latteU);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 latteColor;\nuniform float latteMix;")
      .replace("#include <map_fragment>",
        "{ float lm = texture2D(map, vMapUv).r * latteMix; diffuseColor.rgb = mix(diffuseColor.rgb, latteColor, lm); }");
  };
  let latteShown = "heart";
  /* the mug: glazed inside (always cream), the handle in the cup's colour */
  const matMugIn = new THREE.MeshPhysicalMaterial({
    color: 0xf1ece3, roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.12, envMapIntensity: 1.1, side: THREE.DoubleSide
  });
  const matHandle = new THREE.MeshPhysicalMaterial({
    color: CUP_COLOURS.bone.hex, roughness: 0.4, clearcoat: 0.9, clearcoatRoughness: 0.14, envMapIntensity: 1.0
  });
  const corkTex = corkMap();
  /* ice for the iced drinks, floating at the top when the cup is open */
  const matIce = new THREE.MeshPhysicalMaterial({
    color: 0xeef6ff, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04,
    transparent: true, opacity: 0.5, envMapIntensity: 1.8, depthWrite: false
  });
  const ice = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.15, 0.16), matIce);
    m.userData.seed = Math.random() * 6.28;
    ice.add(m);
  }

  /* --- Cup ---------------------------------------------------------------- */
  const cup = new THREE.Group();
  scene.add(cup);

  const state = {
    drink: "filter", size: "tall", service: "go", cup: "bone", finish: "matte", pattern: "plain",
    sleeve: "kraft", lid: "bone", name: "", milk: "none", shot: "single",
    beans: false, grind: "whole"
  };
  /* what is on screen: the paper cup while the film hands over (its last
     frame IS a paper cup), whatever was chosen everywhere else */
  let shownService = "go", bump = 1, leanTop = 0;

  let body, sleeve, lid, spout, coffee, mugOut, mugIn, handle;
  let shownH = SIZES[state.size].h;     /* tweened, so size changes glide */

  buildGeometry();

  function buildGeometry() {
    [body, sleeve, lid, coffee, mugOut, mugIn, handle].forEach((m) => {
      if (!m) return;
      cup.remove(m); m.geometry.dispose();
    });
    if (spout) {
      cup.remove(spout);
      spout.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    }

    const S = SIZES[state.size];
    const h = S.h, rb = S.rb, rt = S.rt;

    body = new THREE.Mesh(new THREE.LatheGeometry(bodyProfile(h, rb, rt), 160), matBody);
    body.castShadow = true; cup.add(body);

    sleeve = new THREE.Mesh(new THREE.LatheGeometry(sleeveProfile(h, rb, rt), 160), matSleeve);
    sleeve.castShadow = true; cup.add(sleeve);

    lid = new THREE.Mesh(new THREE.LatheGeometry(lidProfile(h, rt), 160), matLid);
    lid.castShadow = true; cup.add(lid);

    spout = buildSpout(h, rt, matLid, matHole);
    cup.add(spout);

    /* the mug for "for here", sharing the cup's print and pattern material */
    const M = mugSize(S);
    mugOut = new THREE.Mesh(new THREE.LatheGeometry(mugOuterProfile(M.h, M.rb, M.rt), 160), matBody);
    mugOut.castShadow = true; cup.add(mugOut);
    mugIn = new THREE.Mesh(new THREE.LatheGeometry(mugInnerProfile(M.h, M.rt), 160), matMugIn);
    cup.add(mugIn);
    handle = new THREE.Mesh(mugHandle(M.h, M.rb, M.rt), matHandle);
    handle.castShadow = true; cup.add(handle);

    const here = shownService === "here";
    const cr = here ? M.rt - 0.085 : rt - 0.035;
    coffee = new THREE.Mesh(new THREE.CircleGeometry(cr, 96), matCoffee);
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = here ? M.h - 0.1 : h - 0.17;
    cup.add(coffee);
    ice.position.y = coffee.position.y + 0.03;
    ice.children.forEach((c, i) => {
      const a = (i / ice.children.length) * Math.PI * 2 + 0.4, r = cr * (i ? 0.55 : 0.05);
      c.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      c.rotation.set(c.userData.seed, c.userData.seed * 1.7, c.userData.seed * 0.6);
    });
    if (!ice.parent) cup.add(ice);

    applyVisibility();
  }

  function applyVisibility() {
    const here = shownService === "here";
    const hasSleeve = !here && SLEEVES[state.sleeve].hex !== null;
    const hasLid = !here && LIDS[state.lid].hex !== null;
    body.visible = !here;
    mugOut.visible = mugIn.visible = handle.visible = here;
    sleeve.visible = hasSleeve;
    lid.visible = hasLid;
    spout.visible = hasLid;
    coffee.visible = here || !hasLid || !!LIDS[state.lid].clear;   /* a clear lid shows the coffee */
    ice.visible = coffee.visible && !DRINKS[state.drink].hot;     /* cold brew: ice at the top */
  }

  /* --- Animated material targets ------------------------------------------
     Nothing is assigned directly; the loop eases towards these. */
  const target = {
    body: new THREE.Color(CUP_COLOURS.bone.hex),
    sleeve: new THREE.Color(SLEEVES.kraft.hex),
    lid: new THREE.Color(LIDS.bone.hex),
    coffee: new THREE.Color(DRINKS.filter.liquid),
    metal: 0, sleeveRough: 0.95, sleeveEnv: 0.35,
    pattern: new THREE.Color(0x000000), patternMix: 0, patternWant: "plain",
    rough: FINISHES.matte.rough, coat: FINISHES.matte.coat, coatRough: FINISHES.matte.coatRough,
    lidOpacity: 1, latte: 0
  };
  let patternShown = "plain";
  const tmpC = new THREE.Color();
  /* the reader's own extras choice; constrain() derives state.milk/shot */
  const chosen = { milk: "none", shot: "single" };

  function applyMaterials() {
    target.body.setHex(CUP_COLOURS[state.cup].hex);
    /* cork: a granular board, its own map (a recompile only when it changes) */
    const corkOn = !!SLEEVES[state.sleeve].cork;
    if ((matSleeve.map === corkTex) !== corkOn) { matSleeve.map = corkOn ? corkTex : null; matSleeve.needsUpdate = true; }
    /* latte art: a heart in a milk drink, a swirl where milk went into black
       coffee, nothing in a black coffee or cold brew */
    const D0 = DRINKS[state.drink];
    const art = !D0.hot ? null : D0.milk ? "heart" : state.milk !== "none" ? "swirl" : null;
    target.latte = art ? 1 : 0;
    if (art && art !== latteShown) { matCoffee.map.dispose(); matCoffee.map = latteMap(art); latteShown = art; }

    const sl = SLEEVES[state.sleeve];
    if (sl.hex !== null) {
      target.sleeve.setHex(sl.hex);
      /* Not a chrome mirror: a brushed copper foil. Full metalness with a
         low roughness turns the sleeve into a black tube everywhere the
         environment is dark, which is most of it. */
      target.metal = sl.metal ? 0.55 : 0.0;
      target.sleeveRough = sl.metal ? 0.38 : 0.95;
      target.sleeveEnv = sl.metal ? 2.2 : 0.35;
    }
    const li = LIDS[state.lid];
    if (li.hex !== null) target.lid.setHex(li.hex);
    target.lidOpacity = li.clear ? 0.2 : 1;
    /* a recompile only when the lid really turns clear or back: needsUpdate on
       every option change rebuilt the lid's shader on every click */
    if (matLid.transparent !== !!li.clear) {
      matLid.transparent = !!li.clear;
      matLid.depthWrite = !li.clear;
      matLid.needsUpdate = true;
    }

    /* the paper's finish */
    const fi = FINISHES[state.finish];
    target.rough = fi.rough; target.coat = fi.coat; target.coatRough = fi.coatRough;

    /* the pattern: a darker shade on a light cup, a lighter one on a dark cup */
    const light = target.body.r * 0.2126 + target.body.g * 0.7152 + target.body.b * 0.0722 > 0.18;
    target.pattern.copy(target.body).lerp(tmpC.setHex(light ? 0x1e1611 : 0xf4efe5), light ? 0.2 : 0.24);
    target.patternWant = state.pattern;

    /* the coffee: milk lightens it (a lot in a black coffee, a little in a
       milk drink), a second shot darkens it */
    const D = DRINKS[state.drink], M = MILKS[state.milk];
    target.coffee.setHex(D.liquid);
    if (M.tint !== null) target.coffee.lerp(tmpC.setHex(M.tint), D.milk ? 0.12 : 0.38);
    if (state.shot === "double" && D.shots) target.coffee.lerp(tmpC.setHex(0x1d0f07), 0.18);
    applyVisibility();
  }

  /* one mask on the GPU at a time, at most 2048 px around: simple shapes need
     no more, and a 4096 mask is 32 MB of video memory. "Plain" needs no mask
     at all — the mix simply stays at zero over whatever was there. */
  function swapPattern() {
    if (target.patternWant === patternShown) return;
    patternShown = target.patternWant;
    if (patternShown === "plain") return;
    patternU.patternMap.value.dispose();
    patternU.patternMap.value = patternMask(patternShown, Math.min(PRINT_SCALE, 2));
  }

  const steam = buildSteam();
  cup.add(steam.points);

  /* --- Scroll choreography ------------------------------------------------
     One stop per section, in scroll order: hero, 01 the coffee, 02 the cup,
     03 the craft, and an exit above the footer.

     Five channels, not two. A subject that only slides left and right at a
     constant size reads as a background image being panned; what makes it
     read as an object being HANDLED is that it also comes towards you, leans,
     and turns at an uneven rate:

       x    across the frame, as a fraction of the half-width
       y    up and down
       z    towards the camera — depth, so it can be picked up and put back
       s    size
       ry   how far it has turned
       tilt how far it is leaning (roll)
       nod  how far it is tipping towards or away from the viewer (pitch)

     `ease` is per segment. Some legs snap into place (a tight curve), others
     drift (a slack one). Uniform easing everywhere is the other half of why
     scroll animation usually feels mechanical. */
  const STOPS = [
    /* Hero — standing to the right, almost square to the camera. */
    { p: 0.00, x:  0.46, y: -0.04, z:  0.00, s: 0.96, ry: -0.45, tilt: -0.05, nod:  0.00, ps: 1, py: 0, ease: 1.0 },
    /* 01 the coffee — swings across and away, leaning into the turn. */
    { p: 0.24, x: -0.42, y: -0.08, z: -0.55, s: 0.88, ry:  1.15, tilt:  0.11, nod:  0.05, ps: 1, py: 0, ease: 1.6 },
    /* 02 the cup — lifted, brought forward, presented straight on. On a
       phone (ps/py: scale and lift there only) a little smaller and higher,
       so the whole cup clears the option card below it (measured: its base
       sat ~20px behind the card's top edge). */
    { p: 0.50, x: -0.36, y:  0.02, z:  1.10, s: 1.00, ry:  2.65, tilt: -0.02, nod: -0.03, ps: 0.82, py: 0.36, ease: 0.7 },
    /* 03 the craft — set back down and tipped away, out of the reading line. */
    { p: 0.78, x: -0.54, y:  0.04, z: -1.30, s: 0.86, ry:  4.05, tilt:  0.16, nod:  0.09, ps: 1, py: 0, ease: 1.3 },
    /* Exit — rises, turns away and recedes as the dark footer arrives. */
    { p: 1.00, x:  0.22, y:  1.05, z: -3.20, s: 0.72, ry:  5.30, tilt: -0.24, nod:  0.16, ps: 1, py: 0, ease: 2.0 }
  ];

  const KEYS = ["x", "y", "z", "s", "ry", "tilt", "nod", "ps", "py"];
  const at = {};

  function sample(p) {
    if (p <= STOPS[0].p) { KEYS.forEach((k) => (at[k] = STOPS[0][k])); return at; }
    for (let i = 1; i < STOPS.length; i++) {
      const a = STOPS[i - 1], b = STOPS[i];
      if (p <= b.p) {
        let k = (p - a.p) / (b.p - a.p);
        /* smoothstep, then bent by the segment's own ease: below 1 it leaves
           and arrives faster, above 1 it hangs in the middle of the leg. */
        let e = k * k * (3 - 2 * k);
        if (b.ease !== 1) e = Math.pow(e, b.ease);
        KEYS.forEach((key) => (at[key] = a[key] + (b[key] - a[key]) * e));
        return at;
      }
    }
    const last = STOPS[STOPS.length - 1];
    KEYS.forEach((k) => (at[k] = last[k]));
    return at;
  }

  /* The cup has to be GONE before the footer arrives, not still fading while
     the dark band climbs over it — that is what "it disappears badly at the
     bottom" looked like. So the fade is measured against the footer itself
     rather than against a fraction of the page: fully opaque while the band
     is still below the fold, fully gone once it owns the bottom third. Tying
     it to a scroll percentage meant re-tuning it every time the page grew.

     The footer's document offset is cached instead of read per frame: the
     loop writes an inline opacity every frame, and reading a rect after that
     write forces a synchronous layout on every single one. */
  const footerEl = document.querySelector(".site-footer");
  let footerTopDoc = Infinity;

  function measureFooter() {
    if (footerEl) footerTopDoc = footerEl.getBoundingClientRect().top + window.scrollY;
  }

  function exitFade() {
    if (!footerEl) return 1;
    const h = window.innerHeight || 1;
    const top = footerTopDoc - window.scrollY;      /* in viewport pixels */
    let k = (top - h * 0.62) / (h * 0.34);
    k = Math.max(0, Math.min(1, k));
    return k * k * (3 - 2 * k);
  }

  let halfW = 3, wide = true;
  function layout() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    /* the page's own lens, not camera.fov: during the film handoff the fov
       is borrowed for a moment, and layout must not measure that */
    const halfH = Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * CAM_Z;
    halfW = halfH * camera.aspect;
    wide = w >= 940;
  }

  /* --- Drag to turn -------------------------------------------------------- */
  let userSpin = 0, dragging = false, lastX = 0;
  /* While the reader is writing a name, the cup turns its print to them —
     they see the name land on the cup as they type. The wordmark is printed
     twice around, at u 0.25 and 0.75, i.e. facing the camera at a turn of
     -pi/2 or +pi/2 (a lathe puts u = 0 on +z); the nearer one is taken.
     Turning the cup by hand, or leaving the Name tab, hands the angle back
     (folded into userSpin, so nothing jumps). */
  let faceSpin = 0, facing = false, faceAt = 0, lastSpin = 0;
  function face(on) {
    if (on && !facing) {
      /* choose the side ONCE, as an absolute angle nearest to what is shown:
         re-choosing every frame flipped the cup 180 degrees whenever the idle
         turn crossed a multiple of pi (review, 11.10) */
      const shown = lastSpin + faceSpin, TAU = Math.PI * 2;
      faceAt = [-Math.PI / 2, Math.PI / 2]
        .map((a) => a + Math.round((shown - a) / TAU) * TAU)
        .reduce((p, q) => (Math.abs(q - shown) < Math.abs(p - shown) ? q : p));
    }
    if (facing && !on) { userSpin += faceSpin; faceSpin = 0; }
    facing = on;
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (!canvas.classList.contains("is-interactive")) return;
    face(false);
    dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    userSpin += (e.clientX - lastX) * 0.009;
    lastX = e.clientX;
    /* The prompt has been followed; it does not need to keep asking. */
    canvas.classList.add("is-turned");
  });
  const endDrag = () => { dragging = false; };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  /* --- Pointer parallax ---------------------------------------------------
     The camera leans a couple of degrees towards the cursor. Small enough
     that nobody reads it as an effect, large enough that the object stops
     feeling like a flat picture pinned to the page. Mouse only: on a
     touchscreen there is no hover, so the same code would only ever fire
     mid-tap and jolt the scene. */
  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", (e) => {
      look.tx = (e.clientX / window.innerWidth) * 2 - 1;
      look.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  /* --- Loop ---------------------------------------------------------------- */
  /* Read the real state, do not assume it. A page opened in a background
     tab starts hidden, and requestAnimationFrame never fires there — so a
     loop that believes it is running is a loop that never runs. */
  let running = false, visible = !document.hidden;
  const clock = new THREE.Clock();
  let scrollP = 0, shownP = 0, ownsOpacity = false;

  /* --- The opening film ---------------------------------------------------
     The page opens on a rendered film (film/film.js) whose last frame is this
     scene's first: same camera, same lens, same cup in the same pose. film.js
     reports where it ends. Until then this scene sleeps behind it; through the
     film's final hold it draws exactly the film's pose (no idle sway, no
     parallax, the lens matched to how the film is cropped on this screen), so
     the film can fade away over it without a seam; over the next screen it
     eases into the page's own choreography. */
  let film = window.__filmLayout || null;
  let hand = 0, asleep = false, idle = 0, heroTop = 0;
  const FILM_CUP = {
    x: 0.46 * Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * CAM_Z * 16 / 9,   /* STOPS[0] on a 16:9 screen */
    y: -SIZES.tall.h / 2 - 0.12, s: 0.96, ry: -0.45, tilt: -0.05
  };
  const FILM_EYE = {
    "16x9": { cam: new THREE.Vector3(0, 0.62, CAM_Z), tgt: new THREE.Vector3(0, 0.02, 0), aspect: 16 / 9 },
    /* the phone layout (cup at 0.58, eye lowered 1.25) seen with a full-size cup */
    "9x16": { cam: new THREE.Vector3(FILM_CUP.x, FILM_CUP.y + 0.45 / 0.58, CAM_Z / 0.58),
              tgt: new THREE.Vector3(FILM_CUP.x, FILM_CUP.y - 0.15 / 0.58, 0), aspect: 9 / 16 }
  };
  const eyeP = new THREE.Vector3(), eyeT = new THREE.Vector3();
  window.addEventListener("film:layout", (e) => {
    film = e.detail;
    /* the film sets its own height after this script has measured the page:
       the footer moved ~10 screens down, and a stale offset reads as "the
       footer is here" — exitFade() would hide the cup the film hands over to */
    measureScroll(); measureFooter(); readScroll();
    if (ownsOpacity) canvas.style.opacity = String(exitFade());
    if (!asleep) start();
  });

  /* The scrollable height is cached. Asking for scrollHeight inside a scroll
     handler forces a layout recalculation before the browser can answer, on
     every event — the single cheapest way to make a page stutter. It only
     changes when the page is re-laid-out, so that is when it is measured. */
  let scrollMax = 0;
  function measureScroll() {
    /* Blocks at the foot of the page that come after the cup has left (the
       table QR, the coffee reading) must not stretch the choreography: they
       made the page longer, every section reached its stop later, and at 03
       the cup stood half-way to its pose (measured: 03 at p 0.686 for a 0.78
       stop, 0.738 without the QR). Their height is left out. */
    let after = 0;
    document.querySelectorAll("[data-after-exit]").forEach((el) => {
      const cs = getComputedStyle(el);
      after += el.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
    });
    scrollMax = Math.max(0, document.documentElement.scrollHeight - window.innerHeight - after);
    const hero = document.getElementById("top");
    heroTop = hero ? hero.offsetTop : 0;             /* 0 without the film: the page as it always was */
  }
  function readScroll() {
    const y = window.scrollY;
    /* the choreography is measured from the hero, wherever the film puts it */
    scrollP = scrollMax > heroTop ? Math.min(1, Math.max(0, (y - heroTop) / (scrollMax - heroTop))) : 0;
    const live = film && film.handoff;
    const k = live ? Math.min(1, Math.max(0, (y - film.end) / (window.innerHeight * 0.6))) : 1;
    hand = 1 - k * k * (3 - 2 * k);
    const wasAsleep = asleep;
    /* wake just before the hold, not earlier: until then the film is opaque,
       and drawing a hidden scene took the phone's time from the film's own
       decodes over its last frames (measured, perf.mjs). The first frame after
       waking is already the film's exact pose, so a short lead is enough. */
    asleep = !!live && y < film.start - window.innerHeight * 0.12;
    if (wasAsleep && !asleep) start();
  }
  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", () => {
    layout(); measureScroll(); readScroll(); measureFooter();
  });

  /* The canvas can change size without the window ever resizing — a
     stylesheet arriving late, a mobile URL bar sliding away. */
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      layout();
      measureScroll();
      measureFooter();
      if (!running) renderer.render(scene, camera);
    }).observe(canvas);
    /* ...and the page can change height without the canvas changing size
       (the film's height, late images, web fonts): re-measure what hangs on it */
    new ResizeObserver(() => { measureScroll(); measureFooter(); readScroll(); }).observe(document.body);
  }
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden; visible ? start() : stop();
  });

  function frame() {
    if (!running) return;
    if (asleep) { running = false; return; }        /* the film covers the screen: give it the GPU */
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.getElapsedTime();
    idle += dt * (1 - hand);                          /* idle sway is frozen while the film's pose holds */

    /* Frame-rate independent easing: the same glide on 60Hz and 144Hz. */
    const k = 1 - Math.pow(0.0015, dt);

    matBody.color.lerp(target.body, k);
    matSleeve.color.lerp(target.sleeve, k);
    matLid.color.lerp(target.lid, k);
    matCoffee.color.lerp(target.coffee, k);
    matSleeve.metalness += (target.metal - matSleeve.metalness) * k;
    matSleeve.roughness += (target.sleeveRough - matSleeve.roughness) * k;
    matSleeve.envMapIntensity += (target.sleeveEnv - matSleeve.envMapIntensity) * k;
    matBody.roughness += (target.rough - matBody.roughness) * k;
    matBody.clearcoat += (target.coat - matBody.clearcoat) * k;
    matBody.clearcoatRoughness += (target.coatRough - matBody.clearcoatRoughness) * k;
    matLid.opacity += (target.lidOpacity - matLid.opacity) * k;
    latteU.latteMix.value += (target.latte - latteU.latteMix.value) * k;
    matHandle.color.copy(matBody.color);
    matHandle.roughness = matBody.roughness; matHandle.clearcoat = Math.max(0.6, matBody.clearcoat);
    if (ice.visible) ice.children.forEach((c, i) => { c.position.y = Math.sin(t * 0.9 + c.userData.seed) * 0.008; c.rotation.y += dt * 0.05 * (i % 2 ? 1 : -1); });
    /* the film's last frame is a paper cup: while it hands over, show one */
    const wantService = hand > 0.02 ? "go" : state.service;
    if (wantService !== shownService) { shownService = wantService; buildGeometry(); }
    patternU.patternColor.value.lerp(target.pattern, k);
    /* a pattern change: fade the old one out, swap the mask, fade back in */
    if (target.patternWant !== patternShown) {
      patternU.patternMix.value += (0 - patternU.patternMix.value) * Math.min(1, k * 2.2);
      if (patternU.patternMix.value < 0.02) swapPattern();
    } else {
      const want = patternShown === "plain" ? 0 : 1;
      patternU.patternMix.value += (want - patternU.patternMix.value) * k;
    }

    /* Size tween: the mesh is already the new size, so the group scales from
       the old height to the new one to cover the swap. */
    const wantH = SIZES[state.size].h;
    shownH += (wantH - shownH) * k;

    /* Time-based, like everything else in this loop. The old per-frame
       constant ran 2.4x faster on a 144Hz screen than on a 60Hz one and
       lurched whenever a frame was dropped. The rate is tight because the
       scroll position itself is already eased — two dampers in series is
       what made the cup trail a second behind the page. */
    shownP += (scrollP - shownP) * (1 - Math.exp(-11 * dt));
    const f = sample(shownP);

    /* Depth first: everything below is measured against where the cup now
       sits in z. Without this correction a cup brought towards the camera
       also drifts outwards, because halfW is only the frame's half-width at
       z = 0. */
    cup.position.z = wide ? f.z : f.z * 0.35;
    const depthK = (CAM_Z - cup.position.z) / CAM_Z;

    cup.position.x = (wide ? f.x : 0) * halfW * depthK;
    bump += (1 - bump) * Math.min(1, dt * 5);
    cup.scale.setScalar((wide ? f.s : f.s * 0.58 * f.ps) * (shownH / wantH) * (0.9 + 0.1 * bump));

    cup.position.y = -wantH / 2 - 0.08 + f.y + (wide ? 0 : f.py) + Math.sin(idle * 0.8) * 0.03;

    /* Turning: the scroll sets the heading, the user's drag adds to it, and a
       slow idle rotation keeps it alive when nobody is doing either. */
    const spin = f.ry + userSpin + idle * 0.1;
    lastSpin = spin;
    if (facing) faceSpin += ((faceAt - spin) - faceSpin) * k;
    cup.rotation.y = spin + faceSpin;
    /* Lean and nod. A cup that never leaves vertical is a product shot; one
       that leans as it travels is an object someone is moving. */
    cup.rotation.z = f.tilt + Math.sin(idle * 0.65) * 0.012;
    /* open at 02 (no lid, a clear one, a mug): the cup leans a little towards
       the reader, so the latte art or the ice is what they see */
    const showTop = canvas.classList.contains("is-interactive") && coffee.visible ? 1 : 0;
    leanTop += (showTop - leanTop) * k * 0.6;
    cup.rotation.x = f.nod + Math.sin(idle * 0.47) * 0.008 + leanTop * 0.34;

    /* The film's pose, weighted by how far the handoff still has to go. */
    if (hand > 0) {
      cup.position.x += (FILM_CUP.x - cup.position.x) * hand;
      cup.position.y += (FILM_CUP.y - cup.position.y) * hand;
      cup.position.z -= cup.position.z * hand;
      cup.scale.setScalar(cup.scale.x + (FILM_CUP.s - cup.scale.x) * hand);
      cup.rotation.y += (FILM_CUP.ry - cup.rotation.y) * hand;
      cup.rotation.z += (FILM_CUP.tilt - cup.rotation.z) * hand;
      cup.rotation.x -= cup.rotation.x * hand;
    }

    /* The floor is a shadow catcher: it has to follow the cup in z too, or
       the contact shadow detaches the moment the cup comes forward. */
    floor.position.y = cup.position.y - 0.02;
    /* On a phone the key light from the far left threw the shadow as a long
       thin wedge that ran into the screen's right edge and showed beside the
       cards like a rendering glitch. Once the film has handed over (hand = 0)
       the key swings round towards the front there, shortening it; during the
       handoff it stays where the film's light was, or the shadow would jump. */
    key.position.x = -3.4 + (wide ? 0 : 2.2 * (1 - hand));
    floor.position.z = cup.position.z;

    if (ownsOpacity) canvas.style.opacity = String(exitFade());

    /* The camera moves, the subject does not: shifting the cup towards the
       cursor instead would fight the scroll choreography that just placed
       it. */
    const lk = Math.min(1, dt * 3.2);
    look.x += (look.tx - look.x) * lk;
    look.y += (look.ty - look.y) * lk;

    /* On a phone the cup takes the top of the screen and the card sits under
       it. That has to be done by lowering the CAMERA, not by raising the cup:
       the lights are fixed in the world, so lifting the subject out of the
       key light's angle flattens its shading into a pale silhouette. Measured
       — the first version did exactly that. */
    const lift = wide ? 0 : 1.25;
    const lx = look.x * (1 - hand), ly = look.y * (1 - hand);
    eyeP.set(lx * 0.3, 0.62 - ly * 0.2 - lift, CAM_Z);
    eyeT.set(lx * 0.1, 0.02 - ly * 0.05 - lift, 0);
    let fov = BASE_FOV;
    if (hand > 0) {
      /* the film's eye, and its lens as object-fit: cover crops it here: on a
         screen wider than the frame the film is cropped top and bottom, which
         is a narrower vertical angle; narrower screens crop the sides only */
      const E = FILM_EYE[film.aspect] || FILM_EYE["16x9"];
      eyeP.lerp(E.cam, hand); eyeT.lerp(E.tgt, hand);
      const a = camera.aspect, filmFov = a > E.aspect
        ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * E.aspect / a))
        : BASE_FOV;
      fov += (filmFov - BASE_FOV) * hand;
    }
    if (Math.abs(camera.fov - fov) > 1e-4) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.position.copy(eyeP);
    camera.lookAt(eyeT);

    const Mg = mugSize(SIZES[state.size]), hereNow = shownService === "here";
    steam.update(t, dt, DRINKS[state.drink].hot, hereNow ? Mg.h + 0.07 : wantH,
                 !hereNow && LIDS[state.lid].hex !== null, hereNow ? Mg.rt - 0.06 : SIZES[state.size].rt);

    renderer.render(scene, camera);
  }

  let covered = false;
  document.addEventListener("nr:overlay", (e) => { covered = !!e.detail; covered ? stop() : start(); });
  function start() {
    if (reduced || !visible || running || covered) return;
    running = true;
    clock.getDelta();                 /* drop the time spent stopped */
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  layout(); readScroll(); shownP = scrollP;
  renderer.render(scene, camera);
  /* The frame above is already on screen, so the reveal can be armed now;
     waiting on a rAF callback meant a page opened in a background tab never
     revealed the canvas at all. */
  canvas.classList.add("is-ready");
  measureScroll();
  measureFooter();
  goLive(exitFade() < 0.99 ? 0 : 1300);
  start();

  /* Hand the opacity over to the loop once the CSS reveal has played — or at
     once, if the page was restored somewhere near the footer, where the exit
     fade is the only thing keeping the cup out of the dark band. */
  function goLive(delay) {
    setTimeout(() => {
      canvas.classList.add("is-live");
      ownsOpacity = true;
      canvas.style.opacity = String(exitFade());
    }, delay);
  }

  /* With reduced motion the loop never runs, so nothing would carry the cup
     out of the way and the footer would slice through a scene that cannot
     move. A fade is not motion, so it is the one part of the choreography
     that still applies. */
  if (reduced) {
    window.addEventListener("scroll", () => {
      if (ownsOpacity) canvas.style.opacity = String(exitFade());
    }, { passive: true });
  }

  const build = document.querySelector("#build");
  if (build) {
    new IntersectionObserver(([e]) => {
      const inBuild = e.isIntersecting && e.intersectionRatio > 0.5;
      canvas.classList.toggle("is-interactive", inBuild);
      if (!inBuild) face(false);              /* scrolling on lets the scroll turn the cup again */
    }, { threshold: [0, 0.5, 1] }).observe(build);
  }

  /* --- UI wiring ----------------------------------------------------------- */
  const priceEl = document.querySelector("[data-price]");
  const summaryEl = document.querySelector("[data-summary]");

  /* The option names live in cup.js in English; the page's dictionary is the
     one place they get translated, exactly like the text in the markup. */
  const T = (str) => (window.NR ? window.NR.t(str) : str);
  const phrase = (tpl, value) => T(tpl).replace("%s", value);

  /* groups can nest (the grind chips sit inside the drinks grid): a button
     belongs to the NEAREST group around it */
  const own = (b) => b.closest("[data-group]").dataset.group;
  /* With the loop stopped (reduced motion, a hidden tab, the film on top)
     nothing would ever ease the materials towards their targets: a chosen
     colour, print or clear lid never reached the cup (review, 11.10). They
     are set at once instead, before the single render. */
  function snapToTargets() {
    matBody.color.copy(target.body); matSleeve.color.copy(target.sleeve);
    matLid.color.copy(target.lid); matCoffee.color.copy(target.coffee);
    matSleeve.metalness = target.metal; matSleeve.roughness = target.sleeveRough; matSleeve.envMapIntensity = target.sleeveEnv;
    matBody.roughness = target.rough; matBody.clearcoat = target.coat; matBody.clearcoatRoughness = target.coatRough;
    matLid.opacity = target.lidOpacity;
    latteU.latteMix.value = target.latte;
    matHandle.color.copy(target.body);
    if (shownService !== (hand > 0.02 ? "go" : state.service)) { shownService = hand > 0.02 ? "go" : state.service; buildGeometry(); }
    patternU.patternColor.value.copy(target.pattern);
    swapPattern();
    patternU.patternMix.value = patternShown === "plain" ? 0 : 1;
    shownH = SIZES[state.size].h;
  }
  function press(key) {
    document.querySelectorAll("[data-group=\"" + key + "\"] [data-opt]").forEach((b) => {
      if (own(b) === key) b.setAttribute("aria-pressed", String(b.dataset.opt === state[key]));
    });
  }
  /* What the drink allows: a milk drink cannot be taken without milk, and
     cold brew has no espresso to double. The disallowed chip stays visible
     (so the reader learns why) but cannot be chosen. */
  function constrain() {
    /* what the drink forces is worked out from the READER's choice each time
       (chosen), never written over it: Flat white -> Filter left "Whole milk"
       on a filter coffee nobody had asked milk for (review, 11.10) */
    const D = DRINKS[state.drink];
    state.milk = D.milk && chosen.milk === "none" ? "whole" : chosen.milk;
    state.shot = D.shots ? chosen.shot : "single";
    const off = { "milk:none": D.milk, "shot:double": !D.shots };
    document.querySelectorAll("[data-group=\"milk\"] [data-opt], [data-group=\"shot\"] [data-opt]").forEach((b) => {
      const k = b.closest("[data-group]").dataset.group + ":" + b.dataset.opt;
      b.disabled = !!off[k];
    });
    /* a mug has no sleeve and no lid: those choices wait for the paper cup */
    const here = state.service === "here";
    document.querySelectorAll("[data-group=\"sleeve\"], [data-group=\"lid\"]").forEach((g) => { g.hidden = here; });
    document.querySelectorAll("[data-here-note]").forEach((n) => { n.hidden = !here; });
    press("milk"); press("shot");
  }

  document.querySelectorAll("[data-group]").forEach((group) => {
    const key = group.dataset.group;
    group.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-opt]");
      if (!btn || btn.disabled || own(btn) !== key) return;
      /* "Custom" only opens the picker until a colour has been picked: a
         dismissed picker left the cup the placeholder tan */
      if (key === "cup" && btn.dataset.opt === "custom" && !btn.classList.contains("is-set")) return;
      state[key] = btn.dataset.opt;
      if (key === "milk" || key === "shot") chosen[key] = btn.dataset.opt;
      press(key);
      if (key === "drink" || key === "milk" || key === "shot" || key === "service") constrain();
      if (key === "service") bump = 0;              /* the object changes: a small settle */
      if (key === "grind") state.beans = true;      /* choosing a grind is choosing the bag */
      if (key === "size") buildGeometry();
      applyMaterials();
      refresh();
      if (!running) { snapToTargets(); renderer.render(scene, camera); }
    });
  });

  /* The name on the cup: printed under the wordmark, live. Letters only (and
     a space, an apostrophe, a hyphen), 14 at most — what fits the line. The
     print is redrawn a beat after typing stops, not on every key. */
  const nameEl = document.querySelector("[data-name]");
  let nameTimer = 0, printedAs = "";
  const upper = (s) => s.toLocaleUpperCase(document.documentElement.lang || "en");
  function redrawPrint() {
    clearTimeout(nameTimer); nameTimer = 0;
    if (upper(state.name) === printedAs) return;
    printedAs = upper(state.name);
    const next = printMap(PRINT_SCALE, printedAs);
    next.anisotropy = print.anisotropy;
    matBody.map = next; print.dispose(); print = next;
    if (!running) renderer.render(scene, camera);
  }
  if (nameEl) {
    nameEl.addEventListener("input", () => {
      /* iOS types a curly apostrophe (D’Arcy): keep it, as a straight one */
      const clean = nameEl.value.replace(/\u2019/g, "'").replace(/[^\p{L}\p{M} '\-]/gu, "").replace(/\s+/g, " ").slice(0, 14);
      if (clean !== nameEl.value) nameEl.value = clean;
      state.name = clean.trim();
      refresh();
      face(true);
      clearTimeout(nameTimer);
      nameTimer = setTimeout(redrawPrint, 160);
    });
  }
  /* the upper case is the language's own (aylin -> AYLIN, in Turkish AYLİN):
     a language change redraws it, so cup and ticket always agree */
  if (window.NR) window.NR.onChange.push(redrawPrint);

  /* the Name tab turns the print to the reader; any other tab lets go
     (site.js announces every tab change, by click or by arrow key) */
  document.addEventListener("nr:tab", (e) => face(e.detail === "opt-name"));

  /* Custom colour: the 13th swatch opens the system colour picker; whatever is
     picked becomes the cup (and the swatch shows it). */
  const pickEl = document.querySelector("[data-custom-colour]");
  const customSw = document.querySelector('[data-group="cup"] [data-opt="custom"]');
  if (pickEl && customSw) {
    customSw.addEventListener("click", () => {
      /* the native picker opens where its input is: put it on the swatch */
      const box = customSw.parentNode.parentNode.getBoundingClientRect(), sw = customSw.getBoundingClientRect();
      pickEl.style.left = (sw.left - box.left) + "px"; pickEl.style.top = (sw.bottom - box.top) + "px";
      try { pickEl.showPicker(); } catch (e) { pickEl.click(); }
    });
    pickEl.addEventListener("input", () => {
      CUP_COLOURS.custom.hex = parseInt(pickEl.value.slice(1), 16);
      customSw.style.setProperty("--sw", pickEl.value);
      customSw.classList.add("is-set");
      state.cup = "custom"; press("cup");
      applyMaterials(); refresh();
      if (!running) { snapToTargets(); renderer.render(scene, camera); }
    });
  }

  /* 01: a bag of beans to take home, on top of the drink (not instead of it) */
  const beansEl = document.querySelector("[data-beans]");
  if (beansEl) {
    beansEl.addEventListener("click", () => {
      state.beans = !state.beans;
      refresh();
    });
  }
  constrain();

  function total() {
    const D = DRINKS[state.drink];
    const go = state.service === "go";
    return D.price + SIZES[state.size].price + FINISHES[state.finish].price + PATTERNS[state.pattern].price +
      (go ? SLEEVES[state.sleeve].price + LIDS[state.lid].price : 0) + MILKS[state.milk].price +
      (D.shots ? SHOTS[state.shot].price : 0) + (state.beans ? BEANS.price : 0);
  }
  function extrasText() {
    const D = DRINKS[state.drink], parts = [];
    if (state.milk !== "none") parts.push(T(MILKS[state.milk].label));
    if (D.shots && state.shot === "double") parts.push(T(SHOTS.double.label));
    return parts.length ? parts.join(" · ") : "—";
  }

  function refresh() {
    const D = DRINKS[state.drink], S = SIZES[state.size];
    const C = CUP_COLOURS[state.cup], SL = SLEEVES[state.sleeve], LI = LIDS[state.lid];
    const FI = FINISHES[state.finish], PA = PATTERNS[state.pattern];

    set("drink", state.beans ? T(D.label) + " · " + T(BEANS.label) : T(D.label));   /* 01's footer counts the bag too */
    set("size", T(S.label) + " · " + T(S.volume));
    set("size-short", state.service === "here" ? T(SERVICES.here.label) + " · " + T(S.label) : T(S.label));    /* the tab: "Orta · 350 ml" did not fit */
    set("cup", T(C.label));
    set("service", T(SERVICES[state.service].label));
    set("finish", T(FI.label));
    set("pattern", T(PA.label));
    set("sleeve", state.service === "here" ? "—" : T(SL.label));
    set("lid", state.service === "here" ? "—" : T(LI.label));
    set("name", state.name || "—");
    set("extras", extrasText());
    set("grind", T(GRINDS[state.grind].label));
    if (beansEl) {
      beansEl.setAttribute("aria-pressed", String(state.beans));
      beansEl.closest(".drink--addon").classList.toggle("is-added", state.beans);
    }

    /* Kurus gosterilmeli: tam sayiya yuvarlanan bir fiyat, secenek farklarini
       (+0.50, +1.20) gorunmez kilar ve "fiyat canli degisiyor" iddiasi coker. */
    if (priceEl) priceEl.textContent = total().toFixed(2);
    if (summaryEl) {
      /* Built from templates, not by gluing words together: "Bone" + " cup"
         only reads as a phrase in English. */
      const parts = [
        T(D.label),
        T(S.label),
        state.service === "here" ? T(SERVICES.here.label) : null,
        phrase(state.service === "here" ? "%s mug" : "%s cup", T(C.label)) + (state.finish !== "matte" ? ", " + T(FI.label).toLowerCase() : ""),
        state.pattern !== "plain" ? T(PA.label) : null,
        state.service === "here" ? null : SL.hex ? phrase("%s sleeve", T(SL.label)) : T("No sleeve"),
        state.service === "here" ? null : LI.hex ? phrase("%s lid", T(LI.label)) : T("No lid"),
        state.name ? "“" + state.name + "”" : null,
        state.milk !== "none" ? T(MILKS[state.milk].label) : null,
        D.shots && state.shot === "double" ? T(SHOTS.double.label) : null,
        state.beans ? T(BEANS.label) : null
      ].filter(Boolean);
      /* each part stays whole ("Kraft sleeve", never "Kraft / kolluk"); the
         line may only break at a separator */
      summaryEl.textContent = parts.map((part) => part.replace(/ /g, "\u00a0")).join(" · ");
    }
  }
  function set(k, v) {
    /* every copy: the option's own head, and its tab on a phone */
    document.querySelectorAll("[data-value=\"" + k + "\"]").forEach((el) => { el.textContent = v; });
  }

  applyMaterials();
  refresh();
  /* Switching language changes every label the panel writes, so the panel
     has to be redrawn — the dictionary cannot reach strings that JS built. */
  if (window.NR) window.NR.onChange.push(refresh);

  /* 03 — pick it up. The ticket (js/ticket.js) asks here for the order and
     for a picture of the cup exactly as it was designed. */
  function order() {
    const D = DRINKS[state.drink], S = SIZES[state.size];
    const C = CUP_COLOURS[state.cup], SL = SLEEVES[state.sleeve], LI = LIDS[state.lid];
    const FI = FINISHES[state.finish], PA = PATTERNS[state.pattern];
    const cupBits = [T(C.label)];
    if (state.finish !== "matte") cupBits.push(T(FI.label));
    if (state.pattern !== "plain") cupBits.push(T(PA.label));
    /* one line per thing on the counter; defaults that cost nothing and
       change nothing (no name, no extras, no beans) are not printed */
    const lines = [
      [T("Drink"), T(D.label), D.price],
      [T("Size"), T(S.label) + " · " + T(S.volume) + (state.service === "here" ? " · " + T(SERVICES.here.label) : ""), S.price],
      [state.service === "here" ? T("Mug") : T("Cup"), cupBits.join(" · "), FI.price + PA.price]
    ];
    if (state.service === "go") lines.push([T("Sleeve & lid"), T(SL.label) + " · " + T(LI.label), SL.price + LI.price]);
    const extras = (state.milk !== "none" || (D.shots && state.shot === "double"));
    if (extras) lines.push([T("Extras"), extrasText(), MILKS[state.milk].price + (D.shots ? SHOTS[state.shot].price : 0)]);
    if (state.name) lines.push([T("Printed"), state.name.toLocaleUpperCase(document.documentElement.lang || "en"), 0]);
    if (state.beans) lines.push([T(BEANS.label), T(GRINDS[state.grind].label), BEANS.price]);
    return { lines, total: total(), name: state.name };
  }
  /* The live canvas, cropped to the cup, as a PNG. Drawn and read in the
     same task: no preserveDrawingBuffer needed. The floor's shadow stays out
     of it — a crop cut it off square, a sticker's edge (measured on the
     ticket) — and a soft contact shadow is painted under the cup instead. */
  function snapshot(maxSize = 900) {
    redrawPrint();                    /* a name typed a moment ago is on the picture too */
    if (!running) snapToTargets();
    floor.visible = false;
    renderer.render(scene, camera);
    floor.visible = true;
    const box = new THREE.Box3();
    /* only what is shown: Box3 counts hidden meshes too, and the mug's hidden
       paper cup (or the cup's hidden handle) skewed the crop */
    cup.children.forEach((ch) => { if (ch !== steam.points && ch.visible) box.expandByObject(ch); });
    if (box.isEmpty()) { renderer.render(scene, camera); return null; }
    const w = canvas.width, h = canvas.height;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const v = new THREE.Vector3();
    for (let i = 0; i < 8; i++) {
      v.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera);
      const px = (v.x * 0.5 + 0.5) * w, py = (0.5 - v.y * 0.5) * h;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
    const cw = x1 - x0;
    v.set((box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2).project(camera);
    const bx = (v.x * 0.5 + 0.5) * w, by = (0.5 - v.y * 0.5) * h;   /* the middle of the cup's foot */
    const pad = (y1 - y0) * 0.12;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
    x1 = Math.min(w, x1 + pad); y1 = Math.min(h, y1 + pad);
    if (x1 - x0 < 8 || y1 - y0 < 8) { renderer.render(scene, camera); return null; }
    const k = Math.min(1, maxSize / Math.max(x1 - x0, y1 - y0));
    const out = document.createElement("canvas");
    out.width = Math.round((x1 - x0) * k); out.height = Math.round((y1 - y0) * k);
    const g = out.getContext("2d");
    /* the contact shadow: an ellipse a little wider than the foot, nudged
       away from the key light like the live one, fading to nothing */
    const rx = cw * 0.5 * k, ry = rx * 0.15;
    g.save();
    g.translate((bx - x0 + cw * 0.05) * k, (by - y0) * k);
    g.scale(1, ry / rx);
    const sh = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    sh.addColorStop(0, "rgba(30, 22, 17, 0.26)");
    sh.addColorStop(0.55, "rgba(30, 22, 17, 0.1)");
    sh.addColorStop(1, "rgba(30, 22, 17, 0)");
    g.fillStyle = sh;
    g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill();
    g.restore();
    g.drawImage(canvas, x0, y0, x1 - x0, y1 - y0, 0, 0, out.width, out.height);
    renderer.render(scene, camera);   /* the live canvas gets its floor shadow back */
    return out.toDataURL("image/png");
  }
  /* --- A cup you can send ---------------------------------------------------
     The whole design fits in the URL (#cup=…): short keys, base64url. Opening
     such a link rebuilds the cup exactly and takes the reader to 02. Every
     value is checked against its table — a link is input, not trusted. */
  const CODE = { drink: "d", size: "s", service: "v", cup: "c", finish: "f", pattern: "p", sleeve: "l", lid: "i", milk: "m", shot: "h", grind: "g" };
  const TABLE = { drink: DRINKS, size: SIZES, service: SERVICES, cup: CUP_COLOURS, finish: FINISHES, pattern: PATTERNS, sleeve: SLEEVES, lid: LIDS, milk: MILKS, shot: SHOTS, grind: GRINDS };
  function encode() {
    const o = {};
    for (const k in CODE) o[CODE[k]] = k === "milk" || k === "shot" ? chosen[k] : state[k];
    if (state.cup === "custom") o.x = CUP_COLOURS.custom.hex.toString(16).padStart(6, "0");
    if (state.name) o.n = state.name;
    if (state.beans) o.b = 1;
    return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function decode(code) {
    try {
      return JSON.parse(decodeURIComponent(escape(atob(code.replace(/-/g, "+").replace(/_/g, "/")))));
    } catch (e) { return null; }
  }
  function applyCode(code) {
    const o = decode(code);
    if (!o || typeof o !== "object") return false;
    for (const k in CODE) {
      const v = o[CODE[k]];
      if (typeof v === "string" && Object.prototype.hasOwnProperty.call(TABLE[k], v)) {
        if (k === "milk" || k === "shot") chosen[k] = v; else state[k] = v;
      }
    }
    if (typeof o.x === "string" && /^[0-9a-f]{6}$/i.test(o.x)) {
      CUP_COLOURS.custom.hex = parseInt(o.x, 16);
      if (customSw) { customSw.style.setProperty("--sw", "#" + o.x); customSw.classList.add("is-set"); }
      if (pickEl) pickEl.value = "#" + o.x;
    }
    state.name = typeof o.n === "string" ? o.n.replace(/[^\p{L}\p{M} '\-]/gu, "").slice(0, 14).trim() : "";
    if (nameEl) nameEl.value = state.name;
    state.beans = o.b === 1;
    /* at a table (?masa=, js/table.js) it is a ceramic cup, whatever the saved
       cup or the link says: "Order it again" put a paper cup with a sleeve on
       the bill, with its controls hidden (review, 12.10) */
    if (document.documentElement.classList.contains("is-table")) state.service = "here";
    Object.keys(CODE).forEach(press);
    constrain();
    buildGeometry(); applyMaterials(); refresh(); redrawPrint();
    if (!running) { snapToTargets(); renderer.render(scene, camera); }
    return true;
  }
  /* "Oat flat white · Mist mug" — the short name of an order */
  function describe(code) {
    const o = decode(code) || {};
    const D = DRINKS[o.d] || DRINKS.filter, C = CUP_COLOURS[o.c] || CUP_COLOURS.bone;
    return T(D.label) + " · " + phrase(o.v === "here" ? "%s mug" : "%s cup", T(C.label));
  }
  function shareUrl() { return location.origin + location.pathname + "#cup=" + encode(); }
  async function share() {
    const url = shareUrl();
    const toast = window.NRToast || (() => {});
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "Nordic Roast", text: T("My cup at Nordic Roast"), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast(T("Link copied — send it to anyone"));
    } catch (e) {
      if (e && e.name === "AbortError") return;     /* the reader closed the share sheet */
      toast(url);
    }
  }
  document.addEventListener("click", (e) => { if (e.target.closest("[data-share]")) share(); });

  /* A link to a cup: build it and go to 02 — a cut, not a smooth scroll (on a
     phone base.css scrolls smoothly, which played ten screens of film). The
     film only knows its height once its first atlas is up, so the jump is
     repeated on every film:layout until the reader scrolls on their own. */
  let landing = false;
  const land = () => {
    if (!landing) return;
    const b = document.getElementById("build");
    if (b) window.scrollTo({ top: b.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
  };
  const stopLanding = () => { landing = false; };
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach((ev) => window.addEventListener(ev, stopLanding, { passive: true, once: true }));
  window.addEventListener("film:layout", () => setTimeout(land, 30));
  function fromHash() {
    const m = /^#cup=([A-Za-z0-9_-]+)$/.exec(location.hash);
    if (m && applyCode(m[1])) { landing = true; setTimeout(land, 60); }
  }
  fromHash();
  window.addEventListener("hashchange", fromHash);      /* a second link in the same tab */

  /* Welcome back: the last order placed on this device, one tap away */
  const usualEl = document.querySelector("[data-usual]");
  function showUsual() {
    let code = null;
    try { code = localStorage.getItem("nr-usual"); } catch (e) { /* private mode */ }
    if (!usualEl || !code || !decode(code)) return;
    usualEl.querySelector("[data-usual-text]").textContent = describe(code);
    usualEl.hidden = false;
  }
  if (usualEl) {
    showUsual();
    if (window.NR) window.NR.onChange.push(showUsual);
    usualEl.querySelector("[data-usual-go]").addEventListener("click", () => {
      let code = null;
      try { code = localStorage.getItem("nr-usual"); } catch (e) { /* private mode */ }
      if (code && applyCode(code)) {
        const to = document.querySelector('a[href="#build"]');
        if (to) to.click(); else document.getElementById("build").scrollIntoView();
      }
    });
  }

  if (window.NR) window.NR.cup = { order, snapshot, encode, describe, shareUrl };

  /* --- helpers ------------------------------------------------------------- */

  function buildEnv() {
    const c = document.createElement("canvas");
    c.width = 32; c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.00, "#ffffff");
    grad.addColorStop(0.40, "#f0e9dd");
    grad.addColorStop(0.72, "#b5ada2");
    grad.addColorStop(1.00, "#6b635a");
    g.fillStyle = grad; g.fillRect(0, 0, 32, 256);

    /* A softbox band. A metal surface is almost entirely a mirror, so it can
       only be as bright as what surrounds it: against a plain gradient the
       copper sleeve came out near-black. This band is what it reflects. */
    const box = g.createLinearGradient(0, 34, 0, 108);
    box.addColorStop(0.00, "rgba(255,255,255,0)");
    box.addColorStop(0.35, "rgba(255,255,255,1)");
    box.addColorStop(0.65, "rgba(255,255,255,1)");
    box.addColorStop(1.00, "rgba(255,255,255,0)");
    g.fillStyle = box; g.fillRect(0, 34, 32, 74);
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromEquirectangular(tex).texture;
    tex.dispose();
    return env;
  }

  function buildSteam() {
    const N = 90;
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    for (let i = 0; i < N; i++) seed[i] = Math.random();

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));

    const uniforms = {
      uTime: { value: 0 }, uFade: { value: 0 },
      uSize: { value: 70 * Math.min(window.devicePixelRatio, 2) }
    };

    const mat = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false,
      vertexShader: [
        "uniform float uTime; uniform float uSize;",
        "attribute float aSeed;",
        "varying float vA;",
        "void main() {",
        "  /* Each wisp owns a phase, so the column never pulses in unison. */",
        "  float life = fract(uTime * 0.22 + aSeed);",
        "  vec3 p = position;",
        "  p.y += life * 0.9;",
        "  p.x += sin(uTime * 0.8 + aSeed * 12.0) * life * 0.15;",
        "  p.z += cos(uTime * 0.7 + aSeed * 9.0) * life * 0.11;",
        "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
        "  gl_Position = projectionMatrix * mv;",
        "  gl_PointSize = uSize * (0.25 + life * 1.6) / -mv.z;",
        "  vA = sin(life * 3.14159);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform float uFade;",
        "varying float vA;",
        "void main() {",
        "  float d = length(gl_PointCoord - 0.5);",
        "  float a = smoothstep(0.5, 0.0, d);",
        "  gl_FragColor = vec4(1.0, 0.985, 0.96, a * a * vA * 0.15 * uFade);",
        "}"
      ].join("\n")
    });

    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;

    return {
      points,
      update(t, dt, hot, h, lidOn, rt) {
        uniforms.uTime.value = t;
        const want = hot ? 1 : 0;
        uniforms.uFade.value += (want - uniforms.uFade.value) * Math.min(1, dt * 2.5);
        if (uniforms.uFade.value < 0.01) { points.visible = false; return; }
        points.visible = true;

        /* From the spout when closed, from the whole surface when open. */
        points.position.set(lidOn ? rt * 0.32 : 0, h + (lidOn ? 0.27 : -0.12), 0);

        const spread = lidOn ? 0.06 : rt * 0.55;
        if (geo.userData.spread !== spread) {
          const arr = geo.attributes.position.array;
          for (let i = 0; i < N; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * spread;
            arr[i * 3] = Math.cos(a) * r;
            arr[i * 3 + 1] = 0;
            arr[i * 3 + 2] = Math.sin(a) * r * (lidOn ? 0.7 : 1);
          }
          geo.attributes.position.needsUpdate = true;
          geo.userData.spread = spread;
        }
      }
    };
  }
}

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
  SIZES, CUP_COLOURS, SLEEVES, LIDS,
  paperRoughness, ribNormal, printMap,
  bodyProfile, sleeveProfile, lidProfile, buildSpout
} from "./cup.js?v=10";

export const DRINKS = {
  filter:    { label: "Filter",     price: 4.20, liquid: 0x4a2a14, hot: true },
  flatwhite: { label: "Flat white", price: 5.40, liquid: 0xb08a5f, hot: true },
  cortado:   { label: "Cortado",    price: 4.80, liquid: 0x96633c, hot: true },
  coldbrew:  { label: "Cold brew",  price: 5.80, liquid: 0x25140a, hot: false },
  espresso:  { label: "Espresso",   price: 3.20, liquid: 0x1d0f07, hot: true }
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

  /* A soft-shadowed scene that repaints on every scrolled pixel does not
     need 4x the fragments on a Retina panel. 1.75 keeps the edges clean and
     gives back a third of the fill cost. */
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(0, 0.62, 7.6);
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
  const print = printMap();

  const matBody = new THREE.MeshPhysicalMaterial({
    color: CUP_COLOURS.bone.hex,
    map: print,
    roughnessMap: roughTex,
    roughness: 0.88, metalness: 0.0,
    clearcoat: 0.12, clearcoatRoughness: 0.8,
    envMapIntensity: 0.55,
    side: THREE.DoubleSide
  });
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
    clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.5
  });

  /* --- Cup ---------------------------------------------------------------- */
  const cup = new THREE.Group();
  scene.add(cup);

  const state = { drink: "filter", size: "tall", cup: "bone", sleeve: "kraft", lid: "bone" };

  let body, sleeve, lid, spout, coffee;
  let shownH = SIZES[state.size].h;     /* tweened, so size changes glide */

  buildGeometry();

  function buildGeometry() {
    [body, sleeve, lid, coffee].forEach((m) => {
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

    coffee = new THREE.Mesh(new THREE.CircleGeometry(rt - 0.035, 96), matCoffee);
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = h - 0.17;
    cup.add(coffee);

    applyVisibility();
  }

  function applyVisibility() {
    const hasSleeve = SLEEVES[state.sleeve].hex !== null;
    const hasLid = LIDS[state.lid].hex !== null;
    sleeve.visible = hasSleeve;
    lid.visible = hasLid;
    spout.visible = hasLid;
    coffee.visible = !hasLid;
  }

  /* --- Animated material targets ------------------------------------------
     Nothing is assigned directly; the loop eases towards these. */
  const target = {
    body: new THREE.Color(CUP_COLOURS.bone.hex),
    sleeve: new THREE.Color(SLEEVES.kraft.hex),
    lid: new THREE.Color(LIDS.bone.hex),
    coffee: new THREE.Color(DRINKS.filter.liquid),
    metal: 0, sleeveRough: 0.95, sleeveEnv: 0.35
  };

  function applyMaterials() {
    target.body.setHex(CUP_COLOURS[state.cup].hex);

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

    target.coffee.setHex(DRINKS[state.drink].liquid);
    applyVisibility();
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
    { p: 0.00, x:  0.46, y: -0.04, z:  0.00, s: 0.96, ry: -0.45, tilt: -0.05, nod:  0.00, ease: 1.0 },
    /* 01 the coffee — swings across and away, leaning into the turn. */
    { p: 0.24, x: -0.42, y: -0.08, z: -0.55, s: 0.88, ry:  1.15, tilt:  0.11, nod:  0.05, ease: 1.6 },
    /* 02 the cup — lifted, brought forward, presented straight on. */
    { p: 0.50, x: -0.36, y:  0.02, z:  1.10, s: 1.00, ry:  2.65, tilt: -0.02, nod: -0.03, ease: 0.7 },
    /* 03 the craft — set back down and tipped away, out of the reading line. */
    { p: 0.78, x: -0.54, y:  0.04, z: -1.30, s: 0.86, ry:  4.05, tilt:  0.16, nod:  0.09, ease: 1.3 },
    /* Exit — rises, turns away and recedes as the dark footer arrives. */
    { p: 1.00, x:  0.22, y:  1.05, z: -3.20, s: 0.72, ry:  5.30, tilt: -0.24, nod:  0.16, ease: 2.0 }
  ];

  const KEYS = ["x", "y", "z", "s", "ry", "tilt", "nod"];
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
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    halfW = halfH * camera.aspect;
    wide = w >= 940;
  }

  /* --- Drag to turn -------------------------------------------------------- */
  let userSpin = 0, dragging = false, lastX = 0;
  canvas.addEventListener("pointerdown", (e) => {
    if (!canvas.classList.contains("is-interactive")) return;
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

  /* The scrollable height is cached. Asking for scrollHeight inside a scroll
     handler forces a layout recalculation before the browser can answer, on
     every event — the single cheapest way to make a page stutter. It only
     changes when the page is re-laid-out, so that is when it is measured. */
  let scrollMax = 0;
  function measureScroll() {
    scrollMax = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }
  function readScroll() {
    scrollP = scrollMax > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollMax)) : 0;
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
  }
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden; visible ? start() : stop();
  });

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.getElapsedTime();

    /* Frame-rate independent easing: the same glide on 60Hz and 144Hz. */
    const k = 1 - Math.pow(0.0015, dt);

    matBody.color.lerp(target.body, k);
    matSleeve.color.lerp(target.sleeve, k);
    matLid.color.lerp(target.lid, k);
    matCoffee.color.lerp(target.coffee, k);
    matSleeve.metalness += (target.metal - matSleeve.metalness) * k;
    matSleeve.roughness += (target.sleeveRough - matSleeve.roughness) * k;
    matSleeve.envMapIntensity += (target.sleeveEnv - matSleeve.envMapIntensity) * k;

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
    const depthK = (camera.position.z - cup.position.z) / camera.position.z;

    cup.position.x = (wide ? f.x : 0) * halfW * depthK;
    cup.scale.setScalar((wide ? f.s : f.s * 0.58) * (shownH / wantH));

    cup.position.y = -wantH / 2 - 0.08 + f.y + Math.sin(t * 0.8) * 0.03;
    floor.position.y = cup.position.y - 0.02;

    /* Turning: the scroll sets the heading, the user's drag adds to it, and a
       slow idle rotation keeps it alive when nobody is doing either. */
    cup.rotation.y = f.ry + userSpin + t * 0.1;
    /* Lean and nod. A cup that never leaves vertical is a product shot; one
       that leans as it travels is an object someone is moving. */
    cup.rotation.z = f.tilt + Math.sin(t * 0.65) * 0.012;
    cup.rotation.x = f.nod + Math.sin(t * 0.47) * 0.008;

    /* The floor is a shadow catcher: it has to follow the cup in z too, or
       the contact shadow detaches the moment the cup comes forward. */
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
    camera.position.x = look.x * 0.3;
    camera.position.y = 0.62 - look.y * 0.2 - lift;
    camera.lookAt(look.x * 0.1, 0.02 - look.y * 0.05 - lift, 0);

    steam.update(t, dt, DRINKS[state.drink].hot, wantH,
                 LIDS[state.lid].hex !== null, SIZES[state.size].rt);

    renderer.render(scene, camera);
  }

  function start() {
    if (reduced || !visible || running) return;
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
      canvas.classList.toggle("is-interactive", e.isIntersecting && e.intersectionRatio > 0.5);
    }, { threshold: [0, 0.5, 1] }).observe(build);
  }

  /* --- UI wiring ----------------------------------------------------------- */
  const priceEl = document.querySelector("[data-price]");
  const summaryEl = document.querySelector("[data-summary]");

  /* The option names live in cup.js in English; the page's dictionary is the
     one place they get translated, exactly like the text in the markup. */
  const T = (str) => (window.NR ? window.NR.t(str) : str);
  const phrase = (tpl, value) => T(tpl).replace("%s", value);

  document.querySelectorAll("[data-group]").forEach((group) => {
    const key = group.dataset.group;
    group.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-opt]");
      if (!btn) return;
      state[key] = btn.dataset.opt;
      group.querySelectorAll("[data-opt]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      if (key === "size") buildGeometry();
      applyMaterials();
      refresh();
      if (!running) renderer.render(scene, camera);
    });
  });

  function refresh() {
    const D = DRINKS[state.drink], S = SIZES[state.size];
    const C = CUP_COLOURS[state.cup], SL = SLEEVES[state.sleeve], LI = LIDS[state.lid];

    set("drink", T(D.label));
    set("size", T(S.label) + " · " + T(S.volume));
    set("cup", T(C.label));
    set("sleeve", T(SL.label));
    set("lid", T(LI.label));

    /* Kurus gosterilmeli: tam sayiya yuvarlanan bir fiyat, secenek farklarini
       (+0.50, +1.20) gorunmez kilar ve "fiyat canli degisiyor" iddiasi coker. */
    if (priceEl) priceEl.textContent = (D.price + S.price + SL.price + LI.price).toFixed(2);
    if (summaryEl) {
      /* Built from templates, not by gluing words together: "Bone" + " cup"
         only reads as a phrase in English. */
      summaryEl.textContent = [
        T(D.label),
        T(S.label),
        phrase("%s cup", T(C.label)),
        SL.hex ? phrase("%s sleeve", T(SL.label)) : T("No sleeve"),
        LI.hex ? phrase("%s lid", T(LI.label)) : T("No lid")
      ].join(" · ");
    }
  }
  function set(k, v) {
    const el = document.querySelector("[data-value=\"" + k + "\"]");
    if (el) el.textContent = v;
  }

  applyMaterials();
  refresh();
  /* Switching language changes every label the panel writes, so the panel
     has to be redrawn — the dictionary cannot reach strings that JS built. */
  if (window.NR) window.NR.onChange.push(refresh);

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

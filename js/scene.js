/* ==========================================================================
   The stage — a paper cup you can design, driven by scroll
   --------------------------------------------------------------------------
   One fixed canvas behind the whole page. Scroll position drives where the
   cup sits and how far it has turned; the configurator drives what it is
   made of. Nothing here is a video or a sprite sheet — it is one real mesh
   rebuilt whenever the geometry actually has to change.

   Decisions worth knowing:
   · The cup is a LatheGeometry spun from a 2D profile. A paper cup IS a
     surface of revolution, so modelling it any other way would be more
     vertices for a worse silhouette.
   · Geometry is only rebuilt when the SIZE changes. Colour, sleeve and lid
     changes just touch materials and visibility — rebuilding a mesh to
     recolour it is the classic way to make a configurator feel sluggish.
   · The environment map is generated from a canvas gradient instead of an
     HDR download: convincing on the lid's plastic, weightless, and no
     request on the critical path.
   · A ShadowMaterial plane catches a real shadow. Without contact shadow a
     product render floats and reads as a sticker.
   · The render loop is gated on visibility and on prefers-reduced-motion.
   ========================================================================== */

import * as THREE from "./vendor/three/three.module.min.js";

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

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 0.55, 7.2);
  camera.lookAt(0, 0.05, 0);

  /* --- Light -------------------------------------------------------------
     A soft key from the front-left, a cool fill opposite it, and a rim from
     behind to lift the cup's edge off a cream background. */
  const key = new THREE.DirectionalLight(0xfff4e6, 1.55);
  key.position.set(-3.2, 5.2, 4.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 18;
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  key.shadow.bias = -0.0006;
  key.shadow.radius = 3;
  scene.add(key);

  scene.add(new THREE.DirectionalLight(0xdce7ff, 0.45).translateX(4).translateY(2).translateZ(2));
  const rim = new THREE.DirectionalLight(0xffffff, 0.75);
  rim.position.set(1.5, 3.0, -4.5);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cdbb, 0.42));

  scene.environment = buildEnv();

  /* --- Ground shadow ----------------------------------------------------- */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.ShadowMaterial({ opacity: 0.17 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.35;
  floor.receiveShadow = true;
  scene.add(floor);

  /* --- Cup ---------------------------------------------------------------- */
  const cup = new THREE.Group();
  scene.add(cup);

  const SIZES = {
    short:  { label: "Short · 8 oz",   h: 1.50, rb: 0.50, rt: 0.66, price: 65 },
    tall:   { label: "Tall · 12 oz",   h: 1.90, rb: 0.54, rt: 0.72, price: 78 },
    grande: { label: "Grande · 16 oz", h: 2.28, rb: 0.58, rt: 0.78, price: 92 }
  };
  const CUP_COLOURS = {
    cream:      { label: "Cream",      hex: 0xf2ead9 },
    espresso:   { label: "Espresso",   hex: 0x3b2a1f },
    forest:     { label: "Forest",     hex: 0x2f4a3a },
    terracotta: { label: "Terracotta", hex: 0xb3612d },
    slate:      { label: "Slate",      hex: 0x59626b }
  };
  const SLEEVES = {
    none:   { label: "None",   hex: null,     price: 0 },
    kraft:  { label: "Kraft",  hex: 0xb08a5e, price: 0 },
    black:  { label: "Black",  hex: 0x23201d, price: 4 },
    copper: { label: "Copper", hex: 0xa9642c, price: 8 }
  };
  const LIDS = {
    none:  { label: "Open",  hex: null,     price: 0 },
    white: { label: "White", hex: 0xf2f2ef, price: 0 },
    black: { label: "Black", hex: 0x24211e, price: 3 }
  };

  const state = { size: "tall", cup: "espresso", sleeve: "kraft", lid: "white" };

  const matBody = new THREE.MeshPhysicalMaterial({
    color: CUP_COLOURS.espresso.hex, roughness: 0.82, metalness: 0.0,
    clearcoat: 0.18, clearcoatRoughness: 0.7, envMapIntensity: 0.7,
    side: THREE.DoubleSide
  });
  const matSleeve = new THREE.MeshStandardMaterial({
    color: SLEEVES.kraft.hex, roughness: 0.95, metalness: 0.0, envMapIntensity: 0.4
  });
  const matLid = new THREE.MeshPhysicalMaterial({
    color: LIDS.white.hex, roughness: 0.34, metalness: 0.0,
    clearcoat: 0.8, clearcoatRoughness: 0.25, envMapIntensity: 1.1
  });
  const matCoffee = new THREE.MeshPhysicalMaterial({
    color: 0x2a1508, roughness: 0.22, metalness: 0.0,
    clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.4
  });

  let body, sleeve, lid, coffee;
  buildGeometry();

  /* Rebuilt only when the size changes — everything else is a material swap. */
  function buildGeometry() {
    [body, sleeve, lid, coffee].forEach((m) => {
      if (!m) return;
      cup.remove(m);
      m.geometry.dispose();
    });

    const S = SIZES[state.size];
    const H = S.h, rb = S.rb, rt = S.rt;

    /* Body: bottom disc, wall, rolled rim. */
    const wall = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(rb, 0),
      new THREE.Vector2(rb + 0.005, 0.05),
      new THREE.Vector2(rt, H),
      new THREE.Vector2(rt + 0.035, H + 0.055),
      new THREE.Vector2(rt + 0.012, H + 0.095)
    ];
    body = new THREE.Mesh(new THREE.LatheGeometry(wall, 128), matBody);
    body.castShadow = true;
    cup.add(body);

    /* Sleeve: a band that follows the wall's taper, standing just proud of it. */
    const y0 = H * 0.28, y1 = H * 0.70;
    const rAt = (y) => rb + (rt - rb) * (y / H) + 0.022;
    const band = [
      new THREE.Vector2(rAt(y0) - 0.004, y0),
      new THREE.Vector2(rAt(y0), y0 + 0.02),
      new THREE.Vector2(rAt(y1), y1 - 0.02),
      new THREE.Vector2(rAt(y1) - 0.004, y1)
    ];
    sleeve = new THREE.Mesh(new THREE.LatheGeometry(band, 128), matSleeve);
    sleeve.castShadow = true;
    cup.add(sleeve);

    /* Lid: rim skirt, then a shallow dome. */
    const L = H + 0.075;
    const dome = [
      new THREE.Vector2(rt + 0.012, L - 0.02),
      new THREE.Vector2(rt + 0.05, L + 0.005),
      new THREE.Vector2(rt + 0.048, L + 0.075),
      new THREE.Vector2(rt - 0.02, L + 0.115),
      new THREE.Vector2(rt * 0.72, L + 0.165),
      new THREE.Vector2(rt * 0.36, L + 0.205),
      new THREE.Vector2(rt * 0.13, L + 0.218),
      new THREE.Vector2(0, L + 0.222)
    ];
    lid = new THREE.Mesh(new THREE.LatheGeometry(dome, 128), matLid);
    lid.castShadow = true;
    cup.add(lid);

    /* Visible only when the cup is open — an empty paper cup reads as a prop. */
    coffee = new THREE.Mesh(new THREE.CircleGeometry(rt - 0.03, 96), matCoffee);
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = H - 0.16;
    cup.add(coffee);

    /* Keep the cup centred on its own mass whatever the size. */
    cup.position.y = -H / 2 - 0.1;

    applyVisibility();
  }

  function applyVisibility() {
    sleeve.visible = SLEEVES[state.sleeve].hex !== null;
    lid.visible = LIDS[state.lid].hex !== null;
    coffee.visible = !lid.visible;
  }

  function applyMaterials() {
    matBody.color.setHex(CUP_COLOURS[state.cup].hex);
    const sl = SLEEVES[state.sleeve];
    if (sl.hex !== null) {
      matSleeve.color.setHex(sl.hex);
      /* Copper is the one metal in the set, so it gets metal's response. */
      matSleeve.metalness = state.sleeve === "copper" ? 0.85 : 0.0;
      matSleeve.roughness = state.sleeve === "copper" ? 0.32 : 0.95;
      matSleeve.envMapIntensity = state.sleeve === "copper" ? 1.5 : 0.4;
    }
    const li = LIDS[state.lid];
    if (li.hex !== null) matLid.color.setHex(li.hex);
    applyVisibility();
  }

  /* --- Scroll choreography ------------------------------------------------
     Stops are written in fractions of the visible half-width, so the cup
     lands in the same place on a laptop and on an ultrawide. */
  const STOPS = [
    { p: 0.00, x:  0.50, y: -0.05, s: 1.00, rot: 0.0 },
    { p: 0.30, x: -0.48, y:  0.02, s: 1.02, rot: 1.5 },
    { p: 0.56, x: -0.40, y:  0.00, s: 1.20, rot: 2.7 },
    { p: 0.82, x:  0.08, y:  0.30, s: 0.88, rot: 4.0 },
    { p: 1.00, x:  0.00, y:  0.70, s: 0.74, rot: 4.8 }
  ];

  function sample(p) {
    if (p <= STOPS[0].p) return STOPS[0];
    for (let i = 1; i < STOPS.length; i++) {
      const a = STOPS[i - 1], b = STOPS[i];
      if (p <= b.p) {
        const k = (p - a.p) / (b.p - a.p);
        const e = k * k * (3 - 2 * k);           /* smoothstep, not a hard ramp */
        return {
          x: a.x + (b.x - a.x) * e,
          y: a.y + (b.y - a.y) * e,
          s: a.s + (b.s - a.s) * e,
          rot: a.rot + (b.rot - a.rot) * e
        };
      }
    }
    return STOPS[STOPS.length - 1];
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

  /* --- Drag to turn -------------------------------------------------------
     Only inside the configurator, where the stage takes pointer events. A
     page-wide grab would fight the scroll. */
  let userSpin = 0, dragging = false, lastX = 0;

  canvas.addEventListener("pointerdown", (e) => {
    if (!canvas.classList.contains("is-interactive")) return;
    dragging = true; lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    userSpin += (e.clientX - lastX) * 0.009;
    lastX = e.clientX;
  });
  const endDrag = () => { dragging = false; };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  /* --- Loop --------------------------------------------------------------- */
  let running = false, visible = true;
  const clock = new THREE.Clock();
  let scrollP = 0, shownP = 0;

  function readScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollP = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }
  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", () => { layout(); readScroll(); });
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    visible ? start() : stop();
  });

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);

    const t = clock.getElapsedTime();

    /* Damping the scroll value, not the camera, keeps the motion readable
       while still feeling attached to the wheel. */
    shownP += (scrollP - shownP) * 0.075;
    const f = sample(shownP);

    cup.position.x = (wide ? f.x : 0) * halfW;
    cup.position.z = 0;
    cup.scale.setScalar(wide ? f.s : f.s * 0.58);

    /* Narrow screens give the cup the top of the viewport and the copy the
       bottom, so it is lifted rather than sitting behind the text. */
    const baseY = -SIZES[state.size].h / 2 - 0.1;
    const lift = wide ? 0 : 1.25;
    cup.position.y = baseY + f.y + lift + Math.sin(t * 0.9) * 0.035;   /* slow float */
    cup.rotation.y = f.rot + userSpin + t * 0.12;
    cup.rotation.z = Math.sin(t * 0.7) * 0.012;

    renderer.render(scene, camera);
  }

  function start() {
    if (running || reduced || !visible) return;
    running = true;
    clock.getDelta();
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  layout();
  readScroll();
  shownP = scrollP;
  renderer.render(scene, camera);
  requestAnimationFrame(() => canvas.classList.add("is-ready"));
  start();

  /* The stage only accepts the pointer while the configurator is on screen. */
  const build = document.querySelector("#build");
  if (build) {
    new IntersectionObserver(([e]) => {
      canvas.classList.toggle("is-interactive", e.isIntersecting && e.intersectionRatio > 0.5);
    }, { threshold: [0, 0.5, 1] }).observe(build);
  }

  /* --- Configurator wiring ------------------------------------------------ */
  const priceEl = document.querySelector("[data-price]");
  const summaryEl = document.querySelector("[data-summary]");

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
      refreshReadout();
      if (!running) renderer.render(scene, camera);
    });
  });

  function refreshReadout() {
    const S = SIZES[state.size], C = CUP_COLOURS[state.cup];
    const SL = SLEEVES[state.sleeve], LI = LIDS[state.lid];

    setValue("size", S.label);
    setValue("cup", C.label);
    setValue("sleeve", SL.label);
    setValue("lid", LI.label);

    if (priceEl) priceEl.textContent = "₺" + (S.price + SL.price + LI.price);
    if (summaryEl) {
      summaryEl.textContent = [
        S.label.split(" · ")[0],
        C.label,
        SL.hex ? SL.label + " sleeve" : "No sleeve",
        LI.hex ? LI.label + " lid" : "Open cup"
      ].join(" · ");
    }
  }
  function setValue(k, v) {
    const el = document.querySelector(`[data-value="${k}"]`);
    if (el) el.textContent = v;
  }

  applyMaterials();
  refreshReadout();

  /* --- helpers ------------------------------------------------------------ */

  /* A soft vertical gradient, mapped as a sky. Enough for the lid's plastic
     to have somewhere to reflect without shipping an HDR file. */
  function buildEnv() {
    const c = document.createElement("canvas");
    c.width = 32; c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.00, "#ffffff");
    grad.addColorStop(0.42, "#efe8dc");
    grad.addColorStop(0.75, "#b9b1a6");
    grad.addColorStop(1.00, "#6f665d");
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 256);

    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromEquirectangular(tex).texture;
    tex.dispose();
    return env;
  }
}

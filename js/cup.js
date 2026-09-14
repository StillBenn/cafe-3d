/* ==========================================================================
   The cup — geometry, materials and textures
   --------------------------------------------------------------------------
   What separates a paper cup from a tapered tube is a handful of details the
   eye checks without being asked: the rolled rim, the drinking spout in the
   lid, the ribs on the sleeve, and print that wraps with the surface. All of
   them are here, and all of them are generated — there is no model file and
   no image download.
   ========================================================================== */

import * as THREE from "./vendor/three/three.module.min.js";

/* --- Palette --------------------------------------------------------------
   Muted, slightly desaturated pigments. Saturated plastic colours are what
   made the first pass look cheap: real packaging is never fully saturated. */
export const SIZES = {
  short:  { label: "Short",  volume: "8 oz",  h: 1.52, rb: 0.50, rt: 0.67, price: 0 },
  tall:   { label: "Tall",   volume: "12 oz", h: 1.92, rb: 0.54, rt: 0.73, price: 0.60 },
  grande: { label: "Grande", volume: "16 oz", h: 2.30, rb: 0.58, rt: 0.79, price: 1.20 }
};

export const CUP_COLOURS = {
  bone:     { label: "Bone",     hex: 0xece3d4 },
  sand:     { label: "Sand",     hex: 0xd2bf9f },
  clay:     { label: "Clay",     hex: 0xb0654a },
  sage:     { label: "Sage",     hex: 0x79886f },
  ink:      { label: "Ink",      hex: 0x222836 },
  espresso: { label: "Espresso", hex: 0x3a2b21 }
};

export const SLEEVES = {
  none:     { label: "None",     hex: null,     price: 0, metal: false },
  kraft:    { label: "Kraft",    hex: 0xb08a5e, price: 0, metal: false },
  charcoal: { label: "Charcoal", hex: 0x2b2724, price: 0.50, metal: false },
  copper:   { label: "Copper",   hex: 0xd98f4e, price: 1.20, metal: true }
};

export const LIDS = {
  none:     { label: "Open",     hex: null,     price: 0 },
  bone:     { label: "Bone",     hex: 0xeae5dc, price: 0 },
  charcoal: { label: "Charcoal", hex: 0x26231f, price: 0.40 }
};

/* --- Generated textures --------------------------------------------------- */

/* Paper is never flat. A little fibre noise in the roughness channel is the
   difference between "paper" and "plastic painted beige". */
export function paperRoughness() {
  const s = 512;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d");
  g.fillStyle = "#8a8a8a";
  g.fillRect(0, 0, s, s);
  const img = g.getImageData(0, 0, s, s);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 46;
    d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, d[i] + n));
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 3);
  return t;
}

/* Ribs, as a normal map. Modelling real corrugation would multiply the
   sleeve's vertex count for a detail that only ever reads as shading. */
export function ribNormal() {
  const w = 1024, h = 16;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  const img = g.createImageData(w, h);
  for (let x = 0; x < w; x++) {
    /* Tangent-space normal: only the x component varies, following the
       slope of a sine ridge running up the sleeve. */
    const slope = Math.cos((x / w) * Math.PI * 2 * 60) * 0.55;
    const nx = Math.max(-1, Math.min(1, slope));
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx));
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      img.data[i] = (nx * 0.5 + 0.5) * 255;
      img.data[i + 1] = 128;
      img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* The wrap-around print. LatheGeometry lays u around the circumference and v
   along the profile, so a plain canvas maps onto the wall like a real label.

   The map is deliberately colourless — white ground, grey marks. The cup's
   own colour multiplies through it, so the print always comes out as a
   darker shade of whatever the cup is (tone on tone, the way good packaging
   actually prints) and the colour can be animated without regenerating the
   texture on every frame. */
export function printMap() {
  const w = 1024, h = 512;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");

  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, w, h);

  /* The band that lands on the wall above the sleeve. A lathe spreads v
     evenly over profile POINTS, and bodyProfile subdivides the wall into ten
     of them, so the printable wall is v 0.645..0.755 — which is this strip
     of canvas once the texture is flipped. Drawing anywhere else smears the
     label across the rolled rim. */
  const TOP = 125, BOT = 182;
  const mid = (TOP + BOT) / 2;

  g.fillStyle = "#3d3d3d";
  g.textAlign = "center";
  g.textBaseline = "middle";

  /* Twice around, so a wordmark faces the viewer from either side. Kept
     quiet on purpose: the print multiplies through the cup's own colour, and
     anything heavier than this reads as a slogan stamped on a cup rather
     than a cup that was printed. */
  for (let k = 0; k < 2; k++) {
    const x = w * (0.25 + k * 0.5);

    g.globalAlpha = 0.72;
    g.font = "600 20px Inter, system-ui, sans-serif";
    g.letterSpacing = "9px";
    g.fillText("NORDIC ROAST", x + 4, mid - 8);

    g.globalAlpha = 0.34;
    g.font = "500 12px Inter, system-ui, sans-serif";
    g.letterSpacing = "6px";
    g.fillText("SMALL BATCH", x + 3, mid + 17);

    /* One rule under the mark, not a frame around it. */
    g.globalAlpha = 0.2;
    g.fillRect(x - 86, TOP + 6, 172, 1.2);
  }
  g.globalAlpha = 1;

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.anisotropy = 8;
  return t;
}

/* --- Geometry -------------------------------------------------------------- */

/* Body: a tapered wall that ends in a rolled rim. */
export function bodyProfile(h, rb, rt) {
  const p = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(rb * 0.97, 0),
    new THREE.Vector2(rb, 0.012),
    new THREE.Vector2(rb + 0.004, 0.055)
  ];

  /* The wall is subdivided instead of drawn as one long segment. A lathe
     spreads the v coordinate evenly over profile POINTS rather than over
     arc length, so a single-segment wall squeezes the entire printed label
     into a sliver of the texture and smears it over the rim. Ten segments
     also smooth the shading down the taper. */
  const SEG = 10, y0 = 0.055, r0 = rb + 0.004;
  for (let i = 1; i <= SEG; i++) {
    const k = i / SEG;
    p.push(new THREE.Vector2(r0 + (rt - r0) * k, y0 + (h - y0) * k));
  }

  /* The rolled rim: four points, not one. A single chamfer reads as a cut
     tube. */
  p.push(new THREE.Vector2(rt + 0.021, h + 0.018));
  p.push(new THREE.Vector2(rt + 0.034, h + 0.052));
  p.push(new THREE.Vector2(rt + 0.026, h + 0.085));
  p.push(new THREE.Vector2(rt + 0.004, h + 0.092));
  return p;
}

/* Sleeve: follows the wall's taper and stands a hair proud of it, with a
   rolled top and bottom edge of its own. */
export function sleeveProfile(h, rb, rt) {
  const y0 = h * 0.26, y1 = h * 0.68;
  const at = (y) => rb + (rt - rb) * (y / h) + 0.024;
  return [
    new THREE.Vector2(at(y0) - 0.012, y0),
    new THREE.Vector2(at(y0), y0 + 0.026),
    new THREE.Vector2(at(y1), y1 - 0.026),
    new THREE.Vector2(at(y1) - 0.012, y1)
  ];
}

/* Lid: a skirt that grips the rim, then a shallow dome with a flat landing
   where the spout sits. */
export function lidProfile(h, rt) {
  const L = h + 0.072;
  return [
    new THREE.Vector2(rt + 0.004, L - 0.03),
    new THREE.Vector2(rt + 0.046, L - 0.008),
    new THREE.Vector2(rt + 0.052, L + 0.042),
    new THREE.Vector2(rt + 0.030, L + 0.086),
    new THREE.Vector2(rt * 0.86, L + 0.118),
    new THREE.Vector2(rt * 0.52, L + 0.156),
    new THREE.Vector2(rt * 0.22, L + 0.176),
    new THREE.Vector2(0, L + 0.180)
  ];
}

/* The spout. This is the single detail that makes the object read as a
   takeaway lid rather than a bowl turned upside down. */
export function buildSpout(h, rt, matLid, matHole) {
  const L = h + 0.072;
  const group = new THREE.Group();

  const r = rt * 0.58;                 /* distance from the lid's axis */
  const y = L + 0.140;                 /* sits on the dome's slope */

  const raised = new THREE.Mesh(
    new THREE.CylinderGeometry(rt * 0.30, rt * 0.34, 0.036, 40),
    matLid
  );
  raised.castShadow = true;
  raised.position.set(r * 0.55, y, 0);
  raised.scale.set(1, 1, 0.62);        /* an oval, not a circle */
  group.add(raised);

  const hole = new THREE.Mesh(
    new THREE.CircleGeometry(rt * 0.21, 40),
    matHole
  );
  hole.rotation.x = -Math.PI / 2;
  hole.position.set(r * 0.55, y + 0.019, 0);
  hole.scale.set(1, 0.62, 1);
  group.add(hole);

  return group;
}

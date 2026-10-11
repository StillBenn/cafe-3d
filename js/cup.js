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

/* Twelve, in three families (paper whites, earths, deep inks) — every one
   a colour a real cup is printed in, none of them a toy primary. */
export const CUP_COLOURS = {
  chalk:    { label: "Chalk",    hex: 0xf2eee7 },
  bone:     { label: "Bone",     hex: 0xece3d4 },
  sand:     { label: "Sand",     hex: 0xd2bf9f },
  blush:    { label: "Blush",    hex: 0xd8b3a3 },
  clay:     { label: "Clay",     hex: 0xb0654a },
  rust:     { label: "Rust",     hex: 0x8a4630 },
  sage:     { label: "Sage",     hex: 0x79886f },
  olive:    { label: "Olive",    hex: 0x5c6043 },
  mist:     { label: "Mist",     hex: 0x9cadb5 },
  ink:      { label: "Ink",      hex: 0x222836 },
  espresso: { label: "Espresso", hex: 0x3a2b21 },
  charcoal: { label: "Charcoal", hex: 0x2c2b2a },
  /* any colour at all: the reader picks it (scene.js writes the hex) */
  custom:   { label: "Custom",   hex: 0xc98b5a }
};

/* To go: the paper cup. For here: a glazed ceramic mug, no sleeve, no lid. */
export const SERVICES = {
  go:   { label: "To go" },
  here: { label: "For here" }
};

/* The paper's finish. Matte is uncoated board; gloss is a laminated cup —
   the colour reads deeper and the light runs along it. */
export const FINISHES = {
  matte: { label: "Matte", rough: 0.88, coat: 0.12, coatRough: 0.8,  price: 0 },
  satin: { label: "Satin", rough: 0.62, coat: 0.45, coatRough: 0.38, price: 0 },
  gloss: { label: "Gloss", rough: 0.42, coat: 0.95, coatRough: 0.10, price: 0.30 }
};

/* All-over prints, drawn as a mask (see patternMask) and laid on in the
   shader in a shade of the cup's own colour: tone on tone, like the logo. */
export const PATTERNS = {
  plain:  { label: "Plain",      price: 0 },
  pin:    { label: "Pinstripe",  price: 0.40 },
  bands:  { label: "Bands",      price: 0.40 },
  dots:   { label: "Dots",       price: 0.40 },
  waves:  { label: "Waves",      price: 0.40 },
  check:  { label: "Check",      price: 0.40 },
  /* the Istanbul edition: drawn here, from the café's own street */
  beans:   { label: "Coffee beans", price: 0.40 },
  tulip:   { label: "Tulip",        price: 0.40 },
  gulls:   { label: "Gulls",        price: 0.40 },
  ferry:   { label: "Ferry",        price: 0.40 },
  skyline: { label: "Skyline",      price: 0.40 }
};

export const SLEEVES = {
  none:     { label: "None",     hex: null,     price: 0, metal: false },
  kraft:    { label: "Kraft",    hex: 0xb08a5e, price: 0, metal: false },
  linen:    { label: "Linen",    hex: 0xe6dccb, price: 0.50, metal: false },
  olive:    { label: "Olive",    hex: 0x5d5f45, price: 0.50, metal: false },
  charcoal: { label: "Charcoal", hex: 0x2b2724, price: 0.50, metal: false },
  copper:   { label: "Copper",   hex: 0xd98f4e, price: 1.20, metal: true },
  cork:     { label: "Cork",     hex: 0xc69c6d, price: 0.80, metal: false, cork: true }
};

export const LIDS = {
  none:     { label: "Open",     hex: null,     price: 0 },
  bone:     { label: "Bone",     hex: 0xeae5dc, price: 0 },
  charcoal: { label: "Charcoal", hex: 0x26231f, price: 0.40 },
  sage:     { label: "Sage",     hex: 0x8c9a82, price: 0.40 },
  clay:     { label: "Clay",     hex: 0xb5694c, price: 0.40 },
  clear:    { label: "Clear",    hex: 0xf4f2ee, price: 0.30, clear: true }
};

/* What goes in with the coffee. A splash of milk lightens a black coffee a
   lot and a milk drink only a little; a second shot darkens either. */
export const MILKS = {
  none:   { label: "No milk",     price: 0,    tint: null },
  whole:  { label: "Whole milk",  price: 0,    tint: 0xf1e8d8 },
  oat:    { label: "Oat milk",    price: 0.40, tint: 0xe6d7bd },
  almond: { label: "Almond milk", price: 0.40, tint: 0xefe2cf }
};
export const SHOTS = {
  single: { label: "Single shot", price: 0 },
  double: { label: "Double shot", price: 0.80 }
};
export const GRINDS = {
  whole:    { label: "Whole bean" },
  filter:   { label: "Ground for filter" },
  espresso: { label: "Ground for espresso" }
};
export const BEANS = { label: "Beans, 250 g", price: 18.00 };

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
/* `scale` draws the same layout at 2x/4x the texels: 1024 px around the cup
   left the 20 px wordmark magnified ~2.3x on a 4K screen, and it went soft.
   Everything below is laid out in 1024x512 units; the transform (letter
   spacing included, measured) carries it to the real size. */
export function printMap(scale = 1, name = "") {
  const w = 1024, h = 512;
  const c = document.createElement("canvas");
  c.width = w * scale; c.height = h * scale;
  const g = c.getContext("2d");
  g.scale(scale, scale);

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

    /* the second line is the customer's name when they give one — printed
       like the house line it replaces, a little firmer so it reads */
    g.globalAlpha = name ? 0.5 : 0.34;
    g.font = "500 12px Inter, system-ui, sans-serif";
    g.letterSpacing = "6px";
    g.fillText(name ? name.toUpperCase() : "SMALL BATCH", x + 3, mid + 17);

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

/* All-over patterns as a MASK (white = print), applied in the shader in a
   shade of the cup's colour, so the colour still eases and a pattern change
   is one cross-fade. Same canvas layout as the print: canvas y = (1 - v) x
   512, and the wall runs v 0.176-0.765 (y 120-422). The wall is ~1.6x
   longer around than it is tall in canvas pixels, so shapes are drawn with
   y squashed to 0.63 to land round on the cup. Every period divides 1024:
   the seam where u wraps never shows. */
export function patternMask(kind, scale = 1) {
  const w = 1024, h = 512, Y0 = 112, Y1 = 430, SQ = 0.63;
  const c = document.createElement("canvas");
  c.width = w * scale; c.height = h * scale;
  const g = c.getContext("2d");
  g.scale(scale, scale);
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#fff"; g.strokeStyle = "#fff";
  if (kind === "pin") {
    for (let i = 0; i < 64; i++) g.fillRect(i * 16, Y0, 2.2, Y1 - Y0);
  } else if (kind === "bands") {
    for (let y = Y0 + 6; y < Y1; y += 30) g.fillRect(0, y, w, 11);
  } else if (kind === "dots") {
    for (let row = 0, y = Y0 + 8; y < Y1; y += 32 * SQ, row++) {
      for (let x = (row % 2) * 16; x < w + 16; x += 32) {
        g.beginPath(); g.ellipse(x, y, 4.2, 4.2 * SQ, 0, 0, Math.PI * 2); g.fill();
      }
    }
  } else if (kind === "waves") {
    g.lineWidth = 2.4;
    for (let y = Y0 + 10; y < Y1; y += 24) {
      g.beginPath();
      for (let x = 0; x <= w; x += 4) g.lineTo(x, y + Math.sin((x / w) * Math.PI * 2 * 32) * 5 * SQ);
      g.stroke();
    }
  } else if (kind === "check") {
    g.globalAlpha = 0.55;
    for (let i = 0; i < 32; i++) g.fillRect(i * 32, Y0, 14, Y1 - Y0);
    for (let y = Y0; y < Y1; y += 32 * SQ) g.fillRect(0, y, w, 14 * SQ);
    g.globalAlpha = 1;
  } else if (kind === "beans") {
    /* coffee beans, each turned its own way, the crease cut out */
    let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let row = 0, y = Y0 + 14; y < Y1 - 6; y += 30 * SQ, row++) {
      for (let x = (row % 2) * 32; x < w + 32; x += 64) {
        const a = rnd() * Math.PI;
        for (const xx of [x, x - w]) {
          g.save(); g.translate(xx, y); g.scale(1, SQ); g.rotate(a);
          g.beginPath(); g.ellipse(0, 0, 10, 6.5, 0, 0, Math.PI * 2); g.fill();
          g.globalCompositeOperation = "destination-out"; g.lineWidth = 1.8;
          g.beginPath(); g.moveTo(-8, 0); g.bezierCurveTo(-3, -3.5, 3, 3.5, 8, 0); g.stroke();
          g.restore();
        }
      }
    }
  } else if (kind === "tulip") {
    /* the Ottoman tulip of the İznik tiles: three petals, a stem, two leaves */
    const tulip = (x, y) => {
      g.save(); g.translate(x, y); g.scale(1, SQ);
      g.beginPath(); g.moveTo(0, -17); g.bezierCurveTo(6.5, -10, 6, 2, 0, 6); g.bezierCurveTo(-6, 2, -6.5, -10, 0, -17); g.fill();
      for (const sx of [-1, 1]) {
        g.save(); g.scale(sx, 1);
        g.beginPath(); g.moveTo(-1.5, 6); g.bezierCurveTo(-12, 2, -13.5, -8, -9.5, -15); g.bezierCurveTo(-8, -5, -5, 1, -1.5, 6); g.fill();
        g.beginPath(); g.moveTo(0, 19); g.bezierCurveTo(-8, 15, -12, 9, -12.5, 4); g.bezierCurveTo(-8, 10, -4, 13.5, 0, 15.5); g.fill();
        g.restore();
      }
      g.fillRect(-1, 5, 2, 15);
      g.restore();
    };
    for (let row = 0, y = Y0 + 26; y < Y1 - 10; y += 56 * SQ, row++) {
      for (let x = (row % 2) * 32; x < w + 32; x += 64) { tulip(x, y); tulip(x - w, y); }
    }
  } else if (kind === "gulls") {
    /* gulls over the water, more of them high up, every size */
    let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    g.lineWidth = 2.1; g.lineCap = "round"; g.lineJoin = "round";
    for (let i = 0; i < 70; i++) {
      const x = rnd() * w, y = Y0 + 12 + Math.pow(rnd(), 1.4) * (Y1 - Y0 - 40), s = 0.55 + rnd() * 0.85;
      for (const xx of [x, x - w, x + w]) {
        g.save(); g.translate(xx, y); g.scale(s, s * SQ);
        g.beginPath(); g.moveTo(-11, 1); g.quadraticCurveTo(-5.5, -7, 0, 0); g.quadraticCurveTo(5.5, -7, 11, 1); g.stroke();
        g.restore();
      }
    }
  } else if (kind === "ferry") {
    /* Bosphorus ferries on a line of water, round the foot of the cup, below
       where a sleeve sits */
    const base = 398;
    const ferry = (x) => {
      g.save(); g.translate(x, base); g.scale(1, SQ);
      g.beginPath(); g.moveTo(-30, -6); g.lineTo(30, -6); g.lineTo(25, 4); g.lineTo(-27, 4); g.closePath(); g.fill();   // hull
      g.fillRect(-21, -14, 39, 8);                       // the saloon deck
      g.fillRect(-13, -20, 23, 6);                       // the wheelhouse
      g.fillRect(-1, -32, 5, 12);                        // the funnel
      g.globalCompositeOperation = "destination-out";
      g.fillRect(-1, -28, 5, 2);                         // its band
      for (let k = -18; k < 16; k += 6) g.fillRect(k, -12, 3, 3);   // the windows
      g.restore();
    };
    for (let x = 64; x < w + 64; x += 128) { ferry(x); ferry(x - w); }
    g.lineWidth = 1.6;
    for (const dy of [10, 17]) {
      g.beginPath();
      for (let x = 0; x <= w; x += 4) g.lineTo(x, base + dy * SQ + Math.sin((x / w) * Math.PI * 2 * 48) * 2 * SQ);
      g.stroke();
    }
  } else if (kind === "skyline") {
    /* the old city's skyline — domes, minarets, the Galata tower — twice round
       the foot of the cup */
    const base = 418;
    const sky = (ox) => {
      g.save(); g.translate(ox, base); g.scale(1, SQ);
      // low roofs between the landmarks
      let sd = 5; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      for (let x = 0; x < 512; x += 14) g.fillRect(x, -10 - rnd() * 16, 14, 26);
      // the Galata tower
      g.fillRect(52, -78, 18, 78); g.fillRect(48, -82, 26, 5);
      g.beginPath(); g.moveTo(49, -82); g.lineTo(61, -108); g.lineTo(73, -82); g.closePath(); g.fill();
      // a great mosque: dome, half-domes, four minarets
      const mosque = (cx, r, mh) => {
        g.fillRect(cx - r * 1.5, -r * 0.9, r * 3, r * 0.9);
        g.beginPath(); g.arc(cx, -r * 0.9, r, Math.PI, 0); g.fill();
        g.beginPath(); g.arc(cx - r * 1.15, -r * 0.6, r * 0.5, Math.PI, 0); g.fill();
        g.beginPath(); g.arc(cx + r * 1.15, -r * 0.6, r * 0.5, Math.PI, 0); g.fill();
        g.fillRect(cx - 1.5, -r * 1.9 - 10, 3, 10);
        for (const mx of [cx - r * 2.1, cx + r * 2.1, cx - r * 2.7, cx + r * 2.7]) {
          const hh = (Math.abs(mx - cx) > r * 2.4 ? mh * 0.85 : mh);
          g.fillRect(mx - 2.5, -hh, 5, hh);
          g.beginPath(); g.moveTo(mx - 3.5, -hh); g.lineTo(mx, -hh - 12); g.lineTo(mx + 3.5, -hh); g.closePath(); g.fill();
        }
      };
      mosque(200, 30, 92);
      mosque(390, 22, 70);
      g.restore();
    };
    sky(0); sky(512);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.anisotropy = 8;
  return t;
}

/* Latte art for the coffee's surface, as a mask (white = milk foam): a heart
   poured into a milk drink, a slow swirl where milk went into a black one. */
export function latteMap(kind) {
  const s = 512;
  const c = document.createElement("canvas"); c.width = c.height = s;
  const g = c.getContext("2d");
  g.fillStyle = "#000"; g.fillRect(0, 0, s, s);
  g.fillStyle = "#fff"; g.strokeStyle = "#fff";
  g.filter = "blur(3px)";                           /* foam has soft edges */
  g.translate(s / 2, s / 2);
  if (kind === "heart") {
    /* a poured heart: two round lobes, the notch the pour leaves at the top,
       a point at the bottom, and the thin line where the jug cut through */
    g.beginPath();
    g.moveTo(0, 128);
    g.bezierCurveTo(-70, 78, -158, 22, -146, -48);
    g.bezierCurveTo(-136, -118, -46, -132, 0, -72);
    g.bezierCurveTo(46, -132, 136, -118, 146, -48);
    g.bezierCurveTo(158, 22, 70, 78, 0, 128);
    g.fill();
    g.lineWidth = 7; g.lineCap = "round";
    g.beginPath(); g.moveTo(0, -168); g.lineTo(0, -86); g.stroke();
    g.beginPath(); g.moveTo(0, 122); g.lineTo(0, 168); g.stroke();
  } else if (kind === "swirl") {
    g.lineWidth = 16; g.lineCap = "round";
    g.beginPath();
    for (let a = 0; a < Math.PI * 5; a += 0.05) { const r = 12 + a * 13; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

/* Cork: a light board with dark granules (multiplied by the sleeve colour). */
export function corkMap() {
  const w = 1024, h = 256;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h);
  let sd = 3; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 16000; i++) {
    const v = 168 + Math.floor(rnd() * 70);              /* fine, low-contrast granules: big dark ones read as leopard */
    g.fillStyle = `rgb(${v},${v - 6},${v - 14})`;
    const x = rnd() * w, y = rnd() * h, r = 0.4 + rnd() * 1.2;
    g.beginPath(); g.ellipse(x, y, r, r * (0.6 + rnd() * 0.6), rnd() * 3, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/* --- The mug (for here) ---------------------------------------------------
   The OUTSIDE has the paper cup's exact point structure (4 base, 10 wall, 4
   rim points), so the print and the pattern land on it exactly as they do on
   the cup; the inside is its own surface. Squat, near-straight, with a thick
   rolled rim. */
export function mugSize(S) {
  /* a mug is about as tall as it is wide; wider read as a plant pot */
  return { h: S.h * 0.72, rb: S.rt * 0.81, rt: S.rt * 0.86 };
}
export function mugOuterProfile(h, rb, rt) {
  const p = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(rb * 0.9, 0),
    new THREE.Vector2(rb - 0.01, 0.02),
    new THREE.Vector2(rb, 0.07)
  ];
  const SEG = 10, y0 = 0.07, r0 = rb;
  for (let i = 1; i <= SEG; i++) {
    const k = i / SEG;
    p.push(new THREE.Vector2(r0 + (rt - r0) * k, y0 + (h - y0) * k));
  }
  p.push(new THREE.Vector2(rt + 0.006, h + 0.02));
  p.push(new THREE.Vector2(rt - 0.004, h + 0.048));
  p.push(new THREE.Vector2(rt - 0.034, h + 0.056));
  p.push(new THREE.Vector2(rt - 0.06, h + 0.04));
  return p;
}
export function mugInnerProfile(h, rt) {
  return [
    new THREE.Vector2(rt - 0.06, h + 0.04),
    new THREE.Vector2(rt - 0.072, h - 0.05),
    new THREE.Vector2(rt - 0.09, 0.2),
    new THREE.Vector2(rt - 0.13, 0.13),
    new THREE.Vector2(0, 0.12)
  ];
}
/* The handle: a loop on the -z side (u = 0.5), half-way between the two
   wordmarks (u 0.25 and 0.75) — the side the cup shows the reader at 02 —
   swept as a slightly flattened tube. */
export function mugHandle(h, rb, rt) {
  const at = (y) => -(rb + (rt - rb) * (y / h) - 0.02);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, h * 0.80, at(h * 0.80)),
    new THREE.Vector3(0, h * 0.84, at(h * 0.84) - 0.20),
    new THREE.Vector3(0, h * 0.70, at(h * 0.70) - 0.34),
    new THREE.Vector3(0, h * 0.40, at(h * 0.40) - 0.33),
    new THREE.Vector3(0, h * 0.22, at(h * 0.22) - 0.17),
    new THREE.Vector3(0, h * 0.20, at(h * 0.20))
  ]);
  const geo = new THREE.TubeGeometry(curve, 72, 0.045, 18, false);
  geo.scale(1.25, 1, 1);                                  /* wider than deep, like a real handle */
  return geo;
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

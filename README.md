# Nordic Roast — a 3D coffee configurator

An interactive café site: design your own cup — size, colour, sleeve, lid —
and watch it rebuild in real time while the page scrolls.

**Live:** https://larisel.com/cafe-3d/

> Nordic Roast is a fictional brand, built as a demo of what a real 3D
> product experience looks like on the open web.

## What it does

- **Real-time configurator.** Four option groups drive one Three.js mesh.
  The price and the summary line update with it.
- **Scroll choreography.** A single fixed canvas sits behind the whole page;
  scroll position drives where the cup sits, how large it is and how far it
  has turned.
- **Drag to turn.** Inside the configurator the stage takes pointer events so
  the cup can be spun by hand; everywhere else the page scrolls normally.

## Notes

**The cup is a `LatheGeometry`** spun from a 2D profile. A paper cup *is* a
surface of revolution, so modelling it any other way would mean more vertices
for a worse silhouette. Sleeve and lid are separate lathes that follow the
wall's taper.

**Geometry is only rebuilt when the size changes.** Colour, sleeve and lid
changes touch materials and visibility only — rebuilding a mesh to recolour it
is the classic way to make a configurator feel sluggish.

**The environment map is generated from a canvas gradient** rather than an HDR
download: convincing on the lid's plastic, weightless, and no request on the
critical path.

**A `ShadowMaterial` plane catches a real shadow.** Without contact shadow a
product render floats and reads as a sticker.

**On phones the cup takes the top of the viewport and the copy takes the
bottom.** Reading and looking get their own space instead of fighting for the
same pixels — and in the configurator you can still see what you are changing.

## Stack

Three.js (vendored), vanilla JS, CSS custom properties. No build step, no
dependencies to install.

## Local

```bash
python -m http.server 8877
```

ES modules need HTTP — opening `index.html` from the filesystem will not load
the 3D scene.

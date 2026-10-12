# Larisel — a 3D café site

An interactive café site: a scroll-driven film from bean to cup, then a live
3D cup you design — colour, print, sleeve, lid, your name — a printed order
ticket, ordering from the table by QR with a split bill, and a Turkish coffee
reading, from a 3D cup or from a photo of your own.

**Live:** https://larisel.com/cafe-3d/

> The café is a demo, not a real shop: a showcase by Larisel of what a real
> 3D product experience can look like on the open web. Nothing is charged.

## What it does

- **Opening film.** Four chapters rendered in Blender (roasting, grinding,
  brewing, pouring), scrubbed by the scroll; its last frame hands over to the
  live WebGL cup without a visible cut.
- **Real-time configurator.** Drink, size, colour, finish, print, sleeve, lid,
  name and extras drive one Three.js cup; the price and the summary follow.
- **Scroll choreography.** A single fixed canvas sits behind the page; the
  scroll decides where the cup stands, how large it is and how far it turns.
- **Drag to turn.** In the configurator the cup can be turned by hand, with
  inertia; everywhere else the page scrolls normally.
- **Order ticket.** A printed ticket with the cup as designed, the brew
  steps, a choice of ready time and a stamp card.
- **At the table** (`?masa=N`, tables 1–12). Call a waiter, ask for the bill,
  split it; every table has its own QR code in the footer.
- **Coffee reading.** Turn the 3D cup over and read the shapes in the
  grounds — or upload a photo of a real cup: it is read on the device and
  never sent anywhere.
- **Three languages.** English, Turkish and Russian, keyed by the English
  sentence itself.

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

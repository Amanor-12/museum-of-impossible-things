# Portfolio notes

**The Museum of Impossible Things** is an interactive digital art exhibition that explores what happens when light takes on weight, words become matter, and architecture develops a pulse.

## Engineering decisions

- Kept geometry and lighting authored in code. A three-strand trefoil uses custom cross-sections and a shader shared across Solid, Fluid, and Spectral states, so visitors can retain their viewing angle as the material changes.
- Used a shared spatial input model for drag, keys, and damped camera movement, with separate depth and fold controls to keep exploration constrained.
- Used native SVG text for visitor phrases. Transform, clipping and displacement preserve the same source text across the three behaviors.
- Used a single, lazy WebGL renderer and derived image previews from real browser captures. The application serves as a static build with hash-based routes.

**Stack:** React, TypeScript, Vite, Three.js, React Three Fiber, Drei, GLSL, GSAP, SVG, Playwright, GitHub Actions.

## Suggested portfolio copy

> I built a browser-native art museum in three acts. Visitors reshape a suspended metal sculpture, turn their own words into an artwork, and fold a breathing architectural passage. The project combines procedural WebGL artwork with responsive editorial typography, keyboard controls and an image fallback.

## Suggested resume entry

Built and tested a React and TypeScript digital exhibition featuring procedural Three.js geometry, GLSL material transitions, interactive SVG typography, and a keyboard-accessible gallery. Configured continuous integration and static delivery through GitHub Actions.

[Watch the recorded walkthrough](walkthrough.webm)

## Gallery

- [Arrival](arrival.jpg)
- [The Weight of Light](light.jpg)
- [Words That Refuse to Stay Still](typography.jpg)
- [The Room That Breathes](architecture.jpg)
- [Exhibition index](index.jpg)
- [Mobile arrival](mobile.jpg)
- [The threshold](threshold.jpg)
- [Fluid state](fluid.jpg)
- [Spectral state](spectral.jpg)
- [Closing sequence](closing.jpg)
- [The Seam on mobile](mobile-seam.jpg)

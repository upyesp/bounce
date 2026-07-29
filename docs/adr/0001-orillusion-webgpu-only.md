# Use orillusion (WebGPU-only) with Ammo.js soft-body cloth

We're building a mobile-first 3D physics puzzle whose core mechanic — a Ball bouncing off a deformable Cloth trampoline — depends on real soft-body cloth physics. We chose the orillusion engine (`@orillusion/core`), which is WebGPU-only with no WebGL fallback, paired with `@orillusion/physics` (Ammo.js / Bullet WASM) for the cloth.

## Decision

Accept orillusion's WebGPU-only reality. Target modern mobile browsers only — **iOS 17.4+ / Android Chrome 121+** — and ship a `navigator.gpu` feature-detection screen so unsupported browsers get a clean message instead of a black screen. Do not build a WebGL fallback.

## Considered options

- **orillusion (WebGPU-only) + Ammo.js cloth** — chosen. Best soft-body cloth quality; the engine the brief is built around (the "cloth" example).
- **WebGL engine (e.g. three.js + cannon-es / rapier)** — rejected. Broader device compatibility, but no first-class soft-body cloth comparable to Bullet, and contradicts the explicit choice of orillusion.
- **orillusion + a hand-built WebGL fallback renderer** — rejected. Maintaining a second renderer is not viable for a project of this size.

## Consequences

- Older mobile devices and non-WebGPU browsers cannot play; the feature-detection screen manages expectations.
- A mobile smoke-test of the cloth example on a real mid-range phone must pass (renders + acceptable FPS) before committing to the build — if soft-body cloth underperforms on mobile WebGPU, this decision is revisited.
- Physics runs on a fixed timestep so a given Setup yields a consistent bounce (fairness), relevant once par/stars scoring is added.

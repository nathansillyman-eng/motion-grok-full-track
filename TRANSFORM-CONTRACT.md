# Transform contract — v9-full-r2

NOT WEAR READY. Codex re-verifies before Claude integrates.

## Hierarchy (required)

```
vehicleRoot          yaw + position only. rotation.z = 0 always.
  bikeVisual         sibling of cameras. rotation.z = targetLeanRad. Plant = 0.
  cockpitCam         sibling of bikeVisual. NEVER a child of bikeVisual.
                     rotation.z = appliedCorrectionRad
  chaseCam           not under bikeVisual. rotation.z = 0. up = (0,1,0)
  cowl               on vehicleRoot, 0.85 m, world-locked, never head-locked
```

`appliedCorrectionRad = sourceVerified && sampleValid && view==cockpit && vehicle==striker
                       ? dial * (targetLean - measuredLean) * π/180
                       : 0`

## Forbidden

- Camera parented under the leaning body.
- Applying body lean AND deficit on the same transform chain.
- Skipping a tick when the sample is invalid (that retains previous roll).
- Hold-last, wrap, modulo, stretch, 0-fill of measuredLean.
- Frozen 127 ms / 3-frame lookahead.

On invalid sample: write `rotation.z = 0` on the camera **this frame**. Neutral, not skipped.

## World-space identities

Let `worldRoll(obj)` be Euler YXZ Z from `obj.matrixWorld`.

| node | worldRoll |
|---|---|
| vehicleRoot | 0 |
| bikeVisual (striker, valid) | targetLeanRad |
| cockpitCam (sibling, valid, dial D) | D * deficitRad |
| cockpitCam if wrongly child of bike | targetLeanRad + D * deficitRad  ← FORBIDDEN |
| chaseCam | 0 |
| plant, any camera | 0 |
| invalid sample, any camera | 0 |

## Frame 258 demonstration (why 83° was a bug)

Prior package baked `target[258] = atan(v·ω[261]/g)` (3-frame lookahead) = 42.1519°.
`measured[258] = 1.2919°`. `deficit = 40.8601°`.

If cockpit camera is a child of the leaning body at dial 1:

`worldRoll = 42.1519 + 40.8601 = 83.012°`

That is body + correction. Illegal.

r2 same-frame target at 258 = atan(v·ω[258]/g) ≈ 40.46°.
Deficit ≈ 39.17°.
Legal sibling cockpit world roll at dial 1 = **39.17°**, not 83°.

`MOTION.selfTest()` asserts the sibling vs child-of-bike identities.

## A-Frame markup

```html
<a-entity lean-gate="vehicle: striker; mode: cockpit; sourceSha256: 4507a5d5f9304b91c149200672c8a468f089a33bb96b10032a52346085483882">
  <a-entity bike-visual></a-entity>
  <a-camera></a-camera>
</a-entity>
```

No correction until `MOTION.setSourceIdentity` matches the pinned ride.mp4 SHA.

## Three.js (this app)

`player` (yaw) → `bodyLean` (visual) and `camLean` (cockpitCam) as siblings. Chase camera is unparented with `up = (0,1,0)`.

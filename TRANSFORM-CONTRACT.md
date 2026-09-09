# Transform contract — v9-full-r4

NOT WEAR READY. 4K NOT VALIDATED.

## Hierarchy (required)

```
vehicleRoot                 yaw + position. rotation.z = 0 always.
  bikeVisual                sibling. rotation.z = targetLeanRad. Plant = 0.
  correctionOffset          sibling of bikeVisual (or child of tracked camera).
                            rotation.z = appliedCorrectionRad
  trackedHeadsetCamera      NEVER written by this system.
  chaseCorrectionOffset     rotation.z = 0. up = (0,1,0)
```

Cowl placement is **not specified** by the motion package. Environment-owned.

`appliedCorrectionRad = sourceVerified && sampleValid && view==cockpit && vehicle==striker
                       ? dial * deficitRad
                       : 0`

## Forbidden

- Camera or correctionOffset parented under bikeVisual → `HIERARCHY_FORBIDDEN`, correction 0.
- Writing tracked headset `camera.rotation`.
- Body lean + deficit on one chain (double roll).
- Skipping a tick on invalid (hold-last). Write 0 this frame.
- Frozen 127 ms / 3-frame lookahead.
- Tick resetting dial to a schema default.

## World-space identities

| node | worldRoll |
|---|---|
| vehicleRoot | 0 |
| bikeVisual (striker, valid) | targetLeanRad |
| correctionOffset (sibling, valid, dial D) | D * deficitRad |
| correctionOffset if child of bike | target + D*deficit ← forbidden, rejected |
| chase | 0 |
| plant / invalid | 0 |
| tracked headset camera | unchanged by this system |

Frame 258 dial 1, siblings: bike 40.459°, correction 39.1671°, chase 0°. Child-of-bike would be 79.6261° and is rejected.

## A-Frame

```html
<a-entity lean-gate>
  <a-entity bike-visual></a-entity>
  <a-entity lean-correction>
    <a-camera></a-camera>
  </a-entity>
</a-entity>
```

`lean-gate` writes `[lean-correction]` only. It never assigns `[camera].object3D.rotation.z`.
`remove()` calls `MOTION.detachVideo()` (cancels RVFC).
Tick copies `MOTION.dial` into the component readout. It does not call `setDial` from the schema default.

Every tick must re-check live video permission (`ended`, `seeking`, src, RVFC live, freshness ≤ 1/24 s) before retaining a nonzero correctionOffset. Events are not the safety boundary.


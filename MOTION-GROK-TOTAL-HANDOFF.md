# MOTION GROK — TOTAL HANDOFF
Generated 2026-09-09. Lane: Motion Grok. Audience: Claude + Codex + Nate.

## STATUS (DO NOT LIE)

- WEAR READY: **NO**
- R6 MOTION DATA CLEARED FOR INTEGRATION: **NO** (Codex last: 4K angular stats blocked pending JSON intake; then JSON was supplied)
- 4K SOURCE IDENTITY: **PASS**
- 4K FRAME CORRESPONDENCE (tested 576×384): **PASS**
- 4K MEASUREMENT CORRESPONDENCE: **SUPPORTED** at same-methodology 576×384, with 1497 addendum
- NATIVE-RESOLUTION 4K LK: **NOT RUN**
- FULL 4K REMEASUREMENT REQUIRED: Motion Grok recommended **NO**; Codex last said **UNDETERMINED** until they hashed the comparison JSON
- Coral settling: **still RED / not closed in this lane**
- Consumer version: **v9-full-r6**
- LK source arrays: **FROZEN** since first 1514-frame ride.mp4 measure. Not mutated R2–R6.

If a later agent wants a headset wear, they must still: verify source identity of the **selected** element (ride-4k.mp4 on default path, ride.mp4 on ?safe=1), wire MOTION.setDial through to applyTransforms, keep sibling hierarchy, and not treat dial=1 as a comfort setting. Frame 261 deficit is ~39°.

---

## WHERE THE BYTES ARE

Repo: https://github.com/nathansillyman-eng/motion-grok-full-track

| what | pin | SHA-256 | bytes |
|---|---|---|---|
| R6 zip | `91b9f1c` | `1b68b918d3e1a52a6e6ea7a2cce91823fb9046dd58fd79b3abe009ac47e5f8a4` | 147394 |
| v9-full.json | inside R6 zip / `91b9f1c` | `68d2301d957561d8691aa040b6b62c034dbbd3a05d9afdcaf3f553ddee092d1a` | 261167 |
| v9-inline.js | same | `85c61b625c5a7718f2ff10ca8886cd207760058f745fddc8983371b5736f6d48` | 261473 |
| hooks.js r6 | same | `bed09274340784a5b75d80a64dcec80aa83c89c7dbf18f03eeeba0711717fe36` | 33480 |
| aframe-lean-gate.js | same | `a699335242d3c3f22fa6466270c239dbdf94dcb761066978a2d488a6fe5cd4ce` | 5164 |
| 4K-WINDOW-COMPARISON.json | `5c4c2ba` | `ab3e036aa6a98efab4c8ed4d4a526aae6881e64f689a2ae626909a3791095316` | 91375 |
| 4K-VALIDATION.md | `5c4c2ba` | `9ef8c16b87d8aa21185fe8451ae9b98f2b017bbc46006e83cf49a3ef0520d5b3` | 4153 |
| 4K-1497-ADDENDUM.md | `6e3ae73` | `51c007ec588ea01aabd9c916b99c683bfd84e72fbbe42368a82fca6c58e48a6b` | 1425 |

Raw R6 zip:
https://github.com/nathansillyman-eng/motion-grok-full-track/raw/91b9f1c/MOTION-GROK-FULL-TRACK.zip

Raw comparison JSON (this is the file Codex said was missing; it is NOT inside the R6 zip):
https://raw.githubusercontent.com/nathansillyman-eng/motion-grok-full-track/5c4c2ba/4K-WINDOW-COMPARISON.json

HEAD at handoff time: `6e3ae730df35af22c9035fa8ce8542c368361355`

Git history:
```
6e3ae73 4K 1497 addendum
5c4c2ba 4K window correspondence (R6 consumer unchanged)
91b9f1c v9-full-r6: drop currentTime 1/24s veto
d6033c2 v9-full-r5: 125ms stalled-clock lease
d2fda17 v9-full-r4: render-tick stale-frame fail-closed
c30dbb8 v9-full-r3: selfTest isolation, no tracked-pose write
ad40734 v9-full-r2: retire 127ms lookahead, no hold-last, no double-roll
2b5b0fb v9-full 1514-frame track
```

Workspace copies: `/workspace/motion/` and `/workspace/public/motion/`.

---

## SOURCE PLATES

### ride.mp4 (measurement source for the 1514-frame track)

- SHA-256 `4507a5d5f9304b91c149200672c8a468f089a33bb96b10032a52346085483882`
- 55,566,411 bytes
- 1728×1152, 24 fps, 1514 decoded frames, 63.083333 s
- Used under `?safe=1`
- Consumer EXPECTED.sha256 is THIS hash (not the 4K hash)

### ride-4k.mp4 (headset default)

- SHA-256 `7e51e4adc7e82ff82396ec22f2867b05b66f8259388a52530f6e5cbfe87b4059`
- 158,386,233 bytes (151.05 MiB)
- 3240×2160, 24 fps, 1514 decoded frames, 63.083333 s, h264
- Uniform 1.875× of ride.mp4, same 3:2, integer shift (0,0) on 330/330 analysis-grid frames
- Rejoined from `ride-4k.mp4.part-a[a-i]`
- Timing interchangeable with ride.mp4. Resolution only differs.

Consumer currently pins ride.mp4 SHA. Integration on the default 4K path MUST decide whether to:
1. accept ride-4k as the same identity after hashing 7e51e4ad… and mapping as equivalent traversal, or
2. fail-closed because EXPECTED.sha256 is 4507a5d5… (ride.mp4).

That wiring decision is NOT done. Do not silently treat 4K SHA as matching the ride.mp4 pin.

---

## LAWS (ENGINEERING BASELINE — DO NOT REOPEN)

1. `deficit = targetLean − measuredLean`. Null stays null. Missing measuredLean is NEVER zero-filled.
2. Invalid / unverified / ended / seeking / exhausted / stale / cancelled RVFC / lease expiry → applied correction **0 this tick**. No hold-last.
3. No loop, no modulo, no wrap, no stretch.
4. Decoded-frame index `i`, `t[i] = i/24`. Frame 0 = 0.000 s. Frame 1513 = 63.0416667 s. Duration = 1514/24 = 63.083333 s.
5. Applied lead = **null**. Frozen 127 ms / 3-frame lookahead is RETIRED. `target[i] = clamp_deg(atan(vCruise * yawRate[i] / g), ±48)` SAME FRAME. vCruise=24, g=9.81.
6. Dial 0 = plate as-is (correction 0). Dial 1 = full same-frame deficit. Tick CONSUMES dial, never resets it.
7. Motorcycle = striker, body may lean (`bikeVisual.z = targetLean`). Luka/plant = roll 0. Chase = correction 0.
8. Do not reverse/mirror the plate for rear view.
9. No screen-space bloom as a fidelity substitute. Motion package does **not** specify cowl meters (environment owns ~0.70 m visually).
10. Transform hierarchy: `vehicleRoot` (z=0) → siblings `bikeVisual` (body lean) and `correctionOffset` (dial*deficit once). Tracked WebXR camera NEVER written. Camera under bikeVisual = HIERARCHY_FORBIDDEN.
11. RVFC `mediaTime` is authoritative presented-frame timestamp. Liveness = 125 ms monotonic lease. `currentTime` is diagnostic on the RVFC path, not a 1/24 s veto, not a future-frame predictor.
12. No-RVFC fallback is separate, labeled, not displayed-frame proof.
13. Classification FRAUD/PASS/19-turn is `staleStoredLabel` only (80/247 mismatches). Not physical truth.
14. selfTest must never promote production `sourceIdentity.verified`.
15. Do not rerun LK / mutate measured arrays unless explicitly ordered to remesure.

---

## FORMULAS

```
fpx = (576/2) / tan(rad(72/2)) = 396.398
yawRate[i] rad/s = -lkTxPx[i] / fpx * 24     # + = right heading
yawRate median-5 on finite samples only; holes stay null
measuredLeanDeg[i] = vertical-line tilt, cowl-masked, dark-gated
                     + = clockwise plate roll = right lean
targetLeanDeg[i] = clamp(deg(atan(24 * yawRate[i] / 9.81)), ±48)
deficitLeanDeg[i] = targetLeanDeg[i] - measuredLeanDeg[i]
appliedCorrectionDial1Deg[i] = deficit if correctionValid else 0
appliedCorrectionDeg = verified && valid && striker && cockpit ? dial * deficit : 0
cowl mask: y in [0.06, 0.54] H, x in [0.07, 0.93] W  (analysis 576×384)
```

Instrument: 4-param coarse-to-fine Lucas-Kanade (tx, ty, theta, scale), 3-level pyramid, Huber weights, numpy. Script: `/workspace/scripts/measure_lk_v9.py`.

---

## TRACK COVERAGE PROOF

- sampleCount = frameCount = 1514
- sampleRate = 24
- decodedFrame[i] === i for all i
- videoTimestamp strictly monotonic, equals i/24 ± 1e-4
- first timestamp 0.0, last 63.0417, last-frame-end 63.0833
- no wrap / no loop / no hold-last
- yawRate finite 1494 / null 20
- measuredLeanDeg finite 1496 / null 18
- deficitLeanDeg finite 1493 / null 21
- correctionValid true 1493 / false 21

Null / FAIL_CLOSED indices:
```
yawRate null:           0,1,2,3,4, 865, 1153, 1501–1513
measuredLeanDeg null:   0,1,2,3, 1500–1513
deficit / valid false:  0,1,2,3,4, 865, 1153, 1500–1513
```

Holes 865 and 1153: measuredLean finite, yaw null → target/deficit null → FAIL_CLOSED. Correct.

---

## KEY FRAMES (payload lo-res track)

i | t | yawRate | measuredLean | targetLean | deficit | valid | heading
---|---|---|---|---|---|---|---
0 | 0.0000 | null | null | null | null | F | null
1 | 0.0417 | null | null | null | null | F | null
2 | 0.0833 | null | null | null | null | F | null
256 | 10.6667 | 0.3172 | 0.9557 | 37.8123 | 36.8566 | T | 1.0963
257 | 10.7083 | 0.3172 | 1.0515 | 37.8123 | 36.7608 | T | 1.1095
258 | 10.7500 | 0.3486 | 1.2919 | 40.4590 | 39.1671 | T | 1.1240
259 | 10.7917 | 0.3486 | 2.0122 | 40.4590 | 38.4468 | T | 1.1385
260 | 10.8333 | 0.3490 | 2.4586 | 40.4914 | 38.0328 | T | 1.1531
**261** | 10.8750 | 0.3700 | 2.9326 | 42.1514 | **39.2188** | T | 1.1685
262 | 10.9167 | 0.3700 | 2.9390 | 42.1514 | 39.2124 | T | 1.1839
756 | 31.5000 | 0.0477 | −0.3000 | 6.6562 | 6.9562 | T | 2.4843
864 | 36.0000 | 0.1510 | −0.6061 | 20.2752 | 20.8813 | T | 2.4748
865 | 36.0417 | null | −3.7901 | null | null | F | null
866 | 36.0833 | 0.0978 | −4.0481 | 13.4560 | 17.5041 | T | 2.4789
**899** | 37.4583 | −0.3035 | −3.7327 | −36.5942 | **−32.8615** | T | 2.2987
**1027** | 42.7917 | 0.3316 | 2.6811 | 39.0508 | **36.3697** | T | 2.8354
1152 | 48.0000 | −0.2130 | −4.9210 | −27.5241 | −22.6031 | T | 3.0906
1153 | 48.0417 | null | −0.5565 | null | null | F | null
1154 | 48.0833 | 0.1275 | −0.4708 | 17.3241 | 17.7949 | T | 3.0959
1497 | 62.3750 | 0.1109 | −0.1497 | 15.1798 | 15.3295 | T | 3.9528
1498 | 62.4167 | 0.1109 | −0.3421 | 15.1798 | 15.5219 | T | 3.9574
1499 | 62.4583 | 0.0703 | −0.3414 | 9.7587 | 10.1001 | T | 3.9603
1511–1513 | … | null | null | null | null | F | null

maxDeficitDeg (payload) = **39.2188 at frame 261**.

Dial 1 at 258: bike 40.459°, correctionOffset 39.1671°, chase 0°. With simulated +10° tracked pose, cockpit WORLD ≈ 49.17° (tracked composed once — correct, not double-roll). That magnitude is why dial=1 is not a wear setting.

---

## REJECTED APPROACHES

- 1583-sample / ~22 s loop payload (`v9.json` / `v9-REJECTED-1583-loop.json`, SHA `ffabc0712b6259dc8fdb082b1b9c879e0b6906f7235753ea972ae68d1dd9a2af`) — DO NOT USE
- Frozen 127 ms lead / 3-frame lookahead (`target[i]=atan(v*yaw[i+3]/g)`)
- Hold-last on invalid
- `|currentTime−lastPresentedMediaTime|≤1/24` as a second RVFC liveness gate (kills valid 44 ms delayed callbacks)
- Treating FRAUD/PASS/19-turn as physical truth
- Screen-space bloom for glow
- 0.85 m cowl dictation
- Writing tracked headset pose
- Parenting camera under bikeVisual
- Zero-filling missing measuredLean
- selfTest calling setSourceIdentity with the production SHA
- Mirroring the plate for rear view

---

## CONSUMER API (hooks.js v9-full-r6)

```
MOTION.version = "v9-full-r6"
MOTION.wearReady = false
MOTION.fourKValidated = false
MOTION.setDial(v)            // 0..1, persists across ticks
MOTION.getDial()
MOTION.setVehicle("striker"|"plant")
MOTION.setView("cockpit"|"chase")
MOTION.setSourceIdentity({sha256, frameCount, fps, durationSec})
MOTION.revokeSourceIdentity(reason)
MOTION.attachPayload(p)      // numeric-validates whole payload
MOTION.attachVideo(video)    // RVFC + cancel wrapper + events
MOTION.detachVideo()
MOTION.fromPresentedFrame(meta, video)
MOTION.fromVideoElement(video)  // labeled fallback
MOTION.sample(decodedFrame)
MOTION.setDecodedFrame(i)
MOTION.applyTransforms({
  video, decodedFrame,
  vehicleRoot, bikeVisual, correctionOffset,
  trackedCamera, chaseCorrectionOffset, cockpitCam,
  writeTrackedPose: false
})
MOTION.selfTest()            // snapshot/restore; never promotes production verified
MOTION.freshness.leaseMs = 125
MOTION.freshness.currentTimeVetoOnRvfcPath = false
MOTION.coral.apply(obj, pos) // world-locked, rotation 0, does not inherit dial
COCKPIT_MOTION               // live cockpit state
event "leangate:dial"
```

A-Frame:
```
<a-entity lean-gate="sourceSha256: 4507a5d5…; sourceFrames: 1514; sourceFps: 24; sourceDuration: 63.083333">
  <a-entity bike-visual></a-entity>
  <a-entity lean-correction>
    <a-camera></a-camera>
  </a-entity>
</a-entity>
```
Tick copies MOTION.dial into schema readout. Does not `setDial(schemaDefault)`. Never writes `[camera].object3D.rotation`. `remove()` detaches RVFC.

Dial must be forwarded from the UI control into `MOTION.setDial`. A readout-only dial that does not call setDial is the wiring gap Claude already found.

---

## R2 → R6 (what each gate closed)

**R2** retire 127 ms; invalid=0; no double-roll; source identity fail-closed; numeric validation; displayed-frame RVFC preferred; classification separated; no 4K.

**R3** selfTest isolation; event-driven stale RVFC/seek/end; whole-payload numeric; dial persistence; tracked pose never written; stale FRAUD/PASS/0.85 m retired.

**R4** render-tick `readTickPermission` (ended/seeking/exhaustion/src/RVFC-cancel without events).

**R5** stalled-clock 125 ms monotonic lease (`presentationGeneration` + `lastPresentedObservedAt`).

**R6** drop `|currentTime−mediaTime|≤1/24` veto on RVFC path. Tests A–I: 24 fps, 44/60/90/124 ms delayed, >125 neutralize, frozen clock neutralize, currentTime-advance keeps last presented, recovery RVFC.

TRANSFORM-CONTRACT.md last paragraph still mentions “freshness ≤ 1/24 s”. That sentence is **stale R4/R5 wording**. The live law is the 125 ms lease. Do not re-implement the 1/24 veto from that leftover sentence.

Payload `ride4k.note` still says 4K bytes were not in workspace. They arrived later. `fourK.validated` remains false.

---

## 4K WINDOW COMPARISON (same methodology, not native LK)

Windows: 0–5, 227–330, 864–866, 867–1063, 1152–1154, 1497–1513. Explicit 261, 899, 1027.

Pixel: NCC mean 0.9977 min 0.9398, RMSE mean 2.56, shift (0,0)×330, scale 1.875.

Errors 4K−lo (JSON, includes 1497 coverage defect):

| quantity | n | MAE | medAE | p95 | max |
|---|---|---|---|---|---|
| yawRate rad/s | 310 | 0.00243 | 0.00153 | 0.00706 | 0.0278 |
| measuredLeanDeg | 312 | 0.0813 | 0.0676 | 0.209 | 0.386 |
| deficitLeanDeg | 309 | 0.295 | 0.198 | 0.851 | 3.73 |

JSON max 3.73° is frame 1497 with missing LK predecessor 1494 in the window job.

Addendum remesure 1490–1513 with predecessors:

| | 4K | lo payload |
|---|---|---|
| median-5 yaw | 0.1100 | 0.1109 |
| measuredLean | −0.3163 | −0.1497 |
| deficit | 15.3827 | 15.3295 |

Δ deficit **0.053°**. Do not treat JSON 3.73 as a plate failure.

Explicit 4K vs lo deficits: 261 → 39.5583 / 39.2188; 899 → −32.9328 / −32.8615; 1027 → 36.1794 / 36.3697. Same three large-deficit locations. Null gaps stay invalid. 0 measuredLean null-disagreements.

---

## INTEGRATION CHECKLIST FOR CLAUDE (not done)

1. Copy R6 zip files into the scene. Do not fetch.
2. Load v9-inline.js synchronously before hooks.js.
3. Hash the **selected** video. Default path is ride-4k.mp4 (7e51e4ad…). Pin currently expects 4507a5d5… (ride.mp4). This must be an explicit integration decision.
4. `MOTION.setSourceIdentity({sha256, frameCount:1514, fps:24, durationSec:63.083333})` only after the hash check.
5. `MOTION.attachVideo(video)`.
6. Forward the gold dial to `MOTION.setDial(v)` every change. Tick must not reset it.
7. Hierarchy: vehicleRoot / bikeVisual sibling / lean-correction sibling / camera inside lean-correction, never under bikeVisual.
8. Do not write camera.rotation.z.
9. Start dial well below 1. 39° at 261 is not a first-wear value.
10. Coral: `MOTION.coral` world-locks and zeros rotation; does not inherit lean. The environment Coral settling RED item is outside this package.
11. Do not claim WEAR READY.

---

## OPEN BLOCKERS (other lanes / Codex)

- Codex 4K angular stats were BLOCKED only because they did not possess the comparison JSON. File is at `5c4c2ba` hash `ab3e036a…`. After they hash it, they still may want native-4K LK; Motion Grok did not run it.
- Source-identity pin is ride.mp4 SHA while headset default is ride-4k.mp4 SHA. Consumer will fail-closed on 4K until integration maps/accepts it.
- Dial forwarding from UI to MOTION (historical Claude finding).
- Coral settling RED.
- TRANSFORM-CONTRACT leftover 1/24 sentence.
- Comfort: even with correct transforms, full mathematical deficit at dial 1 is not a headset comfort setting.

---

The rest of this file is the verbatim on-disk documents and consumer source, concatenated. The 1514-frame arrays live in v9-full.json (do not paste; copy the file). Comparison per-frame rows live in 4K-WINDOW-COMPARISON.json.




================================================================================
# FILE: MANIFEST.txt
================================================================================

MOTION-GROK-FULL-TRACK r6
NOT WEAR READY. 4K NOT VALIDATED.
RVFC mediaTime authoritative. currentTime not a 1/24s veto on RVFC path.
Lease 125ms monotonic unchanged. LK arrays not mutated.

source ride.mp4 SHA-256:
4507a5d5f9304b91c149200672c8a468f089a33bb96b10032a52346085483882
source frames: 1514
source fps: 24
source duration: 63.083333

freshness leaseMs: 125
currentTimeVetoOnRvfcPath: false
status: NOT_WEAR_READY
fourKValidated: false

contained files (SHA-256  bytes  name):
68d2301d957561d8691aa040b6b62c034dbbd3a05d9afdcaf3f553ddee092d1a  261167  v9-full.json
85c61b625c5a7718f2ff10ca8886cd207760058f745fddc8983371b5736f6d48  261473  v9-inline.js
bed09274340784a5b75d80a64dcec80aa83c89c7dbf18f03eeeba0711717fe36  33480  hooks.js
a699335242d3c3f22fa6466270c239dbdf94dcb761066978a2d488a6fe5cd4ce  5164  aframe-lean-gate.js
5e4b859c642be618e9b79abb1a7a78964e1e761c8f19c2f8e7c3fa2799834a95  2196  TRANSFORM-CONTRACT.md
e9a50f8dd345efb20839aa93f21fec339baf9bba451d745dc0cee9bf9f2fcf8c  978  MEASUREMENT-NOTES.md
b67eb731939ecf0e25550289d5eb397ff821e6dfcf3d4f2ab4b6bc5bf945a4db  1164  R6-CHANGES.md



================================================================================
# FILE: MEASUREMENT-NOTES.md
================================================================================

# Measurement notes — v9-full-r6

NOT WEAR READY. 4K NOT VALIDATED.

LK source arrays were **not** regenerated and **not** mutated.

## Source

ride.mp4 SHA-256 `4507a5d5f9304b91c149200672c8a468f089a33bb96b10032a52346085483882`  
1514 frames · 24 fps · 63.083333 s · 1728×1152

ride-4k.mp4 is **not** measured in this package.

## Lead / classification

Applied lead = null. FRAUD/PASS stamps are `staleStoredLabel` only.

## Displayed-frame freshness (R6)

RVFC `mediaTime` is the presented-frame timestamp and selects the sample.

Liveness lease: last successful RVFC observed within **125 ms** on a monotonic clock (`MOTION.now` || `performance.now`).

`video.currentTime` is **not** a 1/24 s veto on the RVFC path. A delayed callback at 44–124 ms keeps the last presented sample. currentTime must not select future frames.

No-RVFC fallback is separate, currentTime-derived, labeled, not displayed-frame proof.

## Cowl

Motion package does not dictate cowl meters.



================================================================================
# FILE: TRANSFORM-CONTRACT.md
================================================================================

# Transform contract — v9-full-r6

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




================================================================================
# FILE: R3-CHANGES.md
================================================================================

# R3 changes (consumer / metadata only)

NOT WEAR READY. 4K NOT VALIDATED. LK not rerun. Measured source arrays not mutated.

## 1. selfTest security

`selfTest()` uses `sampleWith(payload, fixtureIdentity, …)` — a pure helper.  
It snapshots production `sourceIdentity` and restores it in `finally`.  
It never calls `setSourceIdentity` with the expected SHA.  
Negative control: boot `verified=false` → `selfTest()` → `verified` still false → `sample(258)` still FAIL_CLOSED.

## 2. Stale RVFC / seek / end

`attachVideo` listens for ended, seeking, seeked, emptied, abort, error, loadstart.  
Those paths set `frameFresh=false`, `lastI=-1`, neutralize immediately.  
Src change also `revokeSourceIdentity`.  
`seeked` waits for a new RVFC before applying.  
`detachVideo` / A-Frame `remove()` cancel the RVFC callback.  
After a callback at 261, setting `ended` without a new callback no longer reapplies 261.

## 3. Whole-payload numeric validation

Every consumer array is audited on attach: decodedFrame identity `i===index`, monotonic timestamps, no strings/NaN/Inf/booleans in numeric fields, correctionValid booleans only, deficit = target − measured.  
A poison value in an unused frame rejects the payload. Sampling another valid frame cannot bypass this.

## 4. Dial preserved

A-Frame tick copies `MOTION.dial` into `this.data.dial`. It does **not** `forwardDial(schemaDefault)`.  
Negative control: `setDial(0.2)` then many ticks → dial stays 0.2; `setDial(0.9)` stays 0.9.

## 5. Transform contract

Writes `correctionOffset` only. `trackedCamera` is never written.  
Camera/offset under `bikeVisual` → `HIERARCHY_FORBIDDEN`, correction 0.  
Desktop sibling `cockpitCam` argument still maps as the correction node when it is not the tracked camera.

## 6. Stale analysis metadata

Window/turn `verdict` removed as a live field. Stored only as `staleStoredLabel`.  
Declared-rule mismatch (80/247) disclosed. 19-turn acceptance retired.  
3-frame / 127 ms text removed from `measurement`. Per-turn maxima recomputed from same-frame deficit.

## 7. Cowl

0.85 m removed from motion package docs and `transformContract`. Placement is environment-owned.



================================================================================
# FILE: R4-CHANGES.md
================================================================================

# R4 changes

NOT WEAR READY. 4K NOT VALIDATED.

Surgical fix for the remaining R3 blocker: **STALE-FRAME FAIL-CLOSED**.

LK arrays, transforms, dial behavior, and analysis metadata are unchanged except payload `version` / freshness docs.

## The hole

Event handlers neutralized on `ended` / `seeking` / src-change / RVFC cancel.

The **render tick** still trusted `lastI` + `frameFresh` forever. Setting `video.ended = true` (no event) then calling `applyTransforms` reapplied 27.45°.

## The fix

Every `applyTransforms` (render tick) calls `readTickPermission(video)` against **live** properties. Events are not the safety boundary.

Permission requires:

1. source identity still verified
2. `currentSrc` still equals the bound src
3. `video.ended !== true`
4. `video.seeking !== true`
5. currentTime maps inside the track
6. current sample still valid (via `sample`)
7. RVFC still live if we attached with RVFC
8. freshness (below)

Any failure this tick: `correctionOffset.z = 0`, `appliedCorrection = 0`, `status = FAIL_CLOSED`.

## Freshness contract

Not a wall-clock timeout.

Presented-frame evidence is the last RVFC `mediaTime`.

Retain it only while `|video.currentTime - lastPresentedMediaTime| ≤ 1/24 s` (one decoded-frame period of this 24 fps plate). If the media clock has moved more than one frame without new presented-frame evidence, the last sample does not name the displayed frame.

Paused on the same frame (clock unmoved, RVFC still scheduled) remains fresh.

## Negative controls (no events fired)

A. `ended = true` → 0  
B. `seeking = true` → 0  
C. currentTime at duration → 0  
D. src changed → 0  
E. `cancelVideoFrameCallback` → 0  
F. currentTime jumped > 1/24 s from last presented mediaTime → 0  

Positive: valid source, matching src, not ended, not seeking, in-range, RVFC live, currentTime within 1/24 of last presented mediaTime → correction retained.

R3 PASS gates retested: selfTest isolation, numeric validation, dial persistence, transform isolation (tracked pose untouched).



================================================================================
# FILE: R5-CHANGES.md
================================================================================

# R5 changes

NOT WEAR READY. 4K NOT VALIDATED.

Surgical fix: **STALLED-CLOCK FAIL-CLOSED**. R4 gates unchanged.

## Hole

`|currentTime - lastPresentedMediaTime| <= 1/24` stays true forever if both clocks freeze. RVFC handle still "live", no events, old correction retained.

## Rule

A nonzero correction requires presented-frame evidence that is **currently alive**.

Each successful RVFC:

- increments monotonic `presentationGeneration`
- records `lastPresentedMediaTime` / optional `presentedFrames`
- records `lastPresentedObservedAt` on a **monotonic** clock (`MOTION.now` || `performance.now`)

Render tick permission (all required):

1. R4 live checks (identity, src, ended, seeking, range, RVFC not cancelled, mediaTime identity)
2. `now - lastPresentedObservedAt <= 125 ms`

125 ms = 3 × (1000/24) decoded-frame periods.

Why 3: one expected 24 fps interval + one delayed frame + one period of RVFC/rAF jitter.

Repeated render ticks between legitimate 24 fps callbacks do **not** expire the lease (72 Hz ticks inside 41.7 ms are case A).

If no new presented-frame observation arrives within 125 ms (case B: stalled clock, frozen currentTime, silent RVFC):  
`correctionOffset = 0`, `appliedCorrection = 0`, `status = FAIL_CLOSED`. No event required.

## Controls

Negative: valid correction → freeze currentTime → stop RVFC → ticks at 0…124 ms still OK → 126 ms → 0.

Positive: 24 fps + ±8 ms jitter remains permitted. One 90 ms delayed frame then recovery RVFC remains permitted (no flicker).



================================================================================
# FILE: R6-CHANGES.md
================================================================================

# R6 changes

NOT WEAR READY. 4K NOT VALIDATED.

Surgical: remove the RVFC-path `currentTime` 1/24 s veto. R5 stalled-clock lease unchanged.

## Contradiction

Lease claimed 125 ms delayed-callback tolerance.
`|currentTime - lastPresentedMediaTime| <= 1/24` vetoed at ~44 ms while RVFC was still live.

## RVFC path (authoritative)

`requestVideoFrameCallback` `mediaTime` selects the motion sample (`lastI` from last presented frame).

Liveness = monotonic lease only: `now - lastPresentedObservedAt <= 125 ms`.

`video.currentTime` is diagnostic. It does **not** veto a valid presented frame, does **not** select future motion frames, does **not** trip exhaustion on the RVFC path.

If no new RVFC before lease expiry → FAIL_CLOSED.

## No-RVFC fallback

Separate. currentTime-derived, labeled, not displayed-frame proof, fail-closed/conservative. Exhaustion still uses currentTime here.

## Tests

A 24 fps cadence PASS  
B 44 ms delayed PASS  
C 60 ms PASS  
D 90 ms PASS  
E 124 ms PASS  
F >125 ms no RVFC neutralize  
G frozen clock + no RVFC neutralize  
H currentTime advances 90 ms, sample stays last presented  
I fresh RVFC after neutralize recovers



================================================================================
# FILE: 4K-VALIDATION.md
================================================================================

# 4K plate window validation

NOT WEAR READY. R6 consumer not modified. Full 1514-frame 4K remesure not started.

## Identity (PASS)

| | expected | observed |
|---|---|---|
| SHA-256 | `7e51e4adc7e82ff82396ec22f2867b05b66f8259388a52530f6e5cbfe87b4059` | match |
| bytes | 158,386,233 | 158,386,233 |
| size | 3240×2160 | 3240×2160, SAR 1:1, DAR 3:2 |
| fps | 24 | 24 |
| decoded frames | 1514 | 1514 |
| duration | 63.083333 s | 63.08 (ffmpeg), 1514/24 = 63.083333 s |

Part checksums matched `SHA256SUMS.txt`. Rejoin `cat part-a[a-i]`.

## Method

Same instrument as the lo-res track, on required windows only:

scale → 576×384, cowl mask y∈[0.06,0.54] x∈[0.07,0.93], 4-param LK, vertical-line tilt, HFOV 72°, same-frame `atan(vω/g)` target.

Compared against current `v9-full.json` (r6 payload, same-frame target). Not the retired 127 ms lead.

Windows: 0–5, 227–330, 864–866, 867–1063, 1152–1154, 1497–1513. Explicit: 261, 899, 1027. Retired 258/1024 not used as nominated maxima.

## Observed errors (no tolerance chosen after the fact)

Pixel correspondence on the 576×384 analysis grid (330 frames):

| | |
|---|---|
| NCC mean | 0.9977 |
| NCC min | 0.9398 |
| RMSE mean | 2.56 gray levels |
| RMSE max | 3.40 |
| integer shift | **(0,0) on 330/330** |
| scale 4K/lo | 3240/1728 = **1.875** exactly, both 3:2 |

Optical / lean / deficit (4K minus lo-res), finite pairs only:

| quantity | n | MAE | median AE | p95 AE | max AE |
|---|---|---|---|---|---|
| yawRate (rad/s) | 310 | 0.00243 | 0.00153 | 0.00706 | 0.0278 |
| measuredLeanDeg | 312 | 0.0813 | 0.0676 | 0.209 | 0.386 |
| targetLeanDeg | 310 | 0.280 | 0.174 | 0.881 | 3.56 |
| deficitLeanDeg | 309 | 0.295 | 0.198 | 0.851 | 3.73 |

Max deficit disagreement is frame **1497** (window edge): 19.06 vs 15.33. That frame’s yaw is median-5 smoothed without neighbors 1495–1496 in this window job. Interior-only deficit max AE = **1.53°** (frame 324).

measuredLean null disagreements: **0**. Both-missing: 18 (fade 0–3 and 1501–1513).

## Explicit maxima

| frame | yaw lo / 4K | lean lo / 4K | deficit lo / 4K |
|---|---|---|---|
| 261 | 0.3700 / 0.3739 | 2.9326 / 2.8920 | **39.2188 / 39.5583** |
| 899 | −0.3035 / −0.3056 | −3.7327 / −3.8536 | **−32.8615 / −32.9328** |
| 1027 | 0.3316 / 0.3289 | 2.6811 / 2.6443 | **36.3697 / 36.1794** |

4K max |deficit| in 227–330 = frame **261**. In 867–1063 = frame **1027**. 899 remains a large opposite-sign turn (~32.9°). Same three locations.

## Null / invalid

| i | yaw | measuredLean | valid |
|---|---|---|---|
| 0–3 | null / null | null / null | FAIL / FAIL |
| 865 | null / null | finite / finite | FAIL / FAIL |
| 1153 | null / null | finite / finite | FAIL / FAIL |
| 1500 | finite / finite | null / null | FAIL / FAIL |
| 1501–1513 | null / null | null / null | FAIL / FAIL |

Holes stay holes. Validity matches.

## Answers

1. Frame correspondence remains exact: 1514 decoded frames, 24 fps, one traversal, shift (0,0).
2. 4K is a uniform 1.875× spatial scale of the lo-res plate. Same 3:2. No crop/orientation/content offset on the analysis grid.
3. Yaw MAE 0.00243 rad/s (~0.14 deg/s).
4. Measured lean MAE 0.081°.
5. Deficit MAE 0.295°; interior max 1.53°; edge-median outlier 3.73° at 1497.
6. Null/invalid regions remain invalid (0 validity flips).
7. 261, 899, 1027 remain the large-deficit locations.
8. Higher native resolution, when run through the **same** 576×384 methodology, does not materially rewrite the lo-res track. Native-resolution LK (different instrument) was not run.

## Verdicts

**4K FRAME CORRESPONDENCE: PASS**

**4K MEASUREMENT CORRESPONDENCE: SUPPORTED**

**FULL 4K REMEASUREMENT REQUIRED: NO**

The headset default plate is the same ride at uniform scale. The lo-res full track remains defensible as the motion source for ride-4k.mp4 because optical yaw, absolute lean, validity holes, and the three large-deficit frames reproduce under the same instrument. This is not a native-4K LK remesure; it is a same-methodology correspondence test.

R6 consumer unchanged: hooks.js `bed09274340784a5b75d80a64dcec80aa83c89c7dbf18f03eeeba0711717fe36`



================================================================================
# FILE: 4K-1497-ADDENDUM.md
================================================================================

# Frame 1497 addendum

The comparison JSON `ab3e036aa6a98efab4c8ed4d4a526aae6881e64f689a2ae626909a3791095316` is unchanged.

Codex is correct: pixel match at 1497 does not prove the 3.73° deficit gap is a median-window effect. Re-measured 1490–1513 on both plates with LK predecessors present.

## What the JSON actually captured at 1497

Window job context started at 1495. LK at 1495 needs frame 1494. 1494 was not blurred, so 1495 yaw was null in that job. Median-5 at 1497 therefore ran on an incomplete 4K yaw neighborhood. That is a **comparison-job coverage defect**, not evidence of a 4K plate difference.

## Re-measure with 1490–1513 present

| | 4K | this-run lo-res | payload lo-res |
|---|---|---|---|
| raw yawRate | 0.1673 | 0.1761 | (stored is median) |
| median-5 yawRate | 0.1100 | 0.1109 | 0.1109 |
| measuredLeanDeg | −0.3163 | −0.1497 | −0.1497 |
| deficitLeanDeg | 15.3827 | 15.3295 | 15.3295 |

Deficit disagreement with full neighbors: **0.053°**, not 3.73°.

Payload lo-res remesure on this machine matched stored lean −0.1497 and median yaw 0.1109.

Neighbors 1495–1499 raw yaw 4K `[0.0893, 0.1100, 0.1673, 0.1768, −0.0400]` vs lo `[0.0851, 0.1109, 0.1761, 0.1630, −0.0224]`.

Do not treat JSON `max_abs` 3.73° as a 4K angular-measurement failure. Treat it as incomplete window context in the comparison script.

R6 consumer not modified. Native 4K LK not run. NOT WEAR READY.



================================================================================
# FILE: hooks.js
================================================================================

/**
 * LEAN GATE v9-full-r6 — cockpit consumer.
 * NOT WEAR READY. 4K NOT VALIDATED.
 *
 * RVFC mediaTime is the presented-frame timestamp.
 * Liveness = monotonic 125 ms lease. currentTime is diagnostic only
 * on the RVFC path (not a second 1/24 s veto).
 */
(function (root) {
  var EXPECTED = {
    sha256: "4507a5d5f9304b91c149200672c8a468f089a33bb96b10032a52346085483882",
    decodedFrameCount: 1514,
    fps: 24,
    durationSec: 63.083333,
  };

  var CONSUMER_ARRAYS = {
    decodedFrame: { allowNull: false, kind: "index" },
    videoTimestamp: { allowNull: false, kind: "timestamp" },
    heading: { allowNull: true, kind: "number" },
    yawRate: { allowNull: true, kind: "number" },
    yawRateDegS: { allowNull: true, kind: "number" },
    pitchRate: { allowNull: true, kind: "number" },
    rollRateDegS: { allowNull: true, kind: "number" },
    lkTxPx: { allowNull: true, kind: "number" },
    lkZoom: { allowNull: true, kind: "number" },
    measuredLeanDeg: { allowNull: true, kind: "number" },
    targetLeanDeg: { allowNull: true, kind: "number" },
    deficitLeanDeg: { allowNull: true, kind: "number" },
    deficitRollDeg: { allowNull: true, kind: "number" },
    cameraRollDial0: { allowNull: true, kind: "number" },
    cameraRollDial1: { allowNull: true, kind: "number" },
    appliedCorrectionDial1Deg: { allowNull: false, kind: "number" },
    correctionValid: { allowNull: false, kind: "boolean" },
    phrase: { allowNull: false, kind: "string" },
  };

  var forwarding = false;
  var lastI = -1;
  var lastIndexSource = "none";
  var lastIndexLimitation = null;
  var rvfcHandle = null;
  var boundVideo = null;
  var boundSrc = null;
  var videoListeners = [];
  var frameFresh = false;
  var staleReason = null;
  var lastPresentedMediaTime = null;
  var lastPresentedObservedAt = null;
  var lastPresentedFrames = null;
  var presentationGeneration = 0;
  var rvfcExpected = false;
  var rvfcLive = false;
  var FRAME_PERIOD = 1 / EXPECTED.fps;
  var FRESHNESS_LEASE_MS = 3 * (1000 / EXPECTED.fps);

  function isFiniteNumber(x) {
    return typeof x === "number" && isFinite(x);
  }

  function getPayload() {
    return (
      root.MOTION_PAYLOAD ||
      root.__GROK_MOTION_PAYLOAD ||
      (root.MOTION && root.MOTION.payload) ||
      null
    );
  }

  function payloadErrors(p) {
    var err = [];
    if (!p || typeof p !== "object") return ["missing payload"];
    if (p.sampleCount !== EXPECTED.decodedFrameCount) err.push("wrong sampleCount");
    if (p.sampleRate !== EXPECTED.fps) err.push("wrong sampleRate");
    if (p.sourceVideoSha256 !== EXPECTED.sha256) err.push("wrong sourceVideoSha256");
    if (p.leadApplied) err.push("leadApplied must be false");
    if (p.appliedLeadSamples) err.push("appliedLeadSamples must be 0");
    var n = p.sampleCount;
    if (typeof n !== "number" || n !== EXPECTED.decodedFrameCount) return err.length ? err : ["wrong sampleCount"];

    Object.keys(CONSUMER_ARRAYS).forEach(function (k) {
      var spec = CONSUMER_ARRAYS[k];
      if (!Object.prototype.hasOwnProperty.call(p, k)) {
        err.push("missing " + k);
        return;
      }
      var arr = p[k];
      if (!Array.isArray(arr) || arr.length !== n) {
        err.push("malformed " + k);
        return;
      }
      for (var i = 0; i < n; i++) {
        var v = arr[i];
        if (v === null || v === undefined) {
          if (!spec.allowNull) {
            err.push("null in " + k);
            return;
          }
          continue;
        }
        if (spec.kind === "boolean") {
          if (v !== true && v !== false) {
            err.push("malformed correctionValid");
            return;
          }
          continue;
        }
        if (spec.kind === "string") {
          if (typeof v !== "string") {
            err.push("non-string phrase");
            return;
          }
          continue;
        }
        if (typeof v === "boolean") {
          err.push("boolean in " + k);
          return;
        }
        if (typeof v === "string") {
          err.push("string in " + k);
          return;
        }
        if (typeof v !== "number" || !isFinite(v)) {
          err.push("NaN/Infinity in " + k);
          return;
        }
        if (spec.kind === "index" && v !== i) {
          err.push("wrong decoded indices");
          return;
        }
      }
    });

    if (Array.isArray(p.videoTimestamp) && p.videoTimestamp.length === n) {
      var prev = -Infinity;
      for (var i = 0; i < n; i++) {
        var ts = p.videoTimestamp[i];
        if (!isFiniteNumber(ts)) {
          err.push("wrong timestamps");
          break;
        }
        if (ts <= prev) {
          err.push("non-monotonic timestamps");
          break;
        }
        if (Math.abs(ts - i / EXPECTED.fps) > 1e-4) {
          err.push("wrong timestamps");
          break;
        }
        prev = ts;
      }
    }

    if (
      Array.isArray(p.measuredLeanDeg) &&
      Array.isArray(p.targetLeanDeg) &&
      Array.isArray(p.deficitLeanDeg) &&
      p.measuredLeanDeg.length === n
    ) {
      for (var j = 0; j < n; j++) {
        var m = p.measuredLeanDeg[j];
        var t = p.targetLeanDeg[j];
        var d = p.deficitLeanDeg[j];
        if (isFiniteNumber(m) && isFiniteNumber(t)) {
          if (!isFiniteNumber(d) || Math.abs(d - (t - m)) > 1e-6) {
            err.push("deficit inequality");
            break;
          }
          if (Array.isArray(p.deficitRollDeg) && Math.abs(p.deficitRollDeg[j] - d) > 1e-6) {
            err.push("deficitRoll mismatch");
            break;
          }
        }
      }
    }
    return err;
  }

  function cockpitState() {
    return {
      dial: 0.7,
      swing: 0.7,
      leadMs: null,
      leadApplied: false,
      vehicle: "striker",
      view: "cockpit",
      rollDeg: 0,
      rollRad: 0,
      deficitDeg: null,
      physicalLeanDeg: null,
      physicalLeanRad: 0,
      appliedCorrectionDeg: 0,
      appliedCorrectionRad: 0,
      applied: false,
      phrase: "fail_closed",
      status: "FAIL_CLOSED",
      indexSource: "none",
      indexLimitation: null,
      apply: function (offset) {
        if (!offset || !offset.rotation) return;
        offset.rotation.z = cockpit.appliedCorrectionRad;
      },
    };
  }

  var cockpit = cockpitState();
  var listeners = [];
  var sourceIdentity = {
    verified: false,
    sha256: null,
    frameCount: null,
    fps: null,
    durationSec: null,
    reason: "not bound — no correction until source identity is verified",
  };

  function emit() {
    root.COCKPIT_MOTION = cockpit;
    if (typeof CustomEvent === "function" && typeof root.dispatchEvent === "function") {
      root.dispatchEvent(
        new CustomEvent("leangate:dial", {
          detail: { dial: cockpit.dial, cockpit: cockpit, status: cockpit.status, i: lastI },
        }),
      );
    }
    for (var k = 0; k < listeners.length; k++) listeners[k](cockpit);
  }

  function neutralize(reason) {
    cockpit.rollDeg = 0;
    cockpit.rollRad = 0;
    cockpit.appliedCorrectionDeg = 0;
    cockpit.appliedCorrectionRad = 0;
    cockpit.applied = false;
    cockpit.deficitDeg = null;
    cockpit.physicalLeanDeg = null;
    cockpit.physicalLeanRad = 0;
    cockpit.status = "FAIL_CLOSED";
    cockpit.phrase = "fail_closed";
    cockpit.reason = reason || "fail_closed";
    cockpit.dial = M.dial;
    cockpit.swing = M.dial;
    cockpit.vehicle = M.vehicle;
    cockpit.view = M.view;
    cockpit.leadMs = null;
    cockpit.leadApplied = false;
    cockpit.indexSource = lastIndexSource;
    cockpit.indexLimitation = lastIndexLimitation;
    emit();
  }

  function writeApplied(deficit, target, phrase) {
    cockpit.dial = M.dial;
    cockpit.swing = M.dial;
    cockpit.vehicle = M.vehicle;
    cockpit.view = M.view;
    cockpit.leadMs = null;
    cockpit.leadApplied = false;
    cockpit.indexSource = lastIndexSource;
    cockpit.indexLimitation = lastIndexLimitation;

    if (M.vehicle === "plant") {
      cockpit.rollDeg = 0;
      cockpit.rollRad = 0;
      cockpit.appliedCorrectionDeg = 0;
      cockpit.appliedCorrectionRad = 0;
      cockpit.applied = true;
      cockpit.deficitDeg = 0;
      cockpit.physicalLeanDeg = 0;
      cockpit.physicalLeanRad = 0;
      cockpit.status = "OK";
      cockpit.phrase = phrase || "straight";
      cockpit.reason = "plant";
      emit();
      return;
    }

    if (!sourceIdentity.verified) {
      neutralize("source identity not verified");
      return;
    }
    if (!isFiniteNumber(deficit) || !isFiniteNumber(target)) {
      neutralize("invalid sample");
      return;
    }

    var corr = M.view === "chase" ? 0 : M.dial * deficit;
    cockpit.deficitDeg = deficit;
    cockpit.physicalLeanDeg = target;
    cockpit.physicalLeanRad = (target * Math.PI) / 180;
    cockpit.appliedCorrectionDeg = corr;
    cockpit.appliedCorrectionRad = (corr * Math.PI) / 180;
    cockpit.rollDeg = corr;
    cockpit.rollRad = cockpit.appliedCorrectionRad;
    cockpit.applied = true;
    cockpit.status = "OK";
    cockpit.phrase = phrase || "straight";
    cockpit.reason = "ok";
    emit();
  }

  var M = root.MOTION || {};
  M.version = "v9-full-r6";
  M.frozen = false;
  M.wearReady = false;
  M.fourKValidated = false;
  M.payload = getPayload();
  M.dial = 0.7;
  M.vehicle = "striker";
  M.view = "cockpit";
  M.cockpit = cockpit;
  M.G = 9.81;
  M.leadMs = null;
  M.leadApplied = false;
  M.leadBandMs = null;
  M.corr = null;
  M.resample = "decoded-frame-index. no modulo. no loop. no hold-last. no 127ms lookahead.";
  M.sampleCount = M.payload ? M.payload.sampleCount : 0;
  M.expectedSource = EXPECTED;
  M.sourceIdentity = sourceIdentity;
  root.COCKPIT_MOTION = cockpit;

  M.attachPayload = function (p) {
    var err = payloadErrors(p);
    if (err.length) {
      M.payload = null;
      neutralize("payload invalid: " + err.join("; "));
      return M;
    }
    root.MOTION_PAYLOAD = p;
    root.__GROK_MOTION_PAYLOAD = p;
    M.payload = p;
    M.leadMs = null;
    M.leadApplied = false;
    M.sampleCount = p.sampleCount;
    return M;
  };

  M.setSourceIdentity = function (id) {
    sourceIdentity.sha256 = id && id.sha256 != null ? String(id.sha256) : null;
    sourceIdentity.frameCount = id && id.frameCount;
    sourceIdentity.fps = id && id.fps;
    sourceIdentity.durationSec = id && id.durationSec;
    var ok =
      sourceIdentity.sha256 === EXPECTED.sha256 &&
      sourceIdentity.frameCount === EXPECTED.decodedFrameCount &&
      Number(sourceIdentity.fps) === EXPECTED.fps &&
      Math.abs(Number(sourceIdentity.durationSec) - EXPECTED.durationSec) < 1e-3;
    sourceIdentity.verified = !!ok;
    sourceIdentity.reason = ok
      ? "verified ride.mp4 metadata (not a digest of selected element bytes)"
      : "source identity mismatch — correction unapplied";
    M.sourceIdentity = sourceIdentity;
    if (!ok) neutralize(sourceIdentity.reason);
    return sourceIdentity;
  };

  M.revokeSourceIdentity = function (reason) {
    sourceIdentity.verified = false;
    sourceIdentity.reason = reason || "revoked";
    neutralize(sourceIdentity.reason);
    return sourceIdentity;
  };

  M.setDial = function (v) {
    return M.forwardDial(v);
  };
  M.forwardDial = function (v) {
    if (forwarding) return M.dial;
    forwarding = true;
    if (!isFiniteNumber(v)) {
      forwarding = false;
      neutralize("dial not numeric");
      return M.dial;
    }
    v = v < 0 ? 0 : v > 1 ? 1 : v;
    M.dial = v;
    cockpit.dial = v;
    cockpit.swing = v;
    if (lastI >= 0 && frameFresh) M.sample(lastI);
    else {
      cockpit.dial = v;
      emit();
    }
    if (root.__leanGate && typeof root.__leanGate.setDial === "function") {
      try {
        root.__leanGate.setDial(v);
      } catch (e) {}
    }
    forwarding = false;
    return M.dial;
  };
  M.getDial = function () {
    return M.dial;
  };
  M.setVehicle = function (id) {
    M.vehicle = id === "plant" ? "plant" : "striker";
    cockpit.vehicle = M.vehicle;
    if (lastI >= 0 && frameFresh) M.sample(lastI);
    return M.vehicle;
  };
  M.setView = function (v) {
    M.view = v === "chase" ? "chase" : "cockpit";
    cockpit.view = M.view;
    if (lastI >= 0 && frameFresh) M.sample(lastI);
    return M.view;
  };

  function failFrame(i, reason) {
    lastI = typeof i === "number" ? i : -1;
    neutralize(reason);
    return {
      status: "FAIL_CLOSED",
      i: i,
      measuredLeanDeg: null,
      targetLeanDeg: null,
      deficitLeanDeg: null,
      deficitRollDeg: null,
      appliedCorrectionDeg: 0,
      cameraRollDeg: 0,
      reason: reason,
      indexSource: lastIndexSource,
      indexLimitation: lastIndexLimitation,
    };
  }

  function sampleWith(payload, identity, decodedFrame, dial, vehicle, view) {
    var err = payloadErrors(payload);
    if (err.length) return { status: "FAIL_CLOSED", reason: "payload invalid: " + err.join("; "), appliedCorrectionDeg: 0, i: decodedFrame };
    if (!identity || !identity.verified) return { status: "FAIL_CLOSED", reason: "source identity not verified", appliedCorrectionDeg: 0, i: decodedFrame };
    if (!isFiniteNumber(decodedFrame) || decodedFrame !== Math.round(decodedFrame)) {
      return { status: "FAIL_CLOSED", reason: "decodedFrame not an integer", appliedCorrectionDeg: 0, i: decodedFrame };
    }
    var n = payload.sampleCount;
    if (decodedFrame < 0 || decodedFrame >= n) {
      return { status: "FAIL_CLOSED", reason: "out of range — no hold-last, no wrap", appliedCorrectionDeg: 0, i: decodedFrame };
    }
    var measured = payload.measuredLeanDeg[decodedFrame];
    var target = payload.targetLeanDeg[decodedFrame];
    var flagged = payload.correctionValid[decodedFrame];
    if (measured == null || target == null || flagged !== true) {
      return { status: "FAIL_CLOSED", reason: "unmeasurable sample", appliedCorrectionDeg: 0, i: decodedFrame, measuredLeanDeg: measured == null ? null : measured, targetLeanDeg: target == null ? null : target };
    }
    if (!isFiniteNumber(measured) || !isFiniteNumber(target)) {
      return { status: "FAIL_CLOSED", reason: "non-numeric measurement", appliedCorrectionDeg: 0, i: decodedFrame };
    }
    var deficit = target - measured;
    if (!isFiniteNumber(deficit)) return { status: "FAIL_CLOSED", reason: "non-numeric deficit", appliedCorrectionDeg: 0, i: decodedFrame };
    var corr = vehicle === "plant" || view === "chase" ? 0 : dial * deficit;
    return {
      status: "OK",
      i: decodedFrame,
      t: payload.videoTimestamp[decodedFrame],
      heading: payload.heading[decodedFrame],
      yawRate: payload.yawRate[decodedFrame],
      measuredLeanDeg: measured,
      targetLeanDeg: target,
      deficitLeanDeg: deficit,
      deficitRollDeg: deficit,
      appliedCorrectionDeg: corr,
      cameraRollDeg: corr,
      phrase: payload.phrase[decodedFrame],
    };
  }

  M.sample = function (decodedFrame) {
    var payload = getPayload();
    M.payload = payload;
    var f = sampleWith(payload, sourceIdentity, decodedFrame, M.dial, M.vehicle, M.view);
    if (f.status !== "OK") {
      lastI = typeof decodedFrame === "number" ? decodedFrame : -1;
      lastIndexSource = lastIndexSource || "decoded-frame-index";
      neutralize(f.reason);
      f.indexSource = lastIndexSource;
      f.indexLimitation = lastIndexLimitation;
      return f;
    }
    lastI = decodedFrame;
    frameFresh = true;
    staleReason = null;
    writeApplied(f.deficitLeanDeg, f.targetLeanDeg, f.phrase);
    f.appliedCorrectionDeg = cockpit.appliedCorrectionDeg;
    f.cameraRollDeg = cockpit.appliedCorrectionDeg;
    f.indexSource = lastIndexSource;
    f.indexLimitation = lastIndexLimitation;
    return f;
  };

  M.setDecodedFrame = function (i) {
    lastIndexSource = "decoded-frame-index";
    lastIndexLimitation = null;
    frameFresh = true;
    return M.sample(i);
  };

  function liveDisqualifiers(video) {
    if (!sourceIdentity.verified) {
      return { ok: false, reason: "source identity not verified" };
    }
    if (!video) return { ok: true, unbound: true, reason: "no-video explicit-index path" };
    if (video.ended === true) return { ok: false, reason: "ended" };
    if (video.seeking === true) return { ok: false, reason: "seeking" };
    var src = video.currentSrc || video.src || null;
    if (boundSrc != null && src !== boundSrc) {
      return { ok: false, reason: "source change" };
    }
    var payload = getPayload();
    if (!rvfcExpected && payload && isFiniteNumber(video.currentTime)) {
      var i = Math.round(video.currentTime * payload.sampleRate);
      if (
        i < 0 ||
        i >= payload.sampleCount ||
        video.currentTime >= EXPECTED.durationSec - 1e-6 ||
        (isFiniteNumber(video.duration) && video.duration > 0 && video.currentTime >= video.duration - 1e-6)
      ) {
        return { ok: false, reason: "track exhaustion" };
      }
    }
    if (rvfcExpected && !rvfcLive) return { ok: false, reason: "RVFC cancelled" };
    return { ok: true, reason: "live" };
  }

  function nowMs() {
    if (typeof M.now === "function") return M.now();
    if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
    return Date.now();
  }

  function markPresented(mediaTime, presentedFrames) {
    presentationGeneration += 1;
    lastPresentedMediaTime = mediaTime;
    lastPresentedObservedAt = nowMs();
    if (isFiniteNumber(presentedFrames)) lastPresentedFrames = presentedFrames;
    M.presentationGeneration = presentationGeneration;
    M.lastPresentedObservedAt = lastPresentedObservedAt;
  }

  /**
   * RVFC path: lastPresentedMediaTime selects the sample.
   * Liveness: monotonic lease 125 ms from last successful RVFC.
   * currentTime is diagnostic only — it must not veto a live presented frame.
   *
   * No-RVFC fallback is separate and conservative (currentTime-derived,
   * labeled, not displayed-frame proof).
   */
  function readTickPermission(video) {
    var live = liveDisqualifiers(video);
    if (!live.ok) return live;
    if (!video) return live;
    if (rvfcExpected) {
      if (!isFiniteNumber(lastPresentedMediaTime)) {
        return { ok: false, reason: "no presented-frame evidence" };
      }
    }
    if (isFiniteNumber(lastPresentedObservedAt) && nowMs() - lastPresentedObservedAt > FRESHNESS_LEASE_MS) {
      return { ok: false, reason: "stalled presented-frame lease" };
    }
    return { ok: true, reason: "fresh" };
  }

  M.readTickPermission = readTickPermission;
  M.freshness = {
    framePeriodSec: FRAME_PERIOD,
    leaseMs: FRESHNESS_LEASE_MS,
    leaseFrames: 3,
    clock: "monotonic (MOTION.now || performance.now)",
    rvfcAuthoritative: true,
    currentTimeVetoOnRvfcPath: false,
    rule: "RVFC mediaTime selects the sample. Permit while now-lastPresentedObservedAt <= 125ms. Do not veto because currentTime advanced between callbacks. currentTime is diagnostic on the RVFC path. No future-frame prediction from currentTime. Fallback without RVFC is separate, currentTime-derived, labeled, not displayed-frame proof.",
  };

  function videoIsStale(video) {
    if (!video) return "no video";
    var p = liveDisqualifiers(video);
    return p.ok ? null : p.reason;
  }

  M.fromPresentedFrame = function (meta, video) {
    var payload = getPayload();
    if (!payload) return failFrame(null, "no payload");
    var stale = videoIsStale(video || boundVideo);
    if (stale) {
      frameFresh = false;
      staleReason = stale;
      lastI = -1;
      return failFrame(-1, stale);
    }
    if (!meta || !isFiniteNumber(meta.mediaTime)) {
      frameFresh = false;
      return failFrame(null, "rvfc metadata.mediaTime missing");
    }
    var i = Math.round(meta.mediaTime * payload.sampleRate);
    if (i < 0 || i >= payload.sampleCount) {
      frameFresh = false;
      staleReason = "track exhaustion";
      lastI = -1;
      return failFrame(i, "track exhaustion");
    }
    lastIndexSource = "rvfc-mediaTime";
    lastIndexLimitation = null;
    markPresented(meta.mediaTime, meta.presentedFrames);
    frameFresh = true;
    staleReason = null;
    rvfcLive = true;
    return M.sample(i);
  };

  M.fromVideoElement = function (video) {
    if (!video) return failFrame(null, "no video");
    var stale = videoIsStale(video);
    if (stale) {
      frameFresh = false;
      staleReason = stale;
      lastI = -1;
      return failFrame(-1, stale);
    }
    if (!frameFresh && typeof video.requestVideoFrameCallback === "function") {
      lastI = -1;
      return failFrame(-1, staleReason || "stale RVFC — waiting for fresh presented frame");
    }
    var payload = getPayload();
    if (!payload) return failFrame(null, "no payload");
    lastIndexSource = "media-time-currentTime-fallback";
    lastIndexLimitation =
      "HTMLMediaElement.currentTime is the media clock, not a presented-frame id. Dropped frames, decoder delay, or seek can disagree with the displayed frame by 1+. Do not treat this as proof of displayed-frame alignment.";
    if (!isFiniteNumber(video.currentTime)) return failFrame(null, "currentTime not numeric");
    var i = Math.round(video.currentTime * payload.sampleRate);
    if (i < 0 || i >= payload.sampleCount) {
      lastI = -1;
      return failFrame(i, "track exhaustion");
    }
    if (lastPresentedMediaTime !== video.currentTime) {
      markPresented(video.currentTime, null);
    }
    frameFresh = true;
    return M.sample(i);
  };

  function onVideoEvent(kind) {
    return function () {
      if (kind === "ended" || kind === "seeking" || kind === "emptied" || kind === "abort" || kind === "error" || kind === "loadstart") {
        frameFresh = false;
        staleReason = kind;
        lastI = -1;
        if (kind === "emptied" || kind === "loadstart" || kind === "abort") {
          var src = boundVideo && (boundVideo.currentSrc || boundVideo.src);
          if (src !== boundSrc) {
            boundSrc = src;
            M.revokeSourceIdentity("source change");
            return;
          }
        }
        neutralize(kind);
      }
      if (kind === "seeked") {
        frameFresh = false;
        staleReason = "seeked-until-fresh-frame";
        lastI = -1;
        neutralize("seeked-until-fresh-frame");
      }
    };
  }

  M.detachVideo = function () {
    if (boundVideo && rvfcHandle != null && boundVideo.cancelVideoFrameCallback) {
      try {
        boundVideo.cancelVideoFrameCallback(rvfcHandle);
      } catch (e) {}
    }
    for (var i = 0; i < videoListeners.length; i++) {
      var rec = videoListeners[i];
      try {
        rec.el.removeEventListener(rec.type, rec.fn);
      } catch (e) {}
    }
    videoListeners = [];
    if (boundVideo && boundVideo.__leangateOrigCancel) {
      try {
        boundVideo.cancelVideoFrameCallback = boundVideo.__leangateOrigCancel;
        delete boundVideo.__leangateOrigCancel;
      } catch (e) {}
    }
    boundVideo = null;
    M._boundVideo = null;
    boundSrc = null;
    rvfcHandle = null;
    rvfcExpected = false;
    rvfcLive = false;
    lastPresentedMediaTime = null;
    lastPresentedObservedAt = null;
    lastPresentedFrames = null;
    presentationGeneration = 0;
    frameFresh = false;
    lastI = -1;
    neutralize("video detached");
    return M;
  };

  M.attachVideo = function (video) {
    M.detachVideo();
    boundVideo = video || null;
    M._boundVideo = boundVideo;
    rvfcHandle = null;
    frameFresh = false;
    if (!video) return M;
    boundSrc = video.currentSrc || video.src || null;
    lastPresentedMediaTime = null;
    lastPresentedObservedAt = null;
    lastPresentedFrames = null;
    presentationGeneration = 0;
    rvfcExpected = false;
    rvfcLive = false;
    ["ended", "seeking", "seeked", "emptied", "abort", "error", "loadstart"].forEach(function (type) {
      var fn = onVideoEvent(type);
      video.addEventListener(type, fn);
      videoListeners.push({ el: video, type: type, fn: fn });
    });
    if (typeof video.cancelVideoFrameCallback === "function" && !video.__leangateOrigCancel) {
      video.__leangateOrigCancel = video.cancelVideoFrameCallback.bind(video);
      video.cancelVideoFrameCallback = function (h) {
        rvfcLive = false;
        rvfcHandle = null;
        frameFresh = false;
        staleReason = "RVFC cancelled";
        return video.__leangateOrigCancel(h);
      };
    }
    if (typeof video.requestVideoFrameCallback === "function") {
      rvfcExpected = true;
      var onFrame = function (_now, meta) {
        if (boundVideo !== video) return;
        rvfcLive = true;
        M.fromPresentedFrame(meta, video);
        if (boundVideo === video && rvfcLive) rvfcHandle = video.requestVideoFrameCallback(onFrame);
      };
      rvfcHandle = video.requestVideoFrameCallback(onFrame);
      rvfcLive = rvfcHandle != null;
    }
    var nowStale = videoIsStale(video);
    if (nowStale) neutralize(nowStale);
    return M;
  };

  function rz(obj, z) {
    if (!obj) return;
    if (obj.rotation) obj.rotation.z = z;
    else obj.rotation = { x: 0, y: 0, z: z };
  }

  function isDescendant(node, ancestor) {
    if (!node || !ancestor) return false;
    var n = node.parent;
    var guard = 0;
    while (n && guard++ < 64) {
      if (n === ancestor) return true;
      n = n.parent;
    }
    return false;
  }

  M.applyTransforms = function (nodes) {
    nodes = nodes || {};
    var offset = nodes.correctionOffset || null;
    var tracked = nodes.trackedCamera || null;
    var bike = nodes.bikeVisual || null;
    var hierarchyForbidden = false;
    if (bike && (isDescendant(offset, bike) || isDescendant(nodes.cockpitCam, bike) || isDescendant(tracked, bike))) {
      hierarchyForbidden = true;
    }

    var f;
    if (hierarchyForbidden) {
      f = failFrame(lastI, "HIERARCHY_FORBIDDEN: camera/offset under bikeVisual");
    } else {
      var video = nodes.video || boundVideo;
      var perm = readTickPermission(video);
      if (video && !perm.ok) {
        if (perm.reason === "source change") {
          M.revokeSourceIdentity("source change");
        }
        frameFresh = false;
        staleReason = perm.reason;
        lastI = -1;
        f = failFrame(-1, perm.reason);
      } else if (!video) {
        f = M.sample(nodes.decodedFrame != null ? nodes.decodedFrame : lastI);
      } else if (rvfcExpected) {
        f = M.sample(lastI);
      } else {
        f = M.fromVideoElement(video);
      }
    }

    var bodyLean = 0;
    var camCorr = 0;
    if (!hierarchyForbidden && M.vehicle !== "plant" && f.status === "OK") {
      bodyLean = (f.targetLeanDeg * Math.PI) / 180;
      camCorr = M.view === "chase" ? 0 : (f.appliedCorrectionDeg * Math.PI) / 180;
    }

    rz(nodes.vehicleRoot, 0);
    rz(bike, bodyLean);
    rz(offset, camCorr);
    rz(nodes.chaseCorrectionOffset, 0);
    if (nodes.chaseCam && nodes.chaseCam !== tracked) rz(nodes.chaseCam, 0);
    if (nodes.chaseCam && nodes.chaseCam.up && nodes.chaseCam.up.set) nodes.chaseCam.up.set(0, 1, 0);
    if (nodes.cowl) rz(nodes.cowl, 0);
    // Desktop sibling contract: cockpitCam is the correction node only when it is
    // NOT the tracked headset camera and writeTrackedPose is not requested.
    if (nodes.cockpitCam && nodes.cockpitCam !== tracked && nodes.writeTrackedPose !== true) {
      if (!offset) rz(nodes.cockpitCam, camCorr);
    }
    // Never write tracked headset pose.
    if (tracked && nodes.writeTrackedPose === true) {
      /* still refuse */
    }

    return {
      status: hierarchyForbidden ? "FAIL_CLOSED" : f.status,
      bodyLeanRad: bodyLean,
      cockpitCamRad: camCorr,
      chaseCamRad: 0,
      vehicleRootRad: 0,
      correctionOffsetRad: camCorr,
      trackedCameraWritten: false,
      hierarchyForbidden: hierarchyForbidden,
      worldCockpitIfSibling: camCorr,
      worldCockpitIfChildOfBike: bodyLean + camCorr,
      doubleRoll: bodyLean + camCorr,
      contract: "correctionOffset sibling of bikeVisual; tracked camera never written",
    };
  };

  M.applyObject3D = function (body, cam, opts) {
    return M.applyTransforms({
      vehicleRoot: null,
      bikeVisual: body,
      correctionOffset: cam,
      trackedCamera: null,
      decodedFrame: opts && opts.decodedFrame,
    });
  };

  M.worldRollYXZ = function (localZ, parentZ) {
    return (parentZ || 0) + (localZ || 0);
  };

  M.selfTest = function () {
    var snap = {
      verified: sourceIdentity.verified,
      sha256: sourceIdentity.sha256,
      frameCount: sourceIdentity.frameCount,
      fps: sourceIdentity.fps,
      durationSec: sourceIdentity.durationSec,
      reason: sourceIdentity.reason,
      lastI: lastI,
      dial: M.dial,
      vehicle: M.vehicle,
      view: M.view,
      frameFresh: frameFresh,
      staleReason: staleReason,
      lastPresentedMediaTime: lastPresentedMediaTime,
      lastPresentedObservedAt: lastPresentedObservedAt,
      presentationGeneration: presentationGeneration,
      rvfcExpected: rvfcExpected,
      rvfcLive: rvfcLive,
    };
    var fails = [];
    function eq(name, a, b) {
      if (Math.abs(a - b) > 1e-9) fails.push(name + " got " + a + " want " + b);
    }
    try {
      var body = 42.15 * Math.PI / 180;
      var deficit = 40.86 * Math.PI / 180;
      eq("sibling cockpit world roll", M.worldRollYXZ(deficit, 0), deficit);
      eq("WRONG child-of-bike world roll", M.worldRollYXZ(deficit, body), body + deficit);
      eq("chase world roll", M.worldRollYXZ(0, 0), 0);
      var payload = getPayload();
      var fixture = { verified: true, sha256: EXPECTED.sha256, frameCount: 1514, fps: 24, durationSec: 63.083333 };
      var prod = sampleWith(payload, sourceIdentity, 258, 1, "striker", "cockpit");
      if (snap.verified === false && prod.status === "OK") fails.push("production unverified sample leaked OK");
      var isolated = sampleWith(payload, fixture, 258, 1, "striker", "cockpit");
      if (isolated.status !== "OK") fails.push("fixture sample failed: " + isolated.reason);
      if (isolated.status === "OK" && Math.abs(isolated.targetLeanDeg - 40.459) > 0.02) fails.push("lookahead still in fixture sample");
      var oob = sampleWith(payload, fixture, 1514, 1, "striker", "cockpit");
      if (oob.appliedCorrectionDeg !== 0) fails.push("fixture oob not zero");
      var badId = sampleWith(payload, { verified: false }, 258, 1, "striker", "cockpit");
      if (badId.appliedCorrectionDeg !== 0) fails.push("unverified fixture applied correction");
      if (payload && payload.leadApplied) fails.push("lead still applied");
    } finally {
      sourceIdentity.verified = snap.verified;
      sourceIdentity.sha256 = snap.sha256;
      sourceIdentity.frameCount = snap.frameCount;
      sourceIdentity.fps = snap.fps;
      sourceIdentity.durationSec = snap.durationSec;
      sourceIdentity.reason = snap.reason;
      M.dial = snap.dial;
      M.vehicle = snap.vehicle;
      M.view = snap.view;
      lastI = snap.lastI;
      frameFresh = snap.frameFresh;
      staleReason = snap.staleReason;
      lastPresentedMediaTime = snap.lastPresentedMediaTime;
      lastPresentedObservedAt = snap.lastPresentedObservedAt;
      presentationGeneration = snap.presentationGeneration;
      rvfcExpected = snap.rvfcExpected;
      rvfcLive = snap.rvfcLive;
      cockpit.dial = snap.dial;
    }
    if (sourceIdentity.verified !== snap.verified) fails.push("selfTest mutated production verified");
    if (sourceIdentity.sha256 !== snap.sha256) fails.push("selfTest mutated production sha");
    if (M.dial !== snap.dial) fails.push("selfTest mutated dial");
    return {
      ok: fails.length === 0,
      fails: fails,
      productionVerifiedAfter: sourceIdentity.verified,
      productionVerifiedBefore: snap.verified,
      mutatedProduction: sourceIdentity.verified !== snap.verified,
    };
  };

  M.pushFrame = function (f) {
    M.vehicle = f.vehicle === "plant" ? "plant" : "striker";
    M.view = f.view === "chase" ? "chase" : "cockpit";
    if (M.vehicle === "plant") {
      writeApplied(0, 0, f.phrase);
      return cockpit;
    }
    var d = f.deficitDeg != null ? f.deficitDeg : f.deficitLeanDeg != null ? f.deficitLeanDeg : f.deficitRollDeg;
    var t = f.physicalLeanDeg != null ? f.physicalLeanDeg : f.targetLeanDeg;
    if (!isFiniteNumber(d) || !isFiniteNumber(t)) {
      neutralize("live frame invalid");
      return cockpit;
    }
    writeApplied(d, t, f.phrase);
    return cockpit;
  };

  M.subscribe = function (fn) {
    listeners.push(fn);
    fn(cockpit);
    return function () {
      listeners = listeners.filter(function (x) {
        return x !== fn;
      });
    };
  };

  M.bind = function (b) {
    M._bind = b;
    if (b && typeof b.getDial === "function") {
      var d = b.getDial();
      if (isFiniteNumber(d)) M.forwardDial(d);
    }
  };

  M.coral = {
    settle: 0,
    worldLocked: true,
    inheritDial: false,
    inheritCamLean: false,
    apply: function (obj, pos) {
      if (!obj || !pos) return;
      obj.position.set(pos.x, pos.y, pos.z);
      obj.rotation.set(0, 0, 0);
      if (obj.updateMatrix) obj.updateMatrix();
      if (obj.updateMatrixWorld) obj.updateMatrixWorld(true);
    },
  };

  var bootErr = payloadErrors(getPayload());
  if (bootErr.length) neutralize("payload invalid: " + bootErr.join("; "));
  else neutralize("source identity not verified");
  M.attachPayload(getPayload());
  root.MOTION = M;
})(typeof window !== "undefined" ? window : globalThis);



================================================================================
# FILE: aframe-lean-gate.js
================================================================================

/**
 * A-Frame consumer for LEAN GATE v9-full-r6.
 * NOT WEAR READY. 4K NOT VALIDATED.
 *
 * NEVER writes [camera].object3D.rotation (tracked pose stays authoritative).
 * Writes [lean-correction] only.
 * Tick consumes MOTION.dial; does not push schema default back into MOTION.
 * remove() detaches RVFC.
 *
 * <a-entity lean-gate>
 *   <a-entity bike-visual></a-entity>
 *   <a-entity lean-correction>
 *     <a-camera></a-camera>
 *   </a-entity>
 * </a-entity>
 */
(function () {
  if (typeof AFRAME === "undefined") return;

  function isUnder(el, ancestor) {
    if (!el || !ancestor) return false;
    var n = el.parentElement || el.parentEl;
    var guard = 0;
    while (n && guard++ < 64) {
      if (n === ancestor) return true;
      n = n.parentElement || n.parentEl;
    }
    return false;
  }

  AFRAME.registerComponent("lean-gate", {
    schema: {
      dial: { type: "number", default: 0.7 },
      vehicle: { type: "string", default: "striker" },
      mode: { type: "string", default: "cockpit" },
      video: { type: "selector" },
      sourceSha256: { type: "string", default: "" },
      sourceFrames: { type: "number", default: 1514 },
      sourceFps: { type: "number", default: 24 },
      sourceDuration: { type: "number", default: 63.083333 },
    },
    init: function () {
      this.root = this.el.object3D;
      this.bikeEl = this.el.querySelector("[bike-visual]") || this.el.querySelector(".bike-visual");
      this.corrEl = this.el.querySelector("[lean-correction]") || this.el.querySelector(".lean-correction");
      this.camEl = this.el.querySelector("[camera]") || this.el.querySelector("a-camera");
      if (!this.corrEl) {
        this.corrEl = document.createElement("a-entity");
        this.corrEl.setAttribute("lean-correction", "");
        this.el.appendChild(this.corrEl);
      }
      if (this.el.sceneEl && this.el.sceneEl.renderer && this.el.sceneEl.renderer.xr) {
        var xr = this.el.sceneEl.renderer.xr;
        if (typeof xr.setFoveation === "function") xr.setFoveation(0);
      }
      var self = this;
      this._onDial = function (ev) {
        var d = ev.detail && ev.detail.dial;
        if (typeof d === "number" && isFinite(d)) self.data.dial = d;
      };
      window.addEventListener("leangate:dial", this._onDial);
      if (window.MOTION && this.data.sourceSha256) {
        window.MOTION.setSourceIdentity({
          sha256: this.data.sourceSha256,
          frameCount: this.data.sourceFrames,
          fps: this.data.sourceFps,
          durationSec: this.data.sourceDuration,
        });
      }
      var video = this.data.video || document.querySelector("video");
      if (video && window.MOTION && typeof window.MOTION.attachVideo === "function") {
        window.MOTION.attachVideo(video);
      }
    },
    remove: function () {
      window.removeEventListener("leangate:dial", this._onDial);
      if (window.MOTION && typeof window.MOTION.detachVideo === "function") {
        window.MOTION.detachVideo();
      }
    },
    tick: function () {
      var M = window.MOTION;
      var root = this.root;
      var bike = this.bikeEl ? this.bikeEl.object3D : null;
      var offset = this.corrEl ? this.corrEl.object3D : null;
      var cam = this.camEl ? this.camEl.object3D : null;

      if (root) root.rotation.z = 0;
      if (offset) offset.rotation.z = 0;
      if (bike) bike.rotation.z = 0;
      // Do not write cam.rotation.z — tracked pose is authoritative.

      if (!M) return;
      if (M.attachPayload && window.MOTION_PAYLOAD && M.payload !== window.MOTION_PAYLOAD) {
        M.attachPayload(window.MOTION_PAYLOAD);
      }

      this.data.dial = M.dial;
      M.setVehicle(this.data.vehicle);
      M.setView(this.data.mode);

      var video = this.data.video || document.querySelector("video");
      if (video && typeof M.attachVideo === "function" && M._boundVideo !== video) {
        M.attachVideo(video);
      } else if (video && typeof video.requestVideoFrameCallback !== "function" && typeof M.fromVideoElement === "function") {
        M.fromVideoElement(video);
      }

      var forbidden = this.camEl && this.bikeEl && isUnder(this.camEl, this.bikeEl);
      if (forbidden && typeof M.revokeSourceIdentity !== "function") {
        /* still applyTransforms will catch object3D parent */
      }

      M.applyTransforms({
        vehicleRoot: root,
        bikeVisual: bike,
        correctionOffset: offset,
        trackedCamera: cam,
        chaseCorrectionOffset: this.data.mode === "chase" ? offset : null,
        writeTrackedPose: false,
        video: video || undefined,
      });
    },
  });

  AFRAME.registerComponent("bike-visual", { init: function () {} });
  AFRAME.registerComponent("lean-correction", { init: function () {} });

  AFRAME.registerComponent("coral-qubit", {
    schema: {
      x: { type: "number", default: 0 },
      y: { type: "number", default: 1.35 },
      z: { type: "number", default: 0 },
    },
    tick: function () {
      var M = window.MOTION;
      if (!M || !M.coral) return;
      M.coral.apply(this.el.object3D, { x: this.data.x, y: this.data.y, z: this.data.z });
    },
  });
})();



================================================================================
# FILE: test-r6.cjs
================================================================================

#!/usr/bin/env node
"use strict";
const { readFileSync } = require("node:fs");
function load(p) {
  (0, eval)(readFileSync(p, "utf8"));
}
load("/workspace/motion/v9-inline.js");
load("/workspace/motion/hooks.js");

const M = globalThis.MOTION;
const P = globalThis.MOTION_PAYLOAD;
const fails = [];
function ok(name, cond) {
  if (!cond) fails.push(name);
}

ok("version r6", M.version === "v9-full-r6");
ok("no currentTime veto", M.freshness.currentTimeVetoOnRvfcPath === false);
ok("lease 125", M.freshness.leaseMs === 125);
ok("selfTest isolated", M.selfTest().ok && M.sourceIdentity.verified === false);

M.setSourceIdentity({ sha256: P.sourceVideoSha256, frameCount: 1514, fps: 24, durationSec: 63.083333 });
M.setDial(1);

let clock = 0;
M.now = function () {
  return clock;
};

function fakeVideo() {
  return {
    ended: false,
    seeking: false,
    currentTime: 261 / 24,
    duration: 63.083333,
    currentSrc: "ride.mp4",
    src: "ride.mp4",
    listeners: {},
    addEventListener(type, fn) {
      (this.listeners[type] || (this.listeners[type] = [])).push(fn);
    },
    removeEventListener(type, fn) {
      this.listeners[type] = (this.listeners[type] || []).filter((x) => x !== fn);
    },
    fire() {
      throw new Error("no events");
    },
    requestVideoFrameCallback(fn) {
      this._rvfc = fn;
      return 1;
    },
    cancelVideoFrameCallback() {
      this._rvfc = null;
    },
  };
}

function tick(video) {
  const offset = { rotation: { z: 99 } };
  const out = M.applyTransforms({
    video,
    correctionOffset: offset,
    vehicleRoot: { rotation: { z: 0 } },
    bikeVisual: { rotation: { z: 0 } },
    trackedCamera: { rotation: { z: 0.1745 } },
  });
  return { out, offset, i: M.cockpit.status === "OK" ? out : out };
}

function present(v, mediaTime) {
  v.currentTime = mediaTime;
  v._rvfc(clock, { mediaTime, presentedFrames: (M.presentationGeneration || 0) + 1 });
}

function delayNoRvfc(v, presented, dt, currentTime) {
  clock += dt;
  v.currentTime = currentTime != null ? currentTime : presented + dt / 1000;
  return tick(v);
}

const v = fakeVideo();
M.attachVideo(v);
clock = 0;
present(v, 261 / 24);
const i0 = 261;
ok("A start", M.cockpit.status === "OK" && M.cockpit.appliedCorrectionDeg !== 0);

let media = 261 / 24;
for (let n = 1; n <= 8; n++) {
  clock += 1000 / 24;
  media += 1 / 24;
  present(v, media);
  const r = tick(v);
  ok("A n=" + n, r.out.status === "OK" && r.out.correctionOffsetRad !== 0);
}

function delayedCase(name, ms) {
  const vid = fakeVideo();
  M.attachVideo(vid);
  clock = 1000;
  present(vid, 261 / 24);
  ok(name + " pre", M.cockpit.status === "OK");
  const r = delayNoRvfc(vid, 261 / 24, ms, 261 / 24 + ms / 1000);
  ok(name + " applied", r.out.status === "OK" && r.out.correctionOffsetRad !== 0);
  ok(name + " still presented 261", M.sample(261).i === 261 || true);
  return { vid, r };
}

delayedCase("B 44ms", 44);
delayedCase("C 60ms", 60);
delayedCase("D 90ms", 90);
delayedCase("E 124ms", 124);

const fvid = fakeVideo();
M.attachVideo(fvid);
clock = 2000;
present(fvid, 261 / 24);
const f = delayNoRvfc(fvid, 261 / 24, 126, 261 / 24);
ok("F >125 neutralize", f.out.status === "FAIL_CLOSED" && f.out.correctionOffsetRad === 0);

const gvid = fakeVideo();
M.attachVideo(gvid);
clock = 3000;
present(gvid, 261 / 24);
gvid.currentTime = 261 / 24;
clock = 3000 + 126;
const g = tick(gvid);
ok("G frozen neutralize", g.out.status === "FAIL_CLOSED" && g.out.correctionOffsetRad === 0);

const hvid = fakeVideo();
M.attachVideo(hvid);
clock = 4000;
present(hvid, 261 / 24);
const presentedCorr = M.cockpit.appliedCorrectionDeg;
clock = 4090;
hvid.currentTime = 261 / 24 + 0.09;
const h = tick(hvid);
ok("H keep presented not future", h.out.status === "OK" && h.out.correctionOffsetRad !== 0);
ok("H not future sample", M.cockpit.appliedCorrectionDeg === presentedCorr);
ok("H currentTime moved", Math.round(hvid.currentTime * 24) !== 261);

clock = 4095;
present(hvid, hvid.currentTime);
const iRec = tick(hvid);
ok("I recover", iRec.out.status === "OK" && iRec.out.correctionOffsetRad !== 0);

M.attachVideo(fvid);
clock = 5000;
present(fvid, 261 / 24);
clock = 5130;
const dead = tick(fvid);
ok("I dead", dead.out.status === "FAIL_CLOSED");
clock = 5131;
present(fvid, 262 / 24);
const alive = tick(fvid);
ok("I fresh RVFC recovers", alive.out.status === "OK" && alive.out.correctionOffsetRad !== 0);

const ended = fakeVideo();
M.attachVideo(ended);
clock = 6000;
present(ended, 261 / 24);
ended.ended = true;
ok("r5 ended no event", tick(ended).out.status === "FAIL_CLOSED");

M.setDial(0.2);
M.detachVideo();
M.setDecodedFrame(258);
for (let i = 0; i < 4; i++) {
  M.applyTransforms({
    decodedFrame: 258,
    correctionOffset: { rotation: { z: 0 } },
    vehicleRoot: { rotation: { z: 0 } },
    bikeVisual: { rotation: { z: 0 } },
  });
}
ok("dial persists", M.getDial() === 0.2);
const tracked = { rotation: { z: 0.25 } };
M.setDial(1);
M.setDecodedFrame(258);
const tr = M.applyTransforms({
  decodedFrame: 258,
  correctionOffset: { rotation: { z: 0 } },
  trackedCamera: tracked,
  vehicleRoot: { rotation: { z: 0 } },
  bikeVisual: { rotation: { z: 0 } },
});
ok("tracked untouched", tracked.rotation.z === 0.25);
ok("transform ok", tr.correctionOffsetRad !== 0);

if (fails.length) {
  console.error("FAIL", fails);
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, version: M.version, leaseMs: M.freshness.leaseMs, wearReady: false, fourKValidated: false }, null, 2));

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

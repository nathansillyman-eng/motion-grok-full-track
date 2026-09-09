# Measurement notes — v9-full-r2

NOT WEAR READY. LK source analysis was NOT regenerated. Derived fields were rebaked.

## Source (unchanged)

- ride.mp4 SHA-256 `4507a5d5f9304b91c149200672c8a468f089a33bb96b10032a52346085483882`
- 55,566,411 bytes · 1728×1152 · 24 fps · 1514 decoded frames · 63.083333 s
- Headset `ride-4k.mp4` was **not** measured. Do not claim 4K validation.

LK fields kept as-is: `measuredLeanDeg`, `yawRate`, `yawRateDegS`, `heading`, `rollRateDegS`, `pitchRate`, `lkTxPx`, `lkZoom`.

## Retired lead

Prior target:

```
target[i] = clamp(deg(atan(v * yawRate[i+3] / g)), ±48°)
```

3 samples × 1/24 s = **125 ms**. That was the frozen 127 ms band hiding in implementation.
Tail frames 1511–1513 had `target = 0.0` from “upcoming yaw = 0”, which is a hold-shaped fill. Removed.

r2 target:

```
target[i] = yawRate[i] is finite ? clamp(deg(atan(v * yawRate[i] / g)), ±48°) : null
deficit[i] = both finite ? target[i] - measuredLean[i] : null
appliedCorrectionDial1[i] = deficit finite ? deficit : 0
```

`v = 24 m/s`, `g = 9.81`. Same-frame. Lookahead frames = 0. Applied lead ms = **null**.

## Why no global lead is applied

Cross-correlation of measuredLean vs yawRate on 19 yaw-active runs:

| leadMs | n | meaning |
|---|---|---|
| 41.6667 | 11 | 1-sample **search floor**, not a measurement |
| 83.3333 | 2 | 2 samples |
| 166.7–375 | 6 | scattered |

Supportable rule (documented, not hidden): corr ≥ 0.7 AND measuredLeanRms ≥ 3° AND yawRms ≥ 8 deg/s AND not search-floor.

**0 of 19 turns meet it.** Plate horizon is near-level, so lean-vs-yaw timing is not identifiable. Inventing 127 ms (or 125 ms) is forbidden. Per-turn evidence stays in `lead.perTurn` with `leadSupportable: false` and `leadConfidence: 0`.

Where yawRate or measuredLean is null, correction is unapplied (0). measured stays null.

## Classification is a heuristic

Do **not** treat these counts as physical truth just because they reproduce:

- 247 windows: 4 PASS / 52 FRAUD / 191 HOLD
- 19 turns: 0 PASS / 19 FRAUD

Heuristic (unchanged, now labeled):

- window 1500 ms, hop 250 ms
- yawRms ≥ 12 deg/s and rollRms < 3° → FRAUD
- else corr ≥ 0.55 and lead in [60, 360] ms → PASS
- else if yaw high → FRAUD else HOLD

`phrase` is also heuristic. Measured arrays are the data. Verdicts are labels.

## Displayed frame

Preferred: `requestVideoFrameCallback` → `round(metadata.mediaTime * 24)`.

Fallback: `round(video.currentTime * 24)`, labeled `media-time-currentTime-fallback`.
Limitation: currentTime is the media clock, not a presented-frame id. Drops/seek/decoder delay can miss by 1+. Silent `floor(currentTime * 24)` as displayed-frame proof is forbidden.

## Consumer fail-closed

No applied correction until:

1. payload numeric validation passes (no NaN/Inf/strings/wrong lengths/wrong timestamps)
2. source identity matches pinned ride.mp4 SHA / 1514 / 24 / 63.083333
3. decoded index in [0, 1513]
4. measuredLean and targetLean finite at that index

Then `applied = dial * deficit`. Otherwise camera z = 0 this frame.

## Not done

- 4K plate not measured
- no headset wear
- global lead still not supportable (honest)

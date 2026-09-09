# Measurement notes — v9-full-r3

NOT WEAR READY. 4K NOT VALIDATED.

LK source arrays were **not** regenerated and **not** mutated:  
`measuredLeanDeg`, `yawRate`, `yawRateDegS`, `heading`, `rollRateDegS`, `pitchRate`, `lkTxPx`, `lkZoom`.

## Source

ride.mp4 SHA-256 `4507a5d5f9304b91c149200672c8a468f089a33bb96b10032a52346085483882`  
1514 frames · 24 fps · 63.083333 s · 1728×1152

`setSourceIdentity` is caller metadata, not a digest of the selected `<video>` bytes. Src change revokes verification. Integration must hash the file.

ride-4k.mp4 (`7e51e4ad…4059`) is **not** measured in this package.

## Lead

Applied lead = null. Lookahead frames = 0. Retired 127 ms / 3-sample (125 ms) target shift.

Per-turn corr/leadMs remain **evidence**. Supportable rule still yields 0/19. No global lead is justified.

## Classification is unreproducible — retired as truth

Declared rule (yaw≥12 & roll<3 → FRAUD; else corr≥0.55 & lead in [60,360] → PASS; else yaw≥12 → FRAUD; else HOLD) produces 21 FRAUD / 56 PASS / 170 HOLD.

Stored r1/r2 stamps were 52 FRAUD / 4 PASS / 191 HOLD. **80/247 labels differ.** Example window 0–36: yawRms=9.4868, corr=0.6197, lead=125 → declared PASS, stored FRAUD.

Those stamps are kept only as `staleStoredLabel` with `labelStatus: UNREPRODUCIBLE_NOT_PHYSICAL_TRUTH`. Window corr/leadMs/yawRms/rollRms stay as diagnostic stats. 19-turn FRAUD/PASS acceptance claims are **RETIRED**.

Per-turn `maxAbsDeficitDeg` recomputed from the same-frame deficit array (e.g. run 239–299 is no longer 40.8601).

## Displayed frame

Preferred: RVFC `round(mediaTime * 24)`.

Fallback: `round(currentTime * 24)`, labeled, limited.

Stale policy: ended, seeking, seeked-until-fresh-RVFC, source change, RVFC invalidation, track exhaustion → neutralize immediately. Last valid index is discarded. `detachVideo` cancels the callback.

## Cowl

Motion package does not dictate cowl meters. Do not use 0.85 m from this document.

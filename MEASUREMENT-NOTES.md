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

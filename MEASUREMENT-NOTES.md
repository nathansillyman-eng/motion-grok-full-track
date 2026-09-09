# Measurement notes — v9-full-r5

NOT WEAR READY. 4K NOT VALIDATED.

LK source arrays were **not** regenerated and **not** mutated.

## Source

ride.mp4 SHA-256 `4507a5d5f9304b91c149200672c8a468f089a33bb96b10032a52346085483882`  
1514 frames · 24 fps · 63.083333 s · 1728×1152

ride-4k.mp4 is **not** measured in this package.

## Lead

Applied lead = null. No global lead is justified.

## Classification

Window/turn FRAUD/PASS stamps are `staleStoredLabel` only. Not physical truth.

## Displayed-frame freshness (R5)

Media-clock identity: `|currentTime − lastPresentedMediaTime| ≤ 1/24 s`.

Alive lease: last successful presented-frame observation (RVFC) must be within **125 ms** on a monotonic clock (`MOTION.now` || `performance.now`).

125 ms = 3 decoded-frame periods at 24 fps (expected interval + one delayed frame + scheduling jitter).

Repeat ticks between callbacks do not expire the lease. Frozen currentTime + silent RVFC expire it without events.

Also fail-closed this tick on: unverified identity, src mismatch, `ended`, `seeking`, out-of-range, cancelled RVFC.

## Cowl

Motion package does not dictate cowl meters.

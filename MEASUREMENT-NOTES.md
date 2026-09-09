# Measurement notes — v9-full-r4

NOT WEAR READY. 4K NOT VALIDATED.

LK source arrays were **not** regenerated and **not** mutated.

## Source

ride.mp4 SHA-256 `4507a5d5f9304b91c149200672c8a468f089a33bb96b10032a52346085483882`  
1514 frames · 24 fps · 63.083333 s · 1728×1152

ride-4k.mp4 is **not** measured in this package.

## Lead

Applied lead = null. No global lead is justified.

## Classification

Window/turn FRAUD/PASS stamps are `staleStoredLabel` only (declared rule does not reproduce; 80/247 mismatch). Not physical truth.

## Displayed-frame freshness (R4)

Render tick reads live video state. It does not assume the last RVFC remains valid.

Retain last presented `mediaTime` only while `|currentTime - lastPresentedMediaTime| ≤ 1/24 s` (one decoded-frame period, not a wall-clock timeout).

Also fail-closed this tick on: unverified identity, src mismatch, `ended`, `seeking`, out-of-range index, cancelled RVFC. Events still help; they are not required.

## Cowl

Motion package does not dictate cowl meters.

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

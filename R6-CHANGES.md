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

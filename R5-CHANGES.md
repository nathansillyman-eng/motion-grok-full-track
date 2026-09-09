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

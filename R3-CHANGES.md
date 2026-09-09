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

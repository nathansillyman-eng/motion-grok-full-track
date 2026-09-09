# Frame 1497 addendum

The comparison JSON `ab3e036aa6a98efab4c8ed4d4a526aae6881e64f689a2ae626909a3791095316` is unchanged.

Codex is correct: pixel match at 1497 does not prove the 3.73° deficit gap is a median-window effect. Re-measured 1490–1513 on both plates with LK predecessors present.

## What the JSON actually captured at 1497

Window job context started at 1495. LK at 1495 needs frame 1494. 1494 was not blurred, so 1495 yaw was null in that job. Median-5 at 1497 therefore ran on an incomplete 4K yaw neighborhood. That is a **comparison-job coverage defect**, not evidence of a 4K plate difference.

## Re-measure with 1490–1513 present

| | 4K | this-run lo-res | payload lo-res |
|---|---|---|---|
| raw yawRate | 0.1673 | 0.1761 | (stored is median) |
| median-5 yawRate | 0.1100 | 0.1109 | 0.1109 |
| measuredLeanDeg | −0.3163 | −0.1497 | −0.1497 |
| deficitLeanDeg | 15.3827 | 15.3295 | 15.3295 |

Deficit disagreement with full neighbors: **0.053°**, not 3.73°.

Payload lo-res remesure on this machine matched stored lean −0.1497 and median yaw 0.1109.

Neighbors 1495–1499 raw yaw 4K `[0.0893, 0.1100, 0.1673, 0.1768, −0.0400]` vs lo `[0.0851, 0.1109, 0.1761, 0.1630, −0.0224]`.

Do not treat JSON `max_abs` 3.73° as a 4K angular-measurement failure. Treat it as incomplete window context in the comparison script.

R6 consumer not modified. Native 4K LK not run. NOT WEAR READY.

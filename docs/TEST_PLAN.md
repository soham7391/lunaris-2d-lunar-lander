# LUNARIS: Test Plan & Verification Matrix

This document details the test procedures, automated checks, and manual verification scenarios for the LUNARIS 2D Lunar Landing Simulation.

---

## 1. Automated Verification (Executed & Passed)

The following automated tool executions verify code health, syntax, and typing:

| Test Tool | Command | Status | Notes |
| :--- | :--- | :--- | :--- |
| **`compile_applet`** | `npm run build` | **PASSED** | Vite production bundle created with 0 errors. |
| **`lint_applet`** | `tsc --noEmit` | **PASSED** | Zero TypeScript syntax, import, or typing errors. |

---

## 2. Interactive Manual Test Suite

These scenarios verify simulation behavior, physics calculations, and user experience.

### Test Case 1: Nominal Touchdown on Landing Pad
- **Objective**: Verify that landing within the tuned envelope triggers a successful touchdown.
- **Procedure**:
  1. Start the simulation from the Mission Briefing.
  2. The lander spawns centered above the wide landing pad (Site Alpha).
  3. Allow the craft to descend gently; apply short pulses of `W` or `Space` to maintain $v_y \le 3.0\text{ m/s}$.
  4. Keep attitude level ($|\theta| \le 5^\circ$) using `A` / `D`.
  5. Touch down on the illuminated pad surface.
- **Expected Result**:
  - Touchdown Success Modal appears: "TOUCHDOWN NOMINAL: Tranquillity Base confirmed!".
  - Lander settles level on the pad.
  - Telemetry summary displays green indicators for descent rate, drift, and fuel reserve.

### Test Case 2: Hard Impact (Excessive Vertical Speed)
- **Objective**: Verify that high descent velocity triggers landing gear structural collapse.
- **Procedure**:
  1. Restart the simulation (`R`).
  2. Allow the lander to free-fall without applying thrust until $v_y > 3.5\text{ m/s}$.
  3. Contact the landing pad.
- **Expected Result**:
  - Crash Modal appears: "HARD IMPACT CRASH: Excessive vertical descent rate (> 3.2 m/s limit) collapsed primary struts".
  - Spark wreckage indicator renders at the point of contact.

### Test Case 3: Excessive Lateral Drift
- **Objective**: Verify that fast lateral movement causes footpad shear upon touchdown.
- **Procedure**:
  1. Restart the simulation (`R`).
  2. Tilt the lander slightly (`D` or `Right Arrow`) and burn thrust to build lateral velocity $|v_x| > 2.0\text{ m/s}$.
  3. Level the craft upright before touching down on the pad.
- **Expected Result**:
  - Crash Modal appears: "HARD IMPACT CRASH: Excessive lateral drift (> 1.8 m/s limit) sheared landing footpads".

### Test Case 4: Excessive Tilt Angle
- **Objective**: Verify that landing with tilt $> 10.0^\circ$ causes vehicle rollover.
- **Procedure**:
  1. Hold `A` or `D` until pitch reaches $15^\circ - 20^\circ$.
  2. Feather thrust to keep $v_y$ low ($\le 2.0\text{ m/s}$).
  3. Touch down on the pad while tilted.
- **Expected Result**:
  - Crash Modal appears: "HARD IMPACT CRASH: Excessive attitude tilt (> 10.0° limit) tipped the vehicle onto its side".

### Test Case 5: Off-Pad Terrain Impact
- **Objective**: Verify that touching down on rugged lunar crags outside the pad causes failure.
- **Procedure**:
  1. Hold `A` to tilt port-side and thrust until the lander drifts far to the left or right of the pad.
  2. Descend gently into the jagged mountainous terrain.
- **Expected Result**:
  - Crash Modal appears: "TERRAIN IMPACT: Lander touched down outside the designated landing pad on rugged lunar regolith".

### Test Case 6: Cabin / Hull Strike (Inversion)
- **Objective**: Verify that inverted contact breaches the cabin.
- **Procedure**:
  1. Roll the lander upside-down ($180^\circ$).
  2. Strike the terrain.
- **Expected Result**:
  - Crash Modal appears: "HULL COMPROMISED: Severe attitude inversion. Ascent stage cabin impacted the surface".

### Test Case 7: Fuel Depletion & Flameout
- **Objective**: Verify that propellant depletes accurately and thrust ceases at 0%.
- **Procedure**:
  1. Hold `Space` continuously.
  2. Observe the propellant gauge decreasing by $2.8\%/\text{s}$.
  3. When fuel reaches $0\%$, observe the engine flame extinguishing and throttle reading `0%`.
- **Expected Result**:
  - Fuel drops to exactly $0.0\%$ (never negative).
  - Thrust stops immediately; craft continues in ballistic free-fall under lunar gravity.

### Test Case 8: Pause, Resume, and Restart
- **Objective**: Verify that pausing freezes kinematics without delta-time jumps, and restart clears states.
- **Procedure**:
  1. While in active flight, press `P` or click "Pause".
  2. Verify that craft motion freezes and the Pause modal appears.
  3. Wait 3 seconds, then press `P` or click "Resume".
  4. Verify that craft resumes smoothly without warping downward.
  5. Press `R` or click "Restart"; verify that craft resets to upper spawn altitude with $100\%$ fuel.

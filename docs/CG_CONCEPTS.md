# LUNARIS: Computer Graphics & Physics Concepts

This document details the mathematical models, coordinate spaces, 2D transformations, and simulation algorithms genuinely implemented in **LUNARIS: 2D Lunar Landing Simulation** and its **CG Transform Lab**.

---

## 1. Verified Implemented Computer Graphics Concepts

The following 7 core 2D Computer Graphics concepts are genuinely implemented and demonstrated in the codebase:

| Concept | Viva Definition | 3×3 Homogeneous Matrix Formula | Where LUNARIS Uses It in Code |
| :--- | :--- | :--- | :--- |
| **1. Translation** | Shifts an object along coordinate axes without altering its shape, size, or orientation. | $\begin{bmatrix} 1 & 0 & t_x \\ 0 & 1 & t_y \\ 0 & 0 & 1 \end{bmatrix}$ | In `drawLander.ts` and `SimulationView.tsx`, maps the lander from local origin $(0, 0)$ to active screen coordinates $(x, y)$ as it falls. |
| **2. Rotation** | Turns an object by angle $\theta$ around a fixed pivot point (the local Center of Mass). | $\begin{bmatrix} \cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix}$ | In `simulationEngine.ts` and `drawLander.ts`, rotates the lander around its Center of Mass when the pilot presses `A`/`D` (RCS pitch control), vectoring thrust. |
| **3. Scaling** | Multiplies coordinate distances by scale factors ($s_x, s_y$). Uniform if $s_x = s_y$, non-uniform otherwise. | $\begin{bmatrix} s_x & 0 & 0 \\ 0 & s_y & 0 \\ 0 & 0 & 1 \end{bmatrix}$ | Scales the lander model size for rendering (`scale: 1.2`), procedural rocket exhaust flames with throttle, and terrain coordinates to fit viewport width. |
| **4. Reflection** | Mirrors an object across a coordinate axis using negative scale factors ($s_x = -1$ for vertical axis, $s_y = -1$ for horizontal axis). | $\begin{bmatrix} -1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{bmatrix}$ or $\begin{bmatrix} 1 & 0 & 0 \\ 0 & -1 & 0 \\ 0 & 0 & 1 \end{bmatrix}$ | In `TransformLab.tsx` for axis flips, and in `drawLander.ts` for bilateral symmetry of landing struts and RCS nozzles across the vertical centerline. |
| **5. Shearing** | Slants an object along one axis proportionally to its perpendicular coordinate, preserving area while changing angles into parallelograms. | $\begin{bmatrix} 1 & sh_x & 0 \\ sh_y & 1 & 0 \\ 0 & 0 & 1 \end{bmatrix}$ | Demonstrated interactively in `TransformLab.tsx` on the Asymmetric 'F' test polygon; used in computer graphics for italicized HUD fonts and oblique projections. |
| **6. Matrix Composition** | Combines multiple transformations via matrix multiplication. It is associative but **non-commutative** ($\mathbf{A} \cdot \mathbf{B} \neq \mathbf{B} \cdot \mathbf{A}$). | $\mathbf{M} = \mathbf{T} \cdot \mathbf{R} \cdot \mathbf{S} \neq \mathbf{R} \cdot \mathbf{T} \cdot \mathbf{S}$ | In `drawLander.ts`, strictly applies $\mathbf{T}(x, y) \cdot \mathbf{R}(\theta) \cdot \mathbf{S}(s)$. Reversing to $\mathbf{R} \cdot \mathbf{T}$ causes the craft to orbit the world origin $(0,0)$ instead of spinning in place! |
| **7. Homogeneous Coordinates** | Augments 2D coordinates with $w=1$ ($[x, y, 1]^T$) so translation can be expressed as a linear matrix multiplication alongside rotation and scale in a single $3 \times 3$ matrix. | $\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} = \begin{bmatrix} a & c & e \\ b & d & f \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x \\ y \\ 1 \end{bmatrix}$ | The engine collapses position, attitude, and size into Canvas 2D's affine matrix `ctx.transform(a, b, c, d, e, f)` to render the composite Apollo vehicle in one call. |

### Concepts NOT Present (Removed from Scope)
- **3D Perspective / Projective Projections**: LUNARIS is strictly a 2D simulation using affine planar transformations.
- **Non-Affine / Homography Warping**: The Canvas 2D affine model preserves parallel lines ($w = 1$ invariant); non-linear perspective warps are not implemented.

---

## 2. Coordinate Systems & Conventions

LUNARIS distinguishes between two primary coordinate frames:

### A. Local Model Space (Craft-Centric)
- **Origin $\mathbf{(0, 0)}$**: Fixed at the Lunar Excursion Module's (LEM) Center of Mass.
- **$\mathbf{-Y}$ Axis**: Forward / Zenith (pointing towards the ascent cabin and docking tunnel).
- **$\mathbf{+Y}$ Axis**: Aft / Nadir (pointing towards the descent engine nozzle and landing footpads).
- **$\mathbf{-X}$ Axis**: Port (left outrigger and RCS cluster).
- **$\mathbf{+X}$ Axis**: Starboard (right outrigger and RCS cluster).

Key Model Space Vertices:
- Left Footpad: $(-38, 37)$
- Right Footpad: $(38, 37)$
- Engine Bell Nozzle: $(0, 19)$
- Cabin Apex: $(0, -26)$
- Left Strut Shoulder: $(-24, 10)$
- Right Strut Shoulder: $(24, 10)$

### B. World / Screen Coordinate Space
- **Origin $\mathbf{[0, 0]}$**: Top-left corner of the HTML5 Canvas.
- **$\mathbf{+X}$ Axis**: Horizontal to the right (East).
- **$\mathbf{+Y}$ Axis**: Vertical downward (towards the lunar surface).
- **Rotation $\theta$**: In radians, where $\theta = 0$ is upright, $+\theta$ is clockwise roll, and $-\theta$ is counter-clockwise roll.

---

## 3. Matrix Composition & Order Demonstration

In Computer Graphics, matrix multiplication is associative $((\mathbf{A}\mathbf{B})\mathbf{C} = \mathbf{A}(\mathbf{B}\mathbf{C}))$ but **non-commutative** ($\mathbf{A}\mathbf{B} \neq \mathbf{B}\mathbf{A}$).

### Standard Order: $\mathbf{T} \cdot \mathbf{R} \cdot \mathbf{S}$ (Rotate in place, then Translate)
$$\mathbf{M}_{\text{TRS}} = \begin{bmatrix} 1 & 0 & t_x \\ 0 & 1 & t_y \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} \cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} s_x & 0 & 0 \\ 0 & s_y & 0 \\ 0 & 0 & 1 \end{bmatrix} = \begin{bmatrix} s_x\cos\theta & -s_y\sin\theta & t_x \\ s_x\sin\theta & s_y\cos\theta & t_y \\ 0 & 0 & 1 \end{bmatrix}$$
- **Visual outcome**: The object is scaled and rotated around its own local center, and then translated to position $(t_x, t_y)$.
- **Translation vector**: $[e, f] = [t_x, t_y]$.

### Reversed Order: $\mathbf{R} \cdot \mathbf{T} \cdot \mathbf{S}$ (Translate first, then Rotate)
$$\mathbf{M}_{\text{RTS}} = \begin{bmatrix} \cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} 1 & 0 & t_x \\ 0 & 1 & t_y \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} s_x & 0 & 0 \\ 0 & s_y & 0 \\ 0 & 0 & 1 \end{bmatrix} = \begin{bmatrix} s_x\cos\theta & -s_y\sin\theta & t_x\cos\theta - t_y\sin\theta \\ s_x\sin\theta & s_y\cos\theta & t_x\sin\theta + t_y\cos\theta \\ 0 & 0 & 1 \end{bmatrix}$$
- **Visual outcome**: The object is translated along world axes first, and then the entire coordinate space (including the object's position) is rotated around the world origin $(0, 0)$. The craft orbits the origin along a circular arc.
- **Translation vector**: $[e, f] = [t_x\cos\theta - t_y\sin\theta,\; t_x\sin\theta + t_y\cos\theta] \neq [t_x, t_y]$.

This dynamic proof is demonstrated visually and numerically in the **CG Transform Lab**.

---

## 4. Newtonian Kinematics & Semi-Implicit Euler Integration

The simulation updates kinematic states using elapsed time $\Delta t$ computed via `requestAnimationFrame` timestamps:

$$\Delta t = \min\left(0.1, \frac{t_{\text{current}} - t_{\text{previous}}}{1000}\right)$$

### Acceleration Resolution
- Lunar gravity acts downward along $+Y$:
  $$g_{\text{lunar}} = 1.62\text{ m/s}^2 \quad (\approx 12.96\text{ px/s}^2)$$
- Main engine thrust acts along the vehicle's local $-Y$ axis. When rotated by $\theta$:
  $$a_{\text{thrust}, x} = \frac{T}{m} \sin\theta$$
  $$a_{\text{thrust}, y} = -\frac{T}{m} \cos\theta$$
- Net acceleration:
  $$\mathbf{a} = [a_{\text{thrust}, x},\; g_{\text{lunar}} + a_{\text{thrust}, y}]$$

### Semi-Implicit (Symplectic) Euler Integration
Velocity is updated first, then the updated velocity is used to integrate position:
$$\mathbf{v}(t + \Delta t) = \mathbf{v}(t) + \mathbf{a}(t) \cdot \Delta t$$
$$\mathbf{p}(t + \Delta t) = \mathbf{p}(t) + \mathbf{v}(t + \Delta t) \cdot \Delta t$$

Angular attitude integration with aerodynamic/RCS damping $\gamma$:
$$\omega(t + \Delta t) = \left( \omega(t) + \frac{\tau_{\text{RCS}}}{I} \Delta t \right) \cdot (1 - \gamma \Delta t)$$
$$\theta(t + \Delta t) = \theta(t) + \omega(t + \Delta t) \Delta t$$

---

## 5. Piecewise Linear Terrain Elevation Query

The lunar terrain is modeled as an array of discrete piecewise vertices $P_i = (x_i, y_i)$. For any horizontal position $x \in [x_i, x_{i+1}]$, elevation $y_{\text{terrain}}(x)$ is evaluated via linear interpolation:

$$t = \frac{x - x_i}{x_{i+1} - x_i}$$
$$y_{\text{terrain}}(x) = y_i + (y_{i+1} - y_i) \cdot t$$

---

## 6. Multi-Point Contact & Collision Detection

Collision detection transforms 6 critical body points from local space to world space:
1. $\mathbf{p}_{\text{foot, left}}$: Left landing footpad
2. $\mathbf{p}_{\text{foot, right}}$: Right landing footpad
3. $\mathbf{p}_{\text{nozzle}}$: Engine bell exhaust nozzle
4. $\mathbf{p}_{\text{cabin}}$: Cabin apex / docking tunnel
5. $\mathbf{p}_{\text{shoulder, left}}$: Left descent stage shoulder
6. $\mathbf{p}_{\text{shoulder, right}}$: Right descent stage shoulder

Contact occurs if $y_{\text{world}} \ge y_{\text{terrain}}(x_{\text{world}})$.

### Safe Landing Criteria
- **Pad Containment**: Both footpads must satisfy $x_{\text{pad, start}} \le x_{\text{foot}} \le x_{\text{pad, end}}$.
- **Vertical Descent Rate ($V_y$)**: $\le 3.2\text{ m/s}$ ($25.6\text{ px/s}$).
- **Lateral Drift Speed ($|V_x|$)**: $\le 1.8\text{ m/s}$ ($14.4\text{ px/s}$).
- **Attitude Pitch Tilt ($|\theta|$)**: $\le 10.0^\circ$ ($0.1745\text{ rad}$).

If all four conditions are satisfied upon pad contact, **Touchdown Nominal** is awarded. Any violation triggers structural failure.

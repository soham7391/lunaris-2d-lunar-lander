# LUNARIS: Computer Graphics & Physics Concepts

This document details the mathematical models, coordinate spaces, transformations, and simulation algorithms implemented in **LUNARIS: 2D Lunar Landing Simulation**.

---

## 1. Coordinate Systems & Conventions

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

## 2. 2D Homogeneous Affine Transformations

To render and test the lander for collision, local vertices are mapped to world coordinates using a homogeneous $3 \times 3$ affine transformation matrix combining Translation, Rotation, and Scaling:

$$\mathbf{M} = \mathbf{T}(c_x, c_y) \cdot \mathbf{R}(\theta) \cdot \mathbf{S}(s)$$

$$\begin{bmatrix} x_w \\ y_w \\ 1 \end{bmatrix} = \begin{bmatrix} \cos\theta & -\sin\theta & c_x \\ \sin\theta & \cos\theta & c_y \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} s \cdot x_l \\ s \cdot y_l \\ 1 \end{bmatrix}$$

Expanding the matrix multiplication yields the explicit transformation equations:
$$x_w = c_x + s \cdot (x_l \cos\theta - y_l \sin\theta)$$
$$y_w = c_y + s \cdot (x_l \sin\theta + y_l \cos\theta)$$

This transformation ensures that the craft rotates smoothly around its authentic Center of Mass rather than its bounding box corner.

---

## 3. Newtonian Kinematics & Semi-Implicit Euler Integration

The simulation updates kinematic states using elapsed time $\Delta t$ computed via `requestAnimationFrame` timestamps:

$$\Delta t = \min\left(0.1, \frac{t_{\text{current}} - t_{\text{previous}}}{1000}\right)$$

### Acceleration Resolution
- Lunar gravity acts downward along $+Y$:
  $$g_{\text{lunar}} = 18\text{ px/s}^2 \quad (\approx 2.25\text{ m/s}^2)$$
- Main engine thrust $T = 48\text{ px/s}^2$ acts along the local $-Y$ axis. When rotated by $\theta$:
  $$a_{\text{thrust}, x} = T \sin\theta$$
  $$a_{\text{thrust}, y} = -T \cos\theta$$
- Net acceleration:
  $$a_x = a_{\text{thrust}, x}$$
  $$a_y = g_{\text{lunar}} + a_{\text{thrust}, y}$$

### Integration Steps
Semi-implicit (symplectic) Euler updates velocity first, then position:
$$\mathbf{v}(t + \Delta t) = \mathbf{v}(t) + \mathbf{a}(t) \cdot \Delta t$$
$$\mathbf{p}(t + \Delta t) = \mathbf{p}(t) + \mathbf{v}(t + \Delta t) \cdot \Delta t$$

---

## 4. Piecewise Linear Terrain Elevation Query

The lunar terrain is modeled as an array of discrete vertices $P_i = (x_i, y_i)$. For any horizontal position $x \in [x_i, x_{i+1}]$, elevation $y_{\text{terrain}}(x)$ is evaluated via linear interpolation:

$$t = \frac{x - x_i}{x_{i+1} - x_i}$$
$$y_{\text{terrain}}(x) = y_i + (y_{i+1} - y_i) \cdot t$$

---

## 5. Multi-Point Contact & Collision Detection

Collision detection tests transformed world coordinates of 6 critical points:
1. $\mathbf{p}_{\text{foot, left}}$
2. $\mathbf{p}_{\text{foot, right}}$
3. $\mathbf{p}_{\text{nozzle}}$
4. $\mathbf{p}_{\text{cabin}}$
5. $\mathbf{p}_{\text{shoulder, left}}$
6. $\mathbf{p}_{\text{shoulder, right}}$

Contact occurs if $y_{\text{world}} \ge y_{\text{terrain}}(x_{\text{world}})$.

### Landing Evaluation Rules
- **Pad Containment**: Both footpads must satisfy:
  $$x_{\text{pad, start}} - \Delta_{\text{margin}} \le x_{\text{foot}} \le x_{\text{pad, end}} + \Delta_{\text{margin}}$$
- **Flight Envelope Limits**:
  - Vertical Descent Rate: $v_y \le 3.2\text{ m/s}$
  - Lateral Drift Speed: $|v_x| \le 1.8\text{ m/s}$
  - Attitude Pitch Tilt: $|\theta| \le 10.0^\circ$

If all three tolerances are met on the designated pad, **Touchdown Nominal** is confirmed. Violations trigger structured failure debriefs (Strut Collapse, Gear Shear, Vehicle Rollover, Engine Strike, or Off-Pad Impact).

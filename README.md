# LUNARIS: 2D Lunar Landing Simulation

LUNARIS is a browser-based 2D Lunar Landing Simulation and Computer Graphics laboratory built with TypeScript, React, and the HTML5 Canvas 2D API. The application simulates the terminal descent and touchdown phase of an Apollo-style Lunar Excursion Module (LEM) across procedurally generated lunar topography, enforcing Newtonian kinematics, rotational inertia, fuel depletion, and strict landing envelopes. It also includes an interactive Computer Graphics Transformation Laboratory for studying 2D affine matrix operations in homogeneous coordinates.

---

## 1. Project Objectives & Key Features

### Educational Objectives
- Implement real-time 2D hierarchical vector graphics transformations using native Canvas 2D operations.
- Apply homogeneous coordinates ($3 \times 3$ transformation matrices) for translation, rotation, scaling, reflection, and shearing.
- Implement numerical integration (semi-implicit Euler) for Newtonian gravity, directional thrust vectors, and rotational dynamics.
- Develop piecewise terrain generation and multi-vertex collision detection routines.

### Key Features
- **Three Playable Campaign Sectors**:
  - **Level 1 (Mare Tranquillitatis · Easy)**: Smooth lunar basalt profile, wide central landing pad (28% viewport width), Earthrise celestial theme, and cyan HUD accents.
  - **Level 2 (Oceanus Procellarum · Medium)**: Rolling cratered topography, offset starboard landing pad (20% viewport width), Jupiter backdrop, and amber HUD accents.
  - **Level 3 (Tycho Crater Basin · Hard)**: Hazardous jagged mountain chutes, narrow crater-floor pad (12% viewport width), Mars orbital backdrop, and rose HUD accents.
- **Progressive Campaign Progression**:
  - Sequential level unlocking persisted in client `localStorage`.
  - Comprehensive post-landing mission score breakdown based on remaining fuel, touchdown vertical speed, lateral drift, attitude tilt, and sector difficulty multipliers.
  - Instant retry on structural impact and sector re-selection menu.
- **Computer Graphics Transform Lab**:
  - Interactive laboratory decoupled from the physics engine.
  - Real-time manipulation of translation $T(t_x, t_y)$, rotation $R(\theta)$, non-uniform scaling $S(s_x, s_y)$, shearing $Sh(sh_x, sh_y)$, and axis reflection.
  - Real-time $3 \times 3$ homogeneous transformation matrix display and Canvas 2D `[a, b, c, d, e, f]` matrix parameter readout.
  - Demonstration of transformation non-commutativity ($T \cdot R \cdot S$ vs. $R \cdot T \cdot S$) using Apollo LEM geometry or geometric test polygons.
- **Flight Avionics & Telemetry HUD**:
  - Live digital and visual indicators for radar altitude, vertical speed ($V_y$), lateral drift ($V_x$), pitch attitude angle ($\theta$), fuel mass remaining, and thrust throttle.
  - Color-coded safety validation against Apollo-spec touchdown limits.
  - Visual debug overlays: world coordinate grid, body axes $[u, v]$, center of mass, and piecewise surface normals.
- **Cinematic Procedural Main Menu**:
  - Full-screen deep space environment with procedural multi-spectral starfield twinkling.
  - Rotating Canvas 2D lunar sphere with Lommel-Seeliger photometric shading and crater topology.
  - Orbiting satellite probe with Keplerian trajectory and 3D line-of-sight occlusion behind the Moon.
  - Mouse-driven spatial parallax with `prefers-reduced-motion` accessibility support.

---

## 2. Technology Stack

- **Core Framework**: React 19 (Functional components, Hooks)
- **Programming Language**: TypeScript 7.0 (Strict mode)
- **Build Tool & Development Server**: Vite 8.3
- **Styling**: Tailwind CSS 4.3 (Import-based architecture)
- **Iconography**: Lucide React
- **Graphics Engine**: HTML5 Canvas 2D Context (`CanvasRenderingContext2D`)
- **Asset Architecture**: 100% procedural vector rendering (zero external raster textures or 3D libraries)

---

## 3. Setup and Run Instructions

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (Node Package Manager)

### Installation & Execution

1. **Install project dependencies**:
   ```bash
   npm install
   ```

2. **Start the local development server**:
   ```bash
   npm run dev
   ```
   The application will be served at `http://localhost:3000`.

3. **Build for production**:
   ```bash
   npm run build
   ```
   Compiles TypeScript and bundles production-ready static assets into the `dist/` directory.

4. **Preview the production build**:
   ```bash
   npm run preview
   ```

5. **Run type-checking**:
   ```bash
   npm run lint
   ```

### Docker Containerization (Production)

The application includes a multi-stage Docker setup with an optimized Nginx web server configured for client-side SPA routing:

1. **Build the production Docker image**:
   ```bash
   docker build -t lunaris .
   ```

2. **Run the production container**:
   ```bash
   docker run -d -p 8080:80 --name lunaris-sim lunaris
   ```
   Open `http://localhost:8080` in your web browser.

3. **Stop the container**:
   ```bash
   docker stop lunaris-sim && docker rm lunaris-sim
   ```

---

## 4. Gameplay Controls & Landing Rules

### Flight Controls

| Action | Primary Key | Secondary Key | Touch / On-Screen |
| :--- | :--- | :--- | :--- |
| **Main Engine Thrust** | `W` | `Up Arrow` / `Space` | On-screen "Thrust" Button |
| **Roll Attitude Port (Counter-Clockwise)** | `A` | `Left Arrow` | On-screen "A" Button |
| **Roll Attitude Starboard (Clockwise)** | `D` | `Right Arrow` | On-screen "D" Button |
| **Pause / Resume Simulation** | `P` | — | Top Bar "Pause" Button |
| **Restart Current Sector** | `R` | — | Top Bar "Restart" Button |
| **Toggle Coordinate Grid Overlay** | `G` | — | Top Bar "Grid" Button |

### Touchdown Flight Envelope

To achieve a confirmed soft landing, the vehicle must satisfy all of the following conditions simultaneously upon contact:

1. **Pad Alignment**: Both footpads must make contact entirely within the horizontal boundaries of the designated landing pad slab ($X_{\text{start}} \le X \le X_{\text{end}}$).
2. **Vertical Velocity ($V_y$)**: $\le 3.2\text{ m/s}$ ($25.6\text{ px/s}$). Exceeding this threshold collapses the descent stage shock struts.
3. **Lateral Drift ($|V_x|$)**: $\le 1.8\text{ m/s}$ ($14.4\text{ px/s}$). Excessive shear velocity induces rollover upon pad contact.
4. **Attitude Tilt ($|\theta|$)**: $\le 10.0^\circ$ ($0.1745\text{ rad}$) from the local vertical axis.

A crash is registered if any landing limit is exceeded or if any part of the vehicle hull, engine nozzle, or footpads intersects the irregular terrain outside the landing pad.

---

## 5. Computer Graphics Concepts Implemented

### 1. Hierarchical 2D Transformations & Homogeneous Coordinates
The simulation constructs local vehicle coordinates relative to its center of mass $(0, 0)$. Vertices for the ascent cabin, descent stage, shock struts, footpads, and RCS thrusters are mapped to world coordinates through the affine transformation sequence:

$$\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} = \mathbf{T}(t_x, t_y) \cdot \mathbf{R}(\theta) \cdot \mathbf{S}(s) \cdot \begin{bmatrix} x \\ y \\ 1 \end{bmatrix}$$

$$\mathbf{M} = \begin{bmatrix} 1 & 0 & t_x \\ 0 & 1 & t_y \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} \cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} s & 0 & 0 \\ 0 & s & 0 \\ 0 & 0 & 1 \end{bmatrix} = \begin{bmatrix} s\cos\theta & -s\sin\theta & t_x \\ s\sin\theta & s\cos\theta & t_y \\ 0 & 0 & 1 \end{bmatrix}$$

In the **CG Transform Lab**, arbitrary matrix components ($a, b, c, d, e, f$) are exposed directly through Canvas 2D's `ctx.setTransform(a, b, c, d, e, f)`, illustrating shearing ($Sh_{xy}$) and non-commutativity:

$$\mathbf{T} \cdot \mathbf{R} \cdot \mathbf{S} \neq \mathbf{R} \cdot \mathbf{T} \cdot \mathbf{S}$$

### 2. Numerical Physics Integration
Flight dynamics are updated each animation frame using semi-implicit Euler integration:

$$\mathbf{a}(t) = \mathbf{g} + \frac{\mathbf{F}_{\text{thrust}}(t)}{m(t)}$$

$$\mathbf{v}(t + \Delta t) = \mathbf{v}(t) + \mathbf{a}(t) \Delta t$$

$$\mathbf{x}(t + \Delta t) = \mathbf{x}(t) + \mathbf{v}(t + \Delta t) \Delta t$$

$$\omega(t + \Delta t) = \left( \omega(t) + \frac{\tau_{\text{RCS}}}{I} \Delta t \right) \cdot (1 - \gamma_{\text{damping}} \Delta t)$$

$$\theta(t + \Delta t) = \theta(t) + \omega(t + \Delta t) \Delta t$$

Here $\mathbf{g} = [0, 1.62\text{ m/s}^2]$ represents lunar gravitational acceleration, and fuel mass depletes proportionally to throttle duration.

### 3. Piecewise Continuous Terrain Generation & Collision Solver
Terrain elevation $y(x)$ is synthesized procedurally as a piecewise continuous line strip:
- Smooth baseline generated using multi-octave sinusoidal synthesis with midpoint displacement for crater and ridge depressions.
- Landing pad segment is flattened strictly to a horizontal zero-slope slab at a fixed altitude.
- Collision detection transforms the critical vehicle feature points (left footpad, right footpad, engine bell nozzle, cabin extremities) from local body space to world space, performs a binary search to identify the enclosing terrain segment $[(x_i, y_i), (x_{i+1}, y_{i+1})]$, linearly interpolates ground altitude:

$$y_{\text{ground}}(x) = y_i + \frac{y_{i+1} - y_i}{x_{i+1} - x_i} (x - x_i)$$

and tests for penetration ($y_{\text{point}} \ge y_{\text{ground}}(x)$).

### 4. Procedural Celestial & Photometric Rendering
- **Starfield**: Procedural array of stars with individualized color temperatures, twinkle frequencies, and mouse-driven spatial parallax.
- **Moon Rendering**: 3D spherical projection mapping longitudinal rotation $\lambda' = \lambda + \omega t$, Lommel-Seeliger photometric illumination, and foreshortened crater ellipses.
- **Orbital Satellite**: Keplerian parametric orbit $(x_{\text{orb}} = a\cos\beta, y_{\text{orb}} = b\sin\beta)$ with 3D depth testing against the lunar disk for line-of-sight occlusion.

---

## 6. Project Structure

```
.
├── docs/
│   └── CG_CONCEPTS.md              # Detailed CG transformations, matrix proofs, and physics
├── .dockerignore                   # Docker build exclusions
├── Dockerfile                      # Multi-stage production container build (Node.js + Nginx)
├── nginx.conf                      # Production Nginx web server configuration with SPA fallback
├── index.html                      # HTML5 entry point and viewport configuration
├── metadata.json                   # Applet project metadata and capabilities
├── package.json                    # Project dependencies, build, and lint scripts
├── tsconfig.json                   # TypeScript compiler configuration
├── tsconfig.app.json               # Application-specific TypeScript rules
├── tsconfig.node.json              # Node environment configuration
├── vite.config.ts                  # Vite bundler and Tailwind CSS plugin setup
└── src/
    ├── App.tsx                     # Main application view router and active level state
    ├── main.tsx                    # React DOM root entry point
    ├── index.css                   # Global styling and font imports
    ├── components/
    │   ├── MainMenu.tsx            # Cinematic main menu with rotating Moon and satellite
    │   ├── MissionBriefing.tsx     # Flight readiness review and interactive LEM preview
    │   ├── SimulationView.tsx      # Core flight canvas, telemetry HUD, and overlay dialogs
    │   ├── LevelSelect.tsx         # Campaign sector selection and unlock browser
    │   ├── TransformLab.tsx        # Interactive 2D matrix transformation laboratory
    │   └── ProjectSpecsModal.tsx   # System documentation and CG architecture dialog
    ├── graphics/
    │   ├── drawCinematicMoon.ts    # Procedural photorealistic Moon and orbiting probe
    │   ├── drawGrid.ts             # World coordinate grid and radar altitude projection
    │   ├── drawLander.ts           # Vector Apollo LEM model, RCS jets, and thruster plumes
    │   ├── drawMoonAndHorizon.ts   # Celestial backdrop primitives
    │   ├── drawStarfield.ts        # Twinkling starfield and planetary gradients
    │   └── drawTerrain.ts          # Piecewise continuous terrain and landing pad renderer
    ├── physics/
    │   ├── levels.ts               # Centralized sector configurations, themes, and scoring
    │   └── simulationEngine.ts     # Newtonian kinematics, gravity, and collision solver
    └── types/
        └── game.ts                 # Shared TypeScript interfaces and simulation types
```

---

## 7. Testing & Verification Status

### Automated Checks Performed

| Check | Command | Result | Details |
| :--- | :--- | :--- | :--- |
| **TypeScript Static Analysis** | `npm run lint` (`tsc --noEmit`) | **PASS** | 0 type errors, strict null checks satisfied |
| **Production Build** | `npm run build` (`vite build`) | **PASS** | Bundle compiled cleanly into `dist/` |

> *Note on Manual Testing*: The automated test suite verifies compilation, type consistency, and bundling. Interactive flight dynamics, collision edge cases, keyboard response, and Canvas rendering performance must be validated manually in a live browser session.

---

## 8. Screenshot Placeholders

*Place project screenshots in an `assets/screenshots/` folder (or equivalent) and link them below:*

1. **Cinematic Main Menu**
   ![Main Menu Placeholder](docs/screenshots/main_menu.png)
   *Figure 1: Full-screen deep space environment, rotating lunar sphere, and orbiting probe.*

2. **Descent Simulation Gameplay**
   ![Simulation Gameplay Placeholder](docs/screenshots/gameplay.png)
   *Figure 2: Active descent over Mare Tranquillitatis with live telemetry and guidance HUD.*

3. **Touchdown Mission Success Screen**
   ![Level Complete Placeholder](docs/screenshots/touchdown_success.png)
   *Figure 3: Mission scoring breakdown, performance metrics, and progressive sector unlock.*

4. **CG Transformation Laboratory**
   ![Transform Lab Placeholder](docs/screenshots/transform_lab.png)
   *Figure 4: Interactive affine matrix experimentation showing composition and non-commutativity.*

---

## 9. Team Contributions

| Team Member | Roll / Student ID | Primary Responsibilities & Contributions |
| :--- | :--- | :--- |
| **[Student Name 1]** | `[Roll Number 1]` | Physics Engine, Semi-Implicit Euler Integrator, Collision Solver |
| **[Student Name 2]** | `[Roll Number 2]` | Canvas 2D Vector Rendering (LEM model, Starfield, Procedural Terrain) |
| **[Student Name 3]** | `[Roll Number 3]` | CG Transform Lab, Matrix Mathematics, Homogeneous Coordinates |
| **[Student Name 4]** | `[Roll Number 4]` | UI Architecture, Campaign Level System, Telemetry HUD & Scoring |

---

## 10. Known Limitations

- **Planar Coordinate Space**: The simulation calculates physics in a localized 2D Cartesian plane and does not account for planetary curvature across orbital scales.
- **Fixed Center of Mass**: The lander's center of mass is treated as invariant throughout descent, rather than dynamically shifting as propellant mass is consumed.
- **Vacuum Exosphere**: Aerodynamic drag is omitted (physically accurate for the lunar vacuum, but not applicable to atmospheric descents).
- **Single Contact Normal**: Touchdown contact resolution does not simulate multi-body suspension spring rebounds or ground deformation.

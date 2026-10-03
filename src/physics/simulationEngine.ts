/**
 * @file simulationEngine.ts
 * Core 2D Newtonian Physics & Collision Engine for LUNARIS.
 * 
 * Computer Graphics & Physics Concepts Implemented:
 * 1. 2D Homogeneous Affine Transformations:
 *    Local Model Space -> World Coordinate Space:
 *    [ x_w ]   [ cos(θ)  -sin(θ)  x_c ] [ x_l ]
 *    [ y_w ] = [ sin(θ)   cos(θ)  y_c ] [ y_l ]
 *    [  1  ]   [   0        0      1  ] [  1  ]
 * 
 * 2. Semi-Implicit Euler Integration:
 *    v(t + dt) = v(t) + a(t) * dt
 *    p(t + dt) = p(t) + v(t + dt) * dt
 * 
 * 3. Thrust Vector Resolution:
 *    F_thrust acts along the lander's longitudinal axis (pointing up in local frame).
 *    In screen space where +Y is downward (towards lunar surface):
 *    a_thrust_x =  (F / m) * sin(θ)
 *    a_thrust_y = -(F / m) * cos(θ)
 *    a_total_x  = a_thrust_x
 *    a_total_y  = g_lunar + a_thrust_y
 * 
 * 4. Piecewise Linear Terrain Elevation Query:
 *    Line segment interpolation between terrain vertices:
 *    y_terrain(x) = y_i + (y_{i+1} - y_i) * ((x - x_i) / (x_{i+1} - x_i))
 * 
 * 5. Multi-Point Contact & Collision Detection:
 *    Transforms critical collision vertices (left footpad, right footpad, engine nozzle,
 *    crew cabin hull, and outriggers) to world space and tests for terrain penetration.
 */

import { Vector2D, Transform2D, LandingPad, TerrainPoint } from '../types/game';
import { TerrainProfile } from '../graphics/drawTerrain';

// Physical Constants & Simulation Configuration
export const SIMULATION_CONFIG = {
  // Conversion scale: 1 meter = 8 screen pixels
  PIXELS_PER_METER: 8,

  // Lunar gravity: calibrated for smooth, predictable, beginner-friendly descent
  // ~2.25 m/s² in real terms (18 px/s² / 8 px/m), majestic floaty lunar feel
  LUNAR_GRAVITY_PX: 18,

  // Main engine max thrust acceleration: px/s²
  // TWR ~ 2.67 (48 / 18), providing responsive deceleration without catapulting
  MAIN_THRUST_ACCEL_PX: 48,

  // Attitude control rotational speed: radians per second (~48.7 deg/s)
  // Tuned for controllable, measured attitude adjustments
  ROTATION_SPEED_RAD: 0.85,

  // Fuel capacity and consumption (generous for beginners: ~35+ seconds of continuous full burn)
  INITIAL_FUEL_PERCENT: 100.0,
  MAIN_ENGINE_BURN_RATE: 2.8, // % fuel per second at 100% throttle
  RCS_BURN_RATE: 0.4, // % fuel per second when rotating

  // Tuned landing tolerances (achievable for beginners while requiring controlled flight)
  MAX_LANDING_VERTICAL_SPEED_MS: 3.2, // m/s (forgiving cushion, avoids hair-trigger failure)
  MAX_LANDING_HORIZONTAL_SPEED_MS: 1.8, // m/s (allows reasonable lateral glide)
  MAX_LANDING_TILT_DEG: 10.0, // degrees (forgiving attitude envelope)
};

export type SimulationStatus = 'FLYING' | 'LANDED' | 'CRASHED' | 'PAUSED';

export interface LanderPhysicsState {
  position: Vector2D; // Screen pixels
  velocity: Vector2D; // Screen pixels per second
  rotation: number; // In radians (0 = upright, + = clockwise tilt)
  scale: number;
  fuel: number; // 0 to 100%
  throttle: number; // 0 to 1
  isThrusting: boolean;
  isRotatingLeft: boolean;
  isRotatingRight: boolean;
  status: SimulationStatus;
  landingMessage: string;
  collisionDetails?: {
    impactPoint: Vector2D;
    partName: string;
  };
}

export interface InputState {
  thrust: boolean;
  rotateLeft: boolean;
  rotateRight: boolean;
}

// Local model coordinates of LEM contact and hull boundary points (matching drawLander.ts)
export const LANDER_LOCAL_VERTICES = {
  leftFootpad: { x: -38, y: 37 },
  rightFootpad: { x: 38, y: 37 },
  engineNozzle: { x: 0, y: 19 },
  leftStrutShoulder: { x: -24, y: 10 },
  rightStrutShoulder: { x: 24, y: 10 },
  cabinApex: { x: 0, y: -26 },
  leftCabinCorner: { x: -19, y: -15 },
  rightCabinCorner: { x: 19, y: -15 },
};

/**
 * Transforms a 2D point from local model space to world space using the lander's transform.
 */
export function transformLocalToWorld(
  localPoint: Vector2D,
  center: Vector2D,
  rotation: number,
  scale: number
): Vector2D {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const scaledX = localPoint.x * scale;
  const scaledY = localPoint.y * scale;

  return {
    x: center.x + (scaledX * cos - scaledY * sin),
    y: center.y + (scaledX * sin + scaledY * cos),
  };
}

/**
 * Queries the interpolated terrain elevation Y at a given X coordinate.
 */
export function getTerrainHeightAt(x: number, points: TerrainPoint[]): number {
  if (points.length === 0) return 9999;
  if (x <= points[0].x) return points[0].y;
  if (x >= points[points.length - 1].x) return points[points.length - 1].y;

  // Find the segment enclosing x
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    if (x >= p1.x && x <= p2.x) {
      const segmentWidth = p2.x - p1.x;
      if (segmentWidth <= 0.0001) return p1.y;
      const t = (x - p1.x) / segmentWidth;
      return p1.y + (p2.y - p1.y) * t;
    }
  }

  return points[points.length - 1].y;
}

/**
 * Updates the physics simulation by delta time (dt in seconds).
 * Uses elapsed-time-based semi-implicit Euler integration.
 */
export function updateSimulationPhysics(
  state: LanderPhysicsState,
  input: InputState,
  terrain: TerrainProfile,
  dt: number
): LanderPhysicsState {
  // If not actively flying, freeze physics
  if (state.status !== 'FLYING') {
    return state;
  }

  // Clamp dt to prevent numerical explosion on tab blur or stutter
  const clampedDt = Math.min(Math.max(dt, 0.001), 0.1);

  // 1. Attitude Control & RCS Fuel Consumption
  let newRotation = state.rotation;
  let newFuel = state.fuel;
  let rcsActive = false;

  if (state.fuel > 0) {
    if (input.rotateLeft && !input.rotateRight) {
      newRotation -= SIMULATION_CONFIG.ROTATION_SPEED_RAD * clampedDt;
      newFuel = Math.max(0, newFuel - SIMULATION_CONFIG.RCS_BURN_RATE * clampedDt);
      rcsActive = true;
    } else if (input.rotateRight && !input.rotateLeft) {
      newRotation += SIMULATION_CONFIG.ROTATION_SPEED_RAD * clampedDt;
      newFuel = Math.max(0, newFuel - SIMULATION_CONFIG.RCS_BURN_RATE * clampedDt);
      rcsActive = true;
    }
  }

  // 2. Main Engine Acceleration & Burn
  let newThrottle = 0;
  let thrustAx = 0;
  let thrustAy = 0;
  const hasFuelForThrust = state.fuel > 0;

  if (input.thrust && hasFuelForThrust) {
    newThrottle = 1.0;
    // Thrust points in local -Y direction (along LEM longitudinal axis)
    // When upright (θ = 0), thrust pushes in -Y (upward against gravity)
    const thrustMagnitude = SIMULATION_CONFIG.MAIN_THRUST_ACCEL_PX;
    thrustAx = thrustMagnitude * Math.sin(newRotation);
    thrustAy = -thrustMagnitude * Math.cos(newRotation);

    newFuel = Math.max(0, newFuel - SIMULATION_CONFIG.MAIN_ENGINE_BURN_RATE * clampedDt);
  }

  // 3. Net Newtonian Acceleration
  // Gravity acts downwards (+Y in screen coordinates)
  const accelX = thrustAx;
  const accelY = SIMULATION_CONFIG.LUNAR_GRAVITY_PX + thrustAy;

  // 4. Semi-Implicit Euler Integration
  const newVx = state.velocity.x + accelX * clampedDt;
  const newVy = state.velocity.y + accelY * clampedDt;

  const rawPosX = state.position.x + newVx * clampedDt;
  const rawPosY = state.position.y + newVy * clampedDt;

  // Soft lateral and ceiling boundary constraints to keep flight visible on screen
  const points = terrain.points;
  const minX = points.length > 0 ? points[0].x + 24 : 24;
  const maxX = points.length > 0 ? points[points.length - 1].x - 24 : 1200;

  let boundedPosX = rawPosX;
  let boundedVx = newVx;
  if (boundedPosX < minX) {
    boundedPosX = minX;
    boundedVx = Math.abs(boundedVx) * 0.2; // Soft inward damping
  } else if (boundedPosX > maxX) {
    boundedPosX = maxX;
    boundedVx = -Math.abs(boundedVx) * 0.2; // Soft inward damping
  }

  let boundedPosY = rawPosY;
  let boundedVy = newVy;
  if (boundedPosY < 30) {
    boundedPosY = 30;
    boundedVy = Math.max(0, boundedVy); // Ceiling barrier
  }

  const updatedState: LanderPhysicsState = {
    ...state,
    position: { x: boundedPosX, y: boundedPosY },
    velocity: { x: boundedVx, y: boundedVy },
    rotation: newRotation,
    fuel: newFuel,
    throttle: newThrottle,
    isThrusting: input.thrust && hasFuelForThrust,
    isRotatingLeft: input.rotateLeft && rcsActive,
    isRotatingRight: input.rotateRight && rcsActive,
  };

  // 5. Collision & Landing Check
  return checkCollisionsAndLanding(updatedState, terrain);
}

/**
 * Checks transformed lander vertices against piecewise terrain and landing pad.
 */
export function checkCollisionsAndLanding(
  state: LanderPhysicsState,
  terrain: TerrainProfile
): LanderPhysicsState {
  const { position, rotation, scale, velocity } = state;
  const { points, landingPad } = terrain;

  // Compute world coordinates of critical contact points
  const leftFootWorld = transformLocalToWorld(
    LANDER_LOCAL_VERTICES.leftFootpad,
    position,
    rotation,
    scale
  );
  const rightFootWorld = transformLocalToWorld(
    LANDER_LOCAL_VERTICES.rightFootpad,
    position,
    rotation,
    scale
  );
  const nozzleWorld = transformLocalToWorld(
    LANDER_LOCAL_VERTICES.engineNozzle,
    position,
    rotation,
    scale
  );
  const cabinApexWorld = transformLocalToWorld(
    LANDER_LOCAL_VERTICES.cabinApex,
    position,
    rotation,
    scale
  );
  const leftShoulderWorld = transformLocalToWorld(
    LANDER_LOCAL_VERTICES.leftStrutShoulder,
    position,
    rotation,
    scale
  );
  const rightShoulderWorld = transformLocalToWorld(
    LANDER_LOCAL_VERTICES.rightStrutShoulder,
    position,
    rotation,
    scale
  );

  // Check terrain height at horizontal positions of each vertex
  const leftFootTerrainY = getTerrainHeightAt(leftFootWorld.x, points);
  const rightFootTerrainY = getTerrainHeightAt(rightFootWorld.x, points);
  const nozzleTerrainY = getTerrainHeightAt(nozzleWorld.x, points);
  const cabinTerrainY = getTerrainHeightAt(cabinApexWorld.x, points);
  const leftShoulderTerrainY = getTerrainHeightAt(leftShoulderWorld.x, points);
  const rightShoulderTerrainY = getTerrainHeightAt(rightShoulderWorld.x, points);

  // Convert velocities to m/s for tolerance validation
  const vVerticalMs = velocity.y / SIMULATION_CONFIG.PIXELS_PER_METER;
  const vHorizontalMs = Math.abs(velocity.x) / SIMULATION_CONFIG.PIXELS_PER_METER;
  const tiltDeg = Math.abs((rotation * 180) / Math.PI);

  // Check if either footpad or hull has breached the terrain elevation
  const leftFootPenetrated = leftFootWorld.y >= leftFootTerrainY;
  const rightFootPenetrated = rightFootWorld.y >= rightFootTerrainY;
  const nozzlePenetrated = nozzleWorld.y >= nozzleTerrainY;
  const cabinPenetrated = cabinApexWorld.y >= cabinTerrainY;
  const shoulderPenetrated =
    leftShoulderWorld.y >= leftShoulderTerrainY || rightShoulderWorld.y >= rightShoulderTerrainY;

  const anyContact =
    leftFootPenetrated ||
    rightFootPenetrated ||
    nozzlePenetrated ||
    cabinPenetrated ||
    shoulderPenetrated;

  if (!anyContact) {
    return state; // Still airborne
  }

  // -------------------------------------------------------------
  // CONTACT DETECTED: Determine if it is a safe landing or crash
  // -------------------------------------------------------------

  // Landing pad boundary check: Both footpads must be within pad horizontal boundaries
  const padMargin = 14; // px tolerance for footpad saucers
  const onPadX =
    leftFootWorld.x >= landingPad.startX - padMargin &&
    leftFootWorld.x <= landingPad.endX + padMargin &&
    rightFootWorld.x >= landingPad.startX - padMargin &&
    rightFootWorld.x <= landingPad.endX + padMargin;

  // Case A: Touching terrain outside designated landing pad
  if (!onPadX) {
    return {
      ...state,
      velocity: { x: 0, y: 0 },
      throttle: 0,
      isThrusting: false,
      status: 'CRASHED',
      landingMessage: 'TERRAIN IMPACT: Lander touched down outside the designated landing pad on rugged lunar regolith.',
      collisionDetails: {
        impactPoint: leftFootPenetrated ? leftFootWorld : rightFootWorld,
        partName: 'Landing Gear Out of Bounds',
      },
    };
  }

  // Case B: Severe hull/cabin contact (capsized or inverted)
  if (cabinPenetrated || shoulderPenetrated || tiltDeg > 45) {
    return {
      ...state,
      velocity: { x: 0, y: 0 },
      throttle: 0,
      isThrusting: false,
      status: 'CRASHED',
      landingMessage: `HULL COMPROMISED: Severe attitude inversion (${tiltDeg.toFixed(1)}°). Ascent stage cabin impacted the surface.`,
      collisionDetails: {
        impactPoint: cabinApexWorld,
        partName: 'Cabin Structure Breach',
      },
    };
  }

  // Case C: Engine nozzle strike before footpads
  if (nozzlePenetrated && !leftFootPenetrated && !rightFootPenetrated) {
    return {
      ...state,
      velocity: { x: 0, y: 0 },
      throttle: 0,
      isThrusting: false,
      status: 'CRASHED',
      landingMessage: 'ENGINE DAMAGE: Descent rocket engine nozzle struck pad before landing gear engaged.',
      collisionDetails: {
        impactPoint: nozzleWorld,
        partName: 'Descent Engine Bell Nozzle',
      },
    };
  }

  // Case D: On-pad touchdown - Validate descent velocity and attitude tolerances
  const isVerticalSafe = vVerticalMs <= SIMULATION_CONFIG.MAX_LANDING_VERTICAL_SPEED_MS;
  const isHorizontalSafe = vHorizontalMs <= SIMULATION_CONFIG.MAX_LANDING_HORIZONTAL_SPEED_MS;
  const isTiltSafe = tiltDeg <= SIMULATION_CONFIG.MAX_LANDING_TILT_DEG;

  if (isVerticalSafe && isHorizontalSafe && isTiltSafe) {
    // SUCCESSFUL NOMINAL TOUCHDOWN
    // Settle cleanly resting on top of the pad
    const settledY = landingPad.y - LANDER_LOCAL_VERTICES.leftFootpad.y * scale;
    return {
      ...state,
      position: { x: position.x, y: settledY },
      velocity: { x: 0, y: 0 },
      rotation: 0, // Settle cleanly upright on pad
      throttle: 0,
      isThrusting: false,
      status: 'LANDED',
      landingMessage: `TOUCHDOWN NOMINAL: Tranquillity Base confirmed! Descent rate ${vVerticalMs.toFixed(2)} m/s, lateral drift ${vHorizontalMs.toFixed(2)} m/s, tilt ${tiltDeg.toFixed(1)}°.`,
    };
  }

  // Crash due to exceeding specific flight envelope tolerances
  let crashReason = 'HARD IMPACT CRASH:';
  if (!isVerticalSafe) {
    crashReason += ` Excessive vertical descent rate (${vVerticalMs.toFixed(2)} m/s > ${SIMULATION_CONFIG.MAX_LANDING_VERTICAL_SPEED_MS} m/s limit) collapsed primary struts.`;
  }
  if (!isHorizontalSafe) {
    crashReason += ` Excessive lateral drift (${vHorizontalMs.toFixed(2)} m/s > ${SIMULATION_CONFIG.MAX_LANDING_HORIZONTAL_SPEED_MS} m/s limit) sheared landing footpads.`;
  }
  if (!isTiltSafe) {
    crashReason += ` Excessive attitude tilt (${tiltDeg.toFixed(1)}° > ${SIMULATION_CONFIG.MAX_LANDING_TILT_DEG}° limit) tipped the vehicle onto its side.`;
  }

  return {
    ...state,
    velocity: { x: 0, y: 0 },
    throttle: 0,
    isThrusting: false,
    status: 'CRASHED',
    landingMessage: crashReason,
    collisionDetails: {
      impactPoint: leftFootPenetrated ? leftFootWorld : rightFootWorld,
      partName: 'Landing Strut Assembly',
    },
  };
}

/**
 * Calculates current clearance altitude from the lowest footpad to the terrain surface directly underneath.
 */
export function calculateRadarAltitude(
  state: LanderPhysicsState,
  points: TerrainPoint[]
): number {
  const leftFootWorld = transformLocalToWorld(
    LANDER_LOCAL_VERTICES.leftFootpad,
    state.position,
    state.rotation,
    state.scale
  );
  const rightFootWorld = transformLocalToWorld(
    LANDER_LOCAL_VERTICES.rightFootpad,
    state.position,
    state.rotation,
    state.scale
  );

  const lowestFootY = Math.max(leftFootWorld.y, rightFootWorld.y);
  const terrainUnderLeft = getTerrainHeightAt(leftFootWorld.x, points);
  const terrainUnderRight = getTerrainHeightAt(rightFootWorld.x, points);
  const highestTerrainY = Math.min(terrainUnderLeft, terrainUnderRight);

  const altitudePixels = Math.max(0, highestTerrainY - lowestFootY);
  return Math.round(altitudePixels / SIMULATION_CONFIG.PIXELS_PER_METER);
}

/**
 * @file drawLander.ts
 * Vector 2D rendering module for the Apollo-style Lunar Excursion Module (LEM).
 * Uses pure Canvas 2D primitives and hierarchical 2D matrix transformations.
 */

import { Transform2D, CGDebugOptions } from '../types/game';

export interface LanderDrawOptions {
  thrust?: number; // 0 to 1
  rcsLeft?: boolean;
  rcsRight?: boolean;
  debug?: Partial<CGDebugOptions>;
}

/**
 * Draws the Lunar Lander centered at its local coordinate origin (0, 0),
 * applying the specified world transform: Translation -> Rotation -> Scaling.
 */
export function drawLander(
  ctx: CanvasRenderingContext2D,
  transform: Transform2D,
  options: LanderDrawOptions = {}
): void {
  const { position, rotation, scale } = transform;
  const thrust = options.thrust ?? 0;
  const debug = options.debug;

  ctx.save();

  // 1. Apply Hierarchical Transformation Matrix: T * R * S
  ctx.translate(position.x, position.y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);

  // Model Coordinates convention:
  // Origin (0,0) is at the Center of Mass.
  // -Y is UP (Ascent stage & docking tunnel)
  // +Y is DOWN (Descent stage, engine nozzle & landing footpads)
  // -X is PORT (Left)
  // +X is STARBOARD (Right)

  // -------------------------------------------------------------
  // A. MAIN ENGINE PLUME (Rendered behind the craft)
  // -------------------------------------------------------------
  if (thrust > 0.05) {
    drawEnginePlume(ctx, thrust);
  }

  // -------------------------------------------------------------
  // B. LANDING GEAR & STRUTS (Descent Stage Outriggers)
  // -------------------------------------------------------------
  drawLandingGear(ctx);

  // -------------------------------------------------------------
  // C. DESCENT ENGINE NOZZLE
  // -------------------------------------------------------------
  drawEngineNozzle(ctx);

  // -------------------------------------------------------------
  // D. DESCENT STAGE (Octagonal Gold-Foil Core)
  // -------------------------------------------------------------
  drawDescentStage(ctx);

  // -------------------------------------------------------------
  // E. ASCENT STAGE (Crew Cabin & Forward Section)
  // -------------------------------------------------------------
  drawAscentStage(ctx);

  // -------------------------------------------------------------
  // F. REACTION CONTROL SYSTEM (RCS Quad Thrusters)
  // -------------------------------------------------------------
  drawRcsQuads(ctx, options.rcsLeft, options.rcsRight);

  // -------------------------------------------------------------
  // G. ANTENNAS & SENSORS
  // -------------------------------------------------------------
  drawAntennas(ctx);

  // -------------------------------------------------------------
  // H. COMPUTER GRAPHICS DEBUG OVERLAYS
  // -------------------------------------------------------------
  if (debug?.showLocalAxes) {
    drawLocalAxes(ctx);
  }
  if (debug?.showCenterOfMass) {
    drawCenterOfMass(ctx);
  }
  if (debug?.showWireframe) {
    drawBoundingWireframe(ctx);
  }

  ctx.restore();
}

/**
 * Renders the descent rocket exhaust plume with radial and linear gradients.
 */
function drawEnginePlume(ctx: CanvasRenderingContext2D, thrust: number): void {
  const plumeLength = 28 + thrust * 42;
  const plumeWidth = 14 + thrust * 12;

  ctx.save();
  // Outer flame glow
  const outerGrad = ctx.createRadialGradient(0, 18 + plumeLength * 0.4, 4, 0, 18 + plumeLength * 0.5, plumeLength);
  outerGrad.addColorStop(0, 'rgba(56, 189, 248, 0.9)'); // Cyan plasma core
  outerGrad.addColorStop(0.35, 'rgba(249, 115, 22, 0.7)'); // Amber flame
  outerGrad.addColorStop(0.8, 'rgba(239, 68, 68, 0.3)'); // Faint red fringe
  outerGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

  ctx.beginPath();
  ctx.moveTo(-plumeWidth * 0.5, 18);
  ctx.quadraticCurveTo(-plumeWidth * 0.9, 18 + plumeLength * 0.45, 0, 18 + plumeLength);
  ctx.quadraticCurveTo(plumeWidth * 0.9, 18 + plumeLength * 0.45, plumeWidth * 0.5, 18);
  ctx.closePath();
  ctx.fillStyle = outerGrad;
  ctx.fill();

  // Inner hyper-hot core
  ctx.beginPath();
  ctx.moveTo(-plumeWidth * 0.28, 18);
  ctx.lineTo(0, 18 + plumeLength * 0.55);
  ctx.lineTo(plumeWidth * 0.28, 18);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.restore();
}

/**
 * Renders the primary landing struts, cantilever secondary braces, and dish footpads.
 */
function drawLandingGear(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.lineWidth = 1.75;
  ctx.strokeStyle = '#94a3b8'; // Titanium strut color
  ctx.fillStyle = '#64748b';

  // Left Main Leg
  ctx.beginPath();
  ctx.moveTo(-16, 12);
  ctx.lineTo(-38, 36);
  ctx.stroke();

  // Left Outrigger Secondary Strut
  ctx.beginPath();
  ctx.moveTo(-8, 14);
  ctx.lineTo(-38, 36);
  ctx.stroke();

  // Left Footpad (inverted saucer)
  ctx.beginPath();
  ctx.ellipse(-38, 37, 7, 2.5, -0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#cbd5e1';
  ctx.fill();
  ctx.stroke();

  // Right Main Leg
  ctx.beginPath();
  ctx.moveTo(16, 12);
  ctx.lineTo(38, 36);
  ctx.stroke();

  // Right Outrigger Secondary Strut
  ctx.beginPath();
  ctx.moveTo(8, 14);
  ctx.lineTo(38, 36);
  ctx.stroke();

  // Right Footpad (inverted saucer)
  ctx.beginPath();
  ctx.ellipse(38, 37, 7, 2.5, 0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#cbd5e1';
  ctx.fill();
  ctx.stroke();

  // Descent ladder on left strut
  ctx.beginPath();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let step = 0; step < 4; step++) {
    const t = 0.35 + step * 0.15;
    const lx = -16 + (-38 - -16) * t;
    const ly = 12 + (36 - 12) * t;
    ctx.moveTo(lx - 2, ly - 1);
    ctx.lineTo(lx + 2, ly + 1);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the bell-shaped descent rocket engine nozzle.
 */
function drawEngineNozzle(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-5, 12);
  ctx.lineTo(-9, 19);
  ctx.lineTo(9, 19);
  ctx.lineTo(5, 12);
  ctx.closePath();
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Heat shielding ring
  ctx.beginPath();
  ctx.ellipse(0, 19, 9, 2.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws the octagonal descent stage with gold Mylar foil thermal blanket texture.
 */
function drawDescentStage(ctx: CanvasRenderingContext2D): void {
  ctx.save();

  // Octagonal base geometry
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-24, 6);
  ctx.lineTo(-24, 12);
  ctx.lineTo(-18, 14);
  ctx.lineTo(18, 14);
  ctx.lineTo(24, 12);
  ctx.lineTo(24, 6);
  ctx.lineTo(18, 0);
  ctx.closePath();

  // Gold foil gradient
  const goldGrad = ctx.createLinearGradient(-24, 0, 24, 14);
  goldGrad.addColorStop(0, '#d97706'); // Deep amber
  goldGrad.addColorStop(0.3, '#f59e0b'); // Mylar gold
  goldGrad.addColorStop(0.7, '#fbbf24'); // Foil sheen
  goldGrad.addColorStop(1, '#b45309'); // Dark fold
  ctx.fillStyle = goldGrad;
  ctx.fill();

  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Thermal foil quilting seam pattern
  ctx.save();
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.45)';
  ctx.lineWidth = 0.8;
  for (let x = -18; x <= 18; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 14);
    ctx.stroke();
  }
  ctx.restore();

  // Oxidizer tank blisters
  ctx.beginPath();
  ctx.arc(-13, 7, 3.5, 0, Math.PI * 2);
  ctx.arc(13, 7, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#e2e8f0';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the faceted Ascent Stage cabin with forward EVA windows and docking tunnel.
 */
function drawAscentStage(ctx: CanvasRenderingContext2D): void {
  ctx.save();

  // Top Docking Tunnel Collar
  ctx.beginPath();
  ctx.rect(-5, -26, 10, 5);
  ctx.fillStyle = '#64748b';
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Main Cabin Faceted Shell
  ctx.beginPath();
  ctx.moveTo(-12, -21);
  ctx.lineTo(-19, -15);
  ctx.lineTo(-21, -4);
  ctx.lineTo(-16, 0);
  ctx.lineTo(16, 0);
  ctx.lineTo(21, -4);
  ctx.lineTo(19, -15);
  ctx.lineTo(12, -21);
  ctx.closePath();

  const cabinGrad = ctx.createLinearGradient(-20, -20, 20, 0);
  cabinGrad.addColorStop(0, '#334155');
  cabinGrad.addColorStop(0.5, '#475569');
  cabinGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = cabinGrad;
  ctx.fill();

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Forward EVA Triangular Triangular Cockpit Windows
  // Left pilot window
  ctx.beginPath();
  ctx.moveTo(-11, -12);
  ctx.lineTo(-4, -15);
  ctx.lineTo(-4, -8);
  ctx.closePath();
  ctx.fillStyle = '#0284c7'; // Deep aerospace glass
  ctx.fill();
  ctx.strokeStyle = '#38bdf8'; // Glass rim
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // Right copilot window
  ctx.beginPath();
  ctx.moveTo(11, -12);
  ctx.lineTo(4, -15);
  ctx.lineTo(4, -8);
  ctx.closePath();
  ctx.fillStyle = '#0284c7';
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // Ingress/Egress EVA Square Hatch
  ctx.beginPath();
  ctx.rect(-3.5, -7, 7, 7);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders Reaction Control System (RCS) attitude thruster quads.
 */
function drawRcsQuads(ctx: CanvasRenderingContext2D, rcsLeft?: boolean, rcsRight?: boolean): void {
  ctx.save();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;

  // Left RCS Block
  const lx = -21;
  const ly = -10;
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.lineTo(lx - 5, ly);
  ctx.moveTo(lx - 2.5, ly - 3);
  ctx.lineTo(lx - 2.5, ly + 3);
  ctx.stroke();

  // Right RCS Block
  const rx = 21;
  const ry = -10;
  ctx.beginPath();
  ctx.moveTo(rx, ry);
  ctx.lineTo(rx + 5, ry);
  ctx.moveTo(rx + 2.5, ry - 3);
  ctx.lineTo(rx + 2.5, ry + 3);
  ctx.stroke();

  // RCS Thruster Puffs (if fired)
  if (rcsLeft) {
    ctx.beginPath();
    ctx.arc(lx - 7, ly, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.fill();
  }
  if (rcsRight) {
    ctx.beginPath();
    ctx.arc(rx + 7, ry, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Renders high-gain S-band steerable communications dish and rendezvous radar.
 */
function drawAntennas(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;

  // Radar antenna mast
  ctx.beginPath();
  ctx.moveTo(8, -21);
  ctx.lineTo(14, -28);
  ctx.stroke();

  // Parabolic dish
  ctx.beginPath();
  ctx.arc(16, -30, 4, Math.PI * 0.7, Math.PI * 1.8);
  ctx.stroke();

  ctx.restore();
}

/**
 * Computer Graphics debug: Local coordinate axes [u, v].
 */
function drawLocalAxes(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.lineWidth = 1.5;

  // Local Forward (U-axis / -Y in screen space) - RED
  ctx.strokeStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -42);
  ctx.stroke();

  // Arrowhead
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(0, -46);
  ctx.lineTo(-3, -40);
  ctx.lineTo(3, -40);
  ctx.closePath();
  ctx.fill();

  // Local Lateral (V-axis / +X in screen space) - GREEN
  ctx.strokeStyle = '#22c55e';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(42, 0);
  ctx.stroke();

  // Arrowhead
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.moveTo(46, 0);
  ctx.lineTo(40, -3);
  ctx.lineTo(40, 3);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Computer Graphics debug: Center of Mass indicator.
 */
function drawCenterOfMass(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(6, 0);
  ctx.moveTo(0, -6);
  ctx.lineTo(0, 6);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/**
 * Computer Graphics debug: Model bounding wireframe box.
 */
function drawBoundingWireframe(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.strokeRect(-42, -32, 84, 70);
  ctx.restore();
}

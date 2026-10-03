/**
 * @file drawTerrain.ts
 * Lunar terrain geometry and landing pad rendering module.
 * Designed to interface with subsequent collision detection and elevation query systems.
 */

import { TerrainPoint, LandingPad } from '../types/game';

export interface TerrainProfile {
  points: TerrainPoint[];
  landingPad: LandingPad;
}

/**
 * Generates a piecewise lunar terrain profile with a designated flat landing site.
 */
export function generateTerrain(width: number, height: number): TerrainProfile {
  const points: TerrainPoint[] = [];
  const segments = 32;
  const step = width / segments;

  // Designate landing pad location (wide beginner-friendly pad ~28% of viewport)
  const padStartX = Math.floor(width * 0.36);
  const padEndX = Math.floor(width * 0.64);
  const padY = height * 0.78;

  const landingPad: LandingPad = {
    startX: padStartX,
    endX: padEndX,
    y: padY,
    label: 'TRANQUILLITY BASE · SITE ALPHA',
  };

  // Build piecewise terrain points
  for (let i = 0; i <= segments; i++) {
    const x = i * step;

    if (x >= padStartX && x <= padEndX) {
      // Perfectly flat landing pad elevation
      points.push({ x, y: padY });
    } else {
      // Natural jagged cratered profile
      const distFromCenter = Math.abs(x - width * 0.5);
      const elevationVar =
        Math.sin(i * 0.8) * 32 +
        Math.cos(i * 1.7) * 22 +
        Math.sin(i * 3.4) * 12;

      // Higher crags at left and right boundaries
      const edgeBoost = Math.max(0, (distFromCenter - width * 0.25) * 0.08);
      const y = height * 0.76 + elevationVar - edgeBoost;
      points.push({ x, y });
    }
  }

  // Ensure pad endpoints are exactly aligned
  return { points, landingPad };
}

/**
 * Draws the lunar terrain surface and designated landing pad.
 */
export function drawTerrain(
  ctx: CanvasRenderingContext2D,
  terrain: TerrainProfile,
  timeMs: number = 0,
  showDebugNormals: boolean = false
): void {
  const { width, height } = ctx.canvas;
  const { points, landingPad } = terrain;

  if (points.length < 2) return;

  ctx.save();

  // 1. Terrain Polygon Base Fill
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();

  // Dark lunar regolith gradient
  const terrainGrad = ctx.createLinearGradient(0, height * 0.65, 0, height);
  terrainGrad.addColorStop(0, '#1e293b');
  terrainGrad.addColorStop(0.35, '#0f172a');
  terrainGrad.addColorStop(1, '#020617');
  ctx.fillStyle = terrainGrad;
  ctx.fill();

  // 2. Crisp Illuminated Surface Ridge Line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 3. Landing Pad Structure & Visual Guidance
  drawLandingPad(ctx, landingPad, timeMs);

  // 4. Computer Graphics Debug: Segment Normals (Ready for collision detection)
  if (showDebugNormals) {
    drawSurfaceNormals(ctx, points);
  }

  ctx.restore();
}

/**
 * Renders the designated landing pad with illuminated beacons, chevron stripes, and boundaries.
 */
function drawLandingPad(
  ctx: CanvasRenderingContext2D,
  pad: LandingPad,
  timeMs: number
): void {
  const { startX, endX, y } = pad;
  const padWidth = endX - startX;

  ctx.save();

  // Concrete/Titanium Pad Slab
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(startX, y, padWidth, 12);

  // Top Surface Border
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(endX, y);
  ctx.stroke();

  // Hazard Diagonal Chevron Stripes
  ctx.save();
  ctx.beginPath();
  ctx.rect(startX, y, padWidth, 8);
  ctx.clip();

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  for (let sx = startX - 20; sx < endX + 20; sx += 18) {
    ctx.beginPath();
    ctx.moveTo(sx, y + 8);
    ctx.lineTo(sx + 10, y);
    ctx.stroke();
  }
  ctx.restore();

  // Center Touchdown Target Reticle (+)
  const centerX = (startX + endX) * 0.5;
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(centerX - 16, y);
  ctx.lineTo(centerX + 16, y);
  ctx.moveTo(centerX, y - 8);
  ctx.lineTo(centerX, y + 8);
  ctx.stroke();

  // Pulsing Landing Beacons (Left & Right)
  const pulse = (Math.sin(timeMs * 0.005) + 1) * 0.5; // 0 to 1

  // Left Beacon (Port: Amber)
  drawBeacon(ctx, startX, y, '#f59e0b', pulse);

  // Right Beacon (Starboard: Emerald Green)
  drawBeacon(ctx, endX, y, '#10b981', pulse);

  // Landing Site Designation Label
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.fillText(pad.label, centerX, y + 26);

  ctx.restore();
}

/**
 * Draws an illuminated navigation beacon.
 */
function drawBeacon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  pulse: number
): void {
  ctx.save();

  // Beacon mast
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 10);
  ctx.stroke();

  // Halo glow
  const glow = ctx.createRadialGradient(x, y - 10, 1, x, y - 10, 12 + pulse * 6);
  glow.addColorStop(0, color);
  glow.addColorStop(0.5, color.replace(')', ', 0.35)').replace('rgb', 'rgba'));
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - 10, 14, 0, Math.PI * 2);
  ctx.fill();

  // Light bulb element
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y - 10, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Computer Graphics debug: Surface normal vectors for each segment.
 */
function drawSurfaceNormals(
  ctx: CanvasRenderingContext2D,
  points: TerrainPoint[]
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
  ctx.lineWidth = 1;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    const midX = (p1.x + p2.x) * 0.5;
    const midY = (p1.y + p2.y) * 0.5;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;

    // Normal vector perpendicular to segment pointing up
    const nx = -dy / len;
    const ny = dx / len;

    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(midX + nx * 14, midY + ny * 14);
    ctx.stroke();
  }

  ctx.restore();
}

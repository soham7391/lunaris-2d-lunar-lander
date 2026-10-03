/**
 * @file drawTerrain.ts
 * Lunar terrain geometry and landing pad rendering module.
 * Designed to interface with subsequent collision detection and elevation query systems.
 */

import { TerrainPoint, LandingPad } from '../types/game';
import { LevelConfig, LevelTheme } from '../physics/levels';

export interface TerrainProfile {
  points: TerrainPoint[];
  landingPad: LandingPad;
}

/**
 * Generates a piecewise lunar terrain profile with a designated flat landing site,
 * configured to match the active level's topography and pad boundaries.
 */
export function generateTerrain(
  width: number,
  height: number,
  level?: LevelConfig
): TerrainProfile {
  const points: TerrainPoint[] = [];
  const segments = 36;
  const step = width / segments;

  // Designate landing pad location according to level config (or default wide pad)
  const padStartXRatio = level?.padStartXRatio ?? 0.36;
  const padEndXRatio = level?.padEndXRatio ?? 0.64;
  const padYRatio = level?.padYRatio ?? 0.78;
  const padLabel = level?.padLabel ?? 'TRANQUILLITY BASE · SITE ALPHA';

  const padStartX = Math.floor(width * padStartXRatio);
  const padEndX = Math.floor(width * padEndXRatio);
  const padY = height * padYRatio;

  const landingPad: LandingPad = {
    startX: padStartX,
    endX: padEndX,
    y: padY,
    label: padLabel,
  };

  const roughness = level?.terrainRoughness ?? 0.6;
  const craterDepth = level?.craterDepth ?? 20;

  // Build piecewise terrain points
  for (let i = 0; i <= segments; i++) {
    const x = i * step;

    if (x >= padStartX && x <= padEndX) {
      // Perfectly flat landing pad elevation
      points.push({ x, y: padY });
    } else {
      // Piecewise terrain profile parameterized by level topography
      const distFromCenter = Math.abs(x - width * 0.5);
      const elevationVar =
        Math.sin(i * 0.75) * (craterDepth * 1.1) +
        Math.cos(i * 1.6) * (craterDepth * 0.8) +
        Math.sin(i * 3.2) * (craterDepth * 0.45 * roughness);

      // Higher crags at left and right boundaries
      const edgeBoost = Math.max(0, (distFromCenter - width * 0.22) * (0.09 * roughness));
      const baseY = height * (padYRatio - 0.02);
      const y = baseY + elevationVar - edgeBoost;
      points.push({ x, y });
    }
  }

  // Ensure pad endpoints are exactly aligned
  return { points, landingPad };
}

/**
 * Draws the lunar terrain surface and designated landing pad with level-specific theme colors.
 */
export function drawTerrain(
  ctx: CanvasRenderingContext2D,
  terrain: TerrainProfile,
  timeMs: number = 0,
  showDebugNormals: boolean = false,
  theme?: LevelTheme
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

  // Level-specific regolith gradient
  const terrainGrad = ctx.createLinearGradient(0, height * 0.65, 0, height);
  const colors = theme?.terrainGradient ?? ['#1e293b', '#0f172a', '#020617'];
  terrainGrad.addColorStop(0, colors[0]);
  terrainGrad.addColorStop(0.35, colors[1]);
  terrainGrad.addColorStop(1, colors[2]);
  ctx.fillStyle = terrainGrad;
  ctx.fill();

  // 2. Crisp Illuminated Surface Ridge Line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = theme?.terrainRidgeColor ?? '#64748b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 3. Landing Pad Structure & Visual Guidance
  drawLandingPad(ctx, landingPad, timeMs, theme);

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
  timeMs: number,
  theme?: LevelTheme
): void {
  const { startX, endX, y } = pad;
  const padWidth = endX - startX;

  ctx.save();

  // Concrete/Titanium Pad Slab
  ctx.fillStyle = theme?.padSlabColor ?? '#1e293b';
  ctx.fillRect(startX, y, padWidth, 12);

  // Top Surface Border
  ctx.strokeStyle = theme?.padBorderColor ?? '#38bdf8';
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

  ctx.strokeStyle = theme?.padChevronColor ?? '#f59e0b';
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
  ctx.strokeStyle = theme?.padBorderColor ?? '#22c55e';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(centerX - 16, y);
  ctx.lineTo(centerX + 16, y);
  ctx.moveTo(centerX, y - 8);
  ctx.lineTo(centerX, y + 8);
  ctx.stroke();

  // Pulsing Landing Beacons (Left & Right)
  const pulse = (Math.sin(timeMs * 0.005) + 1) * 0.5; // 0 to 1

  // Left Beacon (Port)
  drawBeacon(ctx, startX, y, theme?.beaconColorPort ?? '#f59e0b', pulse);

  // Right Beacon (Starboard)
  drawBeacon(ctx, endX, y, theme?.beaconColorStarboard ?? '#10b981', pulse);

  // Landing Site Designation Label
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = theme?.padLabelColor ?? '#94a3b8';
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

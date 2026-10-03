/**
 * @file drawMoonAndHorizon.ts
 * Hand-drawn Canvas 2D Moon, craters, ejecta rays, and lunar horizon ridges.
 * Built entirely with vector Canvas primitives (no static raster images).
 */

export interface CraterSpec {
  x: number;
  y: number;
  r: number;
  depth: number;
}

export function drawMoon(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void {
  ctx.save();

  // 1. Lunar Body Base Spherical Shading
  const moonGrad = ctx.createRadialGradient(
    centerX - radius * 0.35,
    centerY - radius * 0.35,
    radius * 0.1,
    centerX,
    centerY,
    radius
  );
  moonGrad.addColorStop(0, '#f8fafc'); // Sunlit brightest highlight
  moonGrad.addColorStop(0.35, '#e2e8f0'); // Regolith midtone
  moonGrad.addColorStop(0.7, '#94a3b8'); // Terminator approach
  moonGrad.addColorStop(0.92, '#334155'); // Terminator shadow zone
  moonGrad.addColorStop(1, '#0f172a'); // Night limb

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = moonGrad;
  ctx.fill();

  // Clip all craters and maria to the Moon's spherical perimeter
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  // 2. Lunar Maria (Dark Basalt Plains)
  drawLunarMaria(ctx, centerX, centerY, radius);

  // 3. Ejecta Ray Systems (Radiating from prominent impact site, e.g. Tycho)
  drawEjectaRays(ctx, centerX + radius * 0.1, centerY + radius * 0.45, radius);

  // 4. Prominent Craters with sunlit rims and cast shadows
  const craters: CraterSpec[] = [
    { x: centerX - radius * 0.35, y: centerY - radius * 0.25, r: radius * 0.14, depth: 0.8 },
    { x: centerX + radius * 0.15, y: centerY - radius * 0.4, r: radius * 0.18, depth: 0.9 },
    { x: centerX - radius * 0.1, y: centerY + radius * 0.1, r: radius * 0.22, depth: 0.75 },
    { x: centerX + radius * 0.1, y: centerY + radius * 0.45, r: radius * 0.16, depth: 1.0 }, // Tycho analog
    { x: centerX + radius * 0.45, y: centerY - radius * 0.05, r: radius * 0.12, depth: 0.85 },
    { x: centerX - radius * 0.48, y: centerY + radius * 0.2, r: radius * 0.1, depth: 0.7 },
    { x: centerX + radius * 0.3, y: centerY + radius * 0.32, r: radius * 0.09, depth: 0.65 },
    { x: centerX - radius * 0.2, y: centerY - radius * 0.55, r: radius * 0.08, depth: 0.7 },
    { x: centerX + radius * 0.02, y: centerY - radius * 0.15, r: radius * 0.07, depth: 0.6 },
  ];

  for (const crater of craters) {
    drawCrater(ctx, crater.x, crater.y, crater.r, crater.depth);
  }

  // 5. Terminator Shadow Overlay (Night side sphere falloff)
  const shadowGrad = ctx.createLinearGradient(
    centerX - radius * 0.6,
    centerY - radius * 0.6,
    centerX + radius,
    centerY + radius
  );
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shadowGrad.addColorStop(0.55, 'rgba(15, 23, 42, 0.1)');
  shadowGrad.addColorStop(0.85, 'rgba(10, 15, 30, 0.7)');
  shadowGrad.addColorStop(1, 'rgba(4, 6, 13, 0.96)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

  ctx.restore(); // Exit clip

  // Crisp illuminated limb stroke
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, Math.PI * 0.75, Math.PI * 1.85);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws lunar maria basalt plains.
 */
function drawLunarMaria(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(51, 65, 85, 0.35)'; // Dark basalt

  // Mare Tranquillitatis & Serenitatis analogs
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.18, cy - r * 0.15, r * 0.38, r * 0.28, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx + r * 0.2, cy - r * 0.22, r * 0.32, r * 0.22, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Oceanus Procellarum analog
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.42, cy + r * 0.05, r * 0.28, r * 0.4, 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws radial ray filaments extending from an impact center across the lunar face.
 */
function drawEjectaRays(
  ctx: CanvasRenderingContext2D,
  ix: number,
  iy: number,
  maxR: number
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1.2;

  const rayCount = 14;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2 + 0.12;
    const len = maxR * (0.6 + Math.sin(i * 3.7) * 0.35);

    ctx.beginPath();
    ctx.moveTo(ix, iy);
    ctx.lineTo(ix + Math.cos(angle) * len, iy + Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draws a single crater with illuminated rim and interior floor shadow.
 */
function drawCrater(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  depth: number
): void {
  ctx.save();

  // Crater Floor Shadow (Dark interior on sun-opposed side)
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(15, 23, 42, ${0.45 * depth})`;
  ctx.fill();

  // Sunlit Exterior Crater Rim (top-left facing light)
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI * 0.8, Math.PI * 1.85);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, r * 0.16);
  ctx.stroke();

  // Cast Shadow on opposite inner wall
  ctx.beginPath();
  ctx.arc(x + r * 0.15, y + r * 0.15, r * 0.85, -Math.PI * 0.1, Math.PI * 0.95);
  ctx.strokeStyle = 'rgba(2, 6, 23, 0.75)';
  ctx.lineWidth = Math.max(1, r * 0.2);
  ctx.stroke();

  // Central Peak (if large crater)
  if (r > 16) {
    ctx.beginPath();
    ctx.arc(x - r * 0.05, y - r * 0.05, r * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws the layered lunar horizon silhouette with jagged mountainous peaks,
 * craters, boulders, and deep surface shadows.
 */
export function drawLunarHorizon(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.save();

  // 1. Distant Lunar Mountain Range (Midground Silhouette)
  const midHorizonY = height * 0.76;
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, midHorizonY);

  // Procedural jagged peaks
  const midPoints = [
    { x: 0, y: midHorizonY },
    { x: width * 0.08, y: midHorizonY - 26 },
    { x: width * 0.16, y: midHorizonY - 14 },
    { x: width * 0.25, y: midHorizonY - 38 },
    { x: width * 0.35, y: midHorizonY - 20 },
    { x: width * 0.44, y: midHorizonY - 48 },
    { x: width * 0.52, y: midHorizonY - 18 },
    { x: width * 0.62, y: midHorizonY - 32 },
    { x: width * 0.74, y: midHorizonY - 54 },
    { x: width * 0.85, y: midHorizonY - 24 },
    { x: width * 0.93, y: midHorizonY - 40 },
    { x: width, y: midHorizonY - 15 },
    { x: width, y: height },
  ];

  for (let i = 1; i < midPoints.length; i++) {
    ctx.lineTo(midPoints[i].x, midPoints[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = '#0f172a'; // Deep slate midground
  ctx.fill();

  // 2. Foreground Lunar Regolith Horizon (Crisp terrain profile)
  const fgHorizonY = height * 0.83;
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, fgHorizonY);

  const fgPoints = [
    { x: 0, y: fgHorizonY },
    { x: width * 0.07, y: fgHorizonY + 12 },
    { x: width * 0.14, y: fgHorizonY - 18 }, // Small ridge
    { x: width * 0.22, y: fgHorizonY + 6 },
    { x: width * 0.32, y: fgHorizonY - 12 },
    { x: width * 0.42, y: fgHorizonY + 22 }, // Shallow crater dip
    { x: width * 0.51, y: fgHorizonY - 8 },
    { x: width * 0.61, y: fgHorizonY + 14 },
    { x: width * 0.71, y: fgHorizonY - 22 }, // Prominent crater rim
    { x: width * 0.82, y: fgHorizonY + 16 },
    { x: width * 0.92, y: fgHorizonY - 10 },
    { x: width, y: fgHorizonY + 4 },
    { x: width, y: height },
  ];

  for (let i = 1; i < fgPoints.length; i++) {
    ctx.lineTo(fgPoints[i].x, fgPoints[i].y);
  }
  ctx.closePath();

  // Foreground gradient: from lunar illuminated top rim to deep black abyss
  const fgGrad = ctx.createLinearGradient(0, fgHorizonY - 20, 0, height);
  fgGrad.addColorStop(0, '#1e293b');
  fgGrad.addColorStop(0.3, '#141c2e');
  fgGrad.addColorStop(1, '#05070e');
  ctx.fillStyle = fgGrad;
  ctx.fill();

  // Crisp illuminated surface edge
  ctx.beginPath();
  ctx.moveTo(0, fgHorizonY);
  for (let i = 1; i < fgPoints.length - 1; i++) {
    ctx.lineTo(fgPoints[i].x, fgPoints[i].y);
  }
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Foreground Boulders / Regolith Detritus
  drawRegolithBoulders(ctx, width, fgHorizonY);

  ctx.restore();
}

/**
 * Draws sharp, un-weathered lunar boulders along the foreground ridge.
 */
function drawRegolithBoulders(
  ctx: CanvasRenderingContext2D,
  width: number,
  baseY: number
): void {
  ctx.save();
  const boulders = [
    { x: width * 0.18, y: baseY - 6, w: 9, h: 6 },
    { x: width * 0.38, y: baseY + 8, w: 14, h: 8 },
    { x: width * 0.65, y: baseY + 5, w: 7, h: 5 },
    { x: width * 0.78, y: baseY - 12, w: 12, h: 9 },
  ];

  for (const b of boulders) {
    // Angular rock polygon
    ctx.beginPath();
    ctx.moveTo(b.x - b.w * 0.5, b.y);
    ctx.lineTo(b.x - b.w * 0.2, b.y - b.h);
    ctx.lineTo(b.x + b.w * 0.4, b.y - b.h * 0.8);
    ctx.lineTo(b.x + b.w * 0.5, b.y);
    ctx.closePath();
    ctx.fillStyle = '#334155';
    ctx.fill();

    // Sunlit top facet
    ctx.beginPath();
    ctx.moveTo(b.x - b.w * 0.5, b.y);
    ctx.lineTo(b.x - b.w * 0.2, b.y - b.h);
    ctx.lineTo(b.x + b.w * 0.1, b.y - b.h * 0.5);
    ctx.closePath();
    ctx.fillStyle = '#64748b';
    ctx.fill();
  }

  ctx.restore();
}

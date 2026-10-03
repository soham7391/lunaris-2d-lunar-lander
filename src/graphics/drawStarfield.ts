/**
 * @file drawStarfield.ts
 * Procedural starfield and celestial backdrop renderer using pure Canvas 2D primitives.
 * Implements twinkling stars, color temperatures, and distant planetary crescent.
 */

export interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
}

/**
 * Generates an array of procedural star coordinates and properties for a given width and height.
 */
export function generateStarfield(width: number, height: number, count: number = 220): Star[] {
  const stars: Star[] = [];
  const colorPalette = [
    '#ffffff', // Crisp white
    '#e0f2fe', // Distant blue-white
    '#fef3c7', // Warm pale yellow
    '#fed7aa', // Faint amber
    '#bae6fd', // Deep sky blue
  ];

  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() < 0.85 ? Math.random() * 0.9 + 0.5 : Math.random() * 1.5 + 1.2,
      baseAlpha: Math.random() * 0.5 + 0.35,
      twinkleSpeed: Math.random() * 2 + 0.5,
      phase: Math.random() * Math.PI * 2,
      color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
    });
  }

  return stars;
}

/**
 * Draws the starfield onto the canvas context, applying time-based twinkling.
 */
export function drawStarfield(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  timeMs: number,
  options: { showEarthCrescent?: boolean; earthX?: number; earthY?: number } = {}
): void {
  const { width, height } = ctx.canvas;

  // Deep space base fill
  const spaceGrad = ctx.createLinearGradient(0, 0, 0, height);
  spaceGrad.addColorStop(0, '#04060d');
  spaceGrad.addColorStop(0.5, '#070a14');
  spaceGrad.addColorStop(1, '#090d1a');
  ctx.fillStyle = spaceGrad;
  ctx.fillRect(0, 0, width, height);

  // Faint celestial nebula gas (soft radial gradients)
  const nebula1 = ctx.createRadialGradient(width * 0.75, height * 0.25, 20, width * 0.75, height * 0.25, 320);
  nebula1.addColorStop(0, 'rgba(14, 165, 233, 0.04)');
  nebula1.addColorStop(0.6, 'rgba(99, 102, 241, 0.02)');
  nebula1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = nebula1;
  ctx.fillRect(0, 0, width, height);

  // Render Stars
  const seconds = timeMs * 0.001;
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const twinkle = Math.sin(seconds * star.twinkleSpeed + star.phase);
    const alpha = Math.max(0.15, Math.min(1.0, star.baseAlpha + twinkle * 0.3));

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = star.color;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle 4-point diffraction spike on prominent stars
    if (star.radius > 1.8) {
      ctx.strokeStyle = star.color;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(star.x - star.radius * 3, star.y);
      ctx.lineTo(star.x + star.radius * 3, star.y);
      ctx.moveTo(star.x, star.y - star.radius * 3);
      ctx.lineTo(star.x, star.y + star.radius * 3);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Distant Earthrise crescent in space
  if (options.showEarthCrescent) {
    drawEarthCrescent(ctx, options.earthX ?? width * 0.15, options.earthY ?? height * 0.2, 42);
  }
}

/**
 * Hand-drawn distant Earth crescent with atmospheric Rayleigh scattering glow.
 */
function drawEarthCrescent(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
): void {
  ctx.save();

  // Atmospheric outer blue haze
  const haze = ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * 1.35);
  haze.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
  haze.addColorStop(0.7, 'rgba(14, 165, 233, 0.08)');
  haze.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = haze;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.35, 0, Math.PI * 2);
  ctx.fill();

  // Dark disk of unlit Earth
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#050c18';
  ctx.fill();

  // Illuminated crescent
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();

  // Blue marble light
  const earthGrad = ctx.createLinearGradient(x - radius, y - radius, x + radius * 0.5, y + radius);
  earthGrad.addColorStop(0, '#0284c7');
  earthGrad.addColorStop(0.4, '#0369a1');
  earthGrad.addColorStop(0.8, '#082f49');
  earthGrad.addColorStop(1, '#020617');

  ctx.beginPath();
  ctx.arc(x - radius * 0.35, y - radius * 0.1, radius * 1.15, 0, Math.PI * 2);
  ctx.fillStyle = earthGrad;
  ctx.fill();

  // Swirling cloud band suggestion
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x - radius * 0.1, y - radius * 0.3, radius * 0.8, 0.3, 1.4);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x + radius * 0.1, y + radius * 0.2, radius * 0.7, 1.8, 2.9);
  ctx.stroke();

  ctx.restore();

  // Crisp illuminated atmospheric rim
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI * 0.6, Math.PI * 0.35);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.restore();
}

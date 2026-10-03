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
  options: {
    showEarthCrescent?: boolean;
    earthX?: number;
    earthY?: number;
    spaceGradient?: [string, string, string];
    nebulaColor?: string;
    nebulaCenter?: [number, number];
    celestialBody?: 'EARTH' | 'JUPITER' | 'MARS';
  } = {}
): void {
  const { width, height } = ctx.canvas;

  // Deep space base fill with level-specific gradient
  const spaceGrad = ctx.createLinearGradient(0, 0, 0, height);
  const colors = options.spaceGradient || ['#04060d', '#070a14', '#090d1a'];
  spaceGrad.addColorStop(0, colors[0]);
  spaceGrad.addColorStop(0.5, colors[1]);
  spaceGrad.addColorStop(1, colors[2]);
  ctx.fillStyle = spaceGrad;
  ctx.fillRect(0, 0, width, height);

  // Faint celestial nebula gas (soft radial gradients)
  const nebX = options.nebulaCenter ? options.nebulaCenter[0] * width : width * 0.75;
  const nebY = options.nebulaCenter ? options.nebulaCenter[1] * height : height * 0.25;
  const nebColor = options.nebulaColor || 'rgba(14, 165, 233, 0.04)';

  const nebula1 = ctx.createRadialGradient(nebX, nebY, 20, nebX, nebY, 340);
  nebula1.addColorStop(0, nebColor);
  nebula1.addColorStop(0.6, nebColor.replace(/[\d\.]+\)$/, '0.015)'));
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

  // Distant Celestial Body in space
  const bodyType = options.celestialBody || 'EARTH';
  const bodyX = options.earthX ?? width * 0.15;
  const bodyY = options.earthY ?? height * 0.2;

  if (options.showEarthCrescent !== false) {
    if (bodyType === 'JUPITER') {
      drawGasGiant(ctx, bodyX, bodyY, 46);
    } else if (bodyType === 'MARS') {
      drawRedPlanet(ctx, bodyX, bodyY, 38);
    } else {
      drawEarthCrescent(ctx, bodyX, bodyY, 42);
    }
  }
}

/**
 * Hand-drawn banded Gas Giant planet with planetary ring silhouette.
 */
function drawGasGiant(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  ctx.save();

  // Amber atmospheric haze
  const haze = ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * 1.4);
  haze.addColorStop(0, 'rgba(217, 119, 6, 0.22)');
  haze.addColorStop(0.6, 'rgba(180, 83, 9, 0.06)');
  haze.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = haze;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Planetary disk
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();

  // Banded atmosphere
  const planetGrad = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
  planetGrad.addColorStop(0, '#fef3c7');
  planetGrad.addColorStop(0.25, '#d97706');
  planetGrad.addColorStop(0.45, '#92400e');
  planetGrad.addColorStop(0.65, '#f59e0b');
  planetGrad.addColorStop(0.85, '#78350f');
  planetGrad.addColorStop(1, '#451a03');
  ctx.fillStyle = planetGrad;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

  // Night shadow terminator
  const shadowGrad = ctx.createLinearGradient(x - radius * 0.4, y - radius, x + radius, y + radius * 0.5);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shadowGrad.addColorStop(0.6, 'rgba(10, 5, 20, 0.5)');
  shadowGrad.addColorStop(1, 'rgba(4, 2, 8, 0.95)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

  ctx.restore();

  // Slanted planetary ring system
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, radius * 2.1, radius * 0.45, -0.35, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(x, y, radius * 1.7, radius * 0.35, -0.35, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/**
 * Hand-drawn rust-red Mars/Phobos planetary crescent.
 */
function drawRedPlanet(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  ctx.save();

  // Crimson atmospheric haze
  const haze = ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * 1.4);
  haze.addColorStop(0, 'rgba(239, 68, 68, 0.22)');
  haze.addColorStop(0.6, 'rgba(185, 28, 28, 0.06)');
  haze.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = haze;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Dark disk
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#150608';
  ctx.fill();

  // Illuminated crescent
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();

  const marsGrad = ctx.createLinearGradient(x - radius, y - radius, x + radius * 0.5, y + radius);
  marsGrad.addColorStop(0, '#f87171');
  marsGrad.addColorStop(0.4, '#dc2626');
  marsGrad.addColorStop(0.8, '#7f1d1d');
  marsGrad.addColorStop(1, '#450a0a');

  ctx.beginPath();
  ctx.arc(x - radius * 0.32, y - radius * 0.1, radius * 1.15, 0, Math.PI * 2);
  ctx.fillStyle = marsGrad;
  ctx.fill();
  ctx.restore();

  // Illuminated polar cap hint
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI * 0.55, -Math.PI * 0.3);
  ctx.strokeStyle = '#fef2f2';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
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

/**
 * @file drawCinematicMoon.ts
 * Minimalist, NASA-inspired Canvas 2D Lunar Sphere.
 * 
 * Features:
 * - Clean, realistic monochrome grey Moon with subtle surface variations
 * - Soft directional lighting from upper-left with natural terminator falloff
 * - Restrained, small craters with gentle interior shadows and fine rim highlights
 * - Subtle, soft maria basalt lowlands (no jagged patches or oversaturated blobs)
 * - Razor-thin, crisp natural limb (zero artificial cyan glow or exaggerated coronas)
 * - Very slow 3D spherical rotation
 * - Subtle Keplerian satellite orbit with realistic behind-moon line-of-sight occlusion
 */

export interface CraterSpec {
  lon: number; // Longitude in radians
  lat: number; // Latitude in radians
  radiusRatio: number; // Relative to moon radius (e.g. 0.03 - 0.065)
  depth: number; // 0.3 - 0.8
  hasPeak?: boolean;
}

export interface SatelliteState {
  orbitAngle: number; // Radians along orbit (0 to 2*PI)
  orbitSemiMajorRatio: number; // Relative to Moon radius (e.g. 1.45)
  orbitSemiMinorRatio: number; // Relative to Moon radius (e.g. 0.55)
  orbitTiltDeg: number; // Orbit inclination angle in screen plane
  orbitViewTiltDeg: number; // Orbit plane inclination toward viewer
}

export interface DrawCinematicMoonOptions {
  rotationAngle?: number; // In radians (slow surface rotation)
  lightAngleDeg?: number; // Direction of sunlight (e.g. -42 degrees)
  satelliteState?: SatelliteState;
  showSatellite?: boolean;
  showExosphereRim?: boolean;
}

// Subtle Maria (Basalt lowlands) definitions - soft, low-contrast, realistic positions
interface MariaSpec {
  lon: number;
  lat: number;
  radiusLon: number;
  radiusLat: number;
  opacity: number;
}

const SUBTLE_MARIA: MariaSpec[] = [
  // Oceanus Procellarum (gentle western lowland)
  { lon: -0.65, lat: 0.30, radiusLon: 0.42, radiusLat: 0.40, opacity: 0.28 },
  { lon: -0.45, lat: 0.15, radiusLon: 0.30, radiusLat: 0.32, opacity: 0.24 },
  // Mare Imbrium (Sea of Rains)
  { lon: -0.28, lat: 0.55, radiusLon: 0.32, radiusLat: 0.28, opacity: 0.32 },
  // Mare Serenitatis
  { lon: 0.30, lat: 0.45, radiusLon: 0.24, radiusLat: 0.22, opacity: 0.30 },
  // Mare Tranquillitatis (Apollo 11 site)
  { lon: 0.48, lat: 0.14, radiusLon: 0.28, radiusLat: 0.24, opacity: 0.34 },
  // Mare Crisium (isolated oval sea)
  { lon: 0.96, lat: 0.28, radiusLon: 0.16, radiusLat: 0.15, opacity: 0.35 },
  // Mare Nubium (southern basin)
  { lon: -0.25, lat: -0.35, radiusLon: 0.28, radiusLat: 0.24, opacity: 0.26 },
  // Mare Humorum
  { lon: -0.62, lat: -0.40, radiusLon: 0.16, radiusLat: 0.15, opacity: 0.28 },
  // Mare Fecunditatis & Nectaris
  { lon: 0.82, lat: -0.05, radiusLon: 0.25, radiusLat: 0.22, opacity: 0.28 },
  { lon: 0.55, lat: -0.25, radiusLon: 0.15, radiusLat: 0.14, opacity: 0.30 },
];

// Curated list of small, restrained lunar craters
const SUBTLE_CRATERS: CraterSpec[] = [
  // Prominent reference craters (restrained, realistic scale)
  { lon: -0.20, lat: -0.75, radiusRatio: 0.055, depth: 0.75, hasPeak: true }, // Tycho
  { lon: -0.35, lat: 0.18, radiusRatio: 0.065, depth: 0.70, hasPeak: true },  // Copernicus
  { lon: -0.66, lat: 0.14, radiusRatio: 0.040, depth: 0.65 },                 // Kepler
  { lon: -0.83, lat: 0.41, radiusRatio: 0.045, depth: 0.70 },                 // Aristarchus
  { lon: -0.16, lat: 0.88, radiusRatio: 0.060, depth: 0.55 },                 // Plato (dark floor)
  { lon: -0.07, lat: 0.52, radiusRatio: 0.052, depth: 0.55 },                 // Archimedes
  { lon: -0.25, lat: -1.00, radiusRatio: 0.075, depth: 0.60 },                // Clavius
  { lon: 1.05, lat: -0.15, radiusRatio: 0.065, depth: 0.65, hasPeak: true },  // Langrenus
  { lon: 0.46, lat: -0.20, radiusRatio: 0.060, depth: 0.68, hasPeak: true },  // Theophilus
  { lon: -0.39, lat: -0.36, radiusRatio: 0.050, depth: 0.60 },                // Bullialdus
  { lon: -0.20, lat: 0.25, radiusRatio: 0.048, depth: 0.62 },                 // Eratosthenes
  { lon: 0.52, lat: 0.56, radiusRatio: 0.055, depth: 0.55 },                  // Posidonius
  { lon: -0.70, lat: -0.30, radiusRatio: 0.058, depth: 0.60 },                // Gassendi
  // Small distributed craterlets
  { lon: 0.12, lat: 0.32, radiusRatio: 0.035, depth: 0.50 },
  { lon: 0.22, lat: 0.72, radiusRatio: 0.042, depth: 0.55 },
  { lon: -0.42, lat: 0.62, radiusRatio: 0.045, depth: 0.55 },
  { lon: 0.62, lat: 0.18, radiusRatio: 0.038, depth: 0.52 },
  { lon: 0.82, lat: 0.32, radiusRatio: 0.036, depth: 0.50 },
  { lon: -0.05, lat: -0.42, radiusRatio: 0.042, depth: 0.52 },
  { lon: 0.32, lat: -0.48, radiusRatio: 0.046, depth: 0.55 },
  { lon: -0.58, lat: -0.68, radiusRatio: 0.048, depth: 0.55 },
  { lon: 0.68, lat: -0.78, radiusRatio: 0.045, depth: 0.52 },
  { lon: -0.88, lat: -0.42, radiusRatio: 0.038, depth: 0.55 },
  { lon: 1.12, lat: -0.38, radiusRatio: 0.042, depth: 0.52 },
  { lon: -1.02, lat: 0.22, radiusRatio: 0.044, depth: 0.52 },
  { lon: 0.82, lat: -0.22, radiusRatio: 0.038, depth: 0.50 },
  { lon: -0.48, lat: -0.12, radiusRatio: 0.032, depth: 0.48 },
  { lon: 0.08, lat: -0.12, radiusRatio: 0.034, depth: 0.48 },
  { lon: -0.28, lat: 0.38, radiusRatio: 0.035, depth: 0.50 },
  { lon: 0.38, lat: 0.04, radiusRatio: 0.032, depth: 0.48 },
  { lon: -0.72, lat: 0.58, radiusRatio: 0.038, depth: 0.52 },
  { lon: -0.12, lat: -0.22, radiusRatio: 0.030, depth: 0.45 },
  { lon: 0.04, lat: 0.12, radiusRatio: 0.030, depth: 0.45 },
];

/**
 * Projects a spherical coordinate to 2D view space with rotation.
 */
function projectSpherePoint(
  lon: number,
  lat: number,
  rot: number,
  cx: number,
  cy: number,
  radius: number
): { x: number; y: number; z: number; nx: number; ny: number; nz: number } {
  const effLon = lon + rot;
  const nx = Math.cos(lat) * Math.sin(effLon);
  const ny = -Math.sin(lat);
  const nz = Math.cos(lat) * Math.cos(effLon);

  return {
    x: cx + radius * nx,
    y: cy + radius * ny,
    z: nz,
    nx,
    ny,
    nz,
  };
}

/**
 * Draws a clean, realistic, NASA-style grey Moon with soft directional lighting.
 */
export function drawCinematicMoon(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  options: DrawCinematicMoonOptions = {}
): void {
  const {
    rotationAngle = 0,
    lightAngleDeg = -42,
    satelliteState,
    showSatellite = true,
    showExosphereRim = true,
  } = options;

  ctx.save();

  // Normalize 3D directional light vector (Sun from upper-left)
  const lightRad = (lightAngleDeg * Math.PI) / 180;
  const lx = Math.cos(lightRad);
  const ly = Math.sin(lightRad);
  const lz = 0.55;
  const lLen = Math.sqrt(lx * lx + ly * ly + lz * lz);
  const lightVec = { x: lx / lLen, y: ly / lLen, z: lz / lLen };

  // Calculate satellite orbit position
  let satPos: { x: number; y: number; z: number; visible: boolean } | null = null;
  if (showSatellite && satelliteState) {
    satPos = computeSatellitePosition(centerX, centerY, radius, satelliteState);
  }

  // 1. Draw subtle satellite ORBITAL TRACK
  if (showSatellite && satelliteState) {
    drawOrbitTrack(ctx, centerX, centerY, radius, satelliteState);
  }

  // 2. Draw satellite if occluded BEHIND the moon
  if (satPos && satPos.z < 0 && satPos.visible) {
    drawSatelliteModel(ctx, satPos.x, satPos.y, satelliteState?.orbitAngle ?? 0);
  }

  // 3. CLIP TO MOON DISK
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  // 4. CLEAN SPHERICAL BASE SHADING (NASA-spec monochrome regolith)
  const sunlitCoreX = centerX + lightVec.x * radius * 0.42;
  const sunlitCoreY = centerY + lightVec.y * radius * 0.42;

  const baseGrad = ctx.createRadialGradient(
    sunlitCoreX,
    sunlitCoreY,
    radius * 0.08,
    centerX,
    centerY,
    radius * 1.02
  );
  // Elegant, natural grey tones
  baseGrad.addColorStop(0.0, '#cbd5e1'); // Sunlit highland grey
  baseGrad.addColorStop(0.35, '#94a3b8'); // Nominal regolith midtone
  baseGrad.addColorStop(0.68, '#475569'); // Twilight approach
  baseGrad.addColorStop(0.88, '#1e293b'); // Terminator shadow zone
  baseGrad.addColorStop(1.0, '#090d16'); // Dark limb

  ctx.fillStyle = baseGrad;
  ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

  // 5. SUBTLE LUNAR MARIA (Soft, blended basalt lowlands - NO jagged blobs)
  drawSubtleMaria(ctx, centerX, centerY, radius, rotationAngle, lightVec);

  // 6. DELICATE EJECTA RAYS (Tycho & Copernicus - soft, low-opacity wisps)
  drawDelicateEjectaRays(ctx, centerX, centerY, radius, rotationAngle, lightVec);

  // 7. SMALL, RESTRAINED CRATERS (Subtle shadows and fine sunward rims)
  drawSubtleCraters(ctx, centerX, centerY, radius, rotationAngle, lightVec);

  // 8. SOFT DIRECTIONAL TERMINATOR SHADOW
  drawSoftTerminator(ctx, centerX, centerY, radius, lightVec);

  // 9. DELICATE LUNAR SURFACE GRAIN (Subtle regolith texture)
  drawSubtleSurfaceTexture(ctx, centerX, centerY, radius);

  ctx.restore(); // Exit sphere clip

  // 10. CLEAN, RAZOR-THIN SUNLIT LIMB (Zero cyan glow - authentic vacuum edge)
  if (showExosphereRim) {
    drawCleanLimb(ctx, centerX, centerY, radius, lightVec);
  }

  // 11. Draw satellite if IN FRONT of the moon
  if (satPos && satPos.z >= 0 && satPos.visible) {
    drawSatelliteModel(ctx, satPos.x, satPos.y, satelliteState?.orbitAngle ?? 0);
  }

  ctx.restore();
}

/**
 * Draws soft, blended maria basalt lowlands that merge naturally with the terrain.
 */
function drawSubtleMaria(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rot: number,
  lightVec: { x: number; y: number; z: number }
): void {
  ctx.save();

  for (const m of SUBTLE_MARIA) {
    const p = projectSpherePoint(m.lon, m.lat, rot, cx, cy, radius);

    // Skip if on the far side of the moon
    if (p.nz < -0.1) continue;

    // Normal · Light illumination factor
    const dot = p.nx * lightVec.x + p.ny * lightVec.y + p.nz * lightVec.z;
    const illumination = Math.max(0.08, Math.min(1.0, dot * 0.9 + 0.1));

    const rx = radius * m.radiusLon;
    const ry = radius * m.radiusLat;
    const foreshorten = Math.max(0.15, p.nz);

    ctx.save();
    ctx.translate(p.x, p.y);

    const angle = Math.atan2(p.ny, p.nx);
    ctx.rotate(angle);

    // Soft radial falloff for natural basalt plain boundaries
    const grad = ctx.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx);
    const alpha = (m.opacity * illumination).toFixed(3);
    grad.addColorStop(0.0, `rgba(45, 55, 72, ${alpha})`);
    grad.addColorStop(0.65, `rgba(45, 55, 72, ${(Number(alpha) * 0.6).toFixed(3)})`);
    grad.addColorStop(1.0, 'rgba(45, 55, 72, 0)');

    ctx.beginPath();
    ctx.ellipse(0, 0, rx * foreshorten, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws subtle, restrained ray wisps radiating from Tycho and Copernicus.
 */
function drawDelicateEjectaRays(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rot: number,
  lightVec: { x: number; y: number; z: number }
): void {
  // Tycho: southern prominent ray hub
  const tycho = projectSpherePoint(-0.20, -0.75, rot, cx, cy, radius);
  if (tycho.nz > 0.08) {
    const dot = tycho.nx * lightVec.x + tycho.ny * lightVec.y + tycho.nz * lightVec.z;
    if (dot > 0.05) {
      ctx.save();
      ctx.translate(tycho.x, tycho.y);

      const rayCount = 10;
      for (let i = 0; i < rayCount; i++) {
        const rayAngle = (i / rayCount) * Math.PI * 2 + 0.3;
        const len = radius * (0.35 + (i % 3) * 0.15);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(rayAngle) * len, Math.sin(rayAngle) * len);

        const alpha = Math.min(0.12, dot * 0.14);
        ctx.strokeStyle = `rgba(241, 245, 249, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

/**
 * Renders small, restrained craters with gentle interior shadows and fine rim highlights.
 */
function drawSubtleCraters(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rot: number,
  lightVec: { x: number; y: number; z: number }
): void {
  ctx.save();

  for (const c of SUBTLE_CRATERS) {
    const p = projectSpherePoint(c.lon, c.lat, rot, cx, cy, radius);

    // Skip if on the far side
    if (p.nz < 0.06) continue;

    // Normal · Light
    const dot = p.nx * lightVec.x + p.ny * lightVec.y + p.nz * lightVec.z;
    if (dot < -0.1) continue; // In deep shadow

    const craterR = radius * c.radiusRatio;
    const foreshorten = Math.max(0.14, p.nz);

    ctx.save();
    ctx.translate(p.x, p.y);

    // Align ellipse tangent to the sphere curvature
    const radialAngle = Math.atan2(p.y - cy, p.x - cx);
    ctx.rotate(radialAngle + Math.PI / 2);

    // 1. Interior Bowl Shadow (Soft, restrained)
    const shadowOffset = craterR * 0.25;
    const shadowGrad = ctx.createRadialGradient(
      -lightVec.x * shadowOffset,
      -lightVec.y * shadowOffset * foreshorten,
      craterR * 0.1,
      0,
      0,
      craterR
    );

    const shadowAlpha = Math.min(0.55, 0.35 * c.depth + Math.max(0, 0.4 - dot * 0.5));
    shadowGrad.addColorStop(0.0, `rgba(15, 23, 42, ${shadowAlpha.toFixed(2)})`);
    shadowGrad.addColorStop(0.7, `rgba(30, 41, 59, ${(shadowAlpha * 0.6).toFixed(2)})`);
    shadowGrad.addColorStop(1.0, 'rgba(51, 65, 85, 0.05)');

    ctx.beginPath();
    ctx.ellipse(0, 0, craterR, craterR * foreshorten, 0, 0, Math.PI * 2);
    ctx.fillStyle = shadowGrad;
    ctx.fill();

    // 2. Fine Sunward Rim Highlight (Delicate stroke)
    if (dot > -0.02) {
      const rimAlpha = Math.max(0.15, Math.min(0.65, dot * 0.8));

      ctx.beginPath();
      // Sunward illuminated arc
      ctx.ellipse(0, 0, craterR, craterR * foreshorten, 0, Math.PI * 0.8, Math.PI * 1.8);
      ctx.strokeStyle = `rgba(255, 255, 255, ${rimAlpha.toFixed(2)})`;
      ctx.lineWidth = Math.max(0.75, craterR * 0.1);
      ctx.stroke();
    }

    // 3. Subtle Central Peak (for Tycho and Copernicus)
    if (c.hasPeak && craterR > 7 && dot > 0.08) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(lightVec.x * 1.0, lightVec.y * 1.0 * foreshorten, 1.0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws a soft, natural terminator shadow gradient across the unilluminated side.
 */
function drawSoftTerminator(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  lightVec: { x: number; y: number; z: number }
): void {
  const gradStartX = cx + lightVec.x * radius * 0.65;
  const gradStartY = cy + lightVec.y * radius * 0.65;
  const gradEndX = cx - lightVec.x * radius * 1.05;
  const gradEndY = cy - lightVec.y * radius * 1.05;

  const termGrad = ctx.createLinearGradient(gradStartX, gradStartY, gradEndX, gradEndY);
  termGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
  termGrad.addColorStop(0.42, 'rgba(0, 0, 0, 0)');
  termGrad.addColorStop(0.60, 'rgba(15, 23, 42, 0.35)'); // Gentle twilight
  termGrad.addColorStop(0.78, 'rgba(10, 15, 30, 0.75)');
  termGrad.addColorStop(0.92, 'rgba(4, 6, 14, 0.95)');  // Deep night
  termGrad.addColorStop(1.0, 'rgba(2, 4, 10, 0.99)');

  ctx.fillStyle = termGrad;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
}

/**
 * Subtle microscopic regolith mottling texture to avoid synthetic flat look.
 */
function drawSubtleSurfaceTexture(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
  const step = Math.max(10, Math.floor(radius / 22));

  for (let x = -radius; x < radius; x += step) {
    for (let y = -radius; y < radius; y += step) {
      if (x * x + y * y < radius * radius * 0.94) {
        const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const fract = hash - Math.floor(hash);
        if (fract > 0.76) {
          ctx.fillRect(cx + x, cy + y, 1.2, 1.2);
        }
      }
    }
  }
  ctx.restore();
}

/**
 * Draws a clean, razor-thin lunar limb against space.
 * Eliminates artificial cyan glow or exaggerated coronas.
 */
function drawCleanLimb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  lightVec: { x: number; y: number; z: number }
): void {
  ctx.save();

  const sunAngle = Math.atan2(lightVec.y, lightVec.x);
  const startAngle = sunAngle - Math.PI * 0.52;
  const endAngle = sunAngle + Math.PI * 0.52;

  // Crisp, thin 1px solar specular limb (Neutral white, zero cyan)
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.70)';
  ctx.lineWidth = 1.0;
  ctx.shadowColor = 'rgba(255, 255, 255, 0.25)';
  ctx.shadowBlur = 2;
  ctx.stroke();

  // Faint nightside limb outline against black space
  ctx.beginPath();
  ctx.arc(cx, cy, radius, endAngle, startAngle);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.lineWidth = 0.75;
  ctx.shadowBlur = 0;
  ctx.stroke();

  ctx.restore();
}

/**
 * Computes the 3D position of the satellite along its orbit.
 */
function computeSatellitePosition(
  cx: number,
  cy: number,
  moonRadius: number,
  sat: SatelliteState
): { x: number; y: number; z: number; visible: boolean } {
  const { orbitAngle, orbitSemiMajorRatio, orbitSemiMinorRatio, orbitTiltDeg, orbitViewTiltDeg } = sat;
  const a = moonRadius * orbitSemiMajorRatio;
  const b = moonRadius * orbitSemiMinorRatio;

  const x0 = a * Math.cos(orbitAngle);
  const y0 = b * Math.sin(orbitAngle);

  const tiltRad = (orbitTiltDeg * Math.PI) / 180;
  const viewTiltRad = (orbitViewTiltDeg * Math.PI) / 180;

  const x1 = x0 * Math.cos(tiltRad) - y0 * Math.sin(tiltRad);
  const y1 = (x0 * Math.sin(tiltRad) + y0 * Math.cos(tiltRad)) * Math.cos(viewTiltRad);
  const z1 = -(x0 * Math.sin(tiltRad) + y0 * Math.cos(tiltRad)) * Math.sin(viewTiltRad);

  const screenX = cx + x1;
  const screenY = cy + y1;

  // Occluded when behind moon and within circular disk
  const distSq = x1 * x1 + y1 * y1;
  const isOccluded = z1 < 0 && distSq < (moonRadius * 0.98) * (moonRadius * 0.98);

  return {
    x: screenX,
    y: screenY,
    z: z1,
    visible: !isOccluded,
  };
}

/**
 * Draws the subtle, delicate orbital track line.
 */
function drawOrbitTrack(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  moonRadius: number,
  sat: SatelliteState
): void {
  const { orbitSemiMajorRatio, orbitSemiMinorRatio, orbitTiltDeg, orbitViewTiltDeg } = sat;
  const a = moonRadius * orbitSemiMajorRatio;
  const b = moonRadius * orbitSemiMinorRatio;
  const tiltRad = (orbitTiltDeg * Math.PI) / 180;
  const viewTiltRad = (orbitViewTiltDeg * Math.PI) / 180;

  ctx.save();
  ctx.lineWidth = 0.8;
  ctx.setLineDash([3, 7]);

  const numPoints = 72;
  ctx.beginPath();
  let first = true;

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const x0 = a * Math.cos(angle);
    const y0 = b * Math.sin(angle);

    const x1 = x0 * Math.cos(tiltRad) - y0 * Math.sin(tiltRad);
    const y1 = (x0 * Math.sin(tiltRad) + y0 * Math.cos(tiltRad)) * Math.cos(viewTiltRad);
    const z1 = -(x0 * Math.sin(tiltRad) + y0 * Math.cos(tiltRad)) * Math.sin(viewTiltRad);

    const px = cx + x1;
    const py = cy + y1;

    const isBehind = z1 < 0 && (x1 * x1 + y1 * y1) < moonRadius * moonRadius;
    if (isBehind) continue;

    if (first) {
      ctx.moveTo(px, py);
      first = false;
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a small, minimalist vector model of the orbital survey probe.
 */
function drawSatelliteModel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  orbitAngle: number
): void {
  ctx.save();
  ctx.translate(x, y);

  const heading = orbitAngle + Math.PI / 2;
  ctx.rotate(heading);

  // 1. Central Bus (Minimalist gold foil)
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-2.5, -3, 5, 6);

  // 2. Solar Wings
  const drawWing = (dir: number) => {
    ctx.save();
    ctx.translate(dir * 7, 0);

    // Boom
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(dir * -4.5, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Solar panel
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-3.5, -4.5, 7, 9);
    ctx.restore();
  };

  drawWing(-1);
  drawWing(1);

  // 3. Telemetry Strobe
  const pulse = (Math.sin(orbitAngle * 6) + 1) * 0.5;
  if (pulse > 0.75) {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 3, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

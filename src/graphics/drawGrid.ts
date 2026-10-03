/**
 * @file drawGrid.ts
 * Computer Graphics coordinate grid, altitude markers, and world axis overlay.
 */

export function drawWorldGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellSize: number = 80
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.07)';
  ctx.lineWidth = 1;

  // Vertical grid lines
  for (let x = 0; x < width; x += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal altitude lines
  for (let y = 0; y < height; y += cellSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    // Altitude indicator on left margin
    const altMeters = Math.max(0, Math.round((height * 0.78 - y) * 2.5));
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.fillText(`${altMeters}m`, 8, y - 4);
  }

  // World Origin indicator [0, 0] at top-left
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(36, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 36);
  ctx.stroke();

  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.fillText('+X (East)', 40, 10);
  ctx.fillText('+Y (Nadir)', 4, 46);

  ctx.restore();
}

/**
 * Draws ground projection line from lander center of mass down to terrain.
 */
export function drawAltitudeProjection(
  ctx: CanvasRenderingContext2D,
  landerX: number,
  landerY: number,
  groundY: number
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  ctx.beginPath();
  ctx.moveTo(landerX, landerY);
  ctx.lineTo(landerX, groundY);
  ctx.stroke();

  // Ground contact target dot
  ctx.setLineDash([]);
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(landerX, groundY, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * @file TransformLab.tsx
 * Interactive Computer Graphics 2D Transformation Laboratory.
 * 
 * Demonstrates:
 * - Translation T(tx, ty)
 * - Rotation R(θ)
 * - Scaling S(sx, sy)
 * - Reflection (Horizontal / Vertical axis flip)
 * - Shearing Sh(shx, shy)
 * - Homogeneous Matrix composition and non-commutativity (A · B ≠ B · A)
 * 
 * Utilizes pure HTML5 Canvas 2D matrix transformations (ctx.transform).
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Move, 
  RotateCw, 
  Maximize2, 
  FlipHorizontal, 
  FlipVertical, 
  Layers, 
  Cpu, 
  Eye, 
  EyeOff,
  Sparkles,
  Play
} from 'lucide-react';
import { drawLander } from '../graphics/drawLander';

interface TransformLabProps {
  onReturnToSimulation: () => void;
  onReturnToMenu: () => void;
}

type ModelType = 'LEM' | 'POLYGON_F';
type OrderType = 'TRS' | 'RTS'; // Translate*Rotate*Scale vs Rotate*Translate*Scale

export const TransformLab: React.FC<TransformLabProps> = ({
  onReturnToSimulation,
  onReturnToMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Transformation Parameters
  const [tx, setTx] = useState<number>(0);
  const [ty, setTy] = useState<number>(0);
  const [rotDeg, setRotDeg] = useState<number>(0);
  const [sx, setSx] = useState<number>(1.0);
  const [sy, setSy] = useState<number>(1.0);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [reflectX, setReflectX] = useState<boolean>(false);
  const [reflectY, setReflectY] = useState<boolean>(false);
  const [shx, setShx] = useState<number>(0);
  const [shy, setShy] = useState<number>(0);

  // View Options
  const [modelType, setModelType] = useState<ModelType>('LEM');
  const [compositionOrder, setCompositionOrder] = useState<OrderType>('TRS');
  const [showGhost, setShowGhost] = useState<boolean>(true);
  const [showLocalAxes, setShowLocalAxes] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Reset all transformation sliders
  const handleReset = () => {
    setTx(0);
    setTy(0);
    setRotDeg(0);
    setSx(1.0);
    setSy(1.0);
    setReflectX(false);
    setReflectY(false);
    setShx(0);
    setShy(0);
  };

  // Preset Demonstrations
  const applyPreset = (preset: 'DEFAULT' | 'SHEAR_DEMO' | 'REFLECT_DEMO' | 'ORBIT_DEMO') => {
    handleReset();
    if (preset === 'SHEAR_DEMO') {
      setModelType('POLYGON_F');
      setShx(0.65);
      setSx(1.2);
      setSy(1.2);
    } else if (preset === 'REFLECT_DEMO') {
      setModelType('POLYGON_F');
      setReflectX(true);
      setRotDeg(25);
    } else if (preset === 'ORBIT_DEMO') {
      setModelType('LEM');
      setCompositionOrder('RTS');
      setTx(120);
      setRotDeg(45);
    }
  };

  // Convert rotation to radians
  const rotRad = (rotDeg * Math.PI) / 180;
  const effectiveSx = sx * (reflectX ? -1 : 1);
  const effectiveSy = sy * (reflectY ? -1 : 1);

  // Compute 2D Homogeneous Matrix coefficients:
  // In standard TRS order:
  // [ a  c  e ]   [ 1 0 tx ]   [ cos -sin 0 ]   [ 1   shx 0 ]   [ sx  0  0 ]
  // [ b  d  f ] = [ 0 1 ty ] · [ sin  cos 0 ] · [ shy  1  0 ] · [ 0  sy  0 ]
  // [ 0  0  1 ]   [ 0 0  1 ]   [  0    0   1 ]   [  0   0  1 ]   [ 0   0  1 ]
  const cos = Math.cos(rotRad);
  const sin = Math.sin(rotRad);

  let a = 1, b = 0, c = 0, d = 1, e = tx, f = ty;

  if (compositionOrder === 'TRS') {
    // Standard: Translate * Rotate * Shear * Scale
    // M_shear_scale:
    const m00 = effectiveSx;
    const m01 = shx * effectiveSy;
    const m10 = shy * effectiveSx;
    const m11 = effectiveSy;

    // Apply Rotation to M_shear_scale:
    a = cos * m00 - sin * m10;
    c = cos * m01 - sin * m11;
    b = sin * m00 + cos * m10;
    d = sin * m01 + cos * m11;
    e = tx;
    f = ty;
  } else {
    // Non-commutative demonstration: Rotate * Translate * Scale (translates along rotated axis!)
    a = cos * effectiveSx;
    b = sin * effectiveSx;
    c = -sin * effectiveSy;
    d = cos * effectiveSy;
    e = cos * tx - sin * ty;
    f = sin * tx + cos * ty;
  }

  // Draw Scene Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.clientWidth);
    const height = (canvas.height = canvas.clientHeight);
    const originX = width * 0.5;
    const originY = height * 0.5;

    ctx.clearRect(0, 0, width, height);

    // 1. Dark Background Fill
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    // 2. Global Coordinate Grid (Centered on Canvas Origin)
    if (showGrid) {
      drawLabGrid(ctx, width, height, originX, originY);
    }

    // 3. Ghost Baseline (Un-transformed object at origin in dashed outline)
    if (showGhost) {
      ctx.save();
      ctx.translate(originX, originY);
      drawModel(ctx, modelType, true);
      ctx.restore();
    }

    // 4. Transformed Object
    ctx.save();
    // Shift coordinate system to canvas center
    ctx.translate(originX, originY);

    // Apply the computed Affine Transformation Matrix:
    ctx.transform(a, b, c, d, e, f);

    // Draw Vector Model
    drawModel(ctx, modelType, false);

    // Draw Local Coordinate Axes [u, v]
    if (showLocalAxes) {
      drawTransformedAxes(ctx);
    }

    ctx.restore();
  }, [tx, ty, rotDeg, sx, sy, reflectX, reflectY, shx, shy, modelType, compositionOrder, showGhost, showLocalAxes, showGrid, a, b, c, d, e, f]);

  return (
    <div className="min-h-screen bg-[#04060d] text-slate-100 flex flex-col justify-between select-none">
      {/* Top Header */}
      <header className="h-14 px-4 sm:px-8 bg-[#060a14] border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/80 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-cyan-300" />
            <span>Resume Simulation</span>
          </button>

          <button
            onClick={onReturnToMenu}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Main Menu</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
            CG TRANSFORM LAB
          </span>
          <span className="text-xs text-slate-600">/</span>
          <span className="text-xs font-mono text-slate-400 hidden md:inline">
            2D AFFINE HOMOGENEOUS MATRIX EXPLORER
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-mono text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
            title="Reset All Transformation Parameters"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset Identity</span>
          </button>
        </div>
      </header>

      {/* Main Workspace (Canvas Stage + Control Inspector) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Canvas Transformation Viewport */}
        <div className="flex-1 relative w-full h-[52vh] lg:h-full bg-[#050813] overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

          {/* Quick Preset Buttons Overlay */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-10">
            <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
              CG Presets:
            </span>
            <button
              onClick={() => applyPreset('SHEAR_DEMO')}
              className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 text-xs font-mono rounded border border-slate-700 transition-colors cursor-pointer"
            >
              Shear Demonstration
            </button>
            <button
              onClick={() => applyPreset('REFLECT_DEMO')}
              className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-amber-300 text-xs font-mono rounded border border-slate-700 transition-colors cursor-pointer"
            >
              Reflection Axis Flip
            </button>
            <button
              onClick={() => applyPreset('ORBIT_DEMO')}
              className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-emerald-300 text-xs font-mono rounded border border-slate-700 transition-colors cursor-pointer"
            >
              Non-Commutative R·T
            </button>
          </div>

          {/* View Toggles Overlay */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[11px] font-mono z-10 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 backdrop-blur-sm">
            <button
              onClick={() => setShowGhost(!showGhost)}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                showGhost ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-500'
              }`}
            >
              Ghost Baseline: {showGhost ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setShowLocalAxes(!showLocalAxes)}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                showLocalAxes ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-500'
              }`}
            >
              Local Frame [u,v]: {showLocalAxes ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                showGrid ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-500'
              }`}
            >
              Grid: {showGrid ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Right Sidebar: Transformation Controls & Mathematical Matrix */}
        <aside className="w-full lg:w-96 bg-[#070b16] border-t lg:border-t-0 lg:border-l border-slate-800 p-5 space-y-4 overflow-y-auto max-h-[48vh] lg:max-h-full shrink-0">
          {/* Model & Composition Order Selectors */}
          <div className="space-y-3 pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                Vector Geometry Model
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setModelType('LEM')}
                  className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer transition-colors ${
                    modelType === 'LEM' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Apollo LEM
                </button>
                <button
                  onClick={() => setModelType('POLYGON_F')}
                  className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer transition-colors ${
                    modelType === 'POLYGON_F' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Asymmetric 'F'
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Composition Pipeline:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setCompositionOrder('TRS')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    compositionOrder === 'TRS' ? 'bg-slate-800 text-cyan-300' : 'text-slate-500'
                  }`}
                  title="Translate * Rotate * Scale (Standard)"
                >
                  T · R · Sh · S
                </button>
                <button
                  onClick={() => setCompositionOrder('RTS')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    compositionOrder === 'RTS' ? 'bg-slate-800 text-amber-300' : 'text-slate-500'
                  }`}
                  title="Rotate * Translate * Scale (Order demonstrator)"
                >
                  R · T · S
                </button>
              </div>
            </div>
          </div>

          {/* Matrix Mathematical Visualization Box */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyan-400 font-bold">2D Homogeneous Matrix M:</span>
              <span className="text-[10px] text-slate-500">CANVAS 2D FORMAT</span>
            </div>

            {/* Matrix Bracket Representation */}
            <div className="flex items-center justify-center gap-3 py-2 text-xs text-slate-200">
              <span className="text-2xl text-cyan-500/80 font-light">[</span>
              <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-center tabular-nums">
                <span className="text-cyan-300 font-semibold">{a.toFixed(2)}</span>
                <span className="text-cyan-300 font-semibold">{c.toFixed(2)}</span>
                <span className="text-emerald-400 font-semibold">{e.toFixed(1)}</span>

                <span className="text-cyan-300 font-semibold">{b.toFixed(2)}</span>
                <span className="text-cyan-300 font-semibold">{d.toFixed(2)}</span>
                <span className="text-emerald-400 font-semibold">{f.toFixed(1)}</span>

                <span className="text-slate-500">0.00</span>
                <span className="text-slate-500">0.00</span>
                <span className="text-slate-400">1.00</span>
              </div>
              <span className="text-2xl text-cyan-500/80 font-light">]</span>
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-900 pt-1 flex justify-between">
              <span>Cyan: Linear (Rot/Scale/Shear)</span>
              <span>Green: Translation Vector</span>
            </div>
          </div>

          {/* Transformation Controls Accordions / Sliders */}
          <div className="space-y-3.5 text-xs font-mono">
            {/* 1. TRANSLATION */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Move className="w-3.5 h-3.5 text-emerald-400" />
                  Translation T(tx, ty)
                </span>
                <span className="text-[10px] text-emerald-400">[{tx}px, {ty}px]</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Tx (Horizontal):</span>
                  <span>{tx} px</span>
                </div>
                <input
                  type="range"
                  min="-220"
                  max="220"
                  value={tx}
                  onChange={(e) => setTx(parseInt(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Ty (Vertical):</span>
                  <span>{ty} px</span>
                </div>
                <input
                  type="range"
                  min="-220"
                  max="220"
                  value={ty}
                  onChange={(e) => setTy(parseInt(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>

            {/* 2. ROTATION */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                  Rotation R(θ)
                </span>
                <span className="text-[10px] text-cyan-400">{rotDeg}° · {rotRad.toFixed(2)} rad</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={rotDeg}
                onChange={(e) => setRotDeg(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* 3. SCALING & REFLECTION */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  Scale S(sx, sy) & Reflection
                </span>
                <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockAspect}
                    onChange={(e) => {
                      setLockAspect(e.target.checked);
                      if (e.target.checked) setSy(sx);
                    }}
                    className="accent-amber-400 cursor-pointer"
                  />
                  <span>Lock Ratio</span>
                </label>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Sx:</span>
                  <span>{sx.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.05"
                  value={sx}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setSx(val);
                    if (lockAspect) setSy(val);
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {!lockAspect && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Sy:</span>
                    <span>{sy.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.5"
                    step="0.05"
                    value={sy}
                    onChange={(e) => setSy(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              )}

              {/* Reflection Axis Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setReflectX(!reflectX)}
                  className={`flex-1 py-1.5 px-2 rounded border text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    reflectX
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Flip X (Sx = -1)</span>
                </button>
                <button
                  onClick={() => setReflectY(!reflectY)}
                  className={`flex-1 py-1.5 px-2 rounded border text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    reflectY
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>Flip Y (Sy = -1)</span>
                </button>
              </div>
            </div>

            {/* 4. SHEARING / SKEWING */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Layers className="w-3.5 h-3.5 text-rose-400" />
                  Shear Sh(shx, shy)
                </span>
                <span className="text-[10px] text-rose-400">[{shx.toFixed(2)}, {shy.toFixed(2)}]</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Horizontal Shear (Shx):</span>
                  <span>{shx.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-1.5"
                  max="1.5"
                  step="0.05"
                  value={shx}
                  onChange={(e) => setShx(parseFloat(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Vertical Shear (Shy):</span>
                  <span>{shy.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-1.5"
                  max="1.5"
                  step="0.05"
                  value={shy}
                  onChange={(e) => setShy(parseFloat(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

/**
 * Draws the Cartesian grid and primary axes for the laboratory canvas.
 */
function drawLabGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  originX: number,
  originY: number
): void {
  ctx.save();
  const step = 40;

  // Background subtle grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.lineWidth = 1;

  for (let x = originX % step; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = originY % step; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Major World Axes X & Y
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 1.5;

  // X Axis
  ctx.beginPath();
  ctx.moveTo(0, originY);
  ctx.lineTo(width, originY);
  ctx.stroke();

  // Y Axis
  ctx.beginPath();
  ctx.moveTo(originX, 0);
  ctx.lineTo(originX, height);
  ctx.stroke();

  // Origin point
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(originX, originY, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
  ctx.fillText('WORLD ORIGIN [0, 0]', originX + 8, originY - 8);

  ctx.restore();
}

/**
 * Draws the local coordinate axes [u, v] transformed with the object.
 */
function drawTransformedAxes(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.lineWidth = 2;

  // Local U axis (Forward, -Y) -> RED
  ctx.strokeStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -60);
  ctx.stroke();

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(0, -66);
  ctx.lineTo(-4, -58);
  ctx.lineTo(4, -58);
  ctx.closePath();
  ctx.fill();

  // Local V axis (Lateral, +X) -> GREEN
  ctx.strokeStyle = '#22c55e';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(60, 0);
  ctx.stroke();

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.moveTo(66, 0);
  ctx.lineTo(58, -4);
  ctx.lineTo(58, 4);
  ctx.closePath();
  ctx.fill();

  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = '#ef4444';
  ctx.fillText('u', -12, -58);
  ctx.fillStyle = '#22c55e';
  ctx.fillText('v', 58, 16);

  ctx.restore();
}

/**
 * Renders either the Apollo LEM vector model or the asymmetric 'F' calibration polygon.
 */
function drawModel(
  ctx: CanvasRenderingContext2D,
  type: ModelType,
  isGhost: boolean
): void {
  ctx.save();

  if (isGhost) {
    ctx.globalAlpha = 0.25;
    ctx.setLineDash([4, 4]);
  }

  if (type === 'LEM') {
    // Draw the Apollo Lander vector model
    drawLander(
      ctx,
      { position: { x: 0, y: 0 }, rotation: 0, scale: 1.2 },
      { thrust: 0, debug: { showCenterOfMass: !isGhost } }
    );
  } else {
    // Draw the classic Computer Graphics Asymmetric 'F' Calibration Geometry
    drawAsymmetricF(ctx, isGhost);
  }

  ctx.restore();
}

/**
 * Asymmetric 'F' Polygon - Standard CG benchmark geometry to show shears and reflections clearly.
 */
function drawAsymmetricF(ctx: CanvasRenderingContext2D, isGhost: boolean): void {
  ctx.save();

  // Center the F around (0, 0)
  ctx.translate(-25, -40);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(50, 0);
  ctx.lineTo(50, 16);
  ctx.lineTo(18, 16);
  ctx.lineTo(18, 32);
  ctx.lineTo(42, 32);
  ctx.lineTo(42, 48);
  ctx.lineTo(18, 48);
  ctx.lineTo(18, 80);
  ctx.lineTo(0, 80);
  ctx.closePath();

  if (!isGhost) {
    const grad = ctx.createLinearGradient(0, 0, 50, 80);
    grad.addColorStop(0, '#06b6d4');
    grad.addColorStop(0.5, '#3b82f6');
    grad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cross-hairs at baseline points
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.arc(50, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

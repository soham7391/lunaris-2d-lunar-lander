/**
 * @file TransformLab.tsx
 * Interactive Computer Graphics 2D Transformation Laboratory.
 * 
 * Demonstrates genuinely implemented CG concepts:
 * 1. Translation: T(tx, ty)
 * 2. Rotation: R(θ) around local origin
 * 3. Scaling: S(sx, sy) uniform and non-uniform
 * 4. Reflection: Axis flip (sx = -1, sy = -1)
 * 5. Shearing: Sh(shx, shy) along X and Y axes
 * 6. Matrix Composition & Non-Commutativity: (T · R · S ≠ R · T · S)
 * 7. 2D Homogeneous Coordinates: Unified 3x3 matrix representation
 * 
 * Provides viva-ready explanations, mathematical formulas, interactive visual feedback,
 * and explicit "Where LUNARIS uses it" code mappings.
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
  BookOpen,
  Info,
  CheckCircle2,
  Play
} from 'lucide-react';
import { drawLander } from '../graphics/drawLander';

interface TransformLabProps {
  onReturnToSimulation: () => void;
  onReturnToMenu: () => void;
}

type ModelType = 'LEM' | 'POLYGON_F';
type OrderType = 'TRS' | 'RTS'; // Translate*Rotate*Scale vs Rotate*Translate*Scale
type ActiveConceptTab = 'ALL' | 'TRANSLATION' | 'ROTATION' | 'SCALING' | 'REFLECTION' | 'SHEARING' | 'COMPOSITION';

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
  const [activeConceptTab, setActiveConceptTab] = useState<ActiveConceptTab>('ALL');

  // Reset all parameters to identity state
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
    setCompositionOrder('TRS');
  };

  // Preset Demonstrations for instant exploration
  const applyPreset = (preset: 'DEFAULT' | 'TRANSLATE_DEMO' | 'ROTATE_DEMO' | 'SHEAR_DEMO' | 'REFLECT_DEMO' | 'NON_COMMUTATIVE_DEMO') => {
    handleReset();
    if (preset === 'TRANSLATE_DEMO') {
      setActiveConceptTab('TRANSLATION');
      setTx(120);
      setTy(-80);
    } else if (preset === 'ROTATE_DEMO') {
      setActiveConceptTab('ROTATION');
      setRotDeg(45);
    } else if (preset === 'SHEAR_DEMO') {
      setActiveConceptTab('SHEARING');
      setModelType('POLYGON_F');
      setShx(0.65);
      setSx(1.15);
      setSy(1.15);
    } else if (preset === 'REFLECT_DEMO') {
      setActiveConceptTab('REFLECTION');
      setModelType('POLYGON_F');
      setReflectX(true);
      setRotDeg(20);
    } else if (preset === 'NON_COMMUTATIVE_DEMO') {
      setActiveConceptTab('COMPOSITION');
      setModelType('LEM');
      setTx(110);
      setTy(0);
      setRotDeg(50);
      setCompositionOrder('RTS');
    }
  };

  // Convert rotation to radians
  const rotRad = (rotDeg * Math.PI) / 180;
  const effectiveSx = sx * (reflectX ? -1 : 1);
  const effectiveSy = sy * (reflectY ? -1 : 1);

  // Compute 2D Homogeneous Matrix components:
  // [ a  c  e ]
  // [ b  d  f ]
  // [ 0  0  1 ]
  const cos = Math.cos(rotRad);
  const sin = Math.sin(rotRad);

  let a = 1, b = 0, c = 0, d = 1, e = tx, f = ty;

  if (compositionOrder === 'TRS') {
    // Standard pipeline: Translate * Rotate * Shear * Scale
    // Local transform before translation:
    const m00 = effectiveSx;
    const m01 = shx * effectiveSy;
    const m10 = shy * effectiveSx;
    const m11 = effectiveSy;

    // Multiply Rotation with (Shear * Scale):
    a = cos * m00 - sin * m10;
    c = cos * m01 - sin * m11;
    b = sin * m00 + cos * m10;
    d = sin * m01 + cos * m11;
    e = tx;
    f = ty;
  } else {
    // Non-commutative demonstration: Rotate * Translate * Scale
    // Object translates, then whole system rotates around world origin!
    a = cos * effectiveSx;
    b = sin * effectiveSx;
    c = -sin * effectiveSy;
    d = cos * effectiveSy;
    e = cos * tx - sin * ty;
    f = sin * tx + cos * ty;
  }

  // Draw scene to canvas
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
    ctx.fillStyle = '#050813';
    ctx.fillRect(0, 0, width, height);

    // 2. Global Cartesian Grid (Centered on Canvas Origin)
    if (showGrid) {
      drawLabGrid(ctx, width, height, originX, originY);
    }

    // 3. Ghost Baseline (Untransformed object at origin in dashed outline)
    if (showGhost) {
      ctx.save();
      ctx.translate(originX, originY);
      drawModel(ctx, modelType, true);
      ctx.restore();
    }

    // 4. Orbital Path Arc for Non-Commutative R·T demonstration
    if (compositionOrder === 'RTS' && (tx !== 0 || ty !== 0)) {
      ctx.save();
      ctx.translate(originX, originY);
      const orbitRadius = Math.sqrt(tx * tx + ty * ty);
      ctx.beginPath();
      ctx.arc(0, 0, orbitRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Line from origin to translated center
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(e, f);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.stroke();
      ctx.restore();
    }

    // 5. Transformed Object
    ctx.save();
    // Shift coordinate system to canvas center
    ctx.translate(originX, originY);

    // Apply the exact 2D Homogeneous Affine Transformation Matrix via Canvas 2D
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
    <div className="min-h-screen bg-[#030610] text-slate-100 flex flex-col justify-between select-none">
      {/* Top Navigation Bar */}
      <header className="h-14 px-4 sm:px-8 bg-[#060a16] border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onReturnToSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
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
          <span className="text-xs text-slate-600 hidden sm:inline">/</span>
          <span className="text-xs font-mono text-slate-400 hidden md:inline">
            2D AFFINE HOMOGENEOUS MATRIX EXPLORER
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
            title="Reset All Transformation Parameters to Identity Matrix"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset Identity</span>
          </button>
        </div>
      </header>

      {/* Main Workspace (Canvas Viewport + Controls & Viva Guide Inspector) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left: Canvas Transformation Viewport */}
        <div className="flex-1 relative w-full h-[45vh] lg:h-full bg-[#040714] overflow-hidden flex flex-col">
          {/* Preset Buttons Header */}
          <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 z-10 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <span className="text-[10px] uppercase text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                Viva Demos:
              </span>
              <button
                onClick={() => applyPreset('TRANSLATE_DEMO')}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 rounded border border-slate-700 transition-colors cursor-pointer text-xs"
              >
                Translation
              </button>
              <button
                onClick={() => applyPreset('ROTATE_DEMO')}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-700 transition-colors cursor-pointer text-xs"
              >
                Rotation
              </button>
              <button
                onClick={() => applyPreset('SHEAR_DEMO')}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-rose-300 rounded border border-slate-700 transition-colors cursor-pointer text-xs"
              >
                Shear
              </button>
              <button
                onClick={() => applyPreset('REFLECT_DEMO')}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded border border-slate-700 transition-colors cursor-pointer text-xs"
              >
                Reflection
              </button>
              <button
                onClick={() => applyPreset('NON_COMMUTATIVE_DEMO')}
                className="px-2 py-0.5 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 rounded border border-amber-700 transition-colors cursor-pointer text-xs font-semibold"
                title="Demonstrates T·R ≠ R·T"
              >
                Order Matters (T·R vs R·T)
              </button>
            </div>

            {/* Model Geometry Toggle */}
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setModelType('LEM')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  modelType === 'LEM' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Apollo LEM
              </button>
              <button
                onClick={() => setModelType('POLYGON_F')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  modelType === 'POLYGON_F' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
                title="Standard asymmetric CG benchmark polygon for shear & reflection"
              >
                Asymmetric 'F'
              </button>
            </div>
          </div>

          {/* Interactive Canvas Stage */}
          <div className="flex-1 relative w-full h-full">
            <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

            {/* Viewport Toggles Bottom Bar */}
            <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 text-[11px] font-mono z-10 bg-slate-950/90 p-1.5 rounded-lg border border-slate-800 backdrop-blur-md">
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
                Local Axes [u,v]: {showLocalAxes ? 'ON' : 'OFF'}
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
        </div>

        {/* Right: Controls & Viva Study Guide Inspector */}
        <aside className="w-full lg:w-[440px] xl:w-[480px] bg-[#070b18] border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col max-h-[55vh] lg:max-h-full shrink-0 overflow-hidden">
          {/* Concept Filter Tabs */}
          <div className="px-4 pt-3 pb-2 border-b border-slate-800 shrink-0 bg-slate-950/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>CG Concept Inspector</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">7 VERIFIED CONCEPTS</span>
            </div>

            <div className="flex flex-wrap gap-1 text-[11px] font-mono">
              <button
                onClick={() => setActiveConceptTab('ALL')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  activeConceptTab === 'ALL' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveConceptTab('TRANSLATION')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  activeConceptTab === 'TRANSLATION' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-emerald-400/80 hover:text-emerald-300'
                }`}
              >
                Translate
              </button>
              <button
                onClick={() => setActiveConceptTab('ROTATION')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  activeConceptTab === 'ROTATION' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-cyan-400/80 hover:text-cyan-300'
                }`}
              >
                Rotate
              </button>
              <button
                onClick={() => setActiveConceptTab('SCALING')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  activeConceptTab === 'SCALING' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-amber-400/80 hover:text-amber-300'
                }`}
              >
                Scale
              </button>
              <button
                onClick={() => setActiveConceptTab('REFLECTION')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  activeConceptTab === 'REFLECTION' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-amber-400/80 hover:text-amber-300'
                }`}
              >
                Reflect
              </button>
              <button
                onClick={() => setActiveConceptTab('SHEARING')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  activeConceptTab === 'SHEARING' ? 'bg-rose-500 text-slate-950 font-bold' : 'bg-slate-900 text-rose-400/80 hover:text-rose-300'
                }`}
              >
                Shear
              </button>
              <button
                onClick={() => setActiveConceptTab('COMPOSITION')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  activeConceptTab === 'COMPOSITION' ? 'bg-purple-500 text-slate-950 font-bold' : 'bg-slate-900 text-purple-400/80 hover:text-purple-300'
                }`}
              >
                Order (T·R·S)
              </button>
            </div>
          </div>

          {/* Scrollable Controls & Viva Explanations Body */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* 2D Homogeneous Matrix Visualizer Card */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 font-bold">2D Homogeneous Matrix M:</span>
                <span className="text-[10px] text-slate-500">CANVAS: ctx.transform(a,b,c,d,e,f)</span>
              </div>

              {/* Bracket Grid Display */}
              <div className="flex items-center justify-center gap-3 py-1.5 text-xs text-slate-200">
                <span className="text-2xl text-cyan-500/80 font-light">[</span>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-center tabular-nums">
                  <span className="text-cyan-300 font-semibold" title="a = sx*cos - shy*sin">{a.toFixed(2)}</span>
                  <span className="text-cyan-300 font-semibold" title="c = shx*cos - sy*sin">{c.toFixed(2)}</span>
                  <span className="text-emerald-400 font-semibold" title="e = tx">{e.toFixed(1)}</span>

                  <span className="text-cyan-300 font-semibold" title="b = sx*sin + shy*cos">{b.toFixed(2)}</span>
                  <span className="text-cyan-300 font-semibold" title="d = shx*sin + sy*cos">{d.toFixed(2)}</span>
                  <span className="text-emerald-400 font-semibold" title="f = ty">{f.toFixed(1)}</span>

                  <span className="text-slate-500">0.00</span>
                  <span className="text-slate-500">0.00</span>
                  <span className="text-slate-400">1.00</span>
                </div>
                <span className="text-2xl text-cyan-500/80 font-light">]</span>
              </div>

              <div className="text-[10px] text-slate-400 border-t border-slate-900 pt-1.5 flex justify-between">
                <span className="text-cyan-300">Linear: [a, c; b, d] (Rot/Scale/Shear)</span>
                <span className="text-emerald-400">Translation: [e, f]</span>
              </div>
            </div>

            {/* 1. TRANSLATION SECTION */}
            {(activeConceptTab === 'ALL' || activeConceptTab === 'TRANSLATION') && (
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <Move className="w-3.5 h-3.5" />
                    Translation T(tx, ty)
                  </span>
                  <span className="text-[10px] text-emerald-400">[{tx}px, {ty}px]</span>
                </div>

                {/* Viva Explanation Card */}
                <div className="text-[11px] space-y-1.5 text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 font-sans">
                  <p><strong className="text-emerald-400 font-mono">Viva Definition:</strong> Shifts an object along coordinate axes without changing its shape, size, or orientation.</p>
                  <p><strong className="text-emerald-400 font-mono">Matrix Formula:</strong> <code className="text-cyan-300 font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded">[1 0 tx; 0 1 ty; 0 0 1] · [x; y; 1] = [x + tx; y + ty; 1]</code></p>
                  <p className="text-slate-400 text-[10.5px] border-t border-slate-800/80 pt-1"><strong className="text-cyan-300 font-mono">Where LUNARIS uses it:</strong> In <code className="text-slate-300 font-mono">drawLander.ts</code> & <code className="text-slate-300 font-mono">SimulationView.tsx</code>, translates the LEM from local origin (0, 0) to active world coordinates (x, y) on canvas.</p>
                </div>

                {/* Sliders */}
                <div className="space-y-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Tx (Horizontal):</span>
                      <span className="text-emerald-300">{tx} px</span>
                    </div>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={tx}
                      onChange={(e) => setTx(parseInt(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Ty (Vertical):</span>
                      <span className="text-emerald-300">{ty} px</span>
                    </div>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={ty}
                      onChange={(e) => setTy(parseInt(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. ROTATION SECTION */}
            {(activeConceptTab === 'ALL' || activeConceptTab === 'ROTATION') && (
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-cyan-400">
                    <RotateCw className="w-3.5 h-3.5" />
                    Rotation R(θ)
                  </span>
                  <span className="text-[10px] text-cyan-400">{rotDeg}° · {rotRad.toFixed(2)} rad</span>
                </div>

                {/* Viva Explanation Card */}
                <div className="text-[11px] space-y-1.5 text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 font-sans">
                  <p><strong className="text-cyan-400 font-mono">Viva Definition:</strong> Rotates an object by angle θ around a fixed pivot point (local origin / Center of Mass).</p>
                  <p><strong className="text-cyan-400 font-mono">Matrix Formula:</strong> <code className="text-cyan-300 font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded">[cosθ -sinθ 0; sinθ cosθ 0; 0 0 1]</code></p>
                  <p className="text-slate-400 text-[10.5px] border-t border-slate-800/80 pt-1"><strong className="text-cyan-300 font-mono">Where LUNARIS uses it:</strong> When pilot presses <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-200 font-mono">A</kbd>/<kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-200 font-mono">D</kbd>, rotates the lander around its Center of Mass, vectoring the descent engine thrust angle.</p>
                </div>

                {/* Slider */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Angle θ:</span>
                    <span className="text-cyan-300">{rotDeg}°</span>
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
              </div>
            )}

            {/* 3. SCALING & REFLECTION SECTION */}
            {(activeConceptTab === 'ALL' || activeConceptTab === 'SCALING' || activeConceptTab === 'REFLECTION') && (
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-amber-400">
                    <Maximize2 className="w-3.5 h-3.5" />
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
                    <span>Uniform Aspect</span>
                  </label>
                </div>

                {/* Viva Explanation Card */}
                <div className="text-[11px] space-y-1.5 text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 font-sans">
                  <p><strong className="text-amber-400 font-mono">Viva Definition (Scale):</strong> Multiplies coordinate distances by factors (sx, sy). Uniform if sx = sy, non-uniform otherwise.</p>
                  <p><strong className="text-amber-400 font-mono">Viva Definition (Reflection):</strong> A special case of scaling using negative scale factors (sx = -1 flips across Y-axis, sy = -1 flips across X-axis).</p>
                  <p><strong className="text-amber-400 font-mono">Matrix Formula:</strong> <code className="text-cyan-300 font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded">[sx 0 0; 0 sy 0; 0 0 1]</code></p>
                  <p className="text-slate-400 text-[10.5px] border-t border-slate-800/80 pt-1"><strong className="text-cyan-300 font-mono">Where LUNARIS uses it:</strong> Scales the lander model size for rendering (<code className="text-slate-300 font-mono">scale: 1.2</code>), scales thrust flame length with throttle, and mirrors landing struts symmetrically across the Y-axis.</p>
                </div>

                {/* Scale Sliders */}
                <div className="space-y-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Sx (Horizontal Scale):</span>
                      <span className="text-amber-300">{sx.toFixed(2)}x</span>
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
                        <span>Sy (Vertical Scale):</span>
                        <span className="text-amber-300">{sy.toFixed(2)}x</span>
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
                </div>

                {/* Reflection Axis Flip Buttons */}
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <button
                    onClick={() => setReflectX(!reflectX)}
                    className={`flex-1 py-1.5 px-2 rounded border text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      reflectX ? 'bg-amber-950 text-amber-300 border-amber-700' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Flip X (Sx = {reflectX ? '-1' : '+1'})</span>
                  </button>
                  <button
                    onClick={() => setReflectY(!reflectY)}
                    className={`flex-1 py-1.5 px-2 rounded border text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      reflectY ? 'bg-amber-950 text-amber-300 border-amber-700' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    <span>Flip Y (Sy = {reflectY ? '-1' : '+1'})</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. SHEARING SECTION */}
            {(activeConceptTab === 'ALL' || activeConceptTab === 'SHEARING') && (
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-rose-400">
                    <Layers className="w-3.5 h-3.5" />
                    Shearing Sh(shx, shy)
                  </span>
                  <span className="text-[10px] text-rose-400">[{shx.toFixed(2)}, {shy.toFixed(2)}]</span>
                </div>

                {/* Viva Explanation Card */}
                <div className="text-[11px] space-y-1.5 text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 font-sans">
                  <p><strong className="text-rose-400 font-mono">Viva Definition:</strong> Slants an object along one axis proportionally to its perpendicular coordinate, preserving area while distorting angles into parallelograms.</p>
                  <p><strong className="text-rose-400 font-mono">Matrix Formula:</strong> <code className="text-cyan-300 font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded">[1 shx 0; shy 1 0; 0 0 1] · [x; y; 1] = [x + shx·y; y + shy·x; 1]</code></p>
                  <p className="text-slate-400 text-[10.5px] border-t border-slate-800/80 pt-1"><strong className="text-cyan-300 font-mono">Where LUNARIS uses it:</strong> Demonstrated in Transform Lab on the Asymmetric 'F' benchmark polygon; used in computer graphics for pseudo-3D oblique projections and italicized HUD telemetry.</p>
                </div>

                {/* Shearing Sliders */}
                <div className="space-y-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Horizontal Shear (Shx):</span>
                      <span className="text-rose-300">{shx.toFixed(2)}</span>
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
                      <span className="text-rose-300">{shy.toFixed(2)}</span>
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
            )}

            {/* 5. MATRIX COMPOSITION & ORDER MATTERS SECTION */}
            {(activeConceptTab === 'ALL' || activeConceptTab === 'COMPOSITION') && (
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-purple-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Composition: Order Matters
                  </span>
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
                    <button
                      onClick={() => setCompositionOrder('TRS')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        compositionOrder === 'TRS' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-500'
                      }`}
                      title="Translate * Rotate * Scale (Standard LUNARIS order)"
                    >
                      T · R · S
                    </button>
                    <button
                      onClick={() => setCompositionOrder('RTS')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        compositionOrder === 'RTS' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-500'
                      }`}
                      title="Rotate * Translate * Scale (Reversed order demonstrator)"
                    >
                      R · T · S
                    </button>
                  </div>
                </div>

                {/* Viva Explanation Card */}
                <div className="text-[11px] space-y-2 text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 font-sans">
                  <p><strong className="text-purple-400 font-mono">Viva Definition:</strong> Matrix multiplication is associative (A·B)·C = A·(B·C) but <strong className="text-amber-300">NON-COMMUTATIVE</strong>: A · B ≠ B · A. The sequence of applied transformations fundamentally alters the final coordinate positions.</p>
                  
                  {/* Dynamic Proof Box */}
                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800 font-mono text-[10.5px] space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Order Selected:</span>
                      <strong className={compositionOrder === 'TRS' ? 'text-cyan-300' : 'text-amber-300'}>
                        {compositionOrder === 'TRS' ? 'T · R · S (Rotate in place, then Translate)' : 'R · T · S (Translate, then Rotate around Origin)'}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Resulting Translation [e, f]:</span>
                      <span className="text-emerald-400 font-bold">[{e.toFixed(1)}, {f.toFixed(1)}]</span>
                    </div>
                    <p className="text-slate-400 text-[10px]">
                      {compositionOrder === 'TRS'
                        ? 'Under T·R, [e, f] = [tx, ty]. The craft translates to (tx, ty) and rotates on its own center.'
                        : 'Under R·T, [e, f] = [tx·cosθ - ty·sinθ, tx·sinθ + ty·cosθ]. The craft orbits the origin along an arc!'}
                    </p>
                  </div>

                  <p className="text-slate-400 text-[10.5px] border-t border-slate-800/80 pt-1">
                    <strong className="text-cyan-300 font-mono">Where LUNARIS uses it:</strong> In <code className="text-slate-300 font-mono">drawLander.ts</code>, we strictly apply <code className="text-slate-300 font-mono">ctx.translate(x, y)</code> then <code className="text-slate-300 font-mono">ctx.rotate(θ)</code>. If the order were reversed (<code className="text-slate-300 font-mono">rotate</code> then <code className="text-slate-300 font-mono">translate</code>), the lander would orbit the top-left canvas origin instead of rotating around its own Center of Mass!
                  </p>
                </div>
              </div>
            )}

            {/* 6. HOMOGENEOUS COORDINATES VIVA CARD */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5 font-sans text-xs">
              <span className="font-mono font-bold text-cyan-400 text-[11px] uppercase flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Why Homogeneous Coordinates? (Viva Answer)
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                In Cartesian coordinates $(x, y)$, translation is non-linear addition ($x' = x + t_x$), while rotation and scaling are matrix multiplications. By augmenting coordinates to 3D with $w=1$ ($[x, y, 1]^T$), translation becomes a linear matrix multiplication:
              </p>
              <div className="p-1.5 bg-slate-900 rounded font-mono text-[10.5px] text-cyan-200 text-center">
                P' = M · P &nbsp;=&gt;&nbsp; [x', y', 1]^T = M_TRS · [x, y, 1]^T
              </div>
              <p className="text-slate-400 text-[10.5px]">
                This allows the GPU and Canvas 2D engine to concatenate all translations, rotations, and scalings into a single composite $3 \times 3$ matrix before rendering vertices.
              </p>
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
  ctx.lineTo(0, -55);
  ctx.stroke();

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(0, -62);
  ctx.lineTo(-4, -54);
  ctx.lineTo(4, -54);
  ctx.closePath();
  ctx.fill();

  // Local V axis (Lateral, +X) -> GREEN
  ctx.strokeStyle = '#22c55e';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(55, 0);
  ctx.stroke();

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.moveTo(62, 0);
  ctx.lineTo(54, -4);
  ctx.lineTo(54, 4);
  ctx.closePath();
  ctx.fill();

  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = '#ef4444';
  ctx.fillText('u (forward)', -14, -54);
  ctx.fillStyle = '#22c55e';
  ctx.fillText('v (lateral)', 54, 16);

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

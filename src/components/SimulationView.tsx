/**
 * @file SimulationView.tsx
 * Gameplay viewport scaffold for LUNARIS 2D Lunar Landing Simulation.
 * Renders the lunar terrain, landing pad beacons, starfield, and vector lander placeholder.
 * Exposes coordinate and transformation controls to inspect the Computer Graphics pipeline.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  ArrowLeft, 
  HelpCircle, 
  Eye, 
  RotateCcw, 
  Gauge, 
  ShieldCheck, 
  Layers, 
  Crosshair,
  Sliders
} from 'lucide-react';
import { generateStarfield, drawStarfield, Star } from '../graphics/drawStarfield';
import { generateTerrain, drawTerrain, TerrainProfile } from '../graphics/drawTerrain';
import { drawLander } from '../graphics/drawLander';
import { drawWorldGrid, drawAltitudeProjection } from '../graphics/drawGrid';
import { Transform2D, CGDebugOptions, TelemetryData } from '../types/game';

interface SimulationViewProps {
  onReturnToMenu: () => void;
  onOpenBriefing: () => void;
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  onReturnToMenu,
  onOpenBriefing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const terrainRef = useRef<TerrainProfile | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Debug visualization options
  const [debugOptions, setDebugOptions] = useState<CGDebugOptions>({
    showWireframe: false,
    showLocalAxes: true,
    showWorldGrid: true,
    showLandingZoneBounds: true,
    showCenterOfMass: true,
  });

  const [showTerrainNormals, setShowTerrainNormals] = useState(false);

  // Lander initial transform (Staged in upper descent corridor)
  const [landerTransform, setLanderTransform] = useState<Transform2D>({
    position: { x: 500, y: 160 },
    rotation: 0,
    scale: 1.1,
  });

  const [throttle, setThrottle] = useState(0.2);

  // Scaffold telemetry readouts
  const telemetry: TelemetryData = {
    altitude: 1250,
    verticalVelocity: -14.2,
    horizontalVelocity: 3.8,
    pitchAngle: Math.round((landerTransform.rotation * 180) / Math.PI),
    fuelPercent: 100.0,
    throttlePercent: Math.round(throttle * 100),
    status: 'STANDBY',
  };

  // Resize and regenerate terrain
  const setupScene = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = (canvas.width = container.clientWidth);
    const height = (canvas.height = container.clientHeight);

    starsRef.current = generateStarfield(width, height, 180);
    terrainRef.current = generateTerrain(width, height);

    // Position lander centrally above landing pad initially
    setLanderTransform((prev) => ({
      ...prev,
      position: { x: width * 0.5, y: Math.min(180, height * 0.28) },
    }));
  }, []);

  useEffect(() => {
    setupScene();
    window.addEventListener('resize', setupScene);
    return () => window.removeEventListener('resize', setupScene);
  }, [setupScene]);

  // Main Simulation Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startTime = performance.now();

    const render = (timeNow: number) => {
      const elapsed = timeNow - startTime;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // 1. Celestial Backdrop & Twinkling Stars
      drawStarfield(ctx, starsRef.current, elapsed, {
        showEarthCrescent: true,
        earthX: width * 0.12,
        earthY: 80,
      });

      // 2. World Coordinate Grid (Computer Graphics overlay)
      if (debugOptions.showWorldGrid) {
        drawWorldGrid(ctx, width, height, 80);
      }

      // 3. Piecewise Lunar Terrain & Designated Landing Pad
      if (terrainRef.current) {
        drawTerrain(ctx, terrainRef.current, elapsed, showTerrainNormals);

        // 4. Altitude projection line from Lander to Terrain / Pad
        const padY = terrainRef.current.landingPad.y;
        drawAltitudeProjection(
          ctx,
          landerTransform.position.x,
          landerTransform.position.y,
          padY
        );
      }

      // 5. Apollo-style Lunar Module (LEM) Vector Renderer
      drawLander(ctx, landerTransform, {
        thrust: throttle,
        debug: debugOptions,
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [landerTransform, throttle, debugOptions, showTerrainNormals]);

  // Reset to initial nominal descent position
  const handleResetPose = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setLanderTransform({
      position: { x: canvas.width * 0.5, y: Math.min(180, canvas.height * 0.28) },
      rotation: 0,
      scale: 1.1,
    });
    setThrottle(0.2);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#04060d] text-slate-100 overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-14 px-4 sm:px-6 bg-[#060a14] border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        {/* Left: Navigation Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToMenu}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Main Menu</span>
          </button>

          <button
            onClick={onOpenBriefing}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Briefing</span>
          </button>
        </div>

        {/* Center: Stage Title */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
            LUNARIS
          </span>
          <span className="text-xs text-slate-600">/</span>
          <span className="text-xs font-mono text-slate-300 hidden md:inline">
            SIMULATION STAGE 01 · VISUAL & COORDINATE SCAFFOLD
          </span>
        </div>

        {/* Right: Quick View Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setDebugOptions((prev) => ({ ...prev, showWorldGrid: !prev.showWorldGrid }))
            }
            className={`px-2.5 py-1.5 rounded text-xs font-mono border transition-colors cursor-pointer ${
              debugOptions.showWorldGrid
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle World Coordinate Grid"
          >
            Grid
          </button>

          <button
            onClick={() =>
              setDebugOptions((prev) => ({ ...prev, showLocalAxes: !prev.showLocalAxes }))
            }
            className={`px-2.5 py-1.5 rounded text-xs font-mono border transition-colors cursor-pointer ${
              debugOptions.showLocalAxes
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Lander Local Body Axes [u, v]"
          >
            Axes
          </button>

          <button
            onClick={() => setShowTerrainNormals((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded text-xs font-mono border transition-colors cursor-pointer ${
              showTerrainNormals
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Piecewise Terrain Segment Normals"
          >
            Normals
          </button>
        </div>
      </header>

      {/* Architecture Notice Banner */}
      <div className="bg-cyan-950/40 border-b border-cyan-900/50 px-4 py-2 flex items-center justify-between text-xs font-mono text-cyan-300 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            VISUAL SCAFFOLD ACTIVE: Canvas 2D scene, piecewise terrain, and vector LEM placeholder initialized. Physics dynamics and collision resolution decoupled for subsequent milestone.
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-3 text-slate-400 shrink-0 ml-4">
          <span>PIPELINE: M = T · R · S</span>
          <span>·</span>
          <span>FPS: 60 (RAF)</span>
        </div>
      </div>

      {/* Main Workspace (Canvas + Telemetry HUD) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Canvas 2D Viewport */}
        <div ref={containerRef} className="flex-1 relative w-full h-full bg-[#04060d]">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block cursor-crosshair"
          />

          {/* Viewport Floating Coordinates Badge */}
          <div className="absolute bottom-4 left-4 p-2 bg-slate-950/80 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-400 backdrop-blur-sm pointer-events-none">
            <div>LANDER POS: [{Math.round(landerTransform.position.x)}, {Math.round(landerTransform.position.y)}]</div>
            <div>PITCH: {telemetry.pitchAngle}° · SCALE: {landerTransform.scale}x</div>
          </div>
        </div>

        {/* Right Telemetry & Interactive Matrix Transformation Console */}
        <aside className="w-full lg:w-80 bg-[#070b16] border-t lg:border-t-0 lg:border-l border-slate-800 p-4 space-y-4 flex flex-col justify-between overflow-y-auto max-h-[38vh] lg:max-h-full shrink-0">
          <div className="space-y-4">
            {/* Telemetry Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" />
                Descent Avionics HUD
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/80">
                ● {telemetry.status}
              </span>
            </div>

            {/* Avionics Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">RADAR ALTITUDE</span>
                <span className="text-base font-bold text-white tabular-nums">
                  {telemetry.altitude} <span className="text-[10px] text-slate-400">m</span>
                </span>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">DESCENT RATE (Vy)</span>
                <span className="text-base font-bold text-amber-400 tabular-nums">
                  {telemetry.verticalVelocity} <span className="text-[10px] text-slate-400">m/s</span>
                </span>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">LATERAL DRIFT (Vx)</span>
                <span className="text-base font-bold text-cyan-400 tabular-nums">
                  {telemetry.horizontalVelocity > 0 ? `+${telemetry.horizontalVelocity}` : telemetry.horizontalVelocity}{' '}
                  <span className="text-[10px] text-slate-400">m/s</span>
                </span>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">PITCH ATTITUDE</span>
                <span className="text-base font-bold text-white tabular-nums">
                  {telemetry.pitchAngle}°
                </span>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">PROPELLANT</span>
                <span className="text-base font-bold text-emerald-400 tabular-nums">
                  {telemetry.fuelPercent.toFixed(1)}%
                </span>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">ENGINE THROTTLE</span>
                <span className="text-base font-bold text-amber-400 tabular-nums">
                  {telemetry.throttlePercent}%
                </span>
              </div>
            </div>

            {/* Interactive Transformation Testing Suite */}
            <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Pose Transformation Test
                </span>
                <button
                  onClick={handleResetPose}
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Reset
                </button>
              </div>

              {/* Pitch Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Rotation (Pitch):</span>
                  <span>{Math.round((landerTransform.rotation * 180) / Math.PI)}°</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={Math.round((landerTransform.rotation * 180) / Math.PI)}
                  onChange={(e) => {
                    const deg = parseFloat(e.target.value);
                    setLanderTransform((prev) => ({
                      ...prev,
                      rotation: (deg * Math.PI) / 180,
                    }));
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Altitude Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Altitude (Y):</span>
                  <span>{Math.round(landerTransform.position.y)} px</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="400"
                  step="2"
                  value={landerTransform.position.y}
                  onChange={(e) => {
                    const y = parseFloat(e.target.value);
                    setLanderTransform((prev) => ({
                      ...prev,
                      position: { ...prev.position, y },
                    }));
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Lateral Position Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Lateral (X):</span>
                  <span>{Math.round(landerTransform.position.x)} px</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="900"
                  step="5"
                  value={landerTransform.position.x}
                  onChange={(e) => {
                    const x = parseFloat(e.target.value);
                    setLanderTransform((prev) => ({
                      ...prev,
                      position: { ...prev.position, x },
                    }));
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Throttle Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Throttle Plume:</span>
                  <span>{Math.round(throttle * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={throttle}
                  onChange={(e) => setThrottle(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              onClick={onReturnToMenu}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Main Menu</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

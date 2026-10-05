/**
 * @file SimulationView.tsx
 * Core playable 2D Lunar Landing Simulation for LUNARIS.
 * Supports multiple difficulty levels, level-specific themes, scoring,
 * HUD accents, and navigation to the CG Transform Lab and Level Selector.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  ArrowLeft, 
  HelpCircle, 
  RotateCcw, 
  Gauge, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Pause, 
  Flame, 
  Compass, 
  Fuel, 
  Target,
  ShieldCheck,
  RotateCw,
  Cpu,
  Layers,
  ArrowRight,
  Award,
  Sparkles
} from 'lucide-react';
import { generateStarfield, drawStarfield, Star } from '../graphics/drawStarfield';
import { generateTerrain, drawTerrain, TerrainProfile } from '../graphics/drawTerrain';
import { drawLander } from '../graphics/drawLander';
import { drawWorldGrid, drawAltitudeProjection } from '../graphics/drawGrid';
import { CGDebugOptions, Transform2D } from '../types/game';
import {
  SIMULATION_CONFIG,
  LanderPhysicsState,
  InputState,
  updateSimulationPhysics,
  calculateRadarAltitude,
} from '../physics/simulationEngine';
import { 
  LevelConfig, 
  LEVELS, 
  calculateMissionScore, 
  unlockLevel, 
  MissionScoreBreakdown 
} from '../physics/levels';

interface SimulationViewProps {
  currentLevel: LevelConfig;
  onSelectLevel: (level: LevelConfig) => void;
  onOpenLevelSelect: () => void;
  onOpenTransformLab: () => void;
  onReturnToMenu: () => void;
  onOpenBriefing: () => void;
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  currentLevel,
  onSelectLevel,
  onOpenLevelSelect,
  onOpenTransformLab,
  onReturnToMenu,
  onOpenBriefing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const terrainRef = useRef<TerrainProfile | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Input states tracked in ref for smooth 60fps keyboard response
  const inputRef = useRef<InputState>({
    thrust: false,
    rotateLeft: false,
    rotateRight: false,
  });

  // Computer Graphics debug overlays
  const [debugOptions, setDebugOptions] = useState<CGDebugOptions>({
    showWireframe: false,
    showLocalAxes: true,
    showWorldGrid: true,
    showLandingZoneBounds: true,
    showCenterOfMass: true,
  });
  const [showTerrainNormals, setShowTerrainNormals] = useState<boolean>(false);

  // Simulation physics state
  const [landerState, setLanderState] = useState<LanderPhysicsState>(() => ({
    position: { x: 500, y: 80 },
    velocity: { x: currentLevel.initialVx, y: currentLevel.initialVy },
    rotation: 0,
    scale: 1.1,
    fuel: SIMULATION_CONFIG.INITIAL_FUEL_PERCENT,
    throttle: 0,
    isThrusting: false,
    isRotatingLeft: false,
    isRotatingRight: false,
    status: 'FLYING',
    landingMessage: '',
  }));

  // Mutable ref mirror of physics state to avoid stale closures in requestAnimationFrame
  const landerStateRef = useRef<LanderPhysicsState>(landerState);
  landerStateRef.current = landerState;

  // Real-time telemetry snapshot for React HUD
  const [radarAltitude, setRadarAltitude] = useState<number>(125);

  // Flight guidance tip banner for beginners
  const [showFlightTip, setShowFlightTip] = useState<boolean>(true);

  // Computed score breakdown when landing succeeds
  const [landingScore, setLandingScore] = useState<MissionScoreBreakdown | null>(null);

  // Reset simulation to initial spawn state for the active level
  const restartSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    // Spawn according to level parameters
    const initialX = Math.floor(width * currentLevel.initialLanderXRatio);
    const initialY = Math.max(65, Math.floor(height * currentLevel.initialLanderYRatio));

    const freshState: LanderPhysicsState = {
      position: { x: initialX, y: initialY },
      velocity: { x: currentLevel.initialVx, y: currentLevel.initialVy },
      rotation: 0,
      scale: 1.1,
      fuel: SIMULATION_CONFIG.INITIAL_FUEL_PERCENT,
      throttle: 0,
      isThrusting: false,
      isRotatingLeft: false,
      isRotatingRight: false,
      status: 'FLYING',
      landingMessage: '',
    };

    inputRef.current = { thrust: false, rotateLeft: false, rotateRight: false };
    landerStateRef.current = freshState;
    setLanderState(freshState);
    setLandingScore(null);
    lastTimeRef.current = performance.now();
  }, [currentLevel]);

  // Toggle pause/unpause
  const togglePause = useCallback(() => {
    setLanderState((prev) => {
      const nextStatus = prev.status === 'FLYING' ? 'PAUSED' : prev.status === 'PAUSED' ? 'FLYING' : prev.status;
      lastTimeRef.current = performance.now();
      return {
        ...prev,
        status: nextStatus,
      };
    });
  }, []);

  // Initialize scene dimensions and terrain for the active level
  const setupScene = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = (canvas.width = container.clientWidth);
    const height = (canvas.height = container.clientHeight);

    starsRef.current = generateStarfield(width, height, 200);
    terrainRef.current = generateTerrain(width, height, currentLevel);

    restartSimulation();
  }, [currentLevel, restartSimulation]);

  useEffect(() => {
    setupScene();
    window.addEventListener('resize', setupScene);
    return () => window.removeEventListener('resize', setupScene);
  }, [setupScene]);

  // Keyboard controls listener with preventDefault for gameplay keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        inputRef.current.thrust = true;
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        inputRef.current.rotateLeft = true;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        inputRef.current.rotateRight = true;
      }
      if (e.code === 'KeyP') {
        togglePause();
      }
      if (e.code === 'KeyR') {
        restartSimulation();
      }
      if (e.code === 'KeyG') {
        setDebugOptions((prev) => ({ ...prev, showWorldGrid: !prev.showWorldGrid }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        inputRef.current.thrust = false;
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        inputRef.current.rotateLeft = false;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        inputRef.current.rotateRight = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [togglePause, restartSimulation]);

  // Main Simulation & Rendering Loop (requestAnimationFrame)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    lastTimeRef.current = performance.now();

    const mainLoop = (currentTime: number) => {
      const dt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      const currentTerrain = terrainRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Advance Physics Simulation if flying
      if (currentTerrain && landerStateRef.current.status === 'FLYING') {
        const nextState = updateSimulationPhysics(
          landerStateRef.current,
          inputRef.current,
          currentTerrain,
          dt
        );
        landerStateRef.current = nextState;
        setLanderState(nextState);

        // Update radar altitude
        const alt = calculateRadarAltitude(nextState, currentTerrain.points);
        setRadarAltitude(alt);

        // Trigger score calculation and progressive unlock if landed
        if (nextState.status === 'LANDED') {
          const vy = nextState.touchdownMetrics?.vyMs ?? (nextState.velocity.y / SIMULATION_CONFIG.PIXELS_PER_METER);
          const vx = nextState.touchdownMetrics?.vxMs ?? (Math.abs(nextState.velocity.x) / SIMULATION_CONFIG.PIXELS_PER_METER);
          const tilt = nextState.touchdownMetrics?.tiltDeg ?? Math.abs((nextState.rotation * 180) / Math.PI);
          const score = calculateMissionScore(nextState.fuel, vy, vx, tilt, currentLevel);
          setLandingScore(score);

          // Unlock subsequent sector
          if (currentLevel.id < 3) {
            unlockLevel(currentLevel.id + 1);
          }
        }
      }

      const currentState = landerStateRef.current;

      // 2. Clear Screen
      ctx.clearRect(0, 0, width, height);

      // 3. Render Level-Themed Starfield & Celestial Backdrop
      drawStarfield(ctx, starsRef.current, currentTime, {
        showEarthCrescent: true,
        earthX: width * 0.12,
        earthY: 80,
        spaceGradient: currentLevel.theme.spaceGradient,
        nebulaColor: currentLevel.theme.nebulaColor,
        nebulaCenter: currentLevel.theme.nebulaCenter,
        celestialBody: currentLevel.theme.celestialBody,
      });

      // 4. World Coordinate Grid (Computer Graphics overlay)
      if (debugOptions.showWorldGrid) {
        drawWorldGrid(ctx, width, height, 80);
      }

      // 5. Piecewise Terrain & Designated Landing Pad
      if (currentTerrain) {
        drawTerrain(ctx, currentTerrain, currentTime, showTerrainNormals, currentLevel.theme);

        // Altitude projection line
        const padY = currentTerrain.landingPad.y;
        drawAltitudeProjection(
          ctx,
          currentState.position.x,
          currentState.position.y,
          padY
        );
      }

      // 6. Draw Vector Apollo Lunar Module (LEM)
      const landerTransform: Transform2D = {
        position: currentState.position,
        rotation: currentState.rotation,
        scale: currentState.scale,
      };

      drawLander(ctx, landerTransform, {
        thrust: currentState.throttle,
        rcsLeft: currentState.isRotatingLeft,
        rcsRight: currentState.isRotatingRight,
        debug: debugOptions,
      });

      // 7. Visual Impact Indicator if Crashed
      if (currentState.status === 'CRASHED' && currentState.collisionDetails) {
        drawCrashExplosion(ctx, currentState.collisionDetails.impactPoint, currentTime);
      }

      animFrameRef.current = requestAnimationFrame(mainLoop);
    };

    animFrameRef.current = requestAnimationFrame(mainLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [debugOptions, showTerrainNormals, currentLevel]);

  // Helper: Draw visual crash wreckage & spark geometry
  const drawCrashExplosion = (
    ctx: CanvasRenderingContext2D,
    point: { x: number; y: number },
    time: number
  ) => {
    ctx.save();
    const sparks = 8;
    for (let i = 0; i < sparks; i++) {
      const angle = (i / sparks) * Math.PI * 2 + time * 0.003;
      const dist = 18 + Math.sin(time * 0.01 + i) * 10;
      ctx.fillStyle = i % 2 === 0 ? '#f59e0b' : '#ef4444';
      ctx.beginPath();
      ctx.arc(point.x + Math.cos(angle) * dist, point.y + Math.sin(angle) * dist, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Impact ring
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };

  // Convert velocities to authentic m/s for telemetry HUD
  const vyMs = landerState.velocity.y / SIMULATION_CONFIG.PIXELS_PER_METER;
  const vxMs = landerState.velocity.x / SIMULATION_CONFIG.PIXELS_PER_METER;
  const pitchDeg = (landerState.rotation * 180) / Math.PI;

  // Validation checks for color-coded telemetry
  const isVySafe = vyMs <= SIMULATION_CONFIG.MAX_LANDING_VERTICAL_SPEED_MS;
  const isVxSafe = Math.abs(vxMs) <= SIMULATION_CONFIG.MAX_LANDING_HORIZONTAL_SPEED_MS;
  const isPitchSafe = Math.abs(pitchDeg) <= SIMULATION_CONFIG.MAX_LANDING_TILT_DEG;

  // Next level helper
  const nextLevel = LEVELS.find((l) => l.id === currentLevel.id + 1);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#04060d] text-slate-100 overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-14 px-4 sm:px-6 bg-[#060a14] border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        {/* Left: Navigation Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onReturnToMenu}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Menu</span>
          </button>

          <button
            onClick={onOpenLevelSelect}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-800 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            title="Open Campaign Level Selector"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sectors</span>
          </button>

          <button
            onClick={onOpenTransformLab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-800 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            title="Open Computer Graphics Transform Lab"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Transform Lab</span>
          </button>

          <button
            onClick={restartSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            title="Restart Descent (Key: R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restart (R)</span>
          </button>
        </div>

        {/* Center: Flight Sector & Level Title */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono font-bold tracking-widest uppercase ${currentLevel.theme.hudAccentColor}`}>
            LEVEL 0{currentLevel.id}: {currentLevel.name}
          </span>
          <span className="text-xs text-slate-600 hidden md:inline">/</span>
          <span className="text-xs font-mono text-slate-400 hidden md:inline">
            {currentLevel.sector}
          </span>
        </div>

        {/* Right: Pause & CG Debug Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
            title="Pause Simulation (Key: P)"
          >
            {landerState.status === 'PAUSED' ? (
              <>
                <Play className="w-3.5 h-3.5 fill-amber-300" />
                <span>Resume (P)</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause (P)</span>
              </>
            )}
          </button>

          <button
            onClick={() =>
              setDebugOptions((prev) => ({ ...prev, showWorldGrid: !prev.showWorldGrid }))
            }
            className={`px-2.5 py-1.5 rounded text-xs font-mono border transition-colors cursor-pointer ${
              debugOptions.showWorldGrid
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle World Coordinate Grid (G)"
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

      {/* Flight Mode Notification Banner */}
      <div className="bg-[#050914] border-b border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-xs font-mono shrink-0">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          {landerState.status === 'FLYING' && (
            <>
              <span className={`w-2 h-2 rounded-full ${currentLevel.theme.hudAccentColor === 'text-cyan-400' ? 'bg-cyan-400' : currentLevel.theme.hudAccentColor === 'text-amber-400' ? 'bg-amber-400' : 'bg-rose-500'} animate-pulse`}></span>
              <span className="text-slate-300">
                ACTIVE DESCENT · Level 0{currentLevel.id} ({currentLevel.difficulty}) · W/Space = Thrust, A/D = Roll
              </span>
            </>
          )}
          {landerState.status === 'PAUSED' && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-amber-300">SIMULATION PAUSED · Press P or Resume to continue descent</span>
            </>
          )}
          {landerState.status === 'LANDED' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-emerald-300 font-bold">TOUCHDOWN CONFIRMED · Mission Objective Accomplished</span>
            </>
          )}
          {landerState.status === 'CRASHED' && (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-rose-400 font-bold">IMPACT DETECTED · Vehicle structural envelope breached</span>
            </>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-4 text-slate-500 text-[11px]">
          <span>SECTOR: {currentLevel.padLabel}</span>
          <span>·</span>
          <span>P = Pause · R = Restart</span>
        </div>
      </div>

      {/* Main Workspace (Canvas 2D Viewport + Avionics HUD) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Canvas 2D Viewport */}
        <div ref={containerRef} className="flex-1 relative w-full h-full bg-[#04060d]">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block cursor-crosshair"
          />

          {/* Flight Guidance Tip Banner for Beginners */}
          {showFlightTip && landerState.status === 'FLYING' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 border border-cyan-500/40 text-cyan-200 px-4 py-2.5 rounded-xl text-xs font-mono backdrop-blur-md shadow-xl flex items-center gap-3 max-w-lg w-[92%] sm:w-auto">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <div className="flex-1 text-[11px] sm:text-xs">
                <span className="font-bold text-cyan-300">FLIGHT ADVISORY:</span> Pulse <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-white">W</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-white">SPACE</kbd> in short bursts to keep descent under 3.2 m/s. Keep tilt under 10°.
              </div>
              <button
                onClick={() => setShowFlightTip(false)}
                className="text-slate-400 hover:text-white px-2 py-0.5 rounded text-xs bg-slate-800 hover:bg-slate-700 cursor-pointer shrink-0"
                aria-label="Dismiss flight tip"
              >
                Got it
              </button>
            </div>
          )}

          {/* Touch/Mouse On-Screen Flight Controls Overlay */}
          <div className="absolute bottom-6 left-6 flex items-center gap-3 z-10">
            <button
              onMouseDown={() => (inputRef.current.rotateLeft = true)}
              onMouseUp={() => (inputRef.current.rotateLeft = false)}
              onTouchStart={() => (inputRef.current.rotateLeft = true)}
              onTouchEnd={() => (inputRef.current.rotateLeft = false)}
              className="p-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl backdrop-blur-sm shadow-lg active:scale-95 transition-all text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              title="Attitude Pitch Port (A / Left)"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>A</span>
            </button>

            <button
              onMouseDown={() => (inputRef.current.thrust = true)}
              onMouseUp={() => (inputRef.current.thrust = false)}
              onTouchStart={() => (inputRef.current.thrust = true)}
              onTouchEnd={() => (inputRef.current.thrust = false)}
              className="px-5 py-3 bg-cyan-400/90 hover:bg-cyan-300 text-slate-950 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all text-xs font-mono font-bold flex items-center gap-2 cursor-pointer"
              title="Main Engine Thrust (W / Space)"
            >
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>THRUST (W / SPACE)</span>
            </button>

            <button
              onMouseDown={() => (inputRef.current.rotateRight = true)}
              onMouseUp={() => (inputRef.current.rotateRight = false)}
              onTouchStart={() => (inputRef.current.rotateRight = true)}
              onTouchEnd={() => (inputRef.current.rotateRight = false)}
              className="p-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl backdrop-blur-sm shadow-lg active:scale-95 transition-all text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              title="Attitude Pitch Starboard (D / Right)"
            >
              <span>D</span>
              <RotateCw className="w-4 h-4 text-cyan-400" />
            </button>
          </div>

          {/* Coordinate Badge */}
          <div className="absolute top-4 left-4 p-2 bg-slate-950/80 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-400 backdrop-blur-sm pointer-events-none">
            <div>POSITION: [{Math.round(landerState.position.x)}, {Math.round(landerState.position.y)}]</div>
            <div>LEVEL: 0{currentLevel.id} · STATUS: {landerState.status}</div>
          </div>

          {/* PAUSED MODAL OVERLAY */}
          {landerState.status === 'PAUSED' && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="bg-[#0b1120] border border-slate-700 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in fade-in duration-150">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  <Pause className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                    Simulation Paused
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Level 0{currentLevel.id}: {currentLevel.name}
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <button
                    onClick={togglePause}
                    className="w-full py-2.5 px-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Resume Flight (P)</span>
                  </button>
                  <button
                    onClick={restartSimulation}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                    <span>Restart Sector (R)</span>
                  </button>
                  <button
                    onClick={onOpenLevelSelect}
                    className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-semibold uppercase tracking-wider rounded-xl border border-slate-800 transition-colors cursor-pointer"
                  >
                    Choose Different Sector
                  </button>
                  <button
                    onClick={onOpenTransformLab}
                    className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold uppercase tracking-wider rounded-xl border border-slate-800 transition-colors cursor-pointer"
                  >
                    Open CG Transform Lab
                  </button>
                  <button
                    onClick={onReturnToMenu}
                    className="w-full py-2 px-4 text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Return to Main Menu
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TOUCHDOWN SUCCESS MODAL OVERLAY */}
          {landerState.status === 'LANDED' && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
              <div className="bg-[#07131e] border border-emerald-500/50 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider block">
                        LEVEL 0{currentLevel.id} COMPLETE · {currentLevel.sector}
                      </span>
                      <h3 className="text-xl font-extrabold text-white uppercase tracking-tight">
                        Touchdown Confirmed
                      </h3>
                    </div>
                  </div>

                  {landingScore && (
                    <div className="text-right font-mono bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 block uppercase">Mission Score</span>
                      <span className="text-lg font-bold text-emerald-300">
                        {landingScore.totalScore.toLocaleString()} PTS
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-emerald-950/40 p-3 rounded-lg border border-emerald-800/60 font-mono">
                  {landerState.landingMessage}
                </p>

                {/* Score breakdown metrics */}
                {landingScore && (
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span>Fuel Remaining ({landerState.fuel.toFixed(1)}%):</span>
                      <span className="text-emerald-400">+{landingScore.fuelScore} pts</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Soft Descent ({vyMs.toFixed(2)} m/s):</span>
                      <span className="text-emerald-400">+{landingScore.descentRateScore} pts</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Lateral Stability ({Math.abs(vxMs).toFixed(2)} m/s):</span>
                      <span className="text-emerald-400">+{landingScore.lateralDriftScore} pts</span>
                    </div>
                    <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1 text-[10px]">
                      <span>Difficulty Multiplier ({currentLevel.difficulty}):</span>
                      <span className="text-amber-400 font-bold">×{landingScore.difficultyMultiplier.toFixed(1)}</span>
                    </div>
                  </div>
                )}

                {/* Navigation Actions */}
                <div className="space-y-2 pt-1">
                  {nextLevel ? (
                    <button
                      onClick={() => onSelectLevel(nextLevel)}
                      className="w-full py-3 px-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <span>Proceed to Level 0{nextLevel.id}: {nextLevel.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-amber-300">
                        <Sparkles className="w-4 h-4" />
                        <span>ALL 3 SECTORS CONQUERED!</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Master Lunar Pilot Certification Achieved.
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={restartSimulation}
                      className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Replay Level</span>
                    </button>

                    <button
                      onClick={onOpenLevelSelect}
                      className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Level Select</span>
                    </button>

                    <button
                      onClick={onReturnToMenu}
                      className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider rounded-xl border border-slate-800 transition-colors cursor-pointer"
                    >
                      Menu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CRASH FAILURE MODAL OVERLAY */}
          {landerState.status === 'CRASHED' && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
              <div className="bg-[#180a0c] border border-rose-500/50 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-rose-400 font-bold tracking-wider block">
                      LEVEL 0{currentLevel.id} FAILURE · IMPACT RECORDED
                    </span>
                    <h3 className="text-xl font-extrabold text-white uppercase tracking-tight">
                      Lander Destroyed
                    </h3>
                  </div>
                </div>

                <div className="p-3 bg-rose-950/40 rounded-lg border border-rose-900/60 font-mono text-xs text-rose-200 leading-relaxed">
                  {landerState.landingMessage}
                </div>

                {/* Impact Envelope Metrics */}
                <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">DESCENT RATE</span>
                    <span className={`font-bold text-sm ${isVySafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {vyMs.toFixed(2)} m/s
                    </span>
                    <span className="text-[9px] text-slate-500 block">Max 3.2 m/s</span>
                  </div>

                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">LATERAL DRIFT</span>
                    <span className={`font-bold text-sm ${isVxSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {Math.abs(vxMs).toFixed(2)} m/s
                    </span>
                    <span className="text-[9px] text-slate-500 block">Max 1.8 m/s</span>
                  </div>

                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">ATTITUDE TILT</span>
                    <span className={`font-bold text-sm ${isPitchSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {Math.abs(pitchDeg).toFixed(1)}°
                    </span>
                    <span className="text-[9px] text-slate-500 block">Max 10.0°</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={restartSimulation}
                    className="flex-1 py-3 px-4 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Try Again (R)</span>
                  </button>

                  <button
                    onClick={onOpenLevelSelect}
                    className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    Sectors
                  </button>

                  <button
                    onClick={onReturnToMenu}
                    className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    Menu
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Telemetry & Avionics HUD Sidebar */}
        <aside className="w-full lg:w-80 bg-[#070b16] border-t lg:border-t-0 lg:border-l border-slate-800 p-4 space-y-4 flex flex-col justify-between overflow-y-auto max-h-[42vh] lg:max-h-full shrink-0">
          <div className="space-y-4">
            {/* Header with Level Accent */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className={`text-xs font-mono font-bold uppercase flex items-center gap-1.5 ${currentLevel.theme.hudAccentColor}`}>
                <Gauge className="w-3.5 h-3.5" />
                Descent Avionics HUD
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                  landerState.status === 'FLYING'
                    ? `${currentLevel.theme.hudAccentColor} ${currentLevel.theme.hudBadgeBg} ${currentLevel.theme.hudBorderColor}`
                    : landerState.status === 'LANDED'
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                    : landerState.status === 'CRASHED'
                    ? 'text-rose-400 bg-rose-950/60 border-rose-800'
                    : 'text-amber-400 bg-amber-950/60 border-amber-800'
                }`}
              >
                ● {landerState.status}
              </span>
            </div>

            {/* Avionics Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {/* Radar Altitude */}
              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">RADAR ALTITUDE</span>
                <span className="text-base font-bold text-white tabular-nums">
                  {radarAltitude} <span className="text-[10px] text-slate-400">m</span>
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Surface clearance</span>
              </div>

              {/* Vertical Descent Speed */}
              <div className={`p-2.5 rounded-lg border transition-colors ${
                isVySafe ? 'bg-slate-900/80 border-slate-800' : 'bg-rose-950/30 border-rose-800/80'
              }`}>
                <span className="text-[10px] text-slate-400 block">DESCENT RATE (Vy)</span>
                <span className={`text-base font-bold tabular-nums ${isVySafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {vyMs >= 0 ? `+${vyMs.toFixed(2)}` : vyMs.toFixed(2)}{' '}
                  <span className="text-[10px] text-slate-400">m/s</span>
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Safe limit ≤ 3.2</span>
              </div>

              {/* Lateral Drift Speed */}
              <div className={`p-2.5 rounded-lg border transition-colors ${
                isVxSafe ? 'bg-slate-900/80 border-slate-800' : 'bg-rose-950/30 border-rose-800/80'
              }`}>
                <span className="text-[10px] text-slate-400 block">LATERAL DRIFT (Vx)</span>
                <span className={`text-base font-bold tabular-nums ${isVxSafe ? 'text-cyan-400' : 'text-rose-400'}`}>
                  {vxMs >= 0 ? `+${vxMs.toFixed(2)}` : vxMs.toFixed(2)}{' '}
                  <span className="text-[10px] text-slate-400">m/s</span>
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Safe limit ≤ 1.8</span>
              </div>

              {/* Pitch Angle */}
              <div className={`p-2.5 rounded-lg border transition-colors ${
                isPitchSafe ? 'bg-slate-900/80 border-slate-800' : 'bg-rose-950/30 border-rose-800/80'
              }`}>
                <span className="text-[10px] text-slate-400 block">PITCH ATTITUDE</span>
                <span className={`text-base font-bold tabular-nums ${isPitchSafe ? 'text-white' : 'text-rose-400'}`}>
                  {pitchDeg.toFixed(1)}°
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Safe limit ≤ 10.0°</span>
              </div>
            </div>

            {/* Fuel Propellant Tank Gauge */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Fuel className="w-3.5 h-3.5 text-amber-400" />
                  DPS PROPELLANT
                </span>
                <span className={`font-bold tabular-nums ${
                  landerState.fuel > 25 ? 'text-emerald-400' : landerState.fuel > 10 ? 'text-amber-400' : 'text-rose-400 animate-pulse'
                }`}>
                  {landerState.fuel.toFixed(1)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-75 ${
                    landerState.fuel > 25
                      ? 'bg-cyan-400'
                      : landerState.fuel > 10
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.max(0, landerState.fuel)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                <span>Burn Rate: 2.8%/s</span>
                <span>{landerState.fuel <= 0 ? 'EMPTY - GLIDE ONLY' : 'PROP PRESS: NOMINAL'}</span>
              </div>
            </div>

            {/* Active Flight Envelope Guidance with Real-Time Validation */}
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs font-mono space-y-2">
              <span className="text-slate-400 flex items-center gap-1 text-[11px] font-semibold">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                TOUCHDOWN ENVELOPE (LIVE)
              </span>
              <div className="space-y-1.5 text-[10px]">
                {/* Pad status */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Pad Alignment:</span>
                  {terrainRef.current && (
                    <span className={
                      landerState.position.x >= terrainRef.current.landingPad.startX - 14 &&
                      landerState.position.x <= terrainRef.current.landingPad.endX + 14
                        ? 'text-emerald-400 font-semibold'
                        : 'text-amber-400 font-semibold'
                    }>
                      {landerState.position.x >= terrainRef.current.landingPad.startX - 14 &&
                      landerState.position.x <= terrainRef.current.landingPad.endX + 14
                        ? 'CENTERED [✓]'
                        : 'OFF-PAD [!]'}
                    </span>
                  )}
                </div>

                {/* Vertical descent limit */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Max Vertical Speed:</span>
                  <span className={isVySafe ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    ≤ 3.2 m/s {isVySafe ? '[✓]' : '[!]'}
                  </span>
                </div>

                {/* Lateral drift limit */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Max Lateral Speed:</span>
                  <span className={isVxSafe ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    ≤ 1.8 m/s {isVxSafe ? '[✓]' : '[!]'}
                  </span>
                </div>

                {/* Tilt limit */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Max Tilt Angle:</span>
                  <span className={isPitchSafe ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    ≤ ±10.0° {isPitchSafe ? '[✓]' : '[!]'}
                  </span>
                </div>
              </div>
            </div>

            {/* Keybindings Reference */}
            <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80 text-[10px] font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Thrust Engine:</span>
                <span className="text-cyan-300 font-semibold">W / Up / Space</span>
              </div>
              <div className="flex justify-between">
                <span>Attitude Roll:</span>
                <span className="text-cyan-300 font-semibold">A / D / Left / Right</span>
              </div>
              <div className="flex justify-between">
                <span>Pause / Resume:</span>
                <span className="text-amber-300 font-semibold">P</span>
              </div>
              <div className="flex justify-between">
                <span>Restart Descent:</span>
                <span className="text-slate-200 font-semibold">R</span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              onClick={restartSimulation}
              className="w-full py-2 px-3 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/60 text-xs font-mono font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Descent (R)</span>
            </button>

            <button
              onClick={onReturnToMenu}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
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

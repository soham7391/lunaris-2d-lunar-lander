/**
 * @file MissionBriefing.tsx
 * Mission Briefing view for LUNARIS 2D Lunar Landing Simulation.
 * Outlines flight objectives, touchdown parameters, control scheme, and interactive LEM preview.
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowLeft, 
  Rocket, 
  Target, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Flame, 
  RotateCw 
} from 'lucide-react';
import { drawLander } from '../graphics/drawLander';

interface MissionBriefingProps {
  onStartMission: () => void;
  onBackToMenu: () => void;
}

export const MissionBriefing: React.FC<MissionBriefingProps> = ({
  onStartMission,
  onBackToMenu,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewThrust, setPreviewThrust] = useState(0.3);
  const [previewPitch, setPreviewPitch] = useState(0);
  const [rcsFired, setRcsFired] = useState<'left' | 'right' | null>(null);

  // Render interactive lander preview
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle star specks inside preview box
      ctx.fillStyle = '#060a17';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Lander in center
      drawLander(
        ctx,
        {
          position: { x: canvas.width * 0.5, y: canvas.height * 0.52 },
          rotation: (previewPitch * Math.PI) / 180,
          scale: 1.85,
        },
        {
          thrust: previewThrust,
          rcsLeft: rcsFired === 'left',
          rcsRight: rcsFired === 'right',
          debug: { showLocalAxes: true, showCenterOfMass: true },
        }
      );

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [previewThrust, previewPitch, rcsFired]);

  return (
    <div className="min-h-screen bg-[#05070e] text-slate-100 flex flex-col justify-between p-4 sm:p-8 lg:p-12 select-none">
      {/* Top Bar Navigation */}
      <header className="flex items-center justify-between pb-6 border-b border-slate-800">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-semibold uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Menu</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Rocket className="w-4 h-4" />
          <span>MISSION DIRECTIVE · LEM DESCENT</span>
        </div>

        <button
          onClick={onStartMission}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
        >
          <span>Start Mission</span>
          <Play className="w-3.5 h-3.5 fill-slate-950" />
        </button>
      </header>

      {/* Main Briefing Grid */}
      <main className="max-w-6xl mx-auto w-full py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Mission Profile & Flight Envelope (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="text-xs font-mono text-amber-400 font-semibold mb-1">
              OPERATION TRANQUILLITY TARGET · STAGE 01
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase">
              Mission Flight Briefing
            </h1>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              You are assigned to command the Lunar Module descent from lunar orbit (PDI - Powered Descent Initiation).
              Navigate the descent trajectory, regulate terminal velocity, and achieve touchdown inside the designated target quadrant.
            </p>
          </div>

          {/* Touchdown Tolerances Matrix */}
          <div className="p-5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-2 font-bold">
              <Target className="w-4 h-4" />
              Touchdown Tolerance Limits
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-xs block mb-1">Vertical Descent (Vy)</span>
                <span className="text-lg font-bold font-mono text-emerald-400">≤ 2.0 m/s</span>
                <span className="text-[10px] text-slate-500 block mt-1">Nominal gear tolerance</span>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-xs block mb-1">Lateral Drift (Vx)</span>
                <span className="text-lg font-bold font-mono text-emerald-400">≤ 1.0 m/s</span>
                <span className="text-[10px] text-slate-500 block mt-1">Prevents tipping shear</span>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-xs block mb-1">Attitude Pitch (θ)</span>
                <span className="text-lg font-bold font-mono text-emerald-400">≤ 5.0°</span>
                <span className="text-[10px] text-slate-500 block mt-1">Perpendicular to horizon</span>
              </div>
            </div>
          </div>

          {/* Flight Controls Scheme */}
          <div className="p-5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-2 font-bold">
              <Sliders className="w-4 h-4" />
              Pilot Flight Controls & Avionics
            </h2>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-300 font-medium">Main Engine Throttle (Thrust)</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <kbd className="px-2 py-1 bg-slate-800 text-cyan-300 rounded border border-slate-700">W</kbd>
                  <span className="text-slate-500">/</span>
                  <kbd className="px-2 py-1 bg-slate-800 text-cyan-300 rounded border border-slate-700">↑</kbd>
                  <span className="text-slate-500">/</span>
                  <kbd className="px-2.5 py-1 bg-slate-800 text-cyan-300 rounded border border-slate-700">SPACE</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-300 font-medium">Attitude Pitch (Port / Starboard)</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <kbd className="px-2 py-1 bg-slate-800 text-cyan-300 rounded border border-slate-700">A</kbd>
                  <kbd className="px-2 py-1 bg-slate-800 text-cyan-300 rounded border border-slate-700">D</kbd>
                  <span className="text-slate-500">/</span>
                  <kbd className="px-2 py-1 bg-slate-800 text-cyan-300 rounded border border-slate-700">←</kbd>
                  <kbd className="px-2 py-1 bg-slate-800 text-cyan-300 rounded border border-slate-700">→</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-300 font-medium">Engine Cutoff / Kill Throttle</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <kbd className="px-2 py-1 bg-slate-800 text-amber-300 rounded border border-slate-700">X</kbd>
                  <span className="text-slate-500">/</span>
                  <kbd className="px-2 py-1 bg-slate-800 text-amber-300 rounded border border-slate-700">S</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-300 font-medium">Toggle CG Coordinate Axes & Grid</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <kbd className="px-2 py-1 bg-slate-800 text-slate-300 rounded border border-slate-700">G</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive LEM Vector Model Inspector (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase">
                Vector Model Inspector
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                CANVAS 2D HIERARCHICAL RENDER
              </span>
            </div>

            {/* Canvas Preview Container */}
            <div className="relative w-full aspect-square bg-[#030611] rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
              <canvas
                ref={previewCanvasRef}
                width={360}
                height={360}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                LOCAL FRAME: U (FWD) · V (LAT)
              </div>
            </div>

            {/* Test Interactive Inspector Controls */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Thrust Plume:
                  </span>
                  <span>{Math.round(previewThrust * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={previewThrust}
                  onChange={(e) => setPreviewThrust(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                    Attitude Rotation:
                  </span>
                  <span>{previewPitch}°</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={previewPitch}
                  onChange={(e) => setPreviewPitch(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onMouseDown={() => setRcsFired('left')}
                  onMouseUp={() => setRcsFired(null)}
                  onTouchStart={() => setRcsFired('left')}
                  onTouchEnd={() => setRcsFired(null)}
                  className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono rounded text-slate-300 transition-colors border border-slate-700 text-center cursor-pointer"
                >
                  Test Port RCS
                </button>
                <button
                  onMouseDown={() => setRcsFired('right')}
                  onMouseUp={() => setRcsFired(null)}
                  onTouchStart={() => setRcsFired('right')}
                  onTouchEnd={() => setRcsFired(null)}
                  className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono rounded text-slate-300 transition-colors border border-slate-700 text-center cursor-pointer"
                >
                  Test Stbd RCS
                </button>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <button
            onClick={onStartMission}
            className="w-full py-4 px-6 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Proceed to Simulation Screen</span>
            <Play className="w-4 h-4 fill-slate-950" />
          </button>
        </div>
      </main>

      {/* Footer Notes */}
      <footer className="text-center text-xs font-mono text-slate-500 pt-6 border-t border-slate-900">
        <span>LUNARIS · Computer Graphics Capstone · Tranquillity Base Sector 4</span>
      </footer>
    </div>
  );
};

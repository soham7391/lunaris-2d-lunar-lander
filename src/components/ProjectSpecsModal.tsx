/**
 * @file ProjectSpecsModal.tsx
 * Academic and technical documentation modal for the LUNARIS Computer Graphics project.
 */

import React from 'react';
import { X, Layers, Cpu, Compass, ShieldAlert } from 'lucide-react';

interface ProjectSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectSpecsModal: React.FC<ProjectSpecsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#0b1120] border border-slate-700/80 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="specs-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <h2 id="specs-title" className="text-xl font-bold tracking-tight text-white">
              LUNARIS · Computer Graphics Architecture
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Course Project: 2D Lunar Landing Simulation · System Specification v1.0
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-sm">
          {/* Section 1: Overview */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-cyan-400 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              01. Graphics Pipeline & 2D Vector Transformations
            </h3>
            <p className="text-slate-300 leading-relaxed">
              LUNARIS relies exclusively on standard <strong>HTML5 Canvas 2D primitives</strong> without external game engines or static raster textures. All celestial elements (Earth crescent, Moon sphere with impact maria and craters, jagged horizon ridges, and the Apollo Lunar Module) are procedurally drawn with vector paths, radial gradients, and linear transforms.
            </p>
            <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 font-mono text-xs text-slate-300">
              <code>
                Homogeneous Transformation Pipeline:<br />
                M = T(x, y) · R(θ) · S(scale)
              </code>
            </div>
          </div>

          {/* Section 2: Modular Decoupling */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-amber-400 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              02. Modular Architecture & Decoupled Subsystems
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                <span className="font-semibold text-slate-100 block mb-1">Renderer Subsystem</span>
                <span className="text-xs text-slate-400">
                  Pure Canvas 2D modules for Apollo LEM vector geometry, piecewise terrain profiles, world coordinate grids, and twinkling starfields.
                </span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                <span className="font-semibold text-slate-100 block mb-1">State Machine</span>
                <span className="text-xs text-slate-400">
                  Clean state management routing between Title Menu, Mission Briefing, and Simulation stages with full back-navigation support.
                </span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                <span className="font-semibold text-emerald-400 block mb-1">Physics Integrator (Active)</span>
                <span className="text-xs text-slate-400">
                  Semi-implicit Euler integration of lunar gravity (1.62 m/s²), vector main engine thrust, attitude roll torque, and fuel mass depletion.
                </span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                <span className="font-semibold text-emerald-400 block mb-1">Collision & Landing Solver (Active)</span>
                <span className="text-xs text-slate-400">
                  Multi-vertex model transformation testing footpads, nozzle, and cabin against piecewise terrain and landing pad envelope limits.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Telemetry & Flight Envelope */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-emerald-400 flex items-center gap-2">
              <Compass className="w-4 h-4" />
              03. Real-Time Telemetry & Calibrated Flight Envelope
            </h3>
            <p className="text-slate-300 leading-relaxed text-xs">
              World coordinate space maps origin <code className="text-cyan-300 font-mono">[0, 0]</code> to the top-left with lunar gravity acting along <code className="text-cyan-300 font-mono">+Y</code> (<code className="text-cyan-300 font-mono">18 px/s²</code>), while the local lander frame anchors at the center of mass with main engine thrust pointing along <code className="text-cyan-300 font-mono">-Y</code>.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs">
              <div className="p-2.5 bg-slate-900/90 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block">DESCENT LIMIT</span>
                <span className="text-emerald-400 font-bold">Vy ≤ 3.2 m/s</span>
              </div>
              <div className="p-2.5 bg-slate-900/90 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block">DRIFT LIMIT</span>
                <span className="text-emerald-400 font-bold">Vx ≤ 1.8 m/s</span>
              </div>
              <div className="p-2.5 bg-slate-900/90 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block">TILT LIMIT</span>
                <span className="text-emerald-400 font-bold">|θ| ≤ 10.0°</span>
              </div>
            </div>
          </div>

          {/* Section 4: Multi-Level Architecture & Procedural Topography */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-cyan-400 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              04. Multi-Sector Campaign Architecture & Procedural Topography
            </h3>
            <p className="text-slate-300 leading-relaxed text-xs">
              LUNARIS includes three distinct progressive sectors, each parameterized with custom terrain roughness, crater depth, landing pad span, background star/nebula gradients, and celestial backdrops:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
              <div className="p-3 bg-slate-900/80 rounded-lg border border-cyan-900/60">
                <span className="text-cyan-400 font-bold block">LEVEL 1 · EASY</span>
                <span className="text-[11px] text-slate-300 block font-sans">Mare Tranquillitatis</span>
                <span className="text-[10px] text-slate-500 block mt-1">Wide central pad (28%), smooth basalt profile, Earthrise backdrop.</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-amber-900/60">
                <span className="text-amber-400 font-bold block">LEVEL 2 · MEDIUM</span>
                <span className="text-[11px] text-slate-300 block font-sans">Oceanus Procellarum</span>
                <span className="text-[10px] text-slate-500 block mt-1">Offset starboard pad (20%), rolling terrain, Jupiter celestial theme.</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-rose-900/60">
                <span className="text-rose-400 font-bold block">LEVEL 3 · HARD</span>
                <span className="text-[11px] text-slate-300 block font-sans">Tycho Crater Basin</span>
                <span className="text-[10px] text-slate-500 block mt-1">Narrow pad (12%), hazardous crag walls, Mars orbital theme.</span>
              </div>
            </div>
          </div>

          {/* Section 5: CG 2D Transformation Laboratory */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-amber-400 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              05. Computer Graphics 2D Transformation Laboratory
            </h3>
            <p className="text-slate-300 leading-relaxed text-xs">
              The embedded <strong>CG Transform Lab</strong> provides an interactive experimental sandbox to inspect and manipulate 2D affine transformations using homogeneous coordinates:
            </p>
            <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2">
              <div>
                <span className="text-cyan-400 font-bold">2D Homogeneous Matrix:</span>
                <pre className="text-slate-400 text-[10px] mt-0.5">
                  [ x' ]   [ a  c  tx ] [ x ]
                  [ y' ] = [ b  d  ty ] [ y ]
                  [ 1  ]   [ 0  0  1  ] [ 1 ]
                </pre>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px]">
                <div><span className="text-white">Translation:</span> [1 0 tx; 0 1 ty; 0 0 1]</div>
                <div><span className="text-white">Rotation:</span> [cos -sin 0; sin cos 0; 0 0 1]</div>
                <div><span className="text-white">Shear:</span> [1 shx 0; shy 1 0; 0 0 1]</div>
                <div><span className="text-white">Reflection:</span> Axis flips (-1 scale factor)</div>
              </div>
              <div className="pt-1 text-[10px] text-amber-300/90 border-t border-slate-800">
                Non-Commutativity Demonstration: Composing T · R · S produces a different world-space configuration than R · T · S due to non-commutative matrix multiplication.
              </div>
            </div>
          </div>

          {/* Section 6: Verification & Test Plan */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-emerald-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              06. Academic Verification & Test Plan
            </h3>
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span><strong>Kinematics & Euler Integration:</strong> Validated time-delta updates with $\Delta t$ clamping to avoid tunnel artifacts.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span><strong>Collision Bounds:</strong> Footpads, cabin hull, and engine nozzle tested against interpolated piecewise segments.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span><strong>Progressive Unlock Persistence:</strong> Unlocked levels stored in client localStorage across reloads.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span><strong>Canvas Matrix Correctness:</strong> Native Canvas <code>ctx.setTransform(a,b,c,d,e,f)</code> verified against calculated algebraic matrices.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors whitespace-nowrap"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

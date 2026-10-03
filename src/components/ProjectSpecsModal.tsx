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

          {/* Calibrated Flight Status Notice */}
          <div className="flex items-start gap-3 p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-200 text-xs">
            <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Beginner-Tuned Flight Mechanics:</span>
              Descent gravity, engine thrust-to-weight ratio (2.67:1), attitude rotation damping, and landing pad width (28% viewport) are calibrated to ensure a rewarding, controllable lunar descent while preserving strict Newtonian equations.
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

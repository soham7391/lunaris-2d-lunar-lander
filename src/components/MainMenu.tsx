/**
 * @file MainMenu.tsx
 * Space-themed Main Menu for LUNARIS 2D Lunar Landing Simulation.
 * Renders an animated Canvas 2D scene with starfield, hand-drawn Moon, lunar horizon,
 * and vector Apollo-style lunar module.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Play, BookOpen, Compass, Award, Rocket, ArrowRight } from 'lucide-react';
import { generateStarfield, drawStarfield, Star } from '../graphics/drawStarfield';
import { drawMoon, drawLunarHorizon } from '../graphics/drawMoonAndHorizon';
import { drawLander } from '../graphics/drawLander';
import { ProjectSpecsModal } from './ProjectSpecsModal';

interface MainMenuProps {
  onPlayClick: () => void;
  onOpenBriefing: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onPlayClick, onOpenBriefing }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const [specsOpen, setSpecsOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    starsRef.current = generateStarfield(width, height, 220);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      starsRef.current = generateStarfield(width, height, 220);
    };

    window.addEventListener('resize', handleResize);

    const startTime = performance.now();

    const render = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      ctx.clearRect(0, 0, width, height);

      // 1. Procedural Starfield & Celestial Backdrop with Earthrise crescent
      drawStarfield(ctx, starsRef.current, elapsed, {
        showEarthCrescent: true,
        earthX: width * 0.16,
        earthY: Math.max(90, height * 0.16),
      });

      // 2. Hand-drawn Moon Sphere with Maria, Craters, and Terminator Shadow
      const moonRadius = Math.min(width * 0.22, height * 0.3, 160);
      const moonX = width * 0.8;
      const moonY = Math.max(moonRadius + 40, height * 0.28);
      drawMoon(ctx, moonX, moonY, moonRadius);

      // 3. Hand-drawn Jagged Lunar Horizon Ridge
      drawLunarHorizon(ctx, width, height);

      // 4. Vector Apollo-Style Lunar Module Hovering in Orbit
      // Gentle orbital bobbing and attitude oscillation
      const landerBobY = Math.sin(elapsed * 0.0012) * 14;
      const landerPitch = Math.sin(elapsed * 0.0008) * 0.08 - 0.05; // ~3 degrees pitch
      const landerX = width * 0.52;
      const landerY = height * 0.44 + landerBobY;

      drawLander(
        ctx,
        {
          position: { x: landerX, y: landerY },
          rotation: landerPitch,
          scale: 1.35,
        },
        {
          thrust: 0.15 + Math.sin(elapsed * 0.004) * 0.08, // Gentle idle reaction flare
        }
      );

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#04060d] text-slate-100 select-none">
      {/* Background Interactive Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Top Bar (Strict 3-Zone Contract) */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5 border-b border-slate-800/60 bg-[#04060d]/60 backdrop-blur-md">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-cyan-400" />
          <span className="text-xl font-extrabold tracking-widest text-white uppercase">
            LUNARIS
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-wider font-semibold text-slate-400">
          <button
            onClick={onOpenBriefing}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Mission Briefing
          </button>
          <button
            onClick={() => setSpecsOpen(true)}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          >
            CG Architecture
          </button>
          <button
            onClick={onOpenBriefing}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Flight Mechanics
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPlayClick}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-slate-900" />
            <span>Launch Mission</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 lg:px-16 max-w-5xl mx-auto w-full py-12">
        <div className="space-y-6 max-w-2xl bg-[#04060d]/70 p-6 md:p-8 rounded-2xl border border-slate-800/80 backdrop-blur-md shadow-2xl">
          {/* Metadata kicker */}
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-wider">
            <span>COMPUTER GRAPHICS CAPSTONE</span>
            <span aria-hidden="true">·</span>
            <span>APOLLO GUIDANCE PROJECT</span>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white uppercase">
              LUNARIS
            </h1>
            <p className="text-sm sm:text-base font-bold tracking-widest text-amber-400 font-mono uppercase">
              2D LUNAR LANDING SIMULATION
            </p>
          </div>

          {/* Tagline */}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
            Precision descent trajectory and attitude control simulation on the lunar regolith.
            Experience vector-rendered Newtonian kinematics, piecewise terrain collision envelopes, and Apollo-spec descent telemetry.
          </p>

          {/* Primary Action Button (Prominent Play Button) */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={onPlayClick}
              className="px-6 py-3.5 text-sm font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all duration-150 flex items-center gap-2.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>ENTER MISSION BRIEFING</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => setSpecsOpen(true)}
              className="px-5 py-3.5 text-sm font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Project Specs</span>
            </button>
          </div>

          {/* Technical Specs Summary Bar */}
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">RENDER ENGINE</span>
              <span className="text-slate-200 font-semibold">HTML5 Canvas 2D</span>
            </div>
            <div>
              <span className="text-slate-500 block">KINEMATICS</span>
              <span className="text-slate-200 font-semibold">Hierarchical 2D</span>
            </div>
            <div>
              <span className="text-slate-500 block">DESCENT ZONE</span>
              <span className="text-slate-200 font-semibold">Tranquillity Base</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Info Strip */}
      <footer className="relative z-10 px-6 lg:px-12 py-4 border-t border-slate-900 bg-[#04060d]/80 backdrop-blur-sm text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span>LUNARIS · Computer Graphics Capstone</span>
          <span aria-hidden="true">·</span>
          <span>Stage 01 Scaffold</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <button
            onClick={() => setSpecsOpen(true)}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          >
            System Specs
          </button>
          <span aria-hidden="true">·</span>
          <span>Zero External Asset Dependencies</span>
        </div>
      </footer>

      {/* Project Specifications Dialog */}
      <ProjectSpecsModal isOpen={specsOpen} onClose={() => setSpecsOpen(false)} />
    </div>
  );
};

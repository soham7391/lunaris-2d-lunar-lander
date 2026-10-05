/**
 * @file MainMenu.tsx
 * Cinematic Main Menu for LUNARIS 2D Lunar Landing Simulation.
 * 
 * Features:
 * - Full-screen deep navy/black space environment
 * - Giant, detailed Canvas 2D Moon as the centerpiece with rotating 3D crater topology
 * - Grazing Lambertian terminator falloff and thin exospheric scattering rim
 * - Orbiting satellite following Keplerian elliptical trajectory with line-of-sight occlusion
 * - Subtle star twinkling and damped mouse-driven spatial parallax
 * - Clean, balanced composition with elegant typography and restrained cyan accents
 * - Respects prefers-reduced-motion with instant cleanup on unmount
 */

import React, { useEffect, useRef, useState } from 'react';
import { Play, ArrowRight, Layers, Cpu, BookOpen, Compass, Sparkles, Orbit } from 'lucide-react';
import { generateStarfield, drawStarfield, Star } from '../graphics/drawStarfield';
import { drawCinematicMoon, SatelliteState } from '../graphics/drawCinematicMoon';
import { ProjectSpecsModal } from './ProjectSpecsModal';
import { getUnlockedLevels } from '../physics/levels';

interface MainMenuProps {
  onPlayClick: () => void;
  onOpenBriefing: () => void;
  onOpenLevelSelect?: () => void;
  onOpenTransformLab?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlayClick,
  onOpenBriefing,
  onOpenLevelSelect,
  onOpenTransformLab,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const [specsOpen, setSpecsOpen] = useState(false);
  const [unlockedCount, setUnlockedCount] = useState<number>(1);

  // Parallax tracking
  const targetParallaxRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentParallaxRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    setUnlockedCount(getUnlockedLevels().length);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Detect user accessibility preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    starsRef.current = generateStarfield(width, height, 260);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      starsRef.current = generateStarfield(width, height, 260);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      // Normalized from -1 to 1 relative to viewport center
      targetParallaxRef.current = {
        x: (e.clientX / width - 0.5) * 2,
        y: (e.clientY / height - 0.5) * 2,
      };
    };

    const handleMouseLeave = () => {
      targetParallaxRef.current = { x: 0, y: 0 };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const startTime = performance.now();

    const render = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      // Damped smooth parallax interpolation (lerp)
      if (!prefersReducedMotion) {
        currentParallaxRef.current.x +=
          (targetParallaxRef.current.x - currentParallaxRef.current.x) * 0.04;
        currentParallaxRef.current.y +=
          (targetParallaxRef.current.y - currentParallaxRef.current.y) * 0.04;
      }

      const pX = currentParallaxRef.current.x;
      const pY = currentParallaxRef.current.y;

      ctx.clearRect(0, 0, width, height);

      // 1. Full-screen Deep Navy/Black Space Backdrop
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        Math.min(width, height) * 0.2,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0.0, '#060a17'); // Soft deep navy core
      bgGrad.addColorStop(0.55, '#03050c'); // Deep velvety space
      bgGrad.addColorStop(1.0, '#010206'); // Pure obsidian space corners
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Starfield with Twinkle and Subtle Parallax Shift
      ctx.save();
      ctx.translate(pX * 12, pY * 8);
      drawStarfield(ctx, starsRef.current, elapsed, {
        showEarthCrescent: false,
        spaceGradient: ['transparent', 'transparent', 'transparent'],
        nebulaColor: 'rgba(148, 163, 184, 0.015)',
        nebulaCenter: [0.65, 0.45],
      });
      ctx.restore();

      // 3. Clean, Realistic Centerpiece Moon Geometry
      // Positioned on the right half with refined scale to guarantee zero overlap with title/copy
      const isDesktop = width >= 1024;
      const isTablet = width >= 640 && width < 1024;

      let moonRadius: number;
      let moonCenterX: number;
      let moonCenterY: number;

      if (isDesktop) {
        moonRadius = Math.min(width * 0.18, height * 0.34, 235);
        moonCenterX = width * 0.76 + pX * 2.5;
        moonCenterY = height * 0.48 + pY * 2;
      } else if (isTablet) {
        moonRadius = Math.min(width * 0.20, height * 0.28, 175);
        moonCenterX = width * 0.72 + pX * 2;
        moonCenterY = height * 0.38 + pY * 1.5;
      } else {
        moonRadius = Math.min(width * 0.28, height * 0.20, 125);
        moonCenterX = width * 0.50 + pX * 1.5;
        moonCenterY = height * 0.22 + pY * 1.5;
      }

      // Moon rotation rate: very slow, gentle, realistic 0.00010 rad/ms
      const moonRotation = prefersReducedMotion ? 0.38 : elapsed * 0.00010;

      // Keplerian Satellite Orbit parameters: slow, smooth orbit
      const satOrbitAngle = prefersReducedMotion ? 1.45 : elapsed * 0.00048;
      const satelliteState: SatelliteState = {
        orbitAngle: satOrbitAngle,
        orbitSemiMajorRatio: 1.46,
        orbitSemiMinorRatio: 0.56,
        orbitTiltDeg: -22,
        orbitViewTiltDeg: 32,
      };

      // 4. Render Realistic Grey Moon & Orbiting Survey Probe
      drawCinematicMoon(ctx, moonCenterX, moonCenterY, moonRadius, {
        rotationAngle: moonRotation,
        lightAngleDeg: -42, // Grazing sunlight from upper left
        satelliteState,
        showSatellite: true,
        showExosphereRim: true,
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#010206] text-slate-100 select-none">
      {/* Interactive Canvas 2D Space & Moon Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Subtle Cinematic Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-radial from-transparent via-transparent to-black/60" />

      {/* Top Header: Restrained, Architectural, Responsive */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-16 py-6">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-400 backdrop-blur-md">
            <Orbit className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <span className="text-sm font-black tracking-[0.25em] text-white uppercase block leading-none">
              LUNARIS
            </span>
            <span className="text-[10px] font-mono tracking-widest text-cyan-400/80 block mt-0.5">
              APOLLO LEM GUIDANCE
            </span>
          </div>
        </div>

        {/* Minimalist Top Nav Actions */}
        <nav className="flex items-center gap-4 sm:gap-6 text-xs uppercase tracking-wider font-mono text-slate-400">
          <button
            onClick={onOpenBriefing}
            className="hover:text-cyan-300 transition-colors cursor-pointer hidden md:inline-block"
          >
            Mission Briefing
          </button>

          {onOpenLevelSelect && (
            <button
              onClick={onOpenLevelSelect}
              className="hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5 text-slate-300 hover:text-white"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sectors <span className="text-cyan-400 font-bold">({unlockedCount}/3)</span></span>
            </button>
          )}

          {onOpenTransformLab && (
            <button
              onClick={onOpenTransformLab}
              className="hover:text-amber-300 transition-colors cursor-pointer hidden sm:flex items-center gap-1.5 text-slate-300 hover:text-white"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Transform Lab</span>
            </button>
          )}

          <button
            onClick={() => setSpecsOpen(true)}
            className="hover:text-cyan-300 transition-colors cursor-pointer hidden sm:inline-block"
          >
            Specs
          </button>
        </nav>
      </header>

      {/* Main Hero View: Clean, Balanced, Uncluttered Left Alignment */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto w-full py-12 pointer-events-none">
        <div className="max-w-xl lg:max-w-2xl space-y-6 pointer-events-auto">
          {/* Cinematic Title & Subtitle */}
          <div className="space-y-2">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-[0.2em] sm:tracking-[0.24em] text-white uppercase drop-shadow-2xl leading-none">
              LUNARIS
            </h1>
            <p className="text-xs sm:text-sm lg:text-base font-mono font-bold tracking-[0.28em] text-cyan-400 uppercase">
              2D LUNAR LANDING SIMULATION
            </p>
          </div>

          {/* Refined Descriptive Copy */}
          <p className="text-slate-300/90 text-sm sm:text-base leading-relaxed font-normal max-w-lg">
            Experience authentic Apollo-spec descent kinematics, vector RCS attitude control, and hazardous piecewise terrain collision across three progressive lunar landing sectors.
          </p>

          {/* Prominent Play Action & Secondary Navigation */}
          <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Primary Action Button (Prominent, High-Contrast Play Button) */}
            <button
              onClick={onPlayClick}
              className="px-8 py-4 text-sm sm:text-base font-extrabold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-xl shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-3 cursor-pointer group"
            >
              <Play className="w-4 h-4 fill-slate-950 group-hover:scale-110 transition-transform" />
              <span className="tracking-wider uppercase">START MISSION</span>
              <ArrowRight className="w-4 h-4 text-slate-950 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Direct Level Select Action */}
            {onOpenLevelSelect && (
              <button
                onClick={onOpenLevelSelect}
                className="px-5 py-4 text-sm font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 hover:text-white rounded-xl border border-slate-700/80 backdrop-blur-md transition-all duration-150 flex items-center gap-2 cursor-pointer hover:border-cyan-500/50"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Sector Campaign</span>
              </button>
            )}

            {/* CG Transform Lab Action */}
            {onOpenTransformLab && (
              <button
                onClick={onOpenTransformLab}
                className="px-5 py-4 text-sm font-semibold text-amber-300/90 bg-amber-950/30 hover:bg-amber-900/50 hover:text-amber-200 rounded-xl border border-amber-700/50 backdrop-blur-md transition-all duration-150 flex items-center gap-2 cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>Transform Lab</span>
              </button>
            )}

            {/* Specifications Dialog Trigger */}
            <button
              onClick={() => setSpecsOpen(true)}
              className="px-4 py-4 text-sm font-medium text-slate-400 hover:text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="View Computer Graphics Specifications"
            >
              <BookOpen className="w-4 h-4" />
              <span>Specs</span>
            </button>
          </div>

          {/* Minimalist Telemetry Indicators */}
          <div className="pt-4 flex flex-wrap items-center gap-6 text-[11px] font-mono text-slate-400 border-t border-slate-800/60 max-w-lg">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>DESCENT ENVELOPE: <strong className="text-slate-200 font-semibold">CALIBRATED</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>PHYSICS: <strong className="text-slate-200 font-semibold">SEMI-IMPLICIT EULER</strong></span>
            </div>
          </div>
        </div>
      </main>

      {/* Cinematic Telemetry Footer */}
      <footer className="relative z-10 px-6 sm:px-12 lg:px-16 py-4 border-t border-slate-900/80 bg-[#010206]/80 backdrop-blur-sm text-xs font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">LUNARIS · 2D LUNAR LANDING SIMULATION</span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>ORBIT: 110 KM × 15 KM</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span className="text-cyan-400/80">3 PLAYABLE SECTORS READY</span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <button
            onClick={() => setSpecsOpen(true)}
            className="hover:text-cyan-300 transition-colors cursor-pointer"
          >
            Technical Documentation
          </button>
        </div>
      </footer>

      {/* Project Specifications Dialog */}
      <ProjectSpecsModal isOpen={specsOpen} onClose={() => setSpecsOpen(false)} />
    </div>
  );
};

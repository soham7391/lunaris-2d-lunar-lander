/**
 * @file LevelSelect.tsx
 * Level Selection view for LUNARIS.
 * Displays the 3 mission sectors with difficulty tiers, topography previews,
 * progressive unlock status, and level launch controls.
 */

import React from 'react';
import { ArrowLeft, Rocket, Lock, CheckCircle2, Play, Compass, ShieldAlert, Award } from 'lucide-react';
import { LEVELS, LevelConfig, getUnlockedLevels } from '../physics/levels';

interface LevelSelectProps {
  currentLevelId: number;
  onSelectLevel: (level: LevelConfig) => void;
  onReturnToMenu: () => void;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({
  currentLevelId,
  onSelectLevel,
  onReturnToMenu,
}) => {
  const unlocked = getUnlockedLevels();

  return (
    <div className="min-h-screen bg-[#04060d] text-slate-100 flex flex-col justify-between p-4 sm:p-8 lg:p-12 select-none">
      {/* Header */}
      <header className="flex items-center justify-between pb-6 border-b border-slate-800">
        <button
          onClick={onReturnToMenu}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-semibold uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Main Menu</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Rocket className="w-4 h-4" />
          <span>MISSION CAMPAIGN · SECTOR SELECT</span>
        </div>

        <div className="text-xs font-mono text-slate-500">
          UNLOCKED: {unlocked.length} / 3 SECTORS
        </div>
      </header>

      {/* Main Level Cards Grid */}
      <main className="max-w-5xl mx-auto w-full py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">
            Select Descent Sector
          </h1>
          <p className="text-sm text-slate-400 font-mono max-w-xl mx-auto">
            Progressively conquer lunar landing sectors from the serene plains of Tranquillity to the treacherous chasm walls of Tycho.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LEVELS.map((level) => {
            const isUnlocked = unlocked.includes(level.id);
            const isSelected = level.id === currentLevelId;

            return (
              <div
                key={level.id}
                className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-200 overflow-hidden ${
                  !isUnlocked
                    ? 'bg-slate-950/40 border-slate-900 opacity-60'
                    : isSelected
                    ? 'bg-slate-900/90 border-cyan-500/80 shadow-xl shadow-cyan-500/10'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                {/* Level Top Strip */}
                <div
                  className="h-28 w-full relative p-4 flex flex-col justify-between"
                  style={{
                    background: `linear-gradient(135deg, ${level.theme.spaceGradient[0]}, ${level.theme.spaceGradient[2]})`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                      LEVEL 0{level.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        level.difficulty === 'Easy'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          : level.difficulty === 'Medium'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                          : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {level.difficulty}
                    </span>
                  </div>

                  {/* Pad preview diagram */}
                  <div className="relative w-full h-8 flex items-end">
                    <div className="w-full h-1 bg-slate-700/60 rounded relative">
                      <div
                        className="absolute h-2.5 rounded top-[-3px] transition-all"
                        style={{
                          left: `${level.padStartXRatio * 100}%`,
                          width: `${(level.padEndXRatio - level.padStartXRatio) * 100}%`,
                          backgroundColor: level.theme.padBorderColor,
                        }}
                        title="Landing Pad Location"
                      />
                    </div>
                  </div>
                </div>

                {/* Level Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                      {level.name}
                    </h3>
                    <div className="text-[11px] font-mono text-cyan-400">
                      {level.sector}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {level.description}
                    </p>
                  </div>

                  {/* Level Specs Checklist */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Pad Width:</span>
                      <span className="text-slate-200">
                        {Math.round((level.padEndXRatio - level.padStartXRatio) * 100)}% Viewport
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pad Alignment:</span>
                      <span className="text-slate-200">
                        {level.padStartXRatio > 0.5 ? 'Starboard (East)' : level.padStartXRatio < 0.4 ? 'Central Basin' : 'Chasm Center'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Crag Roughness:</span>
                      <span className="text-slate-200">
                        {level.terrainRoughness < 1 ? 'Smooth' : level.terrainRoughness < 1.5 ? 'Moderate' : 'Extreme'}
                      </span>
                    </div>
                  </div>

                  {/* Play Action */}
                  <div className="pt-2">
                    {isUnlocked ? (
                      <button
                        onClick={() => onSelectLevel(level)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-500/25'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isSelected ? 'Launch Mission' : 'Select Sector'}</span>
                      </button>
                    ) : (
                      <div className="w-full py-2.5 px-4 bg-slate-950 text-slate-600 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-900 cursor-not-allowed">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Complete Level 0{level.id - 1} to Unlock</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs font-mono text-slate-500 pt-6 border-t border-slate-900">
        <span>LUNARIS · Computer Graphics Capstone · Progressive Multi-Level Campaign</span>
      </footer>
    </div>
  );
};

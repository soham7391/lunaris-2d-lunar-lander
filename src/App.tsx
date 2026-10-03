/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameView } from './types/game';
import { MainMenu } from './components/MainMenu';
import { MissionBriefing } from './components/MissionBriefing';
import { SimulationView } from './components/SimulationView';
import { LevelSelect } from './components/LevelSelect';
import { TransformLab } from './components/TransformLab';
import { LEVELS, LevelConfig } from './physics/levels';

export default function App() {
  const [currentView, setCurrentView] = useState<GameView>('MENU');
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(LEVELS[0]);

  return (
    <div className="w-full min-h-screen bg-[#04060d] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {currentView === 'MENU' && (
        <MainMenu
          onPlayClick={() => setCurrentView('BRIEFING')}
          onOpenBriefing={() => setCurrentView('BRIEFING')}
          onOpenLevelSelect={() => setCurrentView('LEVEL_SELECT')}
          onOpenTransformLab={() => setCurrentView('TRANSFORM_LAB')}
        />
      )}

      {currentView === 'BRIEFING' && (
        <MissionBriefing
          onStartMission={() => setCurrentView('SIMULATION')}
          onBackToMenu={() => setCurrentView('MENU')}
        />
      )}

      {currentView === 'LEVEL_SELECT' && (
        <LevelSelect
          currentLevelId={currentLevel.id}
          onSelectLevel={(level) => {
            setCurrentLevel(level);
            setCurrentView('SIMULATION');
          }}
          onReturnToMenu={() => setCurrentView('MENU')}
        />
      )}

      {currentView === 'TRANSFORM_LAB' && (
        <TransformLab
          onReturnToSimulation={() => setCurrentView('SIMULATION')}
          onReturnToMenu={() => setCurrentView('MENU')}
        />
      )}

      {currentView === 'SIMULATION' && (
        <SimulationView
          currentLevel={currentLevel}
          onSelectLevel={(level) => {
            setCurrentLevel(level);
          }}
          onOpenLevelSelect={() => setCurrentView('LEVEL_SELECT')}
          onOpenTransformLab={() => setCurrentView('TRANSFORM_LAB')}
          onReturnToMenu={() => setCurrentView('MENU')}
          onOpenBriefing={() => setCurrentView('BRIEFING')}
        />
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameView } from './types/game';
import { MainMenu } from './components/MainMenu';
import { MissionBriefing } from './components/MissionBriefing';
import { SimulationView } from './components/SimulationView';

export default function App() {
  const [currentView, setCurrentView] = useState<GameView>('MENU');

  return (
    <div className="w-full min-h-screen bg-[#04060d] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {currentView === 'MENU' && (
        <MainMenu
          onPlayClick={() => setCurrentView('BRIEFING')}
          onOpenBriefing={() => setCurrentView('BRIEFING')}
        />
      )}

      {currentView === 'BRIEFING' && (
        <MissionBriefing
          onStartMission={() => setCurrentView('SIMULATION')}
          onBackToMenu={() => setCurrentView('MENU')}
        />
      )}

      {currentView === 'SIMULATION' && (
        <SimulationView
          onReturnToMenu={() => setCurrentView('MENU')}
          onOpenBriefing={() => setCurrentView('BRIEFING')}
        />
      )}
    </div>
  );
}

'use client';

import { useGameStore } from '@/lib/game/store';
import { MainMenu } from './main-menu';
import { ResourceHUD } from './resource-hud';
import { MapView } from './map-view';
import { PartyPanel } from './party-panel';
import { ActionBar } from './action-bar';
import { BattleScreen } from './battle-screen';
import { ShopScreen } from './shop-screen';
import { RestScreen } from './rest-screen';
import { EventScreen } from './event-screen';
import { TreasureScreen } from './treasure-screen';
import { GameOverScreen } from './game-over-screen';

export function GameContainer() {
  const { phase } = useGameStore();
  
  // Main menu
  if (phase === 'menu') {
    return <MainMenu />;
  }
  
  // Game over
  if (phase === 'gameOver') {
    return <GameOverScreen />;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Resource HUD */}
      <ResourceHUD />
      
      {/* Main game area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Map view (center) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <MapView />
          </div>
          
          {/* Action bar (bottom) */}
          <ActionBar />
        </div>
        
        {/* Party panel (right sidebar) */}
        <div className="w-full md:w-72 lg:w-80 flex-shrink-0 border-t md:border-t-0 md:border-l border-border/50 md:h-full overflow-hidden">
          <PartyPanel />
        </div>
      </div>
      
      {/* Overlay screens */}
      {phase === 'battle' && <BattleScreen />}
      {phase === 'shop' && <ShopScreen />}
      {phase === 'rest' && <RestScreen />}
      {phase === 'event' && <EventScreen />}
      {phase === 'treasure' && <TreasureScreen />}
    </div>
  );
}

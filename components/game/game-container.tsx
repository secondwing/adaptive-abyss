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
import { TooltipProvider } from '@/components/ui/tooltip';

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
    <TooltipProvider delayDuration={200}>
      <div className="h-screen max-h-screen overflow-hidden flex flex-col md:flex-row bg-background">
      {/* Left Column (HUD + Main Game Area) */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
        {/* Resource HUD (Top of Left Column) */}
        <ResourceHUD />
        
        {/* Map view (center) */}
        <div className="flex-[1_1_auto] flex flex-col overflow-hidden min-h-0 relative z-0">
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <MapView />
          </div>
          
          {/* Action bar (bottom of Left Column) */}
          <div className="flex-none">
            <ActionBar />
          </div>
        </div>
        
        {/* Overlays that should only cover the main area, not the party panel */}
        {phase === 'shop' && <ShopScreen />}
        {phase === 'rest' && <RestScreen />}
        {phase === 'event' && <EventScreen />}
        {phase === 'treasure' && <TreasureScreen />}
      </div>
      
      {/* Right Column: Party panel (spanning full height on MD) */}
      <div className="w-full md:w-72 lg:w-80 flex-[0_0_auto] md:flex-shrink-0 border-t md:border-t-0 md:border-l border-border/50 flex flex-col overflow-hidden min-h-0 h-[40vh] md:h-full md:max-h-full bg-card/30 z-20">
        <PartyPanel />
      </div>
      
      {/* Absolute full-screen overlays */}
      {phase === 'battle' && <BattleScreen />}
    </div>
    </TooltipProvider>
  );
}

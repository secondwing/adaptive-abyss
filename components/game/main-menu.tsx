'use client';

import { useGameStore } from '@/lib/game/store';
import { Button } from '@/components/ui/button';
import { Swords, Play, Info } from 'lucide-react';

export function MainMenu() {
  const { startNewGame } = useGameStore();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background via-background to-secondary/20">
      <div className="text-center space-y-8 max-w-lg">
        {/* Title */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Swords className="w-12 h-12 md:w-16 md:h-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="text-primary">DUNGEON</span>
            <br />
            <span className="text-foreground">DRIFT</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Auto-Battle Roguelike RPG
          </p>
        </div>
        
        {/* Description */}
        <div className="p-6 bg-card/50 rounded-xl border border-border/50 text-left space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            How to Play
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              Navigate the dungeon map using AP (Action Points)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              Enter rooms to trigger events, battles, or find treasure
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              Battles are automatic - prepare your party wisely!
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">4.</span>
              Reach and defeat the boss to clear the chapter
            </li>
          </ul>
        </div>
        
        {/* Start button */}
        <Button
          onClick={startNewGame}
          size="lg"
          className="w-full md:w-auto px-12 py-6 text-lg gap-3"
        >
          <Play className="w-6 h-6" />
          Start Adventure
        </Button>
        
        <p className="text-xs text-muted-foreground">
          v0.1.0 - M1 Prototype
        </p>
      </div>
    </div>
  );
}

'use client';

import { useGameStore } from '@/lib/game/store';
import { Button } from '@/components/ui/button';
import { Skull, RotateCcw, Trophy, Coins, Star, Map } from 'lucide-react';

export function GameOverScreen() {
  const { startNewGame, turn, resources, map } = useGameStore();
  
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center space-y-6">
        <div>
          <Skull className="w-24 h-24 text-rose-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-4xl font-bold text-rose-400">Game Over</h1>
          <p className="text-muted-foreground mt-2">
            Your party has fallen in the dungeon...
          </p>
        </div>
        
        <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Run Statistics
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Turns</span>
              <span className="ml-auto font-bold">{turn}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-muted-foreground">Chapter</span>
              <span className="ml-auto font-bold">{map.chapter}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-muted-foreground">Gold</span>
              <span className="ml-auto font-bold">{resources.gold}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-muted-foreground">EXP</span>
              <span className="ml-auto font-bold">{resources.exp}</span>
            </div>
          </div>
          
          <div className="pt-3 border-t border-border/50">
            <div className="text-xs text-muted-foreground">
              Rooms Explored: {map.rooms.flat().filter(r => r.visited).length} / {map.width * map.height}
            </div>
          </div>
        </div>
        
        <Button
          onClick={startNewGame}
          size="lg"
          className="w-full gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

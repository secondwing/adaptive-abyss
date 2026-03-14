'use client';

import { useGameStore } from '@/lib/game/store';
import { getRoomIcon, getRoomColor } from '@/lib/game/map-generator';
import { cn } from '@/lib/utils';
import {
  Swords,
  Skull,
  Flame,
  ShoppingCart,
  Heart,
  HelpCircle,
  Gem,
  Square,
  Home,
} from 'lucide-react';

const iconMap = {
  Swords,
  Skull,
  Flame,
  ShoppingCart,
  Heart,
  HelpCircle,
  Gem,
  Square,
  Home,
};

export function MapView() {
  const { map, movePlayer, canMove, resources } = useGameStore();
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm text-muted-foreground">
        Chapter {map.chapter} - Turn {useGameStore.getState().turn}
      </div>
      
      <div 
        className="grid gap-1 p-4 bg-card/50 rounded-lg border border-border/50"
        style={{ 
          gridTemplateColumns: `repeat(${map.width}, minmax(0, 1fr))`,
        }}
      >
        {map.rooms.map((row, y) =>
          row.map((room, x) => {
            const isPlayer = x === map.playerX && y === map.playerY;
            const canMoveTo = canMove(x, y);
            const iconName = getRoomIcon(room.type);
            const IconComponent = iconMap[iconName as keyof typeof iconMap] || Square;
            const colorClass = getRoomColor(room.type);
            
            return (
              <button
                key={room.id}
                onClick={() => canMoveTo && movePlayer(x, y)}
                disabled={!canMoveTo && !isPlayer}
                className={cn(
                  'relative w-10 h-10 md:w-12 md:h-12 rounded-md flex items-center justify-center transition-all duration-200',
                  'border',
                  isPlayer && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                  room.visited && 'bg-secondary/30',
                  room.cleared && 'opacity-60',
                  canMoveTo && !isPlayer && 'cursor-pointer hover:bg-secondary/50 hover:scale-105 border-primary/50',
                  !canMoveTo && !isPlayer && 'cursor-default border-border/30',
                  isPlayer && 'border-primary bg-primary/20',
                )}
              >
                <IconComponent 
                  className={cn(
                    'w-5 h-5 md:w-6 md:h-6',
                    colorClass,
                    room.cleared && 'opacity-50',
                  )} 
                />
                {isPlayer && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background animate-pulse" />
                )}
                {canMoveTo && !isPlayer && resources.ap > 0 && (
                  <div className="absolute inset-0 rounded-md border-2 border-dashed border-primary/40 animate-pulse" />
                )}
              </button>
            );
          })
        )}
      </div>
      
      <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Swords className="w-3 h-3 text-orange-400" />
          <span>Battle</span>
        </div>
        <div className="flex items-center gap-1">
          <Skull className="w-3 h-3 text-red-500" />
          <span>Elite</span>
        </div>
        <div className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-rose-600" />
          <span>Boss</span>
        </div>
        <div className="flex items-center gap-1">
          <ShoppingCart className="w-3 h-3 text-yellow-400" />
          <span>Shop</span>
        </div>
        <div className="flex items-center gap-1">
          <Heart className="w-3 h-3 text-emerald-400" />
          <span>Rest</span>
        </div>
        <div className="flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-purple-400" />
          <span>Event</span>
        </div>
        <div className="flex items-center gap-1">
          <Gem className="w-3 h-3 text-amber-300" />
          <span>Treasure</span>
        </div>
      </div>
    </div>
  );
}

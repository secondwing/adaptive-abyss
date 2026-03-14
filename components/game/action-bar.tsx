'use client';

import { useGameStore } from '@/lib/game/store';
import { getAdjacentRooms } from '@/lib/game/map-generator';
import { Button } from '@/components/ui/button';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  RotateCcw,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ActionBar() {
  const { map, movePlayer, canMove, endTurn, resources } = useGameStore();
  
  const directions = [
    { key: 'up', icon: ArrowUp, dx: 0, dy: -1, label: 'Move Up' },
    { key: 'down', icon: ArrowDown, dx: 0, dy: 1, label: 'Move Down' },
    { key: 'left', icon: ArrowLeft, dx: -1, dy: 0, label: 'Move Left' },
    { key: 'right', icon: ArrowRight, dx: 1, dy: 0, label: 'Move Right' },
  ];
  
  const currentRoom = map.rooms[map.playerY][map.playerX];
  const adjacentRooms = getAdjacentRooms(map, map.playerX, map.playerY);
  
  return (
    <div className="p-4 bg-card/80 border-t border-border/50 backdrop-blur-sm">
      <div className="flex flex-col gap-4">
        {/* Current room info */}
        <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              Current: <span className="font-semibold capitalize">{currentRoom.type}</span>
              {currentRoom.cleared && <span className="text-emerald-400 ml-2">(Cleared)</span>}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Position: ({map.playerX}, {map.playerY})
          </span>
        </div>
        
        {/* Movement controls */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-1">
            {directions.map(({ key, icon: Icon, dx, dy, label }) => {
              const targetX = map.playerX + dx;
              const targetY = map.playerY + dy;
              const canMoveHere = canMove(targetX, targetY);
              const targetRoom = adjacentRooms.find(r => r.x === targetX && r.y === targetY);
              
              return (
                <Button
                  key={key}
                  variant={canMoveHere ? 'default' : 'secondary'}
                  size="icon"
                  onClick={() => canMoveHere && movePlayer(targetX, targetY)}
                  disabled={!canMoveHere}
                  className={cn(
                    'relative',
                    canMoveHere && 'hover:scale-105',
                  )}
                  title={targetRoom ? `${label} - ${targetRoom.type}` : label}
                >
                  <Icon className="w-5 h-5" />
                  {targetRoom && !targetRoom.visited && canMoveHere && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                  )}
                </Button>
              );
            })}
          </div>
          
          <div className="w-px h-10 bg-border mx-2" />
          
          <Button
            variant="outline"
            onClick={endTurn}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            End Turn
            <span className="text-xs text-muted-foreground">(+5G, AP Reset)</span>
          </Button>
          
          {process.env.NODE_ENV === 'development' || true ? (
            <Button
              variant="destructive"
              onClick={() => useGameStore.getState().advanceTime(10)}
              className="gap-2 ml-4 opacity-50 hover:opacity-100"
              title="Demonstrate Ecosystem mechanics"
            >
              Dev: Time +10
            </Button>
          ) : null}
        </div>
        
        {/* AP indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Movement Cost: 1 AP</span>
          <span>|</span>
          <span className={cn(
            'font-semibold',
            resources.ap > 0 ? 'text-cyan-400' : 'text-rose-400',
          )}>
            {resources.ap} AP remaining
          </span>
        </div>
      </div>
    </div>
  );
}

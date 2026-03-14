'use client';

import { useGameStore } from '@/lib/game/store';
import { getClassDisplayName, getRarityColor } from '@/lib/game/unit-factory';
import { Button } from '@/components/ui/button';
import { Heart, Coins, ArrowLeft, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RestScreen() {
  const { party, resources, healAllUnits, modifyResource, setPhase, map } = useGameStore();
  
  const healCost = 30;
  const healPercentage = 0.3; // 30% heal
  
  // Check if any unit needs healing
  const needsHealing = party.some((u) => u.stats.hp < u.stats.maxHp);
  const canAfford = resources.gold >= healCost;
  const canHeal = canAfford && needsHealing;
  
  const handleHeal = () => {
    if (!canHeal) return;
    modifyResource('gold', -healCost);
    healAllUnits(healPercentage);
    
    // Mark room as cleared
    useGameStore.setState((state) => ({
      map: {
        ...state.map,
        rooms: state.map.rooms.map((row, ry) =>
          row.map((cell, rx) =>
            rx === state.map.playerX && ry === state.map.playerY
              ? { ...cell, cleared: true }
              : cell
          )
        ),
      },
    }));
  };
  
  const handleLeave = () => {
    // Mark room as cleared even if not healing
    useGameStore.setState((state) => ({
      map: {
        ...state.map,
        rooms: state.map.rooms.map((row, ry) =>
          row.map((cell, rx) =>
            rx === state.map.playerX && ry === state.map.playerY
              ? { ...cell, cleared: true }
              : cell
          )
        ),
      },
    }));
    setPhase('map');
  };
  
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-lg w-full mx-4 flex flex-col max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="text-center p-6 pb-4 flex-shrink-0">
          <Heart className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h2 className="text-2xl font-bold">Rest Area</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            A safe place to recover your party's strength.
          </p>
        </div>
        
        {/* Party HP Status - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-card py-1">Party Status</h3>
          <div className="space-y-3 pb-2">
          {party.map((unit) => {
            const hpPercentage = (unit.stats.hp / unit.stats.maxHp) * 100;
            const healAmount = Math.floor(unit.stats.maxHp * healPercentage);
            const actualHeal = Math.min(healAmount, unit.stats.maxHp - unit.stats.hp);
            
            return (
              <div key={unit.id} className="p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <User className={cn('w-4 h-4', getRarityColor(unit.rarity))} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={cn('font-semibold text-sm', getRarityColor(unit.rarity))}>
                        {unit.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getClassDisplayName(unit.class)} Lv.{unit.level}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-0.5">
                      <span className="text-muted-foreground">
                        HP: {unit.stats.hp} / {unit.stats.maxHp}
                      </span>
                      {actualHeal > 0 && (
                        <span className="text-emerald-400">+{actualHeal}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      'h-full transition-all duration-300',
                      hpPercentage > 50 ? 'bg-emerald-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-rose-500',
                    )}
                    style={{ width: `${hpPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          </div>
        </div>
        
        {/* Actions - Fixed at bottom */}
        <div className="p-6 pt-4 space-y-3 flex-shrink-0 border-t border-border/50">
          <Button
            onClick={handleHeal}
            disabled={!canHeal}
            className="w-full gap-2"
            size="lg"
          >
            <Heart className="w-4 h-4" />
            Heal All (+30% HP)
            <span className="flex items-center gap-1 text-yellow-400">
              <Coins className="w-3 h-3" />
              {healCost}
            </span>
          </Button>
          
          {!needsHealing && (
            <p className="text-center text-sm text-emerald-400">
              Your party is already at full health!
            </p>
          )}
          
          {needsHealing && !canAfford && (
            <p className="text-center text-sm text-rose-400">
              Not enough gold to heal.
            </p>
          )}
          
          <Button
            onClick={handleLeave}
            variant="outline"
            className="w-full gap-2"
            size="lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Leave Rest Area
          </Button>
        </div>
      </div>
    </div>
  );
}

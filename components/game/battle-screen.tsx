'use client';

import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/lib/game/store';
import { getClassDisplayName } from '@/lib/game/unit-factory';
import type { Unit, Enemy, BattleAction } from '@/lib/game/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  FastForward, 
  Swords,
  Heart,
  Skull,
  Trophy,
  User,
} from 'lucide-react';

interface BattleUnitProps {
  unit: Unit | Enemy;
  isAlly: boolean;
  isActive?: boolean;
  lastAction?: BattleAction;
}

function BattleUnit({ unit, isAlly, isActive, lastAction }: BattleUnitProps) {
  const hpPercentage = Math.max(0, (unit.stats.hp / unit.stats.maxHp) * 100);
  const isDead = unit.stats.hp <= 0;
  
  return (
    <div
      className={cn(
        'relative p-3 rounded-lg border transition-all duration-300',
        'flex flex-col items-center gap-2',
        isAlly ? 'bg-blue-950/30 border-blue-500/30' : 'bg-rose-950/30 border-rose-500/30',
        isDead && 'opacity-40 grayscale',
        isActive && !isDead && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105',
      )}
    >
      {/* Damage/Heal popup */}
      {lastAction && (
        <div
          className={cn(
            'absolute -top-4 left-1/2 -translate-x-1/2 text-sm font-bold animate-bounce',
            lastAction.type === 'heal' ? 'text-emerald-400' : 'text-rose-400',
            lastAction.isCrit && 'text-lg text-yellow-400',
          )}
        >
          {lastAction.type === 'heal' 
            ? `+${lastAction.healing}` 
            : `-${lastAction.damage}${lastAction.isCrit ? '!' : ''}`
          }
        </div>
      )}
      
      {/* Unit icon */}
      <div className={cn(
        'w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center',
        isAlly ? 'bg-blue-900/50' : 'bg-rose-900/50',
        isDead && 'bg-gray-900/50',
      )}>
        {isDead ? (
          <Skull className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
        ) : (
          <User className={cn(
            'w-6 h-6 md:w-8 md:h-8',
            isAlly ? 'text-blue-400' : 'text-rose-400',
          )} />
        )}
      </div>
      
      {/* Name and class */}
      <div className="text-center">
        <div className="text-sm font-semibold truncate max-w-20">{unit.name}</div>
        <div className="text-[10px] text-muted-foreground">
          {getClassDisplayName(unit.class)}
        </div>
      </div>
      
      {/* HP bar */}
      <div className="w-full">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
          <span>HP</span>
          <span className="tabular-nums">{Math.max(0, unit.stats.hp)}/{unit.stats.maxHp}</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full transition-all duration-500',
              hpPercentage > 50 ? 'bg-emerald-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-rose-500',
            )}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function BattleScreen() {
  const { battle, processBattleRound, endBattle, setPhase } = useGameStore();
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const [actionHighlights, setActionHighlights] = useState<Record<string, BattleAction>>({});
  
  const processRound = useCallback(() => {
    if (!battle || battle.result !== 'ongoing') return;
    
    processBattleRound();
    
    // Show action highlights
    const lastLog = useGameStore.getState().battle?.logs.slice(-1)[0];
    if (lastLog) {
      const highlights: Record<string, BattleAction> = {};
      lastLog.actions.forEach((action) => {
        highlights[action.targetId] = action;
      });
      setActionHighlights(highlights);
      
      setTimeout(() => setActionHighlights({}), 1000 / speed);
    }
  }, [battle, processBattleRound, speed]);
  
  useEffect(() => {
    if (!isAutoPlaying || !battle || battle.result !== 'ongoing') return;
    
    const interval = setInterval(() => {
      processRound();
    }, 1500 / speed);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, battle, processRound, speed]);
  
  if (!battle) return null;
  
  const isVictory = battle.result === 'victory';
  const isDefeat = battle.result === 'defeat';
  const isBattleOver = battle.result !== 'ongoing';
  
  // Calculate rewards
  const totalGold = battle.enemies.reduce((sum, e) => sum + e.goldReward, 0);
  const totalExp = battle.enemies.reduce((sum, e) => sum + e.expReward, 0);
  
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col">
      {/* Battle header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/50">
        <div className="flex items-center gap-3">
          <Swords className="w-5 h-5 text-primary" />
          <span className="font-semibold">Battle - Round {battle.round}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Speed:</span>
          {[1, 2, 4].map((s) => (
            <Button
              key={s}
              variant={speed === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSpeed(s as 1 | 2 | 4)}
              className="w-8 h-8 p-0"
            >
              x{s}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Battle arena */}
      <div className="flex-1 flex items-center justify-center p-4 gap-8 md:gap-16">
        {/* Allies */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-blue-400 text-center mb-2">Party</h3>
          <div className="flex flex-wrap gap-3 justify-center max-w-xs">
            {battle.allies.map((unit) => (
              <BattleUnit
                key={unit.id}
                unit={unit}
                isAlly={true}
                isActive={battle.turnOrder[battle.currentTurnIndex] === unit.id}
                lastAction={actionHighlights[unit.id]}
              />
            ))}
          </div>
        </div>
        
        {/* VS indicator */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
            <span className="text-xl font-bold text-primary">VS</span>
          </div>
        </div>
        
        {/* Enemies */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-rose-400 text-center mb-2">Enemies</h3>
          <div className="flex flex-wrap gap-3 justify-center max-w-xs">
            {battle.enemies.map((enemy) => (
              <BattleUnit
                key={enemy.id}
                unit={enemy}
                isAlly={false}
                isActive={battle.turnOrder[battle.currentTurnIndex] === enemy.id}
                lastAction={actionHighlights[enemy.id]}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Battle controls / Result */}
      <div className="p-4 border-t border-border/50 bg-card/50">
        {isBattleOver ? (
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              'flex items-center gap-3 text-2xl font-bold',
              isVictory ? 'text-emerald-400' : 'text-rose-400',
            )}>
              {isVictory ? (
                <>
                  <Trophy className="w-8 h-8" />
                  Victory!
                </>
              ) : (
                <>
                  <Skull className="w-8 h-8" />
                  Defeat...
                </>
              )}
            </div>
            
            {isVictory && (
              <div className="flex flex-col items-center gap-2 text-sm">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">+{totalGold}</span>
                    <span className="text-muted-foreground">Gold</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">+{totalExp}</span>
                    <span className="text-muted-foreground">EXP (distributed to survivors)</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Each surviving unit gains {Math.floor(totalExp / battle.allies.filter(a => a.stats.hp > 0).length)} EXP
                </p>
              </div>
            )}
            
            <Button
              onClick={() => endBattle(isVictory)}
              variant={isVictory ? 'default' : 'destructive'}
              size="lg"
            >
              {isVictory ? 'Continue' : 'Game Over'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={processRound}
              disabled={isAutoPlaying}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              Next Turn
            </Button>
            
            <Button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              variant={isAutoPlaying ? 'destructive' : 'default'}
              size="lg"
              className="gap-2"
            >
              <FastForward className="w-4 h-4" />
              {isAutoPlaying ? 'Stop' : 'Auto Battle'}
            </Button>
          </div>
        )}
      </div>
      
      {/* Battle log */}
      <div className="h-24 overflow-y-auto p-3 bg-secondary/30 border-t border-border/30">
        <div className="space-y-1 text-xs text-muted-foreground">
          {battle.logs.slice(-5).map((log, idx) => (
            <div key={idx}>
              <span className="text-primary font-semibold">Round {log.round}:</span>{' '}
              {log.actions.map((action, actionIdx) => {
                const actor = [...battle.allies, ...battle.enemies].find(u => u.id === action.actorId);
                const target = [...battle.allies, ...battle.enemies].find(u => u.id === action.targetId);
                
                return (
                  <span key={actionIdx}>
                    {action.type === 'heal' ? (
                      <span className="text-emerald-400">
                        {actor?.name} healed {target?.name} for {action.healing}HP
                      </span>
                    ) : (
                      <span className={action.isCrit ? 'text-yellow-400' : 'text-rose-400'}>
                        {actor?.name} hit {target?.name} for {action.damage}
                        {action.isCrit && ' (CRIT!)'}
                      </span>
                    )}
                    {actionIdx < log.actions.length - 1 && ', '}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

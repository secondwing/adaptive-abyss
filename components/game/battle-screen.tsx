'use client';

import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/lib/game/store';
import { getClassDisplayName, getRarityColor, getRarityBgColor, getRarityBorderColor } from '@/lib/game/unit-factory';
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
  Sword,
  Target,
  Wand2,
  Zap,
  Flame,
  X,
  Shield,
  ShieldAlert,
  Wind
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
  
  const classIcons: Record<string, any> = {
    warrior: Sword,
    ranger: Target,
    mage: Wand2,
    healer: Heart,
    rogue: Zap,
    shaman: Flame,
  };
  const Icon = classIcons[unit.class] || User;
  
  const rarityColor = getRarityColor(unit.rarity);
  const rarityBgClass = getRarityBgColor(unit.rarity);
  const rarityBorderClass = getRarityBorderColor(unit.rarity);
  
  // A dark fallback for enemy backgrounds since their rarity bg might be too colorful, but let's keep it uniform for now.
  const bgClass = isAlly ? rarityBgClass : 'bg-rose-950/30';
  const borderClass = isAlly ? rarityBorderClass : 'border-rose-500/30';
  
  return (
    <div
      className={cn(
        'relative w-full h-full rounded flex items-center justify-between flex-col p-0.5 transition-all duration-300',
        bgClass, borderClass, 'border',
        isDead && 'opacity-30 grayscale',
        isActive && !isDead && 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-110 z-20',
      )}
    >
      {/* Damage/Heal popup */}
      {lastAction && (
        <div
          className={cn(
            'absolute -top-4 left-1/2 -translate-x-1/2 text-xs sm:text-sm md:text-base font-black animate-bounce z-50 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]',
            lastAction.type === 'heal' ? 'text-emerald-400' : 'text-rose-400',
            lastAction.isCrit && 'text-base sm:text-lg text-yellow-400 scale-125',
          )}
        >
          {lastAction.type === 'heal' 
            ? `+${lastAction.healing}` 
            : `-${lastAction.damage}${lastAction.isCrit ? '!' : ''}`
          }
        </div>
      )}
      
      {/* Stars */}
      <div className={cn("text-[8px] sm:text-[10px] md:text-xs font-bold leading-none w-full text-center drop-shadow-sm", rarityColor)}>
        {unit.rarity > 5 ? `★${unit.rarity}` : '★'.repeat(unit.rarity)}
      </div>
      
      {/* Icon */}
      <div className="flex-1 flex items-center justify-center w-full min-h-0">
        {isDead ? (
          <Skull className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-neutral-600 drop-shadow-md" />
        ) : (
          <Icon className={cn(
            'w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 drop-shadow-md',
            rarityColor
          )} />
        )}
      </div>
      
      {/* Name and HP */}
      <div className="w-full mt-auto">
        <div className="flex justify-between items-center text-[7px] sm:text-[9px] text-muted-foreground font-medium mb-[1px] leading-none">
          <span className="truncate max-w-[100%] sm:max-w-[70%]">{unit.name}</span>
          <span className="hidden sm:inline tabular-nums">{Math.ceil(hpPercentage)}%</span>
        </div>
        <div className="h-1 sm:h-1.5 w-full bg-slate-950/80 rounded-full overflow-hidden border border-black/50">
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
  const { battle, processBattleRound, endBattle, setPhase, battleSpeed, setBattleSpeed } = useGameStore();
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [actionHighlights, setActionHighlights] = useState<Record<string, BattleAction>>({});
  const [selectedAllyId, setSelectedAllyId] = useState<string | null>(null);
  const [selectedEnemyId, setSelectedEnemyId] = useState<string | null>(null);
  
  const processRound = useCallback(() => {
    if (!battle || battle.result !== 'ongoing') return;
    
    processBattleRound();
    
    const lastLog = useGameStore.getState().battle?.logs.slice(-1)[0];
    if (lastLog) {
      const highlights: Record<string, BattleAction> = {};
      lastLog.actions.forEach((action) => {
        highlights[action.targetId] = action;
      });
      setActionHighlights(highlights);
      
      setTimeout(() => setActionHighlights({}), 1000 / battleSpeed);
    }
  }, [battle, processBattleRound, battleSpeed]);
  
  useEffect(() => {
    if (!isAutoPlaying || !battle || battle.result !== 'ongoing' || battle.phase === 'placement') return;
    
    const interval = setInterval(() => {
      processRound();
    }, 1500 / battleSpeed);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, battle, processRound, battleSpeed]);
  
  if (!battle) return null;
  
  const isVictory = battle.result === 'victory';
  const isDefeat = battle.result === 'defeat';
  const isBattleOver = battle.result !== 'ongoing';
  
  const totalGold = battle.enemies.reduce((sum, e) => sum + e.goldReward, 0);
  const totalExp = battle.enemies.reduce((sum, e) => sum + e.expReward, 0);

  const startCombat = () => {
    useGameStore.setState(state => ({
      battle: state.battle ? { ...state.battle, phase: 'battle' } : null
    }));
    setSelectedAllyId(null);
    setSelectedEnemyId(null);
  };

  const handleEnemyCellClick = (x: number, y: number) => {
    if (battle.phase !== 'placement') return;
    const unitAtCell = battle.enemies.find(e => e.boardX === x && e.boardY === y);
    if (unitAtCell) {
      setSelectedEnemyId(unitAtCell.id);
      setSelectedAllyId(null);
    } else {
      setSelectedEnemyId(null);
    }
  };

  const handleAllyCellClick = (x: number, y: number) => {
    if (battle.phase !== 'placement') return;
    
    const unitAtCell = battle.allies.find(u => u.boardX === x && u.boardY === y);
    
    if (selectedAllyId) {
      if (unitAtCell && unitAtCell.id === selectedAllyId) {
        setSelectedAllyId(null);
      } else {
        useGameStore.setState(state => {
          if (!state.battle) return state;
          
          const newAllies = state.party.map(u => {
             if (u.id === selectedAllyId) {
               return { ...u, boardX: x, boardY: y };
             }
             if (unitAtCell && u.id === unitAtCell.id) {
               const oldSelected = state.party.find(s => s.id === selectedAllyId);
               return { ...u, boardX: oldSelected?.boardX || 0, boardY: oldSelected?.boardY || 0 };
             }
             return u;
          });
          
          return { 
            party: newAllies,
            battle: {
              ...state.battle,
              allies: newAllies.map(u => ({...u, stats: {...u.stats}}))
            } 
          };
        });
        setSelectedAllyId(null);
      }
    } else {
      if (unitAtCell) {
        setSelectedAllyId(unitAtCell.id);
        setSelectedEnemyId(null);
      }
    }
  };

  // The inspected unit based on selection
  const inspectedUnit = (selectedAllyId && battle.allies.find(u => u.id === selectedAllyId)) || 
                        (selectedEnemyId && battle.enemies.find(e => e.id === selectedEnemyId)) || null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col pt-safe">
      <div className="p-4 border-b border-border/50 flex flex-wrap items-center justify-between bg-card/50">
        <div className="flex items-center gap-3">
          <Swords className="w-5 h-5 text-primary" />
          <span className="font-semibold">
            {battle.phase === 'placement' ? 'Formation Phase' : `Battle - Round ${battle.round}`}
          </span>
        </div>
        
        {battle.phase !== 'placement' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Speed:</span>
            {[1, 2, 4].map((s) => (
              <Button
                key={s}
                variant={battleSpeed === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBattleSpeed(s as 1 | 2 | 4)}
                className="w-8 h-8 p-0"
              >
                x{s}
              </Button>
            ))}
          </div>
        )}
      </div>
      
      {/* Unit Inspector Overlay */}
      {inspectedUnit && battle.phase === 'placement' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
          <div className="bg-card/95 backdrop-blur-md border border-primary/50 rounded-xl p-4 shadow-2xl flex flex-col gap-3 min-w-[280px]">
            <div className="flex items-start justify-between">
               <div className="flex flex-col">
                 <div className="flex items-center gap-2">
                   <span className={cn('font-bold text-lg', getRarityColor(inspectedUnit.rarity))}>{inspectedUnit.name}</span>
                   <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{getClassDisplayName(inspectedUnit.class)}</span>
                 </div>
                 <div className={cn("text-xs font-bold", getRarityColor(inspectedUnit.rarity))}>
                   {'★'.repeat(inspectedUnit.rarity > 5 ? 5 : inspectedUnit.rarity)}{inspectedUnit.rarity > 5 ? ` (+${inspectedUnit.rarity - 5})` : ''}
                 </div>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-background/50 p-3 rounded-lg border border-border/50">
              <div className="flex items-center justify-between"><span className="text-muted-foreground text-xs"><Heart className="w-3 h-3 inline mr-1 text-rose-400"/>HP</span><span className="font-medium text-emerald-400">{Math.floor(inspectedUnit.stats.hp)}/{inspectedUnit.stats.maxHp}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground text-xs"><Sword className="w-3 h-3 inline mr-1 text-orange-400"/>ATK</span><span className="font-medium">{inspectedUnit.stats.atk}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground text-xs"><Shield className="w-3 h-3 inline mr-1 text-blue-400"/>DEF</span><span className="font-medium">{inspectedUnit.stats.def}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground text-xs"><Wand2 className="w-3 h-3 inline mr-1 text-purple-400"/>MGK</span><span className="font-medium">{inspectedUnit.stats.mgk}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground text-xs"><ShieldAlert className="w-3 h-3 inline mr-1 text-indigo-400"/>RES</span><span className="font-medium">{inspectedUnit.stats.res}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground text-xs"><Wind className="w-3 h-3 inline mr-1 text-teal-400"/>SPD</span><span className="font-medium">{inspectedUnit.stats.spd}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground text-xs"><Target className="w-3 h-3 inline mr-1 text-yellow-400"/>CRIT</span><span className="font-medium">{inspectedUnit.stats.crit}%</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground text-xs"><Zap className="w-3 h-3 inline mr-1 text-yellow-400"/>C.DMG</span><span className="font-medium">{inspectedUnit.stats.critDmg}%</span></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex flex-col xl:flex-row items-center justify-center p-2 gap-4 md:gap-8 overflow-auto min-h-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1 px-2">
            <h3 className="text-sm font-semibold text-blue-400">Ally Formation</h3>
            {battle.phase === 'placement' ? (
              <span className="text-xs font-semibold text-yellow-400 animate-pulse bg-yellow-400/10 px-2 py-0.5 rounded">Select & Swap</span>
            ) : (
              <span className="text-xs text-muted-foreground mr-4">Frontline →</span>
            )}
          </div>
          
          <div className="grid grid-cols-5 gap-1.5 md:gap-2 p-2 bg-blue-950/20 rounded-xl border border-blue-900/50 shadow-inner">
            {Array.from({ length: 25 }).map((_, i) => {
              const x = i % 5;
              const y = Math.floor(i / 5);
              const unit = battle.allies.find(u => u.boardX === x && u.boardY === y);
              const isSelected = selectedAllyId === unit?.id;
              
              return (
                <div 
                  key={`ally-${x}-${y}`}
                  onClick={() => handleAllyCellClick(x, y)}
                  className={cn(
                    "w-[2.5rem] h-[3rem] sm:w-[3.25rem] sm:h-[4rem] md:w-[4rem] md:h-[4.75rem] rounded transition-all relative",
                    unit ? "" : "bg-card/20 border border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden",
                    battle.phase === 'placement' && "cursor-pointer hover:border-yellow-400/80 hover:bg-white/5",
                    isSelected && "ring-2 ring-yellow-400 ring-offset-1 ring-offset-background scale-105 z-10"
                  )}
                >
                  {unit && (
                    <div className="absolute inset-0">
                      <BattleUnit
                        unit={unit}
                        isAlly={true}
                        isActive={battle.turnOrder[battle.currentTurnIndex] === unit.id}
                        lastAction={actionHighlights[unit.id]}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="hidden xl:flex flex-col items-center gap-2 px-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.2)]">
            <span className="text-xl font-black text-primary italic">VS</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
           <div className="flex items-center justify-between mb-1 px-2">
             <span className="text-xs text-muted-foreground ml-4">← Frontline</span>
             <h3 className="text-sm font-semibold text-rose-400">Enemy Formation</h3>
           </div>
           
           <div className="grid grid-cols-5 gap-1.5 md:gap-2 p-2 bg-rose-950/20 rounded-xl border border-rose-900/50 shadow-inner">
             {Array.from({ length: 25 }).map((_, i) => {
               const x = i % 5;
               const y = Math.floor(i / 5);
               const enemy = battle.enemies.find(e => e.boardX === x && e.boardY === y);
               
               return (
                 <div 
                   key={`enemy-${x}-${y}`}
                   onClick={() => handleEnemyCellClick(x, y)}
                   className={cn(
                     "w-[2.5rem] h-[3rem] sm:w-[3.25rem] sm:h-[4rem] md:w-[4rem] md:h-[4.75rem] rounded transition-all relative",
                     enemy ? "" : "bg-card/20 border border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden",
                     battle.phase === 'placement' && enemy && "cursor-pointer hover:border-rose-400/80 hover:bg-white/5",
                     selectedEnemyId === enemy?.id && "ring-2 ring-rose-400 ring-offset-1 ring-offset-background scale-105 z-10"
                   )}
                 >
                   {enemy && (
                     <div className="absolute inset-0">
                       <BattleUnit
                         unit={enemy}
                         isAlly={false}
                         isActive={battle.turnOrder[battle.currentTurnIndex] === enemy.id}
                         lastAction={actionHighlights[enemy.id]}
                       />
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
        </div>
      </div>
      
      {/* Bottom control bar (hidden if battle over) */}
      {!isBattleOver && (
        <div className="p-4 border-t border-border/50 bg-card/80 backdrop-blur-md z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          {battle.phase === 'placement' ? (
            <div className="flex flex-col items-center justify-center gap-3">
               <div className="text-sm text-muted-foreground">Tap units to swap positions before the battle begins.</div>
               <Button onClick={startCombat} size="lg" className="w-full md:w-auto px-12 py-6 text-lg font-bold animate-pulse-slow">
                 <Swords className="w-5 h-5 mr-2" />
                 START BATTLE
               </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={processRound}
                disabled={isAutoPlaying}
                variant="outline"
                size="lg"
                className="w-full md:w-auto gap-2"
              >
                <Play className="w-4 h-4" />
                Next Turn
              </Button>
              
              <Button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                variant={isAutoPlaying ? 'destructive' : 'default'}
                size="lg"
                className="w-full md:w-auto gap-2"
              >
                <FastForward className="w-4 h-4" />
                {isAutoPlaying ? 'Stop Auto' : 'Auto Play'}
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Battle Result Overlay */}
      {isBattleOver && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-4 p-8 bg-card border border-border/50 rounded-2xl shadow-2xl max-w-lg w-full scale-in-95 animate-in duration-500">
            <div className={cn(
              'flex items-center gap-3 text-3xl font-bold p-6 bg-background rounded-xl w-full justify-center border-2',
              isVictory ? 'text-emerald-400 border-emerald-500/50 shadow-[0_0_30px_rgba(52,211,153,0.2)]' : 'text-rose-400 border-rose-500/50 shadow-[0_0_30px_rgba(251,113,133,0.2)]',
            )}>
              {isVictory ? (
                <>
                  <Trophy className="w-10 h-10" />
                  Victory!
                </>
              ) : (
                <>
                  <Skull className="w-10 h-10" />
                  Defeat...
                </>
              )}
            </div>
            
            {isVictory && (
              <div className="flex flex-col items-center gap-3 text-sm bg-secondary/30 w-full p-6 rounded-xl border border-secondary/50">
                <div className="flex items-center justify-center gap-12 w-full">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Gold Earned</span>
                    <span className="text-3xl font-black text-yellow-400 drop-shadow-sm">+{totalGold}</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Total EXP</span>
                    <span className="text-3xl font-black text-purple-400 drop-shadow-sm">+{totalExp}</span>
                  </div>
                </div>
                <div className="w-full h-px bg-border my-2" />
                <p className="text-sm font-medium text-muted-foreground">
                  Each surviving unit gained <span className="text-foreground">{Math.floor(totalExp / Math.max(1, battle.allies.filter(a => a.stats.hp > 0).length))}</span> EXP
                </p>
              </div>
            )}
            
            <Button
              onClick={() => endBattle(isVictory)}
              variant={isVictory ? 'default' : 'destructive'}
              size="lg"
              className="w-full mt-4 h-14 text-lg font-bold"
            >
              {isVictory ? 'Continue Adventure' : 'Return to Menu'}
            </Button>
          </div>
        </div>
      )}
      
      {battle.phase !== 'placement' && (
        <div className="h-20 md:h-28 overflow-y-auto p-3 bg-secondary/30 border-t border-border/30 text-xs text-muted-foreground hidden sm:block">
          <div className="space-y-1 max-w-4xl mx-auto">
            {battle.logs.slice(-5).map((log, idx) => (
              <div key={idx} className="bg-background/40 p-1.5 rounded">
                <span className="text-primary font-bold mr-2">Round {log.round}:</span>
                {log.actions.map((action, actionIdx) => {
                  const actor = [...battle.allies, ...battle.enemies].find(u => u.id === action.actorId);
                  const target = [...battle.allies, ...battle.enemies].find(u => u.id === action.targetId);
                  
                  return (
                    <span key={actionIdx}>
                      {action.type === 'heal' ? (
                        <span className="text-emerald-400">
                          {actor?.name} healed {target?.name} (+{action.healing}HP)
                        </span>
                      ) : (
                        <span className={action.isCrit ? 'text-yellow-400 font-bold' : 'text-rose-400'}>
                          {actor?.name} hit {target?.name} (-{action.damage}HP)
                          {action.isCrit && ' [CRIT]'}
                        </span>
                      )}
                      {actionIdx < log.actions.length - 1 && '  |  '}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/game/store';
import { getClassDisplayName, getRarityColor, getRarityBorderColor } from '@/lib/game/unit-factory';
import type { Unit } from '@/lib/game/types';
import { cn } from '@/lib/utils';
import { 
  Sword, 
  Shield, 
  Wand2, 
  Heart, 
  Footprints, 
  Target,
  Sparkles,
  ChevronRight,
  User,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnitCardProps {
  unit: Unit;
  isSelected: boolean;
  onClick: () => void;
}

function UnitCard({ unit, isSelected, onClick }: UnitCardProps) {
  const hpPercentage = (unit.stats.hp / unit.stats.maxHp) * 100;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-lg border transition-all duration-200 text-left',
        'hover:bg-secondary/50',
        isSelected && 'bg-secondary/70 border-primary/50',
        !isSelected && 'bg-card/50 border-border/50',
        getRarityBorderColor(unit.rarity),
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          'bg-secondary border border-border',
        )}>
          <User className={cn('w-5 h-5', getRarityColor(unit.rarity))} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('font-semibold truncate', getRarityColor(unit.rarity))}>
              {unit.name}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {'★'.repeat(unit.rarity)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{getClassDisplayName(unit.class)}</span>
            <span>Lv.{unit.level}</span>
          </div>
        </div>
        
        <ChevronRight className={cn(
          'w-4 h-4 text-muted-foreground transition-transform',
          isSelected && 'rotate-90 text-primary',
        )} />
      </div>
      
      {/* HP Bar */}
      <div className="mt-2">
        <div className="flex justify-between text-[10px] mb-0.5">
          <span className="text-muted-foreground">HP</span>
          <span className="tabular-nums">{unit.stats.hp}/{unit.stats.maxHp}</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full transition-all duration-300',
              hpPercentage > 50 ? 'bg-emerald-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-rose-500',
            )}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
      </div>
      
      {/* EXP Bar */}
      <div className="mt-1">
        <div className="flex justify-between text-[10px] mb-0.5">
          <span className="text-muted-foreground">EXP</span>
          <span className="tabular-nums text-purple-400">{unit.exp}/100</span>
        </div>
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${unit.exp}%` }}
          />
        </div>
      </div>
    </button>
  );
}

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}

function StatRow({ icon, label, value, color = 'text-foreground' }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className={cn('text-sm font-semibold tabular-nums', color)}>{value}</span>
    </div>
  );
}

export function PartyPanel() {
  const { party } = useGameStore();
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(party[0] || null);
  
  return (
    <div className="flex flex-col h-full max-h-full bg-card/30 overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-sm font-semibold text-foreground">Party</h2>
        <p className="text-xs text-muted-foreground">{party.length}/9 Units</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {party.map((unit) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            isSelected={selectedUnit?.id === unit.id}
            onClick={() => setSelectedUnit(unit)}
          />
        ))}
      </div>
      
      {selectedUnit && (
        <div className="p-4 border-t border-border/50 bg-card/50 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Stats
            </h3>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-secondary/50 hover:bg-secondary border-border/50"
                onClick={() => {
                  useGameStore.getState().moveUnit(selectedUnit.id, 'up');
                }}
              >
                <ArrowUp className="w-3 h-3 text-muted-foreground" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-secondary/50 hover:bg-secondary border-border/50"
                onClick={() => {
                  useGameStore.getState().moveUnit(selectedUnit.id, 'down');
                }}
              >
                <ArrowDown className="w-3 h-3 text-muted-foreground" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 px-2 text-xs flex items-center gap-1 ml-1 opacity-80 hover:opacity-100"
                onClick={() => {
                  if (window.confirm(`${selectedUnit.name}을(를) 파티에서 방출하시겠습니까?`)) {
                    useGameStore.getState().removeUnit(selectedUnit.id);
                    setSelectedUnit(null);
                  }
                }}
              >
                <Trash2 className="w-3 h-3" />
                방출
              </Button>
            </div>
          </div>
          
          <div className="space-y-0.5">
            <StatRow 
              icon={<Sword className="w-3 h-3" />} 
              label="ATK" 
              value={selectedUnit.stats.atk}
              color="text-orange-400"
            />
            <StatRow 
              icon={<Shield className="w-3 h-3" />} 
              label="DEF" 
              value={selectedUnit.stats.def}
              color="text-blue-400"
            />
            <StatRow 
              icon={<Wand2 className="w-3 h-3" />} 
              label="MGK" 
              value={selectedUnit.stats.mgk}
              color="text-purple-400"
            />
            <StatRow 
              icon={<Shield className="w-3 h-3" />} 
              label="RES" 
              value={selectedUnit.stats.res}
              color="text-cyan-400"
            />
            <StatRow 
              icon={<Footprints className="w-3 h-3" />} 
              label="SPD" 
              value={selectedUnit.stats.spd}
              color="text-emerald-400"
            />
            <StatRow 
              icon={<Target className="w-3 h-3" />} 
              label="CRIT" 
              value={selectedUnit.stats.crit}
              color="text-rose-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}

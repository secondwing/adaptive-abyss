'use client';

import { useGameStore } from '@/lib/game/store';
import { Coins, Heart, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResourceItemProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  maxValue?: number;
  color: string;
  showBar?: boolean;
}

function ResourceItem({ icon, label, value, maxValue, color, showBar }: ResourceItemProps) {
  const percentage = maxValue ? (Number(value) / maxValue) * 100 : 100;
  
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-card/80 rounded-lg border border-border/50">
      <div className={cn('flex-shrink-0', color)}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold tabular-nums">
            {value}
            {maxValue && <span className="text-muted-foreground font-normal">/{maxValue}</span>}
          </span>
        </div>
        {showBar && (
          <div className="w-16 h-1 bg-secondary rounded-full overflow-hidden mt-0.5">
            <div 
              className={cn('h-full transition-all duration-300', color.replace('text-', 'bg-'))}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function ResourceHUD() {
  const { resources, turn, map, getPartyHpInfo } = useGameStore();
  const partyHp = getPartyHpInfo();
  
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg border border-primary/30">
        <span className="text-xs text-muted-foreground">Turn</span>
        <span className="text-lg font-bold text-primary tabular-nums">{turn}</span>
      </div>
      
      <div className="flex items-center gap-2 px-3 py-1 bg-secondary/50 rounded-lg">
        <span className="text-xs text-muted-foreground">Ch.</span>
        <span className="text-sm font-semibold">{map.chapter}</span>
      </div>
      
      <div className="w-px h-8 bg-border/50" />
      
      <ResourceItem
        icon={<Coins className="w-4 h-4" />}
        label="Gold"
        value={resources.gold}
        color="text-yellow-400"
      />
      
      <ResourceItem
        icon={<Heart className="w-4 h-4" />}
        label="Party HP"
        value={partyHp.current}
        maxValue={partyHp.max}
        color="text-rose-400"
        showBar
      />
      
      <ResourceItem
        icon={<Zap className="w-4 h-4" />}
        label="AP"
        value={resources.ap}
        maxValue={resources.maxAp}
        color="text-cyan-400"
        showBar
      />
      
      <ResourceItem
        icon={<Sparkles className="w-4 h-4" />}
        label="Mana"
        value={resources.manaShards}
        color="text-blue-400"
      />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/game/store';
import { Button } from '@/components/ui/button';
import { Gem, Coins, Sparkles, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

type TreasureType = 'gold' | 'manaShards' | 'rare';

interface TreasureReward {
  type: TreasureType;
  amount: number;
  label: string;
}

export function TreasureScreen() {
  const { setPhase, modifyResource, map } = useGameStore();
  const [collected, setCollected] = useState(false);
  const [treasure, setTreasure] = useState<TreasureReward | null>(null);
  const [showSparkle, setShowSparkle] = useState(false);

  useEffect(() => {
    // Generate random treasure
    const roll = Math.random();
    let reward: TreasureReward;
    
    if (roll < 0.6) {
      // 60% chance: Gold (30-80)
      const amount = Math.floor(Math.random() * 51) + 30;
      reward = { type: 'gold', amount, label: 'Gold' };
    } else if (roll < 0.9) {
      // 30% chance: Mana Shards (1-3)
      const amount = Math.floor(Math.random() * 3) + 1;
      reward = { type: 'manaShards', amount, label: 'Mana Shards' };
    } else {
      // 10% chance: Rare treasure (larger gold amount)
      const amount = Math.floor(Math.random() * 100) + 100;
      reward = { type: 'rare', amount, label: 'Ancient Treasure' };
    }
    
    setTreasure(reward);
  }, []);

  const handleCollect = () => {
    if (!treasure || collected) return;
    
    setShowSparkle(true);
    
    // Apply reward
    if (treasure.type === 'gold' || treasure.type === 'rare') {
      modifyResource('gold', treasure.amount);
    } else if (treasure.type === 'manaShards') {
      modifyResource('manaShards', treasure.amount);
    }
    
    setCollected(true);
    
    // Mark room as cleared
    useGameStore.setState((s) => ({
      map: {
        ...s.map,
        rooms: s.map.rooms.map((row, ry) =>
          row.map((cell, rx) =>
            rx === s.map.playerX && ry === s.map.playerY
              ? { ...cell, cleared: true }
              : cell
          )
        ),
      },
    }));
  };

  const handleContinue = () => {
    setPhase('map');
  };

  const getTreasureIcon = () => {
    if (!treasure) return <Package className="w-16 h-16" />;
    switch (treasure.type) {
      case 'gold':
        return <Coins className="w-16 h-16 text-yellow-400" />;
      case 'manaShards':
        return <Gem className="w-16 h-16 text-cyan-400" />;
      case 'rare':
        return <Sparkles className="w-16 h-16 text-amber-300" />;
    }
  };

  const getTreasureColor = () => {
    if (!treasure) return 'text-foreground';
    switch (treasure.type) {
      case 'gold':
        return 'text-yellow-400';
      case 'manaShards':
        return 'text-cyan-400';
      case 'rare':
        return 'text-amber-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="flex flex-col items-center justify-center gap-8 p-8 bg-card/90 rounded-2xl border border-border max-w-md mx-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-amber-400 mb-2">Treasure Found!</h1>
        <p className="text-muted-foreground">You discovered a hidden treasure chest</p>
      </div>

      {/* Treasure Chest */}
      <div className="relative">
        <div
          className={cn(
            'w-32 h-32 rounded-xl flex items-center justify-center transition-all duration-500',
            collected
              ? 'bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border-2 border-amber-500/50'
              : 'bg-gradient-to-br from-amber-800/50 to-yellow-700/50 border-2 border-amber-400 animate-pulse'
          )}
        >
          {getTreasureIcon()}
        </div>
        
        {/* Sparkle effect */}
        {showSparkle && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-ping">
              <Sparkles className="w-20 h-20 text-yellow-300/50" />
            </div>
          </div>
        )}
      </div>

      {/* Treasure Info */}
      {treasure && (
        <div className="text-center">
          {collected ? (
            <div className="space-y-2">
              <p className="text-lg text-muted-foreground">You received:</p>
              <p className={cn('text-4xl font-bold', getTreasureColor())}>
                +{treasure.amount} {treasure.label}
              </p>
            </div>
          ) : (
            <p className="text-lg text-muted-foreground animate-pulse">
              Click to open the treasure chest...
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        {!collected ? (
          <Button
            size="lg"
            onClick={handleCollect}
            className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-bold px-8"
          >
            <Package className="w-5 h-5 mr-2" />
            Open Chest
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handleContinue}
            className="bg-primary hover:bg-primary/90"
          >
            Continue
          </Button>
        )}
      </div>
    </div>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/lib/game/store';
import { createUnit, getClassDisplayName, getRarityColor, getRarityBorderColor } from '@/lib/game/unit-factory';
import type { Unit, UnitClass, UnitRarity } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShoppingCart, Coins, ArrowLeft, User, Check } from 'lucide-react';

interface ShopUnit {
  unit: Unit;
  price: number;
}

function generateShopUnits(seed: number): ShopUnit[] {
  const classes: UnitClass[] = ['warrior', 'ranger', 'mage', 'healer', 'rogue', 'shaman'];
  const items: ShopUnit[] = [];
  
  // Generate 4 random units
  for (let i = 0; i < 4; i++) {
    const classIndex = (seed + i * 17) % classes.length;
    const rarity = Math.min(3, Math.floor(((seed + i * 31) % 100) / 40) + 1) as UnitRarity;
    const unit = createUnit(classes[classIndex], rarity, 1);
    
    // Price based on rarity
    const basePrice = 50;
    const price = basePrice * rarity;
    
    items.push({ unit, price });
  }
  
  return items;
}

export function ShopScreen() {
  const { resources, party, addUnit, modifyResource, setPhase, seed, map } = useGameStore();
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  
  const shopUnits = useMemo(() => generateShopUnits(seed + map.playerX + map.playerY * 100), [seed, map.playerX, map.playerY]);
  
  const canBuyUnit = (price: number) => {
    return resources.gold >= price && party.length < 6;
  };
  
  const handlePurchase = (shopUnit: ShopUnit) => {
    if (!canBuyUnit(shopUnit.price)) return;
    
    modifyResource('gold', -shopUnit.price);
    addUnit(shopUnit.unit);
    setPurchasedIds(prev => new Set([...prev, shopUnit.unit.id]));
  };
  
  const handleLeave = () => {
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
    setPhase('map');
  };
  
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-yellow-400" />
            <div>
              <h2 className="text-2xl font-bold">Shop</h2>
              <p className="text-sm text-muted-foreground">Recruit new units for your party</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-lg">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="font-bold text-lg">{resources.gold}</span>
          </div>
        </div>
        
        {party.length >= 6 && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-center text-rose-400">
            Party is full! (6/6 units)
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shopUnits.map((shopUnit) => {
            const isPurchased = purchasedIds.has(shopUnit.unit.id);
            const canBuy = canBuyUnit(shopUnit.price) && !isPurchased;
            
            return (
              <div
                key={shopUnit.unit.id}
                className={cn(
                  'p-4 rounded-lg border transition-all',
                  isPurchased && 'opacity-50 bg-secondary/30',
                  !isPurchased && 'bg-card/50 hover:bg-secondary/30',
                  getRarityBorderColor(shopUnit.unit.rarity),
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-14 h-14 rounded-lg flex items-center justify-center',
                    'bg-secondary border border-border',
                  )}>
                    <User className={cn('w-7 h-7', getRarityColor(shopUnit.unit.rarity))} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('font-semibold', getRarityColor(shopUnit.unit.rarity))}>
                        {shopUnit.unit.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {'★'.repeat(shopUnit.unit.rarity)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getClassDisplayName(shopUnit.unit.class)}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      <span className="px-2 py-0.5 bg-secondary rounded">HP {shopUnit.unit.stats.maxHp}</span>
                      <span className="px-2 py-0.5 bg-secondary rounded">ATK {shopUnit.unit.stats.atk}</span>
                      <span className="px-2 py-0.5 bg-secondary rounded">SPD {shopUnit.unit.stats.spd}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Coins className="w-4 h-4" />
                    <span className="font-bold">{shopUnit.price}</span>
                  </div>
                  
                  <Button
                    onClick={() => handlePurchase(shopUnit)}
                    disabled={!canBuy}
                    variant={isPurchased ? 'secondary' : 'default'}
                    size="sm"
                    className="gap-2"
                  >
                    {isPurchased ? (
                      <>
                        <Check className="w-4 h-4" />
                        Purchased
                      </>
                    ) : (
                      'Buy'
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        
        <Button
          onClick={handleLeave}
          variant="outline"
          className="w-full gap-2"
          size="lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Leave Shop
        </Button>
      </div>
    </div>
  );
}

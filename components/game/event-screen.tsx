'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/lib/game/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HelpCircle, Coins, Heart, Zap, Star, ArrowLeft, Check } from 'lucide-react';

interface EventOption {
  text: string;
  description: string;
  effects: { type: 'gold' | 'ap' | 'manaShards' | 'heal' | 'exp'; amount: number }[];
}

interface GameEvent {
  title: string;
  description: string;
  options: EventOption[];
}

const EVENTS: GameEvent[] = [
  {
    title: "Merchant's Deal",
    description: "A wandering merchant offers you a suspicious deal. Do you trust them?",
    options: [
      {
        text: "Accept the Deal",
        description: "Trade some gold for party experience",
        effects: [
          { type: 'gold', amount: -20 },
          { type: 'exp', amount: 50 },
        ],
      },
      {
        text: "Decline Politely",
        description: "Play it safe and walk away",
        effects: [
          { type: 'gold', amount: 5 },
        ],
      },
    ],
  },
  {
    title: "Cursed Altar",
    description: "An ancient altar pulses with dark energy. It promises power at a cost.",
    options: [
      {
        text: "Embrace the Curse",
        description: "Sacrifice health for greater power",
        effects: [
          { type: 'heal', amount: -30 }, // negative heal = damage
          { type: 'exp', amount: 100 },
        ],
      },
      {
        text: "Purify the Altar",
        description: "Cleanse the corruption and heal",
        effects: [
          { type: 'heal', amount: 20 },
        ],
      },
      {
        text: "Leave it Alone",
        description: "Some things are better left undisturbed",
        effects: [],
      },
    ],
  },
  {
    title: "Thieves' Ambush",
    description: "A group of thieves blocks your path. They demand payment.",
    options: [
      {
        text: "Pay the Toll",
        description: "Hand over some gold to pass safely",
        effects: [
          { type: 'gold', amount: -30 },
        ],
      },
      {
        text: "Fight Back",
        description: "Risk injury but keep your gold",
        effects: [
          { type: 'heal', amount: -20 },
          { type: 'gold', amount: 20 },
          { type: 'exp', amount: 30 },
        ],
      },
    ],
  },
  {
    title: "Mysterious Fountain",
    description: "A glowing fountain emanates healing energy.",
    options: [
      {
        text: "Drink the Water",
        description: "Restore your party's health",
        effects: [
          { type: 'heal', amount: 25 }, // 25% heal
        ],
      },
      {
        text: "Collect the Water",
        description: "Save it for later (gain AP)",
        effects: [
          { type: 'ap', amount: 2 },
        ],
      },
    ],
  },
  {
    title: "Wandering Sage",
    description: "An old sage offers to share ancient knowledge.",
    options: [
      {
        text: "Pay for Lessons",
        description: "Spend gold to gain experience",
        effects: [
          { type: 'gold', amount: -40 },
          { type: 'exp', amount: 80 },
        ],
      },
      {
        text: "Listen for Free",
        description: "Gain a small amount of wisdom",
        effects: [
          { type: 'exp', amount: 20 },
        ],
      },
    ],
  },
  {
    title: "Mana Crystal Cave",
    description: "You discover a cave filled with glowing mana crystals.",
    options: [
      {
        text: "Mine the Crystals",
        description: "Gather mana shards",
        effects: [
          { type: 'manaShards', amount: 10 },
        ],
      },
      {
        text: "Absorb the Energy",
        description: "Gain experience from the raw mana",
        effects: [
          { type: 'exp', amount: 60 },
        ],
      },
    ],
  },
];

function getEventIcon(type: string) {
  switch (type) {
    case 'gold': return <Coins className="w-4 h-4 text-yellow-400" />;
    case 'heal': return <Heart className="w-4 h-4 text-rose-400" />;
    case 'ap': return <Zap className="w-4 h-4 text-cyan-400" />;
    case 'exp': return <Star className="w-4 h-4 text-purple-400" />;
    case 'manaShards': return <Star className="w-4 h-4 text-blue-400" />;
    default: return null;
  }
}

function getEffectLabel(type: string, amount: number) {
  switch (type) {
    case 'heal':
      return amount > 0 ? `+${amount}% HP` : `${amount}% HP`;
    case 'exp':
      return `${amount > 0 ? '+' : ''}${amount} EXP`;
    default:
      return `${amount > 0 ? '+' : ''}${amount} ${type.toUpperCase()}`;
  }
}

export function EventScreen() {
  const { modifyResource, healAllUnits, distributeExp, setPhase, seed, map, party } = useGameStore();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  const event = useMemo(() => {
    const eventIndex = (seed + map.playerX * 7 + map.playerY * 11) % EVENTS.length;
    return EVENTS[eventIndex];
  }, [seed, map.playerX, map.playerY]);
  
  const handleChoice = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };
  
  const handleLeave = () => {
    if (selectedOption === null) return;
    
    // Apply effects right as we leave
    const option = event.options[selectedOption];
    option.effects.forEach(effect => {
      if (effect.type === 'heal') {
        healAllUnits(effect.amount / 100);
      } else if (effect.type === 'exp') {
        distributeExp(effect.amount);
      } else {
        modifyResource(effect.type, effect.amount);
      }
    });
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
      <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full space-y-6">
        <div className="text-center">
          <HelpCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">{event.title}</h2>
          <p className="text-muted-foreground mt-2">
            {event.description}
          </p>
        </div>
        
        <div className="space-y-3">
          {event.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleChoice(index)}
              className={cn(
                'w-full p-4 rounded-lg border text-left transition-all',
                selectedOption === index && 'bg-primary/20 border-primary',
                selectedOption !== null && selectedOption !== index && 'opacity-60',
                'hover:bg-secondary/50 hover:border-primary/50',
                'bg-secondary/30 border-border',
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{option.text}</span>
                {selectedOption === index && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
              
              {option.effects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {option.effects.map((effect, effectIndex) => (
                    <div
                      key={effectIndex}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded text-xs',
                        effect.amount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400',
                      )}
                    >
                      {getEventIcon(effect.type)}
                      <span>{getEffectLabel(effect.type, effect.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
        
        
        {selectedOption !== null && (
          <Button
            onClick={handleLeave}
            className="w-full gap-2"
            size="lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}

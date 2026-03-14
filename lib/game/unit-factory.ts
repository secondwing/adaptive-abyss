import type { Unit, UnitClass, UnitRarity, UnitStats } from './types';

const CLASS_BASE_STATS: Record<UnitClass, UnitStats> = {
  warrior: {
    hp: 150,
    maxHp: 150,
    atk: 25,
    def: 20,
    mgk: 5,
    res: 10,
    spd: 8,
    crit: 10,
    critDmg: 150,
  },
  ranger: {
    hp: 100,
    maxHp: 100,
    atk: 30,
    def: 10,
    mgk: 5,
    res: 8,
    spd: 15,
    crit: 20,
    critDmg: 180,
  },
  mage: {
    hp: 80,
    maxHp: 80,
    atk: 5,
    def: 5,
    mgk: 35,
    res: 15,
    spd: 10,
    crit: 15,
    critDmg: 160,
  },
  healer: {
    hp: 90,
    maxHp: 90,
    atk: 5,
    def: 8,
    mgk: 25,
    res: 20,
    spd: 12,
    crit: 5,
    critDmg: 120,
  },
  rogue: {
    hp: 85,
    maxHp: 85,
    atk: 28,
    def: 8,
    mgk: 5,
    res: 8,
    spd: 18,
    crit: 30,
    critDmg: 200,
  },
  shaman: {
    hp: 95,
    maxHp: 95,
    atk: 10,
    def: 10,
    mgk: 20,
    res: 18,
    spd: 11,
    crit: 10,
    critDmg: 140,
  },
};

const CLASS_NAMES: Record<UnitClass, string[]> = {
  warrior: ['Gorath', 'Brynn', 'Kael', 'Thorne', 'Aldric'],
  ranger: ['Sylva', 'Finn', 'Elara', 'Robin', 'Vex'],
  mage: ['Zephyr', 'Morgana', 'Aether', 'Lyra', 'Nyx'],
  healer: ['Luna', 'Celeste', 'Aria', 'Sera', 'Hope'],
  rogue: ['Shadow', 'Viper', 'Whisper', 'Blade', 'Phantom'],
  shaman: ['Draven', 'Wren', 'Ember', 'Storm', 'Rune'],
};

const CLASS_DISPLAY_NAMES: Record<UnitClass, string> = {
  warrior: '전사',
  ranger: '궁수',
  mage: '마법사',
  healer: '힐러',
  rogue: '도적',
  shaman: '주술사',
};

export function getClassDisplayName(unitClass: UnitClass): string {
  return CLASS_DISPLAY_NAMES[unitClass];
}

function applyRarityMultiplier(stats: UnitStats, rarity: UnitRarity): UnitStats {
  const multiplier = 1 + (rarity - 1) * 0.15;
  return {
    hp: Math.floor(stats.hp * multiplier),
    maxHp: Math.floor(stats.maxHp * multiplier),
    atk: Math.floor(stats.atk * multiplier),
    def: Math.floor(stats.def * multiplier),
    mgk: Math.floor(stats.mgk * multiplier),
    res: Math.floor(stats.res * multiplier),
    spd: Math.floor(stats.spd * multiplier),
    crit: Math.min(100, Math.floor(stats.crit * multiplier)),
    critDmg: Math.floor(stats.critDmg * multiplier),
  };
}

let unitIdCounter = 0;

export function createUnit(
  unitClass: UnitClass,
  rarity: UnitRarity = 1,
  level: number = 1
): Unit {
  const baseStats = CLASS_BASE_STATS[unitClass];
  const names = CLASS_NAMES[unitClass];
  const name = names[Math.floor(Math.random() * names.length)];
  
  const stats = applyRarityMultiplier(baseStats, rarity);
  
  // Apply level scaling
  const levelMultiplier = 1 + (level - 1) * 0.1;
  const scaledStats: UnitStats = {
    hp: Math.floor(stats.hp * levelMultiplier),
    maxHp: Math.floor(stats.maxHp * levelMultiplier),
    atk: Math.floor(stats.atk * levelMultiplier),
    def: Math.floor(stats.def * levelMultiplier),
    mgk: Math.floor(stats.mgk * levelMultiplier),
    res: Math.floor(stats.res * levelMultiplier),
    spd: Math.floor(stats.spd * levelMultiplier),
    crit: stats.crit,
    critDmg: stats.critDmg,
  };
  
  return {
    id: `unit-${++unitIdCounter}`,
    name,
    class: unitClass,
    rarity,
    level,
    exp: 0,
    stats: scaledStats,
    position: unitClass === 'warrior' || unitClass === 'rogue' ? 'front' : 'back',
  };
}

export function createInitialParty(): Unit[] {
  return [
    createUnit('warrior', 1, 1),
    createUnit('ranger', 1, 1),
    createUnit('healer', 1, 1),
  ];
}

export function getRarityColor(rarity: UnitRarity): string {
  const colors: Record<UnitRarity, string> = {
    1: 'text-zinc-400',
    2: 'text-emerald-400',
    3: 'text-blue-400',
    4: 'text-purple-400',
    5: 'text-amber-400',
  };
  return colors[rarity];
}

export function getRarityBgColor(rarity: UnitRarity): string {
  const colors: Record<UnitRarity, string> = {
    1: 'bg-zinc-400/20',
    2: 'bg-emerald-400/20',
    3: 'bg-blue-400/20',
    4: 'bg-purple-400/20',
    5: 'bg-amber-400/20',
  };
  return colors[rarity];
}

export function getRarityBorderColor(rarity: UnitRarity): string {
  const colors: Record<UnitRarity, string> = {
    1: 'border-zinc-500/50',
    2: 'border-emerald-500/50',
    3: 'border-blue-500/50',
    4: 'border-purple-500/50',
    5: 'border-amber-500/50',
  };
  return colors[rarity];
}

// Level up a unit's stats (increases all stats by 10%)
export function levelUpUnit(stats: UnitStats): UnitStats {
  return {
    hp: stats.hp, // HP is kept same (healed separately if needed)
    maxHp: Math.floor(stats.maxHp * 1.1),
    atk: Math.floor(stats.atk * 1.1),
    def: Math.floor(stats.def * 1.1),
    mgk: Math.floor(stats.mgk * 1.1),
    res: Math.floor(stats.res * 1.1),
    spd: Math.floor(stats.spd * 1.05), // SPD scales slower
    crit: Math.min(100, stats.crit + 1),
    critDmg: Math.floor(stats.critDmg * 1.02),
  };
}

import type { Enemy, RoomType, UnitClass, UnitStats } from './types';

interface EnemyTemplate {
  name: string;
  class: UnitClass;
  baseStats: UnitStats;
  goldReward: number;
  expReward: number;
}

const ENEMY_TEMPLATES: EnemyTemplate[] = [
  {
    name: '고블린',
    class: 'rogue',
    baseStats: {
      hp: 50, maxHp: 50, atk: 12, def: 5, mgk: 2, res: 3, spd: 10, crit: 15, critDmg: 150,
    },
    goldReward: 10,
    expReward: 15,
  },
  {
    name: '스켈레톤',
    class: 'warrior',
    baseStats: {
      hp: 70, maxHp: 70, atk: 15, def: 10, mgk: 0, res: 5, spd: 6, crit: 5, critDmg: 130,
    },
    goldReward: 12,
    expReward: 18,
  },
  {
    name: '오크',
    class: 'warrior',
    baseStats: {
      hp: 100, maxHp: 100, atk: 20, def: 12, mgk: 0, res: 6, spd: 5, crit: 8, critDmg: 140,
    },
    goldReward: 18,
    expReward: 25,
  },
  {
    name: '다크 메이지',
    class: 'mage',
    baseStats: {
      hp: 40, maxHp: 40, atk: 5, def: 3, mgk: 25, res: 12, spd: 8, crit: 12, critDmg: 160,
    },
    goldReward: 15,
    expReward: 22,
  },
  {
    name: '좀비',
    class: 'warrior',
    baseStats: {
      hp: 80, maxHp: 80, atk: 18, def: 8, mgk: 0, res: 4, spd: 3, crit: 5, critDmg: 120,
    },
    goldReward: 10,
    expReward: 15,
  },
];

const ELITE_TEMPLATES: EnemyTemplate[] = [
  {
    name: '오크 족장',
    class: 'warrior',
    baseStats: {
      hp: 200, maxHp: 200, atk: 35, def: 20, mgk: 5, res: 10, spd: 7, crit: 12, critDmg: 160,
    },
    goldReward: 50,
    expReward: 60,
  },
  {
    name: '다크 위자드',
    class: 'mage',
    baseStats: {
      hp: 120, maxHp: 120, atk: 8, def: 8, mgk: 45, res: 25, spd: 10, crit: 18, critDmg: 180,
    },
    goldReward: 55,
    expReward: 65,
  },
  {
    name: '뱀파이어',
    class: 'rogue',
    baseStats: {
      hp: 150, maxHp: 150, atk: 32, def: 12, mgk: 15, res: 15, spd: 14, crit: 25, critDmg: 200,
    },
    goldReward: 60,
    expReward: 70,
  },
];

const BOSS_TEMPLATES: EnemyTemplate[] = [
  {
    name: '던전 로드',
    class: 'warrior',
    baseStats: {
      hp: 500, maxHp: 500, atk: 50, def: 30, mgk: 20, res: 25, spd: 8, crit: 15, critDmg: 180,
    },
    goldReward: 200,
    expReward: 300,
  },
  {
    name: '리치',
    class: 'mage',
    baseStats: {
      hp: 350, maxHp: 350, atk: 15, def: 15, mgk: 65, res: 40, spd: 12, crit: 20, critDmg: 200,
    },
    goldReward: 220,
    expReward: 320,
  },
];

let enemyIdCounter = 1000;

function createEnemyFromTemplate(template: EnemyTemplate, chapter: number, dangerLevel: number = 0): Enemy {
  // Base scale by chapter
  const levelMultiplier = 1 + (chapter - 1) * 0.3;
  
  // Danger scale by dangerLevel (e.g. 5% stat increase per danger level)
  const dangerMultiplier = 1 + (dangerLevel * 0.05);
  
  const finalMultiplier = levelMultiplier * dangerMultiplier;
  
  const scaledStats: UnitStats = {
    hp: Math.floor(template.baseStats.hp * finalMultiplier),
    maxHp: Math.floor(template.baseStats.maxHp * finalMultiplier),
    atk: Math.floor(template.baseStats.atk * finalMultiplier),
    def: Math.floor(template.baseStats.def * finalMultiplier),
    mgk: Math.floor(template.baseStats.mgk * finalMultiplier),
    res: Math.floor(template.baseStats.res * finalMultiplier),
    spd: Math.floor(template.baseStats.spd * finalMultiplier),
    crit: template.baseStats.crit,
    critDmg: template.baseStats.critDmg,
  };
  
  return {
    id: `enemy-${++enemyIdCounter}`,
    name: template.name,
    class: template.class,
    rarity: 1,
    level: chapter,
    exp: 0,
    stats: scaledStats,
    position: template.class === 'warrior' || template.class === 'rogue' ? 'front' : 'back',
    isEnemy: true,
    goldReward: Math.floor(template.goldReward * finalMultiplier),
    expReward: Math.floor(template.expReward * finalMultiplier),
  };
}

export function generateBattleEnemies(roomType: RoomType, chapter: number, dangerLevel: number = 0): Enemy[] {
  const enemies: Enemy[] = [];
  
  // Create all 25 possible grid positions for enemies
  const availableSpots: { x: number; y: number }[] = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      availableSpots.push({ x, y });
    }
  }
  
  // Shuffle available spots to get random distinct positions
  for (let i = availableSpots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableSpots[i], availableSpots[j]] = [availableSpots[j], availableSpots[i]];
  }
  
  const addEnemy = (template: EnemyTemplate) => {
    const enemy = createEnemyFromTemplate(template, chapter, dangerLevel);
    const spot = availableSpots.pop() || { x: 4, y: 2 }; // Fallback
    enemy.boardX = spot.x;
    enemy.boardY = spot.y;
    enemies.push(enemy);
  };
  
  switch (roomType) {
    case 'battle': {
      const count = Math.floor(Math.random() * 2) + 2; // 2-3 enemies
      for (let i = 0; i < count; i++) {
        const template = ENEMY_TEMPLATES[Math.floor(Math.random() * ENEMY_TEMPLATES.length)];
        addEnemy(template);
      }
      break;
    }
    case 'elite': {
      // 1 elite + 1-2 normal
      const eliteTemplate = ELITE_TEMPLATES[Math.floor(Math.random() * ELITE_TEMPLATES.length)];
      addEnemy(eliteTemplate);
      
      const minionCount = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < minionCount; i++) {
        const template = ENEMY_TEMPLATES[Math.floor(Math.random() * ENEMY_TEMPLATES.length)];
        addEnemy(template);
      }
      break;
    }
    case 'boss': {
      const bossTemplate = BOSS_TEMPLATES[Math.floor(Math.random() * BOSS_TEMPLATES.length)];
      addEnemy(bossTemplate);
      
      // Add 2 minions
      for (let i = 0; i < 2; i++) {
        const template = ENEMY_TEMPLATES[Math.floor(Math.random() * ENEMY_TEMPLATES.length)];
        addEnemy(template);
      }
      break;
    }
  }
  
  return enemies;
}

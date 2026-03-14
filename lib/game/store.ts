import { create } from 'zustand';
import type { GameState, GamePhase, Unit, Room, BattleState, Item, Enemy, EXP_PER_LEVEL } from './types';
import { generateMap, getAdjacentRooms } from './map-generator';
import { createInitialParty, levelUpUnit } from './unit-factory';
import { generateBattleEnemies } from './enemy-factory';

const EXP_REQUIRED_PER_LEVEL = 100;

interface GameStore extends GameState {
  // Actions
  startNewGame: () => void;
  setPhase: (phase: GamePhase) => void;
  movePlayer: (x: number, y: number) => void;
  endTurn: () => void;
  
  // Battle actions
  startBattle: (enemies: Enemy[]) => void;
  processBattleRound: () => void;
  endBattle: (victory: boolean) => void;
  
  // Resource actions
  modifyResource: (resource: keyof GameState['resources'], amount: number) => void;
  
  // Party actions
  addUnit: (unit: Unit) => void;
  removeUnit: (unitId: string) => void;
  healUnit: (unitId: string, amount: number) => void;
  healAllUnits: (percentage: number) => void;
  addExpToUnit: (unitId: string, amount: number) => void;
  distributeExp: (totalExp: number) => void;
  
  // Inventory actions
  addItem: (item: Item) => void;
  removeItem: (itemId: string) => void;
  
  // Utility
  getAdjacentRooms: () => Room[];
  canMove: (x: number, y: number) => boolean;
  getPartyHpInfo: () => { current: number; max: number };
}

const createInitialState = (): Omit<GameState, 'seed'> & { seed: number } => {
  const seed = Date.now();
  const map = generateMap(7, 7, seed, 1);
  
  return {
    phase: 'menu',
    turn: 1,
    seed,
    resources: {
      gold: 100,
      ap: 3,
      maxAp: 3,
      manaShards: 0,
    },
    party: createInitialParty(),
    inventory: [],
    relics: [],
    map,
    battle: null,
  };
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  startNewGame: () => {
    const seed = Date.now();
    const map = generateMap(7, 7, seed, 1);
    set({
      ...createInitialState(),
      seed,
      map,
      phase: 'map',
    });
  },

  setPhase: (phase) => set({ phase }),

  movePlayer: (x, y) => {
    const state = get();
    if (!state.canMove(x, y)) return;
    
    const room = state.map.rooms[y][x];
    const apCost = room.visited ? 0 : 1;
    
    if (state.resources.ap < apCost) return;
    
    set((s) => ({
      map: {
        ...s.map,
        playerX: x,
        playerY: y,
        rooms: s.map.rooms.map((row, ry) =>
          row.map((cell, rx) =>
            rx === x && ry === y ? { ...cell, visited: true } : cell
          )
        ),
      },
      resources: {
        ...s.resources,
        ap: s.resources.ap - apCost,
      },
    }));
    
    // Handle room entry
    const updatedRoom = get().map.rooms[y][x];
    if (!updatedRoom.cleared) {
      switch (updatedRoom.type) {
        case 'battle':
        case 'elite':
        case 'boss':
          const enemies = generateBattleEnemies(updatedRoom.type, state.map.chapter);
          get().startBattle(enemies);
          break;
        case 'shop':
          set({ phase: 'shop' });
          break;
        case 'rest':
          set({ phase: 'rest' });
          break;
        case 'event':
          set({ phase: 'event' });
          break;
        case 'treasure':
          // Show treasure screen (reward given there)
          set({ phase: 'treasure' });
          break;
      }
    }
  },

  endTurn: () => {
    set((state) => ({
      turn: state.turn + 1,
      resources: {
        ...state.resources,
        ap: state.resources.maxAp,
        gold: state.resources.gold + 5, // Turn income
      },
    }));
  },

  startBattle: (enemies) => {
    const state = get();
    const allUnits = [...state.party, ...enemies];
    const turnOrder = allUnits
      .sort((a, b) => b.stats.spd - a.stats.spd)
      .map((u) => u.id);
    
    const battleState: BattleState = {
      phase: 'placement',
      result: 'ongoing',
      round: 1,
      allies: state.party.map((u) => ({ ...u, stats: { ...u.stats } })),
      enemies: enemies.map((e) => ({ ...e, stats: { ...e.stats } })),
      logs: [],
      turnOrder,
      currentTurnIndex: 0,
    };
    
    set({ battle: battleState, phase: 'battle' });
  },

  processBattleRound: () => {
    set((state) => {
      if (!state.battle || state.battle.result !== 'ongoing') return state;
      
      const battle = { ...state.battle };
      const actions: import('./types').BattleAction[] = [];
      
      // Process each unit's turn
      for (const unitId of battle.turnOrder) {
        const ally = battle.allies.find((u) => u.id === unitId);
        const enemy = battle.enemies.find((u) => u.id === unitId);
        const actor = ally || enemy;
        
        if (!actor || actor.stats.hp <= 0) continue;
        
        // Determine target
        const isAlly = !!ally;
        const targets = isAlly 
          ? battle.enemies.filter((e) => e.stats.hp > 0)
          : battle.allies.filter((a) => a.stats.hp > 0);
        
        if (targets.length === 0) continue;
        
        const target = targets[Math.floor(Math.random() * targets.length)];
        
        // Calculate damage
        const isPhysical = actor.class !== 'mage' && actor.class !== 'shaman';
        const attackStat = isPhysical ? actor.stats.atk : actor.stats.mgk;
        const defenseStat = isPhysical ? target.stats.def : target.stats.res;
        
        const isCrit = Math.random() * 100 < actor.stats.crit;
        const critMultiplier = isCrit ? actor.stats.critDmg / 100 : 1;
        const baseDamage = Math.max(1, attackStat - defenseStat * 0.5);
        const damage = Math.floor(baseDamage * critMultiplier);
        
        // Apply damage
        if (isAlly) {
          const targetIndex = battle.enemies.findIndex((e) => e.id === target.id);
          battle.enemies[targetIndex].stats.hp -= damage;
        } else {
          const targetIndex = battle.allies.findIndex((a) => a.id === target.id);
          battle.allies[targetIndex].stats.hp -= damage;
        }
        
        actions.push({
          actorId: actor.id,
          targetId: target.id,
          type: 'attack',
          damage,
          isCrit,
        });
        
        // Healer special action
        if (actor.class === 'healer' && isAlly) {
          const woundedAlly = battle.allies
            .filter((a) => a.stats.hp > 0 && a.stats.hp < a.stats.maxHp)
            .sort((a, b) => a.stats.hp / a.stats.maxHp - b.stats.hp / b.stats.maxHp)[0];
          
          if (woundedAlly) {
            const healing = Math.floor(actor.stats.mgk * 0.5);
            const targetIndex = battle.allies.findIndex((a) => a.id === woundedAlly.id);
            battle.allies[targetIndex].stats.hp = Math.min(
              battle.allies[targetIndex].stats.maxHp,
              battle.allies[targetIndex].stats.hp + healing
            );
            actions.push({
              actorId: actor.id,
              targetId: woundedAlly.id,
              type: 'heal',
              healing,
            });
          }
        }
      }
      
      battle.logs.push({ round: battle.round, actions });
      battle.round += 1;
      
      // Check battle result
      const alliesAlive = battle.allies.some((a) => a.stats.hp > 0);
      const enemiesAlive = battle.enemies.some((e) => e.stats.hp > 0);
      
      if (!enemiesAlive) {
        battle.result = 'victory';
        battle.phase = 'result';
      } else if (!alliesAlive) {
        battle.result = 'defeat';
        battle.phase = 'result';
      }
      
      return { battle };
    });
  },

  endBattle: (victory) => {
    const state = get();
    if (!state.battle) return;
    
    if (victory) {
      // Calculate rewards
      const totalGold = state.battle.enemies.reduce((sum, e) => sum + e.goldReward, 0);
      const totalExp = state.battle.enemies.reduce((sum, e) => sum + e.expReward, 0);
      
      // Sync battle HP back to party and apply rewards
      const updatedParty = state.party.map((unit) => {
        const battleUnit = state.battle?.allies.find((a) => a.id === unit.id);
        if (!battleUnit) return unit;
        
        // Each surviving unit gets equal share of EXP
        const aliveUnits = state.battle!.allies.filter(a => a.stats.hp > 0).length;
        const expPerUnit = aliveUnits > 0 ? Math.floor(totalExp / aliveUnits) : 0;
        const isAlive = battleUnit.stats.hp > 0;
        
        let newExp = unit.exp + (isAlive ? expPerUnit : 0);
        let newLevel = unit.level;
        let newStats = { ...unit.stats, hp: Math.max(0, battleUnit.stats.hp) };
        
        // Level up while enough exp
        while (newExp >= EXP_REQUIRED_PER_LEVEL) {
          newExp -= EXP_REQUIRED_PER_LEVEL;
          newLevel += 1;
          newStats = levelUpUnit(newStats);
        }
        
        return {
          ...unit,
          stats: newStats,
          level: newLevel,
          exp: newExp,
        };
      });
      
      set((s) => ({
        phase: 'map',
        battle: null,
        resources: {
          ...s.resources,
          gold: s.resources.gold + totalGold,
        },
        party: updatedParty,
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
    } else {
      set({ phase: 'gameOver', battle: null });
    }
  },

  modifyResource: (resource, amount) => {
    set((state) => ({
      resources: {
        ...state.resources,
        [resource]: Math.max(0, (state.resources[resource] as number) + amount),
      },
    }));
  },

  addUnit: (unit) => {
    set((state) => ({
      party: [...state.party, unit],
    }));
  },

  removeUnit: (unitId) => {
    set((state) => ({
      party: state.party.filter((u) => u.id !== unitId),
    }));
  },

  healUnit: (unitId, amount) => {
    set((state) => ({
      party: state.party.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              stats: {
                ...unit.stats,
                hp: Math.min(unit.stats.maxHp, unit.stats.hp + amount),
              },
            }
          : unit
      ),
    }));
  },

  healAllUnits: (percentage) => {
    set((state) => ({
      party: state.party.map((unit) => ({
        ...unit,
        stats: {
          ...unit.stats,
          hp: Math.min(
            unit.stats.maxHp,
            unit.stats.hp + Math.floor(unit.stats.maxHp * percentage)
          ),
        },
      })),
    }));
  },

  addExpToUnit: (unitId, amount) => {
    set((state) => ({
      party: state.party.map((unit) => {
        if (unit.id !== unitId) return unit;
        
        let newExp = unit.exp + amount;
        let newLevel = unit.level;
        let newStats = { ...unit.stats };
        
        while (newExp >= EXP_REQUIRED_PER_LEVEL) {
          newExp -= EXP_REQUIRED_PER_LEVEL;
          newLevel += 1;
          newStats = levelUpUnit(newStats);
        }
        
        return {
          ...unit,
          exp: newExp,
          level: newLevel,
          stats: newStats,
        };
      }),
    }));
  },

  distributeExp: (totalExp) => {
    const state = get();
    const aliveUnits = state.party.filter((u) => u.stats.hp > 0);
    if (aliveUnits.length === 0) return;
    
    const expPerUnit = Math.floor(totalExp / aliveUnits.length);
    
    aliveUnits.forEach((unit) => {
      get().addExpToUnit(unit.id, expPerUnit);
    });
  },

  addItem: (item) => {
    set((state) => ({
      inventory: [...state.inventory, item],
    }));
  },

  removeItem: (itemId) => {
    set((state) => ({
      inventory: state.inventory.filter((i) => i.id !== itemId),
    }));
  },

  getAdjacentRooms: () => {
    const state = get();
    return getAdjacentRooms(state.map, state.map.playerX, state.map.playerY);
  },

  canMove: (x, y) => {
    const state = get();
    const adjacent = getAdjacentRooms(state.map, state.map.playerX, state.map.playerY);
    const room = state.map.rooms[y]?.[x];
    if (!room) return false;
    
    const isAdjacent = adjacent.some((r) => r.x === x && r.y === y);
    const apCost = room.visited ? 0 : 1;
    
    return isAdjacent && state.resources.ap >= apCost;
  },

  getPartyHpInfo: () => {
    const state = get();
    const current = state.party.reduce((sum, u) => sum + u.stats.hp, 0);
    const max = state.party.reduce((sum, u) => sum + u.stats.maxHp, 0);
    return { current, max };
  },
}));

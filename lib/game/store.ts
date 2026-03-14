import { create } from 'zustand';
import type { GameState, GamePhase, Unit, Room, BattleState, Item, Enemy, EXP_PER_LEVEL } from './types';
import { generateMap, getAdjacentRooms } from './map-generator';
import { createInitialParty, levelUpUnit, createUnit } from './unit-factory';
import { generateBattleEnemies } from './enemy-factory';

const EXP_REQUIRED_PER_LEVEL = 100;

interface GameStore extends GameState {
  // Actions
  startNewGame: () => void;
  setPhase: (phase: GamePhase) => void;
  movePlayer: (x: number, y: number) => void;
  endTurn: () => void;
  advanceTime: (turns: number) => void;
  
  // Battle actions
  startBattle: (enemies: Enemy[]) => void;
  processBattleRound: () => void;
  endBattle: (victory: boolean) => void;
  setBattleSpeed: (speed: 1 | 2 | 4) => void;
  
  // Resource actions
  modifyResource: (resource: keyof GameState['resources'], amount: number) => void;
  
  // Party actions
  addUnit: (unit: Unit) => void;
  removeUnit: (unitId: string) => void;
  moveUnit: (unitId: string, direction: 'up' | 'down') => void;
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
    battleSpeed: 1,
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
  
  setBattleSpeed: (speed) => set({ battleSpeed: speed }),

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
          const enemies = generateBattleEnemies(updatedRoom.type, state.map.chapter, updatedRoom.dangerLevel);
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
    const state = get();
    // End turn gives a small time penalty (1 turn) + resets AP
    get().advanceTime(1);
    
    set((s) => ({
      resources: {
        ...s.resources,
        ap: s.resources.maxAp,
        gold: s.resources.gold + 5, // Turn income
      },
    }));
  },

  advanceTime: (turns) => {
    set((state) => {
      const newTurn = state.turn + turns;
      
      // Process Dungeon Ecosystem (Adaptive Abyss)
      const newRooms = state.map.rooms.map((row) =>
        row.map((room) => {
          // If room is already cleared, or it's the start, skip major danger updates for now, 
          // or let it respawn later.
          // For now, let's say rooms that are NOT visited yet will slowly grow more dangerous.
          // Rooms that are cleared might slowly accumulate resources or eventually respawn enemies.
          
          let newDanger = room.dangerLevel;
          let newResource = room.resourceValue;
          
          const turnsPassedSinceUpdate = newTurn - room.lastUpdateTurn;
          
          if (turnsPassedSinceUpdate > 0) {
            if (!room.visited && !room.cleared) {
              // Unvisited rooms get more dangerous over time
              // Increase danger by 1 per turn, up to a cap (e.g., 10 * chapter)
              const maxDanger = 10 * state.map.chapter;
              newDanger = Math.min(maxDanger, newDanger + turnsPassedSinceUpdate);
              
              // Depending on type, it might accumulate resources
              if (room.type === 'treasure' || room.type === 'event') {
                newResource += turnsPassedSinceUpdate * 2;
              } else if (room.type === 'battle' || room.type === 'elite') {
                // Enemies hoard some gold/resources over time
                newResource += turnsPassedSinceUpdate;
              }
            } else if (room.cleared) {
              // Cleared rooms might slowly grow new dangers (respawn mechanic)
              // This is a slow process
              if (room.type !== 'start' && room.type !== 'shop' && room.type !== 'rest') {
                newDanger += turnsPassedSinceUpdate * 0.2; // 5 turns = 1 danger
                // If danger reaches a threshold, it could respawn. For now, just accumulate.
                // Later: if newDanger > 10, room.cleared = false, room.type = 'battle', newDanger = 0
              }
            }
          }

          return {
            ...room,
            dangerLevel: newDanger,
            resourceValue: newResource,
            lastUpdateTurn: newTurn,
          };
        })
      );

      return {
        turn: newTurn,
        map: {
          ...state.map,
          rooms: newRooms,
        },
      };
    });
  },

  startBattle: (enemies) => {
    const state = get();
    
    // Assign missing board positions to party members
    const occupied = new Set<string>();
    state.party.forEach(u => {
      if (u.boardX !== undefined && u.boardY !== undefined) {
        occupied.add(`${u.boardX},${u.boardY}`);
      }
    });
    
    const updatedParty = state.party.map((u) => {
      if (u.boardX !== undefined && u.boardY !== undefined) return u;
      
      let bx = 0, by = 0;
      outer: for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const key = `${x},${y}`;
          if (!occupied.has(key)) {
            bx = x;
            by = y;
            occupied.add(key);
            break outer;
          }
        }
      }
      return { ...u, boardX: bx, boardY: by };
    });

    const allUnits = [...updatedParty, ...enemies];
    const turnOrder = allUnits
      .sort((a, b) => b.stats.spd - a.stats.spd)
      .map((u) => u.id);
    
    const battleState: BattleState = {
      phase: 'placement', // Start in placement!
      result: 'ongoing',
      round: 1,
      allies: updatedParty.map((u) => ({ ...u, stats: { ...u.stats } })),
      enemies: enemies.map((e) => ({ ...e, stats: { ...e.stats } })),
      logs: [],
      turnOrder,
      currentTurnIndex: 0,
    };
    
    set({ battle: battleState, phase: 'battle', party: updatedParty });
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
        
        // Calculate Distance based on Grid. Let's assume X=4 is the front line for both sides.
        // So distance = (4 - actorX) + (4 - targetX) + |actorY - targetY|
        const getDistance = (u1: Unit | Enemy, u2: Unit | Enemy) => {
          const xDistance = (4 - (u1.boardX || 0)) + (4 - (u2.boardX || 0)) + 1;
          const yDistance = Math.abs((u1.boardY || 0) - (u2.boardY || 0));
          return xDistance + Math.abs(yDistance) * 1.5; // Weigh row offset to prioritize straight lines
        };
        
        let target = targets[0];
        let minDistance = Infinity;
        
        targets.forEach(t => {
          const d = getDistance(actor, t);
          if (d < minDistance) {
            minDistance = d;
            target = t;
          }
        });
        
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
    
    // Get current room to factor in environmental rewards
    const currentRoom = state.map.rooms[state.map.playerY][state.map.playerX];
    
    if (victory) {
      // Calculate rewards including room's accumulated resources/gold
      const totalGold = state.battle.enemies.reduce((sum, e) => sum + e.goldReward, 0) + currentRoom.resourceValue;
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
      
      set((s) => {
        // Handle Boss Defeat (Chapter Progression)
        let nextMap = { ...s.map };
        if (currentRoom.type === 'boss') {
          // Generate new harder map for next chapter
          const nextChapter = s.map.chapter + 1;
          nextMap = generateMap(7, 7, Date.now(), nextChapter);
        } else {
          // Mark room as cleared
          nextMap.rooms = s.map.rooms.map((row, ry) =>
            row.map((cell, rx) =>
              rx === s.map.playerX && ry === s.map.playerY
                ? { ...cell, cleared: true }
                : cell
            )
          );
        }
      
        return {
          phase: 'map',
          battle: null,
          resources: {
            ...s.resources,
            gold: s.resources.gold + totalGold,
            ap: currentRoom.type === 'boss' ? s.resources.maxAp : s.resources.ap // refill AP on chapter clear
          },
          party: updatedParty,
          map: nextMap,
        };
      });
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
    set((state) => {
      let currentParty = [...state.party];
      let currentUnit = { ...unit };
      
      while (true) {
        // Find existing unit with same class and rarity
        const matchIndex = currentParty.findIndex(
          u => u.class === currentUnit.class && u.rarity === currentUnit.rarity
        );
        
        if (matchIndex === -1) {
          // No match, we can securely push it (if there's room)
          if (currentParty.length >= 9) return state; 
          currentParty.push(currentUnit);
          return { party: currentParty };
        }
        
        // Match found! Let's merge them
        const match = currentParty[matchIndex];
        currentParty.splice(matchIndex, 1);
        
        // Calculate total raw EXP from both units
        const rawExp1 = (currentUnit.level - 1) * 100 + currentUnit.exp;
        const rawExp2 = (match.level - 1) * 100 + match.exp;
        const totalRawExp = rawExp1 + rawExp2;
        
        const newLevel = Math.floor(totalRawExp / 100) + 1;
        const newExp = totalRawExp % 100;
        
        const newRarity = currentUnit.rarity + 1;
        
        // Re-create the unit with higher rarity to pull exponential stats
        // Keep the existing party member's name for consistency
        const mergedUnit = createUnit(currentUnit.class, newRarity, newLevel, match.name);
        mergedUnit.exp = newExp; // Set the perfectly combined leftover EXP
        
        currentUnit = mergedUnit; // repeat loop to see if we can merge again
      }
    });
  },

  removeUnit: (unitId) => {
    set((state) => ({
      party: state.party.filter((u) => u.id !== unitId),
    }));
  },

  moveUnit: (unitId, direction) => {
    set((state) => {
      const index = state.party.findIndex(u => u.id === unitId);
      if (index === -1) return state;
      if (direction === 'up' && index === 0) return state;
      if (direction === 'down' && index === state.party.length - 1) return state;

      const newParty = [...state.party];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Swap properties
      [newParty[index], newParty[targetIndex]] = [newParty[targetIndex], newParty[index]];
      
      return { party: newParty };
    });
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

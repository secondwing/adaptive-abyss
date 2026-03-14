// ===== Room Types =====
export type RoomType = 
  | 'battle'
  | 'elite'
  | 'boss'
  | 'shop'
  | 'rest'
  | 'event'
  | 'treasure'
  | 'empty'
  | 'start';

export interface Room {
  id: string;
  x: number;
  y: number;
  type: RoomType;
  visited: boolean;
  cleared: boolean;
  enemies?: Enemy[];
  rewards?: Reward;
  dangerLevel: number;
  resourceValue: number;
  lastUpdateTurn: number;
}

// ===== Unit Types =====
export type UnitClass = 'warrior' | 'ranger' | 'mage' | 'healer' | 'rogue' | 'shaman';
export type UnitRarity = 1 | 2 | 3 | 4 | 5;

export interface UnitStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  mgk: number;
  res: number;
  spd: number;
  crit: number;
  critDmg: number;
}

export interface Unit {
  id: string;
  name: string;
  class: UnitClass;
  rarity: UnitRarity;
  level: number;
  exp: number;
  stats: UnitStats;
  position: 'front' | 'back';
  isEnemy?: boolean;
}

export interface Enemy extends Unit {
  isEnemy: true;
  goldReward: number;
  expReward: number;
}

// ===== Resource Types =====
export interface Resources {
  gold: number;
  ap: number;
  maxAp: number;
  manaShards: number;
}

// ===== Level Up Constants =====
export const EXP_PER_LEVEL = 100; // EXP needed per level

// ===== Item Types =====
export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'relic';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: UnitRarity;
  description: string;
  stats?: Partial<UnitStats>;
  effect?: string;
}

export interface Reward {
  gold?: number;
  exp?: number;
  items?: Item[];
}

// ===== Battle Types =====
export type BattlePhase = 'placement' | 'battle' | 'result';
export type BattleResult = 'victory' | 'defeat' | 'ongoing';

export interface BattleAction {
  actorId: string;
  targetId: string;
  type: 'attack' | 'skill' | 'heal';
  damage?: number;
  healing?: number;
  isCrit?: boolean;
}

export interface BattleLog {
  round: number;
  actions: BattleAction[];
}

export interface BattleState {
  phase: BattlePhase;
  result: BattleResult;
  round: number;
  allies: Unit[];
  enemies: Enemy[];
  logs: BattleLog[];
  turnOrder: string[];
  currentTurnIndex: number;
}

// ===== Game State =====
export type GamePhase = 'menu' | 'map' | 'battle' | 'shop' | 'event' | 'rest' | 'treasure' | 'gameOver' | 'victory';

export interface MapState {
  width: number;
  height: number;
  rooms: Room[][];
  playerX: number;
  playerY: number;
  chapter: number;
}

export interface GameState {
  phase: GamePhase;
  turn: number;
  resources: Resources;
  party: Unit[];
  inventory: Item[];
  relics: Item[];
  map: MapState;
  battle: BattleState | null;
  seed: number;
}

// ===== Event Types =====
export interface EventChoice {
  text: string;
  effect: () => void;
  cost?: { type: keyof Resources; amount: number };
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
}

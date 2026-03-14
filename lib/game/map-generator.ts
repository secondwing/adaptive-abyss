import type { MapState, Room, RoomType } from './types';

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

const ROOM_TYPE_WEIGHTS: Record<RoomType, number> = {
  battle: 40,
  elite: 8,
  boss: 0, // Placed manually
  shop: 10,
  rest: 10,
  event: 15,
  treasure: 10,
  empty: 7,
  start: 0, // Placed manually
};

function selectRoomType(rng: SeededRandom, excludeBoss: boolean = true): RoomType {
  const types = Object.entries(ROOM_TYPE_WEIGHTS).filter(
    ([type]) => type !== 'start' && (excludeBoss ? type !== 'boss' : true)
  );
  
  const totalWeight = types.reduce((sum, [, weight]) => sum + weight, 0);
  let random = rng.next() * totalWeight;
  
  for (const [type, weight] of types) {
    random -= weight;
    if (random <= 0) {
      return type as RoomType;
    }
  }
  
  return 'battle';
}

export function generateMap(
  width: number,
  height: number,
  seed: number,
  chapter: number
): MapState {
  const rng = new SeededRandom(seed);
  const rooms: Room[][] = [];
  
  // Initialize grid
  for (let y = 0; y < height; y++) {
    rooms[y] = [];
    for (let x = 0; x < width; x++) {
      rooms[y][x] = {
        id: `room-${x}-${y}`,
        x,
        y,
        type: selectRoomType(rng),
        visited: false,
        cleared: false,
        dangerLevel: (chapter - 1) * 10,
        resourceValue: 0,
        lastUpdateTurn: 1,
      };
    }
  }
  
  // Set start position (center-bottom)
  const startX = Math.floor(width / 2);
  const startY = height - 1;
  rooms[startY][startX] = {
    ...rooms[startY][startX],
    type: 'start',
    visited: true,
    cleared: true,
    dangerLevel: 0,
  };
  
  // Set boss room (top area)
  const bossX = rng.nextInt(1, width - 2);
  const bossY = 0;
  rooms[bossY][bossX] = {
    ...rooms[bossY][bossX],
    type: 'boss',
  };
  
  // Ensure at least some rooms are accessible paths
  // Add guaranteed shop and rest rooms
  const guaranteedRooms: { type: RoomType; count: number }[] = [
    { type: 'shop', count: 2 },
    { type: 'rest', count: 2 },
    { type: 'treasure', count: 1 },
  ];
  
  for (const { type, count } of guaranteedRooms) {
    let placed = 0;
    let attempts = 0;
    const existingCount = rooms.flat().filter((r) => r.type === type).length;
    
    while (placed < count - existingCount && attempts < 100) {
      attempts++;
      const x = rng.nextInt(0, width - 1);
      const y = rng.nextInt(1, height - 2);
      
      if (rooms[y][x].type === 'battle' || rooms[y][x].type === 'empty') {
        rooms[y][x] = { ...rooms[y][x], type };
        placed++;
      }
    }
  }
  
  // Add elite rooms based on chapter
  const eliteCount = Math.min(chapter + 1, Math.floor(width * height * 0.3)); // Cap elites to 30% of map
  let elitesPlaced = 0;
  let eliteAttempts = 0;
  while (elitesPlaced < eliteCount && eliteAttempts < 100) {
    eliteAttempts++;
    const x = rng.nextInt(0, width - 1);
    const y = rng.nextInt(1, height - 2);
    
    if (rooms[y][x].type === 'battle') {
      rooms[y][x] = { ...rooms[y][x], type: 'elite' };
      elitesPlaced++;
    }
  }
  
  return {
    width,
    height,
    rooms,
    playerX: startX,
    playerY: startY,
    chapter,
  };
}

export function getAdjacentRooms(map: MapState, x: number, y: number): Room[] {
  const directions = [
    { dx: 0, dy: -1 }, // up
    { dx: 0, dy: 1 },  // down
    { dx: -1, dy: 0 }, // left
    { dx: 1, dy: 0 },  // right
  ];
  
  const adjacent: Room[] = [];
  
  for (const { dx, dy } of directions) {
    const nx = x + dx;
    const ny = y + dy;
    
    if (nx >= 0 && nx < map.width && ny >= 0 && ny < map.height) {
      adjacent.push(map.rooms[ny][nx]);
    }
  }
  
  return adjacent;
}

export function getRoomIcon(type: RoomType): string {
  const icons: Record<RoomType, string> = {
    battle: 'Swords',
    elite: 'Skull',
    boss: 'Flame',
    shop: 'ShoppingCart',
    rest: 'Heart',
    event: 'HelpCircle',
    treasure: 'Gem',
    empty: 'Square',
    start: 'Home',
  };
  
  return icons[type];
}

export function getRoomColor(type: RoomType): string {
  const colors: Record<RoomType, string> = {
    battle: 'text-orange-400',
    elite: 'text-red-500',
    boss: 'text-rose-600',
    shop: 'text-yellow-400',
    rest: 'text-emerald-400',
    event: 'text-purple-400',
    treasure: 'text-amber-300',
    empty: 'text-muted-foreground/30',
    start: 'text-cyan-400',
  };
  
  return colors[type];
}

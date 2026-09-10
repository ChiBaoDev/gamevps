export type AreaType = 'farm' | 'fishing' | 'casino' | 'park';

export type GenderType = 'male' | 'female';

export interface AvatarAppearance {
  skinColor: string;
  hairStyle: 'short' | 'long' | 'spiky' | 'bob' | 'curly' | 'cap';
  hairColor: string;
  shirtStyle: 'tshirt' | 'hoodie' | 'dress' | 'vest' | 'striped';
  shirtColor: string;
  pantsStyle: 'jeans' | 'shorts' | 'skirt' | 'sweatpants';
  pantsColor: string;
  hat?: string; // e.g. 'cowboy', 'straw', 'cap', 'crown', 'flower'
  wings?: string; // e.g. 'angel', 'demon', 'fairy'
  handheld?: string; // e.g. 'rod_bamboo', 'rod_carbon', 'watering_can', 'sickle'
  glasses?: string; // e.g. 'black', 'cool', 'round'
}

export type CropStage = 'empty' | 'seed' | 'sprout' | 'growing' | 'mature';

export interface CropDefinition {
  id: string;
  name: string;
  seedName: string;
  growDuration: number; // in seconds
  seedPrice: number;
  sellPrice: number;
  expReward: number;
  icon: string;
  seedIcon: string;
  description: string;
  levelRequired: number;
}

export interface SoilPlot {
  id: number;
  cropId: string | null;
  plantedAt: number | null; // timestamp ms
  watered: boolean;
  hasPest: boolean;
  fertilized: boolean;
}

export interface FishDefinition {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  sellPrice: number;
  expReward: number;
  icon: string;
  description: string;
  difficulty: number; // 1 to 5 (speed/window of catching)
  minBaitLevel: number;
}

export interface FishingRod {
  id: string;
  name: string;
  durability: number;
  maxDurability: number;
  luckBonus: number; // % chance for rare fish
  priceXu: number;
  priceLuong: number;
  icon: string;
  description: string;
}

export interface BaitDefinition {
  id: string;
  name: string;
  priceXu: number;
  count: number;
  tier: number;
  icon: string;
  description: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'crop' | 'seed' | 'fish' | 'bait' | 'fertilizer' | 'fashion' | 'egg';
  count: number;
  sellPrice: number;
  buyPrice?: number;
  icon: string;
  description: string;
  fashionSlot?: 'hat' | 'wings' | 'glasses' | 'shirt' | 'hair';
  fashionValue?: string;
}

export interface DailyQuest {
  id: string;
  category?: 'main' | 'daily';
  order?: number;
  chapter?: number;
  chapterTitle?: string;
  title: string;
  description?: string;
  type?: string;
  progress: number;
  target: number;
  rewardXu: number;
  rewardLuong?: number;
  rewardExp: number;
  rewardItemName?: string;
  completed: boolean;
  claimed: boolean;
  icon: string;
}

export interface UserProfile {
  id: string;
  keyCode?: string;
  username: string;
  nickname: string;
  role?: 'player' | 'admin';
  gender: GenderType;
  level: number;
  exp: number;
  maxExp: number;
  energy: number;
  maxEnergy: number;
  xu: number;
  luong: number;
  equippedHouseId?: string;
  equippedVehicleId?: string;
  appearance: AvatarAppearance;
  farmPlots: SoilPlot[];
  chickens: { id: number; fed: boolean; eggsReady: boolean; fedAt: number; readyAt?: number }[];
  pigs?: { id: number; fed: boolean; productReady: boolean; fedAt: number; readyAt?: number }[];
  inventory: InventoryItem[];
  houses?: string[];
  vehicles?: string[];
  equippedRodId: string;
  equippedBaitId: string;
  currentArea: AreaType;
  stats: {
    cropsHarvested: number;
    fishCaught: number;
    miniGamesPlayed: number;
    miniGamesWon: number;
    moneyEarned: number;
  };
  quests: DailyQuest[];
  lastLogin: number;
}


export interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  time: string;
  isSystem?: boolean;
  avatarSeed?: string;
}

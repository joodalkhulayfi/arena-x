export interface PlayerAvatar {
  name: string;
  avatarColor: string;
  suitStyle: string; // 'cyber_suit' | 'neon_outflow' | 'retro_tech' | 'desert_nomad'
  accessory: string; // 'holographic_visor' | 'gravity_helmet' | 'digital_cape' | 'none'
}

export type CreatorTitle = 'مبتدئ' | 'مصمم' | 'مبدع' | 'أسطورة القدية';

export interface PlayerStats {
  coins: number;
  fame: number;
  title: CreatorTitle;
  createdGamesCount: number;
  level: number;
  unlockedAssets: string[]; // item IDs
}

export interface GameBlueprint {
  id: string;
  title: string;
  prompt: string;
  district: string;
  mapTheme: string;
  storyLine: string;
  trackPath: string[];
  obstacles: string[];
  scoringSystem: string;
  winCondition: string;
  creator: string;
  rating: number; // e.g. 4.8
  playersCount: number;
  soundEffects: string[];
  createdAt: string;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  title: CreatorTitle;
  avatarColor: string;
  famePoints: number;
  gamesCreated: number;
}

export interface ShopItem {
  id: string;
  name: string;
  category: 'suit' | 'vehicle' | 'effect' | 'building';
  price: number;
  description: string;
  assetUrl?: string;
  iconName: string;
}

export interface LiveMission {
  id: string;
  name: string;
  zone: string;
  coords: { lat: number; lng: number };
  description: string;
  prompt: string;
  pointsReward: number;
  coinsReward: number;
  arCheckpoints: { id: string; name: string; x: number; y: number; collected: boolean }[];
}

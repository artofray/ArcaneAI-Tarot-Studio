
export enum MajorArcana {
  TheFool = "0. The Fool",
  TheMagician = "I. The Magician",
  TheHighPriestess = "II. The High Priestess",
  TheEmpress = "III. The Empress",
  TheEmperor = "IV. The Emperor",
  TheHierophant = "V. The Hierophant",
  TheLovers = "VI. The Lovers",
  TheChariot = "VII. The Chariot",
  Strength = "VIII. Strength",
  TheHermit = "IX. The Hermit",
  WheelOfFortune = "X. Wheel of Fortune",
  Justice = "XI. Justice",
  TheHangedMan = "XII. The Hanged Man",
  Death = "XIII. Death",
  Temperance = "XIV. Temperance",
  TheDevil = "XV. The Devil",
  TheTower = "XVI. The Tower",
  TheStar = "XVII. The Star",
  TheMoon = "XVIII. The Moon",
  TheSun = "XIX. The Sun",
  Judgement = "XX. Judgement",
  TheWorld = "XXI. The World",
}

export type ImageSize = '1K' | '2K' | '4K';
export type ModelType = 'flash' | 'pro';
export type BackMode = 'uniform' | 'individual';

export interface CardVersion {
  imageUrl: string | null;
  prompt: string;
  timestamp: number;
}

export interface TarotCardData {
  id: string;
  title: MajorArcana;
  imageUrl: string | null;
  prompt: string;
  isCompleted: boolean;
  designer: string;
  lastUpdated: number;
  history: CardVersion[];
  
  // Back specific fields
  backImageUrl: string | null;
  backPrompt: string;
  backHistory: CardVersion[];
}

export interface ProjectSettings {
  name: string;
  globalArtStyle: string;
  password?: string;
  cardSize: 'standard' | 'mini' | 'jumbo';
  backMode: BackMode;
  backImageUrl: string | null;
  backPrompt: string;
  backHistory: CardVersion[];
  boxDesignUrl: string | null;
  preferredModel: ModelType;
  preferredSize: ImageSize;
}

export interface PrinterInfo {
  name: string;
  pricePerDeck: number;
  minOrder: number;
  deliveryTime: string;
  features: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'Admin' | 'Designer' | 'Reviewer';
  lastSeen: number;
}

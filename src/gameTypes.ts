export type StatKey = "money" | "energy" | "mood" | "skill" | "social";
export type NeedKey = Exclude<StatKey, "money">;

export type Palette = {
  roof: string;
  wall: string;
  trim: string;
  light: string;
};

export type LocationData = {
  id: string;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  w: number;
  h: number;
  palette: Palette;
  action: string;
  costLabel: string;
  delta: Partial<Record<StatKey, number>>;
  minutes: number;
  questId: string;
};

export type QuestData = {
  id: string;
  label: string;
  target: number;
  reward: Partial<Record<StatKey, number>>;
  locationId?: string;
  npcId?: string;
  professionTags?: string[];
  cityReputation?: string[];
};

export type RuntimeQuest = QuestData & {
  progress: number;
};

export type NpcData = {
  id: string;
  name: string;
  role: string;
  locationId: string;
  x: number;
  y: number;
  tint: string;
  relationship: number;
  personality: string;
  professionReactions: Record<string, string>;
  questChainIds?: string[];
};

export type NpcMemory = {
  relationship: number;
  completedQuestIds: string[];
  lastMemory?: string;
};

export type ProfessionLevelData = {
  level: number;
  title: string;
  xpToNext: number;
  incomeBonus: number;
  unlockLabel: string;
};

export type ProfessionData = {
  id: string;
  name: string;
  locationIds: string[];
  mentorNpcId: string;
  miniGame: string;
  reputationTags: string[];
  levels: ProfessionLevelData[];
  questChainIds: string[];
};

export type ProfessionProgress = {
  level: number;
  xp: number;
};

export type InclinationId = "social" | "productive" | "creative";

export type InclinationData = {
  id: InclinationId;
  name: string;
  description: string;
  startingLocationId: string;
  startingProfessionId: string;
  reputationTag: string;
  statBoost: Partial<Record<StatKey, number>>;
};

export type DecorIcon = "poster" | "desk" | "coffee" | "shelf" | "plant" | "lamp" | "aquarium" | "music";

export type DecorItemData = {
  id: string;
  name: string;
  cost: number;
  scoreValue: number;
  x: number;
  y: number;
  icon: DecorIcon;
  professionAffinity?: string;
};

export type CharacterAppearance = {
  name: string;
  skinTone: string;
  hairColor: string;
  topColor: string;
  bottomColor: string;
};

export type DailyGoalProgress = {
  day: number;
  locationActions: number;
  npcTalks: number;
  miniGameWins: number;
  questsCompleted: number;
};

export type SaveData = {
  version: 1;
  day: number;
  hour: number;
  minute: number;
  stats: Record<StatKey, number>;
  selectedLocationId: string;
  activeInclinationId?: string;
  activeProfessionId?: string;
  reputationTags: string[];
  questProgress: Record<string, number>;
  npcMemory: Record<string, NpcMemory>;
  dailyGoals?: DailyGoalProgress;
  professionProgress?: Record<string, ProfessionProgress>;
  character?: CharacterAppearance;
  ownedDecorIds?: string[];
};

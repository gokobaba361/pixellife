import Phaser from "phaser";
import locationsData from "../../content/locations.json";
import npcsData from "../../content/npcs.json";
import professionsData from "../../content/professions.json";
import questsData from "../../content/quests.json";
import inclinationsData from "../../content/inclinations.json";
import decorData from "../../content/decor.json";
import type {
  CharacterAppearance,
  DailyGoalProgress,
  DecorItemData,
  InclinationData,
  LocationData,
  NeedKey,
  NpcData,
  ProfessionData,
  ProfessionLevelData,
  RuntimeQuest,
  SaveData,
  StatKey,
} from "../../gameTypes";

export type MiniGameKind = "timing" | "choice" | "triage";

export type InteriorHotspot = {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  message: string;
  delta: Partial<Record<StatKey, number>>;
  minutes: number;
  questId?: string;
  miniGame?: MiniGameKind;
  workXp?: number;
  shop?: boolean;
};

export const locations = locationsData as LocationData[];
export const npcs = npcsData as NpcData[];
export const professions = professionsData as ProfessionData[];
export const initialQuests = questsData as RuntimeQuest[];
export const inclinations = inclinationsData as InclinationData[];
export const decorItems = decorData as DecorItemData[];

export const toColor = (hex: string) => Number.parseInt(hex.replace("#", ""), 16);

export const NAME_OPTIONS = ["Aslı", "Deniz", "Kemal", "Yaren", "Mira", "Toprak"];
export const SKIN_TONES = ["#f4b086", "#e8965f", "#c97a4a", "#8a5636"];
export const HAIR_COLORS = ["#1b2035", "#6f4a2f", "#c9a227", "#e7e9ff"];
export const TOP_COLORS = ["#2f4168", "#ff6f91", "#3fa66a", "#c68cff"];
export const BOTTOM_COLORS = ["#101522", "#3a2b20", "#22314a", "#4a1f2b"];
export const DEFAULT_APPEARANCE: CharacterAppearance = {
  name: NAME_OPTIONS[0],
  skinTone: SKIN_TONES[0],
  hairColor: HAIR_COLORS[0],
  topColor: TOP_COLORS[0],
  bottomColor: BOTTOM_COLORS[0],
};

export const needLabels: Record<NeedKey, string> = {
  energy: "Enerji",
  mood: "Mutluluk",
  skill: "Beceri",
  social: "Sosyal",
};

export const clampStat = (stat: StatKey, value: number) => Phaser.Math.Clamp(value, 0, stat === "money" ? 9999 : 100);

const RELATIONSHIP_TIERS = [
  { minValue: 75, label: "Yakın" },
  { minValue: 40, label: "Arkadaş" },
  { minValue: 0, label: "Tanıdık" },
];

export function relationshipTier(value: number) {
  const clamped = Phaser.Math.Clamp(value, 0, 100);
  return RELATIONSHIP_TIERS.find((tier) => clamped >= tier.minValue) ?? RELATIONSHIP_TIERS[RELATIONSHIP_TIERS.length - 1];
}

export const CITY_QUEST_CHAIN_NPC: Record<string, string> = {
  home: "ayla",
  square: "kerem",
  business: "bora",
  mall: "nil",
  gym: "mert",
};

export function resolveActiveChainQuestId(chainIds: string[] | undefined, questProgress: Record<string, number>): string | undefined {
  if (!chainIds || chainIds.length === 0) return undefined;

  for (const id of chainIds) {
    const quest = initialQuests.find((item) => item.id === id);
    if (!quest) continue;
    if ((questProgress[id] ?? 0) < quest.target) return id;
  }
  return chainIds[chainIds.length - 1];
}

export function computeDecorScore(ownedDecorIds: string[], activeProfessionId?: string) {
  const base = decorItems
    .filter((item) => ownedDecorIds.includes(item.id))
    .reduce((sum, item) => sum + item.scoreValue + (item.professionAffinity === activeProfessionId ? 2 : 0), 0);
  return activeProfessionId === "interior_designer" ? Math.round(base * 1.5) : base;
}

export function professionLevelForXp(profession: ProfessionData, xp: number): ProfessionLevelData {
  let current = profession.levels[0];
  profession.levels.forEach((level) => {
    if (xp >= level.xpToNext) current = level;
  });
  return current;
}

export function applyProfessionXp(save: SaveData, professionId: string | undefined, amount: number) {
  if (!professionId || amount <= 0) return undefined;

  const profession = professions.find((item) => item.id === professionId);
  if (!profession) return undefined;

  save.professionProgress ??= {};
  const progress = save.professionProgress[professionId] ?? { level: 1, xp: 0 };
  const beforeLevel = progress.level;
  progress.xp += amount;
  const levelData = professionLevelForXp(profession, progress.xp);
  progress.level = levelData.level;
  save.professionProgress[professionId] = progress;

  return levelData.level > beforeLevel ? levelData : undefined;
}

export function createDailyGoals(day: number): DailyGoalProgress {
  return {
    day,
    locationActions: 0,
    npcTalks: 0,
    miniGameWins: 0,
    questsCompleted: 0,
  };
}

export function ensureDailyGoals(save: SaveData) {
  if (!save.dailyGoals || save.dailyGoals.day !== save.day) {
    save.dailyGoals = createDailyGoals(save.day);
  }
  return save.dailyGoals;
}

export function applyHotspotToSave(save: SaveData, hotspot: InteriorHotspot, multiplier = 1) {
  ensureDailyGoals(save);
  save.professionProgress ??= {};

  const workProfession = hotspot.workXp && save.activeProfessionId
    ? professions.find((item) => item.id === save.activeProfessionId)
    : undefined;
  const incomeBonus = workProfession
    ? professionLevelForXp(workProfession, save.professionProgress[workProfession.id]?.xp ?? 0).incomeBonus
    : 0;

  Object.entries(hotspot.delta).forEach(([key, value]) => {
    const stat = key as StatKey;
    let amount = value * multiplier;
    if (stat === "money" && amount > 0 && incomeBonus > 0) {
      amount += incomeBonus;
    }
    save.stats[stat] = clampStat(stat, save.stats[stat] + Math.round(amount));
  });
  save.minute += Math.max(1, Math.round(hotspot.minutes * multiplier));
  while (save.minute >= 60) {
    save.hour += 1;
    save.minute -= 60;
  }
  if (save.hour >= 24) {
    save.day += 1;
    save.hour = 8;
    save.minute = 0;
    save.dailyGoals = createDailyGoals(save.day);
  }
  if (multiplier >= 1 && hotspot.miniGame) {
    ensureDailyGoals(save).miniGameWins += 1;
  }
  const progressResult = multiplier >= 1 ? progressSaveQuest(save, hotspot.questId) : undefined;
  const completedQuest = progressResult?.quest;
  const relationshipTierUp = progressResult?.tierUp;
  if (completedQuest) {
    ensureDailyGoals(save).questsCompleted += 1;
  }

  let leveledUp: ProfessionLevelData | undefined;
  if (multiplier >= 1 && hotspot.workXp) {
    leveledUp = applyProfessionXp(save, save.activeProfessionId, hotspot.workXp);
  }
  if (completedQuest?.professionTags?.includes(save.activeProfessionId ?? "")) {
    leveledUp = applyProfessionXp(save, save.activeProfessionId, 25) ?? leveledUp;
  }

  return { completedQuest, leveledUp, relationshipTierUp };
}

export function progressSaveQuest(save: SaveData, questId?: string) {
  if (!questId) return undefined;

  const quest = initialQuests.find((item) => item.id === questId);
  if (!quest) return undefined;

  const current = save.questProgress[quest.id] ?? 0;
  if (current >= quest.target) return undefined;

  const next = Phaser.Math.Clamp(current + 1, 0, quest.target);
  save.questProgress[quest.id] = next;
  if (next < quest.target) return undefined;

  Object.entries(quest.reward).forEach(([key, value]) => {
    const stat = key as StatKey;
    save.stats[stat] = clampStat(stat, save.stats[stat] + value);
  });
  quest.cityReputation?.forEach((tag) => {
    if (!save.reputationTags.includes(tag)) {
      save.reputationTags.push(tag);
    }
  });
  const tierUp = rememberSaveQuest(save, quest);
  return { quest, tierUp };
}

export function rememberSaveQuest(save: SaveData, quest: RuntimeQuest) {
  if (!quest.npcId) return undefined;

  const npc = npcs.find((item) => item.id === quest.npcId);
  if (!npc) return undefined;

  const memory = save.npcMemory[quest.npcId] ?? {
    relationship: npc.relationship,
    completedQuestIds: [],
  };
  const beforeTier = relationshipTier(memory.relationship).label;
  const reaction = save.activeProfessionId ? npc.professionReactions[save.activeProfessionId] : undefined;
  memory.relationship = Phaser.Math.Clamp(memory.relationship + 4, 0, 100);
  if (!memory.completedQuestIds.includes(quest.id)) {
    memory.completedQuestIds.push(quest.id);
  }
  memory.lastMemory = reaction ?? `${quest.label} gorevini hatirliyor.`;
  save.npcMemory[quest.npcId] = memory;
  const afterTier = relationshipTier(memory.relationship).label;
  return afterTier !== beforeTier ? { npcName: npc.name, tier: afterTier } : undefined;
}

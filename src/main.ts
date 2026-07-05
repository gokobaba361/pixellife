import Phaser from "phaser";
import "./styles.css";
import locationsData from "./content/locations.json";
import npcsData from "./content/npcs.json";
import professionsData from "./content/professions.json";
import questsData from "./content/quests.json";
import inclinationsData from "./content/inclinations.json";
import decorData from "./content/decor.json";
import type { CharacterAppearance, DailyGoalProgress, DecorItemData, InclinationData, LocationData, NeedKey, NpcData, NpcMemory, ProfessionData, ProfessionLevelData, RuntimeQuest, SaveData, StatKey } from "./gameTypes";

type MenuKey = "tasks" | "jobs" | "phone";
type MiniGameKind = "timing" | "choice" | "triage";
type InteriorHotspot = {
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

const locations = locationsData as LocationData[];
const npcs = npcsData as NpcData[];
const professions = professionsData as ProfessionData[];
const initialQuests = questsData as RuntimeQuest[];
const inclinations = inclinationsData as InclinationData[];
const decorItems = decorData as DecorItemData[];
const toColor = (hex: string) => Number.parseInt(hex.replace("#", ""), 16);
const SAVE_KEY = "pixellife.save.v1";

const NAME_OPTIONS = ["Aslı", "Deniz", "Kemal", "Yaren", "Mira", "Toprak"];
const SKIN_TONES = ["#f4b086", "#e8965f", "#c97a4a", "#8a5636"];
const HAIR_COLORS = ["#1b2035", "#6f4a2f", "#c9a227", "#e7e9ff"];
const TOP_COLORS = ["#2f4168", "#ff6f91", "#3fa66a", "#c68cff"];
const BOTTOM_COLORS = ["#101522", "#3a2b20", "#22314a", "#4a1f2b"];
const DEFAULT_APPEARANCE: CharacterAppearance = {
  name: NAME_OPTIONS[0],
  skinTone: SKIN_TONES[0],
  hairColor: HAIR_COLORS[0],
  topColor: TOP_COLORS[0],
  bottomColor: BOTTOM_COLORS[0],
};

const needLabels: Record<NeedKey, string> = {
  energy: "Enerji",
  mood: "Mutluluk",
  skill: "Beceri",
  social: "Sosyal",
};

const clampStat = (stat: StatKey, value: number) => Phaser.Math.Clamp(value, 0, stat === "money" ? 9999 : 100);

const RELATIONSHIP_TIERS = [
  { minValue: 75, label: "Yakın" },
  { minValue: 40, label: "Arkadaş" },
  { minValue: 0, label: "Tanıdık" },
];

function relationshipTier(value: number) {
  const clamped = Phaser.Math.Clamp(value, 0, 100);
  return RELATIONSHIP_TIERS.find((tier) => clamped >= tier.minValue) ?? RELATIONSHIP_TIERS[RELATIONSHIP_TIERS.length - 1];
}

function resolveActiveChainQuestId(chainIds: string[] | undefined, questProgress: Record<string, number>): string | undefined {
  if (!chainIds || chainIds.length === 0) return undefined;

  for (const id of chainIds) {
    const quest = initialQuests.find((item) => item.id === id);
    if (!quest) continue;
    if ((questProgress[id] ?? 0) < quest.target) return id;
  }
  return chainIds[chainIds.length - 1];
}

function computeDecorScore(ownedDecorIds: string[], activeProfessionId?: string) {
  const base = decorItems
    .filter((item) => ownedDecorIds.includes(item.id))
    .reduce((sum, item) => sum + item.scoreValue + (item.professionAffinity === activeProfessionId ? 2 : 0), 0);
  return activeProfessionId === "interior_designer" ? Math.round(base * 1.5) : base;
}

function professionLevelForXp(profession: ProfessionData, xp: number): ProfessionLevelData {
  let current = profession.levels[0];
  profession.levels.forEach((level) => {
    if (xp >= level.xpToNext) current = level;
  });
  return current;
}

function applyProfessionXp(save: SaveData, professionId: string | undefined, amount: number) {
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

function createDailyGoals(day: number): DailyGoalProgress {
  return {
    day,
    locationActions: 0,
    npcTalks: 0,
    miniGameWins: 0,
    questsCompleted: 0,
  };
}

function ensureDailyGoals(save: SaveData) {
  if (!save.dailyGoals || save.dailyGoals.day !== save.day) {
    save.dailyGoals = createDailyGoals(save.day);
  }
  return save.dailyGoals;
}

function applyHotspotToSave(save: SaveData, hotspot: InteriorHotspot, multiplier = 1) {
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

function progressSaveQuest(save: SaveData, questId?: string) {
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

function rememberSaveQuest(save: SaveData, quest: RuntimeQuest) {
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

class PixelLifeScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private statusText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private selectedNameText!: Phaser.GameObjects.Text;
  private selectedDescText!: Phaser.GameObjects.Text;
  private actionButton!: Phaser.GameObjects.Container;
  private enterButton!: Phaser.GameObjects.Container;
  private menuTitle!: Phaser.GameObjects.Text;
  private menuBody!: Phaser.GameObjects.Text;
  private statBars = new Map<NeedKey, Phaser.GameObjects.Rectangle>();
  private locationOutlines = new Map<string, Phaser.GameObjects.Rectangle>();
  private selected?: LocationData;
  private activeInclination?: InclinationData;
  private activeProfession?: ProfessionData;
  private reputationTags = new Set<string>();
  private npcMemory = new Map<string, NpcMemory>();
  private professionProgress = new Map<string, { level: number; xp: number }>();
  private character?: CharacterAppearance;
  private characterDraft: CharacterAppearance = { ...DEFAULT_APPEARANCE };
  private characterPreview?: Phaser.GameObjects.Image;
  private playerSprite!: Phaser.GameObjects.Image;
  private ownedDecorIds = new Set<string>();
  private selectedLocationId = "home";
  private overlay?: Phaser.GameObjects.Container;
  private menu: MenuKey = "tasks";
  private day = 1;
  private hour = 8;
  private minute = 0;
  private dailyGoals: DailyGoalProgress = createDailyGoals(1);
  private stats: Record<StatKey, number> = {
    money: 120,
    energy: 78,
    mood: 62,
    skill: 5,
    social: 8,
  };
  private quests: RuntimeQuest[] = initialQuests.map((quest) => ({ ...quest, progress: 0 }));

  constructor() {
    super("pixellife");
  }

  create() {
    this.cameras.main.setBackgroundColor("#070b17");
    this.initializeNpcMemory();
    this.loadGame();
    this.createPixelTextures();
    this.drawBackdrop();
    this.drawLocations();
    this.drawNpcs();
    this.createPlayer(190, 432);
    this.createHud();
    this.createPhoneMenu();
    this.createActionPanel();
    const initialLocation = locations.find((location) => location.id === this.selectedLocationId) ?? locations[0];
    this.selectLocation(initialLocation);
    if (this.activeInclination) {
      this.setMessage("Kayıt yüklendi. Şehir seni hatırlıyor.");
    } else if (!this.character) {
      this.setMessage("Pixel Life'a hoş geldin. Önce karakterini oluştur.");
      this.createCharacterOverlay();
    } else {
      this.setMessage("Pixel Life'a hoş geldin. Önce şehir seni nasıl tanısın?");
      this.createInclinationOverlay();
    }
  }

  private initializeNpcMemory() {
    npcs.forEach((npc) => {
      this.npcMemory.set(npc.id, {
        relationship: npc.relationship,
        completedQuestIds: [],
      });
    });
  }

  private createPixelTextures() {
    this.applyAppearanceTexture(this.character ?? DEFAULT_APPEARANCE);
    this.makeCharacterTexture("npc-a", 0xff6f91, 0x4b2435, 0xf0a77c, 0x101522);
    this.makeCharacterTexture("npc-b", 0x66d9ef, 0x202b40, 0xd48d62, 0x101522);
    this.makeCharacterTexture("npc-c", 0xffcf5a, 0x583926, 0xf1b180, 0x101522);
    this.makePetTexture();
  }

  private applyAppearanceTexture(appearance: CharacterAppearance) {
    this.makeCharacterTexture(
      "hero",
      toColor(appearance.topColor),
      toColor(appearance.hairColor),
      toColor(appearance.skinTone),
      toColor(appearance.bottomColor),
    );
  }

  private makeCharacterTexture(key: string, shirt: number, hair: number, skin: number, bottom: number) {
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(20, 55, 30, 8);
    g.fillStyle(skin);
    g.fillRect(12, 10, 16, 16);
    g.fillStyle(hair);
    g.fillRect(9, 6, 22, 8);
    g.fillRect(9, 13, 5, 10);
    g.fillRect(26, 13, 5, 10);
    g.fillStyle(0x151827);
    g.fillRect(15, 17, 3, 3);
    g.fillRect(23, 17, 3, 3);
    g.fillStyle(shirt);
    g.fillRect(10, 28, 20, 20);
    g.fillStyle(bottom);
    g.fillRect(12, 48, 7, 12);
    g.fillRect(22, 48, 7, 12);
    g.generateTexture(key, 40, 64);
    g.destroy();
  }

  private makePetTexture() {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(18, 28, 30, 8);
    g.fillStyle(0xf4b15c);
    g.fillRect(8, 12, 19, 15);
    g.fillRect(24, 8, 8, 12);
    g.fillTriangle(25, 8, 29, 2, 32, 8);
    g.fillStyle(0xffd07b);
    g.fillRect(4, 15, 7, 8);
    g.fillStyle(0x262031);
    g.fillRect(27, 13, 2, 2);
    g.generateTexture("pet", 38, 34);
    g.destroy();
  }

  private drawBackdrop() {
    this.add.rectangle(640, 360, 1280, 720, 0x0b1024);
    this.add.rectangle(520, 112, 1040, 224, 0x171b3a);

    for (let i = 0; i < 52; i += 1) {
      const x = i * 22;
      const h = 48 + ((i * 37) % 92);
      this.add.rectangle(x, 214 - h / 2, 17, h, i % 3 === 0 ? 0x20294e : 0x242d55).setAlpha(0.82);
      if (i % 2 === 0) {
        this.add.rectangle(x + 4, 206 - h, 4, 4, 0xffbf63).setAlpha(0.9);
      }
    }

    this.add.rectangle(520, 292, 1040, 96, 0x12334b);
    for (let i = 0; i < 18; i += 1) {
      this.add.rectangle(i * 64 + 18, 285, 34, 3, 0xffb75f, 0.45);
    }

    this.add.rectangle(520, 393, 1040, 34, 0x2d3855);
    this.add.rectangle(520, 412, 1040, 8, 0x090d18);
    this.add.rectangle(520, 558, 1040, 284, 0x172131);

    for (let y = 452; y < 692; y += 54) {
      this.add.rectangle(520, y, 1040, 2, 0x24304b, 0.85);
    }
    for (let x = 24; x < 1010; x += 64) {
      this.add.rectangle(x, 558, 2, 270, 0x111827, 0.45);
    }

    this.add.rectangle(1064, 360, 2, 720, 0x44517b, 0.55);
  }

  private drawLocations() {
    locations.forEach((location) => {
      const card = this.add.container(location.x, location.y);
      const outline = this.add.rectangle(0, 4, location.w + 16, location.h + 20, 0x000000, 0)
        .setStrokeStyle(3, 0xffcf66, 0);
      const shadow = this.add.rectangle(8, location.h / 2 - 4, location.w, 18, 0x020510, 0.38);
      const floor = this.add.polygon(0, location.h / 2 - 8, [
        -location.w / 2, -8,
        location.w / 2, -8,
        location.w / 2 - 28, 18,
        -location.w / 2 + 28, 18,
      ], 0x263047);
      const wall = this.add.rectangle(0, 4, location.w - 44, location.h - 52, toColor(location.palette.wall))
        .setStrokeStyle(3, 0x111827, 0.86);
      const roof = this.add.polygon(0, -44, [
        -location.w / 2 + 16, 8,
        -location.w / 2 + 42, -34,
        location.w / 2 - 42, -34,
        location.w / 2 - 16, 8,
      ], toColor(location.palette.roof)).setStrokeStyle(3, 0x111827, 0.9);
      const awning = this.add.rectangle(0, -18, location.w - 30, 18, toColor(location.palette.trim))
        .setStrokeStyle(2, 0x1b1d2a, 0.8);
      const door = this.add.rectangle(0, 30, 28, 46, 0x101827);
      const lightA = this.add.rectangle(-location.w / 4, 8, 18, 22, toColor(location.palette.light), 0.92);
      const lightB = this.add.rectangle(location.w / 4, 8, 18, 22, toColor(location.palette.light), 0.92);
      const labelBg = this.add.rectangle(0, location.h / 2 + 14, location.w - 36, 28, 0x070a14, 0.84)
        .setStrokeStyle(1, 0x6f7eb5, 0.5);
      const label = this.add.text(0, location.h / 2 + 14, location.name, this.textStyle(17, "#fff4de")).setOrigin(0.5);

      card.add([outline, shadow, floor, wall, roof, awning, door, lightA, lightB, labelBg, label]);
      card.setSize(location.w + 18, location.h + 28);
      card.setInteractive({ useHandCursor: true });
      card.on("pointerdown", () => this.selectLocation(location));
      this.locationOutlines.set(location.id, outline);
    });
  }

  private drawNpcs() {
    const textureFor = ["npc-a", "npc-b", "npc-c"];
    npcs.forEach((npc, index) => {
      const npcSprite = this.add.image(npc.x, npc.y, textureFor[index % textureFor.length]).setScale(1.2);
      npcSprite.setTint(toColor(npc.tint));
      const name = this.add.text(npc.x, npc.y + 46, npc.name, this.textStyle(13, "#ffeec9")).setOrigin(0.5);
      this.tweens.add({
        targets: [npcSprite, name],
        y: "+=5",
        duration: 900 + index * 180,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
    this.add.image(260, 448, "pet").setScale(1.6);
  }

  private createPlayer(x: number, y: number) {
    this.player = this.add.container(x, y);
    this.playerSprite = this.add.image(0, 0, "hero").setScale(1.28);
    const heart = this.add.text(16, -42, "♥", this.textStyle(18, "#ff5b83")).setOrigin(0.5).setAlpha(0);
    this.player.add([this.playerSprite, heart]);
  }

  private createHud() {
    const hud = this.add.rectangle(532, 38, 1016, 58, 0x070a14, 0.86)
      .setStrokeStyle(1, 0x6f7eb5, 0.48);
    hud.setDepth(10);
    this.statusText = this.add.text(42, 18, "", this.textStyle(18, "#fff4de")).setDepth(11);

    const needs: NeedKey[] = ["energy", "mood", "skill", "social"];
    needs.forEach((need, index) => {
      const x = 520 + index * 128;
      this.add.text(x, 15, needLabels[need], this.textStyle(12, "#b9c6ef")).setDepth(11);
      this.add.rectangle(x + 42, 40, 86, 12, 0x11172b).setStrokeStyle(1, 0x435078, 0.6).setDepth(11);
      const bar = this.add.rectangle(x, 40, 1, 8, this.colorForNeed(need)).setOrigin(0, 0.5).setDepth(12);
      this.statBars.set(need, bar);
    });
  }

  private createPhoneMenu() {
    this.add.rectangle(1172, 360, 216, 704, 0x0b1020, 0.96).setStrokeStyle(1, 0x6f7eb5, 0.5);
    this.add.text(1086, 24, "PIXELPHONE", this.textStyle(17, "#ffcf66")).setDepth(12);

    const buttons: Array<{ key: MenuKey; label: string; icon: string; y: number }> = [
      { key: "tasks", label: "Görevler", icon: "✓", y: 90 },
      { key: "jobs", label: "Meslek", icon: "▣", y: 148 },
      { key: "phone", label: "Telefon", icon: "☎", y: 206 },
    ];

    buttons.forEach((button) => {
      const item = this.add.container(1172, button.y);
      const bg = this.add.rectangle(0, 0, 172, 42, 0x141d35).setStrokeStyle(1, 0x435078, 0.78);
      const icon = this.add.text(-66, -11, button.icon, this.textStyle(19, "#ffcf66"));
      const label = this.add.text(-38, -10, button.label, this.textStyle(15, "#fff4de"));
      item.add([bg, icon, label]);
      item.setSize(172, 42);
      item.setInteractive({ useHandCursor: true });
      item.on("pointerdown", () => {
        this.menu = button.key;
        this.refreshMenu();
      });
    });

    this.menuTitle = this.add.text(1088, 280, "", this.textStyle(18, "#ffcf66"));
    this.menuBody = this.add.text(1088, 318, "", {
      ...this.textStyle(14, "#dce6ff"),
      lineSpacing: 8,
      wordWrap: { width: 164 },
    });
  }

  private createActionPanel() {
    this.add.rectangle(532, 663, 1016, 100, 0x070a14, 0.9).setStrokeStyle(1, 0x6f7eb5, 0.46);
    this.selectedNameText = this.add.text(42, 628, "", this.textStyle(22, "#ffcf66"));
    this.selectedDescText = this.add.text(42, 660, "", this.textStyle(15, "#dce6ff"));
    this.messageText = this.add.text(42, 696, "", this.textStyle(15, "#fff4de"));

    this.actionButton = this.createPanelButton(780, 663, 240, 58, 0xffcf66, "label");
    this.actionButton.setInteractive({ useHandCursor: true });
    this.actionButton.on("pointerdown", () => this.performAction());

    this.enterButton = this.createPanelButton(1026, 663, 210, 58, 0x6fd3ff, "label");
    this.enterButton.setInteractive({ useHandCursor: true });
    this.enterButton.on("pointerdown", () => this.enterLocation());
  }

  private createPanelButton(x: number, y: number, width: number, height: number, color: number, labelName: string) {
    const button = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, width, height, color).setStrokeStyle(3, 0x22314a, 0.9);
    const label = this.add.text(0, 0, "", this.textStyle(17, "#221423")).setOrigin(0.5).setName(labelName);
    button.add([bg, label]);
    button.setSize(width, height);
    return button;
  }

  private createCharacterOverlay() {
    this.characterDraft = { ...DEFAULT_APPEARANCE };
    this.applyAppearanceTexture(this.characterDraft);

    const overlay = this.add.container(532, 360).setDepth(50);
    this.overlay = overlay;
    const shade = this.add.rectangle(0, 0, 1064, 720, 0x050814, 0.86);
    const panel = this.add.rectangle(0, 0, 980, 600, 0x0b1020, 0.98).setStrokeStyle(2, 0x6f7eb5, 0.72);
    const title = this.add.text(-450, -272, "Karakterini oluştur", this.textStyle(26, "#ffcf66"));
    const body = this.add.text(-450, -234, "Bu seçimler kozmetiktir; şehir seni ne olduğunla değil ne yaptığınla tanır.", {
      ...this.textStyle(14, "#dce6ff"),
      wordWrap: { width: 620 },
    });
    overlay.add([shade, panel, title, body]);

    this.characterPreview = this.add.image(360, -70, "hero").setScale(3.4);
    overlay.add(this.characterPreview);

    const rows: Array<{ label: string; values: string[]; get: () => string; set: (value: string) => void }> = [
      { label: "İsim", values: NAME_OPTIONS, get: () => this.characterDraft.name, set: (v) => (this.characterDraft.name = v) },
      { label: "Ten tonu", values: SKIN_TONES, get: () => this.characterDraft.skinTone, set: (v) => (this.characterDraft.skinTone = v) },
      { label: "Saç rengi", values: HAIR_COLORS, get: () => this.characterDraft.hairColor, set: (v) => (this.characterDraft.hairColor = v) },
      { label: "Üst kıyafet", values: TOP_COLORS, get: () => this.characterDraft.topColor, set: (v) => (this.characterDraft.topColor = v) },
      { label: "Alt kıyafet", values: BOTTOM_COLORS, get: () => this.characterDraft.bottomColor, set: (v) => (this.characterDraft.bottomColor = v) },
    ];

    rows.forEach((row, rowIndex) => {
      const y = -150 + rowIndex * 76;
      const label = this.add.text(-450, y - 10, row.label, this.textStyle(15, "#b9c6ef"));
      overlay.add(label);

      const isColor = row.label !== "İsim";
      const chips = row.values.map((value, index) => {
        const x = -300 + index * (isColor ? 60 : 96);
        const chip = this.add.container(x, y + 12);
        const width = isColor ? 42 : 86;
        const bg = isColor
          ? this.add.circle(0, 0, 19, toColor(value)).setStrokeStyle(3, 0xffcf66, 0)
          : this.add.rectangle(0, 0, width, 34, 0x141d35).setStrokeStyle(2, 0xffcf66, 0);
        chip.add(bg);
        if (!isColor) {
          const text = this.add.text(0, 0, value, this.textStyle(13, "#fff4de")).setOrigin(0.5);
          chip.add(text);
        }
        chip.setSize(width, 38);
        chip.setInteractive({ useHandCursor: true });
        chip.on("pointerdown", () => {
          row.set(value);
          this.applyAppearanceTexture(this.characterDraft);
          this.characterPreview?.setTexture("hero");
          refreshHighlight();
        });
        overlay.add(chip);
        return { value, bg };
      });

      const refreshHighlight = () => {
        const current = row.get();
        chips.forEach(({ value, bg }) => {
          if (isColor) {
            (bg as Phaser.GameObjects.Arc).setStrokeStyle(3, 0xffcf66, value === current ? 1 : 0);
          } else {
            (bg as Phaser.GameObjects.Rectangle).setStrokeStyle(2, 0xffcf66, value === current ? 1 : 0);
          }
        });
      };
      refreshHighlight();
    });

    const confirm = this.createPanelButton(300, 254, 260, 56, 0xffcf66, "label");
    (confirm.getByName("label") as Phaser.GameObjects.Text).setText("Karakterimi onayla");
    confirm.setInteractive({ useHandCursor: true });
    confirm.on("pointerdown", () => {
      this.character = { ...this.characterDraft };
      this.playerSprite.setTexture("hero");
      this.overlay?.destroy();
      this.overlay = undefined;
      this.setMessage(`${this.character.name} hazır. Şimdi şehir seni nasıl tanısın?`);
      this.createInclinationOverlay();
    });
    overlay.add(confirm);
  }

  private createInclinationOverlay() {
    this.overlay = this.add.container(532, 360).setDepth(50);
    const shade = this.add.rectangle(0, 0, 1064, 720, 0x050814, 0.82);
    const panel = this.add.rectangle(0, 0, 760, 330, 0x0b1020, 0.98).setStrokeStyle(2, 0x6f7eb5, 0.72);
    const title = this.add.text(-330, -136, "Şehir seni nasıl tanısın?", this.textStyle(26, "#ffcf66"));
    const body = this.add.text(-330, -96, "Bu seçim meslek kilidi değil; ilk görev tonunu, NPC tepkisini ve şehir itibarını başlatır.", {
      ...this.textStyle(15, "#dce6ff"),
      wordWrap: { width: 650 },
    });

    this.overlay.add([shade, panel, title, body]);

    inclinations.forEach((inclination, index) => {
      const x = -240 + index * 240;
      const card = this.add.container(x, 56);
      const bg = this.add.rectangle(0, 0, 210, 150, 0x141d35).setStrokeStyle(1, 0x6f7eb5, 0.62);
      const name = this.add.text(0, -54, inclination.name, this.textStyle(20, "#fff4de")).setOrigin(0.5);
      const desc = this.add.text(0, -18, inclination.description, {
        ...this.textStyle(13, "#dce6ff"),
        align: "center",
        wordWrap: { width: 176 },
      }).setOrigin(0.5, 0);
      const cta = this.add.text(0, 54, "Seç", this.textStyle(15, "#ffcf66")).setOrigin(0.5);
      card.add([bg, name, desc, cta]);
      card.setSize(210, 150);
      card.setInteractive({ useHandCursor: true });
      card.on("pointerdown", () => this.chooseInclination(inclination));
      this.overlay?.add(card);
    });
  }

  private chooseInclination(inclination: InclinationData) {
    this.activeInclination = inclination;
    this.activeProfession = professions.find((profession) => profession.id === inclination.startingProfessionId);
    this.reputationTags.add(inclination.reputationTag);
    Object.entries(inclination.statBoost).forEach(([key, value]) => {
      const stat = key as StatKey;
      this.stats[stat] = Phaser.Math.Clamp(this.stats[stat] + value, 0, stat === "money" ? 9999 : 100);
    });
    this.overlay?.destroy();
    this.overlay = undefined;

    const location = locations.find((item) => item.id === inclination.startingLocationId) ?? locations[0];
    this.selectLocation(location);
    this.setMessage(`${inclination.name} başlangıcı seçildi. Şehir seni "${inclination.reputationTag}" olarak tanımaya başladı.`);
    this.saveGame();
  }

  private selectLocation(location: LocationData) {
    this.selected = location;
    this.selectedLocationId = location.id;
    this.locationOutlines.forEach((outline, id) => {
      outline.setStrokeStyle(3, 0xffcf66, id === location.id ? 0.95 : 0);
    });

    this.tweens.add({
      targets: this.player,
      x: location.x,
      y: location.y + location.h / 2 + 24,
      duration: Phaser.Math.Clamp(
        Phaser.Math.Distance.Between(this.player.x, this.player.y, location.x, location.y) * 3.2,
        260,
        1000,
      ),
      ease: "Sine.easeInOut",
    });

    this.selectedNameText.setText(location.name);
    this.selectedDescText.setText(`${location.subtitle}  •  ${location.costLabel}  •  ${location.minutes} dk`);
    this.setActionLabel(location.action);
    this.setEnterLabel("İçeri gir");
    this.setMessage(`${location.name} seçildi. Aksiyonu başlatabilirsin.`);
    if (this.activeInclination && !this.overlay) {
      this.saveGame();
    }
  }

  private enterLocation() {
    if (!this.selected) {
      this.setMessage("Önce bir lokasyon seç.");
      return;
    }
    if (!this.activeInclination) {
      this.setMessage("İçeri girmeden önce şehir seni nasıl tanısın seçmelisin.");
      return;
    }
    this.saveGame();
    this.scene.start("interior", { locationId: this.selected.id });
  }

  private performAction() {
    if (!this.selected) {
      this.setMessage("Önce bir lokasyon seç.");
      return;
    }
    if (this.stats.energy <= 0 && this.selected.id !== "home") {
      this.setMessage("Enerjin bitti. Eve gidip dinlenmen gerekiyor.");
      return;
    }

    const workLocation = this.activeProfession?.locationIds.includes(this.selected.id) ?? false;
    const incomeBonus = workLocation && this.activeProfession
      ? professionLevelForXp(this.activeProfession, this.professionProgress.get(this.activeProfession.id)?.xp ?? 0).incomeBonus
      : 0;

    Object.entries(this.selected.delta).forEach(([key, value]) => {
      const stat = key as StatKey;
      let amount = value;
      if (stat === "money" && amount > 0 && incomeBonus > 0) {
        amount += incomeBonus;
      }
      this.stats[stat] = clampStat(stat, this.stats[stat] + amount);
    });

    let levelUp: ProfessionLevelData | undefined;
    if (workLocation) {
      levelUp = this.gainProfessionXp(8);
    }

    this.advanceTime(this.selected.minutes);
    const { quest: completedQuest, levelUp: questLevelUp, tierUp } = this.progressQuest(this.selected.questId);
    levelUp = questLevelUp ?? levelUp;
    this.dailyGoals.locationActions += 1;
    if (completedQuest) {
      this.dailyGoals.questsCompleted += 1;
    }
    this.pulsePlayer(this.selected.id === "park" ? "♥" : "+");

    const messageParts = [
      completedQuest ? `Görev tamamlandı: ${completedQuest.label}. Ödül alındı!` : `${this.selected.name}: ${this.selected.action} tamamlandı.`,
    ];
    if (levelUp && this.activeProfession) {
      messageParts.push(`${this.activeProfession.name} seviye atladı: ${levelUp.title}! ${levelUp.unlockLabel}`);
    }
    if (tierUp) {
      messageParts.push(`${tierUp.npcName} ile artık ${tierUp.tier} oldunuz!`);
    }
    this.setMessage(messageParts.join(" "));
    this.refreshHud();
    this.refreshMenu();
    this.saveGame();
  }

  private progressQuest(id: string): { quest?: RuntimeQuest; levelUp?: ProfessionLevelData; tierUp?: { npcName: string; tier: string } } {
    const quest = this.quests.find((item) => item.id === id && item.progress < item.target);
    if (!quest) return {};

    quest.progress += 1;
    if (quest.progress >= quest.target) {
      Object.entries(quest.reward).forEach(([key, value]) => {
        const stat = key as StatKey;
        this.stats[stat] = Phaser.Math.Clamp(this.stats[stat] + value, 0, stat === "money" ? 9999 : 100);
      });
      quest.cityReputation?.forEach((tag) => this.reputationTags.add(tag));
      const tierUp = this.rememberQuest(quest);
      let levelUp: ProfessionLevelData | undefined;
      if (this.activeProfession && quest.professionTags?.includes(this.activeProfession.id)) {
        levelUp = this.gainProfessionXp(25);
      }
      return { quest, levelUp, tierUp };
    }
    return {};
  }

  private gainProfessionXp(amount: number): ProfessionLevelData | undefined {
    if (!this.activeProfession) return undefined;

    const profession = this.activeProfession;
    const progress = this.professionProgress.get(profession.id) ?? { level: 1, xp: 0 };
    const beforeLevel = progress.level;
    progress.xp += amount;
    const levelData = professionLevelForXp(profession, progress.xp);
    progress.level = levelData.level;
    this.professionProgress.set(profession.id, progress);

    return levelData.level > beforeLevel ? levelData : undefined;
  }

  private rememberQuest(quest: RuntimeQuest) {
    if (!quest.npcId) return undefined;

    const npc = npcs.find((item) => item.id === quest.npcId);
    const memory = this.npcMemory.get(quest.npcId);
    if (!npc || !memory) return undefined;

    const beforeTier = relationshipTier(memory.relationship).label;
    const reaction = this.activeProfession ? npc.professionReactions[this.activeProfession.id] : undefined;
    memory.relationship = Phaser.Math.Clamp(memory.relationship + 4, 0, 100);
    memory.completedQuestIds.push(quest.id);
    memory.lastMemory = reaction ?? `${quest.label} görevini hatırlıyor.`;
    const afterTier = relationshipTier(memory.relationship).label;
    return afterTier !== beforeTier ? { npcName: npc.name, tier: afterTier } : undefined;
  }

  private advanceTime(minutes: number) {
    this.minute += minutes;
    while (this.minute >= 60) {
      this.hour += 1;
      this.minute -= 60;
    }

    if (this.hour >= 24 || this.stats.energy <= 0) {
      this.day += 1;
      this.hour = 8;
      this.minute = 0;
      this.stats.energy = Phaser.Math.Clamp(this.stats.energy + 46, 0, 100);
      this.stats.mood = Phaser.Math.Clamp(this.stats.mood + 4, 0, 100);
      this.dailyGoals = createDailyGoals(this.day);
      this.setMessage(`Yeni gün başladı. Gün ${this.day}: hedeflerini seç.`);
    }
  }

  private pulsePlayer(symbol: string) {
    const marker = this.player.list[1] as Phaser.GameObjects.Text;
    marker.setText(symbol).setAlpha(1).setY(-42);
    this.tweens.add({
      targets: marker,
      y: -68,
      alpha: 0,
      duration: 720,
      ease: "Sine.easeOut",
    });
  }

  private refreshHud() {
    const time = `${String(this.hour).padStart(2, "0")}:${String(this.minute).padStart(2, "0")}`;
    const nameLabel = this.character ? `${this.character.name}   ` : "";
    this.statusText.setText(`${nameLabel}Gün ${this.day}   ${time}   Para ${this.stats.money}`);
    this.statBars.forEach((bar, need) => {
      bar.width = Phaser.Math.Clamp(this.stats[need], 0, 100) * 0.82;
    });
  }

  private refreshMenu() {
    if (this.menu === "tasks") {
      this.menuTitle.setText("Görevler");
      const decorScore = computeDecorScore([...this.ownedDecorIds], this.activeProfession?.id);
      const intro = this.activeInclination
        ? `Yol: ${this.activeInclination.name}\nİtibar: ${[...this.reputationTags].join(", ") || "-"}\nDekor puanı: ${decorScore} (${this.ownedDecorIds.size}/${decorItems.length})\n\n`
        : "Yolunu seçmen bekleniyor.\n\n";
      const activeChainQuestId = resolveActiveChainQuestId(
        this.activeProfession?.questChainIds,
        Object.fromEntries(this.quests.map((quest) => [quest.id, quest.progress])),
      );
      const relevantQuests = this.quests.filter((quest) => {
        if (!quest.professionTags || quest.professionTags.length === 0) return true;
        if (!this.activeProfession || !quest.professionTags.includes(this.activeProfession.id)) return false;
        const isChainQuest = this.activeProfession.questChainIds.includes(quest.id);
        return !isChainQuest || quest.progress >= quest.target || quest.id === activeChainQuestId;
      });
      this.menuBody.setText(intro + this.dailyGoalsText() + "\n\n" + relevantQuests.map((quest) => {
        const done = quest.progress >= quest.target ? "✓" : "•";
        return `${done} ${quest.label}\n  ${quest.progress}/${quest.target}`;
      }).join("\n\n"));
    }

    if (this.menu === "jobs") {
      this.menuTitle.setText("Meslekler");
      this.menuBody.setText(professions.map((profession) => {
        const mentor = npcs.find((npc) => npc.id === profession.mentorNpcId)?.name ?? "Mentor";
        if (this.activeProfession?.id !== profession.id) {
          return `• ${profession.name}\n  ${mentor} / ${profession.miniGame}`;
        }

        const progress = this.professionProgress.get(profession.id) ?? { level: 1, xp: 0 };
        const levelData = professionLevelForXp(profession, progress.xp);
        const nextLevel = profession.levels.find((level) => level.level === levelData.level + 1);
        const nextLine = nextLevel
          ? `Sonraki: ${nextLevel.title} (${progress.xp}/${nextLevel.xpToNext} XP)`
          : "En üst seviyedesin.";
        return `★ ${profession.name} — ${levelData.title} (Sv. ${levelData.level})\n  ${mentor} / ${profession.miniGame}\n  ${nextLine}`;
      }).join("\n\n"));
    }

    if (this.menu === "phone") {
      this.menuTitle.setText("Telefon");
      const visibleNpcs = npcs.slice(0, 5);
      const hiddenCount = Math.max(0, npcs.length - visibleNpcs.length);
      const body = visibleNpcs.map((npc) => {
        const memory = this.npcMemory.get(npc.id);
        const baseRelationship = memory?.relationship ?? npc.relationship;
        const displayRelationship = baseRelationship + this.stats.social;
        const tier = relationshipTier(baseRelationship);
        const reaction = this.getNpcReaction(npc, memory);
        return `${npc.name} — ${tier.label} (${displayRelationship})\n"${reaction}"`;
      }).join("\n\n");
      this.menuBody.setText(hiddenCount > 0 ? `${body}\n\n+${hiddenCount} kişi daha` : body);
    }
  }

  private getNpcReaction(npc: NpcData, memory?: NpcMemory) {
    if (memory?.lastMemory) return memory.lastMemory;
    if (this.activeProfession && npc.professionReactions[this.activeProfession.id]) {
      return npc.professionReactions[this.activeProfession.id];
    }
    if (this.activeInclination) {
      return `${this.activeInclination.name} tarafını fark ettim.`;
    }
    return npc.personality;
  }

  private dailyGoalsText() {
    const goals = [
      { label: "1 lokasyon aksiyonu yap", value: this.dailyGoals.locationActions, target: 1 },
      { label: "1 NPC ile konus", value: this.dailyGoals.npcTalks, target: 1 },
      { label: "1 mini oyun kazan", value: this.dailyGoals.miniGameWins, target: 1 },
      { label: "1 gorev tamamla", value: this.dailyGoals.questsCompleted, target: 1 },
    ];
    return "Bugunku hedefler\n" + goals.map((goal) => {
      const done = goal.value >= goal.target ? "[x]" : "[ ]";
      return `${done} ${goal.label} (${Math.min(goal.value, goal.target)}/${goal.target})`;
    }).join("\n");
  }

  private saveGame() {
    const data: SaveData = {
      version: 1,
      day: this.day,
      hour: this.hour,
      minute: this.minute,
      stats: this.stats,
      selectedLocationId: this.selectedLocationId,
      activeInclinationId: this.activeInclination?.id,
      activeProfessionId: this.activeProfession?.id,
      reputationTags: [...this.reputationTags],
      questProgress: Object.fromEntries(this.quests.map((quest) => [quest.id, quest.progress])),
      npcMemory: Object.fromEntries(this.npcMemory),
      dailyGoals: this.dailyGoals,
      professionProgress: Object.fromEntries(this.professionProgress),
      character: this.character,
      ownedDecorIds: [...this.ownedDecorIds],
    };

    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // Saving can fail in private browsing or restricted webviews; gameplay continues.
    }
  }

  private loadGame() {
    let data: SaveData | undefined;
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      data = raw ? JSON.parse(raw) as SaveData : undefined;
    } catch {
      data = undefined;
    }
    if (!data || data.version !== 1) return;

    this.day = data.day;
    this.hour = data.hour;
    this.minute = data.minute;
    this.stats = data.stats;
    this.selectedLocationId = locations.some((location) => location.id === data.selectedLocationId) ? data.selectedLocationId : "home";
    this.activeInclination = inclinations.find((inclination) => inclination.id === data.activeInclinationId);
    this.activeProfession = professions.find((profession) => profession.id === data.activeProfessionId);
    this.reputationTags = new Set(data.reputationTags);
    this.dailyGoals = ensureDailyGoals(data);
    this.quests = initialQuests.map((quest) => ({
      ...quest,
      progress: Phaser.Math.Clamp(data?.questProgress[quest.id] ?? 0, 0, quest.target),
    }));

    Object.entries(data.npcMemory).forEach(([npcId, memory]) => {
      if (this.npcMemory.has(npcId)) {
        this.npcMemory.set(npcId, memory);
      }
    });

    this.professionProgress = new Map(Object.entries(data.professionProgress ?? {}));
    this.character = data.character;
    this.ownedDecorIds = new Set(data.ownedDecorIds ?? []);
  }

  private setActionLabel(text: string) {
    const label = this.actionButton.getByName("label") as Phaser.GameObjects.Text;
    label.setText(text);
  }

  private setEnterLabel(text: string) {
    const label = this.enterButton.getByName("label") as Phaser.GameObjects.Text;
    label.setText(text);
  }

  private setMessage(message: string) {
    this.messageText?.setText(message);
    this.refreshHud();
    this.refreshMenu();
  }

  private colorForNeed(need: NeedKey) {
    return {
      energy: 0x5fd7ff,
      mood: 0xff6f91,
      skill: 0xffcf66,
      social: 0x70e08a,
    }[need];
  }

  private textStyle(size: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Consolas, monospace",
      fontSize: `${size}px`,
      color,
      stroke: "#171021",
      strokeThickness: size > 16 ? 3 : 2,
    };
  }
}

class InteriorScene extends Phaser.Scene {
  private location?: LocationData;
  private player!: Phaser.GameObjects.Container;
  private localNpcSprites: Array<{ npc: NpcData; sprite: Phaser.GameObjects.Image }> = [];
  private hotspotSprites: Array<{ hotspot: InteriorHotspot; marker: Phaser.GameObjects.Container }> = [];
  private promptText!: Phaser.GameObjects.Text;
  private dialogueBox!: Phaser.GameObjects.Container;
  private dialogueText!: Phaser.GameObjects.Text;
  private activeNpc?: NpcData;
  private activeHotspot?: InteriorHotspot;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<"up" | "down" | "left" | "right" | "interact", Phaser.Input.Keyboard.Key>;
  private roomBounds = new Phaser.Geom.Rectangle(230, 118, 820, 500);

  constructor() {
    super("interior");
  }

  init(data: { locationId?: string }) {
    this.location = locations.find((location) => location.id === data.locationId) ?? locations[0];
  }

  create() {
    this.localNpcSprites = [];
    this.hotspotSprites = [];
    this.activeNpc = undefined;
    this.activeHotspot = undefined;
    this.cameras.main.setBackgroundColor("#05070f");
    this.drawRoomShell();
    this.drawFurniture();
    this.drawHotspots();
    this.drawInteriorNpcs();
    this.createInteriorPlayer();
    this.drawInteriorHud();
    this.createDialogueUi();
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
    }) as Record<"up" | "down" | "left" | "right" | "interact", Phaser.Input.Keyboard.Key>;
  }

  update(_: number, delta: number) {
    if (!this.player) return;

    const speed = 190;
    const step = speed * (delta / 1000);
    const left = this.cursors?.left.isDown || this.wasd?.left.isDown;
    const right = this.cursors?.right.isDown || this.wasd?.right.isDown;
    const up = this.cursors?.up.isDown || this.wasd?.up.isDown;
    const down = this.cursors?.down.isDown || this.wasd?.down.isDown;
    let vx = 0;
    let vy = 0;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const length = Math.hypot(vx, vy);
      vx /= length;
      vy /= length;
      this.player.x = Phaser.Math.Clamp(this.player.x + vx * step, this.roomBounds.left + 26, this.roomBounds.right - 26);
      this.player.y = Phaser.Math.Clamp(this.player.y + vy * step, this.roomBounds.top + 52, this.roomBounds.bottom - 22);
      this.player.setScale(vx < 0 ? -1 : vx > 0 ? 1 : this.player.scaleX, 1);
    }

    this.updateInteractionPrompt();
    if (this.wasd && Phaser.Input.Keyboard.JustDown(this.wasd.interact)) {
      if (this.activeNpc) {
        this.showDialogue(this.activeNpc);
      } else if (this.activeHotspot) {
        this.useHotspot(this.activeHotspot);
      }
    }
  }

  private drawRoomShell() {
    const floorColor = this.floorColorForLocation();
    this.add.rectangle(640, 360, 1280, 720, 0x05070f);
    this.add.rectangle(640, 368, 880, 560, 0x202436).setStrokeStyle(4, 0xe7e9ff, 0.9);
    this.add.rectangle(640, 368, 820, 500, floorColor);

    for (let x = 250; x <= 1030; x += 40) {
      this.add.rectangle(x, 368, 2, 500, 0x141827, 0.28);
    }
    for (let y = 130; y <= 610; y += 40) {
      this.add.rectangle(640, y, 820, 2, 0x141827, 0.28);
    }

    this.add.rectangle(640, 104, 880, 44, 0x30364c);
    this.add.text(236, 86, this.location?.name ?? "İç Mekan", this.textStyle(26, "#fff4de"));
    this.add.text(238, 122, this.location?.subtitle ?? "", this.textStyle(15, "#dce6ff"));
  }

  private drawFurniture() {
    const id = this.location?.id ?? "home";

    if (id === "home") {
      this.drawBed(850, 210);
      this.drawTable(470, 300);
      this.drawPlant(330, 210);
      this.drawShelf(790, 420);
      this.drawRug(600, 438, 180, 96, 0xb56b72);
      this.drawHomeDecor();
      return;
    }

    if (id === "cafe") {
      this.drawCounter(370, 210, 280);
      this.drawTable(550, 360);
      this.drawTable(750, 360);
      this.drawShelf(910, 220);
      this.drawPlant(320, 470);
      this.drawRug(650, 500, 260, 72, 0x9b5a37);
      return;
    }

    if (id === "hospital") {
      this.drawBed(820, 230);
      this.drawCounter(430, 230, 220);
      this.drawMedicalMachine(560, 420);
      this.drawPlant(930, 460);
      return;
    }

    if (id === "mall") {
      this.drawShelf(360, 220);
      this.drawShelf(520, 220);
      this.drawTable(710, 340);
      this.drawCounter(850, 220, 200);
      this.drawRug(620, 500, 320, 80, 0x5868b6);
      return;
    }

    if (id === "business" || id === "school") {
      this.drawDesk(420, 250);
      this.drawDesk(640, 250);
      this.drawDesk(860, 250);
      this.drawShelf(900, 430);
      this.drawPlant(340, 450);
      return;
    }

    this.drawTable(480, 320);
    this.drawTable(740, 320);
    this.drawPlant(360, 470);
    this.drawRug(640, 480, 260, 90, 0x4d7f64);
  }

  private drawHomeDecor() {
    const save = this.readSave();
    const owned = new Set(save?.ownedDecorIds ?? []);

    decorItems.forEach((item) => {
      if (owned.has(item.id)) {
        this.renderDecorIcon(item);
        this.add.text(item.x, item.y + 40, item.name, this.textStyle(11, "#ffeec9")).setOrigin(0.5);
      } else {
        this.add.rectangle(item.x, item.y, 60, 60, 0x000000, 0).setStrokeStyle(2, 0x435078, 0.5);
        this.add.text(item.x, item.y, "+", this.textStyle(20, "#435078")).setOrigin(0.5);
        this.add.text(item.x, item.y + 40, item.name, this.textStyle(10, "#5a6690")).setOrigin(0.5);
      }
    });
  }

  private renderDecorIcon(item: DecorItemData) {
    switch (item.icon) {
      case "poster":
        this.drawPosterIcon(item.x, item.y);
        return;
      case "desk":
        this.drawDeskIcon(item.x, item.y);
        return;
      case "coffee":
        this.drawCoffeeIcon(item.x, item.y);
        return;
      case "shelf":
        this.drawShelfIcon(item.x, item.y);
        return;
      case "plant":
        this.drawPlantIcon(item.x, item.y);
        return;
      case "lamp":
        this.drawLampIcon(item.x, item.y);
        return;
      case "aquarium":
        this.drawAquariumIcon(item.x, item.y);
        return;
      case "music":
        this.drawMusicIcon(item.x, item.y);
        return;
    }
  }

  private drawPosterIcon(x: number, y: number) {
    this.add.rectangle(x, y, 46, 60, 0x3a2b20).setStrokeStyle(2, 0x1b1310);
    this.add.rectangle(x, y, 36, 48, 0x9fd7e9);
    this.add.circle(x - 6, y - 8, 6, 0xffcf66);
  }

  private drawDeskIcon(x: number, y: number) {
    this.add.rectangle(x, y + 14, 60, 26, 0x54657c).setStrokeStyle(2, 0x1b2230);
    this.add.rectangle(x, y - 12, 30, 22, 0x101827).setStrokeStyle(2, 0x9fd7e9, 0.8);
    this.add.rectangle(x, y - 12, 24, 14, 0x1f3355);
  }

  private drawCoffeeIcon(x: number, y: number) {
    this.add.rectangle(x, y + 10, 56, 30, 0x6f4a3a).setStrokeStyle(2, 0x211827);
    this.add.rectangle(x, y - 10, 26, 20, 0xe9edf7).setStrokeStyle(2, 0x2b2030);
    this.add.rectangle(x, y - 2, 16, 8, 0xc99663);
  }

  private drawShelfIcon(x: number, y: number) {
    this.add.rectangle(x, y, 46, 60, 0x6c4a35).setStrokeStyle(2, 0x211827);
    this.add.rectangle(x, y - 16, 36, 6, 0xc18b58);
    this.add.rectangle(x, y + 16, 36, 6, 0xc18b58);
    this.add.rectangle(x - 12, y, 10, 14, 0x8ecae6);
    this.add.rectangle(x + 12, y, 10, 14, 0xf4a261);
  }

  private drawPlantIcon(x: number, y: number) {
    this.add.rectangle(x, y + 18, 22, 20, 0x8a5a36).setStrokeStyle(2, 0x211827);
    this.add.circle(x - 10, y - 4, 14, 0x3fa66a);
    this.add.circle(x + 8, y - 10, 15, 0x4fc27a);
    this.add.circle(x, y, 13, 0x2f8f5b);
  }

  private drawLampIcon(x: number, y: number) {
    this.add.rectangle(x, y + 20, 4, 36, 0x2b2030);
    this.add.rectangle(x, y - 4, 10, 10, 0x2b2030);
    this.add.circle(x, y - 22, 16, 0xffdd8a, 0.9).setStrokeStyle(2, 0x8a6a2a);
  }

  private drawAquariumIcon(x: number, y: number) {
    this.add.rectangle(x, y, 60, 40, 0x102030, 0.6).setStrokeStyle(2, 0x1b2230);
    this.add.rectangle(x, y + 14, 60, 10, 0xc9a227, 0.6);
    this.add.circle(x - 10, y - 4, 5, 0xff6f91);
    this.add.circle(x + 8, y + 2, 4, 0xffcf66);
  }

  private drawMusicIcon(x: number, y: number) {
    this.add.rectangle(x, y, 40, 50, 0x202942).setStrokeStyle(2, 0x1b2230);
    this.add.circle(x, y - 10, 10, 0x0f1424).setStrokeStyle(2, 0x6f7eb5);
    this.add.circle(x, y + 14, 10, 0x0f1424).setStrokeStyle(2, 0x6f7eb5);
  }

  private drawHotspots() {
    this.getHotspots().forEach((hotspot) => {
      const marker = this.add.container(hotspot.x, hotspot.y).setDepth(12);
      const glow = this.add.circle(0, 0, 21, 0xffcf66, 0.18);
      const ring = this.add.circle(0, 0, 13, 0xffcf66, 0.94).setStrokeStyle(2, 0x221423, 0.85);
      const icon = this.add.text(0, -1, "!", this.textStyle(16, "#221423")).setOrigin(0.5);
      marker.add([glow, ring, icon]);
      this.tweens.add({
        targets: glow,
        scale: 1.2,
        alpha: 0.08,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.hotspotSprites.push({ hotspot, marker });
    });
  }

  private drawInteriorNpcs() {
    const locals = npcs.filter((npc) => npc.locationId === this.location?.id).slice(0, 3);
    locals.forEach((npc, index) => {
      const x = 510 + index * 120;
      const y = 500;
      const sprite = this.add.image(x, y, ["npc-a", "npc-b", "npc-c"][index % 3]).setScale(1.45).setTint(toColor(npc.tint));
      this.add.text(x, y + 54, npc.name, this.textStyle(14, "#ffeec9")).setOrigin(0.5);
      this.localNpcSprites.push({ npc, sprite });
    });
  }

  private createInteriorPlayer() {
    this.player = this.add.container(420, 506);
    const shadow = this.add.ellipse(0, 34, 34, 10, 0x000000, 0.25);
    const sprite = this.add.image(0, 0, "hero").setScale(1.45);
    const playerName = this.readSave()?.character?.name ?? "Sen";
    const name = this.add.text(0, 54, playerName, this.textStyle(14, "#fff4de")).setOrigin(0.5);
    this.player.add([shadow, sprite, name]);
  }

  private drawInteriorHud() {
    const back = this.add.container(1080, 650);
    const bg = this.add.rectangle(0, 0, 250, 56, 0xffcf66).setStrokeStyle(3, 0x4a2c2a, 0.9);
    const label = this.add.text(0, 0, "Şehre dön", this.textStyle(18, "#221423")).setOrigin(0.5);
    back.add([bg, label]);
    back.setSize(250, 56);
    back.setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.scene.start("pixellife"));

    this.add.text(240, 644, "WASD veya ok tuşlarıyla dolaş. Gerçek tileset geldiğinde sınırlar tile collision'a bağlanacak.", {
      ...this.textStyle(14, "#dce6ff"),
      wordWrap: { width: 620 },
    });
  }

  private createDialogueUi() {
    this.promptText = this.add.text(640, 560, "", this.textStyle(16, "#ffcf66")).setOrigin(0.5).setDepth(20);

    this.dialogueBox = this.add.container(640, 536).setDepth(30).setVisible(false);
    const bg = this.add.rectangle(0, 0, 760, 124, 0x080d1d, 0.96).setStrokeStyle(2, 0x6f7eb5, 0.7);
    this.dialogueText = this.add.text(-350, -46, "", {
      ...this.textStyle(16, "#fff4de"),
      wordWrap: { width: 700 },
      lineSpacing: 6,
    });
    const hint = this.add.text(350, 44, "E", this.textStyle(14, "#ffcf66")).setOrigin(1, 0.5);
    this.dialogueBox.add([bg, this.dialogueText, hint]);
  }

  private updateInteractionPrompt() {
    const nearest = this.localNpcSprites
      .map((entry) => ({
        ...entry,
        distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, entry.sprite.x, entry.sprite.y),
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    if (nearest && nearest.distance < 92) {
      this.activeNpc = nearest.npc;
      this.activeHotspot = undefined;
      this.promptText.setText(`E: ${nearest.npc.name} ile konuş`);
      return;
    }

    const nearestHotspot = this.hotspotSprites
      .map((entry) => ({
        ...entry,
        distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, entry.hotspot.x, entry.hotspot.y),
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    if (nearestHotspot && nearestHotspot.distance < nearestHotspot.hotspot.radius) {
      this.activeNpc = undefined;
      this.activeHotspot = nearestHotspot.hotspot;
      this.promptText.setText(`E: ${nearestHotspot.hotspot.label}`);
      return;
    }

    this.activeNpc = undefined;
    this.activeHotspot = undefined;
    this.promptText.setText("");
  }

  private showDialogue(npc: NpcData) {
    const save = this.readSave();
    if (save) {
      ensureDailyGoals(save).npcTalks += 1;
      this.writeSave(save);
    }
    const professionId = save?.activeProfessionId;
    const memory = save?.npcMemory[npc.id];
    const remembered = memory?.lastMemory;
    const reaction = remembered ?? (professionId ? npc.professionReactions[professionId] : undefined) ?? npc.personality;
    const relationship = memory?.relationship ?? npc.relationship;
    const tier = relationshipTier(relationship);
    this.dialogueText.setText(`${npc.name} (${npc.role}) • ${tier.label}\n${reaction}\nİlişki: ${relationship}/100`);
    this.dialogueBox.setVisible(true);
    this.time.delayedCall(4200, () => this.dialogueBox.setVisible(false));
  }

  private useHotspot(hotspot: InteriorHotspot) {
    if (hotspot.shop) {
      this.openDecorShop();
      return;
    }
    if (hotspot.miniGame) {
      this.scene.start("minigame", { locationId: this.location?.id ?? "home", hotspot });
      return;
    }

    const save = this.readSave();
    let completedQuest: RuntimeQuest | undefined;
    let leveledUp: ProfessionLevelData | undefined;
    let relationshipTierUp: { npcName: string; tier: string } | undefined;
    if (save) {
      ({ completedQuest, leveledUp, relationshipTierUp } = applyHotspotToSave(save, hotspot));
      this.writeSave(save);
    }

    const changes = Object.entries(hotspot.delta)
      .filter(([, value]) => value !== 0)
      .map(([key, value]) => `${value > 0 ? "+" : ""}${value} ${key}`)
      .join(", ");
    const questLine = completedQuest ? `\nGorev tamamlandi: ${completedQuest.label}` : "";
    const levelLine = leveledUp ? `\nSeviye atladin: ${leveledUp.title}!` : "";
    const tierLine = relationshipTierUp ? `\n${relationshipTierUp.npcName} ile artik ${relationshipTierUp.tier} oldunuz!` : "";
    this.dialogueText.setText(`${hotspot.label}\n${hotspot.message}${changes ? `\nEtki: ${changes}` : ""}${questLine}${levelLine}${tierLine}`);
    this.dialogueBox.setVisible(true);
    this.time.delayedCall(3600, () => this.dialogueBox.setVisible(false));
  }

  private openDecorShop() {
    const save = this.readSave();
    const owned = new Set(save?.ownedDecorIds ?? []);
    const money = save?.stats.money ?? 0;

    const overlay = this.add.container(640, 360).setDepth(50);
    const shade = this.add.rectangle(0, 0, 1280, 720, 0x050814, 0.86);
    const panel = this.add.rectangle(0, 0, 940, 580, 0x0b1020, 0.98).setStrokeStyle(2, 0x6f7eb5, 0.72);
    const title = this.add.text(-430, -270, "Dekor Dükkanı", this.textStyle(26, "#ffcf66"));
    const moneyText = this.add.text(-430, -232, `Paran: ${money}`, this.textStyle(15, "#dce6ff"));
    overlay.add([shade, panel, title, moneyText]);

    decorItems.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = -220 + col * 440;
      const y = -160 + row * 120;
      const isOwned = owned.has(item.id);

      const card = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, 410, 104, 0x141d35).setStrokeStyle(1, 0x6f7eb5, 0.6);
      const name = this.add.text(-190, -38, item.name, this.textStyle(16, "#fff4de"));
      const info = this.add.text(-190, -10, `${item.cost} para  •  +${item.scoreValue} dekor puanı`, this.textStyle(12, "#b9c6ef"));
      const status = this.add.text(-190, 16, isOwned ? "Sahipsin" : "Satın al", this.textStyle(14, isOwned ? "#70e08a" : "#ffcf66"));
      card.add([bg, name, info, status]);
      card.setSize(410, 104);
      if (!isOwned) {
        card.setInteractive({ useHandCursor: true });
        card.on("pointerdown", () => this.buyDecorItem(item, overlay));
      }
      overlay.add(card);
    });

    const close = this.add.container(0, 268);
    const closeBg = this.add.rectangle(0, 0, 200, 50, 0xffcf66).setStrokeStyle(3, 0x22314a, 0.9);
    const closeLabel = this.add.text(0, 0, "Kapat", this.textStyle(16, "#221423")).setOrigin(0.5);
    close.add([closeBg, closeLabel]);
    close.setSize(200, 50);
    close.setInteractive({ useHandCursor: true });
    close.on("pointerdown", () => overlay.destroy());
    overlay.add(close);
  }

  private buyDecorItem(item: DecorItemData, overlay: Phaser.GameObjects.Container) {
    const save = this.readSave();
    if (!save) return;

    if (save.stats.money < item.cost) {
      this.dialogueText.setText(`${item.name} için yeterli paran yok. Gereken: ${item.cost}`);
      this.dialogueBox.setVisible(true);
      this.time.delayedCall(2200, () => this.dialogueBox.setVisible(false));
      return;
    }

    save.stats.money -= item.cost;
    save.ownedDecorIds = [...(save.ownedDecorIds ?? []), item.id];
    this.writeSave(save);
    overlay.destroy();
    this.openDecorShop();
  }

  private getHotspots(): InteriorHotspot[] {
    const id = this.location?.id ?? "home";
    const save = this.readSave();
    const ownedDecorIds = save?.ownedDecorIds ?? [];
    const decorScore = computeDecorScore(ownedDecorIds, save?.activeProfessionId);
    const decorStatusMessage = `Sahip oldugun dekor: ${ownedDecorIds.length}/${decorItems.length}. Dekor puanin: ${decorScore}.`;
    const questProgress = save?.questProgress ?? {};
    const chainQuestFor = (professionId: string) =>
      resolveActiveChainQuestId(professions.find((item) => item.id === professionId)?.questChainIds, questProgress);
    const baristaQuestId = chainQuestFor("barista");
    const developerQuestId = chainQuestFor("developer");
    const photographerQuestId = chainQuestFor("photographer");
    const doctorQuestId = chainQuestFor("doctor");
    const designerQuestId = chainQuestFor("interior_designer");
    const common: InteriorHotspot[] = [
      {
        id: "notice",
        label: "Duyuru panosuna bak",
        x: 965,
        y: 158,
        radius: 86,
        message: "Sehirde bugunku firsatlari kontrol ettin.",
        delta: { social: 1 },
        minutes: 5,
      },
    ];

    const byLocation: Record<string, InteriorHotspot[]> = {
      home: [
        { id: "rest", label: "Dinlen", x: 850, y: 258, radius: 92, message: "Kisa bir mola enerjini topladi.", delta: { energy: 16, mood: 2 }, minutes: 40 },
        { id: "plan", label: "Gunluk plan yap", x: 470, y: 300, radius: 88, message: "Yapilacaklari siraya koydun.", delta: { skill: 2 }, minutes: 20, questId: "quest_home_settle" },
        { id: "decor-status", label: "Dekoru incele", x: 700, y: 500, radius: 90, message: decorStatusMessage, delta: {}, minutes: 5 },
      ],
      cafe: [
        { id: "order", label: "Kahve hazirla", x: 370, y: 210, radius: 110, message: "Tezgahta hizli servis yaptin.", delta: { money: 12, energy: -4, social: 1 }, minutes: 25, questId: baristaQuestId, miniGame: "timing", workXp: 15 },
        { id: "chat", label: "Masada sohbet et", x: 650, y: 360, radius: 140, message: "Musterilerle kisa bir sohbet ettin.", delta: { social: 3, mood: 1 }, minutes: 20 },
      ],
      hospital: [
        { id: "checkup", label: "Kontrol yap", x: 560, y: 420, radius: 100, message: "Cihazlari kontrol edip not aldin.", delta: { skill: 3, energy: -3, money: 8 }, minutes: 30, questId: doctorQuestId, workXp: 16 },
        { id: "care", label: "Hasta ile ilgilen", x: 820, y: 230, radius: 110, message: "Bir hastaya yardim ettin.", delta: { social: 2, mood: 2 }, minutes: 25, questId: "quest_hospital_help_arda", miniGame: "triage" },
      ],
      mall: [
        { id: "browse", label: "Magazalari gez", x: 450, y: 220, radius: 100, message: "Yeni urunleri inceledin.", delta: { mood: 2, money: -8 }, minutes: 20, questId: "quest_mall_first_style" },
        { id: "shop-work", label: "Reyon duzenle", x: 850, y: 220, radius: 100, message: "Reyonu toparladin.", delta: { money: 10, energy: -4 }, minutes: 25 },
        { id: "style-consult", label: "Vitrin danismanligi yap", x: 450, y: 480, radius: 100, message: "Vitrin duzenini yeniden kurguladin.", delta: { money: 16, skill: 2, energy: -5 }, minutes: 30, questId: designerQuestId, workXp: 16 },
        { id: "decor-shop", label: "Dekor satin al", x: 850, y: 480, radius: 100, message: "", delta: {}, minutes: 0, shop: true },
      ],
      business: [
        { id: "code", label: "Bilgisayarda calis", x: 640, y: 250, radius: 130, message: "Odaklanip is cikardin.", delta: { skill: 4, money: 14, energy: -6 }, minutes: 35, questId: developerQuestId, miniGame: "choice", workXp: 18 },
      ],
      school: [
        { id: "study", label: "Ders calis", x: 640, y: 250, radius: 130, message: "Yeni bir konu ogrendin.", delta: { skill: 4, energy: -4 }, minutes: 35, questId: "quest_school_first_lesson", workXp: 14 },
      ],
      park: [
        { id: "photo-shoot", label: "Fotograf cek", x: 600, y: 210, radius: 120, message: "Sehrin guzel bir anini kadrajladin.", delta: { money: 12, mood: 3, energy: -5 }, minutes: 30, questId: photographerQuestId, workXp: 15 },
      ],
    };

    return [...(byLocation[id] ?? []), ...common];
  }

  private readSave(): SaveData | undefined {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) as SaveData : undefined;
    } catch {
      return undefined;
    }
  }

  private writeSave(save: SaveData) {
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      // Saving can fail in private browsing or restricted webviews; gameplay continues.
    }
  }

  private floorColorForLocation() {
    const id = this.location?.id;
    if (id === "hospital") return 0xbfd9ec;
    if (id === "home") return 0xd8c48b;
    if (id === "cafe") return 0xc99663;
    if (id === "mall") return 0xc8c5db;
    if (id === "business" || id === "school") return 0xaeb8cf;
    return 0x8eb18c;
  }

  private drawTable(x: number, y: number) {
    this.add.rectangle(x, y, 118, 72, 0x8b5c3c).setStrokeStyle(3, 0x2b2030);
    this.add.rectangle(x, y - 8, 92, 46, 0xb98552);
    this.add.rectangle(x - 52, y + 52, 24, 32, 0x42536a);
    this.add.rectangle(x + 52, y + 52, 24, 32, 0x42536a);
  }

  private drawDesk(x: number, y: number) {
    this.add.rectangle(x, y, 140, 56, 0x54657c).setStrokeStyle(3, 0x1b2230);
    this.add.rectangle(x, y - 34, 54, 34, 0xc9e5ff).setStrokeStyle(2, 0x1b2230);
    this.add.rectangle(x, y + 52, 32, 38, 0x33485f);
  }

  private drawCounter(x: number, y: number, width: number) {
    this.add.rectangle(x, y, width, 64, 0x6f4a3a).setStrokeStyle(3, 0x211827);
    this.add.rectangle(x, y - 22, width - 20, 18, 0xf0c47b);
    this.add.rectangle(x + width / 2 - 46, y - 50, 44, 42, 0x9fd7e9).setStrokeStyle(2, 0x1b2230);
  }

  private drawShelf(x: number, y: number) {
    this.add.rectangle(x, y, 92, 170, 0x6c4a35).setStrokeStyle(3, 0x211827);
    for (let i = -52; i <= 52; i += 52) {
      this.add.rectangle(x, y + i, 78, 8, 0xc18b58);
      this.add.rectangle(x - 22, y + i - 18, 22, 24, 0x8ecae6);
      this.add.rectangle(x + 22, y + i - 18, 22, 24, 0xf4a261);
    }
  }

  private drawBed(x: number, y: number) {
    this.add.rectangle(x, y, 170, 96, 0x5a6d91).setStrokeStyle(3, 0x1b2230);
    this.add.rectangle(x - 38, y - 16, 82, 44, 0xe9edf7);
    this.add.rectangle(x + 38, y + 14, 84, 52, 0x8fb4e8);
  }

  private drawPlant(x: number, y: number) {
    this.add.rectangle(x, y + 34, 38, 36, 0x8a5a36).setStrokeStyle(2, 0x211827);
    this.add.circle(x - 18, y, 24, 0x3fa66a);
    this.add.circle(x + 14, y - 8, 26, 0x4fc27a);
    this.add.circle(x + 2, y + 10, 24, 0x2f8f5b);
  }

  private drawRug(x: number, y: number, width: number, height: number, color: number) {
    this.add.rectangle(x, y, width, height, color).setStrokeStyle(3, 0x2b2030);
    this.add.rectangle(x, y, width - 28, height - 24, 0xffffff, 0.12);
  }

  private drawMedicalMachine(x: number, y: number) {
    this.add.rectangle(x, y, 94, 126, 0xd9e4ef).setStrokeStyle(3, 0x1b2230);
    this.add.rectangle(x, y - 34, 62, 34, 0x62c7d9).setStrokeStyle(2, 0x1b2230);
    this.add.rectangle(x - 26, y + 34, 18, 38, 0x6f7b91);
    this.add.rectangle(x + 26, y + 34, 18, 38, 0x6f7b91);
  }

  private textStyle(size: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Consolas, monospace",
      fontSize: `${size}px`,
      color,
      stroke: "#171021",
      strokeThickness: size > 16 ? 3 : 2,
    };
  }
}

class MiniGameScene extends Phaser.Scene {
  private locationId = "home";
  private hotspot?: InteriorHotspot;
  private cursor?: Phaser.GameObjects.Rectangle;
  private resultText!: Phaser.GameObjects.Text;
  private actionKey?: Phaser.Input.Keyboard.Key;
  private choiceKeys: Phaser.Input.Keyboard.Key[] = [];
  private cursorX = 330;
  private direction = 1;
  private finished = false;
  private correctChoiceIndex = 1;
  private readonly bar = { x: 330, y: 386, width: 620, height: 34 };
  private readonly target = { x: 626, width: 116 };

  constructor() {
    super("minigame");
  }

  init(data: { locationId?: string; hotspot?: InteriorHotspot }) {
    this.locationId = data.locationId ?? "home";
    this.hotspot = data.hotspot;
    this.finished = false;
    this.cursorX = this.bar.x;
    this.direction = 1;
    this.actionKey = undefined;
    this.choiceKeys = [];
    this.correctChoiceIndex = 1;
  }

  create() {
    this.cameras.main.setBackgroundColor("#060817");
    this.add.rectangle(640, 360, 1280, 720, 0x060817);
    this.add.rectangle(640, 360, 860, 430, 0x10172b, 0.98).setStrokeStyle(3, 0x6f7eb5, 0.72);
    this.add.text(260, 180, this.hotspot?.label ?? "Mini oyun", this.textStyle(30, "#ffcf66"));

    if (this.hotspot?.miniGame === "triage") {
      this.createTriageGame();
    } else if (this.hotspot?.miniGame === "choice") {
      this.createChoiceGame();
    } else {
      this.createTimingGame();
    }
  }

  update(_: number, delta: number) {
    if (this.finished) return;

    const step = 410 * (delta / 1000) * this.direction;
    this.cursorX += step;
    if (this.cursorX > this.bar.x + this.bar.width) {
      this.cursorX = this.bar.x + this.bar.width;
      this.direction = -1;
    }
    if (this.cursorX < this.bar.x) {
      this.cursorX = this.bar.x;
      this.direction = 1;
    }
    if (this.cursor) {
      this.cursor.x = this.cursorX;
    }

    if (this.actionKey && Phaser.Input.Keyboard.JustDown(this.actionKey)) {
      this.finishTiming();
    }
  }

  private createTimingGame() {
    this.add.text(260, 228, "Isaret sari bolgedeyken SPACE veya E tusuna bas.", {
      ...this.textStyle(17, "#dce6ff"),
      wordWrap: { width: 720 },
    });
    this.drawCafeCounter();
    this.add.rectangle(this.bar.x + this.bar.width / 2, this.bar.y, this.bar.width, this.bar.height, 0x202942)
      .setStrokeStyle(3, 0xe7e9ff, 0.74);
    this.add.rectangle(this.target.x + this.target.width / 2, this.bar.y, this.target.width, this.bar.height + 10, 0xffcf66, 0.86);
    this.cursor = this.add.rectangle(this.cursorX, this.bar.y, 16, this.bar.height + 34, 0x6fd3ff)
      .setStrokeStyle(2, 0x102030, 0.9);
    this.resultText = this.add.text(640, 492, "", this.textStyle(22, "#fff4de")).setOrigin(0.5);
    this.actionKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E).on("down", () => this.finishTiming());
    this.input.on("pointerdown", () => this.finishTiming());
  }

  private createChoiceGame() {
    this.add.text(260, 228, "Gorev panosundaki hatayi duzeltmek icin dogru komutu sec.", {
      ...this.textStyle(17, "#dce6ff"),
      wordWrap: { width: 720 },
    });
    this.drawComputerDesk();
    const options = [
      { label: "1  console.clear()", correct: false },
      { label: "2  saveGame()", correct: true },
      { label: "3  deleteCity()", correct: false },
    ];
    this.correctChoiceIndex = options.findIndex((option) => option.correct);
    options.forEach((option, index) => {
      const y = 374 + index * 54;
      const item = this.add.container(640, y);
      const bg = this.add.rectangle(0, 0, 560, 42, 0x202942).setStrokeStyle(2, 0x6f7eb5, 0.68);
      const label = this.add.text(-250, -12, option.label, this.textStyle(18, "#fff4de"));
      item.add([bg, label]);
      item.setSize(560, 42);
      item.setInteractive({ useHandCursor: true });
      item.on("pointerdown", () => this.finishChoice(index));
    });
    this.resultText = this.add.text(640, 552, "1, 2 veya 3 tusuna basabilirsin.", this.textStyle(20, "#ffcf66")).setOrigin(0.5);
    const keyCodes = [Phaser.Input.Keyboard.KeyCodes.ONE, Phaser.Input.Keyboard.KeyCodes.TWO, Phaser.Input.Keyboard.KeyCodes.THREE];
    this.choiceKeys = keyCodes.map((code, index) => {
      const key = this.input.keyboard?.addKey(code);
      key?.on("down", () => this.finishChoice(index));
      return key as Phaser.Input.Keyboard.Key;
    });
  }

  private createTriageGame() {
    this.add.text(260, 228, "Hasta notunu oku ve uygun araci sec.", {
      ...this.textStyle(17, "#dce6ff"),
      wordWrap: { width: 720 },
    });
    this.drawHospitalStation();
    this.add.rectangle(640, 336, 610, 54, 0x202942).setStrokeStyle(2, 0x9fd7e9, 0.78);
    this.add.text(360, 321, "Durum: Nabiz normal, hafif ates, once derece kontrolu gerekiyor.", this.textStyle(15, "#fff4de"));
    const options = [
      { label: "1  Termometre", correct: true },
      { label: "2  Rontgen cihazi", correct: false },
      { label: "3  Bandaj", correct: false },
    ];
    this.correctChoiceIndex = options.findIndex((option) => option.correct);
    options.forEach((option, index) => {
      const x = 430 + index * 210;
      const item = this.add.container(x, 444);
      const bg = this.add.rectangle(0, 0, 178, 72, 0xe9edf7).setStrokeStyle(3, option.correct ? 0x6f7eb5 : 0x70809a, 0.72);
      const label = this.add.text(0, -12, option.label, {
        ...this.textStyle(15, "#1b2230"),
        align: "center",
        wordWrap: { width: 150 },
      }).setOrigin(0.5);
      item.add([bg, label]);
      item.setSize(178, 72);
      item.setInteractive({ useHandCursor: true });
      item.on("pointerdown", () => this.finishChoice(index));
    });
    this.resultText = this.add.text(640, 552, "1, 2 veya 3 tusuna basabilirsin.", this.textStyle(20, "#ffcf66")).setOrigin(0.5);
    const keyCodes = [Phaser.Input.Keyboard.KeyCodes.ONE, Phaser.Input.Keyboard.KeyCodes.TWO, Phaser.Input.Keyboard.KeyCodes.THREE];
    this.choiceKeys = keyCodes.map((code, index) => {
      const key = this.input.keyboard?.addKey(code);
      key?.on("down", () => this.finishChoice(index));
      return key as Phaser.Input.Keyboard.Key;
    });
  }

  private finishTiming() {
    if (this.finished || !this.hotspot) return;

    const success = this.cursorX >= this.target.x && this.cursorX <= this.target.x + this.target.width;
    this.finishResult(success, success ? "Basarili servis!" : "Zamanlama kacirdi. Biraz pratik lazim.");
    this.cursor?.setFillStyle(success ? 0x70e08a : 0xff6f91);
  }

  private finishChoice(index: number) {
    if (this.finished || !this.hotspot) return;

    const success = index === this.correctChoiceIndex;
    const successMessage = this.hotspot?.miniGame === "triage"
      ? "Dogru arac! Hasta rahatladi."
      : "Dogru komut! Sistem kaydi duzeldi.";
    const failureMessage = this.hotspot?.miniGame === "triage"
      ? "Yanlis arac. Hasta notunu tekrar kontrol ettin."
      : "Yanlis komut. Kodu tekrar gozden gecirdin.";
    this.finishResult(success, success ? successMessage : failureMessage);
  }

  private finishResult(success: boolean, message: string) {
    if (this.finished || !this.hotspot) return;
    this.finished = true;

    const save = this.readSave();
    let completedQuest: RuntimeQuest | undefined;
    let leveledUp: ProfessionLevelData | undefined;
    let relationshipTierUp: { npcName: string; tier: string } | undefined;
    if (save) {
      if (success) {
        ({ completedQuest, leveledUp, relationshipTierUp } = applyHotspotToSave(save, this.hotspot));
      } else {
        applyHotspotToSave(save, {
          ...this.hotspot,
          delta: { energy: -2, mood: -1 },
          minutes: 8,
          questId: undefined,
          workXp: undefined,
        }, 1);
      }
      this.writeSave(save);
    }

    const questLine = completedQuest ? ` Gorev tamamlandi: ${completedQuest.label}` : "";
    const levelLine = leveledUp ? ` Seviye atladin: ${leveledUp.title}!` : "";
    const tierLine = relationshipTierUp ? ` ${relationshipTierUp.npcName} ile artik ${relationshipTierUp.tier} oldunuz!` : "";
    this.resultText.setText(success ? `${message}${questLine}${levelLine}${tierLine}` : message);
    this.time.delayedCall(1400, () => this.scene.start("interior", { locationId: this.locationId }));
  }

  private drawCafeCounter() {
    this.add.rectangle(640, 318, 520, 74, 0x6f4a3a).setStrokeStyle(3, 0x211827);
    for (let i = 0; i < 5; i += 1) {
      this.add.rectangle(438 + i * 96, 286, 44, 34, 0xe9edf7).setStrokeStyle(2, 0x2b2030);
      this.add.rectangle(438 + i * 96, 304, 32, 10, 0xc99663);
    }
    this.add.rectangle(810, 264, 72, 58, 0x9fd7e9).setStrokeStyle(2, 0x1b2230);
  }

  private drawComputerDesk() {
    this.add.rectangle(640, 312, 460, 82, 0x54657c).setStrokeStyle(3, 0x1b2230);
    this.add.rectangle(640, 254, 190, 92, 0x101827).setStrokeStyle(4, 0x9fd7e9, 0.82);
    this.add.rectangle(640, 254, 152, 58, 0x1f3355);
    this.add.text(584, 236, "TASK", this.textStyle(16, "#70e08a"));
    this.add.rectangle(565, 330, 68, 18, 0x202942).setStrokeStyle(1, 0x0f1424);
    this.add.rectangle(715, 330, 80, 18, 0x202942).setStrokeStyle(1, 0x0f1424);
  }

  private drawHospitalStation() {
    this.add.rectangle(640, 296, 480, 70, 0xd9e4ef).setStrokeStyle(3, 0x1b2230);
    this.add.rectangle(470, 272, 92, 46, 0x9fd7e9).setStrokeStyle(2, 0x1b2230);
    this.add.rectangle(640, 268, 160, 28, 0xe9edf7).setStrokeStyle(2, 0x1b2230);
    this.add.rectangle(798, 270, 52, 52, 0xff6f91).setStrokeStyle(2, 0x1b2230);
    this.add.text(781, 258, "+", this.textStyle(26, "#fff4de"));
  }

  private readSave(): SaveData | undefined {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) as SaveData : undefined;
    } catch {
      return undefined;
    }
  }

  private writeSave(save: SaveData) {
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      // Saving can fail in private browsing or restricted webviews; gameplay continues.
    }
  }

  private textStyle(size: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Consolas, monospace",
      fontSize: `${size}px`,
      color,
      stroke: "#171021",
      strokeThickness: size > 16 ? 3 : 2,
    };
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#070b17",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  scene: [PixelLifeScene, InteriorScene, MiniGameScene],
  pixelArt: true,
  roundPixels: true,
});

import Phaser from "phaser";
import type {
  CharacterAppearance,
  DailyGoalProgress,
  InclinationData,
  LocationData,
  NeedKey,
  NpcData,
  NpcMemory,
  ProfessionData,
  ProfessionLevelData,
  RuntimeQuest,
  SaveData,
  StatKey,
} from "../../gameTypes";
import {
  BOTTOM_COLORS,
  CITY_QUEST_CHAIN_NPC,
  DEFAULT_APPEARANCE,
  HAIR_COLORS,
  NAME_OPTIONS,
  SKIN_TONES,
  TOP_COLORS,
  clampStat,
  computeDecorScore,
  createDailyGoals,
  decorItems,
  ensureDailyGoals,
  inclinations,
  initialQuests,
  locations,
  needLabels,
  npcs,
  professionLevelForXp,
  professions,
  relationshipTier,
  resolveActiveChainQuestId,
  toColor,
} from "../shared/gameData";
import { SAVE_KEY, WORLD_OFFSET_X, WORLD_OFFSET_Y, WORLD_HEIGHT, WORLD_WIDTH } from "../config/gameConfig";
import { Player } from "../entities/Player";
import { CameraController } from "../systems/CameraController";
import { KeyboardInputSource, PlayerController } from "../systems/PlayerController";

type MenuKey = "tasks" | "jobs" | "phone";

export class WorldScene extends Phaser.Scene {
  private player!: Player;
  private playerController!: PlayerController;
  private cameraController!: CameraController;
  private cityLayer!: Phaser.GameObjects.Container;
  private buildingObstacles!: Phaser.Physics.Arcade.StaticGroup;

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
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cityLayer = this.add.container(WORLD_OFFSET_X, WORLD_OFFSET_Y);
    this.buildingObstacles = this.physics.add.staticGroup();

    this.initializeNpcMemory();
    this.loadGame();
    this.createPixelTextures();
    this.drawBackdrop();
    this.drawLocations();
    this.drawNpcs();
    this.createPlayer(190, 432);
    this.physics.add.collider(this.player, this.buildingObstacles);

    this.cameraController = new CameraController(this, this.player);
    this.cameraController.setup();

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

  update(time: number) {
    this.playerController.update(time);
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
    this.cityLayer.add(this.add.rectangle(640, 360, 1280, 720, 0x0b1024));
    this.cityLayer.add(this.add.rectangle(520, 112, 1040, 224, 0x171b3a));

    for (let i = 0; i < 52; i += 1) {
      const x = i * 22;
      const h = 48 + ((i * 37) % 92);
      this.cityLayer.add(this.add.rectangle(x, 214 - h / 2, 17, h, i % 3 === 0 ? 0x20294e : 0x242d55).setAlpha(0.82));
      if (i % 2 === 0) {
        this.cityLayer.add(this.add.rectangle(x + 4, 206 - h, 4, 4, 0xffbf63).setAlpha(0.9));
      }
    }

    this.cityLayer.add(this.add.rectangle(520, 292, 1040, 96, 0x12334b));
    for (let i = 0; i < 18; i += 1) {
      this.cityLayer.add(this.add.rectangle(i * 64 + 18, 285, 34, 3, 0xffb75f, 0.45));
    }

    this.cityLayer.add(this.add.rectangle(520, 393, 1040, 34, 0x2d3855));
    this.cityLayer.add(this.add.rectangle(520, 412, 1040, 8, 0x090d18));
    this.cityLayer.add(this.add.rectangle(520, 558, 1040, 284, 0x172131));

    for (let y = 452; y < 692; y += 54) {
      this.cityLayer.add(this.add.rectangle(520, y, 1040, 2, 0x24304b, 0.85));
    }
    for (let x = 24; x < 1010; x += 64) {
      this.cityLayer.add(this.add.rectangle(x, 558, 2, 270, 0x111827, 0.45));
    }

    this.cityLayer.add(this.add.rectangle(1064, 360, 2, 720, 0x44517b, 0.55));
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
      this.cityLayer.add(card);
      this.locationOutlines.set(location.id, outline);

      const obstacle = this.add.rectangle(
        location.x + WORLD_OFFSET_X,
        location.y + WORLD_OFFSET_Y,
        location.w,
        location.h,
        0x000000,
        0,
      );
      this.physics.add.existing(obstacle, true);
      this.buildingObstacles.add(obstacle);
    });
  }

  private drawNpcs() {
    const textureFor = ["npc-a", "npc-b", "npc-c"];
    npcs.forEach((npc, index) => {
      const npcSprite = this.add.image(npc.x, npc.y, textureFor[index % textureFor.length]).setScale(1.2);
      npcSprite.setTint(toColor(npc.tint));
      const name = this.add.text(npc.x, npc.y + 46, npc.name, this.textStyle(13, "#ffeec9")).setOrigin(0.5);
      this.cityLayer.add([npcSprite, name]);
      this.tweens.add({
        targets: [npcSprite, name],
        y: "+=5",
        duration: 900 + index * 180,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
    this.cityLayer.add(this.add.image(260, 448, "pet").setScale(1.6));
  }

  private createPlayer(x: number, y: number) {
    this.player = new Player(this, x + WORLD_OFFSET_X, y + WORLD_OFFSET_Y, "hero");
    this.player.setBaseScale(1.28);
    this.playerController = new PlayerController(this.player, new KeyboardInputSource(this));
  }

  private createHud() {
    const hud = this.add.rectangle(532, 38, 1016, 58, 0x070a14, 0.86)
      .setStrokeStyle(1, 0x6f7eb5, 0.48)
      .setScrollFactor(0);
    hud.setDepth(10);
    this.statusText = this.add.text(42, 18, "", this.textStyle(18, "#fff4de")).setDepth(11).setScrollFactor(0);

    const needs: NeedKey[] = ["energy", "mood", "skill", "social"];
    needs.forEach((need, index) => {
      const x = 520 + index * 128;
      this.add.text(x, 15, needLabels[need], this.textStyle(12, "#b9c6ef")).setDepth(11).setScrollFactor(0);
      this.add.rectangle(x + 42, 40, 86, 12, 0x11172b).setStrokeStyle(1, 0x435078, 0.6).setDepth(11).setScrollFactor(0);
      const bar = this.add.rectangle(x, 40, 1, 8, this.colorForNeed(need)).setOrigin(0, 0.5).setDepth(12).setScrollFactor(0);
      this.statBars.set(need, bar);
    });
  }

  private createPhoneMenu() {
    this.add.rectangle(1172, 360, 216, 704, 0x0b1020, 0.96).setStrokeStyle(1, 0x6f7eb5, 0.5).setScrollFactor(0);
    this.add.text(1086, 24, "PIXELPHONE", this.textStyle(17, "#ffcf66")).setDepth(12).setScrollFactor(0);

    const buttons: Array<{ key: MenuKey; label: string; icon: string; y: number }> = [
      { key: "tasks", label: "Görevler", icon: "✓", y: 90 },
      { key: "jobs", label: "Meslek", icon: "▣", y: 148 },
      { key: "phone", label: "Telefon", icon: "☎", y: 206 },
    ];

    buttons.forEach((button) => {
      const item = this.add.container(1172, button.y).setScrollFactor(0);
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

    this.menuTitle = this.add.text(1088, 280, "", this.textStyle(18, "#ffcf66")).setScrollFactor(0);
    this.menuBody = this.add.text(1088, 318, "", {
      ...this.textStyle(14, "#dce6ff"),
      lineSpacing: 8,
      wordWrap: { width: 164 },
    }).setScrollFactor(0);
  }

  private createActionPanel() {
    this.add.rectangle(532, 663, 1016, 100, 0x070a14, 0.9).setStrokeStyle(1, 0x6f7eb5, 0.46).setScrollFactor(0);
    this.selectedNameText = this.add.text(42, 628, "", this.textStyle(22, "#ffcf66")).setScrollFactor(0);
    this.selectedDescText = this.add.text(42, 660, "", this.textStyle(15, "#dce6ff")).setScrollFactor(0);
    this.messageText = this.add.text(42, 696, "", this.textStyle(15, "#fff4de")).setScrollFactor(0);

    this.actionButton = this.createPanelButton(780, 663, 240, 58, 0xffcf66, "label");
    this.actionButton.setInteractive({ useHandCursor: true });
    this.actionButton.on("pointerdown", () => this.performAction());

    this.enterButton = this.createPanelButton(1026, 663, 210, 58, 0x6fd3ff, "label");
    this.enterButton.setInteractive({ useHandCursor: true });
    this.enterButton.on("pointerdown", () => this.enterLocation());
  }

  private createPanelButton(x: number, y: number, width: number, height: number, color: number, labelName: string) {
    const button = this.add.container(x, y).setScrollFactor(0);
    const bg = this.add.rectangle(0, 0, width, height, color).setStrokeStyle(3, 0x22314a, 0.9);
    const label = this.add.text(0, 0, "", this.textStyle(17, "#221423")).setOrigin(0.5).setName(labelName);
    button.add([bg, label]);
    button.setSize(width, height);
    return button;
  }

  private createCharacterOverlay() {
    this.characterDraft = { ...DEFAULT_APPEARANCE };
    this.applyAppearanceTexture(this.characterDraft);

    const overlay = this.add.container(532, 360).setDepth(50).setScrollFactor(0);
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
      this.player.setTexture("hero");
      this.overlay?.destroy();
      this.overlay = undefined;
      this.setMessage(`${this.character.name} hazır. Şimdi şehir seni nasıl tanısın?`);
      this.createInclinationOverlay();
    });
    overlay.add(confirm);
  }

  private createInclinationOverlay() {
    this.overlay = this.add.container(532, 360).setDepth(50).setScrollFactor(0);
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
    const npcChainOwnerId = CITY_QUEST_CHAIN_NPC[this.selected.id];
    const progressMap = Object.fromEntries(this.quests.map((quest) => [quest.id, quest.progress]));
    const resolvedQuestId = npcChainOwnerId
      ? resolveActiveChainQuestId(npcs.find((npc) => npc.id === npcChainOwnerId)?.questChainIds, progressMap) ?? this.selected.questId
      : this.selected.questId;
    const { quest: completedQuest, levelUp: questLevelUp, tierUp } = this.progressQuest(resolvedQuestId);
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
    const marker = this.add.text(this.player.x + 16, this.player.y - 42, symbol, this.textStyle(18, "#ff5b83")).setOrigin(0.5);
    this.tweens.add({
      targets: marker,
      y: marker.y - 26,
      alpha: 0,
      duration: 720,
      ease: "Sine.easeOut",
      onComplete: () => marker.destroy(),
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
      const progressMap = Object.fromEntries(this.quests.map((quest) => [quest.id, quest.progress]));
      const activeChainQuestId = resolveActiveChainQuestId(this.activeProfession?.questChainIds, progressMap);
      const activeNpcChainQuestIds = new Set(
        Object.values(CITY_QUEST_CHAIN_NPC)
          .map((npcId) => resolveActiveChainQuestId(npcs.find((npc) => npc.id === npcId)?.questChainIds, progressMap))
          .filter((questId): questId is string => Boolean(questId)),
      );
      const relevantQuests = this.quests.filter((quest) => {
        const npcOwner = quest.npcId ? npcs.find((npc) => npc.id === quest.npcId) : undefined;
        const isNpcChainQuest = npcOwner?.questChainIds?.includes(quest.id) ?? false;
        if (isNpcChainQuest) {
          return quest.progress >= quest.target || activeNpcChainQuestIds.has(quest.id);
        }
        if (!quest.professionTags || quest.professionTags.length === 0) return true;
        if (!this.activeProfession || !quest.professionTags.includes(this.activeProfession.id)) return false;
        const isProfessionChainQuest = this.activeProfession.questChainIds.includes(quest.id);
        return !isProfessionChainQuest || quest.progress >= quest.target || quest.id === activeChainQuestId;
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


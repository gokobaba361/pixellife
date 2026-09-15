import Phaser from "phaser";
import "./styles.css";
import type { DecorItemData, LocationData, NpcData, ProfessionLevelData, RuntimeQuest, SaveData } from "./gameTypes";
import {
  type InteriorHotspot,
  applyHotspotToSave,
  computeDecorScore,
  decorItems,
  ensureDailyGoals,
  locations,
  npcs,
  professions,
  relationshipTier,
  resolveActiveChainQuestId,
  toColor,
} from "./game/shared/gameData";
import { SAVE_KEY } from "./game/config/gameConfig";
import { WorldScene } from "./game/scenes/WorldScene";

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
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [WorldScene, InteriorScene, MiniGameScene],
  pixelArt: true,
  roundPixels: true,
});

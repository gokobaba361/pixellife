import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "src", "content");

const readJson = (name) => JSON.parse(fs.readFileSync(path.join(contentDir, name), "utf8"));
const byId = (items, label) => {
  const map = new Map();
  for (const item of items) {
    if (!item.id) throw new Error(`${label} item is missing id`);
    if (map.has(item.id)) throw new Error(`Duplicate ${label} id: ${item.id}`);
    map.set(item.id, item);
  }
  return map;
};

const locations = readJson("locations.json");
const npcs = readJson("npcs.json");
const professions = readJson("professions.json");
const quests = readJson("quests.json");
const inclinations = readJson("inclinations.json");
const decor = readJson("decor.json");

const locationById = byId(locations, "location");
const npcById = byId(npcs, "npc");
const professionById = byId(professions, "profession");
const questById = byId(quests, "quest");
byId(inclinations, "inclination");
byId(decor, "decor");

for (const location of locations) {
  if (!questById.has(location.questId)) {
    throw new Error(`Location ${location.id} points to missing quest ${location.questId}`);
  }
}

for (const npc of npcs) {
  if (!locationById.has(npc.locationId)) {
    throw new Error(`NPC ${npc.id} points to missing location ${npc.locationId}`);
  }
}

for (const profession of professions) {
  if (!npcById.has(profession.mentorNpcId)) {
    throw new Error(`Profession ${profession.id} points to missing mentor ${profession.mentorNpcId}`);
  }
  for (const locationId of profession.locationIds) {
    if (!locationById.has(locationId)) {
      throw new Error(`Profession ${profession.id} points to missing location ${locationId}`);
    }
  }
  if (!Array.isArray(profession.levels) || profession.levels.length < 2) {
    throw new Error(`Profession ${profession.id} needs at least 2 career levels`);
  }
  if (!Array.isArray(profession.questChainIds) || profession.questChainIds.length === 0) {
    throw new Error(`Profession ${profession.id} needs at least 1 quest chain entry`);
  }
  profession.questChainIds.forEach((chainQuestId) => {
    const chainQuest = questById.get(chainQuestId);
    if (!chainQuest) {
      throw new Error(`Profession ${profession.id} quest chain points to missing quest ${chainQuestId}`);
    }
    if (!chainQuest.professionTags?.includes(profession.id)) {
      throw new Error(`Quest ${chainQuestId} in ${profession.id} chain must have professionTags including ${profession.id}`);
    }
  });
  profession.levels.forEach((level, index) => {
    if (level.level !== index + 1) {
      throw new Error(`Profession ${profession.id} levels must be sequential starting at 1`);
    }
    if (index === 0 && level.xpToNext !== 0) {
      throw new Error(`Profession ${profession.id} level 1 must start at xpToNext 0`);
    }
    if (index > 0 && level.xpToNext <= profession.levels[index - 1].xpToNext) {
      throw new Error(`Profession ${profession.id} level ${level.level} xpToNext must increase`);
    }
  });
}

for (const quest of quests) {
  if (quest.locationId && !locationById.has(quest.locationId)) {
    throw new Error(`Quest ${quest.id} points to missing location ${quest.locationId}`);
  }
  if (quest.npcId && !npcById.has(quest.npcId)) {
    throw new Error(`Quest ${quest.id} points to missing NPC ${quest.npcId}`);
  }
  for (const tag of quest.professionTags ?? []) {
    if (!professionById.has(tag)) {
      throw new Error(`Quest ${quest.id} points to missing profession ${tag}`);
    }
  }
}

for (const inclination of inclinations) {
  if (!locationById.has(inclination.startingLocationId)) {
    throw new Error(`Inclination ${inclination.id} points to missing location ${inclination.startingLocationId}`);
  }
  if (!professionById.has(inclination.startingProfessionId)) {
    throw new Error(`Inclination ${inclination.id} points to missing profession ${inclination.startingProfessionId}`);
  }
}

for (const item of decor) {
  if (item.cost < 0 || item.scoreValue < 0) {
    throw new Error(`Decor ${item.id} must have non-negative cost and scoreValue`);
  }
  if (item.professionAffinity && !professionById.has(item.professionAffinity)) {
    throw new Error(`Decor ${item.id} points to missing profession ${item.professionAffinity}`);
  }
}

console.log(`Content OK: ${locations.length} locations, ${npcs.length} NPCs, ${professions.length} professions, ${quests.length} quests, ${inclinations.length} inclinations, ${decor.length} decor items.`);

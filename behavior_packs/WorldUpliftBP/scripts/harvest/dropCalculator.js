import { system } from "@minecraft/server";

export function calculateDrops(definition, player) {
  const random = seededRandom(`${definition.key}:${player?.name || "player"}:${system.currentTick}`);
  switch (definition.dropMode) {
    case "wheat":
      return [
        { itemId: "minecraft:wheat", amount: 1 },
        { itemId: "minecraft:wheat_seeds", amount: randomInt(random, 0, 2) }
      ].filter((drop) => drop.amount > 0);
    case "carrot":
      return [{ itemId: "minecraft:carrot", amount: randomInt(random, 2, 4) }];
    case "potato": {
      const drops = [{ itemId: "minecraft:potato", amount: randomInt(random, 2, 4) }];
      if (random() < 0.02) {
        drops.push({ itemId: "minecraft:poisonous_potato", amount: 1 });
      }
      return drops;
    }
    case "beetroot":
      return [
        { itemId: "minecraft:beetroot", amount: 1 },
        { itemId: "minecraft:beetroot_seeds", amount: randomInt(random, 1, 3) }
      ];
    case "nether_wart":
      return [{ itemId: "minecraft:nether_wart", amount: randomInt(random, 2, 4) }];
    case "cocoa":
      return [{ itemId: "minecraft:cocoa_beans", amount: randomInt(random, 2, 3) }];
    case "sweet_berries":
      return [{ itemId: "minecraft:sweet_berries", amount: randomInt(random, 2, 3) }];
    default:
      return [];
  }
}

function seededRandom(seedText) {
  let state = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    state ^= seedText.charCodeAt(i);
    state = Math.imul(state, 16777619);
  }
  return function next() {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}


import { RIGHTCLICK_HARVEST_CONFIG } from "../config.js";

export const CROP_DEFINITIONS = Object.freeze({
  "minecraft:wheat": {
    key: "wheat",
    blockId: "minecraft:wheat",
    requiredSeedItemId: "minecraft:wheat_seeds",
    matureStateNames: ["growth", "age", "minecraft:growth", "growth_stage"],
    matureStateValue: 7,
    replantedStateValue: 0,
    dropMode: "wheat",
    consumeSeedOnReplant: true,
    requiresSeedInInventory: true
  },
  "minecraft:carrots": {
    key: "carrots",
    blockId: "minecraft:carrots",
    requiredSeedItemId: "minecraft:carrot",
    matureStateNames: ["growth", "age", "minecraft:growth", "growth_stage"],
    matureStateValue: 7,
    replantedStateValue: 0,
    dropMode: "carrot",
    consumeSeedOnReplant: true,
    requiresSeedInInventory: true
  },
  "minecraft:potatoes": {
    key: "potatoes",
    blockId: "minecraft:potatoes",
    requiredSeedItemId: "minecraft:potato",
    matureStateNames: ["growth", "age", "minecraft:growth", "growth_stage"],
    matureStateValue: 7,
    replantedStateValue: 0,
    dropMode: "potato",
    consumeSeedOnReplant: true,
    requiresSeedInInventory: true
  },
  "minecraft:beetroot": {
    key: "beetroot",
    blockId: "minecraft:beetroot",
    requiredSeedItemId: "minecraft:beetroot_seeds",
    matureStateNames: ["growth", "age", "minecraft:growth", "growth_stage"],
    matureStateValue: 3,
    replantedStateValue: 0,
    dropMode: "beetroot",
    consumeSeedOnReplant: true,
    requiresSeedInInventory: true
  },
  "minecraft:nether_wart": {
    key: "nether_wart",
    blockId: "minecraft:nether_wart",
    requiredSeedItemId: "minecraft:nether_wart",
    matureStateNames: ["growth", "age", "minecraft:growth", "growth_stage"],
    matureStateValue: 3,
    replantedStateValue: 0,
    dropMode: "nether_wart",
    consumeSeedOnReplant: true,
    requiresSeedInInventory: true
  },
  "minecraft:cocoa": {
    key: "cocoa",
    blockId: "minecraft:cocoa",
    requiredSeedItemId: "minecraft:cocoa_beans",
    matureStateNames: ["age", "growth", "minecraft:growth", "growth_stage"],
    matureStateValue: 2,
    replantedStateValue: 0,
    dropMode: "cocoa",
    consumeSeedOnReplant: true,
    requiresSeedInInventory: true
  },
  "minecraft:sweet_berry_bush": {
    key: "sweet_berries",
    blockId: "minecraft:sweet_berry_bush",
    requiredSeedItemId: "minecraft:sweet_berries",
    matureStateNames: ["growth", "age", "minecraft:growth", "growth_stage"],
    matureStateValue: 3,
    replantedStateValue: 1,
    dropMode: "sweet_berries",
    consumeSeedOnReplant: false,
    requiresSeedInInventory: false
  }
});

export function getCropDefinition(blockId) {
  const definition = CROP_DEFINITIONS[blockId];
  if (!definition) {
    return undefined;
  }
  return RIGHTCLICK_HARVEST_CONFIG.SUPPORTED_CROPS[definition.key] ? definition : undefined;
}

export function getSupportedCropSummary() {
  return Object.entries(RIGHTCLICK_HARVEST_CONFIG.SUPPORTED_CROPS)
    .map(([key, enabled]) => `${key}:${enabled ? "on" : "off"}`)
    .join(", ");
}


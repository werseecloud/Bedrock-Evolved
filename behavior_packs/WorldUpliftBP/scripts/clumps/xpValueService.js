import { CONFIG } from "../config.js";

export function getXpValue(entity) {
  try {
    const dynamic = entity.getDynamicProperty("xp_value");
    if (typeof dynamic === "number") {
      return dynamic;
    }
  } catch (_error) {
    // Not exposed for vanilla orbs on many versions.
  }
  return CONFIG.clumps.approximateMode ? 1 : undefined;
}

export function canSpawnXp(dimension) {
  return typeof dimension.spawnXp === "function";
}


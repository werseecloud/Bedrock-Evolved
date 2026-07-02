import {
  BIOME_DISPLAY_NAMES,
  BIOME_FOG_IDS,
  isFogBiomeEnabled
} from "./fogProfiles.js";

const BIOME_CATEGORY_TESTS = Object.freeze([
  {
    category: "alpinePeaks",
    patterns: ["alpine_peaks", "alpine_foothills", "snowy_slopes", "frozen_peaks", "jagged_peaks"]
  },
  {
    category: "shatteredCliffs",
    patterns: ["shattered_cliffs", "cliff", "stony_peaks", "windswept"]
  },
  {
    category: "deepValleys",
    patterns: ["deep_valleys", "valley", "crater_lake", "lush_caves"]
  },
  {
    category: "oldGrowthHighlands",
    patterns: ["old_growth_highlands", "highland_groves", "forest_edge", "old_growth", "taiga", "grove", "forest"]
  },
  {
    category: "coastalCliffs",
    patterns: ["coastal_cliffs", "beach", "ocean", "shore", "coast"]
  },
  {
    category: "hotSprings",
    patterns: ["hot_springs"]
  }
]);

export function getBiomeFogForPlayer(player) {
  if (!player) {
    return makeFogInfo("default");
  }
  const dimensionId = getDimensionId(player.dimension);
  if (isNetherDimension(dimensionId)) {
    return makeFogInfo("netherDeepCrack", "minecraft:nether");
  }
  if (isCaveLikeLocation(player)) {
    return makeFogInfo("caves", getBiomeId(player.dimension, player.location));
  }

  const biomeId = getBiomeId(player.dimension, player.location);
  const category = categorizeBiomeId(biomeId);
  return makeFogInfo(category, biomeId);
}

export function makeFogInfo(category, biomeId = undefined) {
  const normalized = BIOME_FOG_IDS[category] && isFogBiomeEnabled(category) ? category : "default";
  return {
    category: normalized,
    biomeId: biomeId || "unknown",
    fogId: BIOME_FOG_IDS[normalized] || BIOME_FOG_IDS.default,
    displayName: BIOME_DISPLAY_NAMES[normalized] || BIOME_DISPLAY_NAMES.default
  };
}

export function categorizeBiomeId(biomeId) {
  const id = String(biomeId || "").toLowerCase();
  for (const entry of BIOME_CATEGORY_TESTS) {
    if (entry.patterns.some((pattern) => id.includes(pattern))) {
      return entry.category;
    }
  }
  return "default";
}

function isCaveLikeLocation(player) {
  try {
    if (player.dimension?.id !== "minecraft:overworld") {
      return false;
    }
    if (player.location.y > 42) {
      return false;
    }
    const above = player.dimension.getBlock({
      x: Math.floor(player.location.x),
      y: Math.floor(player.location.y + 12),
      z: Math.floor(player.location.z)
    });
    return above && !above.isAir;
  } catch (_error) {
    return false;
  }
}

function getBiomeId(dimension, location) {
  try {
    const biome = typeof dimension.getBiome === "function" ? dimension.getBiome(location) : undefined;
    if (biome) {
      return biome.id || biome.typeId || biome.identifier;
    }
  } catch (_error) {
    // Biome lookup is not available on every Script API runtime.
  }

  try {
    const block = dimension.getBlock({
      x: Math.floor(location.x),
      y: Math.floor(location.y),
      z: Math.floor(location.z)
    });
    const biome = typeof block?.getBiome === "function" ? block.getBiome() : block?.biome;
    return biome?.id || biome?.typeId || biome?.identifier;
  } catch (_error) {
    return undefined;
  }
}

function getDimensionId(dimension) {
  try {
    return String(dimension?.id || "minecraft:overworld");
  } catch (_error) {
    return "minecraft:overworld";
  }
}

function isNetherDimension(dimensionId) {
  return dimensionId === "minecraft:nether" || dimensionId === "nether";
}

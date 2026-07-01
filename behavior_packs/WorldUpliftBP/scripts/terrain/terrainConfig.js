export const TERRAIN_CONFIG = {
  enabled: true,
  performanceProfile: "balanced",

  biomeTransitions: {
    enabled: true,
    foothillsEnabled: true,
    forestEdgesEnabled: true,
    valleyEdgesEnabled: true
  },

  landmarks: {
    enabled: true,
    megaLandmarkChance: 0.01,
    ancientTowerChance: 0.04,
    ruinedCastleChance: 0.01,
    craterLakeChance: 0.015,
    floatingCliffChance: 0.003
  },

  waterfalls: {
    enabled: true,
    chanceNearCliffs: 0.08,
    createBottomPools: true,
    addWetStone: true,
    addMistParticles: true
  },

  rivers: {
    mountainSpringsEnabled: true,
    streamSegmentsEnabled: true,
    valleyPoolsEnabled: true
  },

  snowline: {
    enabled: true,
    alpineSnowY: 128,
    shatteredCliffSnowY: 170,
    highlandPatchySnowY: 150,
    usePowderSnow: true,
    useIce: true
  },

  caves: {
    cliffCaveEntrancesEnabled: true,
    undergroundRuinPocketsEnabled: true,
    caveMouthChance: 0.05,
    undergroundRuinChance: 0.015
  },

  rockPalettes: {
    enabled: true,
    biomeSpecificPalettes: true
  },

  floatingCliffs: {
    enabled: true,
    chance: 0.003,
    maxPerRegion: 1
  },

  hotSprings: {
    enabled: true,
    chance: 0.015,
    steamParticles: true
  },

  forests: {
    densityVariationEnabled: true,
    maxTreesPerDecorationPass: 24,
    denseForestChance: 0.25,
    sparseForestChance: 0.35
  },

  paths: {
    naturalPathsEnabled: true,
    ancientRoadRuinsEnabled: true,
    maxPathSegmentsPerPass: 8
  },

  coastalCliffs: {
    enabled: true,
    seaCavesEnabled: true,
    coastalArchChance: 0.03
  },

  valleyFog: {
    enabled: true,
    deepValleyFogEnabled: true
  },

  budget: {
    maxBlockOpsPerTick: 64,
    maxStructurePlacementsPerMinute: 12,
    maxDecorationsPerPlayerPass: 16,
    playerScanRadiusChunks: 6,
    minimumPlayerMovementBeforeRescan: 24
  },

  safety: {
    avoidPlayerBuilds: true,
    safeOverwriteBlocks: [
      "minecraft:air",
      "minecraft:cave_air",
      "minecraft:void_air",
      "minecraft:grass",
      "minecraft:tallgrass",
      "minecraft:tall_grass",
      "minecraft:fern",
      "minecraft:large_fern",
      "minecraft:snow",
      "minecraft:snow_layer",
      "minecraft:water",
      "minecraft:flowing_water",
      "minecraft:vine",
      "minecraft:grass_block",
      "minecraft:dirt",
      "minecraft:coarse_dirt",
      "minecraft:podzol",
      "minecraft:moss_block",
      "minecraft:stone",
      "minecraft:andesite",
      "minecraft:granite",
      "minecraft:diorite",
      "minecraft:deepslate",
      "minecraft:tuff",
      "minecraft:gravel",
      "minecraft:sand",
      "minecraft:red_sand",
      "minecraft:clay"
    ],
    neverOverwriteBlocks: [
      "minecraft:chest",
      "minecraft:barrel",
      "minecraft:bed",
      "minecraft:crafting_table",
      "minecraft:furnace",
      "minecraft:blast_furnace",
      "minecraft:smoker",
      "minecraft:anvil",
      "minecraft:enchanting_table",
      "minecraft:beacon",
      "minecraft:ender_chest",
      "minecraft:shulker_box"
    ]
  },

  debug: false
};

const PROFILES = Object.freeze({
  performance: {
    scanRadius: 3,
    decorationCap: 8,
    snowlineInterval: 220,
    scenicInterval: 140,
    waterfallInterval: 320,
    forestInterval: 240,
    landmarkInterval: 280,
    landmarkScale: 0.45
  },
  balanced: {
    scanRadius: 5,
    decorationCap: 16,
    snowlineInterval: 160,
    scenicInterval: 100,
    waterfallInterval: 240,
    forestInterval: 180,
    landmarkInterval: 200,
    landmarkScale: 1
  },
  cinematic: {
    scanRadius: 6,
    decorationCap: 24,
    snowlineInterval: 120,
    scenicInterval: 80,
    waterfallInterval: 180,
    forestInterval: 140,
    landmarkInterval: 160,
    landmarkScale: 1.35
  }
});

export function setTerrainEnabled(enabled) {
  TERRAIN_CONFIG.enabled = Boolean(enabled);
}

export function setTerrainDebug(enabled) {
  TERRAIN_CONFIG.debug = Boolean(enabled);
}

export function setTerrainProfile(profile) {
  if (!PROFILES[profile]) {
    return false;
  }
  TERRAIN_CONFIG.performanceProfile = profile;
  TERRAIN_CONFIG.budget.playerScanRadiusChunks = PROFILES[profile].scanRadius;
  TERRAIN_CONFIG.budget.maxDecorationsPerPlayerPass = PROFILES[profile].decorationCap;
  return true;
}

export function getTerrainProfileSettings() {
  return PROFILES[TERRAIN_CONFIG.performanceProfile] || PROFILES.balanced;
}

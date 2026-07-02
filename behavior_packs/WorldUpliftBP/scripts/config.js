export const DEFAULT_CONFIG = Object.freeze({
  BOTTOM_TRANSITION_ENABLED: true,
  OVERWORLD_DEEP_Y: -500,
  NETHER_TARGET_Y: 80,
  COORDINATE_SCALE: 0.125,
  MAX_BLOCK_OPS_PER_TICK: 96,
  CITY_SCAN_INTERVAL_TICKS: 200,
  PLAYER_SCAN_INTERVAL_TICKS: 20,
  STRUCTURE_PLACEMENT_BATCH_SIZE: 3,
  MAX_CITIES_PER_WORLD: 48,
  CITY_SCAN_RADIUS: 18,
  CITY_BUILD_RADIUS: 70,
  CITY_AUTO_REGISTER_ENABLED: true,
  MEGA_REGIONS_ENABLED: true,
  MEGA_REGION_SIZE_BLOCKS: 10000,
  MEGA_REGION_SCAN_INTERVAL_TICKS: 60,
  MEGA_REGION_CHUNK_RADIUS: 6,
  MEGA_REGION_MAX_CHUNKS_PER_SCAN: 7,
  MEGA_REGION_DECORATION_DENSITY: 1.5,
  EXTENDED_MOUNTAIN_DECORATION_ENABLED: true,
  DEBUG: false
});

export const CAMERA_OVERHAUL_ENABLED = true;

export const UPDATE_INTERVAL_TICKS = 2;

export const DEFAULT_PROFILE = "balanced";

export const MOTION_SICKNESS_SAFE_MODE = false;

export const PROFILES = Object.freeze({
  performance: {
    swayIntensity: 0.15,
    strafeTiltIntensity: 0.2,
    sprintFovBoost: 0,
    landingBounceIntensity: 0,
    updateIntervalTicks: 4
  },
  balanced: {
    swayIntensity: 0.25,
    strafeTiltIntensity: 0.35,
    sprintFovBoost: 0,
    landingBounceIntensity: 0.25,
    updateIntervalTicks: 2
  },
  cinematic: {
    swayIntensity: 0.4,
    strafeTiltIntensity: 0.55,
    sprintFovBoost: 0,
    landingBounceIntensity: 0.4,
    updateIntervalTicks: 2
  }
});

export const SAFETY_LIMITS = Object.freeze({
  maxTiltDegrees: 3,
  maxFovBoost: 5,
  maxLandingBounce: 0.6,
  maxSwayOffset: 0.08
});

export const CAMERA_CONSTANTS = Object.freeze({
  baseFov: 70,
  sprintSpeedThreshold: 0.18,
  walkingSpeedThreshold: 0.025,
  landingMinFallDistance: 1.6,
  commandCooldownTicks: 10,
  shakeCooldownTicks: 8
});

export const RIGHTCLICK_HARVEST_CONFIG = {
  RIGHTCLICK_HARVEST_ENABLED: true,
  REQUIRE_SEED_TO_REPLANT: true,
  CONSUME_SEED_ON_REPLANT: true,
  DROP_TO_INVENTORY: true,
  DROP_OVERFLOW_ON_GROUND: true,
  ALLOW_EMPTY_HAND: true,
  ALLOW_HOE_ONLY: false,
  ALLOW_ANY_ITEM: true,
  DAMAGE_HOE_ON_HARVEST: false,
  HOE_DURABILITY_DAMAGE: 1,
  ENABLE_PARTICLES: true,
  ENABLE_SOUNDS: true,
  ENABLE_ACTIONBAR_MESSAGES: true,
  PREVENT_DUPLICATE_INTERACTION: true,
  INTERACTION_COOLDOWN_TICKS: 5,
  REQUIRE_TAG_FOR_HARVEST: false,
  REQUIRED_PLAYER_TAG: "rightclick_harvest",
  SUPPORTED_CROPS: {
    wheat: true,
    carrots: true,
    potatoes: true,
    beetroot: true,
    nether_wart: true,
    cocoa: false,
    sweet_berries: false
  },
  ANTI_DUPLICATION_SAFETY: true,
  DEBUG: false
};

export const CONFIG = {
  betterMending: {
    enabled: true,
    requireMendingEnchant: true,
    repairOnlyHeldItem: true,
    allowArmorRepair: false,
    xpCostPerDurability: 1,
    maxRepairPerUse: 128,
    requireSneakToRepair: false,
    cooldownTicks: 10,
    useActionbar: true,
    playSound: true,
    showParticles: true,
    allowXpBottleFallback: true,
    xpBottleItemId: "minecraft:experience_bottle",
    xpBottleValue: 7
  },
  bridging: {
    enabled: true,
    requireSneakToDisable: false,
    maxPlacementDistance: 5,
    allowHorizontalBridging: true,
    allowDownwardEdgePlacement: true,
    allowDiagonalEdgePlacement: false,
    requireBlockInHand: true,
    useRaycast: true,
    cooldownTicks: 2,
    preventAirSpam: true,
    preventInsidePlayerPlacement: true,
    useActionbar: false,
    debugPreview: false
  },
  clumps: {
    enabled: true,
    exactModeAvailable: false,
    approximateMode: false,
    scanIntervalTicks: 20,
    scanRadius: 24,
    mergeRadius: 2.5,
    maxOrbsPerScan: 128,
    maxMergesPerTick: 32,
    maxOrbsRemovedPerTick: 64,
    preserveTotalXp: true,
    useParticles: true,
    ignoreRecentlySpawnedTicks: 10,
    debug: false
  },
  worldEdit: {
    enabled: true,
    requireAdmin: true,
    axeItemId: "minecraft:wooden_axe",
    axeName: "WorldEdit Axe",
    maxBlocksPerCommand: 32768,
    maxUndoBlocks: 32768,
    blocksPerTick: 64,
    showParticles: true
  },
  qol: {
    autoTorchRefill: {
      enabled: true,
      scanIntervalTicks: 5,
      torchIds: [
        "minecraft:torch",
        "minecraft:soul_torch",
        "minecraft:redstone_torch"
      ]
    },
    treeCapitator: {
      enabled: true,
      maxLogs: 96,
      logsPerTick: 16,
      durabilityCostPerLog: 1,
      dropLogs: true
    },
    quickStack: {
      enabled: true,
      scanIntervalTicks: 100,
      radius: 6,
      verticalRadius: 2,
      maxMovedStacksPerPass: 32,
      includeHotbar: false,
      containerBlockIds: [
        "minecraft:chest",
        "minecraft:trapped_chest",
        "minecraft:barrel"
      ]
    },
    deathCoordinates: {
      enabled: true,
      trackIntervalTicks: 5
    },
    biomeEnterMessage: {
      enabled: true,
      scanIntervalTicks: 40
    }
  },
  permissions: {
    requireTags: false,
    betterMendingTag: "qm_better_mending",
    bridgingTag: "qm_bridging",
    clumpsAdminTag: "qm_admin"
  },
  debug: false
};

export const MutableConfig = {
  ...DEFAULT_CONFIG
};

export const SAFE_OVERWRITE_BLOCKS = new Set([
  "minecraft:air",
  "minecraft:cave_air",
  "minecraft:void_air",
  "minecraft:grass",
  "minecraft:tallgrass",
  "minecraft:tall_grass",
  "minecraft:large_fern",
  "minecraft:fern",
  "minecraft:snow",
  "minecraft:water",
  "minecraft:flowing_water",
  "minecraft:lava",
  "minecraft:flowing_lava",
  "minecraft:grass_block",
  "minecraft:dirt",
  "minecraft:coarse_dirt",
  "minecraft:podzol",
  "minecraft:mycelium",
  "minecraft:moss_block",
  "minecraft:stone",
  "minecraft:andesite",
  "minecraft:diorite",
  "minecraft:granite",
  "minecraft:deepslate",
  "minecraft:tuff",
  "minecraft:gravel",
  "minecraft:sand",
  "minecraft:red_sand",
  "minecraft:clay"
]);

export function setDeepTransitionEnabled(enabled) {
  MutableConfig.BOTTOM_TRANSITION_ENABLED = Boolean(enabled);
}

export function setDebugEnabled(enabled) {
  MutableConfig.DEBUG = Boolean(enabled);
}

export function getEffectiveDeepY(dimension) {
  try {
    const range = dimension.heightRange;
    if (range && typeof range.min === "number") {
      const safeMinimum = range.min + 8;
      if (MutableConfig.OVERWORLD_DEEP_Y < safeMinimum) {
        return safeMinimum;
      }
    }
  } catch (_error) {
    // Older runtime or restricted dimension object. Use configured value.
  }
  return MutableConfig.OVERWORLD_DEEP_Y;
}

import { system, world } from "@minecraft/server";
import { Logger } from "../utils/logger.js";
import { hashString, mulberry32, randomInt } from "../utils/random.js";
import {
  isModuleUsable,
  recordModuleError,
  requestParticles
} from "../performance/performanceManager.js";
import { TERRAIN_CONFIG } from "./terrainConfig.js";
import { findSurfaceY, getBlockSafe } from "./utils/blockSafety.js";

const FOREST_SURFACE_BLOCKS = new Set([
  "minecraft:grass_block",
  "minecraft:podzol",
  "minecraft:moss_block",
  "minecraft:rooted_dirt",
  "minecraft:dirt"
]);

const WATER_BLOCKS = new Set([
  "minecraft:water",
  "minecraft:flowing_water"
]);

const lastRuns = new Map();
const waterfallMistAnchors = new Map();
let initialized = false;
let lastAnchorPruneTick = 0;

export function initAmbientParticleController() {
  if (initialized) {
    return;
  }
  initialized = true;
  system.runInterval(tickAmbientParticles, 20);
  Logger.info("Terrain ambient particles initialized.");
}

export function registerWaterfallMistAnchor(dimension, location) {
  const cfg = TERRAIN_CONFIG.ambientParticles?.waterfallMist;
  if (!cfg?.enabled || !dimension || !location) {
    return;
  }
  const dimensionId = getDimensionId(dimension);
  const snapped = {
    x: Math.floor(location.x),
    y: Math.floor(location.y),
    z: Math.floor(location.z)
  };
  const key = `${dimensionId}:${Math.floor(snapped.x / 8)}:${Math.floor(snapped.y / 8)}:${Math.floor(snapped.z / 8)}`;
  waterfallMistAnchors.set(key, {
    key,
    dimensionId,
    location: snapped,
    lastSeenTick: system.currentTick
  });
  pruneWaterfallAnchors();
}

export function getAmbientParticleStatus() {
  const fireflies = TERRAIN_CONFIG.ambientParticles?.rareFireflies;
  const mist = TERRAIN_CONFIG.ambientParticles?.waterfallMist;
  return `fireflies=${Boolean(fireflies?.enabled)} waterfallMist=${Boolean(mist?.enabled)} mistAnchors=${waterfallMistAnchors.size}`;
}

function tickAmbientParticles() {
  if (!TERRAIN_CONFIG.enabled || !isModuleUsable("terrain_ambient")) {
    return;
  }
  for (const player of world.getPlayers()) {
    if (!isOverworld(player)) {
      continue;
    }
    try {
      tickAmbientForPlayer(player);
    } catch (error) {
      recordModuleError("terrain_ambient", error);
      Logger.debug(`Ambient terrain particles skipped: ${error}`);
    }
  }
  if (system.currentTick - lastAnchorPruneTick > 1200) {
    pruneWaterfallAnchors();
  }
}

function tickAmbientForPlayer(player) {
  const fireflies = TERRAIN_CONFIG.ambientParticles?.rareFireflies;
  if (fireflies?.enabled && isDue(player, "rare_fireflies", fireflies.scanIntervalTicks)) {
    spawnRareFireflies(player, fireflies);
  }

  const mist = TERRAIN_CONFIG.ambientParticles?.waterfallMist;
  if (mist?.enabled && isDue(player, "waterfall_mist", mist.scanIntervalTicks)) {
    if (isDue(player, "waterfall_detect", mist.detectionIntervalTicks)) {
      detectNearbyWaterfalls(player, mist);
    }
    spawnWaterfallMistNearPlayer(player, mist);
  }
}

function spawnRareFireflies(player, cfg) {
  if (!isNight()) {
    return 0;
  }
  const random = playerRandom(player, "fireflies", cfg.scanIntervalTicks);
  if (random() > Number(cfg.chancePerScan || 0.1)) {
    return 0;
  }

  let spawned = 0;
  const radius = Math.max(8, Number(cfg.radius || 24));
  const maxBursts = Math.max(1, Number(cfg.maxBurstsPerScan || 1));
  for (let attempt = 0; attempt < 8 && spawned < maxBursts; attempt++) {
    const x = Math.floor(player.location.x + randomInt(random, -radius, radius));
    const z = Math.floor(player.location.z + randomInt(random, -radius, radius));
    const y = findSurfaceY(player.dimension, x, z, Math.floor(player.location.y + 42), Math.floor(player.location.y - 56));
    if (y === undefined || !isForestishLocation(player.dimension, { x, y, z })) {
      continue;
    }

    const location = {
      x: x + 0.5 + (random() - 0.5) * 2.5,
      y: y + 0.6 + random() * 3.2,
      z: z + 0.5 + (random() - 0.5) * 2.5
    };
    if (spawnParticle(player.dimension, cfg.particleId, cfg.fallbackParticleId, location, "terrain_fireflies")) {
      spawned++;
    }
  }
  return spawned;
}

function detectNearbyWaterfalls(player, cfg) {
  const random = playerRandom(player, "waterfall_detect", cfg.detectionIntervalTicks);
  const radius = Math.max(16, Number(cfg.detectionRadius || 48));
  for (let attempt = 0; attempt < 6; attempt++) {
    const x = Math.floor(player.location.x + randomInt(random, -radius, radius));
    const z = Math.floor(player.location.z + randomInt(random, -radius, radius));
    const anchor = findWaterfallMistLocation(player.dimension, x, z, Math.floor(player.location.y + 72), Math.floor(player.location.y - 56));
    if (anchor) {
      registerWaterfallMistAnchor(player.dimension, anchor);
    }
  }
}

function spawnWaterfallMistNearPlayer(player, cfg) {
  let spawned = 0;
  const radiusSq = Math.max(24, Number(cfg.radius || 80)) ** 2;
  const maxBursts = Math.max(1, Number(cfg.maxBurstsPerScan || 3));
  const playerDimensionId = getDimensionId(player.dimension);
  for (const anchor of waterfallMistAnchors.values()) {
    if (spawned >= maxBursts) {
      break;
    }
    if (anchor.dimensionId !== playerDimensionId || distanceSq2d(player.location, anchor.location) > radiusSq) {
      continue;
    }
    const random = mulberry32(hashString(`${anchor.key}:${system.currentTick}`));
    const location = {
      x: anchor.location.x + 0.5 + (random() - 0.5) * 3.4,
      y: anchor.location.y + 0.25 + random() * 1.8,
      z: anchor.location.z + 0.5 + (random() - 0.5) * 3.4
    };
    if (spawnParticle(player.dimension, cfg.particleId, cfg.fallbackParticleId, location, "terrain_waterfall_mist")) {
      anchor.lastSeenTick = system.currentTick;
      spawned++;
    }
  }
  return spawned;
}

function findWaterfallMistLocation(dimension, x, z, maxY, minY) {
  for (let y = Math.floor(maxY); y >= Math.floor(minY); y--) {
    const block = getBlockSafe(dimension, { x, y, z });
    if (!isWaterBlock(block) || !hasOpenSide(dimension, { x, y, z })) {
      continue;
    }

    let fallDepth = 0;
    for (let dy = 1; dy <= 18; dy++) {
      const below = getBlockSafe(dimension, { x, y: y - dy, z });
      if (!below) {
        break;
      }
      if (below.isAir || isWaterBlock(below)) {
        fallDepth++;
        continue;
      }
      if (fallDepth >= 4) {
        return { x, y: y - dy + 1, z };
      }
      break;
    }
  }
  return undefined;
}

function hasOpenSide(dimension, location) {
  const offsets = [
    { x: 1, z: 0 },
    { x: -1, z: 0 },
    { x: 0, z: 1 },
    { x: 0, z: -1 }
  ];
  for (const offset of offsets) {
    const side = getBlockSafe(dimension, {
      x: location.x + offset.x,
      y: location.y,
      z: location.z + offset.z
    });
    const lowerSide = getBlockSafe(dimension, {
      x: location.x + offset.x,
      y: location.y - 1,
      z: location.z + offset.z
    });
    if (side?.isAir || lowerSide?.isAir) {
      return true;
    }
  }
  return false;
}

function isForestishLocation(dimension, location) {
  const biomeId = getBiomeId(dimension, location);
  if (biomeId && /forest|jungle|taiga|grove|old_growth|highlands|woods|wooded|birch|spruce/i.test(biomeId)) {
    return true;
  }

  const surface = getBlockSafe(dimension, { x: location.x, y: location.y - 1, z: location.z });
  if (!surface || !FOREST_SURFACE_BLOCKS.has(surface.typeId)) {
    return false;
  }
  return hasNearbyTreeBlocks(dimension, location);
}

function hasNearbyTreeBlocks(dimension, location) {
  const checks = [
    { x: 0, y: 2, z: 0 },
    { x: 2, y: 2, z: 0 },
    { x: -2, y: 2, z: 0 },
    { x: 0, y: 2, z: 2 },
    { x: 0, y: 2, z: -2 },
    { x: 3, y: 4, z: 3 },
    { x: -3, y: 4, z: -3 },
    { x: 4, y: 5, z: 0 },
    { x: 0, y: 5, z: -4 }
  ];
  for (const offset of checks) {
    const block = getBlockSafe(dimension, {
      x: location.x + offset.x,
      y: location.y + offset.y,
      z: location.z + offset.z
    });
    const typeId = block?.typeId || "";
    if (typeId.includes("_leaves") || typeId.includes("_log") || typeId.includes("_stem")) {
      return true;
    }
  }
  return false;
}

function spawnParticle(dimension, particleId, fallbackParticleId, location, moduleName) {
  if (!requestParticles(moduleName, 1)) {
    return false;
  }
  try {
    dimension.spawnParticle(particleId, location);
    return true;
  } catch (_error) {
    if (!fallbackParticleId || fallbackParticleId === particleId) {
      return false;
    }
  }

  try {
    dimension.spawnParticle(fallbackParticleId, location);
    return true;
  } catch (_error) {
    return false;
  }
}

function isDue(player, key, intervalTicks) {
  const interval = Math.max(20, Math.floor(Number(intervalTicks || 20)));
  const id = `${key}:${player.id || player.name}`;
  const last = lastRuns.get(id) ?? -999999;
  if (system.currentTick - last < interval) {
    return false;
  }
  lastRuns.set(id, system.currentTick);
  return true;
}

function playerRandom(player, key, intervalTicks) {
  const slice = Math.floor(system.currentTick / Math.max(1, Number(intervalTicks || 20)));
  const px = Math.floor(player.location.x / 16);
  const pz = Math.floor(player.location.z / 16);
  return mulberry32(hashString(`${key}:${player.id || player.name}:${px}:${pz}:${slice}`));
}

function isNight() {
  const time = getTimeOfDay();
  return time >= 12500 && time <= 23500;
}

function getTimeOfDay() {
  try {
    if (typeof world.getTimeOfDay === "function") {
      return world.getTimeOfDay();
    }
    if (typeof world.getAbsoluteTime === "function") {
      return world.getAbsoluteTime() % 24000;
    }
  } catch (_error) {
    // Fall through to a stable local tick approximation.
  }
  return system.currentTick % 24000;
}

function getBiomeId(dimension, location) {
  try {
    const biome = typeof dimension.getBiome === "function" ? dimension.getBiome(location) : undefined;
    if (biome) {
      return biome.id || biome.typeId || biome.identifier;
    }
  } catch (_error) {
    // Biome lookup is optional on some runtimes.
  }

  try {
    const block = getBlockSafe(dimension, location);
    const biome = typeof block?.getBiome === "function" ? block.getBiome() : block?.biome;
    return biome?.id || biome?.typeId || biome?.identifier;
  } catch (_error) {
    return undefined;
  }
}

function pruneWaterfallAnchors() {
  lastAnchorPruneTick = system.currentTick;
  const cfg = TERRAIN_CONFIG.ambientParticles?.waterfallMist;
  const maxAnchors = Math.max(32, Number(cfg?.maxAnchors || 256));
  const staleBefore = system.currentTick - 24000;
  for (const [key, anchor] of waterfallMistAnchors.entries()) {
    if (anchor.lastSeenTick < staleBefore) {
      waterfallMistAnchors.delete(key);
    }
  }
  if (waterfallMistAnchors.size <= maxAnchors) {
    return;
  }
  const oldest = [...waterfallMistAnchors.values()]
    .sort((a, b) => a.lastSeenTick - b.lastSeenTick)
    .slice(0, waterfallMistAnchors.size - maxAnchors);
  for (const anchor of oldest) {
    waterfallMistAnchors.delete(anchor.key);
  }
}

function isWaterBlock(block) {
  try {
    return block ? WATER_BLOCKS.has(block.typeId) || block.isLiquid : false;
  } catch (_error) {
    return false;
  }
}

function distanceSq2d(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

function getDimensionId(dimension) {
  try {
    return String(dimension.id || "minecraft:overworld");
  } catch (_error) {
    return "minecraft:overworld";
  }
}

function isOverworld(player) {
  const id = getDimensionId(player?.dimension);
  return id === "overworld" || id === "minecraft:overworld";
}

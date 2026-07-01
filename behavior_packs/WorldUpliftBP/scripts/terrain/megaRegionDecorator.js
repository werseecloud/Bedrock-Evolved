import { system, world } from "@minecraft/server";
import { MutableConfig } from "../config.js";
import { enqueueSetBlock, queueSimplePlatform } from "../cities/structurePlacer.js";
import { Logger } from "../utils/logger.js";
import { hashString, mulberry32, randomInt } from "../utils/random.js";

const REGION_STYLES = Object.freeze([
  {
    id: "alpine_peaks",
    weight: 30,
    minY: 104,
    surfaceBlocks: ["minecraft:snow", "minecraft:stone", "minecraft:packed_ice"],
    accentBlocks: ["minecraft:deepslate", "minecraft:andesite", "minecraft:calcite"]
  },
  {
    id: "shattered_cliffs",
    weight: 24,
    minY: 76,
    surfaceBlocks: ["minecraft:stone", "minecraft:andesite", "minecraft:gravel"],
    accentBlocks: ["minecraft:deepslate", "minecraft:cobblestone", "minecraft:tuff"]
  },
  {
    id: "deep_valleys",
    weight: 18,
    minY: 52,
    surfaceBlocks: ["minecraft:moss_block", "minecraft:grass_block", "minecraft:water"],
    accentBlocks: ["minecraft:mossy_cobblestone", "minecraft:stone", "minecraft:clay"]
  },
  {
    id: "old_growth_highlands",
    weight: 18,
    minY: 70,
    surfaceBlocks: ["minecraft:podzol", "minecraft:moss_block", "minecraft:grass_block"],
    accentBlocks: ["minecraft:spruce_log", "minecraft:spruce_leaves", "minecraft:rooted_dirt"]
  },
  {
    id: "city_plains",
    weight: 10,
    minY: 58,
    surfaceBlocks: ["minecraft:grass_block", "minecraft:coarse_dirt", "minecraft:gravel"],
    accentBlocks: ["minecraft:cobblestone", "minecraft:stone_bricks", "minecraft:oak_log"]
  }
]);

const SURFACE_SOLIDS = new Set([
  "minecraft:grass_block",
  "minecraft:dirt",
  "minecraft:coarse_dirt",
  "minecraft:podzol",
  "minecraft:stone",
  "minecraft:andesite",
  "minecraft:granite",
  "minecraft:diorite",
  "minecraft:deepslate",
  "minecraft:tuff",
  "minecraft:moss_block",
  "minecraft:gravel",
  "minecraft:sand",
  "minecraft:snow"
]);

const decoratedChunks = new Set();
let initialized = false;

export function initMegaRegionDecorator() {
  if (initialized) {
    return;
  }
  initialized = true;
  system.runInterval(tickMegaRegions, MutableConfig.MEGA_REGION_SCAN_INTERVAL_TICKS);
  Logger.info("Mega region terrain decorator initialized.");
}

export function setMegaRegionsEnabled(enabled) {
  MutableConfig.MEGA_REGIONS_ENABLED = Boolean(enabled);
}

export function getMegaRegionStatus(player) {
  const region = player ? getRegionForLocation(player.location) : undefined;
  const suffix = region ? ` current=${region.style.id} region=${region.regionX},${region.regionZ}` : "";
  return `enabled=${MutableConfig.MEGA_REGIONS_ENABLED} size=${MutableConfig.MEGA_REGION_SIZE_BLOCKS} chunkRadius=${MutableConfig.MEGA_REGION_CHUNK_RADIUS} decorated=${decoratedChunks.size}${suffix}`;
}

export function decorateMegaRegionAroundPlayer(player, forced = false) {
  if (!forced && !MutableConfig.MEGA_REGIONS_ENABLED) {
    return 0;
  }
  if (!isOverworld(player)) {
    return 0;
  }

  const centerChunk = {
    x: Math.floor(player.location.x / 16),
    z: Math.floor(player.location.z / 16)
  };
  const region = getRegionForLocation(player.location);
  const candidates = getChunkCandidates(centerChunk, MutableConfig.MEGA_REGION_CHUNK_RADIUS, region);
  let decorated = 0;

  for (const chunk of candidates) {
    if (decorated >= MutableConfig.MEGA_REGION_MAX_CHUNKS_PER_SCAN) {
      break;
    }
    const key = `${player.dimension.id}:${chunk.x},${chunk.z}:${region.regionX},${region.regionZ}:${region.style.id}`;
    if (!forced && decoratedChunks.has(key)) {
      continue;
    }
    decoratedChunks.add(key);
    decorateChunkByStyle(player.dimension, chunk, region);
    decorated++;
  }

  if (decoratedChunks.size > 8192) {
    decoratedChunks.clear();
  }
  return decorated;
}

function tickMegaRegions() {
  if (!MutableConfig.MEGA_REGIONS_ENABLED) {
    return;
  }
  for (const player of world.getPlayers()) {
    try {
      decorateMegaRegionAroundPlayer(player);
    } catch (error) {
      Logger.debug(`Mega region decoration skipped: ${error}`);
    }
  }
}

function getChunkCandidates(centerChunk, radius, region) {
  const random = mulberry32(hashString(`${region.regionX}:${region.regionZ}:${centerChunk.x}:${centerChunk.z}`));
  const chunks = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      if (Math.abs(dx) + Math.abs(dz) > radius + 1) {
        continue;
      }
      chunks.push({
        x: centerChunk.x + dx,
        z: centerChunk.z + dz,
        score: Math.abs(dx) + Math.abs(dz) + random() * 0.75
      });
    }
  }
  chunks.sort((a, b) => a.score - b.score);
  return chunks;
}

function decorateChunkByStyle(dimension, chunk, region) {
  const random = mulberry32(hashString(`${dimension.id}:${chunk.x}:${chunk.z}:${region.style.id}`));
  const passes = Math.max(1, Math.floor(5 * MutableConfig.MEGA_REGION_DECORATION_DENSITY));

  for (let i = 0; i < passes; i++) {
    const x = chunk.x * 16 + randomInt(random, 1, 14);
    const z = chunk.z * 16 + randomInt(random, 1, 14);
    const y = findSurfaceY(dimension, x, z, 96);
    if (y === undefined || y < region.style.minY) {
      continue;
    }

    switch (region.style.id) {
      case "alpine_peaks":
        decorateAlpine(dimension, { x, y, z }, random);
        break;
      case "shattered_cliffs":
        decorateCliff(dimension, { x, y, z }, random);
        break;
      case "deep_valleys":
        decorateValley(dimension, { x, y, z }, random);
        break;
      case "old_growth_highlands":
        decorateHighlandForest(dimension, { x, y, z }, random);
        break;
      case "city_plains":
        decorateCityPlain(dimension, { x, y, z }, random);
        break;
      default:
        break;
    }
  }
}

function decorateAlpine(dimension, location, random) {
  if (!MutableConfig.EXTENDED_MOUNTAIN_DECORATION_ENABLED) {
    return;
  }
  queueSimplePlatform(dimension, { x: location.x, y: location.y - 1, z: location.z }, randomInt(random, 2, 5), pick(random, ["minecraft:snow", "minecraft:stone"]));
  const height = randomInt(random, 3, 11);
  for (let i = 0; i < height; i++) {
    enqueueSetBlock(dimension, { x: location.x, y: location.y + i, z: location.z }, i > height - 3 ? "minecraft:snow" : pick(random, ["minecraft:stone", "minecraft:andesite", "minecraft:deepslate"]));
  }
  if (random() < 0.42) {
    queueRockRib(dimension, location, random, randomInt(random, 4, 9));
  }
}

function decorateCliff(dimension, location, random) {
  queueRockRib(dimension, location, random, randomInt(random, 5, 14));
  if (random() < 0.3) {
    queueSimplePlatform(dimension, { x: location.x, y: location.y - 1, z: location.z }, randomInt(random, 2, 4), "minecraft:gravel");
  }
}

function decorateValley(dimension, location, random) {
  queueSimplePlatform(dimension, { x: location.x, y: location.y - 1, z: location.z }, randomInt(random, 2, 5), "minecraft:moss_block");
  if (random() < 0.28) {
    enqueueSetBlock(dimension, location, "minecraft:water");
  } else if (random() < 0.65) {
    queueShrub(dimension, location, random);
  }
}

function decorateHighlandForest(dimension, location, random) {
  if (random() < 0.72) {
    queueTallSpruce(dimension, location, random);
  } else {
    queueSimplePlatform(dimension, { x: location.x, y: location.y - 1, z: location.z }, randomInt(random, 2, 4), "minecraft:podzol");
  }
}

function decorateCityPlain(dimension, location, random) {
  if (random() < 0.55) {
    queueSimplePlatform(dimension, { x: location.x, y: location.y - 1, z: location.z }, randomInt(random, 2, 4), pick(random, ["minecraft:coarse_dirt", "minecraft:gravel"]));
  } else {
    queueLowWallHint(dimension, location, random);
  }
}

function queueRockRib(dimension, location, random, height) {
  const block = pick(random, ["minecraft:stone", "minecraft:andesite", "minecraft:deepslate", "minecraft:tuff"]);
  for (let y = 0; y < height; y++) {
    enqueueSetBlock(dimension, { x: location.x, y: location.y + y, z: location.z }, block);
    if (y % 3 === 0) {
      enqueueSetBlock(dimension, { x: location.x + 1, y: location.y + y, z: location.z }, block);
    }
  }
}

function queueTallSpruce(dimension, location, random) {
  const height = randomInt(random, 7, 13);
  for (let y = 0; y < height; y++) {
    enqueueSetBlock(dimension, { x: location.x, y: location.y + y, z: location.z }, "minecraft:spruce_log");
  }
  const top = location.y + height;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      if (Math.abs(dx) + Math.abs(dz) <= 3) {
        enqueueSetBlock(dimension, { x: location.x + dx, y: top - 2, z: location.z + dz }, "minecraft:spruce_leaves");
        enqueueSetBlock(dimension, { x: location.x + dx, y: top - 1, z: location.z + dz }, "minecraft:spruce_leaves");
      }
    }
  }
  enqueueSetBlock(dimension, { x: location.x, y: top, z: location.z }, "minecraft:spruce_leaves");
}

function queueShrub(dimension, location, random) {
  enqueueSetBlock(dimension, location, pick(random, ["minecraft:azalea", "minecraft:flowering_azalea", "minecraft:fern"]));
}

function queueLowWallHint(dimension, location, random) {
  const length = randomInt(random, 3, 8);
  const alongX = random() > 0.5;
  for (let i = 0; i < length; i++) {
    enqueueSetBlock(dimension, {
      x: location.x + (alongX ? i : 0),
      y: location.y,
      z: location.z + (alongX ? 0 : i)
    }, pick(random, ["minecraft:cobblestone", "minecraft:stone_bricks"]));
  }
}

function findSurfaceY(dimension, x, z, fallbackY) {
  let minY = fallbackY - 80;
  let maxY = fallbackY + 220;
  try {
    if (dimension.heightRange) {
      minY = Math.max(minY, dimension.heightRange.min + 1);
      maxY = Math.min(maxY, dimension.heightRange.max - 2);
    }
  } catch (_error) {
    // Use broad local range.
  }

  for (let y = maxY; y >= minY; y--) {
    try {
      const block = dimension.getBlock({ x, y, z });
      const above = dimension.getBlock({ x, y: y + 1, z });
      if (block && above && SURFACE_SOLIDS.has(block.typeId) && above.isAir) {
        return y + 1;
      }
    } catch (_error) {
      return undefined;
    }
  }
  return undefined;
}

function getRegionForLocation(location) {
  const size = Math.max(512, MutableConfig.MEGA_REGION_SIZE_BLOCKS);
  const regionX = Math.floor(location.x / size);
  const regionZ = Math.floor(location.z / size);
  const random = mulberry32(hashString(`mega-region:${regionX}:${regionZ}`));
  return {
    regionX,
    regionZ,
    style: weightedPick(random, REGION_STYLES)
  };
}

function weightedPick(random, entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry;
    }
  }
  return entries[0];
}

function pick(random, values) {
  return values[Math.floor(random() * values.length)];
}

function isOverworld(player) {
  try {
    const id = String(player.dimension.id);
    return id === "overworld" || id === "minecraft:overworld";
  } catch (_error) {
    return false;
  }
}

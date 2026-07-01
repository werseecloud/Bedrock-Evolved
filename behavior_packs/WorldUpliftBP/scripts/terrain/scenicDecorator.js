import { world } from "@minecraft/server";
import { Logger } from "../utils/logger.js";
import { hashString, mulberry32, randomInt } from "../utils/random.js";
import { floorVec } from "../utils/vectors.js";
import { enqueueSetBlock, queueSimplePlatform } from "../cities/structurePlacer.js";

const SURFACE_SOLIDS = new Set([
  "minecraft:grass_block",
  "minecraft:dirt",
  "minecraft:podzol",
  "minecraft:stone",
  "minecraft:andesite",
  "minecraft:deepslate",
  "minecraft:moss_block"
]);

export function decorateAroundPlayer(player, radius = 24) {
  const center = floorVec(player.location);
  const random = mulberry32(hashString(`${player.name}:${center.x}:${center.z}:${world.getAbsoluteTime?.() || 0}`));
  let queued = 0;

  for (let i = 0; i < 18; i++) {
    const x = center.x + randomInt(random, -radius, radius);
    const z = center.z + randomInt(random, -radius, radius);
    const y = findSurfaceY(player.dimension, x, z, center.y);
    if (y === undefined) {
      continue;
    }

    const roll = random();
    if (roll < 0.34) {
      queueBoulder(player.dimension, { x, y, z }, random);
    } else if (roll < 0.68) {
      queueSmallTree(player.dimension, { x, y, z }, random);
    } else if (roll < 0.82) {
      queueMossPatch(player.dimension, { x, y: y - 1, z }, random);
    } else {
      queueWaterHint(player.dimension, { x, y, z });
    }
    queued++;
  }

  Logger.tell(player, `Queued scenic decoration around you (${queued} anchors).`);
}

function findSurfaceY(dimension, x, z, nearY) {
  let rangeMin = nearY - 48;
  let rangeMax = nearY + 48;
  try {
    if (dimension.heightRange) {
      rangeMin = Math.max(rangeMin, dimension.heightRange.min + 1);
      rangeMax = Math.min(rangeMax, dimension.heightRange.max - 2);
    }
  } catch (_error) {
    // Use local search range.
  }

  for (let y = rangeMax; y >= rangeMin; y--) {
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

function queueBoulder(dimension, location, random) {
  const radius = randomInt(random, 1, 2);
  queueSimplePlatform(dimension, { x: location.x, y: location.y, z: location.z }, radius, "minecraft:andesite");
  enqueueSetBlock(dimension, { x: location.x, y: location.y + 1, z: location.z }, "minecraft:stone");
  if (random() > 0.55) {
    enqueueSetBlock(dimension, { x: location.x, y: location.y + 2, z: location.z }, "minecraft:cobblestone");
  }
}

function queueSmallTree(dimension, location, random) {
  const height = randomInt(random, 4, 7);
  for (let y = 0; y < height; y++) {
    enqueueSetBlock(dimension, { x: location.x, y: location.y + y, z: location.z }, "minecraft:spruce_log");
  }
  const top = location.y + height;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      if (Math.abs(dx) + Math.abs(dz) <= 3) {
        enqueueSetBlock(dimension, { x: location.x + dx, y: top - 1, z: location.z + dz }, "minecraft:spruce_leaves");
      }
      if (Math.abs(dx) + Math.abs(dz) <= 2) {
        enqueueSetBlock(dimension, { x: location.x + dx, y: top, z: location.z + dz }, "minecraft:spruce_leaves");
      }
    }
  }
  enqueueSetBlock(dimension, { x: location.x, y: top + 1, z: location.z }, "minecraft:spruce_leaves");
}

function queueMossPatch(dimension, location, random) {
  const radius = randomInt(random, 2, 4);
  queueSimplePlatform(dimension, location, radius, "minecraft:moss_block");
}

function queueWaterHint(dimension, location) {
  enqueueSetBlock(dimension, location, "minecraft:water");
}


import { TERRAIN_CONFIG } from "./terrainConfig.js";
import { findSurfaceY, hasPlayerBuildNearby } from "./utils/blockSafety.js";
import { queueTerrainBlock, queueTerrainPlatform } from "./utils/structurePlacement.js";
import { hashString, mulberry32, randomInt } from "../utils/random.js";

export function runForestDensityPass(player, forced = false) {
  if (!forced && (!TERRAIN_CONFIG.enabled || !TERRAIN_CONFIG.forests.densityVariationEnabled)) {
    return 0;
  }
  if (!isOverworld(player)) {
    return 0;
  }

  const random = mulberry32(hashString(`forest:${player.dimension.id}:${Math.floor(player.location.x / 64)}:${Math.floor(player.location.z / 64)}`));
  const maxTrees = Math.min(TERRAIN_CONFIG.forests.maxTreesPerDecorationPass, forced ? 16 : 8);
  let placed = 0;

  for (let i = 0; i < maxTrees; i++) {
    const x = Math.floor(player.location.x + randomInt(random, -96, 96));
    const z = Math.floor(player.location.z + randomInt(random, -96, 96));
    const y = findSurfaceY(player.dimension, x, z, 180);
    if (y === undefined || y < 55 || hasPlayerBuildNearby(player.dimension, { x, y, z }, 5)) {
      continue;
    }
    if (random() < TERRAIN_CONFIG.forests.denseForestChance) {
      queueTallTree(player.dimension, { x, y, z }, random, "minecraft:spruce_log", "minecraft:spruce_leaves");
      queueTerrainPlatform(player.dimension, { x, y: y - 1, z }, 3, "minecraft:podzol");
    } else if (random() < TERRAIN_CONFIG.forests.sparseForestChance) {
      queueTallTree(player.dimension, { x, y, z }, random, "minecraft:oak_log", "minecraft:oak_leaves");
      queueTerrainPlatform(player.dimension, { x, y: y - 1, z }, 2, "minecraft:coarse_dirt");
    } else {
      queueTerrainBlock(player.dimension, { x, y, z }, random() < 0.5 ? "minecraft:fern" : "minecraft:azalea");
      queueTerrainPlatform(player.dimension, { x, y: y - 1, z }, 2, "minecraft:moss_block");
    }
    placed++;
  }

  return placed;
}

function queueTallTree(dimension, location, random, logBlock, leafBlock) {
  const height = randomInt(random, 5, 11);
  for (let y = 0; y < height; y++) {
    queueTerrainBlock(dimension, { x: location.x, y: location.y + y, z: location.z }, logBlock);
  }
  const top = location.y + height;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      if (Math.abs(dx) + Math.abs(dz) <= 3) {
        queueTerrainBlock(dimension, { x: location.x + dx, y: top - 2, z: location.z + dz }, leafBlock);
        queueTerrainBlock(dimension, { x: location.x + dx, y: top - 1, z: location.z + dz }, leafBlock);
      }
    }
  }
  queueTerrainBlock(dimension, { x: location.x, y: top, z: location.z }, leafBlock);
}

function isOverworld(player) {
  return player?.dimension?.id === "minecraft:overworld";
}

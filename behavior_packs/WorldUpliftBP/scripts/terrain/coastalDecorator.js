import { TERRAIN_CONFIG } from "./terrainConfig.js";
import { TERRAIN_STRUCTURE_IDS } from "./featureRegistry.js";
import { findSurfaceY, getBlockSafe, hasPlayerBuildNearby } from "./utils/blockSafety.js";
import { queueTerrainBlock, queueTerrainPlatform, queueTerrainStructure } from "./utils/structurePlacement.js";
import { hashString, mulberry32, randomInt } from "../utils/random.js";

export function runCoastalPass(player, forced = false) {
  if (!forced && (!TERRAIN_CONFIG.enabled || !TERRAIN_CONFIG.coastalCliffs.enabled)) {
    return 0;
  }
  if (!isOverworld(player)) {
    return 0;
  }

  const random = mulberry32(hashString(`coast:${player.dimension.id}:${Math.floor(player.location.x / 96)}:${Math.floor(player.location.z / 96)}`));
  let placed = 0;
  const attempts = forced ? 10 : 4;

  for (let i = 0; i < attempts; i++) {
    const x = Math.floor(player.location.x + randomInt(random, -104, 104));
    const z = Math.floor(player.location.z + randomInt(random, -104, 104));
    const y = findSurfaceY(player.dimension, x, z, 140);
    if (y === undefined || y > 86 || y < 56 || !nearWater(player.dimension, x, y, z) || hasPlayerBuildNearby(player.dimension, { x, y, z }, 6)) {
      continue;
    }
    queueTerrainPlatform(player.dimension, { x, y: y - 1, z }, randomInt(random, 2, 4), random() < 0.55 ? "minecraft:gravel" : "minecraft:stone");
    if (TERRAIN_CONFIG.coastalCliffs.seaCavesEnabled && random() < 0.25) {
      queueTerrainStructure(player.dimension, { x: x - 4, y: y - 2, z: z - 4 }, TERRAIN_STRUCTURE_IDS.seaCave, { x: 9, y: 6, z: 9 }, () => queueFallbackSeaCave(player.dimension, { x, y, z }));
    }
    if (random() < TERRAIN_CONFIG.coastalCliffs.coastalArchChance || forced) {
      queueTerrainStructure(player.dimension, { x: x - 4, y, z: z - 4 }, TERRAIN_STRUCTURE_IDS.coastalArch, { x: 10, y: 9, z: 5 }, undefined);
    }
    placed++;
  }
  return placed;
}

function nearWater(dimension, x, y, z) {
  for (let dx = -5; dx <= 5; dx += 5) {
    for (let dz = -5; dz <= 5; dz += 5) {
      const block = getBlockSafe(dimension, { x: x + dx, y: y - 1, z: z + dz });
      if (block?.isLiquid || block?.typeId === "minecraft:water") {
        return true;
      }
    }
  }
  return false;
}

function queueFallbackSeaCave(dimension, location) {
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = 0; dy <= 2; dy++) {
      queueTerrainBlock(dimension, { x: location.x + dx, y: location.y + dy, z: location.z }, "minecraft:air", { force: true });
    }
  }
  queueTerrainPlatform(dimension, { x: location.x, y: location.y - 1, z: location.z }, 3, "minecraft:gravel");
}

function isOverworld(player) {
  return player?.dimension?.id === "minecraft:overworld";
}

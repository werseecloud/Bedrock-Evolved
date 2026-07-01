import { TERRAIN_CONFIG } from "./terrainConfig.js";
import { TERRAIN_STRUCTURE_IDS } from "./featureRegistry.js";
import { findSurfaceY, getBlockSafe, hasPlayerBuildNearby } from "./utils/blockSafety.js";
import { queueTerrainBlock, queueTerrainPlatform, queueTerrainStructure } from "./utils/structurePlacement.js";
import { hashString, mulberry32, randomInt } from "../utils/random.js";

export function runWaterfallPass(player, forced = false) {
  if (!forced && (!TERRAIN_CONFIG.enabled || !TERRAIN_CONFIG.waterfalls.enabled)) {
    return 0;
  }
  if (!isOverworld(player)) {
    return 0;
  }

  const random = mulberry32(hashString(`waterfall:${player.dimension.id}:${Math.floor(player.location.x / 48)}:${Math.floor(player.location.z / 48)}`));
  let placed = 0;
  const attempts = forced ? 12 : 5;

  for (let i = 0; i < attempts; i++) {
    const x = Math.floor(player.location.x + randomInt(random, -88, 88));
    const z = Math.floor(player.location.z + randomInt(random, -88, 88));
    const y = findSurfaceY(player.dimension, x, z, 220);
    if (y === undefined || y < 72 || hasPlayerBuildNearby(player.dimension, { x, y, z }, 6)) {
      continue;
    }
    if (!looksLikeDrop(player.dimension, x, y, z)) {
      continue;
    }

    queueTerrainBlock(player.dimension, { x, y, z }, "minecraft:water", { force: true });
    if (TERRAIN_CONFIG.waterfalls.addWetStone) {
      queueTerrainPlatform(player.dimension, { x, y: y - 1, z }, 2, "minecraft:mossy_cobblestone");
    }
    if (TERRAIN_CONFIG.waterfalls.createBottomPools) {
      const poolY = Math.max(45, y - randomInt(random, 10, 28));
      queueTerrainPlatform(player.dimension, { x, y: poolY, z }, 3, "minecraft:water");
      queueTerrainPlatform(player.dimension, { x, y: poolY - 1, z }, 4, "minecraft:moss_block");
    }
    queueTerrainStructure(player.dimension, { x: x - 4, y: y - 1, z: z - 4 }, TERRAIN_STRUCTURE_IDS.waterfallCliff, { x: 9, y: 18, z: 9 }, () => {
      queueTerrainPlatform(player.dimension, { x, y: y - 1, z }, 3, "minecraft:stone");
    });
    if (TERRAIN_CONFIG.waterfalls.addMistParticles) {
      spawnMist(player.dimension, { x, y: y - 4, z });
    }
    placed++;
  }

  return placed;
}

function looksLikeDrop(dimension, x, y, z) {
  const directions = [
    { x: 4, z: 0 },
    { x: -4, z: 0 },
    { x: 0, z: 4 },
    { x: 0, z: -4 }
  ];
  for (const direction of directions) {
    const lower = getBlockSafe(dimension, { x: x + direction.x, y: y - 12, z: z + direction.z });
    const upper = getBlockSafe(dimension, { x: x + direction.x, y: y - 2, z: z + direction.z });
    if (upper?.isAir && lower && !lower.isAir) {
      return true;
    }
  }
  return false;
}

function spawnMist(dimension, location) {
  try {
    dimension.spawnParticle("minecraft:basic_smoke_particle", location);
  } catch (_error) {
    // Particles are optional.
  }
}

function isOverworld(player) {
  return player?.dimension?.id === "minecraft:overworld";
}

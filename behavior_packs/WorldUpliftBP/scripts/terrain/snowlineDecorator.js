import { TERRAIN_CONFIG } from "./terrainConfig.js";
import { findSurfaceY, hasPlayerBuildNearby } from "./utils/blockSafety.js";
import { queueTerrainBlock, queueTerrainPlatform } from "./utils/structurePlacement.js";
import { hashString, mulberry32, randomInt } from "../utils/random.js";

export function runSnowlinePass(player, forced = false) {
  if (!forced && (!TERRAIN_CONFIG.enabled || !TERRAIN_CONFIG.snowline.enabled)) {
    return 0;
  }
  if (!isOverworld(player)) {
    return 0;
  }
  const random = mulberry32(hashString(`snowline:${player.dimension.id}:${Math.floor(player.location.x / 32)}:${Math.floor(player.location.z / 32)}`));
  const radius = TERRAIN_CONFIG.budget.playerScanRadiusChunks;
  let placed = 0;

  for (let i = 0; i < TERRAIN_CONFIG.budget.maxDecorationsPerPlayerPass; i++) {
    const x = Math.floor(player.location.x + randomInt(random, -radius * 16, radius * 16));
    const z = Math.floor(player.location.z + randomInt(random, -radius * 16, radius * 16));
    const y = findSurfaceY(player.dimension, x, z, 230);
    if (y === undefined || y < getSnowlineY(y)) {
      continue;
    }
    const location = { x, y, z };
    if (hasPlayerBuildNearby(player.dimension, location, 4)) {
      continue;
    }
    const block = TERRAIN_CONFIG.snowline.usePowderSnow && random() < 0.15 ? "minecraft:powder_snow" : "minecraft:snow";
    if (queueTerrainBlock(player.dimension, location, block)) {
      placed++;
    }
    if (TERRAIN_CONFIG.snowline.useIce && random() < 0.18) {
      queueTerrainPlatform(player.dimension, { x, y: y - 1, z }, 1, "minecraft:ice");
    }
  }
  return placed;
}

function getSnowlineY(surfaceY) {
  if (surfaceY >= 160) {
    return TERRAIN_CONFIG.snowline.shatteredCliffSnowY;
  }
  if (surfaceY >= 140) {
    return TERRAIN_CONFIG.snowline.highlandPatchySnowY;
  }
  return TERRAIN_CONFIG.snowline.alpineSnowY;
}

function isOverworld(player) {
  return player?.dimension?.id === "minecraft:overworld";
}

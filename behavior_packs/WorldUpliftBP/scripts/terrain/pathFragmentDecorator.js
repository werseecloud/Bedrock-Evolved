import { TERRAIN_CONFIG } from "./terrainConfig.js";
import { TERRAIN_STRUCTURE_IDS } from "./featureRegistry.js";
import { findSurfaceY, hasPlayerBuildNearby } from "./utils/blockSafety.js";
import { queueTerrainBlock, queueTerrainStructure } from "./utils/structurePlacement.js";
import { hashString, mulberry32, randomInt } from "../utils/random.js";

const PATH_BLOCKS = ["minecraft:coarse_dirt", "minecraft:gravel", "minecraft:mossy_cobblestone", "minecraft:cracked_stone_bricks"];

export function runPathFragmentPass(player, forced = false) {
  if (!forced && (!TERRAIN_CONFIG.enabled || !TERRAIN_CONFIG.paths.naturalPathsEnabled)) {
    return 0;
  }
  if (!isOverworld(player)) {
    return 0;
  }

  const random = mulberry32(hashString(`paths:${player.dimension.id}:${Math.floor(player.location.x / 96)}:${Math.floor(player.location.z / 96)}`));
  let placed = 0;
  const segments = Math.min(TERRAIN_CONFIG.paths.maxPathSegmentsPerPass, forced ? 8 : 3);

  for (let i = 0; i < segments; i++) {
    const startX = Math.floor(player.location.x + randomInt(random, -88, 88));
    const startZ = Math.floor(player.location.z + randomInt(random, -88, 88));
    const length = randomInt(random, 5, 14);
    const dx = random() < 0.5 ? 1 : 0;
    const dz = dx ? 0 : 1;
    for (let step = 0; step < length; step++) {
      const x = startX + dx * step;
      const z = startZ + dz * step;
      const y = findSurfaceY(player.dimension, x, z, 160);
      if (y === undefined || hasPlayerBuildNearby(player.dimension, { x, y, z }, 3)) {
        continue;
      }
      queueTerrainBlock(player.dimension, { x, y: y - 1, z }, PATH_BLOCKS[Math.floor(random() * PATH_BLOCKS.length)]);
      placed++;
    }
    if (TERRAIN_CONFIG.paths.ancientRoadRuinsEnabled && random() < 0.15) {
      const y = findSurfaceY(player.dimension, startX, startZ, 160);
      if (y !== undefined) {
        queueTerrainStructure(player.dimension, { x: startX - 3, y, z: startZ - 3 }, TERRAIN_STRUCTURE_IDS.ancientRoad, { x: 7, y: 3, z: 7 }, undefined);
      }
    }
  }
  return placed;
}

function isOverworld(player) {
  return player?.dimension?.id === "minecraft:overworld";
}

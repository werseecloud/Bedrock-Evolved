import { TERRAIN_CONFIG } from "./terrainConfig.js";
import { TERRAIN_STRUCTURE_IDS } from "./featureRegistry.js";
import { findSurfaceY, hasPlayerBuildNearby } from "./utils/blockSafety.js";
import { queueTerrainBlock, queueTerrainPlatform, queueTerrainStructure } from "./utils/structurePlacement.js";
import { hashString, mulberry32, randomInt } from "../utils/random.js";

export function runCaveEntrancePass(player, forced = false) {
  if (!forced && (!TERRAIN_CONFIG.enabled || !TERRAIN_CONFIG.caves.cliffCaveEntrancesEnabled)) {
    return 0;
  }
  if (!isOverworld(player)) {
    return 0;
  }
  const random = mulberry32(hashString(`caves:${player.dimension.id}:${Math.floor(player.location.x / 64)}:${Math.floor(player.location.z / 64)}`));
  let placed = 0;
  const attempts = forced ? 8 : 3;

  for (let i = 0; i < attempts; i++) {
    const x = Math.floor(player.location.x + randomInt(random, -96, 96));
    const z = Math.floor(player.location.z + randomInt(random, -96, 96));
    const surfaceY = findSurfaceY(player.dimension, x, z, 210);
    if (surfaceY === undefined || surfaceY < 62 || surfaceY > 190) {
      continue;
    }
    const y = surfaceY - randomInt(random, 4, 11);
    const location = { x, y, z };
    if (hasPlayerBuildNearby(player.dimension, location, 7)) {
      continue;
    }

    const structure = surfaceY > 150
      ? TERRAIN_STRUCTURE_IDS.frozenCave
      : random() < 0.55 ? TERRAIN_STRUCTURE_IDS.mossyCave : TERRAIN_STRUCTURE_IDS.largeCave;
    queueTerrainStructure(player.dimension, { x: x - 4, y, z: z - 4 }, structure, { x: 9, y: 7, z: 9 }, () => queueFallbackCave(player.dimension, location));
    placed++;
  }
  return placed;
}

function queueFallbackCave(dimension, location) {
  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = 0; dy <= 3; dy++) {
      queueTerrainBlock(dimension, { x: location.x + dx, y: location.y + dy, z: location.z }, "minecraft:air", { force: true });
    }
  }
  queueTerrainPlatform(dimension, { x: location.x, y: location.y - 1, z: location.z }, 4, "minecraft:gravel");
  queueTerrainBlock(dimension, { x: location.x, y: location.y, z: location.z + 3 }, "minecraft:torch");
}

function isOverworld(player) {
  return player?.dimension?.id === "minecraft:overworld";
}

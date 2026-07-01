import { TERRAIN_CONFIG, getTerrainProfileSettings } from "./terrainConfig.js";
import { TERRAIN_STRUCTURE_IDS } from "./featureRegistry.js";
import { registerLandmark, hasNearbyLandmark } from "./landmarkRegistry.js";
import { findSurfaceY, hasPlayerBuildNearby } from "./utils/blockSafety.js";
import { queueTerrainBlock, queueTerrainPlatform, queueTerrainStructure } from "./utils/structurePlacement.js";
import { hashString, mulberry32, randomInt } from "../utils/random.js";

const LANDMARKS = [
  { type: "ancient_tower", chanceKey: "ancientTowerChance", structure: TERRAIN_STRUCTURE_IDS.ancientTower, size: { x: 9, y: 18, z: 9 } },
  { type: "ruined_castle", chanceKey: "ruinedCastleChance", structure: TERRAIN_STRUCTURE_IDS.ruinedCastle, size: { x: 22, y: 14, z: 20 } },
  { type: "crater_lake", chanceKey: "craterLakeChance", structure: TERRAIN_STRUCTURE_IDS.craterLake, size: { x: 24, y: 8, z: 24 } },
  { type: "floating_cliff", chanceKey: "floatingCliffChance", structure: TERRAIN_STRUCTURE_IDS.floatingCliff, size: { x: 18, y: 12, z: 18 } }
];

export function tryGenerateLandmarkNearPlayer(player, forced = false) {
  if (!forced && (!TERRAIN_CONFIG.enabled || !TERRAIN_CONFIG.landmarks.enabled)) {
    return undefined;
  }
  if (!isOverworld(player)) {
    return undefined;
  }
  const random = mulberry32(hashString(`landmark:${player.dimension.id}:${Math.floor(player.location.x / 256)}:${Math.floor(player.location.z / 256)}`));
  const settings = getTerrainProfileSettings();

  if (!forced && random() > TERRAIN_CONFIG.landmarks.megaLandmarkChance * settings.landmarkScale) {
    return undefined;
  }

  const candidate = pickLandmark(random, forced);
  if (!candidate) {
    return undefined;
  }

  const x = Math.floor(player.location.x + randomInt(random, -180, 180));
  const z = Math.floor(player.location.z + randomInt(random, -180, 180));
  const y = findSurfaceY(player.dimension, x, z, 230);
  if (y === undefined || hasNearbyLandmark(player.dimension.id, x, z, 220) || hasPlayerBuildNearby(player.dimension, { x, y, z }, 12)) {
    return undefined;
  }

  const location = { x: x - Math.floor(candidate.size.x / 2), y, z: z - Math.floor(candidate.size.z / 2) };
  queueTerrainStructure(player.dimension, location, candidate.structure, candidate.size, () => queueFallbackLandmark(player.dimension, { x, y, z }, candidate.type));
  return registerLandmark({
    type: candidate.type,
    dimension: player.dimension.id,
    x,
    y,
    z,
    biome: "be_terrain:auto",
    structureName: candidate.structure,
    discoveredByPlayers: [player.name]
  });
}

function pickLandmark(random, forced) {
  if (forced) {
    return LANDMARKS[Math.floor(random() * LANDMARKS.length)];
  }
  for (const landmark of LANDMARKS) {
    if (random() < TERRAIN_CONFIG.landmarks[landmark.chanceKey]) {
      return landmark;
    }
  }
  return undefined;
}

function queueFallbackLandmark(dimension, location, type) {
  if (type === "crater_lake") {
    queueTerrainPlatform(dimension, { x: location.x, y: location.y - 1, z: location.z }, 8, "minecraft:tuff");
    queueTerrainPlatform(dimension, { x: location.x, y: location.y, z: location.z }, 5, "minecraft:water");
    return;
  }
  if (type === "floating_cliff") {
    for (let y = 0; y < 6; y++) {
      const radius = Math.max(1, 5 - y);
      queueTerrainPlatform(dimension, { x: location.x, y: location.y + 18 + y, z: location.z }, radius, y > 4 ? "minecraft:grass_block" : "minecraft:stone");
    }
    queueTerrainBlock(dimension, { x: location.x, y: location.y + 17, z: location.z }, "minecraft:glowstone");
    return;
  }
  const height = type === "ruined_castle" ? 9 : 14;
  queueTerrainPlatform(dimension, { x: location.x, y: location.y - 1, z: location.z }, type === "ruined_castle" ? 7 : 4, "minecraft:cracked_stone_bricks");
  for (let y = 0; y < height; y++) {
    queueTerrainBlock(dimension, { x: location.x, y: location.y + y, z: location.z }, "minecraft:stone_bricks");
    if (y % 3 === 0) {
      queueTerrainBlock(dimension, { x: location.x + 1, y: location.y + y, z: location.z }, "minecraft:mossy_cobblestone");
    }
  }
}

function isOverworld(player) {
  return player?.dimension?.id === "minecraft:overworld";
}

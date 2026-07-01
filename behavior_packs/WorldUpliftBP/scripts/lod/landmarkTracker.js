import { system } from "@minecraft/server";
import { Logger } from "../utils/logger.js";
import { distance2D } from "../utils/vectors.js";
import { createCity, findNearestCity } from "../cities/cityRegistry.js";
import { decorateAroundPlayer } from "../terrain/scenicDecorator.js";
import { enqueueStructure, queueSimplePlatform } from "../cities/structurePlacer.js";
import { LODConfig } from "./lodConfig.js";
import {
  findNearbyRecords,
  markConverted,
  markImpostorActive,
  markImpostorInactive
} from "./lodRegistry.js";
import { canPlaceLodStructure, recordLodPlacement, recycleLodPlacement } from "./lodBudget.js";

const STRUCTURE_SIZES = {
  "lod:mountain_silhouette_01": { x: 15, y: 18, z: 3 },
  "lod:mountain_silhouette_02": { x: 21, y: 16, z: 3 },
  "lod:mountain_silhouette_03": { x: 19, y: 22, z: 3 },
  "lod:far_cliff_wall_01": { x: 19, y: 13, z: 3 },
  "lod:far_peak_snowcap_01": { x: 13, y: 17, z: 3 },
  "lod:far_city_skyline_01": { x: 21, y: 14, z: 5 },
  "lod:far_city_skyline_02": { x: 17, y: 12, z: 5 },
  "lod:far_castle_silhouette_01": { x: 19, y: 16, z: 5 },
  "lod:far_forest_band_01": { x: 23, y: 9, z: 5 },
  "lod:distant_ruin_silhouette_01": { x: 13, y: 10, z: 5 }
};

export function updateLandmarksForPlayer(player) {
  const maxBlocks = LODConfig.LOD_SKYLINE_RADIUS_CHUNKS * 16;
  const minBlocks = LODConfig.LOD_REAL_RADIUS_CHUNKS * 16;
  const playerKey = player.name;
  const records = findNearbyRecords(player.location, maxBlocks, (record) => !record.convertedToReal);
  records.sort((a, b) => Number(b.visualPriority || 0) - Number(a.visualPriority || 0));

  for (const record of records) {
    const distance = distance2D({ x: record.approximateX, z: record.approximateZ }, player.location);
    if (distance <= minBlocks) {
      convertLandmarkToReal(player, record);
      recycleLodPlacement(playerKey, record.landmarkId);
      continue;
    }

    if (distance > LODConfig.LOD_RECYCLE_DISTANCE_CHUNKS * 16) {
      if (record.activeImpostorEntityOrStructureId) {
        markImpostorInactive(record);
        recycleLodPlacement(playerKey, record.landmarkId);
      }
      continue;
    }

    if (!record.activeImpostorEntityOrStructureId && canPlaceLodStructure(playerKey)) {
      placeImpostorNearPlayer(player, record);
      recordLodPlacement(playerKey, record.landmarkId);
    }
  }
}

function placeImpostorNearPlayer(player, record) {
  const location = chooseLoadedImpostorLocation(player, record);
  if (!location) {
    return;
  }

  const size = STRUCTURE_SIZES[record.impostorStructure] || { x: 9, y: 9, z: 5 };
  enqueueStructure({
    identifier: record.impostorStructure,
    dimension: player.dimension,
    location,
    size,
    fallback: () => queueSimplePlatform(player.dimension, { x: location.x + Math.floor(size.x / 2), y: location.y, z: location.z + Math.floor(size.z / 2) }, 3, fallbackBlockFor(record))
  });

  markImpostorActive(record, `structure:${record.impostorStructure}:${location.x}:${location.y}:${location.z}`, player.name);
  if (LODConfig.LOD_DEBUG) {
    Logger.tell(player, `LOD placed ${record.type} impostor ${record.impostorStructure} for ${record.landmarkId}.`);
  }
}

function chooseLoadedImpostorLocation(player, record) {
  const px = player.location.x;
  const pz = player.location.z;
  const dx = record.approximateX - px;
  const dz = record.approximateZ - pz;
  const length = Math.max(1, Math.sqrt(dx * dx + dz * dz));
  const targetDistance = Math.min(LODConfig.LOD_NEAR_RADIUS_CHUNKS * 16, Math.max(64, length * 0.18));
  const x = Math.floor(px + (dx / length) * targetDistance);
  const z = Math.floor(pz + (dz / length) * targetDistance);
  const y = findLoadedSurfaceY(player.dimension, x, z, Math.floor(player.location.y));
  if (y === undefined) {
    return undefined;
  }
  return { x, y, z };
}

function findLoadedSurfaceY(dimension, x, z, nearY) {
  const low = Math.max(-64, nearY - 48);
  const high = Math.min(320, nearY + 80);
  for (let y = high; y >= low; y--) {
    try {
      const block = dimension.getBlock({ x, y, z });
      const above = dimension.getBlock({ x, y: y + 1, z });
      if (block && above && !block.isAir && above.isAir) {
        return y + 1;
      }
    } catch (_error) {
      return undefined;
    }
  }
  return undefined;
}

function convertLandmarkToReal(player, record) {
  if (record.convertedToReal) {
    return;
  }

  try {
    if (record.type === "city") {
      const existing = findNearestCity({ x: record.approximateX, y: Math.floor(player.location.y), z: record.approximateZ }, player.dimension.id, 96);
      if (!existing) {
        createCity({
          center: {
            x: record.approximateX,
            y: Math.floor(player.location.y),
            z: record.approximateZ
          },
          dimensionId: player.dimension.id,
          populationEstimate: 8,
          createdTick: system.currentTick
        }, "trade_capital");
      }
    } else if (record.type === "ruin" || record.type === "castle") {
      enqueueStructure({
        identifier: record.type === "castle" ? "lod:far_castle_silhouette_01" : "lod:distant_ruin_silhouette_01",
        dimension: player.dimension,
        location: {
          x: Math.floor(player.location.x) + 12,
          y: Math.floor(player.location.y),
          z: Math.floor(player.location.z) + 12
        },
        size: { x: 19, y: 16, z: 5 }
      });
    } else {
      decorateAroundPlayer(player, 18);
    }
    markConverted(record);
    if (LODConfig.LOD_DEBUG) {
      Logger.tell(player, `LOD converted ${record.landmarkId} into nearby real generation.`);
    }
  } catch (error) {
    Logger.debug(`LOD conversion skipped for ${record.landmarkId}: ${error}`);
  }
}

function fallbackBlockFor(record) {
  if (record.type === "city" || record.type === "castle") {
    return "uplift:old_bricks";
  }
  if (record.type === "forest") {
    return "minecraft:spruce_leaves";
  }
  if (record.type === "ruin") {
    return "uplift:old_bricks";
  }
  return "uplift:granite_cliff";
}


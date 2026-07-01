import { system, world } from "@minecraft/server";
import { Logger } from "../utils/logger.js";
import { LODConfig } from "./lodConfig.js";
import { syncCitySkylineRecords } from "./farCityRenderer.js";
import { syncMountainSkylineRecords } from "./farMountainRenderer.js";
import { updateLandmarksForPlayer } from "./landmarkTracker.js";

const lastPlayerChunks = new Map();
let initialized = false;

export function initLodStreamer() {
  if (initialized) {
    return;
  }
  initialized = true;
  system.runInterval(updatePlayers, LODConfig.LOD_SCAN_INTERVAL_TICKS);
}

function updatePlayers() {
  if (!LODConfig.LOD_ENABLED) {
    return;
  }

  for (const player of world.getPlayers()) {
    try {
      if (!shouldUpdatePlayer(player)) {
        continue;
      }
      syncCitySkylineRecords(player);
      syncMountainSkylineRecords(player);
      updateLandmarksForPlayer(player);
    } catch (error) {
      Logger.debug(`LOD streamer skipped ${player.name}: ${error}`);
    }
  }
}

function shouldUpdatePlayer(player) {
  const chunk = {
    x: Math.floor(player.location.x / 16),
    z: Math.floor(player.location.z / 16)
  };
  const previous = lastPlayerChunks.get(player.name);
  if (!previous) {
    lastPlayerChunks.set(player.name, chunk);
    return true;
  }
  const moved = Math.max(Math.abs(chunk.x - previous.x), Math.abs(chunk.z - previous.z));
  if (moved < LODConfig.LOD_MOVEMENT_THRESHOLD_CHUNKS) {
    return false;
  }
  lastPlayerChunks.set(player.name, chunk);
  return true;
}


import { system, world } from "@minecraft/server";
import { MutableConfig } from "../config.js";
import { Logger } from "../utils/logger.js";
import { chunkKey, floorVec } from "../utils/vectors.js";
import { detectVillageAnchor } from "../cities/cityPlanner.js";
import { registerVillageAnchor } from "../cities/cityRegistry.js";

const scannedChunks = new Set();
let initialized = false;

export function initChunkScanner() {
  if (initialized) {
    return;
  }
  initialized = true;
  system.runInterval(scanLoadedPlayerAreas, MutableConfig.CITY_SCAN_INTERVAL_TICKS);
}

function scanLoadedPlayerAreas() {
  if (!MutableConfig.CITY_AUTO_REGISTER_ENABLED) {
    return;
  }

  for (const player of world.getPlayers()) {
    const key = `${player.dimension.id}:${chunkKey(player.location)}`;
    if (scannedChunks.has(key)) {
      continue;
    }
    scannedChunks.add(key);
    if (scannedChunks.size > 2048) {
      scannedChunks.clear();
    }

    try {
      const anchor = detectVillageAnchor(player, 10);
      if (!anchor) {
        continue;
      }
      const city = registerVillageAnchor(anchor);
      Logger.debug(`Registered village-like anchor for ${city.name} near ${JSON.stringify(floorVec(player.location))}.`);
    } catch (error) {
      Logger.debug(`Chunk scanner skipped player area: ${error}`);
    }
  }
}


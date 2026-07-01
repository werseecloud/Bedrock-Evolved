import { system, world } from "@minecraft/server";
import { CONFIG } from "../config.js";
import { Logger } from "../utils/logger.js";
import { canScanNow } from "./lagBudgetService.js";
import { scanXpOrbsAroundPlayer } from "./xpOrbScanner.js";
import { mergeNearbyOrbs } from "./xpOrbClusterService.js";

let initialized = false;

export function initClumps() {
  if (initialized) {
    return;
  }
  initialized = true;
  system.runInterval(tickClumps, 5);
  Logger.info("Clumps initialized.");
}

function tickClumps() {
  if (!CONFIG.clumps.enabled || !canScanNow()) {
    return;
  }
  for (const player of world.getPlayers()) {
    try {
      const orbs = scanXpOrbsAroundPlayer(player);
      if (orbs.length < 3) {
        continue;
      }
      mergeNearbyOrbs(player.dimension, orbs);
    } catch (error) {
      if (CONFIG.clumps.debug) {
        Logger.debug(`Clumps scan skipped: ${error}`);
      }
    }
  }
}


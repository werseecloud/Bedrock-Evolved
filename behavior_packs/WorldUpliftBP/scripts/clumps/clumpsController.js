import { system, world } from "@minecraft/server";
import { CONFIG } from "../config.js";
import { Logger } from "../utils/logger.js";
import { isModuleUsable, recordModuleError, shouldRunForPlayer } from "../performance/performanceManager.js";
import { canScanNow } from "./lagBudgetService.js";
import { scanXpOrbsAroundPlayer } from "./xpOrbScanner.js";
import { mergeNearbyOrbs } from "./xpOrbClusterService.js";

let initialized = false;

export function initClumps() {
  if (initialized) {
    return;
  }
  initialized = true;
  system.runInterval(tickClumps, 20);
  Logger.info("Clumps initialized.");
}

function tickClumps() {
  if (!CONFIG.clumps.enabled || !isModuleUsable("clumps") || !canScanNow()) {
    return;
  }
  for (const player of world.getPlayers()) {
    if (!shouldRunForPlayer(player, "clumps", CONFIG.clumps.scanIntervalTicks, 4)) {
      continue;
    }
    try {
      const orbs = scanXpOrbsAroundPlayer(player);
      if (orbs.length < 3) {
        continue;
      }
      mergeNearbyOrbs(player.dimension, orbs);
    } catch (error) {
      recordModuleError("clumps", error);
      if (CONFIG.clumps.debug) {
        Logger.debug(`Clumps scan skipped: ${error}`);
      }
    }
  }
}

import { system } from "@minecraft/server";
import { CONFIG } from "../config.js";

let lastScanTick = 0;

export function canScanNow() {
  if (system.currentTick - lastScanTick < CONFIG.clumps.scanIntervalTicks) {
    return false;
  }
  lastScanTick = system.currentTick;
  return true;
}


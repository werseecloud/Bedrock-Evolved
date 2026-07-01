import { system } from "@minecraft/server";
import { TERRAIN_CONFIG } from "./terrainConfig.js";

const counters = {
  lastTick: -1,
  blockOpsThisTick: 0,
  structuresThisMinute: 0,
  minuteWindowStart: 0,
  decorationsQueued: 0,
  decorationsSkipped: 0
};

export function canUseTerrainBlockOp(cost = 1) {
  resetTickWindow();
  if (counters.blockOpsThisTick + cost > TERRAIN_CONFIG.budget.maxBlockOpsPerTick) {
    counters.decorationsSkipped++;
    return false;
  }
  counters.blockOpsThisTick += cost;
  counters.decorationsQueued += cost;
  return true;
}

export function canPlaceTerrainStructure() {
  resetMinuteWindow();
  if (counters.structuresThisMinute >= TERRAIN_CONFIG.budget.maxStructurePlacementsPerMinute) {
    counters.decorationsSkipped++;
    return false;
  }
  counters.structuresThisMinute++;
  counters.decorationsQueued++;
  return true;
}

export function getTerrainBudgetStatus() {
  resetTickWindow();
  resetMinuteWindow();
  return {
    blockOpsThisTick: counters.blockOpsThisTick,
    structuresThisMinute: counters.structuresThisMinute,
    decorationsQueued: counters.decorationsQueued,
    decorationsSkipped: counters.decorationsSkipped
  };
}

function resetTickWindow() {
  if (counters.lastTick !== system.currentTick) {
    counters.lastTick = system.currentTick;
    counters.blockOpsThisTick = 0;
  }
}

function resetMinuteWindow() {
  if (system.currentTick - counters.minuteWindowStart >= 1200) {
    counters.minuteWindowStart = system.currentTick;
    counters.structuresThisMinute = 0;
  }
}

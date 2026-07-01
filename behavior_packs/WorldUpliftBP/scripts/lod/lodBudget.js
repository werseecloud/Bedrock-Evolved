import { system } from "@minecraft/server";
import { LODConfig } from "./lodConfig.js";

const playerActive = new Map();
let minuteWindowStart = 0;
let placementsThisWindow = 0;

export function canPlaceLodStructure(playerKey) {
  refreshWindow();
  if (placementsThisWindow >= LODConfig.LOD_MAX_STRUCTURE_PLACEMENTS_PER_MINUTE) {
    return false;
  }
  return getActiveCount(playerKey) < LODConfig.LOD_MAX_ACTIVE_IMPOSTORS_PER_PLAYER;
}

export function recordLodPlacement(playerKey, landmarkId) {
  refreshWindow();
  placementsThisWindow++;
  if (!playerActive.has(playerKey)) {
    playerActive.set(playerKey, new Set());
  }
  playerActive.get(playerKey).add(landmarkId);
}

export function recycleLodPlacement(playerKey, landmarkId) {
  const set = playerActive.get(playerKey);
  if (set) {
    set.delete(landmarkId);
  }
}

export function getActiveCount(playerKey) {
  const set = playerActive.get(playerKey);
  return set ? set.size : 0;
}

export function getBudgetStatus(playerKey) {
  refreshWindow();
  return `active=${getActiveCount(playerKey)} minutePlacements=${placementsThisWindow}/${LODConfig.LOD_MAX_STRUCTURE_PLACEMENTS_PER_MINUTE}`;
}

function refreshWindow() {
  if (system.currentTick - minuteWindowStart >= 1200) {
    minuteWindowStart = system.currentTick;
    placementsThisWindow = 0;
  }
}


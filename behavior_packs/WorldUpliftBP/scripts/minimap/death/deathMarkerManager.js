import { system, world } from "@minecraft/server";
import { Logger } from "../../utils/logger.js";
import { createMarker } from "../markers/markerTypes.js";
import { getPlayerKey } from "../minimapUiState.js";
import { loadMarkerData, saveMarkerData } from "../markers/markerStorage.js";
import { pushDeathHistory } from "./deathHistoryManager.js";

let initialized = false;

export function initDeathMarkerManager() {
  if (initialized) {
    return;
  }
  initialized = true;
  try {
    world.afterEvents.entityDie?.subscribe((event) => {
      const entity = event.deadEntity;
      if (!entity || entity.typeId !== "minecraft:player") {
        return;
      }
      system.run(() => saveLatestDeath(entity, event.damageSource?.cause || "unknown"));
    });
  } catch (error) {
    Logger.warn(`Death marker event unavailable: ${error}`);
  }
}

export function saveLatestDeath(player, reason = "unknown") {
  const data = loadMarkerData(player);
  pushDeathHistory(data, data.latestDeath);
  const marker = createMarker({
    markerId: `death_${Date.now()}_${Math.floor(Math.random() * 99999)}`,
    ownerPlayerId: getPlayerKey(player),
    visibility: "private",
    type: "latest_death",
    name: "Latest Death",
    dimension: player.dimension.id,
    x: player.location.x,
    y: player.location.y,
    z: player.location.z,
    createdAtTick: system.currentTick,
    metadata: { reason }
  });
  data.latestDeath = marker;
  saveMarkerData(player, data);
  try {
    player.sendMessage("[Bedrock Evolved] Death location saved.");
  } catch (_error) {
    // Player may already be in respawn flow.
  }
  return marker;
}

export function getLatestDeath(player) {
  return loadMarkerData(player).latestDeath;
}

export function clearLatestDeath(player) {
  const data = loadMarkerData(player);
  data.latestDeath = undefined;
  saveMarkerData(player, data);
}

export function clearAllDeaths(player) {
  const data = loadMarkerData(player);
  data.latestDeath = undefined;
  data.deathHistory = [];
  saveMarkerData(player, data);
}

export function getDeathHistory(player) {
  return loadMarkerData(player).deathHistory || [];
}

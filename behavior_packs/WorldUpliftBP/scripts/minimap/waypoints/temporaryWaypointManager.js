import { system } from "@minecraft/server";
import { MINIMAP_UI_CONFIG } from "../minimapConfig.js";
import { createMarker } from "../markers/markerTypes.js";
import { getPlayerKey } from "../minimapUiState.js";
import { loadMarkerData, saveMarkerData } from "../markers/markerStorage.js";

export function addTemporaryWaypoint(player, name = "Temporary", location = player.location, lifetimeTicks = MINIMAP_UI_CONFIG.temporaryWaypoints.defaultLifetimeTicks) {
  const data = loadMarkerData(player);
  pruneExpiredTemporaryWaypoints(player);
  if (data.temporaryWaypoints.length >= MINIMAP_UI_CONFIG.temporaryWaypoints.maxPerPlayer) {
    data.temporaryWaypoints.shift();
  }
  const marker = createMarker({
    markerId: `tmp_${Date.now()}_${Math.floor(Math.random() * 99999)}`,
    ownerPlayerId: getPlayerKey(player),
    visibility: "private",
    type: "temporary_waypoint",
    name,
    dimension: player.dimension.id,
    x: location.x,
    y: location.y ?? player.location.y,
    z: location.z,
    color: "cyan",
    icon: "temp",
    createdAtTick: system.currentTick,
    expiresAtTick: system.currentTick + lifetimeTicks
  });
  data.temporaryWaypoints.push(marker);
  saveMarkerData(player, data);
  return marker;
}

export function removeTemporaryWaypoint(player, name) {
  const data = loadMarkerData(player);
  const before = data.temporaryWaypoints.length;
  data.temporaryWaypoints = data.temporaryWaypoints.filter((marker) => marker.name !== name && marker.markerId !== name);
  saveMarkerData(player, data);
  return before !== data.temporaryWaypoints.length;
}

export function clearTemporaryWaypoints(player) {
  const data = loadMarkerData(player);
  data.temporaryWaypoints = [];
  saveMarkerData(player, data);
}

export function listTemporaryWaypoints(player) {
  pruneExpiredTemporaryWaypoints(player);
  return loadMarkerData(player).temporaryWaypoints;
}

export function pruneExpiredTemporaryWaypoints(player) {
  const data = loadMarkerData(player);
  const before = data.temporaryWaypoints.length;
  data.temporaryWaypoints = data.temporaryWaypoints.filter((marker) => !marker.expiresAtTick || marker.expiresAtTick > system.currentTick);
  if (before !== data.temporaryWaypoints.length) {
    saveMarkerData(player, data);
  }
}

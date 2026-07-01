import { system } from "@minecraft/server";
import { MINIMAP_UI_CONFIG } from "../minimapConfig.js";
import { createMarker } from "../markers/markerTypes.js";
import { getPlayerKey } from "../minimapUiState.js";
import { loadMarkerData, saveMarkerData } from "../markers/markerStorage.js";
import { normalizeWaypointColor, normalizeWaypointIcon } from "./waypointIcons.js";

export function addWaypoint(player, name = "Waypoint", options = {}) {
  const data = loadMarkerData(player);
  if (data.waypoints.length >= MINIMAP_UI_CONFIG.waypoints.maxPerPlayer) {
    return { ok: false, reason: "limit" };
  }
  const marker = createMarker({
    markerId: `wp_${Date.now()}_${Math.floor(Math.random() * 99999)}`,
    ownerPlayerId: getPlayerKey(player),
    visibility: options.visibility || MINIMAP_UI_CONFIG.waypoints.defaultVisibility,
    type: "permanent_waypoint",
    name,
    dimension: player.dimension.id,
    x: player.location.x,
    y: player.location.y,
    z: player.location.z,
    color: normalizeWaypointColor(options.color),
    icon: normalizeWaypointIcon(options.icon),
    createdAtTick: system.currentTick
  });
  data.waypoints.push(marker);
  saveMarkerData(player, data);
  return { ok: true, marker };
}

export function removeWaypoint(player, name) {
  const data = loadMarkerData(player);
  const before = data.waypoints.length;
  data.waypoints = data.waypoints.filter((marker) => marker.name !== name && marker.markerId !== name);
  saveMarkerData(player, data);
  return before !== data.waypoints.length;
}

export function renameWaypoint(player, oldName, newName) {
  const marker = findWaypoint(player, oldName);
  if (!marker) return false;
  marker.name = newName;
  saveMarkerData(player, loadMarkerData(player));
  return true;
}

export function setWaypointColor(player, name, color) {
  const marker = findWaypoint(player, name);
  if (!marker) return false;
  marker.color = normalizeWaypointColor(color);
  saveMarkerData(player, loadMarkerData(player));
  return true;
}

export function setWaypointIcon(player, name, icon) {
  const marker = findWaypoint(player, name);
  if (!marker) return false;
  marker.icon = normalizeWaypointIcon(icon);
  saveMarkerData(player, loadMarkerData(player));
  return true;
}

export function setWaypointVisibility(player, name, visibility) {
  const marker = findWaypoint(player, name);
  if (!marker) return false;
  marker.visibility = ["private", "team", "public"].includes(visibility) ? visibility : "private";
  saveMarkerData(player, loadMarkerData(player));
  return true;
}

export function listWaypoints(player) {
  return loadMarkerData(player).waypoints;
}

export function clearWaypoints(player) {
  const data = loadMarkerData(player);
  data.waypoints = [];
  saveMarkerData(player, data);
}

function findWaypoint(player, name) {
  return loadMarkerData(player).waypoints.find((marker) => marker.name === name || marker.markerId === name);
}

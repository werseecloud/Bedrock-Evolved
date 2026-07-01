import { world } from "@minecraft/server";
import { getCities } from "../../cities/cityRegistry.js";
import { distance2D } from "../../utils/vectors.js";
import { getMinimapState, getPlayerKey } from "../minimapUiState.js";
import { loadMarkerData } from "./markerStorage.js";
import { createMarker } from "./markerTypes.js";
import { clusterMarkers } from "./markerClustering.js";
import { sortMarkersByPriority } from "./markerPriority.js";
import { pruneExpiredTemporaryWaypoints } from "../waypoints/temporaryWaypointManager.js";
import { MINIMAP_UI_CONFIG } from "../minimapConfig.js";
import { isModuleUsable, requestEntityChecks, recordModuleError } from "../../performance/performanceManager.js";

export function gatherMarkersForPlayer(player, mode = "small") {
  const state = getMinimapState(player);
  const layers = state.layers || {};
  const data = loadMarkerData(player);
  const playerId = getPlayerKey(player);
  pruneExpiredTemporaryWaypoints(player);

  let markers = [];
  if (layers.deaths && state.showDeathMarker) {
    if (data.latestDeath) markers.push(data.latestDeath);
    markers.push(...(data.deathHistory || []));
  }
  if (layers.waypoints && state.showWaypoints) {
    markers.push(...(data.waypoints || []));
  }
  if (layers.temp && state.showWaypoints) {
    markers.push(...(data.temporaryWaypoints || []));
  }
  if (layers.cities) {
    markers.push(...getCityMarkers(player));
  }
  if (layers.players && state.showPlayers) {
    markers.push(...getPlayerMarkers(player));
  }
  if (layers.mobs && state.showEntities && mode === "fullscreen") {
    markers.push(...getEntityMarkers(player));
  }

  markers = markers
    .filter((marker) => canSeeMarker(marker, playerId))
    .filter((marker) => marker.dimension === player.dimension.id || marker.type.includes("death"))
    .filter((marker) => marker.dimension !== player.dimension.id || distance2D(player.location, marker) <= getMarkerRadius(mode));

  if (MINIMAP_UI_CONFIG.markers.clustering && mode === "fullscreen") {
    markers = clusterMarkers(markers, 7);
  }

  const cap = mode === "fullscreen" ? MINIMAP_UI_CONFIG.markers.maxMarkersOnFullscreen : MINIMAP_UI_CONFIG.markers.maxMarkersOnMinimap;
  return sortMarkersByPriority(markers).slice(0, cap);
}

function canSeeMarker(marker, playerId) {
  if (!marker) return false;
  if (marker.visibility === "public") return true;
  if (marker.visibility === "team") return marker.ownerPlayerId === playerId;
  if (!marker.visibility || marker.visibility === "private") return marker.ownerPlayerId === playerId || !marker.ownerPlayerId;
  return false;
}

function getCityMarkers(player) {
  try {
    return getCities()
      .filter((city) => city.dimensionId === player.dimension.id)
      .map((city) => createMarker({
        markerId: `city_${city.cityId}`,
        visibility: "public",
        type: city.type === "small_town" ? "village" : "city",
        name: city.name,
        dimension: city.dimensionId,
        x: city.center.x,
        y: city.center.y,
        z: city.center.z,
        color: "gold",
        icon: "city",
        metadata: { cityId: city.cityId, stage: city.stage }
      }));
  } catch (_error) {
    return [];
  }
}

function getPlayerMarkers(player) {
  const markers = [];
  for (const other of world.getPlayers()) {
    if (other.id === player.id || other.dimension.id !== player.dimension.id) {
      continue;
    }
    markers.push(createMarker({
      markerId: `player_${other.id || other.name}`,
      visibility: "public",
      type: "player",
      name: other.name,
      dimension: other.dimension.id,
      x: other.location.x,
      y: other.location.y,
      z: other.location.z,
      color: "white",
      icon: "player"
    }));
  }
  return markers;
}

function getEntityMarkers(player) {
  const markers = [];
  if (!isModuleUsable("minimap_entities") || !requestEntityChecks("minimap_entities", 4)) {
    return markers;
  }
  try {
    const entities = player.dimension.getEntities({
      location: player.location,
      maxDistance: 48
    });
    for (const entity of entities.slice(0, 40)) {
      if (!requestEntityChecks("minimap_entities")) {
        break;
      }
      if (!entity || entity.typeId === "minecraft:player" || entity.typeId.includes("item") || entity.typeId.includes("xp")) {
        continue;
      }
      const hostile = isHostileType(entity.typeId);
      markers.push(createMarker({
        markerId: `entity_${entity.id}`,
        visibility: "public",
        type: hostile ? "hostile_mob" : "passive_mob",
        name: entity.typeId.replace("minecraft:", ""),
        dimension: player.dimension.id,
        x: entity.location.x,
        y: entity.location.y,
        z: entity.location.z,
        color: hostile ? "red" : "green",
        icon: hostile ? "hostile" : "passive"
      }));
    }
  } catch (error) {
    recordModuleError("minimap_entities", error);
    return markers;
  }
  return markers;
}

function isHostileType(typeId) {
  return ["zombie", "skeleton", "creeper", "spider", "enderman", "pillager", "warden", "witch", "slime", "magma_cube", "blaze", "ghast"].some((name) => typeId.includes(name));
}

function getMarkerRadius(mode) {
  return mode === "fullscreen" ? 320 : 96;
}

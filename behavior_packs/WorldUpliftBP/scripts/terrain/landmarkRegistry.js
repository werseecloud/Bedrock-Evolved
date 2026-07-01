import { system, world } from "@minecraft/server";
import { Logger } from "../utils/logger.js";

const PROPERTY_KEY = "be_terrain:landmarks";
const MEMORY_LANDMARKS = [];
let loaded = false;
let useMemoryOnly = false;

export function initLandmarkRegistry() {
  if (loaded) {
    return;
  }
  loaded = true;
  try {
    const raw = world.getDynamicProperty(PROPERTY_KEY);
    if (typeof raw === "string" && raw.length) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        MEMORY_LANDMARKS.splice(0, MEMORY_LANDMARKS.length, ...parsed);
      }
    }
  } catch (error) {
    useMemoryOnly = true;
    Logger.debug(`Terrain landmarks using memory fallback: ${error}`);
  }
}

export function registerLandmark(record) {
  initLandmarkRegistry();
  const landmark = {
    landmarkId: record.landmarkId || `terrain_${system.currentTick}_${MEMORY_LANDMARKS.length}`,
    type: record.type || "unknown",
    dimension: record.dimension || "minecraft:overworld",
    x: Math.floor(record.x || 0),
    y: Math.floor(record.y || 64),
    z: Math.floor(record.z || 0),
    biome: record.biome || "unknown",
    createdAtTick: system.currentTick,
    structureName: record.structureName || "",
    discoveredByPlayers: record.discoveredByPlayers || []
  };
  MEMORY_LANDMARKS.push(landmark);
  if (MEMORY_LANDMARKS.length > 256) {
    MEMORY_LANDMARKS.shift();
  }
  saveLandmarks();
  return landmark;
}

export function getTerrainLandmarks() {
  initLandmarkRegistry();
  return MEMORY_LANDMARKS.slice();
}

export function getLandmarkCount() {
  initLandmarkRegistry();
  return MEMORY_LANDMARKS.length;
}

export function hasNearbyLandmark(dimensionId, x, z, radius = 160) {
  initLandmarkRegistry();
  const radiusSq = radius * radius;
  return MEMORY_LANDMARKS.some((landmark) => {
    if (landmark.dimension !== dimensionId) {
      return false;
    }
    const dx = landmark.x - x;
    const dz = landmark.z - z;
    return dx * dx + dz * dz <= radiusSq;
  });
}

function saveLandmarks() {
  if (useMemoryOnly) {
    return;
  }
  try {
    world.setDynamicProperty(PROPERTY_KEY, JSON.stringify(MEMORY_LANDMARKS));
  } catch (error) {
    useMemoryOnly = true;
    Logger.debug(`Terrain landmark save fallback: ${error}`);
  }
}

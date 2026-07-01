import { world } from "@minecraft/server";
import { Logger } from "../utils/logger.js";
import { distance2D } from "../utils/vectors.js";
import { LODConfig } from "./lodConfig.js";

const REGISTRY_KEY = "wu:lod_registry";
const records = [];
let loaded = false;
let storageAvailable = true;

export function initLodRegistry() {
  loadLodRecords();
}

export function loadLodRecords() {
  if (loaded) {
    return records;
  }
  loaded = true;
  try {
    const raw = world.getDynamicProperty(REGISTRY_KEY);
    if (typeof raw === "string" && raw.length > 0) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        records.splice(0, records.length, ...parsed);
      }
    }
  } catch (error) {
    storageAvailable = false;
    Logger.warn(`LOD registry storage unavailable; using memory fallback: ${error}`);
  }
  return records;
}

export function saveLodRecords() {
  if (!storageAvailable) {
    return;
  }
  try {
    world.setDynamicProperty(REGISTRY_KEY, JSON.stringify(records.slice(-LODConfig.LOD_MAX_LANDMARK_RECORDS)));
  } catch (error) {
    storageAvailable = false;
    Logger.warn(`LOD registry full or unavailable; continuing with memory fallback: ${error}`);
  }
}

export function getLodRecords() {
  return loadLodRecords();
}

export function upsertLandmark(record) {
  loadLodRecords();
  const existing = records.find((item) => item.landmarkId === record.landmarkId);
  if (existing) {
    Object.assign(existing, record);
    saveLodRecords();
    return existing;
  }

  if (records.length >= LODConfig.LOD_MAX_LANDMARK_RECORDS) {
    records.shift();
  }
  records.push({
    discoveredByPlayer: false,
    activeImpostorEntityOrStructureId: "",
    convertedToReal: false,
    ...record
  });
  saveLodRecords();
  return record;
}

export function findRecordById(landmarkId) {
  return loadLodRecords().find((record) => record.landmarkId === landmarkId);
}

export function findNearbyRecords(location, maxDistanceBlocks, predicate = () => true) {
  return loadLodRecords().filter((record) => {
    if (!predicate(record)) {
      return false;
    }
    return distance2D({ x: record.approximateX, z: record.approximateZ }, location) <= maxDistanceBlocks;
  });
}

export function markImpostorActive(record, activeId, playerName) {
  record.activeImpostorEntityOrStructureId = activeId;
  record.discoveredByPlayer = playerName || record.discoveredByPlayer || true;
  saveLodRecords();
}

export function markImpostorInactive(record) {
  record.activeImpostorEntityOrStructureId = "";
  saveLodRecords();
}

export function markConverted(record) {
  record.convertedToReal = true;
  record.activeImpostorEntityOrStructureId = "";
  saveLodRecords();
}

export function getRegistryStatus() {
  const total = loadLodRecords().length;
  const active = records.filter((record) => record.activeImpostorEntityOrStructureId).length;
  const converted = records.filter((record) => record.convertedToReal).length;
  return `landmarks=${total} active=${active} converted=${converted} storage=${storageAvailable ? "dynamic" : "memory"}`;
}


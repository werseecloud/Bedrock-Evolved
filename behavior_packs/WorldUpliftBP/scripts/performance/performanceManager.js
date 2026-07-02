import { system, world } from "@minecraft/server";
import { MutableConfig, CONFIG } from "../config.js";
import { Logger } from "../utils/logger.js";
import { setLodPerformanceMode } from "../lod/lodConfig.js";
import { setTerrainProfile } from "../terrain/terrainConfig.js";
import { syncFogWithPerformanceProfile } from "../visuals/lodFogSync.js";
import { PERFORMANCE_PROFILES } from "./performanceProfiles.js";

const VALUABLE_ITEM_TYPES = new Set([
  "minecraft:diamond",
  "minecraft:diamond_block",
  "minecraft:emerald",
  "minecraft:emerald_block",
  "minecraft:netherite_ingot",
  "minecraft:netherite_scrap",
  "minecraft:netherite_block",
  "minecraft:ancient_debris",
  "minecraft:shulker_box",
  "minecraft:elytra",
  "minecraft:totem_of_undying",
  "minecraft:enchanted_book"
]);

const HOSTILE_NAMES = [
  "zombie",
  "skeleton",
  "creeper",
  "spider",
  "enderman",
  "pillager",
  "witch",
  "slime",
  "magma_cube",
  "blaze",
  "ghast",
  "drowned",
  "husk",
  "stray",
  "warden"
];

const budgets = {
  tick: -1,
  blockOps: 0,
  entityChecks: 0,
  structures: 0,
  particles: 0,
  structureWindowStart: 0,
  structuresThisMinute: 0
};

const moduleErrors = new Map();
const disabledUntil = new Map();
const itemFirstSeen = new Map();
const stats = {
  profile: "balanced",
  itemEntitiesRemoved: 0,
  hostilesRemovedNearCities: 0,
  skippedBudgetOps: 0,
  errorsRecorded: 0,
  lastCleanupTick: 0,
  lastItemCleanupTick: -999999,
  lastEntityCleanupTick: -999999
};

let initialized = false;
let debug = false;

export function initPerformanceManager() {
  if (initialized) {
    return;
  }
  initialized = true;
  applyPerformanceProfile(stats.profile);
  system.runInterval(tickPerformanceMaintenance, 100);
  Logger.info(`Performance manager initialized profile=${stats.profile}.`);
}

export function applyPerformanceProfile(profileName) {
  const profile = PERFORMANCE_PROFILES[profileName] || PERFORMANCE_PROFILES.balanced;
  stats.profile = profile.name;

  MutableConfig.MAX_BLOCK_OPS_PER_TICK = profile.maxBlockOpsPerTick;
  MutableConfig.STRUCTURE_PLACEMENT_BATCH_SIZE = profile.maxStructurePlacementsPerTick;
  MutableConfig.CITY_SCAN_INTERVAL_TICKS = profile.name === "cinematic" ? 120 : profile.name === "server" ? 240 : 180;
  MutableConfig.CITY_BUILD_RADIUS = profile.cityActiveRadius;
  MutableConfig.MEGA_REGION_DECORATION_DENSITY = profile.name === "cinematic" ? 1.75 : profile.name === "balanced" ? 1.25 : 0.7;
  MutableConfig.MEGA_REGION_MAX_CHUNKS_PER_SCAN = profile.name === "cinematic" ? 7 : profile.name === "balanced" ? 5 : 3;

  CONFIG.clumps.scanIntervalTicks = profile.clumpsIntervalTicks;
  CONFIG.clumps.maxOrbsPerScan = profile.name === "server" ? 64 : 128;

  setLodPerformanceMode(profile.name);
  setTerrainProfile(profile.terrainProfile);
  syncFogWithPerformanceProfile(profile.name);
  return profile;
}

export function getPerformanceProfile() {
  return PERFORMANCE_PROFILES[stats.profile] || PERFORMANCE_PROFILES.balanced;
}

export function getPerformanceProfileName() {
  return getPerformanceProfile().name;
}

export function setPerformanceDebug(enabled) {
  debug = Boolean(enabled);
}

export function isPerformanceDebug() {
  return debug;
}

export function requestBlockOps(moduleName, amount = 1) {
  resetTickBudget();
  const profile = getPerformanceProfile();
  if (budgets.blockOps + amount > profile.maxBlockOpsPerTick) {
    stats.skippedBudgetOps++;
    return false;
  }
  budgets.blockOps += amount;
  return true;
}

export function requestEntityChecks(moduleName, amount = 1) {
  resetTickBudget();
  const profile = getPerformanceProfile();
  if (budgets.entityChecks + amount > profile.maxEntityChecksPerTick) {
    stats.skippedBudgetOps++;
    return false;
  }
  budgets.entityChecks += amount;
  return true;
}

export function requestStructurePlacement(moduleName, amount = 1) {
  resetTickBudget();
  const profile = getPerformanceProfile();
  resetStructureMinuteWindow();
  if (budgets.structures + amount > profile.maxStructurePlacementsPerTick) {
    stats.skippedBudgetOps++;
    return false;
  }
  if (budgets.structuresThisMinute + amount > profile.lodPlacementsPerMinute) {
    stats.skippedBudgetOps++;
    return false;
  }
  budgets.structures += amount;
  budgets.structuresThisMinute += amount;
  return true;
}

export function requestParticles(moduleName, amount = 1) {
  resetTickBudget();
  const cap = Math.max(4, Math.floor(40 * getPerformanceProfile().particleScale));
  if (budgets.particles + amount > cap) {
    stats.skippedBudgetOps++;
    return false;
  }
  budgets.particles += amount;
  return true;
}

export function shouldRunForPlayer(player, moduleName, intervalTicks, spreadTicks = 2) {
  const interval = Math.max(1, Math.floor(intervalTicks || 1));
  const offset = Math.abs(hashText(`${moduleName}:${player?.id || player?.name || "player"}`)) % interval;
  return (system.currentTick + offset) % interval < Math.max(1, spreadTicks);
}

export function isModuleUsable(moduleName) {
  const until = disabledUntil.get(moduleName) || 0;
  return system.currentTick >= until;
}

export function recordModuleError(moduleName, error) {
  stats.errorsRecorded++;
  const now = system.currentTick;
  const windowTicks = 600;
  const errors = (moduleErrors.get(moduleName) || []).filter((tick) => now - tick <= windowTicks);
  errors.push(now);
  moduleErrors.set(moduleName, errors);
  if (errors.length >= 10) {
    disabledUntil.set(moduleName, now + 1200);
    moduleErrors.set(moduleName, []);
    Logger.warn(`${moduleName} entered fallback mode for 1200 ticks after repeated errors.`);
  } else if (debug) {
    Logger.debug(`${moduleName} error: ${error}`);
  }
}

export function getPerformanceStatus(extra = {}) {
  resetTickBudget();
  resetStructureMinuteWindow();
  const profile = getPerformanceProfile();
  const disabled = [...disabledUntil.entries()]
    .filter(([, until]) => until > system.currentTick)
    .map(([name, until]) => `${name}:${until - system.currentTick}`)
    .join(",") || "none";
  return [
    `profile=${profile.name}`,
    `budget(block/entity/structure/particles)=${budgets.blockOps}/${budgets.entityChecks}/${budgets.structures}/${budgets.particles}`,
    `max=${profile.maxBlockOpsPerTick}/${profile.maxEntityChecksPerTick}/${profile.maxStructurePlacementsPerTick}`,
    `structuresMinute=${budgets.structuresThisMinute}/${profile.lodPlacementsPerMinute}`,
    `lodImpostors=${profile.lodImpostors}`,
    `cityRadius=${profile.cityActiveRadius}`,
    `guardsCap=${profile.guardsPerCity}`,
    `sim=${profile.simulationRecommendation}`,
    `removedItems=${stats.itemEntitiesRemoved}`,
    `removedHostiles=${stats.hostilesRemovedNearCities}`,
    `skippedBudget=${stats.skippedBudgetOps}`,
    `disabled=${disabled}`,
    ...Object.entries(extra).map(([key, value]) => `${key}=${value}`)
  ].join(" | ");
}

export function runPerformanceMaintenanceNow() {
  tickPerformanceMaintenance(true);
  return {
    itemEntitiesRemoved: stats.itemEntitiesRemoved,
    hostilesRemovedNearCities: stats.hostilesRemovedNearCities,
    lastCleanupTick: stats.lastCleanupTick
  };
}

function tickPerformanceMaintenance(force = false) {
  if (!isModuleUsable("performance")) {
    return;
  }
  try {
    runItemCleanupPass(force);
    runCityHostileCapPass(force);
    simulateInactiveCities(force);
    stats.lastCleanupTick = system.currentTick;
  } catch (error) {
    recordModuleError("performance", error);
  }
}

function runItemCleanupPass(force = false) {
  const profile = getPerformanceProfile();
  if (!force && system.currentTick - stats.lastItemCleanupTick < profile.itemCleanupIntervalTicks) {
    return;
  }
  stats.lastItemCleanupTick = system.currentTick;
  for (const player of world.getPlayers()) {
    if (!requestEntityChecks("item_cleanup", 4)) {
      return;
    }
    let items = [];
    try {
      items = player.dimension.getEntities({
        type: "minecraft:item",
        location: player.location,
        maxDistance: 64
      });
    } catch (error) {
      recordModuleError("item_cleanup", error);
      continue;
    }
    for (const entity of items.slice(0, 64)) {
      if (!requestEntityChecks("item_cleanup")) {
        return;
      }
      const id = entity.id || `${Math.floor(entity.location.x)},${Math.floor(entity.location.y)},${Math.floor(entity.location.z)}`;
      const firstSeen = itemFirstSeen.get(id) || system.currentTick;
      itemFirstSeen.set(id, firstSeen);
      if (system.currentTick - firstSeen < 6000 || isValuableItemEntity(entity)) {
        continue;
      }
      try {
        entity.remove();
        itemFirstSeen.delete(id);
        stats.itemEntitiesRemoved++;
      } catch (error) {
        recordModuleError("item_cleanup", error);
      }
    }
  }
  if (itemFirstSeen.size > 2048) {
    itemFirstSeen.clear();
  }
}

function runCityHostileCapPass(force = false) {
  const profile = getPerformanceProfile();
  if (!force && system.currentTick - stats.lastEntityCleanupTick < profile.entityCleanupIntervalTicks) {
    return;
  }
  stats.lastEntityCleanupTick = system.currentTick;
  let cities = [];
  try {
    cities = getCitiesSafe();
  } catch (error) {
    recordModuleError("city_entity_cap", error);
    return;
  }
  for (const city of cities.slice(0, 16)) {
    const nearbyPlayer = findNearbyPlayer(city, profile.cityActiveRadius);
    if (!nearbyPlayer || !requestEntityChecks("city_entity_cap", 6)) {
      continue;
    }
    let entities = [];
    try {
      entities = nearbyPlayer.dimension.getEntities({
        location: city.center,
        maxDistance: profile.cityActiveRadius
      });
    } catch (error) {
      recordModuleError("city_entity_cap", error);
      continue;
    }
    const hostiles = entities.filter((entity) => isHostileEntity(entity)).slice(0, 96);
    if (hostiles.length <= profile.maxHostilesNearCity) {
      continue;
    }
    for (const entity of hostiles.slice(profile.maxHostilesNearCity)) {
      if (!requestEntityChecks("city_entity_cap")) {
        return;
      }
      try {
        entity.remove();
        stats.hostilesRemovedNearCities++;
      } catch (error) {
        recordModuleError("city_entity_cap", error);
      }
    }
  }
}

function getCitiesSafe() {
  const api = getCityRegistryApi();
  return api ? api.getCities() : [];
}

function getCityRegistryApi() {
  try {
    const globalApi = globalThis.__bedrockEvolvedCityRegistry;
    if (globalApi && typeof globalApi.getCities === "function") {
      return globalApi;
    }
  } catch (_error) {
    // Fallback below.
  }
  return undefined;
}

export function registerCityRegistryApi(api) {
  globalThis.__bedrockEvolvedCityRegistry = api;
}

function simulateInactiveCities(force = false) {
  const api = getCityRegistryApi();
  if (!api || typeof api.updateCity !== "function") {
    return;
  }
  const profile = getPerformanceProfile();
  const day = Math.floor(system.currentTick / 24000);
  if (day <= 0) {
    return;
  }
  for (const city of api.getCities().slice(0, 64)) {
    if (findNearbyPlayer(city, profile.cityActiveRadius)) {
      city.sleepMode = false;
      continue;
    }
    const lastDay = Number(city.lastSleepSimDay || 0);
    if (lastDay >= day) {
      continue;
    }
    const elapsedDays = Math.min(3, day - lastDay);
    city.sleepMode = true;
    city.resources = city.resources || {};
    city.resources.food = Number(city.resources.food || 0) + elapsedDays;
    city.resources.stone = Number(city.resources.stone || 0) + elapsedDays * 2;
    if (day % 3 === 0) {
      city.guards = Math.min(profile.guardsPerCity, Number(city.guards || 0) + 1);
    }
    city.lastSleepSimDay = day;
    api.updateCity(city);
  }
}

function findNearbyPlayer(city, radius) {
  const radiusSq = radius * radius;
  for (const player of world.getPlayers()) {
    if (player.dimension.id !== city.dimensionId) {
      continue;
    }
    const dx = player.location.x - city.center.x;
    const dz = player.location.z - city.center.z;
    if (dx * dx + dz * dz <= radiusSq) {
      return player;
    }
  }
  return undefined;
}

function isValuableItemEntity(entity) {
  try {
    const itemComponent = entity.getComponent?.("minecraft:item");
    const itemStack = itemComponent?.itemStack;
    const typeId = itemStack?.typeId || "";
    if (VALUABLE_ITEM_TYPES.has(typeId)) {
      return true;
    }
    return typeId.includes("diamond") || typeId.includes("netherite") || typeId.includes("shulker");
  } catch (_error) {
    return true;
  }
}

function isHostileEntity(entity) {
  try {
    const typeId = String(entity.typeId || "");
    return HOSTILE_NAMES.some((name) => typeId.includes(name));
  } catch (_error) {
    return false;
  }
}

function resetTickBudget() {
  if (budgets.tick === system.currentTick) {
    return;
  }
  budgets.tick = system.currentTick;
  budgets.blockOps = 0;
  budgets.entityChecks = 0;
  budgets.structures = 0;
  budgets.particles = 0;
}

function resetStructureMinuteWindow() {
  if (system.currentTick - budgets.structureWindowStart >= 1200) {
    budgets.structureWindowStart = system.currentTick;
    budgets.structuresThisMinute = 0;
  }
}

function hashText(value) {
  let hash = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

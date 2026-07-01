import { system, world } from "@minecraft/server";
import { Logger } from "../utils/logger.js";
import { TERRAIN_CONFIG, getTerrainProfileSettings } from "./terrainConfig.js";
import { runSnowlinePass } from "./snowlineDecorator.js";
import { runWaterfallPass } from "./waterfallDecorator.js";
import { runCaveEntrancePass } from "./caveEntranceDecorator.js";
import { runForestDensityPass } from "./forestDensityDecorator.js";
import { runPathFragmentPass } from "./pathFragmentDecorator.js";
import { runCoastalPass } from "./coastalDecorator.js";
import { runValleyFogPass } from "./valleyFogController.js";
import { tryGenerateLandmarkNearPlayer } from "./landmarkTracker.js";

const decoratedChunks = new Set();
const lastPlayerScan = new Map();
let initialized = false;

export function initPostGenerationDecorators() {
  if (initialized) {
    return;
  }
  initialized = true;
  system.runInterval(tickTerrainDecorators, 20);
  Logger.info("Terrain Uplift decorators initialized.");
}

export function runFullDecorationPass(player, forced = false) {
  if (!player || player.dimension?.id !== "minecraft:overworld") {
    return 0;
  }
  let count = 0;
  count += runSnowlinePass(player, forced);
  count += runWaterfallPass(player, forced);
  count += runCaveEntrancePass(player, forced);
  count += runForestDensityPass(player, forced);
  count += runPathFragmentPass(player, forced);
  count += runCoastalPass(player, forced);
  count += runValleyFogPass(player, forced);
  return count;
}

export function getDecoratedTerrainChunkCount() {
  return decoratedChunks.size;
}

function tickTerrainDecorators() {
  if (!TERRAIN_CONFIG.enabled) {
    return;
  }
  const settings = getTerrainProfileSettings();
  for (const player of world.getPlayers()) {
    try {
      if (!shouldScanPlayer(player)) {
        continue;
      }
      markNearbyChunk(player);
      if (system.currentTick % settings.scenicInterval === 0) {
        runForestDensityPass(player);
        runPathFragmentPass(player);
        runCaveEntrancePass(player);
        runCoastalPass(player);
        runValleyFogPass(player);
      }
      if (system.currentTick % settings.snowlineInterval === 0) {
        runSnowlinePass(player);
      }
      if (system.currentTick % settings.waterfallInterval === 0) {
        runWaterfallPass(player);
      }
      if (system.currentTick % settings.landmarkInterval === 0) {
        tryGenerateLandmarkNearPlayer(player);
      }
    } catch (error) {
      Logger.debug(`Terrain decorator skipped: ${error}`);
    }
  }
  if (decoratedChunks.size > 12000) {
    decoratedChunks.clear();
  }
}

function shouldScanPlayer(player) {
  if (!player || player.dimension?.id !== "minecraft:overworld") {
    return false;
  }
  const key = player.id || player.name;
  const last = lastPlayerScan.get(key);
  if (!last) {
    lastPlayerScan.set(key, snapshotLocation(player));
    return true;
  }
  const dx = player.location.x - last.x;
  const dz = player.location.z - last.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  if (distance < TERRAIN_CONFIG.budget.minimumPlayerMovementBeforeRescan) {
    return false;
  }
  lastPlayerScan.set(key, snapshotLocation(player));
  return true;
}

function markNearbyChunk(player) {
  const chunkX = Math.floor(player.location.x / 16);
  const chunkZ = Math.floor(player.location.z / 16);
  const key = `${player.dimension.id}:${chunkX}:${chunkZ}`;
  decoratedChunks.add(key);
}

function snapshotLocation(player) {
  return {
    x: player.location.x,
    z: player.location.z
  };
}

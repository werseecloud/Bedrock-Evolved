import { Logger } from "../../utils/logger.js";
import { getAmbientParticleStatus } from "../ambientParticleController.js";
import { runSnowlinePass } from "../snowlineDecorator.js";
import { runWaterfallPass } from "../waterfallDecorator.js";
import { tryGenerateLandmarkNearPlayer } from "../landmarkTracker.js";
import { getLandmarkCount } from "../landmarkRegistry.js";
import { runFullDecorationPass, getDecoratedTerrainChunkCount } from "../postGenDecorator.js";
import {
  TERRAIN_CONFIG,
  setTerrainDebug,
  setTerrainEnabled,
  setTerrainProfile
} from "../terrainConfig.js";
import { getTerrainBudgetStatus } from "../terrainBudget.js";

export function handleTerrainUpliftCommand(source, args) {
  const player = requirePlayer(source);
  const action = args[0] || "status";

  if (action === "on") {
    setTerrainEnabled(true);
    Logger.tell(source, "Terrain Uplift enabled.");
    return;
  }
  if (action === "off") {
    setTerrainEnabled(false);
    Logger.tell(source, "Terrain Uplift disabled.");
    return;
  }
  if (action === "status") {
    Logger.tell(source, formatStatus());
    return;
  }
  if (action === "profile") {
    const profile = args[1] || "balanced";
    if (!setTerrainProfile(profile)) {
      Logger.tell(source, "Unknown profile. Use performance, balanced, or cinematic.");
      return;
    }
    Logger.tell(source, `Terrain profile set to ${profile}.`);
    return;
  }
  if (action === "debug") {
    const enabled = args[1] === "on";
    setTerrainDebug(enabled);
    Logger.tell(source, `Terrain debug ${enabled ? "enabled" : "disabled"}.`);
    return;
  }

  if (!player) {
    Logger.tell(source, "Terrain decoration commands need an in-world player source.");
    return;
  }
  if (action === "decorate") {
    const count = runFullDecorationPass(player, true);
    Logger.tell(player, `Terrain decoration pass completed. Queued ${count} decoration groups.`);
    return;
  }
  if (action === "landmark") {
    const landmark = tryGenerateLandmarkNearPlayer(player, true);
    Logger.tell(player, landmark ? `Rare landmark generated: ${landmark.type} at ${landmark.x},${landmark.y},${landmark.z}.` : "No safe terrain location found.");
    return;
  }
  if (action === "snowline") {
    const count = runSnowlinePass(player, true);
    Logger.tell(player, `Snowline pass queued ${count} patches.`);
    return;
  }
  if (action === "waterfalls") {
    const count = runWaterfallPass(player, true);
    Logger.tell(player, `Waterfall pass queued ${count} candidates.`);
    return;
  }

  Logger.tell(source, "Unknown terrain action. Use on, off, status, profile, debug, decorate, landmark, snowline, or waterfalls.");
}

function formatStatus() {
  const budget = getTerrainBudgetStatus();
  return [
    "Terrain Uplift status",
    `enabled=${TERRAIN_CONFIG.enabled}`,
    `profile=${TERRAIN_CONFIG.performanceProfile}`,
    `debug=${TERRAIN_CONFIG.debug}`,
    `decoratedChunks=${getDecoratedTerrainChunkCount()}`,
    `landmarks=${getLandmarkCount()}`,
    `queuedOps=${budget.decorationsQueued}`,
    `skippedOps=${budget.decorationsSkipped}`,
    `scanRadiusChunks=${TERRAIN_CONFIG.budget.playerScanRadiusChunks}`,
    getAmbientParticleStatus()
  ].join(" | ");
}

function requirePlayer(source) {
  return source?.typeId === "minecraft:player" ? source : undefined;
}

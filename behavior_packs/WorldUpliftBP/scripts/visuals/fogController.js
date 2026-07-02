import { system, world } from "@minecraft/server";
import { Logger } from "../utils/logger.js";
import { FOG_CONFIG } from "./fogConfig.js";
import { getBiomeFogForPlayer, makeFogInfo } from "./biomeFogAdapter.js";
import {
  BIOME_DISPLAY_NAMES,
  FOG_PROFILE_NAMES,
  formatFogProfileSummary,
  getFogProfileSettings,
  getRuntimeFogIdForBiome,
  normalizeFogProfile,
  setConfigFogProfile
} from "./fogProfiles.js";

const playerFogState = new Map();
const forcedBiomeTests = new Map();
const stats = {
  commandAttempts: 0,
  commandFailures: 0,
  lastAppliedFogId: "none",
  lastAppliedBiome: "none"
};

let initialized = false;

export function initFogController() {
  if (initialized) {
    return;
  }
  initialized = true;
  system.runInterval(tickFogController, FOG_CONFIG.runtime.scanIntervalTicks);
  try {
    world.afterEvents.playerSpawn?.subscribe((event) => {
      system.runTimeout(() => applyFogForPlayer(event.player, true), 20);
    });
  } catch (_error) {
    // Player spawn event is optional across runtime versions.
  }
  Logger.info(`Realistic fog controller initialized profile=${FOG_CONFIG.profile}.`);
}

export function handleFogCommand(source, args) {
  const action = String(args[0] || "status").toLowerCase();

  if (action === "on") {
    FOG_CONFIG.enabled = true;
    applyFogToAllPlayers(true);
    Logger.tell(source, "Realistic Fog enabled. Static biome fog remains active as fallback.");
    return { ok: true };
  }

  if (action === "off") {
    FOG_CONFIG.enabled = false;
    clearFogForAllPlayers();
    Logger.tell(source, "Realistic Fog runtime layer disabled. Resource-pack biome fog may still render because Bedrock controls static fog client-side.");
    return { ok: true };
  }

  if (action === "status") {
    const player = requirePlayer(source);
    const fogInfo = player ? getActiveFogInfo(player) : makeFogInfo("default");
    Logger.tell(source, formatFogStatus(fogInfo));
    return { ok: true };
  }

  if (action === "profile") {
    const profile = args[1] || "balanced";
    if (!setFogProfile(profile, { apply: true, announce: false })) {
      Logger.tell(source, `Unknown fog profile. Use ${FOG_PROFILE_NAMES.join(", ")}.`);
      return { ok: false };
    }
    Logger.tell(source, `Fog profile set to ${FOG_CONFIG.profile}.`);
    return { ok: true };
  }

  if (action === "biome") {
    const player = requirePlayer(source);
    if (!player) {
      Logger.tell(source, "Fog biome test needs an in-world player source.");
      return { ok: false };
    }
    const category = normalizeBiomeTest(args[1] || "default");
    if (!category) {
      Logger.tell(player, "Unknown fog biome test. Use default, valley, alpine, cliffs, forest, coastal, hot_springs, cave, nether, or storm.");
      return { ok: false };
    }
    forceBiomeFogForPlayer(player, category);
    Logger.tell(player, `Testing fog biome: ${BIOME_DISPLAY_NAMES[category] || category}.`);
    return { ok: true };
  }

  if (action === "debug") {
    const enabled = String(args[1] || "").toLowerCase() === "on";
    FOG_CONFIG.debug = enabled;
    Logger.tell(source, `Fog debug ${enabled ? "enabled" : "disabled"}.`);
    return { ok: true };
  }

  Logger.tell(source, "Unknown fog action. Use on, off, status, profile, biome, or debug.");
  return { ok: false };
}

export function setFogProfile(profileName, options = {}) {
  const normalized = normalizeFogProfile(profileName);
  if (!normalized || !setConfigFogProfile(normalized)) {
    return false;
  }
  if (options.apply !== false) {
    applyFogToAllPlayers(true);
  }
  if (options.announce) {
    for (const player of world.getPlayers()) {
      Logger.tell(player, `Fog profile set to ${normalized}.`);
    }
  }
  return true;
}

export function getFogStatusForDiagnostics() {
  return formatFogStatus(makeFogInfo("default"));
}

function tickFogController() {
  if (!FOG_CONFIG.enabled) {
    return;
  }
  for (const player of world.getPlayers()) {
    applyFogForPlayer(player);
  }
}

function applyFogToAllPlayers(forced = false) {
  for (const player of world.getPlayers()) {
    applyFogForPlayer(player, forced);
  }
}

function clearFogForAllPlayers() {
  for (const player of world.getPlayers()) {
    clearRuntimeFog(player);
  }
  playerFogState.clear();
}

function applyFogForPlayer(player, forced = false) {
  if (!player) {
    return false;
  }
  const fogInfo = getActiveFogInfo(player);
  const fogId = getRuntimeFogIdForBiome(fogInfo.category, FOG_CONFIG.profile);
  const key = getPlayerKey(player);
  const previous = playerFogState.get(key);
  if (!forced && previous?.fogId === fogId && previous?.category === fogInfo.category) {
    return true;
  }

  const pushed = pushRuntimeFog(player, fogId);
  playerFogState.set(key, {
    fogId,
    category: fogInfo.category,
    biomeId: fogInfo.biomeId,
    tick: system.currentTick,
    pushed
  });
  stats.lastAppliedFogId = fogId;
  stats.lastAppliedBiome = fogInfo.category;
  if (FOG_CONFIG.debug) {
    Logger.tell(player, `Fog ${fogInfo.displayName}: ${fogId} profile=${FOG_CONFIG.profile} command=${pushed ? "attempted" : "static-only"}`);
  }
  return pushed;
}

function getActiveFogInfo(player) {
  const key = getPlayerKey(player);
  const forced = forcedBiomeTests.get(key);
  if (forced && forced.untilTick > system.currentTick) {
    return makeFogInfo(forced.category, "forced");
  }
  if (forced) {
    forcedBiomeTests.delete(key);
  }
  return getBiomeFogForPlayer(player);
}

function forceBiomeFogForPlayer(player, category) {
  forcedBiomeTests.set(getPlayerKey(player), {
    category,
    untilTick: system.currentTick + FOG_CONFIG.runtime.forcedBiomeTestTicks
  });
  applyFogForPlayer(player, true);
}

function pushRuntimeFog(player, fogId) {
  clearRuntimeFog(player, true);
  const command = `fog @s push ${fogId} ${FOG_CONFIG.runtime.commandUserId}`;
  const sent = runFogCommand(player, command, false);
  if (!sent) {
    return false;
  }
  stats.commandAttempts++;
  return true;
}

function clearRuntimeFog(player, ignoreFailure = true) {
  runFogCommand(player, `fog @s remove ${FOG_CONFIG.runtime.commandUserId}`, ignoreFailure);
  runFogCommand(player, `fog @s pop ${FOG_CONFIG.runtime.commandUserId}`, true);
}

function runFogCommand(player, command, ignoreFailure) {
  try {
    if (typeof player.runCommandAsync === "function") {
      watchCommandResult(player.runCommandAsync(command), command, ignoreFailure);
      return true;
    }
  } catch (error) {
    recordCommandFailure(command, error, ignoreFailure);
  }

  try {
    if (player.dimension && typeof player.dimension.runCommandAsync === "function") {
      const name = String(player.name || "").replace(/"/g, '\\"');
      watchCommandResult(player.dimension.runCommandAsync(`execute as "${name}" run ${command}`), command, ignoreFailure);
      return true;
    }
  } catch (error) {
    recordCommandFailure(command, error, ignoreFailure);
  }

  return false;
}

function watchCommandResult(result, command, ignoreFailure) {
  try {
    if (result && typeof result.catch === "function") {
      result.catch((error) => recordCommandFailure(command, error, ignoreFailure));
    }
  } catch (error) {
    recordCommandFailure(command, error, ignoreFailure);
  }
}

function recordCommandFailure(command, error, ignoreFailure) {
  if (!ignoreFailure) {
    stats.commandFailures++;
    Logger.debug(`Fog command failed (${command}): ${error}`);
  }
}

function formatFogStatus(fogInfo) {
  const profile = getFogProfileSettings();
  return [
    "Realistic Fog status",
    `enabled=${FOG_CONFIG.enabled}`,
    formatFogProfileSummary(),
    `activeBiome=${fogInfo.displayName}`,
    `activeFog=${getRuntimeFogIdForBiome(fogInfo.category, profile.name)}`,
    `staticFallback=on`,
    `commands=${stats.commandAttempts}/${stats.commandFailures}`,
    `last=${stats.lastAppliedBiome}:${stats.lastAppliedFogId}`,
    `debug=${FOG_CONFIG.debug}`
  ].join(" | ");
}

function normalizeBiomeTest(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "default") {
    return "default";
  }
  if (normalized === "valley" || normalized === "deep_valley" || normalized === "deep_valleys") {
    return "deepValleys";
  }
  if (normalized === "alpine" || normalized === "peaks" || normalized === "alpine_peaks") {
    return "alpinePeaks";
  }
  if (normalized === "cliffs" || normalized === "shattered" || normalized === "shattered_cliffs") {
    return "shatteredCliffs";
  }
  if (normalized === "forest" || normalized === "old_growth" || normalized === "highlands") {
    return "oldGrowthHighlands";
  }
  if (normalized === "coastal" || normalized === "coast") {
    return "coastalCliffs";
  }
  if (normalized === "hot_springs" || normalized === "hotsprings" || normalized === "steam") {
    return "hotSprings";
  }
  if (normalized === "cave" || normalized === "caves") {
    return "caves";
  }
  if (normalized === "nether" || normalized === "crack") {
    return "netherDeepCrack";
  }
  if (normalized === "storm") {
    return "storm";
  }
  return undefined;
}

function getPlayerKey(player) {
  return player?.id || player?.name || "unknown";
}

function requirePlayer(source) {
  return source?.typeId === "minecraft:player" ? source : undefined;
}

import { system, world } from "@minecraft/server";
import { MINIMAP_UI_CONFIG } from "./minimapConfig.js";
import { renderSmallMinimapText } from "./minimapRenderer.js";
import { getMinimapState, getProfileSettings, shouldRenderSmallMap } from "./minimapUiState.js";

let initialized = false;
let cleanupAttempts = 0;

export function initMinimapHudController() {
  if (initialized) {
    return;
  }
  initialized = true;
  system.runInterval(cleanupLegacyMinimapScoreboard, 40);
  system.runInterval(tickMinimapHud, 5);
}

function tickMinimapHud() {
  for (const player of world.getPlayers()) {
    const state = getMinimapState(player);
    const profile = getProfileSettings(state);
    if (!shouldRenderSmallMap(player, profile.updateIntervalTicks || MINIMAP_UI_CONFIG.smallMap.updateIntervalTicks)) {
      continue;
    }
    state.renderMode = "actionbar_text_grid";
    try {
      player.onScreenDisplay.setActionBar(renderSmallMinimapText(player, state));
    } catch (_error) {
      try {
        player.sendMessage(renderSmallMinimapText(player, state));
      } catch (__error) {
        // Ignore UI fallback failure.
      }
    }
  }
}

export function clearMinimapSidebar(player) {
  removeLegacyObjective(player);
}

function cleanupLegacyMinimapScoreboard() {
  if (cleanupAttempts >= 8) {
    return;
  }
  cleanupAttempts++;
  for (const player of world.getPlayers()) {
    removeLegacyObjective(player);
  }
  if (world.getPlayers().length === 0) {
    removeLegacyObjectiveFromDimension("minecraft:overworld");
  }
}

function removeLegacyObjective(player) {
  runCommandSafe(player, "scoreboard objectives remove be_minimap");
}

function removeLegacyObjectiveFromDimension(dimensionId) {
  try {
    const dimension = world.getDimension(dimensionId);
    runCommandOnDimensionSafe(dimension, "scoreboard objectives remove be_minimap");
  } catch (_error) {
    // Dimension unavailable during early startup.
  }
}

function runCommand(player, command) {
  if (typeof player.runCommand === "function") {
    return player.runCommand(command);
  }
  if (typeof player.runCommandAsync === "function") {
    return player.runCommandAsync(command);
  }
  const dimension = player.dimension;
  if (dimension && typeof dimension.runCommand === "function") {
    return dimension.runCommand(command);
  }
  if (dimension && typeof dimension.runCommandAsync === "function") {
    return dimension.runCommandAsync(command);
  }
  throw new Error("No command runner available.");
}

function runCommandSafe(player, command) {
  try {
    runCommand(player, command);
  } catch (_error) {
    // Safe cleanup command; ignore failures.
  }
}

function runCommandOnDimensionSafe(dimension, command) {
  try {
    if (dimension && typeof dimension.runCommand === "function") {
      dimension.runCommand(command);
    } else if (dimension && typeof dimension.runCommandAsync === "function") {
      dimension.runCommandAsync(command);
    }
  } catch (_error) {
    // Safe cleanup command; ignore failures.
  }
}

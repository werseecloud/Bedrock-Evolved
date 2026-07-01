import { system, world } from "@minecraft/server";
import { MINIMAP_UI_CONFIG } from "./minimapConfig.js";
import { renderSmallMinimapLines, renderSmallMinimapText } from "./minimapRenderer.js";
import { getMinimapState, getProfileSettings, shouldRenderSmallMap } from "./minimapUiState.js";

let initialized = false;
let sidebarActive = false;

export function initMinimapHudController() {
  if (initialized) {
    return;
  }
  initialized = true;
  system.runInterval(tickMinimapHud, 5);
}

function tickMinimapHud() {
  const players = world.getPlayers();
  for (const player of players) {
    const state = getMinimapState(player);
    const profile = getProfileSettings(state);
    if (!shouldRenderSmallMap(player, profile.updateIntervalTicks || MINIMAP_UI_CONFIG.smallMap.updateIntervalTicks)) {
      continue;
    }
    if (tryRenderSidebar(player, state, players.length)) {
      state.renderMode = "right_sidebar";
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

function tryRenderSidebar(player, state, playerCount) {
  const config = MINIMAP_UI_CONFIG.smallMap;
  if (!config.preferSidebar) {
    return false;
  }
  if (config.sidebarSinglePlayerOnly && playerCount > 1) {
    if (sidebarActive) {
      clearSidebar(player);
      sidebarActive = false;
    }
    return false;
  }

  const objective = config.sidebarObjective || "be_minimap";
  const title = config.sidebarTitle || "BE Minimap";
  try {
    runCommandSafe(player, `scoreboard objectives remove ${objective}`);
    runCommand(player, `scoreboard objectives add ${objective} dummy "${escapeCommandText(title)}"`);
    const lines = renderSmallMinimapLines(player, state).slice(0, 15);
    let score = lines.length + 1;
    for (let i = 0; i < lines.length; i++) {
      const line = formatSidebarLine(lines[i], i);
      runCommand(player, `scoreboard players set "${escapeCommandText(line)}" ${objective} ${score--}`);
    }
    runCommand(player, `scoreboard objectives setdisplay sidebar ${objective}`);
    sidebarActive = true;
    return true;
  } catch (_error) {
    return false;
  }
}

function clearSidebar(player) {
  runCommandSafe(player, `scoreboard objectives setdisplay sidebar`);
  runCommandSafe(player, `scoreboard objectives remove ${MINIMAP_UI_CONFIG.smallMap.sidebarObjective || "be_minimap"}`);
}

export function clearMinimapSidebar(player) {
  clearSidebar(player);
  sidebarActive = false;
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

function formatSidebarLine(line, index) {
  const text = String(line || "").slice(0, 32);
  return `${String(index + 1).padStart(2, "0")} ${text}`;
}

function escapeCommandText(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

import { system } from "@minecraft/server";
import { DEFAULT_LAYERS, MINIMAP_UI_CONFIG } from "./minimapConfig.js";
import { getPerformanceProfileName } from "../performance/performanceManager.js";

const states = new Map();

export function getPlayerKey(player) {
  return player?.id || player?.name || "unknown";
}

export function createDefaultState() {
  return {
    minimapEnabled: MINIMAP_UI_CONFIG.enabledByDefault,
    smallMapVisible: MINIMAP_UI_CONFIG.enabledByDefault,
    fullscreenOpen: false,
    settingsOpen: false,
    position: MINIMAP_UI_CONFIG.defaultPosition,
    size: MINIMAP_UI_CONFIG.defaultSize,
    mode: MINIMAP_UI_CONFIG.defaultMode,
    profile: MINIMAP_UI_CONFIG.defaultProfile,
    showCoordinates: true,
    showEntities: true,
    showPlayers: true,
    showWaypoints: true,
    showDeathMarker: true,
    caveMode: "auto",
    lastOpenedAtTick: 0,
    lastHudRenderTick: 0,
    renderMode: "text_grid",
    layers: { ...DEFAULT_LAYERS },
    cursor: { x: 0, z: 0, zoom: 1 }
  };
}

export function getMinimapState(player) {
  const key = getPlayerKey(player);
  if (!states.has(key)) {
    states.set(key, createDefaultState());
  }
  return states.get(key);
}

export function setMinimapState(player, partial) {
  const current = getMinimapState(player);
  Object.assign(current, partial);
  return current;
}

export function resetRuntimeState(player) {
  states.set(getPlayerKey(player), createDefaultState());
  return getMinimapState(player);
}

export function shouldRenderSmallMap(player, intervalTicks) {
  const state = getMinimapState(player);
  if (!state.minimapEnabled || !state.smallMapVisible || state.fullscreenOpen || state.settingsOpen) {
    return false;
  }
  if (system.currentTick - state.lastHudRenderTick < intervalTicks) {
    return false;
  }
  state.lastHudRenderTick = system.currentTick;
  return true;
}

export function getProfileSettings(state) {
  const globalProfile = getPerformanceProfileName();
  if (MINIMAP_UI_CONFIG.profiles[globalProfile]) {
    return MINIMAP_UI_CONFIG.profiles[globalProfile];
  }
  return MINIMAP_UI_CONFIG.profiles[state.profile] || MINIMAP_UI_CONFIG.profiles.balanced;
}

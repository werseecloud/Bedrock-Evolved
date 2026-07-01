import { system, world } from "@minecraft/server";
import { MINIMAP_UI_CONFIG } from "./minimapConfig.js";
import { renderSmallMinimapText } from "./minimapRenderer.js";
import { getMinimapState, getProfileSettings, shouldRenderSmallMap } from "./minimapUiState.js";

let initialized = false;

export function initMinimapHudController() {
  if (initialized) {
    return;
  }
  initialized = true;
  system.runInterval(tickMinimapHud, 5);
}

function tickMinimapHud() {
  for (const player of world.getPlayers()) {
    const state = getMinimapState(player);
    const profile = getProfileSettings(state);
    if (!shouldRenderSmallMap(player, profile.updateIntervalTicks || MINIMAP_UI_CONFIG.smallMap.updateIntervalTicks)) {
      continue;
    }
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

import { ActionFormData } from "@minecraft/server-ui";
import { Logger } from "../utils/logger.js";
import { VALID_POSITIONS, VALID_PROFILES, VALID_SIZES } from "./minimapConfig.js";
import { getMinimapState, setMinimapState } from "./minimapUiState.js";
import { saveMinimapSettings } from "./minimapStorage.js";
import { openFullscreenMap } from "./minimapFullscreenController.js";

export function showMinimapSettingsForm(player) {
  const state = getMinimapState(player);
  state.settingsOpen = true;
  const toggleLabel = state.minimapEnabled ? "Disable Minimap" : "Enable Minimap";
  const form = new ActionFormData()
    .title("Bedrock Evolved Minimap")
    .body([
      `Status: ${state.minimapEnabled ? "enabled" : "disabled"}`,
      `Position: ${state.position}`,
      `Size: ${state.size}`,
      `Mode: ${state.mode}`,
      `Profile: ${state.profile}`,
      "",
      "Clickable HUD support is limited in Bedrock. Use this item/menu or /scriptevent be:minimap commands as fallback."
    ].join("\n"))
    .button(toggleLabel)
    .button("Open Fullscreen Map")
    .button("Change Position")
    .button("Change Size")
    .button("Toggle Rotation")
    .button("Toggle Coordinates")
    .button("Toggle Entities")
    .button("Toggle Players")
    .button("Toggle Waypoints")
    .button("Toggle Death Marker")
    .button("Change Performance Profile")
    .button("Close");

  form.show(player).then((response) => {
    state.settingsOpen = false;
    if (response.canceled || response.selection === undefined) {
      saveMinimapSettings(player);
      return;
    }
    handleSettingsSelection(player, response.selection);
  }).catch((error) => {
    state.settingsOpen = false;
    Logger.debug(`Minimap settings form failed: ${error}`);
    saveMinimapSettings(player);
  });
}

function handleSettingsSelection(player, selection) {
  const state = getMinimapState(player);
  if (selection === 0) {
    setMinimapEnabled(player, !state.minimapEnabled);
    showMinimapSettingsForm(player);
    return;
  }
  if (selection === 1) {
    if (!state.minimapEnabled) {
      setMinimapEnabled(player, true);
    }
    openFullscreenMap(player);
    return;
  }
  if (selection === 2) {
    state.position = nextValue(VALID_POSITIONS, state.position);
  } else if (selection === 3) {
    state.size = nextValue(VALID_SIZES, state.size);
  } else if (selection === 4) {
    state.mode = state.mode === "rotating" ? "north_up" : "rotating";
  } else if (selection === 5) {
    state.showCoordinates = !state.showCoordinates;
  } else if (selection === 6) {
    state.showEntities = !state.showEntities;
  } else if (selection === 7) {
    state.showPlayers = !state.showPlayers;
  } else if (selection === 8) {
    state.showWaypoints = !state.showWaypoints;
  } else if (selection === 9) {
    state.showDeathMarker = !state.showDeathMarker;
  } else if (selection === 10) {
    state.profile = nextValue(VALID_PROFILES, state.profile);
  } else {
    saveMinimapSettings(player);
    return;
  }
  saveMinimapSettings(player);
  showMinimapSettingsForm(player);
}

export function setMinimapEnabled(player, enabled) {
  setMinimapState(player, {
    minimapEnabled: Boolean(enabled),
    smallMapVisible: Boolean(enabled),
    fullscreenOpen: false
  });
  saveMinimapSettings(player);
  try {
    player.onScreenDisplay.setActionBar(`Minimap ${enabled ? "enabled" : "disabled"}.`);
  } catch (_error) {
    // Optional.
  }
}

function nextValue(values, current) {
  const index = values.indexOf(current);
  return values[(index + 1) % values.length] || values[0];
}

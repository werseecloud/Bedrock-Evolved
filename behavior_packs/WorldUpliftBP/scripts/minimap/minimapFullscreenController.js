import { ActionFormData } from "@minecraft/server-ui";
import { Logger } from "../utils/logger.js";
import { renderFullscreenMapText } from "./minimapRenderer.js";
import { getMinimapState, setMinimapState } from "./minimapUiState.js";
import { saveMinimapSettings } from "./minimapStorage.js";
import { showMinimapSettingsForm } from "./minimapSettingsForm.js";
import { showWaypointListForm, showAddWaypointForm } from "./waypoints/waypointForms.js";
import { addTemporaryWaypoint } from "./waypoints/temporaryWaypointManager.js";
import { moveCursor, resetCursorToPlayer } from "./fullscreen/mapCursorController.js";
import { getLatestDeath } from "./death/deathMarkerManager.js";

export function openFullscreenMap(player) {
  const state = setMinimapState(player, {
    fullscreenOpen: true,
    smallMapVisible: false,
    lastOpenedAtTick: Date.now()
  });
  saveMinimapSettings(player);

  const form = new ActionFormData()
    .title("Bedrock Evolved Minimap")
    .body(renderFullscreenMapText(player, state))
    .button("Close Map")
    .button("Add Waypoint")
    .button("Add Temporary Waypoint")
    .button("Waypoint List")
    .button("Cursor Up")
    .button("Cursor Down")
    .button("Cursor Left")
    .button("Cursor Right")
    .button("Place Temp At Cursor")
    .button("Center On Player")
    .button("Center On Latest Death")
    .button("Layer Settings")
    .button("Settings");

  form.show(player).then((response) => {
    if (response.canceled || response.selection === undefined) {
      return;
    }
    handleFullscreenSelection(player, response.selection);
  }).catch((error) => {
    Logger.debug(`Fullscreen minimap form failed: ${error}`);
    fallbackFullscreenText(player);
  });
}

export function closeFullscreenMap(player) {
  const state = getMinimapState(player);
  setMinimapState(player, {
    fullscreenOpen: false,
    smallMapVisible: state.minimapEnabled
  });
  saveMinimapSettings(player);
  try {
    player.onScreenDisplay.setActionBar("Fullscreen map closed.");
  } catch (_error) {
    // Optional.
  }
}

function handleFullscreenSelection(player, selection) {
  if (selection === 0) {
    closeFullscreenMap(player);
    return;
  }
  if (selection === 1) {
    showAddWaypointForm(player, false);
    return;
  }
  if (selection === 2) {
    addTemporaryWaypoint(player, "Temporary");
    openFullscreenMap(player);
    return;
  }
  if (selection === 3) {
    showWaypointListForm(player);
    return;
  }
  if (selection >= 4 && selection <= 7) {
    const directions = ["up", "down", "left", "right"];
    moveCursor(player, directions[selection - 4]);
    openFullscreenMap(player);
    return;
  }
  if (selection === 8) {
    const state = getMinimapState(player);
    addTemporaryWaypoint(player, "Cursor", {
      x: player.location.x + state.cursor.x,
      y: player.location.y,
      z: player.location.z + state.cursor.z
    });
    openFullscreenMap(player);
    return;
  }
  if (selection === 9) {
    resetCursorToPlayer(player);
    openFullscreenMap(player);
    return;
  }
  if (selection === 10) {
    centerOnLatestDeath(player);
    openFullscreenMap(player);
    return;
  }
  if (selection === 11) {
    import("./fullscreen/mapLayerController.js").then((module) => module.showLayerSettingsForm(player));
    return;
  }
  if (selection === 12) {
    showMinimapSettingsForm(player);
  }
}

function centerOnLatestDeath(player) {
  const death = getLatestDeath(player);
  if (!death || death.dimension !== player.dimension.id) {
    try {
      player.sendMessage("[Bedrock Evolved] No death marker in this dimension.");
    } catch (_error) {
      // Optional.
    }
    return;
  }
  const state = getMinimapState(player);
  state.cursor.x = Math.floor(death.x - player.location.x);
  state.cursor.z = Math.floor(death.z - player.location.z);
  saveMinimapSettings(player);
}

function fallbackFullscreenText(player) {
  try {
    player.sendMessage(renderFullscreenMapText(player, getMinimapState(player)));
  } catch (_error) {
    // Ignore.
  }
}

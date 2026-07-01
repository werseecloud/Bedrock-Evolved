import { Logger } from "../../utils/logger.js";
import { VALID_POSITIONS, VALID_PROFILES, VALID_SIZES } from "../minimapConfig.js";
import { openFullscreenMap, closeFullscreenMap } from "../minimapFullscreenController.js";
import { giveMinimapSettingsItem } from "../minimapItemController.js";
import { showMinimapSettingsForm, setMinimapEnabled } from "../minimapSettingsForm.js";
import { getMinimapState } from "../minimapUiState.js";
import { saveMinimapSettings } from "../minimapStorage.js";
import { handleTemporaryWaypointCommand, handleWaypointCommand } from "../waypoints/waypointCommands.js";
import { clearAllDeaths, clearLatestDeath, getDeathHistory, getLatestDeath } from "../death/deathMarkerManager.js";
import { isDeathBeaconEnabled, setDeathBeaconEnabled } from "../death/deathBeaconManager.js";
import { formatDistanceToMarker } from "../death/deathRouteHelper.js";
import { moveCursor, resetCursorToPlayer } from "../fullscreen/mapCursorController.js";
import { placeTemporaryWaypointFromCursor } from "../fullscreen/fullscreenMapInputController.js";
import { setLayerEnabled } from "../fullscreen/mapLayerController.js";

export function handleMinimapCommand(source, args) {
  const player = requirePlayer(source);
  if (!player) {
    Logger.tell(source, "Minimap commands need an in-world player source.");
    return;
  }

  const action = args[0] || "settings";
  const state = getMinimapState(player);

  if (action === "settings") return showMinimapSettingsForm(player);
  if (action === "item") {
    giveMinimapSettingsItem(player);
    return Logger.tell(player, "Minimap Settings item given.");
  }
  if (action === "on") return setMinimapEnabled(player, true);
  if (action === "off") return setMinimapEnabled(player, false);
  if (action === "toggle") return setMinimapEnabled(player, !state.minimapEnabled);
  if (action === "fullscreen") return openFullscreenMap(player);
  if (action === "close") return closeFullscreenMap(player);
  if (action === "size") return setChoice(player, "size", args[1], VALID_SIZES);
  if (action === "position") return setChoice(player, "position", args[1], VALID_POSITIONS);
  if (action === "rotate") {
    state.mode = args[1] === "off" ? "north_up" : "rotating";
    saveMinimapSettings(player);
    return Logger.tell(player, `Minimap mode: ${state.mode}.`);
  }
  if (action === "profile") return setChoice(player, "profile", args[1], VALID_PROFILES);
  if (action === "waypoint") return handleWaypointCommand(player, args.slice(1));
  if (action === "temp") return handleTemporaryWaypointCommand(player, args.slice(1));
  if (action === "death") return handleDeathCommand(player, args.slice(1));
  if (action === "cursor") return handleCursorCommand(player, args.slice(1));
  if (action === "center") return handleCenterCommand(player, args.slice(1));
  if (action === "layer") return handleLayerCommand(player, args.slice(1));
  if (action === "status") {
    return Logger.tell(player, `Minimap enabled=${state.minimapEnabled} fullscreen=${state.fullscreenOpen} size=${state.size} position=${state.position} mode=${state.mode} profile=${state.profile}.`);
  }

  Logger.tell(player, "Unknown minimap command.");
}

function setChoice(player, key, value, validValues) {
  const state = getMinimapState(player);
  if (!validValues.includes(value)) {
    Logger.tell(player, `Invalid ${key}. Use: ${validValues.join(", ")}`);
    return;
  }
  state[key] = value;
  saveMinimapSettings(player);
  Logger.tell(player, `Minimap ${key} set to ${value}.`);
}

function handleDeathCommand(player, args) {
  const action = args[0] || "status";
  if (action === "status") {
    const death = getLatestDeath(player);
    Logger.tell(player, death ? `Death marker ${death.x},${death.y},${death.z} distance=${formatDistanceToMarker(player, death)} beacon=${isDeathBeaconEnabled(player)}` : "No death marker.");
    return;
  }
  if (action === "clear") {
    clearLatestDeath(player);
    Logger.tell(player, "Death marker cleared.");
    return;
  }
  if (action === "clear_all") {
    clearAllDeaths(player);
    Logger.tell(player, "Death history cleared.");
    return;
  }
  if (action === "history") {
    Logger.tell(player, getDeathHistory(player).map((death) => `${death.x},${death.y},${death.z}`).join("; ") || "No death history.");
    return;
  }
  if (action === "beacon") {
    if (args[1] === "on") {
      setDeathBeaconEnabled(player, true);
      Logger.tell(player, "Death beacon enabled.");
      return;
    }
    if (args[1] === "off" || args[1] === "clear") {
      setDeathBeaconEnabled(player, false);
      Logger.tell(player, "Death beacon disabled.");
      return;
    }
    Logger.tell(player, "Death beacon mode is particle_beam in this prototype.");
  }
}

function handleCursorCommand(player, args) {
  const action = args[0] || "place_temp";
  if (["up", "down", "left", "right"].includes(action)) {
    moveCursor(player, action);
    Logger.tell(player, "Map cursor moved.");
    return;
  }
  if (action === "place_temp") {
    placeTemporaryWaypointFromCursor(player, "Cursor");
    Logger.tell(player, "Temporary waypoint added.");
  }
}

function handleCenterCommand(player, args) {
  const target = args[0] || "player";
  if (target === "player") {
    resetCursorToPlayer(player);
    Logger.tell(player, "Map centered on player.");
    return;
  }
  if (target === "death") {
    const death = getLatestDeath(player);
    const state = getMinimapState(player);
    if (death && death.dimension === player.dimension.id) {
      state.cursor.x = Math.floor(death.x - player.location.x);
      state.cursor.z = Math.floor(death.z - player.location.z);
      saveMinimapSettings(player);
      Logger.tell(player, "Map centered on death marker.");
      return;
    }
    Logger.tell(player, "No death marker in this dimension.");
  }
}

function handleLayerCommand(player, args) {
  const layer = args[0];
  const value = args[1];
  if (!layer || !["on", "off"].includes(value)) {
    Logger.tell(player, "Use /scriptevent be:minimap layer <layer> on/off.");
    return;
  }
  setLayerEnabled(player, layer, value === "on");
  Logger.tell(player, `Layer ${layer} ${value}.`);
}

function requirePlayer(source) {
  return source?.typeId === "minecraft:player" ? source : undefined;
}

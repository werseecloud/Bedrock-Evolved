import { ModalFormData, ActionFormData } from "@minecraft/server-ui";
import { addWaypoint, clearWaypoints, listWaypoints, removeWaypoint } from "./waypointManager.js";
import { addTemporaryWaypoint, clearTemporaryWaypoints, listTemporaryWaypoints, removeTemporaryWaypoint } from "./temporaryWaypointManager.js";
import { VALID_COLORS, VALID_ICONS } from "../minimapConfig.js";
import { Logger } from "../../utils/logger.js";
import { openFullscreenMap } from "../minimapFullscreenController.js";

export function showAddWaypointForm(player, temporary = false) {
  const form = new ModalFormData()
    .title(temporary ? "Add Temporary Waypoint" : "Add Waypoint")
    .textField("Name", temporary ? "Temporary" : "Home", temporary ? "Temporary" : "Waypoint")
    .dropdown("Icon", VALID_ICONS, 0)
    .dropdown("Color", VALID_COLORS, 3)
    .dropdown("Visibility", ["private", "team", "public"], 0);

  form.show(player).then((response) => {
    if (response.canceled || !response.formValues) {
      openFullscreenMap(player);
      return;
    }
    const [name, iconIndex, colorIndex, visibilityIndex] = response.formValues;
    if (temporary) {
      addTemporaryWaypoint(player, String(name || "Temporary"));
      tell(player, "Temporary waypoint added.");
    } else {
      const result = addWaypoint(player, String(name || "Waypoint"), {
        icon: VALID_ICONS[Number(iconIndex) || 0],
        color: VALID_COLORS[Number(colorIndex) || 0],
        visibility: ["private", "team", "public"][Number(visibilityIndex) || 0]
      });
      tell(player, result.ok ? "Waypoint added." : "Waypoint limit reached.");
    }
    openFullscreenMap(player);
  }).catch((error) => {
    Logger.debug(`Waypoint form failed: ${error}`);
  });
}

export function showWaypointListForm(player) {
  const waypoints = listWaypoints(player);
  const temporary = listTemporaryWaypoints(player);
  const form = new ActionFormData()
    .title("Waypoints")
    .body(formatWaypointList(waypoints, temporary))
    .button("Add Waypoint")
    .button("Add Temporary Waypoint")
    .button("Clear Permanent Waypoints")
    .button("Clear Temporary Waypoints")
    .button("Back To Map");

  for (const marker of [...waypoints, ...temporary].slice(0, 20)) {
    form.button(`Remove ${marker.name}`);
  }

  form.show(player).then((response) => {
    if (response.canceled || response.selection === undefined) {
      return;
    }
    if (response.selection === 0) return showAddWaypointForm(player, false);
    if (response.selection === 1) return showAddWaypointForm(player, true);
    if (response.selection === 2) {
      clearWaypoints(player);
      return showWaypointListForm(player);
    }
    if (response.selection === 3) {
      clearTemporaryWaypoints(player);
      return showWaypointListForm(player);
    }
    if (response.selection === 4) return openFullscreenMap(player);
    const marker = [...waypoints, ...temporary][response.selection - 5];
    if (marker) {
      if (marker.type === "temporary_waypoint") {
        removeTemporaryWaypoint(player, marker.markerId);
      } else {
        removeWaypoint(player, marker.markerId);
      }
      showWaypointListForm(player);
    }
  }).catch((error) => {
    Logger.debug(`Waypoint list form failed: ${error}`);
  });
}

function formatWaypointList(waypoints, temporary) {
  const lines = [];
  lines.push(`Permanent: ${waypoints.length}`);
  lines.push(...waypoints.slice(0, 8).map((marker) => `W ${marker.name} ${marker.x},${marker.y},${marker.z}`));
  lines.push(`Temporary: ${temporary.length}`);
  lines.push(...temporary.slice(0, 8).map((marker) => `+ ${marker.name} ${marker.x},${marker.y},${marker.z}`));
  return lines.join("\n");
}

function tell(player, message) {
  try {
    player.onScreenDisplay.setActionBar(message);
  } catch (_error) {
    try {
      player.sendMessage(`[Bedrock Evolved] ${message}`);
    } catch (__error) {
      // Ignore.
    }
  }
}

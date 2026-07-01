import { Logger } from "../../utils/logger.js";
import {
  addWaypoint,
  clearWaypoints,
  listWaypoints,
  removeWaypoint,
  renameWaypoint,
  setWaypointColor,
  setWaypointIcon,
  setWaypointVisibility
} from "./waypointManager.js";
import {
  addTemporaryWaypoint,
  clearTemporaryWaypoints,
  listTemporaryWaypoints,
  removeTemporaryWaypoint
} from "./temporaryWaypointManager.js";

export function handleWaypointCommand(player, args) {
  const action = args[0] || "list";
  if (action === "add") {
    const result = addWaypoint(player, args.slice(1).join(" ") || "Waypoint");
    Logger.tell(player, result.ok ? "Waypoint added." : "Waypoint limit reached.");
    return;
  }
  if (action === "remove") {
    Logger.tell(player, removeWaypoint(player, args.slice(1).join(" ")) ? "Waypoint removed." : "Waypoint not found.");
    return;
  }
  if (action === "rename") {
    Logger.tell(player, renameWaypoint(player, args[1], args.slice(2).join(" ")) ? "Waypoint renamed." : "Waypoint not found.");
    return;
  }
  if (action === "list") {
    const list = listWaypoints(player).map((marker) => `${marker.name} ${marker.x},${marker.y},${marker.z}`).join("; ");
    Logger.tell(player, list || "No waypoints.");
    return;
  }
  if (action === "clear") {
    clearWaypoints(player);
    Logger.tell(player, "Waypoints cleared.");
    return;
  }
  if (action === "color") {
    Logger.tell(player, setWaypointColor(player, args[1], args[2]) ? "Waypoint color updated." : "Waypoint not found.");
    return;
  }
  if (action === "icon") {
    Logger.tell(player, setWaypointIcon(player, args[1], args[2]) ? "Waypoint icon updated." : "Waypoint not found.");
    return;
  }
  if (["public", "private", "team"].includes(action)) {
    Logger.tell(player, setWaypointVisibility(player, args[1], action) ? "Waypoint visibility updated." : "Waypoint not found.");
  }
}

export function handleTemporaryWaypointCommand(player, args) {
  const action = args[0] || "add";
  if (action === "add") {
    addTemporaryWaypoint(player, args.slice(1).join(" ") || "Temporary");
    Logger.tell(player, "Temporary waypoint added.");
    return;
  }
  if (action === "remove") {
    Logger.tell(player, removeTemporaryWaypoint(player, args.slice(1).join(" ")) ? "Temporary waypoint removed." : "Temporary waypoint not found.");
    return;
  }
  if (action === "clear") {
    clearTemporaryWaypoints(player);
    Logger.tell(player, "Temporary waypoints cleared.");
    return;
  }
  if (action === "list") {
    Logger.tell(player, listTemporaryWaypoints(player).map((marker) => `${marker.name} ${marker.x},${marker.z}`).join("; ") || "No temporary waypoints.");
    return;
  }
  if (action === "lifetime") {
    Logger.tell(player, "Temporary waypoint lifetime is configured in minimapConfig.js for this prototype.");
  }
}

import { addTemporaryWaypoint } from "../waypoints/temporaryWaypointManager.js";
import { getMinimapState } from "../minimapUiState.js";

export function placeTemporaryWaypointFromCursor(player, name = "Cursor") {
  const state = getMinimapState(player);
  return addTemporaryWaypoint(player, name, {
    x: player.location.x + state.cursor.x,
    y: player.location.y,
    z: player.location.z + state.cursor.z
  });
}

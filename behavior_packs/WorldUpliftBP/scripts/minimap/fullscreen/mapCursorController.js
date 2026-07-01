import { getMinimapState } from "../minimapUiState.js";
import { saveMinimapSettings } from "../minimapStorage.js";

const STEP = 32;

export function moveCursor(player, direction) {
  const state = getMinimapState(player);
  if (direction === "up") state.cursor.z -= STEP;
  if (direction === "down") state.cursor.z += STEP;
  if (direction === "left") state.cursor.x -= STEP;
  if (direction === "right") state.cursor.x += STEP;
  clampCursor(state);
  saveMinimapSettings(player);
  return state.cursor;
}

export function resetCursorToPlayer(player) {
  const state = getMinimapState(player);
  state.cursor.x = 0;
  state.cursor.z = 0;
  saveMinimapSettings(player);
}

export function mapCellToWorldPosition(player, mapCenter, gridX, gridZ, zoom = 1) {
  const step = Math.max(4, Math.floor(8 * zoom));
  return {
    x: Math.floor((mapCenter?.x ?? player.location.x) + gridX * step),
    y: Math.floor(player.location.y),
    z: Math.floor((mapCenter?.z ?? player.location.z) + gridZ * step)
  };
}

function clampCursor(state) {
  state.cursor.x = Math.max(-512, Math.min(512, state.cursor.x));
  state.cursor.z = Math.max(-512, Math.min(512, state.cursor.z));
}

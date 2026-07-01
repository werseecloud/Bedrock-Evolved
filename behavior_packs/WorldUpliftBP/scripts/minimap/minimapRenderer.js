import { renderMapGrid } from "./minimapGridRenderer.js";
import { gatherMarkersForPlayer } from "./markers/markerRegistry.js";
import { overlayMarkersOnGrid, renderMarkerList } from "./markers/markerRenderer.js";

export function renderSmallMinimapText(player, state) {
  return renderSmallMinimapLines(player, state).join("\n");
}

export function renderSmallMinimapLines(player, state) {
  const grid = renderMapGrid(player, state, "small");
  const markers = gatherMarkersForPlayer(player, "small");
  const withMarkers = overlayMarkersOnGrid(grid, player, state, markers, "small");
  const coordinates = state.showCoordinates
    ? `XYZ ${Math.floor(player.location.x)} ${Math.floor(player.location.y)} ${Math.floor(player.location.z)}`
    : "";
  return [`Minimap ${state.size} ${state.mode}`, ...withMarkers, coordinates].filter(Boolean);
}

export function renderFullscreenMapText(player, state) {
  const grid = renderMapGrid(player, state, "fullscreen");
  const markers = gatherMarkersForPlayer(player, "fullscreen");
  const withMarkers = overlayMarkersOnGrid(grid, player, state, markers, "fullscreen");
  const header = [
    `N | X:${Math.floor(player.location.x)} Y:${Math.floor(player.location.y)} Z:${Math.floor(player.location.z)}`,
    `Dimension: ${player.dimension.id}`,
    `Mode: ${state.mode} | Profile: ${state.profile} | Cursor: ${state.cursor.x},${state.cursor.z}`
  ].join("\n");
  const legend = [
    "Legend: ^ You | X Death | W Waypoint | + Temp | C City | P Player | ! Hostile",
    ". grass | T forest | ~ water | # stone | * snow | : sand | ? unknown"
  ].join("\n");
  return `${header}\n\n${withMarkers.join("\n")}\n\n${renderMarkerList(player, markers, 16)}\n\n${legend}`;
}

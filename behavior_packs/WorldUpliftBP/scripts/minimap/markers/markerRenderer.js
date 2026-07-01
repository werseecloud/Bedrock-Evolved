import { distance2D } from "../../utils/vectors.js";
import { getProfileSettings } from "../minimapUiState.js";

export function overlayMarkersOnGrid(lines, player, state, markers, mode = "small") {
  const output = lines.map((line) => line.split(""));
  const size = output.length;
  const center = Math.floor(size / 2);
  const profile = getProfileSettings(state);
  const step = mode === "fullscreen" ? Math.max(4, Math.floor(8 * (state.cursor?.zoom || 1))) : 8;
  const maxRadius = mode === "fullscreen" ? Math.floor(profile.fullscreenGrid / 2) : Math.floor(profile.smallGrid / 2);

  for (const marker of markers) {
    if (marker.dimension !== player.dimension.id) {
      continue;
    }
    const gx = Math.round((marker.x - player.location.x - (state.cursor?.x || 0)) / step);
    const gz = Math.round((marker.z - player.location.z - (state.cursor?.z || 0)) / step);
    let px = center + gx;
    let pz = center + gz;
    if (Math.abs(gx) > maxRadius || Math.abs(gz) > maxRadius) {
      if (mode !== "fullscreen") {
        continue;
      }
      px = Math.max(0, Math.min(size - 1, px));
      pz = Math.max(0, Math.min(size - 1, pz));
    }
    if (output[pz] && output[pz][px] !== undefined) {
      output[pz][px] = markerToGlyph(marker);
    }
  }
  return output.map((line) => line.join(""));
}

export function renderMarkerList(player, markers, limit = 12) {
  if (!markers.length) {
    return "Markers: none nearby";
  }
  return markers.slice(0, limit).map((marker) => {
    const distance = marker.dimension === player.dimension.id ? `${Math.floor(distance2D(player.location, marker))}m` : "other dimension";
    return `${markerToGlyph(marker)} ${marker.name} (${distance})`;
  }).join("\n");
}

export function markerToGlyph(marker) {
  switch (marker.type) {
    case "latest_death": return "X";
    case "old_death": return "x";
    case "temporary_waypoint": return "+";
    case "permanent_waypoint": return "W";
    case "city": return "C";
    case "village": return "V";
    case "landmark": return "L";
    case "player": return "P";
    case "hostile_mob": return "!";
    case "passive_mob": return "o";
    case "cluster": return "*";
    default: return "?";
  }
}

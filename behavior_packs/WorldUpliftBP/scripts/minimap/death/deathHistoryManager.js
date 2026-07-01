import { MINIMAP_UI_CONFIG } from "../minimapConfig.js";

export function pushDeathHistory(data, deathMarker) {
  if (!deathMarker) {
    return;
  }
  data.deathHistory.unshift({
    ...deathMarker,
    type: "old_death",
    priority: 90,
    markerId: `old_${deathMarker.markerId}`
  });
  data.deathHistory = data.deathHistory.slice(0, MINIMAP_UI_CONFIG.deathMarkers.maxHistory);
}

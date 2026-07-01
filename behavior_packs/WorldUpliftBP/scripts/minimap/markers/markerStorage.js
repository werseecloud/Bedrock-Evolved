import { Logger } from "../../utils/logger.js";
import { getPlayerKey } from "../minimapUiState.js";

const PREFIX = "be:minimap:markers:";
const MEMORY = new Map();

export function loadMarkerData(player) {
  const key = getPlayerKey(player);
  if (MEMORY.has(key)) {
    return MEMORY.get(key);
  }
  const fallback = createEmptyMarkerData();
  try {
    const raw = player.getDynamicProperty(`${PREFIX}${key}`);
    if (typeof raw === "string" && raw.length > 0) {
      const parsed = JSON.parse(raw);
      const data = {
        ...fallback,
        ...parsed,
        waypoints: Array.isArray(parsed.waypoints) ? parsed.waypoints : [],
        temporaryWaypoints: Array.isArray(parsed.temporaryWaypoints) ? parsed.temporaryWaypoints : [],
        deathHistory: Array.isArray(parsed.deathHistory) ? parsed.deathHistory : []
      };
      MEMORY.set(key, data);
      return data;
    }
  } catch (error) {
    Logger.debug(`Marker storage load fallback: ${error}`);
  }
  MEMORY.set(key, fallback);
  return fallback;
}

export function saveMarkerData(player, data) {
  const key = getPlayerKey(player);
  MEMORY.set(key, data);
  try {
    player.setDynamicProperty(`${PREFIX}${key}`, JSON.stringify(data));
  } catch (error) {
    Logger.debug(`Marker storage memory-only fallback: ${error}`);
  }
}

export function createEmptyMarkerData() {
  return {
    waypoints: [],
    temporaryWaypoints: [],
    latestDeath: undefined,
    deathHistory: [],
    deathBeaconEnabled: true
  };
}

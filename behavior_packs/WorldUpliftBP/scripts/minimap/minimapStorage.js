import { Logger } from "../utils/logger.js";
import { createDefaultState, getMinimapState, getPlayerKey, setMinimapState } from "./minimapUiState.js";

const SETTINGS_PREFIX = "be:minimap:settings:";
const RUNTIME_SETTINGS = new Map();

export function loadMinimapSettings(player) {
  const key = getPlayerKey(player);
  const fallback = RUNTIME_SETTINGS.get(key);
  if (fallback) {
    setMinimapState(player, fallback);
    return getMinimapState(player);
  }

  try {
    const raw = player.getDynamicProperty(`${SETTINGS_PREFIX}${key}`);
    if (typeof raw === "string" && raw.length > 0) {
      const parsed = JSON.parse(raw);
      setMinimapState(player, sanitizeSettings(parsed));
      return getMinimapState(player);
    }
  } catch (error) {
    Logger.debug(`Minimap settings load fallback: ${error}`);
  }

  const state = createDefaultState();
  setMinimapState(player, state);
  return getMinimapState(player);
}

export function saveMinimapSettings(player) {
  const key = getPlayerKey(player);
  const state = sanitizeSettings(getMinimapState(player));
  RUNTIME_SETTINGS.set(key, state);
  try {
    player.setDynamicProperty(`${SETTINGS_PREFIX}${key}`, JSON.stringify(state));
  } catch (error) {
    Logger.debug(`Minimap settings persisted in memory only: ${error}`);
  }
}

export function sanitizeSettings(input) {
  const defaults = createDefaultState();
  return {
    ...defaults,
    ...input,
    layers: {
      ...defaults.layers,
      ...(input?.layers || {})
    },
    cursor: {
      ...defaults.cursor,
      ...(input?.cursor || {})
    }
  };
}

import { world } from "@minecraft/server";
import { CAMERA_OVERHAUL_ENABLED, DEFAULT_PROFILE } from "../config.js";
import { clamp } from "../utils/math.js";
import { Logger } from "../utils/logger.js";

const SETTINGS_PREFIX = "co:camera:";
const states = new Map();
const runtimeSettings = new Map();

export function getState(player) {
  const key = getPlayerKey(player);
  let state = states.get(key);
  if (!state) {
    state = {
      key,
      previousLocation: undefined,
      previousOnGround: true,
      fallStartY: undefined,
      fallDistance: 0,
      movementTime: 0,
      currentFov: 70,
      targetFov: 70,
      lastFovCommandTick: -9999,
      lastShakeTick: -9999,
      cameraPresetAttempted: false,
      apiMode: "unknown",
      advancedFailed: false,
      commandFailed: false,
      disabledReason: "",
      lastComputed: {
        sway: 0,
        strafe: 0,
        landing: 0
      }
    };
    states.set(key, state);
  }
  return state;
}

export function getSettings(player) {
  const key = getPlayerKey(player);
  let settings = runtimeSettings.get(key);
  if (!settings) {
    settings = loadSettings(player);
    runtimeSettings.set(key, settings);
  }
  return settings;
}

export function updateSettings(player, patch) {
  const current = getSettings(player);
  const next = {
    ...current,
    ...patch
  };
  next.intensity = clamp(Number(next.intensity), 0, 2);
  runtimeSettings.set(getPlayerKey(player), next);
  saveSettings(player, next);
  return next;
}

export function resetSettings(player) {
  const settings = {
    enabled: CAMERA_OVERHAUL_ENABLED,
    profile: DEFAULT_PROFILE,
    intensity: 1,
    debug: false
  };
  runtimeSettings.set(getPlayerKey(player), settings);
  saveSettings(player, settings);
  return settings;
}

export function forgetPlayer(player) {
  const key = typeof player === "string" ? player : getPlayerKey(player);
  states.delete(key);
  runtimeSettings.delete(key);
}

export function getPlayerKey(player) {
  return player.id || player.name;
}

function loadSettings(player) {
  const fallback = {
    enabled: CAMERA_OVERHAUL_ENABLED,
    profile: DEFAULT_PROFILE,
    intensity: 1,
    debug: false
  };

  try {
    const raw = player.getDynamicProperty(`${SETTINGS_PREFIX}settings`);
    if (typeof raw === "string" && raw.length > 0) {
      return {
        ...fallback,
        ...JSON.parse(raw)
      };
    }
  } catch (error) {
    Logger.debug(`Dynamic property load unavailable for ${player.name}: ${error}`);
  }

  return fallback;
}

function saveSettings(player, settings) {
  try {
    player.setDynamicProperty(`${SETTINGS_PREFIX}settings`, JSON.stringify(settings));
  } catch (error) {
    Logger.debug(`Dynamic property save unavailable for ${player.name}; using runtime memory: ${error}`);
  }
}

export function saveAllRuntimeSettings() {
  for (const player of world.getPlayers()) {
    const settings = runtimeSettings.get(getPlayerKey(player));
    if (settings) {
      saveSettings(player, settings);
    }
  }
}

import { system, world } from "@minecraft/server";
import { CAMERA_CONSTANTS, UPDATE_INTERVAL_TICKS } from "../config.js";
import { Logger } from "../utils/logger.js";
import { analyzeMovement } from "./movementAnalyzer.js";
import { computeCameraEffects } from "./cameraEffects.js";
import { getProfile } from "./cameraProfiles.js";
import { getSettings, getState, updateSettings } from "./cameraState.js";
import { isModuleUsable, recordModuleError, shouldRunForPlayer } from "../performance/performanceManager.js";

let initialized = false;

export function initCameraController() {
  if (initialized) {
    return;
  }
  initialized = true;
  system.runInterval(updatePlayers, UPDATE_INTERVAL_TICKS);
}

export function resetPlayerCamera(player) {
  const state = getState(player);
  tryCallClear(player, state);
  tryCommand(player, "camera @s fov_clear 0.25 in_out_sine", state);
  state.currentFov = CAMERA_CONSTANTS.baseFov;
  state.targetFov = CAMERA_CONSTANTS.baseFov;
}

export function disablePlayerCamera(player) {
  updateSettings(player, { enabled: false });
  resetPlayerCamera(player);
}

export function enablePlayerCamera(player) {
  updateSettings(player, { enabled: true });
}

function updatePlayers() {
  if (!isModuleUsable("camera")) {
    return;
  }
  for (const player of world.getPlayers()) {
    try {
      updatePlayer(player);
    } catch (error) {
      recordModuleError("camera", error);
    }
  }
}

function updatePlayer(player) {
  const settings = getSettings(player);
  const state = getState(player);
  const profile = getProfile(settings.profile);

  if (!settings.enabled) {
    return;
  }

  const interval = Math.max(1, profile.updateIntervalTicks || UPDATE_INTERVAL_TICKS);
  if (!shouldRunForPlayer(player, "camera", interval, 1)) {
    return;
  }

  if (state.apiMode === "disabled") {
    return;
  }

  primeFirstPersonCamera(player, state);
  const movement = analyzeMovement(player, state);
  const effects = computeCameraEffects(movement, profile, settings, state);
  applyEffects(player, state, effects, movement);

  if (settings.debug || Logger.getDebug()) {
    Logger.debug(`${player.name} ${movement.stateName} speed=${movement.horizontalSpeed.toFixed(3)} strafe=${movement.strafeAmount.toFixed(2)} mode=${state.apiMode}`);
  }
}

function applyEffects(player, state, effects, movement) {
  if (effects.shouldShakeLanding) {
    applyLandingFeedback(player, state, effects.landing);
    return;
  }

  if (effects.shouldShakeMovement && !movement.isSwimming && !movement.isFlying && !movement.isRiding) {
    applyMovementFeedback(player, state, effects);
  }
}

function applyMovementFeedback(player, state, effects) {
  if (system.currentTick - state.lastShakeTick < CAMERA_CONSTANTS.shakeCooldownTicks) {
    return;
  }
  const intensity = Math.min(0.018, 0.004 + Math.abs(effects.sway) * 0.08 + Math.abs(effects.strafe) * 0.005);
  if (tryAddShake(player, state, intensity, 0.12, "Rotational")) {
    state.lastShakeTick = system.currentTick;
  }
}

function applyLandingFeedback(player, state, landing) {
  if (system.currentTick - state.lastShakeTick < CAMERA_CONSTANTS.shakeCooldownTicks) {
    return;
  }
  const intensity = Math.min(0.08, 0.012 + landing * 0.08);
  if (tryAddShake(player, state, intensity, 0.16, "Positional")) {
    state.lastShakeTick = system.currentTick;
    return;
  }
  if (tryCommand(player, `camerashake add @s ${intensity.toFixed(3)} 0.16 positional`, state)) {
    state.apiMode = state.apiMode === "unknown" ? "command" : state.apiMode;
    state.lastShakeTick = system.currentTick;
  }
}

function primeFirstPersonCamera(player, state) {
  if (state.cameraPresetAttempted || state.advancedFailed) {
    return;
  }
  state.cameraPresetAttempted = true;
  try {
    if (!player.camera || typeof player.camera.setCamera !== "function") {
      return;
    }
    player.camera.setCamera("minecraft:first_person");
    state.apiMode = "advanced";
  } catch (error) {
    Logger.debug(`setCamera first_person unavailable for ${player.name}: ${error}`);
  }
}

function tryAddShake(player, state, intensity, duration, type) {
  if (state.advancedFailed) {
    return false;
  }
  try {
    if (!player.camera || typeof player.camera.addShake !== "function") {
      return false;
    }
    player.camera.addShake({
      intensity,
      duration,
      type
    });
    state.apiMode = "advanced";
    return true;
  } catch (error) {
    state.advancedFailed = true;
    Logger.debug(`addShake failed for ${player.name}: ${error}`);
    return false;
  }
}

function tryCallClear(player, state) {
  try {
    if (player.camera && typeof player.camera.clear === "function") {
      player.camera.clear();
      state.apiMode = state.apiMode === "unknown" ? "advanced" : state.apiMode;
      return true;
    }
  } catch (error) {
    Logger.debug(`camera.clear failed for ${player.name}: ${error}`);
  }
  return tryCommand(player, "camera @s clear", state);
}

function tryCommand(player, command, state) {
  if (state.commandFailed && !command.includes("clear")) {
    return false;
  }
  try {
    if (typeof player.runCommandAsync === "function") {
      player.runCommandAsync(command);
      return true;
    }
  } catch (error) {
    Logger.debug(`player command failed (${command}) for ${player.name}: ${error}`);
  }

  try {
    if (player.dimension && typeof player.dimension.runCommandAsync === "function") {
      player.dimension.runCommandAsync(`execute as "${player.name}" run ${command}`);
      return true;
    }
  } catch (error) {
    state.commandFailed = true;
    Logger.debug(`dimension command failed (${command}) for ${player.name}: ${error}`);
  }

  return false;
}

import { DEFAULT_PROFILE } from "../config.js";
import { Logger } from "../utils/logger.js";
import { clamp } from "../utils/math.js";
import { disablePlayerCamera, enablePlayerCamera, resetPlayerCamera } from "./cameraController.js";
import { getProfile, getProfileNames, isValidProfile } from "./cameraProfiles.js";
import { getSettings, getState, resetSettings, updateSettings } from "./cameraState.js";

export function handleCameraCommand(source, args) {
  const player = requirePlayer(source);
  if (!player) {
    Logger.tell(source, "Camera commands need an in-world player source.");
    return;
  }

  const action = args[0] || "status";

  if (action === "on") {
    enablePlayerCamera(player);
    Logger.tell(player, "Camera Overhaul enabled.");
    return;
  }

  if (action === "off") {
    disablePlayerCamera(player);
    Logger.tell(player, "Camera Overhaul disabled and camera reset.");
    return;
  }

  if (action === "status") {
    showStatus(player);
    return;
  }

  if (action === "profile") {
    setProfile(player, args[1] || DEFAULT_PROFILE);
    return;
  }

  if (action === "intensity") {
    const intensity = clamp(Number(args[1]), 0, 2);
    if (Number.isNaN(intensity)) {
      Logger.tell(player, "Use /scriptevent co:camera intensity <0.0-2.0>.");
      return;
    }
    updateSettings(player, { intensity });
    Logger.tell(player, `Intensity set to ${intensity.toFixed(2)}.`);
    return;
  }

  if (action === "reset") {
    resetSettings(player);
    resetPlayerCamera(player);
    Logger.tell(player, "Camera settings and view reset.");
    return;
  }

  if (action === "debug") {
    const enabled = args[1] === "on";
    updateSettings(player, { debug: enabled });
    Logger.setDebug(enabled);
    Logger.tell(player, `Camera debug ${enabled ? "enabled" : "disabled"}.`);
    return;
  }

  Logger.tell(player, "Unknown camera action. Use on, off, status, profile, intensity, reset, or debug.");
}

function setProfile(player, profileName) {
  if (!isValidProfile(profileName)) {
    Logger.tell(player, `Unknown camera profile. Valid profiles: ${getProfileNames().join(", ")}.`);
    return;
  }
  updateSettings(player, { profile: profileName });
  if (profileName === "performance") {
    resetPlayerCamera(player);
  }
  Logger.tell(player, `Camera profile set to ${profileName}.`);
}

function showStatus(player) {
  const settings = getSettings(player);
  const state = getState(player);
  const profile = getProfile(settings.profile);
  Logger.tell(player, `camera enabled=${settings.enabled} profile=${profile.name} intensity=${settings.intensity} apiMode=${state.apiMode} debug=${settings.debug}`);
}

function requirePlayer(source) {
  if (source && source.typeId === "minecraft:player") {
    return source;
  }
  return undefined;
}

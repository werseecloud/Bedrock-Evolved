import { Logger } from "../utils/logger.js";
import { MutableConfig } from "../config.js";
import {
  getLodStatus,
  LODConfig,
  setLodDebug,
  setLodEnabled,
  setPerformanceMode,
  setVibrantProfile
} from "./lodConfig.js";
import { initLodRegistry, getRegistryStatus } from "./lodRegistry.js";
import { initLodStreamer } from "./lodStreamer.js";
import { getBudgetStatus } from "./lodBudget.js";

export function initLodManager() {
  initLodRegistry();
  initLodStreamer();
}

export function handleLodCommand(source, args) {
  const action = args[0] || "status";
  if (action === "on") {
    setLodEnabled(true);
    Logger.tell(source, "LOD illusion system enabled.");
    return;
  }
  if (action === "off") {
    setLodEnabled(false);
    Logger.tell(source, "LOD illusion system disabled.");
    return;
  }
  if (action === "debug") {
    const enabled = args[1] === "on";
    setLodDebug(enabled);
    Logger.tell(source, `LOD debug ${enabled ? "enabled" : "disabled"}.`);
    return;
  }
  if (action === "status") {
    const playerName = source?.name || "world";
    Logger.tell(source, `${getLodStatus()} ${getBudgetStatus(playerName)} ${getRegistryStatus()}`);
    return;
  }
  Logger.tell(source, "Unknown LOD action. Use on, off, status, or debug on/off.");
}

export function handleVibrantCommand(source, args) {
  const action = args[0] || "status";
  if (action === "status") {
    Logger.tell(source, `Vibrant profile=${LODConfig.VIBRANT_PROFILE}. PBR texture sets are resource-pack driven and still render acceptably without Vibrant Visuals.`);
    return;
  }
  if (action === "profile") {
    const profile = args[1] || "balanced";
    if (!setVibrantProfile(profile)) {
      Logger.tell(source, "Unknown vibrant profile. Use alpine, valley, or city.");
      return;
    }
    Logger.tell(source, `Vibrant profile metadata set to ${profile}. Client graphics settings remain controlled by Minecraft.`);
    return;
  }
  Logger.tell(source, "Unknown vibrant action. Use status or profile.");
}

export function handlePerformanceCommand(source, args) {
  const mode = args[0] || "balanced";
  if (!setPerformanceMode(mode)) {
    Logger.tell(source, "Unknown performance mode. Use performance, balanced, or cinematic.");
    return;
  }
  MutableConfig.MAX_BLOCK_OPS_PER_TICK = Math.min(64, LODConfig.LOD_BLOCK_OPS_PER_TICK);
  Logger.tell(source, `Performance mode set to ${mode}. ${getLodStatus()}`);
}

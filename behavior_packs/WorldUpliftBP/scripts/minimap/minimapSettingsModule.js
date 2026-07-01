import { world } from "@minecraft/server";
import { Logger } from "../utils/logger.js";
import { loadMinimapSettings } from "./minimapStorage.js";
import { initMinimapHudController } from "./minimapHudController.js";
import { initMinimapItemController } from "./minimapItemController.js";
import { initDeathMarkerManager } from "./death/deathMarkerManager.js";
import { initDeathBeaconManager } from "./death/deathBeaconManager.js";

let initialized = false;

export function initBedrockEvolvedMinimap() {
  if (initialized) {
    return;
  }
  initialized = true;
  initMinimapHudController();
  initMinimapItemController();
  initDeathMarkerManager();
  initDeathBeaconManager();
  try {
    world.afterEvents.playerSpawn.subscribe((event) => {
      loadMinimapSettings(event.player);
    });
  } catch (error) {
    Logger.warn(`Minimap player settings load hook failed: ${error}`);
  }
  Logger.info("Bedrock Evolved Minimap initialized.");
}

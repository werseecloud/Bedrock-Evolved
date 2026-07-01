import { RIGHTCLICK_HARVEST_CONFIG } from "../config.js";
import { Logger } from "../utils/logger.js";
import { getSupportedCropSummary } from "./cropRegistry.js";
import { canUseHarvestCommands } from "./permissionService.js";

export function handleHarvestCommand(source, id, args) {
  if (!canUseHarvestCommands(source)) {
    Logger.tell(source, "You do not have permission to change RightClick Harvest settings.");
    return;
  }
  const command = id.replace("rch:", "");
  if (command === "on") {
    RIGHTCLICK_HARVEST_CONFIG.RIGHTCLICK_HARVEST_ENABLED = true;
    Logger.tell(source, "RightClick Harvest enabled.");
    return;
  }
  if (command === "off") {
    RIGHTCLICK_HARVEST_CONFIG.RIGHTCLICK_HARVEST_ENABLED = false;
    Logger.tell(source, "RightClick Harvest disabled.");
    return;
  }
  if (command === "status") {
    Logger.tell(source, `enabled=${RIGHTCLICK_HARVEST_CONFIG.RIGHTCLICK_HARVEST_ENABLED} seedRequired=${RIGHTCLICK_HARVEST_CONFIG.REQUIRE_SEED_TO_REPLANT} drop=${RIGHTCLICK_HARVEST_CONFIG.DROP_TO_INVENTORY ? "inventory" : "ground"} crops=[${getSupportedCropSummary()}]`);
    return;
  }
  if (command === "seed_required") {
    RIGHTCLICK_HARVEST_CONFIG.REQUIRE_SEED_TO_REPLANT = args[0] === "on";
    Logger.tell(source, `Seed requirement ${RIGHTCLICK_HARVEST_CONFIG.REQUIRE_SEED_TO_REPLANT ? "enabled" : "disabled"}.`);
    return;
  }
  if (command === "drop") {
    RIGHTCLICK_HARVEST_CONFIG.DROP_TO_INVENTORY = args[0] !== "ground";
    Logger.tell(source, `Harvest drops go to ${RIGHTCLICK_HARVEST_CONFIG.DROP_TO_INVENTORY ? "inventory" : "ground"}.`);
    return;
  }
  if (command === "hoe_only") {
    RIGHTCLICK_HARVEST_CONFIG.ALLOW_HOE_ONLY = args[0] === "on";
    Logger.tell(source, `Hoe-only harvest ${RIGHTCLICK_HARVEST_CONFIG.ALLOW_HOE_ONLY ? "enabled" : "disabled"}.`);
    return;
  }
  if (command === "debug") {
    RIGHTCLICK_HARVEST_CONFIG.DEBUG = args[0] === "on";
    Logger.setDebug(RIGHTCLICK_HARVEST_CONFIG.DEBUG);
    Logger.tell(source, `RightClick Harvest debug ${RIGHTCLICK_HARVEST_CONFIG.DEBUG ? "enabled" : "disabled"}.`);
    return;
  }
  Logger.tell(source, "Unknown RightClick Harvest command.");
}

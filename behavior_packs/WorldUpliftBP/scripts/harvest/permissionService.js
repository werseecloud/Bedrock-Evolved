import { RIGHTCLICK_HARVEST_CONFIG } from "../config.js";

export function canHarvest(player) {
  if (!RIGHTCLICK_HARVEST_CONFIG.REQUIRE_TAG_FOR_HARVEST) {
    return true;
  }
  try {
    return player.hasTag(RIGHTCLICK_HARVEST_CONFIG.REQUIRED_PLAYER_TAG);
  } catch (_error) {
    return false;
  }
}

export function canUseHarvestCommands(player) {
  try {
    return !player || player.playerPermissionLevel >= 1 || player.hasTag("admin") || player.hasTag("operator");
  } catch (_error) {
    return true;
  }
}


import { CONFIG } from "../config.js";

export function hasFeaturePermission(player, tagName) {
  if (!CONFIG.permissions.requireTags) {
    return true;
  }
  try {
    return player.hasTag(tagName);
  } catch (_error) {
    return false;
  }
}

export function canUseAdminCommand(player) {
  if (!player) {
    return true;
  }
  try {
    return player.playerPermissionLevel >= 1 || player.hasTag("admin") || player.hasTag(CONFIG.permissions.clumpsAdminTag);
  } catch (_error) {
    return true;
  }
}


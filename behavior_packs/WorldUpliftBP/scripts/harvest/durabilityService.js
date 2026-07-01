import { RIGHTCLICK_HARVEST_CONFIG } from "../config.js";
import { getInventoryContainer, getSelectedItem } from "./inventoryService.js";

export function damageHoeIfNeeded(player) {
  if (!RIGHTCLICK_HARVEST_CONFIG.DAMAGE_HOE_ON_HARVEST) {
    return;
  }
  const item = getSelectedItem(player);
  if (!item || !item.typeId.endsWith("_hoe")) {
    return;
  }
  try {
    const durability = item.getComponent("minecraft:durability");
    if (!durability) {
      return;
    }
    const max = durability.maxDurability ?? 0;
    durability.damage = Math.min(max, Number(durability.damage || 0) + RIGHTCLICK_HARVEST_CONFIG.HOE_DURABILITY_DAMAGE);
    const container = getInventoryContainer(player);
    container?.setItem(player.selectedSlotIndex || 0, item);
  } catch (_error) {
    // Hoe damage is optional.
  }
}

export function isAllowedHarvestTool(player) {
  const item = getSelectedItem(player);
  if (RIGHTCLICK_HARVEST_CONFIG.ALLOW_HOE_ONLY) {
    return Boolean(item && item.typeId.endsWith("_hoe"));
  }
  if (RIGHTCLICK_HARVEST_CONFIG.ALLOW_ANY_ITEM) {
    return true;
  }
  if (RIGHTCLICK_HARVEST_CONFIG.ALLOW_EMPTY_HAND) {
    return !item;
  }
  return Boolean(item);
}


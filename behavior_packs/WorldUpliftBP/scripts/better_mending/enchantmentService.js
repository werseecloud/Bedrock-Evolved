import { Logger } from "../utils/logger.js";

export function hasEnchantment(itemStack, enchantmentId) {
  try {
    const enchantable = itemStack?.getComponent("minecraft:enchantable");
    if (!enchantable) {
      return false;
    }
    const ids = [enchantmentId, `minecraft:${enchantmentId}`];
    for (const id of ids) {
      try {
        if (typeof enchantable.hasEnchantment === "function" && enchantable.hasEnchantment(id)) {
          return true;
        }
      } catch (_error) {
        // Try getEnchantment fallback.
      }
      try {
        if (typeof enchantable.getEnchantment === "function" && enchantable.getEnchantment(id)) {
          return true;
        }
      } catch (_error) {
        // Try next.
      }
    }
  } catch (error) {
    Logger.debug(`Enchantment read failed: ${error}`);
  }
  return false;
}


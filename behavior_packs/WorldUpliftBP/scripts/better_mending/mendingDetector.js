import { CONFIG } from "../config.js";
import { hasEnchantment } from "./enchantmentService.js";

export function passesMendingRequirement(itemStack) {
  if (!CONFIG.betterMending.requireMendingEnchant) {
    return true;
  }
  return hasEnchantment(itemStack, "mending");
}


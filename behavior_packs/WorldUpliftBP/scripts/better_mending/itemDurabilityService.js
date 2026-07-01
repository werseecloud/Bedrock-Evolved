import { Logger } from "../utils/logger.js";

export function getDurabilityInfo(itemStack) {
  try {
    const durability = itemStack?.getComponent("minecraft:durability");
    if (!durability) {
      return undefined;
    }
    const damage = Number(durability.damage || 0);
    const maxDurability = Number(durability.maxDurability || 0);
    return {
      damage,
      maxDurability,
      missingDurability: Math.max(0, damage),
      repairable: maxDurability > 0
    };
  } catch (error) {
    Logger.debug(`Durability read failed: ${error}`);
    return undefined;
  }
}

export function repairItem(itemStack, repairAmount) {
  try {
    const clone = itemStack.clone();
    const durability = clone.getComponent("minecraft:durability");
    if (!durability) {
      return undefined;
    }
    durability.damage = Math.max(0, Number(durability.damage || 0) - repairAmount);
    return clone;
  } catch (error) {
    Logger.debug(`Durability write failed: ${error}`);
    return undefined;
  }
}


import { ItemStack } from "@minecraft/server";
import { RIGHTCLICK_HARVEST_CONFIG } from "../config.js";
import { Logger } from "../utils/logger.js";

export function getInventoryContainer(player) {
  try {
    return player.getComponent("minecraft:inventory")?.container;
  } catch (error) {
    Logger.debug(`Inventory access failed for ${player.name}: ${error}`);
    return undefined;
  }
}

export function getSelectedItem(player) {
  const container = getInventoryContainer(player);
  if (!container) {
    return undefined;
  }
  try {
    return container.getItem(player.selectedSlotIndex || 0);
  } catch (_error) {
    return undefined;
  }
}

export function hasItem(player, itemId) {
  return findItemSlot(player, itemId) >= 0;
}

export function removeOneItem(player, itemId) {
  const container = getInventoryContainer(player);
  if (!container) {
    return false;
  }
  const slot = findItemSlot(player, itemId);
  if (slot < 0) {
    return false;
  }
  try {
    const stack = container.getItem(slot);
    if (!stack || stack.typeId !== itemId || stack.amount <= 0) {
      return false;
    }
    if (stack.amount === 1) {
      container.setItem(slot, undefined);
    } else {
      stack.amount -= 1;
      container.setItem(slot, stack);
    }
    return true;
  } catch (error) {
    Logger.debug(`Failed removing ${itemId}: ${error}`);
    return false;
  }
}

export function refundOneItem(player, itemId) {
  return addDrops(player, [{ itemId, amount: 1 }], player.dimension, player.location);
}

export function addDrops(player, drops, dimension, location) {
  const container = getInventoryContainer(player);
  let ok = true;
  for (const drop of drops) {
    if (!drop || drop.amount <= 0) {
      continue;
    }
    try {
      const stack = new ItemStack(drop.itemId, drop.amount);
      let leftover = stack;
      if (RIGHTCLICK_HARVEST_CONFIG.DROP_TO_INVENTORY && container) {
        leftover = container.addItem(stack);
      }
      if (leftover && RIGHTCLICK_HARVEST_CONFIG.DROP_OVERFLOW_ON_GROUND) {
        dimension.spawnItem(leftover, location);
      } else if (leftover) {
        ok = false;
      }
    } catch (error) {
      ok = false;
      Logger.debug(`Failed giving drop ${drop.itemId}: ${error}`);
      if (RIGHTCLICK_HARVEST_CONFIG.DROP_OVERFLOW_ON_GROUND) {
        try {
          dimension.spawnItem(new ItemStack(drop.itemId, drop.amount), location);
        } catch (_error) {
          // Nothing else safe to do.
        }
      }
    }
  }
  return ok;
}

export function consumeSelectedSlot(player, expectedTypeId) {
  const container = getInventoryContainer(player);
  if (!container) {
    return false;
  }
  try {
    const slot = player.selectedSlotIndex || 0;
    const stack = container.getItem(slot);
    if (!stack || stack.typeId !== expectedTypeId || stack.amount <= 0) {
      return false;
    }
    if (stack.amount === 1) {
      container.setItem(slot, undefined);
    } else {
      stack.amount -= 1;
      container.setItem(slot, stack);
    }
    return true;
  } catch (error) {
    Logger.debug(`Failed consuming selected slot: ${error}`);
    return false;
  }
}

function findItemSlot(player, itemId) {
  const container = getInventoryContainer(player);
  if (!container) {
    return -1;
  }
  try {
    for (let i = 0; i < container.size; i++) {
      const stack = container.getItem(i);
      if (stack && stack.typeId === itemId && stack.amount > 0) {
        return i;
      }
    }
  } catch (error) {
    Logger.debug(`Inventory search failed: ${error}`);
  }
  return -1;
}


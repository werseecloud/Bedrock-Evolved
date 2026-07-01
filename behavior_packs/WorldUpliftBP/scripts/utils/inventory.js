import { ItemStack } from "@minecraft/server";
import { Logger } from "./logger.js";

export function getInventoryContainer(player) {
  try {
    return player.getComponent("minecraft:inventory")?.container;
  } catch (error) {
    Logger.debug(`Inventory unavailable for ${player?.name}: ${error}`);
    return undefined;
  }
}

export function getSelectedSlotIndex(player) {
  return player.selectedSlotIndex || 0;
}

export function getSelectedItem(player) {
  try {
    return getInventoryContainer(player)?.getItem(getSelectedSlotIndex(player));
  } catch (_error) {
    return undefined;
  }
}

export function setSelectedItem(player, itemStack) {
  try {
    getInventoryContainer(player)?.setItem(getSelectedSlotIndex(player), itemStack);
    return true;
  } catch (error) {
    Logger.debug(`Failed setting selected item: ${error}`);
    return false;
  }
}

export function consumeSelectedItem(player, expectedTypeId, amount = 1) {
  const container = getInventoryContainer(player);
  if (!container) {
    return false;
  }
  try {
    const slot = getSelectedSlotIndex(player);
    const stack = container.getItem(slot);
    if (!stack || stack.typeId !== expectedTypeId || stack.amount < amount) {
      return false;
    }
    if (stack.amount === amount) {
      container.setItem(slot, undefined);
    } else {
      stack.amount -= amount;
      container.setItem(slot, stack);
    }
    return true;
  } catch (error) {
    Logger.debug(`Failed consuming selected item: ${error}`);
    return false;
  }
}

export function countItem(player, itemId, hotbarOnly = false) {
  const container = getInventoryContainer(player);
  if (!container) {
    return 0;
  }
  let total = 0;
  const max = hotbarOnly ? Math.min(9, container.size) : container.size;
  try {
    for (let i = 0; i < max; i++) {
      const stack = container.getItem(i);
      if (stack?.typeId === itemId) {
        total += stack.amount;
      }
    }
  } catch (_error) {
    return total;
  }
  return total;
}

export function removeItems(player, itemId, amount, hotbarFirst = true) {
  const container = getInventoryContainer(player);
  if (!container || amount <= 0) {
    return 0;
  }
  let remaining = amount;
  const ranges = hotbarFirst
    ? [[0, Math.min(9, container.size)], [Math.min(9, container.size), container.size]]
    : [[0, container.size]];
  try {
    for (const [start, end] of ranges) {
      for (let i = start; i < end && remaining > 0; i++) {
        const stack = container.getItem(i);
        if (!stack || stack.typeId !== itemId) {
          continue;
        }
        const take = Math.min(remaining, stack.amount);
        remaining -= take;
        if (stack.amount === take) {
          container.setItem(i, undefined);
        } else {
          stack.amount -= take;
          container.setItem(i, stack);
        }
      }
    }
  } catch (error) {
    Logger.debug(`Failed removing items ${itemId}: ${error}`);
  }
  return amount - remaining;
}

export function giveItem(player, itemId, amount) {
  try {
    const leftover = getInventoryContainer(player)?.addItem(new ItemStack(itemId, amount));
    if (leftover) {
      player.dimension.spawnItem(leftover, player.location);
    }
    return true;
  } catch (error) {
    Logger.debug(`Failed giving ${itemId}: ${error}`);
    return false;
  }
}


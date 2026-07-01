import { CONFIG } from "../config.js";
import { Logger } from "../utils/logger.js";
import { countItem, giveItem, removeItems, setSelectedItem } from "../utils/inventory.js";
import { getDurabilityInfo, repairItem } from "./itemDurabilityService.js";
import { calculateRepairPlan } from "./xpCostCalculator.js";

export function tryRepairHeldItem(player, itemStack) {
  const durability = getDurabilityInfo(itemStack);
  if (!durability?.repairable) {
    return { ok: false, reason: "not_repairable" };
  }
  if (durability.missingDurability <= 0) {
    return { ok: false, reason: "not_damaged" };
  }

  const xp = getPlayerXp(player);
  const plan = calculateRepairPlan(durability.missingDurability, xp);
  if (plan.repairAmount <= 0) {
    return tryBottleRepair(player, itemStack, durability);
  }

  if (!removePlayerXp(player, plan.xpCost)) {
    return tryBottleRepair(player, itemStack, durability);
  }

  const repaired = repairItem(itemStack, plan.repairAmount);
  if (!repaired || !setSelectedItem(player, repaired)) {
    refundXp(player, plan.xpCost);
    return { ok: false, reason: "repair_failed" };
  }

  return { ok: true, repairAmount: plan.repairAmount, xpCost: plan.xpCost, usedBottles: 0 };
}

function tryBottleRepair(player, itemStack, durability) {
  if (!CONFIG.betterMending.allowXpBottleFallback) {
    return { ok: false, reason: "no_xp" };
  }
  const bottleValue = Math.max(1, CONFIG.betterMending.xpBottleValue || 7);
  const bottles = countItem(player, CONFIG.betterMending.xpBottleItemId);
  if (bottles <= 0) {
    return { ok: false, reason: "no_xp" };
  }
  const maxRepairByBottles = bottles * bottleValue;
  const repairAmount = Math.min(durability.missingDurability, CONFIG.betterMending.maxRepairPerUse, maxRepairByBottles);
  const bottleCount = Math.ceil(repairAmount / bottleValue);
  const removed = removeItems(player, CONFIG.betterMending.xpBottleItemId, bottleCount, true);
  if (removed < bottleCount) {
    return { ok: false, reason: "no_xp" };
  }
  const repaired = repairItem(itemStack, repairAmount);
  if (!repaired || !setSelectedItem(player, repaired)) {
    giveItem(player, CONFIG.betterMending.xpBottleItemId, bottleCount);
    Logger.warn("XP bottle repair failed after consuming bottles; attempted bottle refund.");
    return { ok: false, reason: "repair_failed" };
  }
  return { ok: true, repairAmount, xpCost: bottleCount * bottleValue, usedBottles: bottleCount };
}

function getPlayerXp(player) {
  try {
    return Math.max(0, Number(player.getTotalXp()));
  } catch (_error) {
    return 0;
  }
}

function removePlayerXp(player, amount) {
  try {
    player.addExperience(-amount);
    return true;
  } catch (error) {
    Logger.debug(`XP removal failed: ${error}`);
    return false;
  }
}

function refundXp(player, amount) {
  try {
    player.addExperience(amount);
  } catch (_error) {
    // Best effort.
  }
}

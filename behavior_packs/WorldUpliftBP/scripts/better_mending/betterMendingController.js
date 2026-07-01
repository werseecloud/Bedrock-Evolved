import { system, world } from "@minecraft/server";
import { CONFIG } from "../config.js";
import { Logger } from "../utils/logger.js";
import { hasCooldown, setCooldown } from "../utils/cooldowns.js";
import { getSelectedItem } from "../utils/inventory.js";
import { hasFeaturePermission } from "../utils/permissions.js";
import { passesMendingRequirement } from "./mendingDetector.js";
import { tryRepairHeldItem } from "./repairService.js";
import { requestParticles } from "../performance/performanceManager.js";

let initialized = false;

export function initBetterMending() {
  if (initialized) {
    return;
  }
  initialized = true;
  subscribeUseEvents();
  Logger.info("Better Than Mending initialized.");
}

function subscribeUseEvents() {
  const handler = (event) => {
    const player = event.source || event.player;
    if (!player || player.typeId !== "minecraft:player") {
      return;
    }
    system.run(() => handleMendingUse(player));
  };
  try {
    world.afterEvents.itemUse?.subscribe(handler);
  } catch (_error) {
    // Optional event.
  }
  try {
    world.afterEvents.playerInteractWithBlock?.subscribe((event) => {
      if (event.isFirstEvent === false) {
        return;
      }
      system.run(() => handleMendingUse(event.player));
    });
  } catch (_error) {
    // Optional event.
  }
}

export function handleMendingUse(player) {
  if (!CONFIG.betterMending.enabled || !hasFeaturePermission(player, CONFIG.permissions.betterMendingTag)) {
    return;
  }
  if (CONFIG.betterMending.requireSneakToRepair && !player.isSneaking) {
    return;
  }
  const key = `mending:${player.id || player.name}`;
  if (hasCooldown(key, CONFIG.betterMending.cooldownTicks)) {
    return;
  }
  setCooldown(key);

  const item = getSelectedItem(player);
  if (!item) {
    return;
  }
  if (!passesMendingRequirement(item)) {
    actionbar(player, "This item needs Mending.");
    return;
  }
  const result = tryRepairHeldItem(player, item);
  if (!result.ok) {
    if (result.reason === "not_damaged") {
      actionbar(player, "This item is already fully repaired.");
    } else if (result.reason === "no_xp") {
      actionbar(player, "Not enough XP.");
    } else if (result.reason === "repair_failed") {
      actionbar(player, "This item cannot be repaired by script on this version.");
    }
    return;
  }
  actionbar(player, result.usedBottles > 0
    ? `Used ${result.usedBottles} XP bottles to repair +${result.repairAmount}.`
    : `Repaired +${result.repairAmount} durability for ${result.xpCost} XP.`);
  playEffects(player);
}

function actionbar(player, message) {
  if (!CONFIG.betterMending.useActionbar) {
    return;
  }
  try {
    player.onScreenDisplay.setActionBar(message);
  } catch (_error) {
    player.sendMessage(message);
  }
}

function playEffects(player) {
  if (CONFIG.betterMending.playSound) {
    try {
      player.playSound("random.orb", { volume: 0.35, pitch: 1.5 });
    } catch (_error) {
      // Best effort.
    }
  }
  if (CONFIG.betterMending.showParticles && requestParticles("better_mending", 1)) {
    try {
      player.dimension.spawnParticle("uplift:repair_sparkle", player.location);
    } catch (_error) {
      try {
        player.dimension.spawnParticle("minecraft:totem_particle", player.location);
      } catch (_fallbackError) {
        // Best effort.
      }
    }
  }
}

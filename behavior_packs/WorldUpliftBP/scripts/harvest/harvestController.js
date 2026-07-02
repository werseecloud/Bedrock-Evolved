import { system, world } from "@minecraft/server";
import { RIGHTCLICK_HARVEST_CONFIG } from "../config.js";
import { Logger } from "../utils/logger.js";
import { getSelectedItem } from "../utils/inventory.js";
import { detectCrop } from "./cropDetector.js";
import { calculateDrops } from "./dropCalculator.js";
import { damageHoeIfNeeded, isAllowedHarvestTool } from "./durabilityService.js";
import { actionbar, playHarvestEffects } from "./particleService.js";
import { canHarvest } from "./permissionService.js";
import { harvestAndReplant } from "./replantService.js";
import { isWorldEditAxeItem } from "../worldedit/worldEditTool.js";

const cooldowns = new Map();
let initialized = false;

export function initRightClickHarvest() {
  if (initialized) {
    return;
  }
  initialized = true;
  subscribeOptionalInteractEvents();
  system.runInterval(cleanCooldowns, 200);
  Logger.info("RightClick Harvest initialized.");
}

function subscribeOptionalInteractEvents() {
  try {
    if (world.beforeEvents?.playerInteractWithBlock?.subscribe) {
      world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
        if (!RIGHTCLICK_HARVEST_CONFIG.RIGHTCLICK_HARVEST_ENABLED || !canHarvest(event.player)) {
          return;
        }
        if (event.isFirstEvent === false && RIGHTCLICK_HARVEST_CONFIG.PREVENT_DUPLICATE_INTERACTION) {
          return;
        }
        if (isWorldEditAxeItem(event.itemStack || getSelectedItem(event.player))) {
          return;
        }
        const block = event.block;
        const cropInfo = block ? detectCrop(block) : undefined;
        if (!cropInfo?.definition || !cropInfo.mature) {
          return;
        }
        const location = copyBlockLocation(block);
        const dimensionId = getBlockDimensionId(block, event.player);
        event.cancel = true;
        system.run(() => runHarvest(event.player, location, dimensionId));
      });
      return;
    }
  } catch (error) {
    Logger.warn(`Before interact subscription failed: ${error}`);
  }

  try {
    if (world.afterEvents?.playerInteractWithBlock?.subscribe) {
      world.afterEvents.playerInteractWithBlock.subscribe((event) => {
        if (!RIGHTCLICK_HARVEST_CONFIG.RIGHTCLICK_HARVEST_ENABLED || !canHarvest(event.player)) {
          return;
        }
        if (event.isFirstEvent === false && RIGHTCLICK_HARVEST_CONFIG.PREVENT_DUPLICATE_INTERACTION) {
          return;
        }
        if (isWorldEditAxeItem(event.itemStack || getSelectedItem(event.player))) {
          return;
        }
        const location = copyBlockLocation(event.block);
        const dimensionId = getBlockDimensionId(event.block, event.player);
        system.run(() => runHarvest(event.player, location, dimensionId));
      });
    }
  } catch (error) {
    Logger.warn(`After interact subscription failed: ${error}`);
  }
}

function runHarvest(player, blockLocation, dimensionId) {
  if (!RIGHTCLICK_HARVEST_CONFIG.RIGHTCLICK_HARVEST_ENABLED) {
    actionbar(player, "RightClick Harvest is disabled.");
    return;
  }
  if (!canHarvest(player)) {
    return;
  }

  let dimension;
  let block;
  try {
    dimension = getDimensionSafe(dimensionId);
    block = dimension.getBlock(blockLocation);
  } catch (error) {
    Logger.debug(`Harvest block unavailable: ${error}`);
    return;
  }
  if (!block) {
    return;
  }

  const key = `${player.id || player.name}:${dimensionId}:${block.location.x},${block.location.y},${block.location.z}`;
  if (isCoolingDown(key)) {
    return;
  }

  const cropInfo = detectCrop(block);
  if (!cropInfo?.definition) {
    return;
  }
  if (cropInfo.unsupportedState) {
    return;
  }
  if (!cropInfo.mature) {
    actionbar(player, "This crop is not ready yet.");
    setCooldown(key);
    return;
  }
  if (!isAllowedHarvestTool(player)) {
    return;
  }

  const drops = calculateDrops(cropInfo.definition, player);
  const result = harvestAndReplant(player, block, cropInfo, drops);
  setCooldown(key);

  if (!result.ok) {
    if (result.reason === "need_seed") {
      actionbar(player, "You need seeds to replant.");
    }
    return;
  }

  damageHoeIfNeeded(player);
  playHarvestEffects(player, block);
  actionbar(player, "Harvested and replanted.");
}

function copyBlockLocation(block) {
  return {
    x: Math.floor(block.location.x),
    y: Math.floor(block.location.y),
    z: Math.floor(block.location.z)
  };
}

function getBlockDimensionId(block, player) {
  try {
    return block.dimension.id;
  } catch (_error) {
    return player?.dimension?.id || "overworld";
  }
}

function getDimensionSafe(dimensionId) {
  try {
    return world.getDimension(dimensionId);
  } catch (error) {
    if (String(dimensionId).includes(":")) {
      return world.getDimension(String(dimensionId).split(":").pop());
    }
    throw error;
  }
}

function isCoolingDown(key) {
  const lastTick = cooldowns.get(key) || -9999;
  return system.currentTick - lastTick < RIGHTCLICK_HARVEST_CONFIG.INTERACTION_COOLDOWN_TICKS;
}

function setCooldown(key) {
  cooldowns.set(key, system.currentTick);
}

function cleanCooldowns() {
  const cutoff = system.currentTick - 400;
  for (const [key, tick] of cooldowns) {
    if (tick < cutoff) {
      cooldowns.delete(key);
    }
  }
}

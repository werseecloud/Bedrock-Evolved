import { RIGHTCLICK_HARVEST_CONFIG } from "../config.js";
import { Logger } from "../utils/logger.js";
import { addDrops, hasItem, refundOneItem, removeOneItem } from "./inventoryService.js";

export function harvestAndReplant(player, block, cropInfo, drops) {
  const { definition, state } = cropInfo;
  const requireSeed = RIGHTCLICK_HARVEST_CONFIG.REQUIRE_SEED_TO_REPLANT && definition.requiresSeedInInventory;
  const consumeSeed = RIGHTCLICK_HARVEST_CONFIG.CONSUME_SEED_ON_REPLANT && definition.consumeSeedOnReplant;
  let seedRemoved = false;

  if (requireSeed && !hasItem(player, definition.requiredSeedItemId)) {
    return { ok: false, reason: "need_seed" };
  }

  if (consumeSeed) {
    seedRemoved = removeOneItem(player, definition.requiredSeedItemId);
    if (!seedRemoved) {
      return { ok: false, reason: "need_seed" };
    }
  }

  try {
    const replanted = block.permutation.withState(state.name, definition.replantedStateValue);
    if (typeof block.trySetPermutation === "function") {
      if (!block.trySetPermutation(replanted)) {
        throw new Error("trySetPermutation returned false");
      }
    } else {
      block.setPermutation(replanted);
    }
  } catch (error) {
    if (seedRemoved) {
      refundOneItem(player, definition.requiredSeedItemId);
    }
    Logger.warn(`Replant failed, harvest cancelled: ${error}`);
    return { ok: false, reason: "replant_failed" };
  }

  const dropLocation = {
    x: block.location.x + 0.5,
    y: block.location.y + 0.5,
    z: block.location.z + 0.5
  };
  addDrops(player, drops, block.dimension, dropLocation);
  return { ok: true };
}


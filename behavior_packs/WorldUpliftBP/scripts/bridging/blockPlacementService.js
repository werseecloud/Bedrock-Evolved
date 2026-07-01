import { BlockPermutation } from "@minecraft/server";
import { CONFIG } from "../config.js";
import { consumeSelectedItem } from "../utils/inventory.js";
import { Logger } from "../utils/logger.js";
import { hasSolidSupport, isAirOrReplaceable, isWithinDistance } from "./edgeDetector.js";

const UNSUPPORTED_ITEM_PARTS = [
  "door",
  "bed",
  "sign",
  "banner",
  "bucket",
  "torch",
  "button",
  "pressure_plate",
  "lever",
  "repeater",
  "comparator",
  "slab",
  "stairs",
  "fence",
  "gate"
];

export function canBridgeItem(itemStack) {
  if (!itemStack) {
    return false;
  }
  return !UNSUPPORTED_ITEM_PARTS.some((part) => itemStack.typeId.includes(part));
}

export function tryPlaceBridgeBlock(player, itemStack, location) {
  if (!canBridgeItem(itemStack)) {
    return { ok: false, reason: "unsupported" };
  }
  if (!isWithinDistance(player, location, CONFIG.bridging.maxPlacementDistance)) {
    return { ok: false, reason: "too_far" };
  }
  if (CONFIG.bridging.preventInsidePlayerPlacement && isInsidePlayer(player, location)) {
    return { ok: false, reason: "inside_player" };
  }

  let target;
  try {
    target = player.dimension.getBlock(location);
  } catch (_error) {
    return { ok: false, reason: "unloaded" };
  }
  if (!isAirOrReplaceable(target) || !hasSolidSupport(player.dimension, location)) {
    return { ok: false, reason: "blocked" };
  }

  let permutation;
  try {
    permutation = BlockPermutation.resolve(itemStack.typeId);
  } catch (error) {
    Logger.debug(`Cannot resolve bridge block ${itemStack.typeId}: ${error}`);
    return { ok: false, reason: "unsupported" };
  }

  try {
    if (typeof target.trySetPermutation === "function") {
      if (!target.trySetPermutation(permutation)) {
        return { ok: false, reason: "place_failed" };
      }
    } else {
      target.setPermutation(permutation);
    }
  } catch (error) {
    Logger.debug(`Bridge placement failed: ${error}`);
    return { ok: false, reason: "place_failed" };
  }

  if (!consumeSelectedItem(player, itemStack.typeId, 1)) {
    rollbackPlacement(target);
    return { ok: false, reason: "consume_failed" };
  }

  return { ok: true };
}

function rollbackPlacement(block) {
  try {
    block.setPermutation(BlockPermutation.resolve("minecraft:air"));
  } catch (_error) {
    // Best effort rollback.
  }
}

function isInsidePlayer(player, location) {
  const playerX = Math.floor(player.location.x);
  const playerY = Math.floor(player.location.y);
  const playerZ = Math.floor(player.location.z);
  return Math.floor(location.x) === playerX
    && Math.floor(location.z) === playerZ
    && (Math.floor(location.y) === playerY || Math.floor(location.y) === playerY + 1);
}

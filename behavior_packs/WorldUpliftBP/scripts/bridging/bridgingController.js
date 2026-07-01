import { system, world } from "@minecraft/server";
import { CONFIG } from "../config.js";
import { hasCooldown, setCooldown } from "../utils/cooldowns.js";
import { getSelectedItem } from "../utils/inventory.js";
import { Logger } from "../utils/logger.js";
import { hasFeaturePermission } from "../utils/permissions.js";
import { tryPlaceBridgeBlock } from "./blockPlacementService.js";
import { getBridgeCandidatePositions, isAirOrReplaceable, isWithinDistance } from "./edgeDetector.js";
import { showPreview } from "./placementPreviewService.js";

let initialized = false;

export function initBridging() {
  if (initialized) {
    return;
  }
  initialized = true;
  try {
    world.afterEvents.playerInteractWithBlock?.subscribe((event) => {
      if (event.isFirstEvent === false) {
        return;
      }
      const blockLocation = copyBlockLocation(event.block);
      const blockFace = event.blockFace;
      system.run(() => handleBridgeInteraction(event.player, { location: blockLocation }, blockFace));
    });
  } catch (error) {
    Logger.warn(`Bridging event subscription failed: ${error}`);
  }
  Logger.info("Bridging initialized.");
}

function copyBlockLocation(block) {
  return {
    x: Math.floor(block.location.x),
    y: Math.floor(block.location.y),
    z: Math.floor(block.location.z)
  };
}

function handleBridgeInteraction(player, block, blockFace) {
  if (!CONFIG.bridging.enabled || !hasFeaturePermission(player, CONFIG.permissions.bridgingTag)) {
    return;
  }
  if (CONFIG.bridging.requireSneakToDisable && player.isSneaking) {
    return;
  }
  if (player.isFlying) {
    return;
  }
  const key = `bridge:${player.id || player.name}`;
  if (hasCooldown(key, CONFIG.bridging.cooldownTicks)) {
    return;
  }
  const item = getSelectedItem(player);
  if (CONFIG.bridging.requireBlockInHand && !item) {
    return;
  }

  const candidates = getBridgeCandidatePositions(player, block, blockFace);
  for (const location of candidates) {
    if (!isWithinDistance(player, location, CONFIG.bridging.maxPlacementDistance)) {
      continue;
    }
    let target;
    try {
      target = player.dimension.getBlock(location);
    } catch (_error) {
      continue;
    }
    if (!isAirOrReplaceable(target)) {
      continue;
    }
    showPreview(player, location);
    const result = tryPlaceBridgeBlock(player, item, location);
    if (result.ok) {
      setCooldown(key);
      actionbar(player, "Block placed.");
      try {
        player.playSound("dig.stone", { volume: 0.35, pitch: 1.1 });
      } catch (_error) {
        // Best effort.
      }
      return;
    }
  }
}

function actionbar(player, message) {
  if (!CONFIG.bridging.useActionbar) {
    return;
  }
  try {
    player.onScreenDisplay.setActionBar(message);
  } catch (_error) {
    // Ignore.
  }
}

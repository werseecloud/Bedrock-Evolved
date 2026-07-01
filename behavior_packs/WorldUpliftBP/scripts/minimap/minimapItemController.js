import { ItemStack, world } from "@minecraft/server";
import { Logger } from "../utils/logger.js";
import { MINIMAP_UI_CONFIG } from "./minimapConfig.js";
import { showMinimapSettingsForm } from "./minimapSettingsForm.js";
import { openFullscreenMap } from "./minimapFullscreenController.js";
import { getMinimapState } from "./minimapUiState.js";

const FALLBACK_ITEM_ID = "minecraft:compass";
const FALLBACK_NAME = "Minimap Settings";
let initialized = false;

export function initMinimapItemController() {
  if (initialized) {
    return;
  }
  initialized = true;
  try {
    world.afterEvents.itemUse.subscribe((event) => {
      const player = event.source;
      if (!player || player.typeId !== "minecraft:player" || !isMinimapSettingsItem(event.itemStack)) {
        return;
      }
      const state = getMinimapState(player);
      if (player.isSneaking && state.minimapEnabled) {
        openFullscreenMap(player);
      } else {
        showMinimapSettingsForm(player);
      }
    });
  } catch (error) {
    Logger.warn(`Minimap item controller unavailable: ${error}`);
  }
}

export function giveMinimapSettingsItem(player) {
  let item;
  try {
    item = new ItemStack(MINIMAP_UI_CONFIG.itemId, 1);
  } catch (_error) {
    item = new ItemStack(FALLBACK_ITEM_ID, 1);
  }
  try {
    item.nameTag = FALLBACK_NAME;
  } catch (_error) {
    // Optional.
  }
  try {
    item.setLore(["Use to open minimap settings.", "Sneak + use opens fullscreen map."]);
  } catch (_error) {
    // Optional.
  }

  try {
    const container = player.getComponent("minecraft:inventory")?.container;
    const leftover = container?.addItem(item);
    if (leftover) player.dimension.spawnItem(leftover, player.location);
    return true;
  } catch (error) {
    Logger.debug(`Failed giving minimap item: ${error}`);
    return false;
  }
}

export function isMinimapSettingsItem(itemStack) {
  if (!itemStack) return false;
  if (itemStack.typeId === MINIMAP_UI_CONFIG.itemId) return true;
  try {
    return itemStack.typeId === FALLBACK_ITEM_ID && itemStack.nameTag === FALLBACK_NAME;
  } catch (_error) {
    return false;
  }
}

import { ItemStack, system, world } from "@minecraft/server";
import { Logger } from "../utils/logger.js";
import { showGuideHome } from "./guideUi.js";

const GUIDE_BOOK_NAME = "Bedrock Evolved Guide";
const GUIDE_SEEN_TAG = "wu_guide_seen";
const GUIDE_PROPERTY = "wu:guide_seen_v1";
const GUIDE_LORE = [
  "Use this book to open",
  "the World Uplift help menu.",
  "/scriptevent wu:guide"
];

const recentlyHandled = new Set();
let initialized = false;

export function initGuideBook() {
  if (initialized) {
    return;
  }
  initialized = true;
  world.afterEvents.playerSpawn.subscribe((event) => {
    if (!event.initialSpawn) {
      return;
    }
    system.runTimeout(() => ensureFirstJoinGuide(event.player), 40);
  });
  try {
    world.afterEvents.itemUse.subscribe((event) => {
      const player = event.source;
      if (!player || player.typeId !== "minecraft:player") {
        return;
      }
      if (isGuideBook(event.itemStack)) {
        showGuideHome(player);
      }
    });
  } catch (error) {
    Logger.warn(`Guide book item-use subscription failed: ${error}`);
  }
  Logger.info("World Uplift guide initialized.");
}

export function showGuideForPlayer(player) {
  giveGuideBook(player, false);
  showGuideHome(player);
}

export function resetGuideForPlayer(player) {
  try {
    player.setDynamicProperty(GUIDE_PROPERTY, false);
  } catch (_error) {
    // Tag fallback below.
  }
  try {
    player.removeTag(GUIDE_SEEN_TAG);
  } catch (_error) {
    // Optional.
  }
  recentlyHandled.delete(getPlayerKey(player));
}

function ensureFirstJoinGuide(player) {
  if (!player || hasSeenGuide(player)) {
    return;
  }
  const key = getPlayerKey(player);
  if (recentlyHandled.has(key)) {
    return;
  }
  recentlyHandled.add(key);
  markSeenGuide(player);
  giveGuideBook(player, true);
  showGuideHome(player);
}

function hasSeenGuide(player) {
  try {
    if (player.getDynamicProperty(GUIDE_PROPERTY) === true) {
      return true;
    }
  } catch (_error) {
    // Use tag fallback.
  }
  try {
    return player.hasTag(GUIDE_SEEN_TAG);
  } catch (_error) {
    return false;
  }
}

function markSeenGuide(player) {
  try {
    player.setDynamicProperty(GUIDE_PROPERTY, true);
  } catch (_error) {
    // Use tag fallback.
  }
  try {
    player.addTag(GUIDE_SEEN_TAG);
  } catch (_error) {
    // Best effort.
  }
}

export function giveGuideBook(player, onlyIfMissing = true) {
  if (onlyIfMissing && hasGuideBook(player)) {
    return true;
  }

  const book = createGuideBook();
  try {
    const container = player.getComponent("minecraft:inventory")?.container;
    const leftover = container?.addItem(book);
    if (leftover) {
      player.dimension.spawnItem(leftover, player.location);
    }
    try {
      player.onScreenDisplay.setActionBar("Bedrock Evolved Guide added.");
    } catch (_error) {
      // Optional.
    }
    return true;
  } catch (error) {
    Logger.warn(`Could not give guide book: ${error}`);
    return false;
  }
}

function hasGuideBook(player) {
  try {
    const container = player.getComponent("minecraft:inventory")?.container;
    if (!container) {
      return false;
    }
    for (let i = 0; i < container.size; i++) {
      if (isGuideBook(container.getItem(i))) {
        return true;
      }
    }
  } catch (_error) {
    return false;
  }
  return false;
}

function createGuideBook() {
  const book = new ItemStack("minecraft:book", 1);
  try {
    book.nameTag = GUIDE_BOOK_NAME;
  } catch (_error) {
    // Optional.
  }
  try {
    book.setLore(GUIDE_LORE);
  } catch (_error) {
    // Older API fallback: named normal book still works for detection.
  }
  return book;
}

function isGuideBook(itemStack) {
  if (!itemStack || itemStack.typeId !== "minecraft:book") {
    return false;
  }
  try {
    return itemStack.nameTag === GUIDE_BOOK_NAME;
  } catch (_error) {
    return false;
  }
}

function getPlayerKey(player) {
  return player.id || player.name || "unknown";
}

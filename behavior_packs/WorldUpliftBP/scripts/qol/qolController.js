import { ItemStack, system, world } from "@minecraft/server";
import { CONFIG } from "../config.js";
import { requestBlockOps, recordModuleError, shouldRunForPlayer } from "../performance/performanceManager.js";
import { getInventoryContainer, getSelectedItem, getSelectedSlotIndex } from "../utils/inventory.js";
import { Logger } from "../utils/logger.js";
import { floorVec, locationKey } from "../utils/vectors.js";
import { isWorldEditAxeItem } from "../worldedit/worldEditTool.js";

const hotbarTorchMemory = new Map();
const lastDeathLocations = new Map();
const deliveredDeathTicks = new Map();
const lastBiomeByPlayer = new Map();
const treeJobs = [];
let initialized = false;

const BIOME_NAMES = Object.freeze({
  "be:alpine_peaks": "Alpine Peaks",
  "be:alpine_foothills": "Alpine Foothills",
  "be:shattered_cliffs": "Shattered Cliffs",
  "be:deep_valleys": "Deep Valleys",
  "be:old_growth_highlands": "Old Growth Highlands",
  "be:highland_groves": "Highland Groves",
  "be:crater_lake": "Crater Lake",
  "be:coastal_cliffs": "Coastal Cliffs",
  "be:hot_springs": "Hot Springs",
  "be:forest_edge": "Forest Edge",
  "uplift:alpine_peaks": "Alpine Peaks",
  "uplift:shattered_cliffs": "Shattered Cliffs",
  "uplift:deep_valleys": "Deep Valleys",
  "uplift:old_growth_highlands": "Old Growth Highlands",
  "uplift:city_plains": "City Plains"
});

export function initQolController() {
  if (initialized) {
    return;
  }
  initialized = true;
  subscribeTreeCapitator();
  subscribeDeathCoordinates();
  system.runInterval(tickQolSystems, 1);
  Logger.info("QoL systems initialized.");
}

export function handleQolCommand(source, args) {
  const action = String(args[0] || "status").toLowerCase();
  if (action === "status") {
    return ok(source, formatQolStatus());
  }
  if (action === "quick_stack") {
    const player = requirePlayer(source);
    if (!player) {
      return fail(source, "Quick Stack needs an in-world player source.");
    }
    const moved = quickStackNearbyChests(player, true);
    return moved > 0 ? ok(player, `Quick Stack moved ${moved} stacks.`) : fail(player, "Quick Stack found no matching nearby chest items.");
  }
  if (action === "on" || action === "off") {
    const feature = String(args[1] || "all").toLowerCase();
    const enabled = action === "on";
    if (!setQolFeature(feature, enabled)) {
      return fail(source, "Unknown QoL feature. Use all, torches, trees, quick_stack, death_coords, or biomes.");
    }
    return ok(source, `QoL ${feature} ${enabled ? "enabled" : "disabled"}.`);
  }
  return fail(source, "Unknown QoL command. Use status, quick_stack, on <feature>, or off <feature>.");
}

function tickQolSystems() {
  processTreeJobs();

  for (const player of world.getPlayers()) {
    if (CONFIG.qol.autoTorchRefill.enabled && shouldRunForPlayer(player, "qol_torch_refill", CONFIG.qol.autoTorchRefill.scanIntervalTicks, 1)) {
      refillTorches(player);
    }
    if (CONFIG.qol.deathCoordinates.enabled && shouldRunForPlayer(player, "qol_death_coords", CONFIG.qol.deathCoordinates.trackIntervalTicks, 1)) {
      rememberDeathLocation(player);
    }
    if (CONFIG.qol.quickStack.enabled && shouldRunForPlayer(player, "qol_quick_stack", CONFIG.qol.quickStack.scanIntervalTicks, 1)) {
      quickStackNearbyChests(player, false);
    }
    if (CONFIG.qol.biomeEnterMessage.enabled && shouldRunForPlayer(player, "qol_biome_message", CONFIG.qol.biomeEnterMessage.scanIntervalTicks, 1)) {
      checkBiomeEnter(player);
    }
  }
}

function refillTorches(player) {
  const container = getInventoryContainer(player);
  if (!container) {
    return;
  }
  const key = getPlayerKey(player);
  const memory = hotbarTorchMemory.get(key) || {};
  const hotbarSize = Math.min(9, container.size);

  for (let slot = 0; slot < hotbarSize; slot++) {
    const item = safeGetItem(container, slot);
    if (item && isTorch(item.typeId)) {
      memory[slot] = item.typeId;
      continue;
    }
    if (item) {
      delete memory[slot];
      continue;
    }
    const previousTorch = memory[slot];
    if (!previousTorch) {
      continue;
    }
    const sourceSlot = findInventoryItemSlot(container, previousTorch, hotbarSize);
    if (sourceSlot < 0) {
      continue;
    }
    const replacement = safeGetItem(container, sourceSlot);
    if (!replacement) {
      continue;
    }
    try {
      container.setItem(slot, replacement);
      container.setItem(sourceSlot, undefined);
      actionbar(player, `Auto Torch Refill: ${formatItemName(previousTorch)} moved to hotbar.`);
    } catch (error) {
      recordModuleError("qol_torch_refill", error);
    }
  }

  hotbarTorchMemory.set(key, memory);
}

function subscribeTreeCapitator() {
  try {
    world.beforeEvents.playerBreakBlock?.subscribe((event) => {
      if (!CONFIG.qol.treeCapitator.enabled || !event.player?.isSneaking) {
        return;
      }
      const item = event.itemStack || getSelectedItem(event.player);
      if (!isAxe(item) || isWorldEditAxeItem(item) || !isLogBlock(event.block?.typeId)) {
        return;
      }
      event.cancel = true;
      const blockLocation = copyBlockLocation(event.block);
      const blockType = event.block.typeId;
      system.run(() => startTreeCapitatorJob(event.player, blockLocation, blockType));
    });
  } catch (error) {
    Logger.warn(`Tree Capitator hook failed: ${error}`);
  }
}

function startTreeCapitatorJob(player, origin, logType) {
  const logs = collectTreeLogs(player.dimension, origin, logType, CONFIG.qol.treeCapitator.maxLogs);
  if (logs.length === 0) {
    return;
  }
  const tool = getSelectedItem(player);
  treeJobs.push({
    playerKey: getPlayerKey(player),
    playerName: player.name,
    dimension: player.dimension,
    origin,
    logType,
    toolSlot: getSelectedSlotIndex(player),
    toolTypeId: tool?.typeId,
    logs,
    cursor: 0,
    broken: 0,
    errors: 0
  });
  actionbar(player, `Tree Capitator: queued ${logs.length} logs.`);
}

function processTreeJobs() {
  if (treeJobs.length === 0) {
    return;
  }
  const job = treeJobs[0];
  let processed = 0;
  while (processed < CONFIG.qol.treeCapitator.logsPerTick && job.cursor < job.logs.length) {
    if (!requestBlockOps("qol_tree_capitator", 1)) {
      return;
    }
    const location = job.logs[job.cursor++];
    processed++;
    try {
      const block = job.dimension.getBlock(location);
      if (!block || !isCompatibleLog(block.typeId, job.logType)) {
        continue;
      }
      block.setType("minecraft:air");
      job.broken++;
    } catch (error) {
      job.errors++;
      if (job.errors <= 3) {
        recordModuleError("qol_tree_capitator", error);
      }
    }
  }
  if (job.cursor < job.logs.length) {
    return;
  }
  treeJobs.shift();
  finishTreeJob(job);
}

function finishTreeJob(job) {
  const player = findOnlinePlayer(job.playerKey);
  if (job.broken > 0 && CONFIG.qol.treeCapitator.dropLogs) {
    spawnLogDrops(job.dimension, job.origin, job.logType, job.broken);
  }
  if (player) {
    damageAxeInSlot(player, job.toolSlot, job.toolTypeId, job.broken * CONFIG.qol.treeCapitator.durabilityCostPerLog);
    actionbar(player, `Tree Capitator: chopped ${job.broken} logs${job.errors ? `, errors=${job.errors}` : ""}.`);
  } else {
    Logger.info(`Tree Capitator finished for ${job.playerName}: chopped=${job.broken} errors=${job.errors}.`);
  }
}

function collectTreeLogs(dimension, origin, logType, maxLogs) {
  const found = [];
  const visited = new Set();
  const queue = [origin];
  const originY = origin.y;
  const maxHorizontalDistance = 7;
  const maxDown = 2;
  const maxUp = 36;

  while (queue.length > 0 && found.length < maxLogs) {
    const current = queue.shift();
    const key = locationKey(current);
    if (visited.has(key)) {
      continue;
    }
    visited.add(key);
    if (Math.abs(current.x - origin.x) > maxHorizontalDistance || Math.abs(current.z - origin.z) > maxHorizontalDistance) {
      continue;
    }
    if (current.y < originY - maxDown || current.y > originY + maxUp) {
      continue;
    }
    let block;
    try {
      block = dimension.getBlock(current);
    } catch (_error) {
      continue;
    }
    if (!block || !isCompatibleLog(block.typeId, logType)) {
      continue;
    }
    found.push({ ...current });
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) {
            continue;
          }
          queue.push({ x: current.x + x, y: current.y + y, z: current.z + z });
        }
      }
    }
  }
  return found;
}

function quickStackNearbyChests(player, announce = false) {
  const playerContainer = getInventoryContainer(player);
  if (!playerContainer) {
    return 0;
  }
  const nearbyContainers = findNearbyContainers(player);
  if (nearbyContainers.length === 0) {
    return 0;
  }

  let movedStacks = 0;
  const startSlot = CONFIG.qol.quickStack.includeHotbar ? 0 : Math.min(9, playerContainer.size);
  for (let slot = startSlot; slot < playerContainer.size && movedStacks < CONFIG.qol.quickStack.maxMovedStacksPerPass; slot++) {
    const item = safeGetItem(playerContainer, slot);
    if (!item || shouldSkipQuickStackItem(item)) {
      continue;
    }
    const target = nearbyContainers.find((container) => containerHasItem(container, item.typeId));
    if (!target) {
      continue;
    }
    try {
      const leftover = target.addItem(item);
      playerContainer.setItem(slot, leftover || undefined);
      movedStacks++;
    } catch (error) {
      recordModuleError("qol_quick_stack", error);
    }
  }

  if (movedStacks > 0) {
    actionbar(player, `Quick Stack: moved ${movedStacks} stacks to nearby storage.`);
  } else if (announce) {
    actionbar(player, "Quick Stack: no matching nearby chest items.");
  }
  return movedStacks;
}

function findNearbyContainers(player) {
  const containers = [];
  const center = floorVec(player.location);
  const radius = CONFIG.qol.quickStack.radius;
  const verticalRadius = CONFIG.qol.quickStack.verticalRadius;
  const ids = new Set(CONFIG.qol.quickStack.containerBlockIds);

  for (let y = center.y - verticalRadius; y <= center.y + verticalRadius; y++) {
    for (let x = center.x - radius; x <= center.x + radius; x++) {
      for (let z = center.z - radius; z <= center.z + radius; z++) {
        let block;
        try {
          block = player.dimension.getBlock({ x, y, z });
        } catch (_error) {
          continue;
        }
        if (!block || !ids.has(block.typeId)) {
          continue;
        }
        const container = getBlockContainer(block);
        if (container) {
          containers.push(container);
        }
      }
    }
  }
  return containers;
}

function subscribeDeathCoordinates() {
  try {
    world.afterEvents.entityDie?.subscribe((event) => {
      const entity = event.deadEntity;
      if (!CONFIG.qol.deathCoordinates.enabled || !entity || entity.typeId !== "minecraft:player") {
        return;
      }
      const previous = lastDeathLocations.get(getPlayerKey(entity));
      let location = previous?.location;
      let dimensionId = previous?.dimensionId || "unknown";
      try {
        location = floorVec(entity.location);
        dimensionId = entity.dimension?.id || dimensionId;
      } catch (_error) {
        // Dead player locations can be unavailable on some runtimes.
      }
      if (!location) {
        return;
      }
      rememberDeathLocation(entity, location, dimensionId);
      sendDeathCoordinates(entity, location, dimensionId);
    });
  } catch (error) {
    Logger.warn(`Death coordinates hook failed: ${error}`);
  }

  try {
    world.afterEvents.playerSpawn?.subscribe((event) => {
      if (!CONFIG.qol.deathCoordinates.enabled || event.initialSpawn) {
        return;
      }
      const key = getPlayerKey(event.player);
      const last = lastDeathLocations.get(key);
      if (!last || deliveredDeathTicks.get(key) === last.tick) {
        return;
      }
      sendDeathCoordinates(event.player, last.location, last.dimensionId, "Last death");
    });
  } catch (error) {
    Logger.warn(`Death respawn fallback hook failed: ${error}`);
  }
}

function rememberDeathLocation(player, location = floorVec(player.location), dimensionId = player.dimension?.id || "unknown") {
  lastDeathLocations.set(getPlayerKey(player), {
    location,
    dimensionId,
    tick: system.currentTick
  });
}

function sendDeathCoordinates(player, location, dimensionId, label = "You died") {
  const key = getPlayerKey(player);
  deliveredDeathTicks.set(key, system.currentTick);
  Logger.tell(player, `${label} at ${location.x}, ${location.y}, ${location.z} in ${dimensionId}.`);
}

function checkBiomeEnter(player) {
  const biomeId = getBiomeId(player);
  if (!biomeId || !BIOME_NAMES[biomeId]) {
    return;
  }
  const key = getPlayerKey(player);
  if (lastBiomeByPlayer.get(key) === biomeId) {
    return;
  }
  lastBiomeByPlayer.set(key, biomeId);
  Logger.tell(player, `Entering ${BIOME_NAMES[biomeId]}.`);
}

function getBiomeId(player) {
  const location = floorVec(player.location);
  const dimension = player.dimension;
  try {
    if (typeof dimension.getBiome === "function") {
      const biome = dimension.getBiome(location);
      return normalizeBiomeId(biome);
    }
  } catch (_error) {
    // Try block fallback below.
  }
  try {
    const block = dimension.getBlock(location);
    if (typeof block?.getBiome === "function") {
      return normalizeBiomeId(block.getBiome());
    }
    return normalizeBiomeId(block?.biome);
  } catch (_error) {
    return undefined;
  }
}

function normalizeBiomeId(value) {
  if (!value) {
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  return value.id || value.typeId || value.identifier;
}

function formatQolStatus() {
  return [
    `torches=${CONFIG.qol.autoTorchRefill.enabled}`,
    `trees=${CONFIG.qol.treeCapitator.enabled}`,
    `quickStack=${CONFIG.qol.quickStack.enabled}`,
    `deathCoords=${CONFIG.qol.deathCoordinates.enabled}`,
    `biomes=${CONFIG.qol.biomeEnterMessage.enabled}`
  ].join(" ");
}

function setQolFeature(feature, enabled) {
  if (feature === "all") {
    CONFIG.qol.autoTorchRefill.enabled = enabled;
    CONFIG.qol.treeCapitator.enabled = enabled;
    CONFIG.qol.quickStack.enabled = enabled;
    CONFIG.qol.deathCoordinates.enabled = enabled;
    CONFIG.qol.biomeEnterMessage.enabled = enabled;
    return true;
  }
  if (feature === "torches" || feature === "torch" || feature === "auto_torch") {
    CONFIG.qol.autoTorchRefill.enabled = enabled;
    return true;
  }
  if (feature === "trees" || feature === "tree" || feature === "tree_capitator") {
    CONFIG.qol.treeCapitator.enabled = enabled;
    return true;
  }
  if (feature === "quick_stack" || feature === "quickstack" || feature === "stack") {
    CONFIG.qol.quickStack.enabled = enabled;
    return true;
  }
  if (feature === "death_coords" || feature === "death" || feature === "coords") {
    CONFIG.qol.deathCoordinates.enabled = enabled;
    return true;
  }
  if (feature === "biomes" || feature === "biome") {
    CONFIG.qol.biomeEnterMessage.enabled = enabled;
    return true;
  }
  return false;
}

function damageAxeInSlot(player, slot, expectedTypeId, amount) {
  if (amount <= 0) {
    return;
  }
  const container = getInventoryContainer(player);
  const item = container ? safeGetItem(container, slot) : undefined;
  if (!isAxe(item) || isWorldEditAxeItem(item) || item.typeId !== expectedTypeId) {
    return;
  }
  try {
    const durability = item.getComponent("minecraft:durability");
    if (!durability) {
      return;
    }
    const max = Number(durability.maxDurability || 0);
    durability.damage = Number(durability.damage || 0) + amount;
    if (max > 0 && durability.damage >= max) {
      container.setItem(slot, undefined);
      actionbar(player, "Tree Capitator broke your axe.");
      return;
    }
    container.setItem(slot, item);
  } catch (error) {
    recordModuleError("qol_tree_capitator", error);
  }
}

function spawnLogDrops(dimension, origin, typeId, amount) {
  let remaining = amount;
  while (remaining > 0) {
    const stackSize = Math.min(64, remaining);
    remaining -= stackSize;
    try {
      dimension.spawnItem(new ItemStack(typeId, stackSize), {
        x: origin.x + 0.5,
        y: origin.y + 0.5,
        z: origin.z + 0.5
      });
    } catch (error) {
      recordModuleError("qol_tree_capitator", error);
      return;
    }
  }
}

function getBlockContainer(block) {
  try {
    return block.getComponent("minecraft:inventory")?.container ||
      block.getComponent("inventory")?.container;
  } catch (_error) {
    return undefined;
  }
}

function containerHasItem(container, typeId) {
  try {
    for (let i = 0; i < container.size; i++) {
      if (container.getItem(i)?.typeId === typeId) {
        return true;
      }
    }
  } catch (_error) {
    return false;
  }
  return false;
}

function safeGetItem(container, slot) {
  try {
    return container.getItem(slot);
  } catch (_error) {
    return undefined;
  }
}

function findInventoryItemSlot(container, typeId, startSlot) {
  try {
    for (let slot = startSlot; slot < container.size; slot++) {
      const item = container.getItem(slot);
      if (item?.typeId === typeId) {
        return slot;
      }
    }
  } catch (_error) {
    return -1;
  }
  return -1;
}

function isTorch(typeId) {
  return CONFIG.qol.autoTorchRefill.torchIds.includes(typeId);
}

function isAxe(itemStack) {
  return Boolean(itemStack?.typeId && itemStack.typeId.endsWith("_axe"));
}

function isLogBlock(typeId) {
  return typeof typeId === "string" &&
    (typeId.endsWith("_log") || typeId.endsWith("_stem") || typeId.endsWith("_hyphae") || typeId.includes("stripped_"));
}

function isCompatibleLog(typeId, originTypeId) {
  return typeId === originTypeId || (isLogBlock(typeId) && getWoodFamily(typeId) === getWoodFamily(originTypeId));
}

function getWoodFamily(typeId) {
  return String(typeId || "")
    .replace("minecraft:", "")
    .replace("stripped_", "")
    .replace("_log", "")
    .replace("_wood", "")
    .replace("_stem", "")
    .replace("_hyphae", "");
}

function shouldSkipQuickStackItem(item) {
  const id = item.typeId || "";
  return id.endsWith("_axe") ||
    id.endsWith("_pickaxe") ||
    id.endsWith("_shovel") ||
    id.endsWith("_sword") ||
    id.endsWith("_hoe") ||
    id.includes("shulker_box") ||
    id.includes("bundle");
}

function copyBlockLocation(block) {
  return {
    x: Math.floor(block.location.x),
    y: Math.floor(block.location.y),
    z: Math.floor(block.location.z)
  };
}

function findOnlinePlayer(playerKey) {
  for (const player of world.getPlayers()) {
    if (getPlayerKey(player) === playerKey) {
      return player;
    }
  }
  return undefined;
}

function getPlayerKey(player) {
  return player?.id || player?.name || "unknown";
}

function requirePlayer(source) {
  if (source && source.typeId === "minecraft:player") {
    return source;
  }
  return undefined;
}

function ok(target, message) {
  Logger.tell(target, `Gelukt: ${message}`);
  return { ok: true, message };
}

function fail(target, message) {
  Logger.tell(target, `Niet gelukt: ${message}`);
  return { ok: false, message };
}

function formatItemName(typeId) {
  return String(typeId || "item").replace("minecraft:", "").replace(/_/g, " ");
}

function actionbar(player, message) {
  try {
    player.onScreenDisplay.setActionBar(message);
  } catch (_error) {
    try {
      player.sendMessage(message);
    } catch (__error) {
      // Ignore.
    }
  }
}

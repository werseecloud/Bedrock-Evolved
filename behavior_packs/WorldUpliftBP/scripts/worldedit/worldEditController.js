import { ItemStack, system, world } from "@minecraft/server";
import { CONFIG } from "../config.js";
import { requestBlockOps, recordModuleError } from "../performance/performanceManager.js";
import { getInventoryContainer, getSelectedItem } from "../utils/inventory.js";
import { Logger } from "../utils/logger.js";
import { canUseAdminCommand } from "../utils/permissions.js";
import { floorVec } from "../utils/vectors.js";
import { isWorldEditAxeItem } from "./worldEditTool.js";

const selections = new Map();
const undoStacks = new Map();
const jobs = [];
let initialized = false;
let nextJobId = 1;

export function initWorldEditController() {
  if (initialized) {
    return;
  }
  initialized = true;
  subscribeSelectionEvents();
  system.runInterval(processWorldEditJobs, 1);
  Logger.info("WorldEdit tools initialized.");
}

export function handleWorldEditCommand(source, args) {
  const player = requirePlayer(source);
  if (!player) {
    return fail(source, "WorldEdit commands need an in-world player source.");
  }
  if (!CONFIG.worldEdit.enabled) {
    return fail(player, "WorldEdit is disabled.");
  }
  if (!canEdit(player)) {
    return fail(player, "You need operator/admin permission to use WorldEdit.");
  }

  const action = normalizeAction(args[0] || "help");
  if (action === "help") {
    return help(player);
  }
  if (action === "wand" || action === "axe") {
    return giveWorldEditAxe(player);
  }
  if (action === "pos1" || action === "1") {
    return setPositionCommand(player, 1, args.slice(1));
  }
  if (action === "pos2" || action === "2") {
    return setPositionCommand(player, 2, args.slice(1));
  }
  if (action === "desel" || action === "deselect" || action === "clearselection") {
    selections.delete(getPlayerKey(player));
    return ok(player, "WorldEdit selection cleared.");
  }
  if (action === "sel" || action === "selection" || action === "size" || action === "status") {
    return showSelection(player);
  }
  if (action === "set" || action === "fill") {
    return queueEditFromSelection(player, {
      mode: "set",
      blockType: normalizeBlockType(args[1])
    });
  }
  if (action === "clear" || action === "air") {
    return queueEditFromSelection(player, {
      mode: "set",
      blockType: "minecraft:air"
    });
  }
  if (action === "replace") {
    return queueEditFromSelection(player, {
      mode: "replace",
      replaceType: normalizeBlockType(args[1]),
      blockType: normalizeBlockType(args[2])
    });
  }
  if (action === "walls" || action === "wall") {
    return queueEditFromSelection(player, {
      mode: "walls",
      blockType: normalizeBlockType(args[1])
    });
  }
  if (action === "outline" || action === "faces") {
    return queueEditFromSelection(player, {
      mode: "outline",
      blockType: normalizeBlockType(args[1])
    });
  }
  if (action === "undo") {
    return queueUndo(player);
  }

  return fail(player, "Unknown WorldEdit command. Use wand, pos1, pos2, set, replace, walls, outline, clear, undo, size, or help.");
}

function subscribeSelectionEvents() {
  try {
    world.beforeEvents.playerBreakBlock?.subscribe((event) => {
      if (!CONFIG.worldEdit.enabled || !isWorldEditAxeItem(getSelectedItem(event.player))) {
        return;
      }
      if (!canEdit(event.player)) {
        return;
      }
      event.cancel = true;
      const location = copyBlockLocation(event.block);
      system.run(() => setSelectionPoint(event.player, 1, location, event.player.dimension.id, true));
    });
  } catch (error) {
    Logger.warn(`WorldEdit break selection hook failed: ${error}`);
  }

  let beforeInteractSubscribed = false;
  try {
    if (world.beforeEvents.playerInteractWithBlock?.subscribe) {
      world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
        if (event.isFirstEvent === false || !CONFIG.worldEdit.enabled || !isWorldEditAxeItem(event.itemStack || getSelectedItem(event.player))) {
          return;
        }
        if (!canEdit(event.player)) {
          return;
        }
        event.cancel = true;
        const location = copyBlockLocation(event.block);
        system.run(() => setSelectionPoint(event.player, 2, location, event.player.dimension.id, true));
      });
      beforeInteractSubscribed = true;
    }
  } catch (error) {
    Logger.warn(`WorldEdit before-interact selection hook failed: ${error}`);
  }

  if (beforeInteractSubscribed) {
    return;
  }

  try {
    world.afterEvents.playerInteractWithBlock?.subscribe((event) => {
      if (event.isFirstEvent === false || !CONFIG.worldEdit.enabled || !isWorldEditAxeItem(event.itemStack || getSelectedItem(event.player))) {
        return;
      }
      if (!canEdit(event.player)) {
        return;
      }
      const location = copyBlockLocation(event.block);
      system.run(() => setSelectionPoint(event.player, 2, location, event.player.dimension.id, true));
    });
  } catch (error) {
    Logger.warn(`WorldEdit interact selection hook failed: ${error}`);
  }
}

function giveWorldEditAxe(player) {
  try {
    const axe = new ItemStack(CONFIG.worldEdit.axeItemId, 1);
    axe.nameTag = CONFIG.worldEdit.axeName;
    try {
      axe.setLore([
        "Break block: pos1",
        "Use on block: pos2",
        "/scriptevent worldedit:set stone"
      ]);
    } catch (_error) {
      // Lore is cosmetic only.
    }
    const container = getInventoryContainer(player);
    if (!container) {
      return fail(player, "Could not access your inventory for the WorldEdit Axe.");
    }
    const leftover = container.addItem(axe);
    if (leftover) {
      player.dimension.spawnItem(leftover, player.location);
    }
    return ok(player, "WorldEdit Axe given. Break a block for pos1, use on a block for pos2.");
  } catch (error) {
    recordModuleError("worldedit", error);
    return fail(player, `Could not give WorldEdit Axe: ${error}`);
  }
}

function setPositionCommand(player, index, args) {
  const explicit = parseLocationArgs(args);
  const location = explicit || floorVec({
    x: player.location.x,
    y: player.location.y - 1,
    z: player.location.z
  });
  return setSelectionPoint(player, index, location, player.dimension.id, true);
}

function setSelectionPoint(player, index, location, dimensionId, announce = false) {
  const key = getPlayerKey(player);
  const selection = selections.get(key) || {};
  selection.dimensionId = dimensionId || player.dimension.id;
  selection[`pos${index}`] = {
    x: Math.floor(location.x),
    y: Math.floor(location.y),
    z: Math.floor(location.z)
  };
  selections.set(key, selection);
  showSelectionParticle(player.dimension, selection[`pos${index}`]);
  if (announce) {
    const pos = selection[`pos${index}`];
    return ok(player, `WorldEdit pos${index} set to ${pos.x}, ${pos.y}, ${pos.z}. ${formatSelectionSize(selection)}`);
  }
  return { ok: true };
}

function showSelection(player) {
  const selection = selections.get(getPlayerKey(player));
  if (!selection?.pos1 || !selection?.pos2) {
    return fail(player, "WorldEdit selection incomplete. Set pos1 and pos2 first.");
  }
  return ok(player, `WorldEdit selection ${formatLocation(selection.pos1)} -> ${formatLocation(selection.pos2)}. ${formatSelectionSize(selection)}`);
}

function queueEditFromSelection(player, options) {
  const selection = selections.get(getPlayerKey(player));
  if (!selection?.pos1 || !selection?.pos2) {
    return fail(player, "WorldEdit selection incomplete. Set pos1 and pos2 first.");
  }
  if (selection.dimensionId !== player.dimension.id) {
    return fail(player, "WorldEdit selection is in another dimension.");
  }
  if (!options.blockType) {
    return fail(player, "Missing block type. Example: /scriptevent worldedit:set stone");
  }
  if (options.mode === "replace" && !options.replaceType) {
    return fail(player, "Missing replace source block. Example: /scriptevent worldedit:replace dirt stone");
  }

  const bounds = makeBounds(selection.pos1, selection.pos2);
  const volume = getVolume(bounds);
  if (volume > CONFIG.worldEdit.maxBlocksPerCommand) {
    return fail(player, `Selection is too large (${volume} blocks). Limit is ${CONFIG.worldEdit.maxBlocksPerCommand}.`);
  }
  if (volume > CONFIG.worldEdit.maxUndoBlocks) {
    return fail(player, `Selection is too large for undo snapshot (${volume} blocks). Limit is ${CONFIG.worldEdit.maxUndoBlocks}.`);
  }

  const job = {
    id: nextJobId++,
    kind: "edit",
    playerKey: getPlayerKey(player),
    playerName: player.name,
    dimensionId: player.dimension.id,
    dimension: player.dimension,
    bounds,
    total: volume,
    cursor: 0,
    changed: 0,
    skipped: 0,
    errors: 0,
    snapshot: [],
    mode: options.mode,
    blockType: options.blockType,
    replaceType: options.replaceType
  };
  jobs.push(job);
  return ok(player, `WorldEdit queued ${options.mode} job #${job.id} over ${volume} blocks.`);
}

function queueUndo(player) {
  const stack = undoStacks.get(getPlayerKey(player)) || [];
  const snapshot = stack.pop();
  if (!snapshot || !snapshot.blocks.length) {
    return fail(player, "Nothing to undo.");
  }
  const dimension = getDimensionSafe(snapshot.dimensionId, player.dimension);
  const job = {
    id: nextJobId++,
    kind: "undo",
    playerKey: getPlayerKey(player),
    playerName: player.name,
    dimensionId: snapshot.dimensionId,
    dimension,
    blocks: snapshot.blocks,
    total: snapshot.blocks.length,
    cursor: 0,
    changed: 0,
    skipped: 0,
    errors: 0
  };
  jobs.push(job);
  return ok(player, `WorldEdit queued undo job #${job.id} for ${job.total} blocks.`);
}

function processWorldEditJobs() {
  let ops = 0;
  while (jobs.length > 0 && ops < CONFIG.worldEdit.blocksPerTick) {
    if (!requestBlockOps("worldedit", 1)) {
      return;
    }
    const job = jobs[0];
    const done = job.kind === "undo" ? processUndoStep(job) : processEditStep(job);
    ops++;
    if (done) {
      jobs.shift();
      finishJob(job);
    }
  }
}

function processEditStep(job) {
  if (job.cursor >= job.total) {
    return true;
  }
  const location = locationAt(job.bounds, job.cursor);
  job.cursor++;

  if (!shouldTouchLocation(job, location)) {
    job.skipped++;
    return job.cursor >= job.total;
  }

  try {
    const block = job.dimension.getBlock(location);
    if (!block) {
      job.skipped++;
      return job.cursor >= job.total;
    }
    if (job.mode === "replace" && block.typeId !== job.replaceType) {
      job.skipped++;
      return job.cursor >= job.total;
    }
    if (block.typeId === job.blockType) {
      job.skipped++;
      return job.cursor >= job.total;
    }
    job.snapshot.push({
      location,
      blockType: block.typeId
    });
    block.setType(job.blockType);
    job.changed++;
  } catch (error) {
    job.errors++;
    if (job.errors <= 3) {
      recordModuleError("worldedit", error);
    }
  }
  return job.cursor >= job.total;
}

function processUndoStep(job) {
  if (job.cursor >= job.total) {
    return true;
  }
  const entry = job.blocks[job.cursor];
  job.cursor++;
  try {
    const block = job.dimension.getBlock(entry.location);
    if (!block) {
      job.skipped++;
      return job.cursor >= job.total;
    }
    block.setType(entry.blockType);
    job.changed++;
  } catch (error) {
    job.errors++;
    if (job.errors <= 3) {
      recordModuleError("worldedit", error);
    }
  }
  return job.cursor >= job.total;
}

function finishJob(job) {
  if (job.kind === "edit" && job.snapshot.length > 0) {
    const stack = undoStacks.get(job.playerKey) || [];
    stack.push({
      dimensionId: job.dimensionId,
      blocks: job.snapshot
    });
    while (stack.length > 8) {
      stack.shift();
    }
    undoStacks.set(job.playerKey, stack);
  }

  const player = findOnlinePlayer(job.playerKey);
  const summary = `WorldEdit job #${job.id} finished: changed=${job.changed}, skipped=${job.skipped}, errors=${job.errors}.`;
  if (player) {
    if (job.errors > 0) {
      fail(player, summary);
    } else {
      ok(player, summary);
    }
  } else {
    Logger.info(summary);
  }
}

function shouldTouchLocation(job, location) {
  if (job.mode === "walls") {
    return location.x === job.bounds.min.x || location.x === job.bounds.max.x || location.z === job.bounds.min.z || location.z === job.bounds.max.z;
  }
  if (job.mode === "outline") {
    return location.x === job.bounds.min.x ||
      location.x === job.bounds.max.x ||
      location.y === job.bounds.min.y ||
      location.y === job.bounds.max.y ||
      location.z === job.bounds.min.z ||
      location.z === job.bounds.max.z;
  }
  return true;
}

function help(player) {
  return ok(player, [
    "WorldEdit commands:",
    "/scriptevent worldedit:wand",
    "/scriptevent worldedit:pos1",
    "/scriptevent worldedit:pos2",
    "/scriptevent worldedit:set stone",
    "/scriptevent worldedit:replace dirt stone",
    "/scriptevent worldedit:walls oak_planks",
    "/scriptevent worldedit:outline glass",
    "/scriptevent worldedit:clear",
    "/scriptevent worldedit:undo"
  ].join(" "));
}

function normalizeAction(value) {
  return String(value || "").toLowerCase().replace(/^\/+/, "");
}

function normalizeBlockType(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  if (text === "0") {
    return "minecraft:air";
  }
  if (text.includes(":")) {
    return text;
  }
  return `minecraft:${text}`;
}

function parseLocationArgs(args) {
  if (!args || args.length < 3) {
    return undefined;
  }
  const x = Number(args[0]);
  const y = Number(args[1]);
  const z = Number(args[2]);
  if (![x, y, z].every(Number.isFinite)) {
    return undefined;
  }
  return {
    x: Math.floor(x),
    y: Math.floor(y),
    z: Math.floor(z)
  };
}

function copyBlockLocation(block) {
  return {
    x: Math.floor(block.location.x),
    y: Math.floor(block.location.y),
    z: Math.floor(block.location.z)
  };
}

function makeBounds(a, b) {
  return {
    min: {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      z: Math.min(a.z, b.z)
    },
    max: {
      x: Math.max(a.x, b.x),
      y: Math.max(a.y, b.y),
      z: Math.max(a.z, b.z)
    }
  };
}

function getVolume(bounds) {
  return (bounds.max.x - bounds.min.x + 1) *
    (bounds.max.y - bounds.min.y + 1) *
    (bounds.max.z - bounds.min.z + 1);
}

function locationAt(bounds, index) {
  const xSize = bounds.max.x - bounds.min.x + 1;
  const zSize = bounds.max.z - bounds.min.z + 1;
  const layerSize = xSize * zSize;
  const y = bounds.min.y + Math.floor(index / layerSize);
  const layerIndex = index % layerSize;
  const z = bounds.min.z + Math.floor(layerIndex / xSize);
  const x = bounds.min.x + (layerIndex % xSize);
  return { x, y, z };
}

function formatSelectionSize(selection) {
  if (!selection?.pos1 || !selection?.pos2) {
    return "Selection incomplete.";
  }
  const bounds = makeBounds(selection.pos1, selection.pos2);
  return `Size=${bounds.max.x - bounds.min.x + 1}x${bounds.max.y - bounds.min.y + 1}x${bounds.max.z - bounds.min.z + 1} (${getVolume(bounds)} blocks).`;
}

function formatLocation(location) {
  return `${location.x}, ${location.y}, ${location.z}`;
}

function showSelectionParticle(dimension, location) {
  if (!CONFIG.worldEdit.showParticles) {
    return;
  }
  try {
    dimension.spawnParticle("minecraft:basic_crit_particle", {
      x: location.x + 0.5,
      y: location.y + 0.7,
      z: location.z + 0.5
    });
  } catch (_error) {
    // Best effort only.
  }
}

function canEdit(player) {
  return !CONFIG.worldEdit.requireAdmin || canUseAdminCommand(player);
}

function getDimensionSafe(dimensionId, fallback) {
  try {
    return world.getDimension(dimensionId);
  } catch (_error) {
    try {
      return world.getDimension(String(dimensionId || "").split(":").pop());
    } catch (__error) {
      return fallback;
    }
  }
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

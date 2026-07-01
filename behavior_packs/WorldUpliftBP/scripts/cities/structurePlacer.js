import { system, world } from "@minecraft/server";
import { MutableConfig, SAFE_OVERWRITE_BLOCKS } from "../config.js";
import { Logger } from "../utils/logger.js";

const placementQueue = [];
const missingStructures = new Set();
let initialized = false;

export function initStructurePlacer() {
  if (initialized) {
    return;
  }
  initialized = true;
  system.runInterval(processPlacementQueue, 1);
}

export function enqueueStructure(task) {
  placementQueue.push({
    kind: "structure",
    ...task
  });
}

export function enqueueSetBlock(dimension, location, blockType, options = {}) {
  placementQueue.push({
    kind: "block",
    dimension,
    location: {
      x: Math.floor(location.x),
      y: Math.floor(location.y),
      z: Math.floor(location.z)
    },
    blockType,
    force: Boolean(options.force)
  });
}

export function enqueueFillBox(dimension, from, to, blockType, options = {}) {
  const min = {
    x: Math.min(from.x, to.x),
    y: Math.min(from.y, to.y),
    z: Math.min(from.z, to.z)
  };
  const max = {
    x: Math.max(from.x, to.x),
    y: Math.max(from.y, to.y),
    z: Math.max(from.z, to.z)
  };

  for (let y = min.y; y <= max.y; y++) {
    for (let x = min.x; x <= max.x; x++) {
      for (let z = min.z; z <= max.z; z++) {
        enqueueSetBlock(dimension, { x, y, z }, blockType, options);
      }
    }
  }
}

export function queueSimplePlatform(dimension, center, radius, blockType) {
  const y = Math.floor(center.y);
  for (let x = -radius; x <= radius; x++) {
    for (let z = -radius; z <= radius; z++) {
      if (Math.abs(x) + Math.abs(z) <= radius + 1) {
        enqueueSetBlock(dimension, { x: center.x + x, y, z: center.z + z }, blockType);
      }
    }
  }
}

export function processPlacementQueue() {
  let blockOps = 0;
  let structures = 0;

  while (placementQueue.length > 0) {
    const task = placementQueue[0];

    if (task.kind === "block") {
      if (blockOps >= MutableConfig.MAX_BLOCK_OPS_PER_TICK) {
        return;
      }
      placementQueue.shift();
      blockOps++;
      placeBlockTask(task);
      continue;
    }

    if (task.kind === "structure") {
      if (structures >= MutableConfig.STRUCTURE_PLACEMENT_BATCH_SIZE) {
        return;
      }
      placementQueue.shift();
      structures++;
      placeStructureTask(task);
      continue;
    }

    placementQueue.shift();
  }
}

function placeBlockTask(task) {
  try {
    const block = task.dimension.getBlock(task.location);
    if (!block) {
      return;
    }
    if (!task.force && !canOverwriteBlock(block)) {
      return;
    }
    block.setType(task.blockType);
  } catch (error) {
    Logger.debug(`Block placement skipped at ${formatLocation(task.location)}: ${error}`);
  }
}

function placeStructureTask(task) {
  const { dimension, location, identifier, size, fallback } = task;

  try {
    if (size && !isAreaBuildSafe(dimension, location, size)) {
      Logger.debug(`Skipped ${identifier}; area contains non-natural blocks near ${formatLocation(location)}.`);
      return;
    }

    if (!structureExists(identifier)) {
      if (!missingStructures.has(identifier)) {
        missingStructures.add(identifier);
        Logger.warn(`Missing pack structure ${identifier}; using fallback if provided.`);
      }
      if (typeof fallback === "function") {
        fallback();
      }
      return;
    }

    world.structureManager.place(identifier, dimension, location, {
      includeBlocks: true,
      includeEntities: true,
      waterlogged: false
    });
    Logger.debug(`Queued structure ${identifier} at ${formatLocation(location)}.`);
  } catch (error) {
    Logger.warn(`Structure ${identifier} failed at ${formatLocation(location)}: ${error}`);
    if (typeof fallback === "function") {
      fallback();
    }
  }
}

export function structureExists(identifier) {
  try {
    if (!world.structureManager || typeof world.structureManager.getPackStructureIds !== "function") {
      return false;
    }
    return world.structureManager.getPackStructureIds().includes(identifier);
  } catch (_error) {
    return false;
  }
}

export function canOverwriteBlock(block) {
  try {
    if (block.isAir || block.isLiquid) {
      return true;
    }
    return SAFE_OVERWRITE_BLOCKS.has(block.typeId);
  } catch (_error) {
    return false;
  }
}

export function isAreaBuildSafe(dimension, origin, size) {
  const checks = [];
  const sx = Math.max(1, Math.floor(size.x / 3));
  const sz = Math.max(1, Math.floor(size.z / 3));
  const sy = Math.max(1, Math.floor(size.y / 2));

  for (let x = 0; x < size.x; x += sx) {
    for (let z = 0; z < size.z; z += sz) {
      for (let y = 0; y < size.y; y += sy) {
        checks.push({
          x: Math.floor(origin.x + x),
          y: Math.floor(origin.y + y),
          z: Math.floor(origin.z + z)
        });
      }
    }
  }

  for (const location of checks) {
    try {
      const block = dimension.getBlock(location);
      if (block && !canOverwriteBlock(block)) {
        return false;
      }
    } catch (_error) {
      return false;
    }
  }
  return true;
}

export function queueFallbackBuilding(dimension, origin, size, floorBlock, wallBlock, roofBlock) {
  const x0 = Math.floor(origin.x);
  const y0 = Math.floor(origin.y);
  const z0 = Math.floor(origin.z);
  const x1 = x0 + Math.max(2, size.x - 1);
  const z1 = z0 + Math.max(2, size.z - 1);
  const wallTop = y0 + Math.max(2, Math.min(size.y - 2, 5));
  const roofY = wallTop + 1;

  enqueueFillBox(dimension, { x: x0, y: y0, z: z0 }, { x: x1, y: y0, z: z1 }, floorBlock);
  enqueueFillBox(dimension, { x: x0, y: y0 + 1, z: z0 }, { x: x1, y: wallTop, z: z0 }, wallBlock);
  enqueueFillBox(dimension, { x: x0, y: y0 + 1, z: z1 }, { x: x1, y: wallTop, z: z1 }, wallBlock);
  enqueueFillBox(dimension, { x: x0, y: y0 + 1, z: z0 }, { x: x0, y: wallTop, z: z1 }, wallBlock);
  enqueueFillBox(dimension, { x: x1, y: y0 + 1, z: z0 }, { x: x1, y: wallTop, z: z1 }, wallBlock);
  enqueueFillBox(dimension, { x: x0, y: roofY, z: z0 }, { x: x1, y: roofY, z: z1 }, roofBlock);

  const doorX = Math.floor((x0 + x1) / 2);
  enqueueSetBlock(dimension, { x: doorX, y: y0 + 1, z: z0 }, "minecraft:air", { force: true });
  enqueueSetBlock(dimension, { x: doorX, y: y0 + 2, z: z0 }, "minecraft:air", { force: true });
}

function formatLocation(location) {
  return `${Math.floor(location.x)} ${Math.floor(location.y)} ${Math.floor(location.z)}`;
}


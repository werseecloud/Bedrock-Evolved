import {
  enqueueSetBlock,
  enqueueStructure,
  queueSimplePlatform
} from "../../cities/structurePlacer.js";
import { canPlaceTerrainStructure, canUseTerrainBlockOp } from "../terrainBudget.js";
import { canOverwriteTerrainBlock, getBlockSafe } from "./blockSafety.js";

export function queueTerrainBlock(dimension, location, blockType, options = {}) {
  if (!canUseTerrainBlockOp()) {
    return false;
  }
  const block = getBlockSafe(dimension, location);
  if (!options.force && !canOverwriteTerrainBlock(block)) {
    return false;
  }
  enqueueSetBlock(dimension, location, blockType, options);
  return true;
}

export function queueTerrainPlatform(dimension, center, radius, blockType) {
  let queued = 0;
  for (let x = -radius; x <= radius; x++) {
    for (let z = -radius; z <= radius; z++) {
      if (Math.abs(x) + Math.abs(z) <= radius + 1 && queueTerrainBlock(dimension, { x: center.x + x, y: center.y, z: center.z + z }, blockType)) {
        queued++;
      }
    }
  }
  if (queued === 0) {
    queueSimplePlatform(dimension, center, Math.min(radius, 2), blockType);
  }
  return queued;
}

export function queueTerrainStructure(dimension, location, identifier, size, fallback) {
  if (!canPlaceTerrainStructure()) {
    return false;
  }
  enqueueStructure({
    dimension,
    location,
    identifier,
    size,
    fallback
  });
  return true;
}

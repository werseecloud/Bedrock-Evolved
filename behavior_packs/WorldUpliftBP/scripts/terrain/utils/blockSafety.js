import { TERRAIN_CONFIG } from "../terrainConfig.js";

const SAFE_BLOCKS = new Set(TERRAIN_CONFIG.safety.safeOverwriteBlocks);
const NEVER_BLOCKS = new Set(TERRAIN_CONFIG.safety.neverOverwriteBlocks);

export function isNeverOverwriteBlock(block) {
  try {
    return block ? NEVER_BLOCKS.has(block.typeId) : false;
  } catch (_error) {
    return true;
  }
}

export function canOverwriteTerrainBlock(block) {
  try {
    if (!block) {
      return false;
    }
    if (isNeverOverwriteBlock(block)) {
      return false;
    }
    if (block.isAir || block.isLiquid) {
      return true;
    }
    return SAFE_BLOCKS.has(block.typeId);
  } catch (_error) {
    return false;
  }
}

export function isNaturalSurfaceBlock(block) {
  try {
    if (!block) {
      return false;
    }
    return SAFE_BLOCKS.has(block.typeId) || block.typeId.includes("stone") || block.typeId.includes("dirt");
  } catch (_error) {
    return false;
  }
}

export function getBlockSafe(dimension, location) {
  try {
    return dimension.getBlock({
      x: Math.floor(location.x),
      y: Math.floor(location.y),
      z: Math.floor(location.z)
    });
  } catch (_error) {
    return undefined;
  }
}

export function findSurfaceY(dimension, x, z, startY = 220, minY = -48) {
  for (let y = Math.floor(startY); y >= minY; y--) {
    const block = getBlockSafe(dimension, { x, y, z });
    if (!block) {
      continue;
    }
    if (!block.isAir && !block.isLiquid && isNaturalSurfaceBlock(block)) {
      return y + 1;
    }
  }
  return undefined;
}

export function hasPlayerBuildNearby(dimension, center, radius = 5) {
  if (!TERRAIN_CONFIG.safety.avoidPlayerBuilds) {
    return false;
  }
  const y = Math.floor(center.y);
  for (let dx = -radius; dx <= radius; dx += Math.max(1, Math.floor(radius / 2))) {
    for (let dz = -radius; dz <= radius; dz += Math.max(1, Math.floor(radius / 2))) {
      for (let dy = -1; dy <= 3; dy += 2) {
        const block = getBlockSafe(dimension, { x: center.x + dx, y: y + dy, z: center.z + dz });
        if (block && !canOverwriteTerrainBlock(block) && !isNaturalSurfaceBlock(block)) {
          return true;
        }
      }
    }
  }
  return false;
}

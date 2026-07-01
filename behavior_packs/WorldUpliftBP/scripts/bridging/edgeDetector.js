import { CONFIG } from "../config.js";
import { yawToForward, rightFromForward } from "../utils/vectors.js";

const FACE_OFFSETS = {
  Up: { x: 0, y: 1, z: 0 },
  Down: { x: 0, y: -1, z: 0 },
  North: { x: 0, y: 0, z: -1 },
  South: { x: 0, y: 0, z: 1 },
  East: { x: 1, y: 0, z: 0 },
  West: { x: -1, y: 0, z: 0 }
};

export function getBridgeCandidatePositions(player, eventBlock, blockFace) {
  const candidates = [];
  const faceOffset = FACE_OFFSETS[String(blockFace || "")];
  if (faceOffset) {
    candidates.push(add(eventBlock.location, faceOffset));
  }

  const rotation = getRotationSafe(player);
  const forward = yawToForward(rotation.y);
  const right = rightFromForward(forward);
  const roundedForward = {
    x: Math.round(forward.x),
    y: 0,
    z: Math.round(forward.z)
  };
  const roundedRight = {
    x: Math.round(right.x),
    y: 0,
    z: Math.round(right.z)
  };

  if (CONFIG.bridging.allowDownwardEdgePlacement) {
    const belowPlayer = {
      x: Math.floor(player.location.x),
      y: Math.floor(player.location.y) - 1,
      z: Math.floor(player.location.z)
    };
    candidates.push(add(belowPlayer, roundedForward));
    candidates.push({ x: belowPlayer.x, y: belowPlayer.y - 1, z: belowPlayer.z });
  }

  if (CONFIG.bridging.allowHorizontalBridging) {
    candidates.push(add(eventBlock.location, roundedForward));
    candidates.push(add(eventBlock.location, { x: -roundedForward.x, y: 0, z: -roundedForward.z }));
  }

  if (CONFIG.bridging.allowDiagonalEdgePlacement) {
    candidates.push(add(add(eventBlock.location, roundedForward), roundedRight));
    candidates.push(add(add(eventBlock.location, roundedForward), { x: -roundedRight.x, y: 0, z: -roundedRight.z }));
  }

  return uniquePositions(candidates);
}

export function isAirOrReplaceable(block) {
  try {
    return block && (block.isAir || block.typeId === "minecraft:water" || block.typeId === "minecraft:tallgrass" || block.typeId === "minecraft:snow");
  } catch (_error) {
    return false;
  }
}

export function hasSolidSupport(dimension, location) {
  const offsets = [
    { x: 0, y: -1, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 }
  ];
  for (const offset of offsets) {
    try {
      const neighbor = dimension.getBlock(add(location, offset));
      if (neighbor && !neighbor.isAir && !neighbor.isLiquid) {
        return true;
      }
    } catch (_error) {
      return false;
    }
  }
  return false;
}

export function isWithinDistance(player, location, maxDistance) {
  const dx = location.x + 0.5 - player.location.x;
  const dy = location.y + 0.5 - player.location.y;
  const dz = location.z + 0.5 - player.location.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) <= maxDistance;
}

function add(a, b) {
  return {
    x: Math.floor(a.x + b.x),
    y: Math.floor(a.y + b.y),
    z: Math.floor(a.z + b.z)
  };
}

function uniquePositions(positions) {
  const seen = new Set();
  const result = [];
  for (const position of positions) {
    const key = `${position.x},${position.y},${position.z}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(position);
    }
  }
  return result;
}

function getRotationSafe(player) {
  try {
    return player.getRotation();
  } catch (_error) {
    return { x: 0, y: 0 };
  }
}


import { CAMERA_CONSTANTS } from "../config.js";
import { clamp } from "../utils/math.js";
import {
  dot2D,
  horizontalLength,
  normalize2D,
  rightFromForward,
  subtract,
  yawToForward
} from "../utils/vectors.js";

export function analyzeMovement(player, state) {
  const current = {
    x: player.location.x,
    y: player.location.y,
    z: player.location.z
  };
  const previous = state.previousLocation || current;
  const delta = subtract(current, previous);
  const horizontalSpeed = horizontalLength(delta);
  const verticalSpeed = delta.y;
  const rotation = getRotationSafe(player);
  const onGround = Boolean(readBoolean(player, "isOnGround", true));
  const isSneaking = Boolean(readBoolean(player, "isSneaking", false));
  const isSwimming = Boolean(readBoolean(player, "isSwimming", false) || readBoolean(player, "isInWater", false));
  const isFlying = Boolean(readBoolean(player, "isFlying", false) || readBoolean(player, "isGliding", false));
  const isJumping = Boolean(readBoolean(player, "isJumping", false));
  const isRiding = isRidingSafe(player);
  const sprintProperty = readBoolean(player, "isSprinting", undefined);
  const isSprinting = sprintProperty === undefined
    ? horizontalSpeed >= CAMERA_CONSTANTS.sprintSpeedThreshold
    : Boolean(sprintProperty) || horizontalSpeed >= CAMERA_CONSTANTS.sprintSpeedThreshold * 1.15;

  updateFallEstimate(current, onGround, state);

  const movementDir = normalize2D(delta);
  const forward = yawToForward(rotation.y);
  const right = rightFromForward(forward);
  const forwardAmount = dot2D(movementDir, forward);
  const sideAmount = dot2D(movementDir, right);
  const strafeAmount = horizontalSpeed > CAMERA_CONSTANTS.walkingSpeedThreshold ? clamp(sideAmount, -1, 1) : 0;

  const wasFalling = !state.previousOnGround && state.fallDistance > CAMERA_CONSTANTS.landingMinFallDistance;
  const landing = onGround && !state.previousOnGround && wasFalling;
  const landingStrength = landing ? clamp(state.fallDistance / 8, 0, 1) : 0;

  const movement = {
    location: current,
    delta,
    horizontalSpeed,
    verticalSpeed,
    isOnGround: onGround,
    isSneaking,
    isSprinting,
    isSwimming,
    isFlying,
    isRiding,
    isJumping: isJumping || verticalSpeed > 0.08,
    isFalling: !onGround && verticalSpeed < -0.03,
    landing,
    landingStrength,
    fallDistance: state.fallDistance,
    strafeAmount,
    forwardAmount,
    stateName: getMovementStateName({
      horizontalSpeed,
      isSneaking,
      isSprinting,
      isSwimming,
      isFlying,
      isRiding,
      isJumping,
      onGround,
      verticalSpeed,
      landing,
      strafeAmount
    })
  };

  state.previousLocation = current;
  state.previousOnGround = onGround;
  return movement;
}

function updateFallEstimate(current, onGround, state) {
  if (!onGround) {
    if (state.fallStartY === undefined || current.y > state.fallStartY) {
      state.fallStartY = current.y;
    }
    state.fallDistance = Math.max(0, (state.fallStartY || current.y) - current.y);
    return;
  }

  if (!state.previousOnGround) {
    state.fallDistance = Math.max(0, (state.fallStartY || current.y) - current.y);
  } else {
    state.fallDistance = 0;
  }
  state.fallStartY = undefined;
}

function getMovementStateName(input) {
  if (input.isRiding) {
    return "riding";
  }
  if (input.isFlying) {
    return "flying";
  }
  if (input.isSwimming) {
    return "swimming";
  }
  if (input.landing) {
    return "landing";
  }
  if (input.isSneaking) {
    return "sneaking";
  }
  if (!input.onGround && input.verticalSpeed < -0.03) {
    return "falling";
  }
  if (!input.onGround || input.isJumping) {
    return "jumping";
  }
  if (input.horizontalSpeed < CAMERA_CONSTANTS.walkingSpeedThreshold) {
    return "idle";
  }
  if (input.strafeAmount < -0.35) {
    return "strafing_left";
  }
  if (input.strafeAmount > 0.35) {
    return "strafing_right";
  }
  if (input.isSprinting) {
    return "sprinting";
  }
  return "walking";
}

function getRotationSafe(player) {
  try {
    return player.getRotation();
  } catch (_error) {
    return { x: 0, y: 0 };
  }
}

function readBoolean(player, propertyName, fallback) {
  try {
    const value = player[propertyName];
    return typeof value === "boolean" ? value : fallback;
  } catch (_error) {
    return fallback;
  }
}

function isRidingSafe(player) {
  try {
    const riding = player.getComponent("minecraft:riding");
    return Boolean(riding);
  } catch (_error) {
    return false;
  }
}


import { CAMERA_CONSTANTS, SAFETY_LIMITS } from "../config.js";
import { clamp, lerp, smoothstep } from "../utils/math.js";

export function computeCameraEffects(movement, profile, settings, state) {
  const intensity = clamp(settings.intensity ?? 1, 0, 2);
  const specialMode = movement.isSwimming || movement.isRiding || movement.isFlying;
  const movementScale = specialMode ? 0.15 : smoothstep(0.02, 0.22, movement.horizontalSpeed);

  if (movement.horizontalSpeed > CAMERA_CONSTANTS.walkingSpeedThreshold && movement.isOnGround) {
    state.movementTime += Math.max(0.35, movement.horizontalSpeed * 10);
  } else {
    state.movementTime = lerp(state.movementTime, 0, 0.12);
  }

  const rawSway = Math.sin(state.movementTime * 0.95) * profile.swayIntensity * intensity * movementScale;
  const rawStrafe = movement.strafeAmount * profile.strafeTiltIntensity * intensity * movementScale;
  const rawLanding = movement.landing
    ? movement.landingStrength * profile.landingBounceIntensity * intensity
    : 0;

  const sway = clamp(rawSway, -SAFETY_LIMITS.maxSwayOffset, SAFETY_LIMITS.maxSwayOffset);
  const strafe = clamp(rawStrafe, -SAFETY_LIMITS.maxTiltDegrees, SAFETY_LIMITS.maxTiltDegrees);
  const landing = clamp(rawLanding, 0, SAFETY_LIMITS.maxLandingBounce);

  const crouchDip = movement.isSneaking ? -0.04 * intensity : 0;
  const jumpEase = movement.isJumping && !movement.isFalling ? 0.025 * intensity : 0;

  state.lastComputed = {
    sway,
    strafe,
    landing
  };

  return {
    sway,
    strafe,
    landing,
    crouchDip,
    jumpEase,
    shouldShakeMovement: Math.abs(sway) > 0.02 || Math.abs(strafe) > 0.12,
    shouldShakeLanding: landing > 0.02
  };
}

import { CONFIG } from "../config.js";

export function showPreview(player, location) {
  if (!CONFIG.bridging.debugPreview) {
    return;
  }
  try {
    player.dimension.spawnParticle("minecraft:basic_crit_particle", {
      x: location.x + 0.5,
      y: location.y + 0.5,
      z: location.z + 0.5
    });
  } catch (_error) {
    // Preview is optional.
  }
}


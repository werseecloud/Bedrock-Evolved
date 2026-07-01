import { RIGHTCLICK_HARVEST_CONFIG } from "../config.js";
import { requestParticles } from "../performance/performanceManager.js";

export function playHarvestEffects(player, block) {
  const location = {
    x: block.location.x + 0.5,
    y: block.location.y + 0.6,
    z: block.location.z + 0.5
  };
  if (RIGHTCLICK_HARVEST_CONFIG.ENABLE_PARTICLES && requestParticles("rightclick_harvest", 1)) {
    try {
      block.dimension.spawnParticle("minecraft:crop_growth_emitter", location);
    } catch (_error) {
      try {
        block.dimension.spawnParticle("minecraft:basic_smoke_particle", location);
      } catch (__error) {
        // Best effort only.
      }
    }
  }
  if (RIGHTCLICK_HARVEST_CONFIG.ENABLE_SOUNDS) {
    try {
      player.playSound("dig.grass", { location, volume: 0.45, pitch: 1.2 });
    } catch (_error) {
      // Best effort only.
    }
  }
}

export function actionbar(player, message) {
  if (!RIGHTCLICK_HARVEST_CONFIG.ENABLE_ACTIONBAR_MESSAGES) {
    return;
  }
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

import { system } from "@minecraft/server";
import { TERRAIN_CONFIG } from "./terrainConfig.js";
import { requestParticles } from "../performance/performanceManager.js";

const lastMessageTick = new Map();

export function runValleyFogPass(player, forced = false) {
  if (!forced && (!TERRAIN_CONFIG.enabled || !TERRAIN_CONFIG.valleyFog.enabled)) {
    return 0;
  }
  if (!isOverworld(player)) {
    return 0;
  }
  if (player.location.y > 58 && !forced) {
    return 0;
  }

  try {
    player.onScreenDisplay.setActionBar("Mist gathers in the deep valley...");
  } catch (_error) {
    // Optional.
  }
  try {
    if (requestParticles("terrain_valley_fog", 1)) {
      player.dimension.spawnParticle("minecraft:basic_smoke_particle", {
        x: player.location.x,
        y: player.location.y + 1.2,
        z: player.location.z
      });
    }
  } catch (_error) {
    // Optional.
  }
  const key = player.id || player.name;
  if (TERRAIN_CONFIG.debug && system.currentTick - (lastMessageTick.get(key) || 0) > 200) {
    lastMessageTick.set(key, system.currentTick);
    player.sendMessage("[WorldUplift] Deep valley fog ambience active.");
  }
  return 1;
}

function isOverworld(player) {
  return player?.dimension?.id === "minecraft:overworld";
}

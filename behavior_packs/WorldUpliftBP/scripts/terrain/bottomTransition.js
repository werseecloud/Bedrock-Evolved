import { system, world } from "@minecraft/server";
import { MutableConfig, getEffectiveDeepY, setDeepTransitionEnabled } from "../config.js";
import { Logger } from "../utils/logger.js";
import { floorVec } from "../utils/vectors.js";
import { enqueueStructure, queueSimplePlatform } from "../cities/structurePlacer.js";

const DEEP_MESSAGE = "The world cracks open beneath you\u2026";
const warningTicks = new Map();
const transitionCooldown = new Map();
let initialized = false;

export function initBottomTransition() {
  if (initialized) {
    return;
  }
  initialized = true;
  system.runInterval(checkPlayers, MutableConfig.PLAYER_SCAN_INTERVAL_TICKS);
}

export function setBottomTransitionEnabled(enabled) {
  setDeepTransitionEnabled(enabled);
}

function checkPlayers() {
  if (!MutableConfig.BOTTOM_TRANSITION_ENABLED) {
    return;
  }

  for (const player of world.getPlayers()) {
    try {
      if (!isOverworld(player.dimension)) {
        continue;
      }
      const deepY = getEffectiveDeepY(player.dimension);
      const location = player.location;
      const key = player.name;
      if (location.y < deepY + 16) {
        warnPlayer(player, key);
      }
      if (location.y <= deepY) {
        transitionPlayer(player, key);
      }
    } catch (error) {
      Logger.debug(`Bottom transition check skipped: ${error}`);
    }
  }
}

function warnPlayer(player, key) {
  const last = warningTicks.get(key) || -9999;
  if (system.currentTick - last < 80) {
    return;
  }
  warningTicks.set(key, system.currentTick);
  try {
    player.addEffect("blindness", 60, { amplifier: 0, showParticles: false });
  } catch (_error) {
    // Effect may be unavailable on older builds.
  }
  try {
    player.dimension.spawnParticle("minecraft:large_explosion", player.location);
  } catch (_error) {
    // Particles are best-effort.
  }
  Logger.tell(player, DEEP_MESSAGE);
}

function transitionPlayer(player, key) {
  const last = transitionCooldown.get(key) || -9999;
  if (system.currentTick - last < 120) {
    return;
  }
  transitionCooldown.set(key, system.currentTick);

  const from = floorVec(player.location);
  enqueueStructure({
    identifier: "nether_transition:deep_crack",
    dimension: player.dimension,
    location: { x: from.x - 4, y: from.y, z: from.z - 4 },
    size: { x: 9, y: 4, z: 9 },
    fallback: () => queueSimplePlatform(player.dimension, { x: from.x, y: from.y, z: from.z }, 4, "minecraft:deepslate")
  });

  const nether = getDimensionSafe("minecraft:nether") || getDimensionSafe("nether");
  if (!nether) {
    Logger.tell(player, "Nether dimension unavailable.");
    return;
  }

  const target = {
    x: Math.floor(from.x * MutableConfig.COORDINATE_SCALE),
    y: MutableConfig.NETHER_TARGET_Y,
    z: Math.floor(from.z * MutableConfig.COORDINATE_SCALE)
  };

  queueSimplePlatform(nether, { x: target.x, y: target.y - 1, z: target.z }, 3, "minecraft:basalt");
  enqueueStructure({
    identifier: "nether_transition:basalt_gateway",
    dimension: nether,
    location: { x: target.x - 4, y: target.y, z: target.z - 4 },
    size: { x: 9, y: 7, z: 9 },
    fallback: () => queueSimplePlatform(nether, { x: target.x, y: target.y, z: target.z }, 4, "minecraft:blackstone")
  });

  try {
    player.addEffect("darkness", 80, { amplifier: 0, showParticles: false });
  } catch (_error) {
    // Some stable builds do not expose darkness through scripts.
  }

  try {
    player.teleport(target, { dimension: nether, checkForBlocks: false });
  } catch (_error) {
    try {
      player.teleport(target, { dimension: nether });
    } catch (error) {
      Logger.tell(player, `Deep transition failed: ${error}`);
      return;
    }
  }

  try {
    nether.spawnParticle("minecraft:large_explosion", target);
  } catch (_error) {
    // Best-effort atmosphere.
  }
  Logger.tell(player, DEEP_MESSAGE);
}

function isOverworld(dimension) {
  try {
    return dimension.id === "minecraft:overworld" || dimension.id === "overworld";
  } catch (_error) {
    return false;
  }
}

function getDimensionSafe(identifier) {
  try {
    return world.getDimension(identifier);
  } catch (_error) {
    return undefined;
  }
}

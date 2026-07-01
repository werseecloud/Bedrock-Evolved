import { system, world } from "@minecraft/server";
import { MINIMAP_UI_CONFIG } from "../minimapConfig.js";
import { distance3D } from "../../utils/vectors.js";
import { loadMarkerData, saveMarkerData } from "../markers/markerStorage.js";
import { requestParticles, shouldRunForPlayer } from "../../performance/performanceManager.js";

let initialized = false;

export function initDeathBeaconManager() {
  if (initialized) {
    return;
  }
  initialized = true;
  system.runInterval(tickDeathBeacons, MINIMAP_UI_CONFIG.deathBeacon.pulseIntervalTicks);
}

export function setDeathBeaconEnabled(player, enabled) {
  const data = loadMarkerData(player);
  data.deathBeaconEnabled = Boolean(enabled);
  saveMarkerData(player, data);
}

export function isDeathBeaconEnabled(player) {
  return loadMarkerData(player).deathBeaconEnabled !== false;
}

function tickDeathBeacons() {
  if (!MINIMAP_UI_CONFIG.deathBeacon.enabled || MINIMAP_UI_CONFIG.deathBeacon.mode === "disabled") {
    return;
  }
  for (const player of world.getPlayers()) {
    if (!shouldRunForPlayer(player, "death_beacon", MINIMAP_UI_CONFIG.deathBeacon.pulseIntervalTicks, 3)) {
      continue;
    }
    const data = loadMarkerData(player);
    const marker = data.latestDeath;
    if (!marker || data.deathBeaconEnabled === false || marker.dimension !== player.dimension.id) {
      continue;
    }
    const markerLocation = { x: marker.x, y: marker.y, z: marker.z };
    if (distance3D(player.location, markerLocation) > MINIMAP_UI_CONFIG.deathBeacon.activeRadius) {
      continue;
    }
    spawnDeathBeam(player.dimension, markerLocation, marker.dimension);
  }
}

function spawnDeathBeam(dimension, location, dimensionId) {
  const config = MINIMAP_UI_CONFIG.deathBeacon;
  const count = Math.max(4, Math.min(config.particlesPerPulse, 32));
  if (!requestParticles("death_beacon", count)) {
    return;
  }
  const step = Math.max(2, Math.floor(config.beamHeight / count));
  const particle = String(dimensionId).includes("nether")
    ? "be:death_beacon_nether"
    : String(dimensionId).includes("end")
      ? "be:death_beacon_end"
      : "be:death_beacon_red";
  for (let i = 0; i < count; i++) {
    const pos = {
      x: location.x + 0.5,
      y: location.y + 0.5 + i * step,
      z: location.z + 0.5
    };
    try {
      dimension.spawnParticle(particle, pos);
    } catch (_error) {
      try {
        dimension.spawnParticle("minecraft:basic_flame_particle", pos);
      } catch (_fallbackError) {
        return;
      }
    }
  }
}

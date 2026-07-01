export const LOD_DEFAULTS = Object.freeze({
  LOD_ENABLED: true,
  LOD_SCAN_INTERVAL_TICKS: 40,
  LOD_MAX_ACTIVE_IMPOSTORS_PER_PLAYER: 48,
  LOD_MAX_STRUCTURE_PLACEMENTS_PER_MINUTE: 20,
  LOD_REAL_RADIUS_CHUNKS: 8,
  LOD_NEAR_RADIUS_CHUNKS: 16,
  LOD_DISTANT_RADIUS_CHUNKS: 32,
  LOD_SKYLINE_RADIUS_CHUNKS: 64,
  LOD_FAKE_WORLD_TARGET_CHUNKS: 2000,
  LOD_BLOCK_OPS_PER_TICK: 64,
  LOD_RECYCLE_DISTANCE_CHUNKS: 72,
  LOD_CITY_SKYLINES_ENABLED: true,
  LOD_MOUNTAIN_SKYLINES_ENABLED: true,
  LOD_DEBUG: false,
  LOD_MOVEMENT_THRESHOLD_CHUNKS: 2,
  LOD_MAX_LANDMARK_RECORDS: 192,
  VIBRANT_PROFILE: "balanced",
  PERFORMANCE_MODE: "balanced"
});

export const LODConfig = {
  ...LOD_DEFAULTS
};

export const PERFORMANCE_PROFILES = Object.freeze({
  performance: {
    LOD_MAX_ACTIVE_IMPOSTORS_PER_PLAYER: 18,
    LOD_MAX_STRUCTURE_PLACEMENTS_PER_MINUTE: 8,
    LOD_NEAR_RADIUS_CHUNKS: 10,
    LOD_DISTANT_RADIUS_CHUNKS: 18,
    LOD_SKYLINE_RADIUS_CHUNKS: 28,
    LOD_BLOCK_OPS_PER_TICK: 32
  },
  balanced: {
    LOD_MAX_ACTIVE_IMPOSTORS_PER_PLAYER: 48,
    LOD_MAX_STRUCTURE_PLACEMENTS_PER_MINUTE: 20,
    LOD_NEAR_RADIUS_CHUNKS: 16,
    LOD_DISTANT_RADIUS_CHUNKS: 32,
    LOD_SKYLINE_RADIUS_CHUNKS: 64,
    LOD_BLOCK_OPS_PER_TICK: 64
  },
  cinematic: {
    LOD_MAX_ACTIVE_IMPOSTORS_PER_PLAYER: 72,
    LOD_MAX_STRUCTURE_PLACEMENTS_PER_MINUTE: 28,
    LOD_NEAR_RADIUS_CHUNKS: 18,
    LOD_DISTANT_RADIUS_CHUNKS: 40,
    LOD_SKYLINE_RADIUS_CHUNKS: 72,
    LOD_BLOCK_OPS_PER_TICK: 80
  }
});

export function setLodEnabled(enabled) {
  LODConfig.LOD_ENABLED = Boolean(enabled);
}

export function setLodDebug(enabled) {
  LODConfig.LOD_DEBUG = Boolean(enabled);
}

export function setVibrantProfile(profile) {
  const normalized = String(profile || "").toLowerCase();
  if (!["alpine", "valley", "city", "balanced"].includes(normalized)) {
    return false;
  }
  LODConfig.VIBRANT_PROFILE = normalized;
  return true;
}

export function setPerformanceMode(mode) {
  const normalized = String(mode || "").toLowerCase();
  const profile = PERFORMANCE_PROFILES[normalized];
  if (!profile) {
    return false;
  }
  Object.assign(LODConfig, profile);
  LODConfig.PERFORMANCE_MODE = normalized;
  return true;
}

export function getLodStatus() {
  return `enabled=${LODConfig.LOD_ENABLED} mode=${LODConfig.PERFORMANCE_MODE} activeLimit=${LODConfig.LOD_MAX_ACTIVE_IMPOSTORS_PER_PLAYER} rings=${LODConfig.LOD_REAL_RADIUS_CHUNKS}/${LODConfig.LOD_NEAR_RADIUS_CHUNKS}/${LODConfig.LOD_DISTANT_RADIUS_CHUNKS}/${LODConfig.LOD_SKYLINE_RADIUS_CHUNKS} fakeTarget=${LODConfig.LOD_FAKE_WORLD_TARGET_CHUNKS}`;
}


export const FOG_CONFIG = {
  enabled: true,

  profile: "balanced",

  global: {
    reduceHeavyFog: true,
    allowFarVisibility: true,
    preserveHorizon: true,
    supportLodSilhouettes: true
  },

  profiles: {
    performance: {
      densityMultiplier: 1.1,
      farVisibilityMultiplier: 0.85,
      valleyFogMultiplier: 1.0,
      caveFogMultiplier: 1.0
    },
    balanced: {
      densityMultiplier: 0.85,
      farVisibilityMultiplier: 1.0,
      valleyFogMultiplier: 0.9,
      caveFogMultiplier: 0.9
    },
    cinematic: {
      densityMultiplier: 0.7,
      farVisibilityMultiplier: 1.2,
      valleyFogMultiplier: 0.85,
      caveFogMultiplier: 0.8
    },
    server: {
      densityMultiplier: 0.95,
      farVisibilityMultiplier: 0.95,
      valleyFogMultiplier: 1.0,
      caveFogMultiplier: 0.95
    }
  },

  biomeFog: {
    default: true,
    alpinePeaks: true,
    shatteredCliffs: true,
    deepValleys: true,
    oldGrowthHighlands: true,
    coastalCliffs: true,
    hotSprings: true,
    caves: true,
    netherDeepCrack: true
  },

  tuning: {
    maxFogStrength: 0.65,
    defaultFogStrength: 0.32,
    valleyFogStrength: 0.42,
    caveFogStrength: 0.28,
    horizonSoftness: 0.9
  },

  runtime: {
    scanIntervalTicks: 80,
    forcedBiomeTestTicks: 600,
    commandUserId: "be_fog_runtime"
  },

  debug: false
};

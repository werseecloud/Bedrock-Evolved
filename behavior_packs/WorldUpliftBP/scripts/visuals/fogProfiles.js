import { FOG_CONFIG } from "./fogConfig.js";

export const FOG_PROFILE_NAMES = Object.freeze(["performance", "balanced", "cinematic", "server"]);

export const PROFILE_FOG_IDS = Object.freeze({
  performance: "be:fog_profile_performance",
  balanced: "be:fog_profile_balanced",
  cinematic: "be:fog_profile_cinematic",
  server: "be:fog_profile_server"
});

export const BIOME_FOG_IDS = Object.freeze({
  default: "be:default_realistic_fog",
  alpinePeaks: "be:alpine_peaks_fog",
  shatteredCliffs: "be:shattered_cliffs_fog",
  deepValleys: "be:deep_valleys_fog",
  oldGrowthHighlands: "be:old_growth_highlands_fog",
  coastalCliffs: "be:coastal_cliffs_fog",
  hotSprings: "be:hot_springs_fog",
  caves: "be:cave_fog",
  netherDeepCrack: "be:nether_deep_crack_fog",
  storm: "be:storm_fog"
});

export const BIOME_DISPLAY_NAMES = Object.freeze({
  default: "Default realistic",
  alpinePeaks: "Alpine Peaks",
  shatteredCliffs: "Shattered Cliffs",
  deepValleys: "Deep Valleys",
  oldGrowthHighlands: "Old Growth Highlands",
  coastalCliffs: "Coastal Cliffs",
  hotSprings: "Hot Springs",
  caves: "Caves",
  netherDeepCrack: "Nether Deep Crack",
  storm: "Storm"
});

export function normalizeFogProfile(profileName) {
  const normalized = String(profileName || "").toLowerCase();
  return FOG_PROFILE_NAMES.includes(normalized) ? normalized : undefined;
}

export function setConfigFogProfile(profileName) {
  const normalized = normalizeFogProfile(profileName);
  if (!normalized) {
    return false;
  }
  FOG_CONFIG.profile = normalized;
  return true;
}

export function getFogProfileSettings(profileName = FOG_CONFIG.profile) {
  const normalized = normalizeFogProfile(profileName) || "balanced";
  return {
    name: normalized,
    fogId: PROFILE_FOG_IDS[normalized],
    ...(FOG_CONFIG.profiles[normalized] || FOG_CONFIG.profiles.balanced)
  };
}

export function getRuntimeFogIdForBiome(category, profileName = FOG_CONFIG.profile) {
  const normalizedCategory = BIOME_FOG_IDS[category] ? category : "default";
  const normalizedProfile = normalizeFogProfile(profileName) || "balanced";
  if (normalizedCategory === "default") {
    return PROFILE_FOG_IDS[normalizedProfile] || BIOME_FOG_IDS.default;
  }
  return BIOME_FOG_IDS[normalizedCategory] || BIOME_FOG_IDS.default;
}

export function isFogBiomeEnabled(category) {
  if (category === "storm") {
    return true;
  }
  if (category === "default") {
    return FOG_CONFIG.biomeFog.default;
  }
  return FOG_CONFIG.biomeFog[category] !== false;
}

export function formatFogProfileSummary() {
  const profile = getFogProfileSettings();
  return `profile=${profile.name} density=${profile.densityMultiplier} far=${profile.farVisibilityMultiplier} valley=${profile.valleyFogMultiplier} cave=${profile.caveFogMultiplier}`;
}

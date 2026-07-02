import { FOG_CONFIG } from "./fogConfig.js";
import { getFogProfileSettings, normalizeFogProfile } from "./fogProfiles.js";
import { setFogProfile } from "./fogController.js";

export function syncFogWithPerformanceProfile(profileName) {
  const normalized = normalizeFogProfile(profileName) || "balanced";
  setFogProfile(normalized, {
    apply: true,
    announce: false
  });
  return getFogProfileSettings(normalized);
}

export function getLodFogSyncStatus() {
  const profile = getFogProfileSettings();
  return `fogProfile=${profile.name} lodSupport=${FOG_CONFIG.global.supportLodSilhouettes} farVisibility=${profile.farVisibilityMultiplier}`;
}

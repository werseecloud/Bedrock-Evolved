import { DEFAULT_PROFILE, MOTION_SICKNESS_SAFE_MODE, PROFILES } from "../config.js";

export function getProfile(name) {
  const profileName = PROFILES[name] ? name : DEFAULT_PROFILE;
  const profile = {
    ...PROFILES[profileName],
    name: profileName
  };

  if (MOTION_SICKNESS_SAFE_MODE) {
    profile.swayIntensity = 0;
    profile.strafeTiltIntensity = 0;
    profile.sprintFovBoost = 0;
    profile.landingBounceIntensity = 0;
  }

  return profile;
}

export function isValidProfile(name) {
  return Boolean(PROFILES[name]);
}

export function getProfileNames() {
  return Object.keys(PROFILES);
}


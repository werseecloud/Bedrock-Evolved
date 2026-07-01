import { Logger } from "../utils/logger.js";
import { getPlacementQueueStatus } from "../cities/structurePlacer.js";
import {
  applyPerformanceProfile,
  getPerformanceProfile,
  getPerformanceStatus,
  isPerformanceDebug,
  runPerformanceMaintenanceNow,
  setPerformanceDebug
} from "./performanceManager.js";
import { PERFORMANCE_PROFILE_NAMES } from "./performanceProfiles.js";

export function handlePerfCommand(source, args) {
  const action = args[0] || "status";
  if (action === "status") {
    const queue = getPlacementQueueStatus();
    Logger.tell(source, getPerformanceStatus({
      queue: queue.queued,
      missingStructures: queue.missingStructures
    }));
    return;
  }
  if (action === "profile") {
    const profile = args[1] || "balanced";
    setPerfProfile(source, profile);
    return;
  }
  if (PERFORMANCE_PROFILE_NAMES.includes(action)) {
    setPerfProfile(source, action);
    return;
  }
  if (action === "debug") {
    const enabled = args[1] === "on";
    setPerformanceDebug(enabled);
    Logger.tell(source, `Performance debug ${enabled ? "enabled" : "disabled"}.`);
    return;
  }
  if (action === "cleanup") {
    const result = runPerformanceMaintenanceNow();
    Logger.tell(source, `Performance cleanup ran. removedItems=${result.itemEntitiesRemoved} removedHostiles=${result.hostilesRemovedNearCities}.`);
    return;
  }
  Logger.tell(source, "Unknown perf action. Use status, cleanup, profile <performance|balanced|cinematic|server>, debug on/off.");
}

export function setPerfProfile(source, profileName) {
  const normalized = String(profileName || "").toLowerCase();
  if (!PERFORMANCE_PROFILE_NAMES.includes(normalized)) {
    Logger.tell(source, `Unknown performance profile. Use: ${PERFORMANCE_PROFILE_NAMES.join(", ")}`);
    return false;
  }
  const profile = applyPerformanceProfile(normalized);
  Logger.tell(source, `Performance profile set to ${profile.name}. minimap=${profile.minimapGrid}x${profile.minimapGrid}@${profile.minimapIntervalTicks}t LOD=${profile.lodImpostors} cityRadius=${profile.cityActiveRadius} sim=${profile.simulationRecommendation}.`);
  return true;
}

export function getPerfSummary() {
  const profile = getPerformanceProfile();
  return `profile=${profile.name} debug=${isPerformanceDebug()} minimap=${profile.minimapGrid}x${profile.minimapGrid}@${profile.minimapIntervalTicks}t LOD=${profile.lodImpostors}`;
}

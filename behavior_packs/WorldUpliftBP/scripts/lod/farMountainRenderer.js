import { LODConfig } from "./lodConfig.js";
import { seedSkylineRecordsForPlayer } from "./skylineGenerator.js";

export function syncMountainSkylineRecords(player) {
  if (!LODConfig.LOD_MOUNTAIN_SKYLINES_ENABLED) {
    return [];
  }
  return seedSkylineRecordsForPlayer(player);
}


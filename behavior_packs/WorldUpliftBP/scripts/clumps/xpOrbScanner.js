import { CONFIG } from "../config.js";
import { Logger } from "../utils/logger.js";

const XP_TYPES = ["minecraft:xp_orb", "minecraft:experience_orb"];

export function scanXpOrbsAroundPlayer(player) {
  const results = [];
  for (const type of XP_TYPES) {
    try {
      const orbs = player.dimension.getEntities({
        type,
        location: player.location,
        maxDistance: CONFIG.clumps.scanRadius
      });
      results.push(...orbs.slice(0, CONFIG.clumps.maxOrbsPerScan - results.length));
      if (results.length >= CONFIG.clumps.maxOrbsPerScan) {
        break;
      }
    } catch (error) {
      if (CONFIG.clumps.debug) {
        Logger.debug(`XP orb query failed for ${type}: ${error}`);
      }
    }
  }
  return results;
}


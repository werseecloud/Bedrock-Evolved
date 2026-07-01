import { CONFIG } from "../config.js";
import { Logger } from "../utils/logger.js";
import { distance2D } from "../utils/vectors.js";
import { canSpawnXp, getXpValue } from "./xpValueService.js";

export function mergeNearbyOrbs(dimension, orbs) {
  if (!canSpawnXp(dimension)) {
    CONFIG.clumps.exactModeAvailable = false;
    return { merged: 0, skipped: "spawnXp_unavailable" };
  }
  const groups = clusterOrbs(orbs);
  let merged = 0;
  for (const group of groups) {
    if (merged >= CONFIG.clumps.maxMergesPerTick || group.length < 3) {
      continue;
    }
    if (group.length > CONFIG.clumps.maxOrbsRemovedPerTick) {
      if (CONFIG.clumps.debug) {
        Logger.debug(`Skipping XP cluster of ${group.length}; exceeds safe remove budget.`);
      }
      continue;
    }
    const values = group.map(getXpValue);
    if (values.some((value) => value === undefined)) {
      CONFIG.clumps.exactModeAvailable = false;
      if (CONFIG.clumps.debug) {
        Logger.debug("XP value not readable on this API version; exact clumping disabled.");
      }
      continue;
    }
    CONFIG.clumps.exactModeAvailable = !CONFIG.clumps.approximateMode;
    const total = values.reduce((sum, value) => sum + value, 0);
    const center = averageLocation(group);
    let removed = 0;
    for (const orb of group) {
      try {
        orb.remove();
        removed++;
      } catch (_error) {
        // If removal fails, skip spawning to avoid duplication.
      }
    }
    if (removed === group.length) {
      try {
        dimension.spawnXp(center, total);
        merged++;
        if (CONFIG.clumps.useParticles) {
          try {
            dimension.spawnParticle("uplift:xp_clump_merge", center);
          } catch (_error) {
            try {
              dimension.spawnParticle("minecraft:basic_crit_particle", center);
            } catch (_fallbackError) {
              // Best effort.
            }
          }
        }
      } catch (error) {
        Logger.warn(`Failed spawning merged XP; original orbs were removed: ${error}`);
      }
    }
  }
  return { merged };
}

function clusterOrbs(orbs) {
  const unvisited = new Set(orbs);
  const groups = [];
  for (const orb of orbs) {
    if (!unvisited.has(orb)) {
      continue;
    }
    unvisited.delete(orb);
    const group = [orb];
    for (const other of [...unvisited]) {
      if (distance2D(orb.location, other.location) <= CONFIG.clumps.mergeRadius) {
        unvisited.delete(other);
        group.push(other);
      }
    }
    groups.push(group);
  }
  return groups;
}

function averageLocation(group) {
  const total = group.reduce((sum, orb) => ({
    x: sum.x + orb.location.x,
    y: sum.y + orb.location.y,
    z: sum.z + orb.location.z
  }), { x: 0, y: 0, z: 0 });
  return {
    x: total.x / group.length,
    y: total.y / group.length,
    z: total.z / group.length
  };
}

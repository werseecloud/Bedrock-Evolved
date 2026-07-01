import { CONFIG } from "../config.js";
import { clamp } from "../utils/math.js";

export function calculateRepairPlan(missingDurability, availableXp) {
  const perDurability = Math.max(1, Number(CONFIG.betterMending.xpCostPerDurability || 1));
  const maxByXp = Math.floor(availableXp / perDurability);
  const repairAmount = clamp(Math.min(missingDurability, CONFIG.betterMending.maxRepairPerUse, maxByXp), 0, CONFIG.betterMending.maxRepairPerUse);
  return {
    repairAmount,
    xpCost: repairAmount * perDurability
  };
}


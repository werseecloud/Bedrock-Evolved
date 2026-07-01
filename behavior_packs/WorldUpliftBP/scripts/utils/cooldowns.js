import { system } from "@minecraft/server";

const cooldowns = new Map();

export function hasCooldown(key, ticks) {
  const last = cooldowns.get(key) || -999999;
  return system.currentTick - last < ticks;
}

export function setCooldown(key) {
  cooldowns.set(key, system.currentTick);
}

export function cleanCooldowns(maxAgeTicks = 1200) {
  const cutoff = system.currentTick - maxAgeTicks;
  for (const [key, tick] of cooldowns) {
    if (tick < cutoff) {
      cooldowns.delete(key);
    }
  }
}


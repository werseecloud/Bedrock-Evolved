import { system } from "@minecraft/server";
import { getProfileSettings } from "./minimapUiState.js";

const CACHE = new Map();
const CACHE_TTL_TICKS = 600;

export function renderMapGrid(player, state, mode = "small") {
  const profile = getProfileSettings(state);
  const gridSize = mode === "fullscreen" ? profile.fullscreenGrid : profile.smallGrid;
  const radius = Math.floor(gridSize / 2);
  const step = mode === "fullscreen" ? Math.max(4, Math.floor(8 * (state.cursor?.zoom || 1))) : 8;
  const lines = [];

  for (let gz = -radius; gz <= radius; gz++) {
    let line = "";
    for (let gx = -radius; gx <= radius; gx++) {
      if (gx === 0 && gz === 0) {
        line += "^";
        continue;
      }
      const worldX = Math.floor(player.location.x + gx * step + (state.cursor?.x || 0));
      const worldZ = Math.floor(player.location.z + gz * step + (state.cursor?.z || 0));
      line += sampleTerrainGlyph(player.dimension, worldX, worldZ, Math.floor(player.location.y));
    }
    lines.push(line);
  }
  return lines;
}

export function sampleTerrainGlyph(dimension, x, z, nearY) {
  const key = `${dimension.id}:${Math.floor(x / 8)},${Math.floor(z / 8)},${Math.floor(nearY / 16)}`;
  const cached = CACHE.get(key);
  if (cached && system.currentTick - cached.tick <= CACHE_TTL_TICKS) {
    return cached.glyph;
  }
  if (CACHE.size > 4096) {
    CACHE.clear();
  }

  let glyph = "?";
  const y = findSurfaceY(dimension, x, z, nearY);
  if (y !== undefined) {
    try {
      const block = dimension.getBlock({ x, y: y - 1, z });
      glyph = blockToGlyph(block?.typeId || "minecraft:air");
    } catch (_error) {
      glyph = "?";
    }
  }
  CACHE.set(key, { glyph, tick: system.currentTick });
  return glyph;
}

function findSurfaceY(dimension, x, z, nearY) {
  let minY = nearY - 32;
  let maxY = nearY + 48;
  try {
    if (dimension.heightRange) {
      minY = Math.max(minY, dimension.heightRange.min + 1);
      maxY = Math.min(maxY, dimension.heightRange.max - 2);
    }
  } catch (_error) {
    // Use local range.
  }

  for (let y = maxY; y >= minY; y--) {
    try {
      const block = dimension.getBlock({ x, y, z });
      const above = dimension.getBlock({ x, y: y + 1, z });
      if (block && above && !block.isAir && above.isAir) {
        return y + 1;
      }
    } catch (_error) {
      return undefined;
    }
  }
  return undefined;
}

function blockToGlyph(typeId) {
  if (typeId.includes("water")) return "~";
  if (typeId.includes("lava")) return "!";
  if (typeId.includes("snow") || typeId.includes("ice")) return "*";
  if (typeId.includes("sand")) return ":";
  if (typeId.includes("stone") || typeId.includes("deepslate") || typeId.includes("andesite") || typeId.includes("tuff")) return "#";
  if (typeId.includes("log") || typeId.includes("leaves") || typeId.includes("podzol")) return "T";
  if (typeId.includes("grass") || typeId.includes("dirt") || typeId.includes("moss")) return ".";
  return "?";
}

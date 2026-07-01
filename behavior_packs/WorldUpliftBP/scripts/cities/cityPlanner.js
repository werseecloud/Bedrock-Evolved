import { system } from "@minecraft/server";
import { MutableConfig } from "../config.js";
import { floorVec } from "../utils/vectors.js";
import { hashString, mulberry32, choice } from "../utils/random.js";

export const CITY_TYPES = [
  "small_town",
  "fortified_city",
  "mining_city",
  "farming_city",
  "trade_capital"
];

const NAME_PREFIXES = ["Stone", "River", "High", "Oak", "Bell", "Iron", "Crown", "Moss", "Vale", "North"];
const NAME_SUFFIXES = ["hold", "ford", "gate", "watch", "market", "haven", "field", "brook", "crest", "stead"];

export function generateCityName(center) {
  const random = mulberry32(hashString(`${center.x}:${center.z}`));
  return `${choice(random, NAME_PREFIXES)}${choice(random, NAME_SUFFIXES)}`;
}

export function detectVillageAnchor(player, radius = MutableConfig.CITY_SCAN_RADIUS) {
  const dimension = player.dimension;
  const playerLocation = floorVec(player.location);
  const dimensionId = getDimensionId(dimension);
  const bell = findNearbyBlock(dimension, playerLocation, radius, (typeId) => typeId === "minecraft:bell");
  const bedCount = countNearbyBlocks(dimension, playerLocation, Math.min(radius, 16), (typeId) => typeId.includes("bed"), 12);
  const villagerCount = countNearbyVillagers(dimension, player.location, radius + 6);

  if (!bell && bedCount < 2 && villagerCount < 2) {
    return undefined;
  }

  const center = bell || playerLocation;
  return {
    center,
    dimensionId,
    bedCount,
    villagerCount,
    populationEstimate: estimatePopulation(bedCount, villagerCount),
    createdTick: system.currentTick
  };
}

export function estimatePopulation(beds, villagers) {
  return Math.max(4, Math.floor(beds * 1.5 + villagers * 2));
}

export function getDimensionId(dimension) {
  try {
    return dimension.id || "minecraft:overworld";
  } catch (_error) {
    return "minecraft:overworld";
  }
}

function findNearbyBlock(dimension, center, radius, predicate) {
  const yMin = center.y - 8;
  const yMax = center.y + 8;
  for (let y = yMin; y <= yMax; y++) {
    for (let x = center.x - radius; x <= center.x + radius; x++) {
      for (let z = center.z - radius; z <= center.z + radius; z++) {
        try {
          const block = dimension.getBlock({ x, y, z });
          if (block && predicate(block.typeId)) {
            return { x, y, z };
          }
        } catch (_error) {
          return undefined;
        }
      }
    }
  }
  return undefined;
}

function countNearbyBlocks(dimension, center, radius, predicate, cap) {
  let count = 0;
  for (let y = center.y - 6; y <= center.y + 6; y++) {
    for (let x = center.x - radius; x <= center.x + radius; x++) {
      for (let z = center.z - radius; z <= center.z + radius; z++) {
        try {
          const block = dimension.getBlock({ x, y, z });
          if (block && predicate(block.typeId)) {
            count++;
            if (count >= cap) {
              return count;
            }
          }
        } catch (_error) {
          return count;
        }
      }
    }
  }
  return count;
}

function countNearbyVillagers(dimension, location, radius) {
  let count = 0;
  try {
    count += dimension.getEntities({
      type: "minecraft:villager",
      location,
      maxDistance: radius
    }).length;
  } catch (_error) {
    // Some worlds only expose villager_v2.
  }
  try {
    count += dimension.getEntities({
      type: "minecraft:villager_v2",
      location,
      maxDistance: radius
    }).length;
  } catch (_error) {
    // Ignore entity-query failures in unloaded or restricted areas.
  }
  return count;
}


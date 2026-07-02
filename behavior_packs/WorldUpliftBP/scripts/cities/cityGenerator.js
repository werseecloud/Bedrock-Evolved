import { world } from "@minecraft/server";
import { Logger } from "../utils/logger.js";
import { floorVec, addVec } from "../utils/vectors.js";
import { MutableConfig } from "../config.js";
import { detectVillageAnchor, getDimensionId, CITY_TYPES } from "./cityPlanner.js";
import { getStagePlacements, getDistrictForType } from "./districtGenerator.js";
import { createCity, findNearestCity, formatCityStatus, updateCity } from "./cityRegistry.js";
import { queueRoadGrid, queueRoadToBuilding } from "./roadGenerator.js";
import { enqueueStructure, queueFallbackBuilding } from "./structurePlacer.js";

export function createOrUpgradeNearestCity(player) {
  const location = floorVec(player.location);
  const dimensionId = getDimensionId(player.dimension);
  let city = findNearestCity(location, dimensionId, 64);

  if (!city) {
    const anchor = detectVillageAnchor(player, MutableConfig.CITY_SCAN_RADIUS + 8) || {
      center: location,
      dimensionId,
      populationEstimate: 4
    };
    city = createCity(anchor, "small_town");
    Logger.tell(player, `Created city ${city.name} at ${city.center.x}, ${city.center.y}, ${city.center.z}.`);
  } else {
    Logger.tell(player, `Using nearest city ${city.name}.`);
  }

  if (city.stage < 1) {
    scheduleCityStage(city, 1, player);
  }
  return city;
}

export function expandNearestCity(player) {
  const city = findNearestCity(floorVec(player.location), getDimensionId(player.dimension), 96);
  if (!city) {
    Logger.tell(player, "No city is registered nearby. Use /scriptevent wu:city create first.");
    return undefined;
  }
  const nextStage = Math.min(5, Number(city.stage || 0) + 1);
  if (nextStage === city.stage) {
    Logger.tell(player, `${city.name} is already at the maximum prototype stage.`);
    return city;
  }
  scheduleCityStage(city, nextStage, player);
  return city;
}

export function setNearestCityType(player, type) {
  if (!CITY_TYPES.includes(type)) {
    Logger.tell(player, `Unknown city type ${type}. Valid: ${CITY_TYPES.join(", ")}`);
    return undefined;
  }
  const city = findNearestCity(floorVec(player.location), getDimensionId(player.dimension), 96);
  if (!city) {
    Logger.tell(player, "No city is registered nearby.");
    return undefined;
  }
  city.type = type;
  city.districts = getDistrictForType(type);
  updateCity(city);
  Logger.tell(player, `${city.name} is now ${type}.`);
  return city;
}

export function showNearestCityStatus(player) {
  const city = findNearestCity(floorVec(player.location), getDimensionId(player.dimension), 128);
  Logger.tell(player, formatCityStatus(city));
  return city;
}

export function scheduleCityStage(city, stage, source, options = {}) {
  const dimension = getDimensionForCity(city);
  const placements = getStagePlacements(city, stage);

  if (stage === 1) {
    queueRoadGrid(city, dimension);
  }

  for (const placement of placements) {
    const origin = addVec(city.center, placement.offset);
    if (stage > 1) {
      queueRoadToBuilding(city, dimension, origin);
    }
    enqueueStructure({
      identifier: placement.identifier,
      dimension,
      location: origin,
      size: placement.size,
      fallback: () => fallbackForPlacement(dimension, origin, placement)
    });
    city.buildings.push({
      name: placement.name,
      district: placement.district,
      identifier: placement.identifier,
      location: origin,
      stage
    });
    if (!city.districts.includes(placement.district)) {
      city.districts.push(placement.district);
    }
  }

  city.stage = Math.max(Number(city.stage || 0), stage);
  city.updatedTick = Date.now();
  updateCity(city);
  if (!options.silent) {
    Logger.tell(source, `Queued ${city.name} stage ${stage} with ${placements.length} structure placements.`);
  }
}

function getDimensionForCity(city) {
  const id = city.dimensionId || "minecraft:overworld";
  try {
    return world.getDimension(id);
  } catch (_error) {
    if (id === "minecraft:overworld") {
      return world.getDimension("overworld");
    }
    if (id === "minecraft:nether") {
      return world.getDimension("nether");
    }
    throw _error;
  }
}

function fallbackForPlacement(dimension, origin, placement) {
  if (placement.name.includes("wall")) {
    queueFallbackBuilding(dimension, origin, placement.size, "minecraft:stone_bricks", "minecraft:stone_bricks", "minecraft:stone_bricks");
    return;
  }
  if (placement.name.includes("farm")) {
    queueFallbackBuilding(dimension, origin, placement.size, "minecraft:dirt", "minecraft:oak_log", "minecraft:hay_block");
    return;
  }
  if (placement.name.includes("mine")) {
    queueFallbackBuilding(dimension, origin, placement.size, "minecraft:deepslate", "minecraft:oak_log", "minecraft:cobblestone");
    return;
  }
  queueFallbackBuilding(dimension, origin, placement.size, "minecraft:cobblestone", "minecraft:oak_planks", "minecraft:spruce_planks");
}

import { world } from "@minecraft/server";
import { MutableConfig } from "../config.js";
import { Logger } from "../utils/logger.js";
import { distance2D } from "../utils/vectors.js";
import { generateCityName } from "./cityPlanner.js";

const REGISTRY_KEY = "wu:city_registry";
const cities = [];
let loaded = false;

export function initCityRegistry() {
  loadCities();
}

export function loadCities() {
  if (loaded) {
    return cities;
  }
  loaded = true;
  try {
    const raw = world.getDynamicProperty(REGISTRY_KEY);
    if (typeof raw === "string" && raw.length > 0) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cities.splice(0, cities.length, ...parsed);
      }
    }
  } catch (error) {
    Logger.warn(`Could not load city registry: ${error}`);
  }
  return cities;
}

export function saveCities() {
  try {
    world.setDynamicProperty(REGISTRY_KEY, JSON.stringify(cities));
  } catch (error) {
    Logger.warn(`Could not persist city registry; keeping memory copy only: ${error}`);
  }
}

export function getCities() {
  loadCities();
  return cities;
}

export function createCity(anchor, type = "small_town") {
  loadCities();
  if (cities.length >= MutableConfig.MAX_CITIES_PER_WORLD) {
    throw new Error("MAX_CITIES_PER_WORLD reached");
  }

  const center = {
    x: Math.floor(anchor.center.x),
    y: Math.floor(anchor.center.y),
    z: Math.floor(anchor.center.z)
  };
  const city = {
    cityId: `wu_${Math.abs(center.x)}_${Math.abs(center.z)}_${Math.floor(Math.random() * 99999)}`,
    name: generateCityName(center),
    type,
    dimensionId: anchor.dimensionId || "minecraft:overworld",
    center,
    stage: 0,
    buildings: [],
    districts: [],
    populationEstimate: anchor.populationEstimate || 0,
    resources: {
      food: 20,
      stone: 15,
      wood: 15,
      iron: 0
    },
    guards: 0,
    createdTick: anchor.createdTick || 0,
    updatedTick: anchor.createdTick || 0
  };

  cities.push(city);
  saveCities();
  return city;
}

export function registerVillageAnchor(anchor) {
  loadCities();
  const existing = findNearestCity(anchor.center, anchor.dimensionId || "minecraft:overworld", 48);
  if (existing) {
    return existing;
  }
  return createCity(anchor, "small_town");
}

export function updateCity(city) {
  loadCities();
  const index = cities.findIndex((item) => item.cityId === city.cityId);
  if (index >= 0) {
    cities[index] = city;
  }
  saveCities();
}

export function findCityById(cityId) {
  loadCities();
  return cities.find((city) => city.cityId === cityId);
}

export function findNearestCity(location, dimensionId = "minecraft:overworld", maxDistance = 96) {
  loadCities();
  let best;
  let bestDistance = maxDistance;
  for (const city of cities) {
    if (city.dimensionId !== dimensionId) {
      continue;
    }
    const distance = distance2D(city.center, location);
    if (distance <= bestDistance) {
      best = city;
      bestDistance = distance;
    }
  }
  return best;
}

export function addCityResource(cityId, resource, amount) {
  const city = findCityById(cityId);
  if (!city) {
    return undefined;
  }
  const current = Number(city.resources[resource] || 0);
  city.resources[resource] = current + Number(amount || 0);
  updateCity(city);
  return city;
}

export function raiseCityGuard(cityId, amount) {
  const city = findCityById(cityId);
  if (!city) {
    return undefined;
  }
  city.guards = Math.max(0, Number(city.guards || 0) + Number(amount || 1));
  updateCity(city);
  return city;
}

export function assignCityRole(cityId, role, entityId) {
  const city = findCityById(cityId);
  if (!city) {
    return undefined;
  }
  if (!city.roles) {
    city.roles = {};
  }
  if (!city.roles[role]) {
    city.roles[role] = [];
  }
  city.roles[role].push(entityId || "unknown");
  updateCity(city);
  return city;
}

export function formatCityStatus(city) {
  if (!city) {
    return "No city found.";
  }
  const resources = Object.entries(city.resources || {})
    .map(([key, value]) => `${key}:${value}`)
    .join(", ");
  return `${city.name} (${city.type}) id=${city.cityId} stage=${city.stage} pop=${city.populationEstimate} guards=${city.guards} buildings=${city.buildings.length} districts=${city.districts.length} resources=[${resources}]`;
}


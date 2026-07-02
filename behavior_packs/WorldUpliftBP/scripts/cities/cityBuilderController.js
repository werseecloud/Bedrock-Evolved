import { system, world } from "@minecraft/server";
import { MutableConfig } from "../config.js";
import { detectCrop } from "../harvest/cropDetector.js";
import { getPerformanceProfile, isModuleUsable, recordModuleError, requestEntityChecks, requestParticles } from "../performance/performanceManager.js";
import { Logger } from "../utils/logger.js";
import { addVec, distance2D, floorVec } from "../utils/vectors.js";
import { getCities, updateCity } from "./cityRegistry.js";
import { getStagePlacements } from "./districtGenerator.js";
import { scheduleCityStage } from "./cityGenerator.js";
import { enqueueSetBlock } from "./structurePlacer.js";

const BUILDER_TAG = "wu_builder";
const BUILDER_COUNT = 3;
const BUILDER_TICK_INTERVAL = 20;
const ACTIVE_CITY_LIMIT = 8;
const BUILDER_QUERY_RADIUS = 128;
const CROP_SCAN_RADIUS = 34;
const CROP_SCAN_CHECKS = 96;
const MOVE_STEP = 2.2;

const BUILDER_SPAWN_OFFSETS = Object.freeze([
  { x: 3, y: 0, z: 3 },
  { x: -4, y: 0, z: 3 },
  { x: 3, y: 0, z: -4 }
]);

const STAGE_COSTS = Object.freeze({
  1: { food: 4, wood: 4, stone: 4 },
  2: { food: 10, wood: 22, stone: 16 },
  3: { food: 12, wood: 16, stone: 12 },
  4: { food: 12, wood: 24, stone: 30 },
  5: { food: 12, wood: 18, stone: 28, iron: 1 }
});

const DETAIL_COST = Object.freeze({ food: 1, wood: 3, stone: 2 });

const builderBrains = new Map();
let initialized = false;

export function initCityBuilderController() {
  if (initialized) {
    return;
  }
  initialized = true;
  system.runInterval(tickCityBuilders, BUILDER_TICK_INTERVAL);
  Logger.info("City builder villagers initialized.");
}

function tickCityBuilders() {
  if (!MutableConfig.CITY_AUTO_REGISTER_ENABLED || !isModuleUsable("city_builders")) {
    return;
  }

  try {
    for (const active of getActiveCities()) {
      const city = active.city;
      const dimension = active.player.dimension;
      ensureCityBuilderState(city);
      const builders = ensureCityBuilders(city, dimension);
      for (let slot = 0; slot < builders.length; slot++) {
        tickBuilder(city, dimension, builders[slot], slot);
      }
    }
  } catch (error) {
    recordModuleError("city_builders", error);
    Logger.debug(`City builder tick skipped: ${error}`);
  }
}

function getActiveCities() {
  const profile = getPerformanceProfile();
  const radius = Math.max(MutableConfig.CITY_BUILD_RADIUS, profile.cityActiveRadius);
  const active = [];
  for (const city of getCities()) {
    const player = findNearbyPlayer(city, radius);
    if (!player) {
      continue;
    }
    active.push({ city, player });
    if (active.length >= ACTIVE_CITY_LIMIT) {
      break;
    }
  }
  return active;
}

function findNearbyPlayer(city, radius) {
  const cityDimension = normalizeDimensionId(city.dimensionId || "minecraft:overworld");
  for (const player of world.getPlayers()) {
    if (normalizeDimensionId(player.dimension.id) !== cityDimension) {
      continue;
    }
    if (distance2D(player.location, city.center) <= radius) {
      return player;
    }
  }
  return undefined;
}

function ensureCityBuilderState(city) {
  let dirty = false;
  city.resources = city.resources || {};
  for (const resource of ["food", "wood", "stone", "iron"]) {
    if (typeof city.resources[resource] !== "number") {
      city.resources[resource] = Number(city.resources[resource] || 0);
      dirty = true;
    }
  }
  city.activeEntityCaps = city.activeEntityCaps || {};
  if (city.activeEntityCaps.builders !== BUILDER_COUNT) {
    city.activeEntityCaps.builders = BUILDER_COUNT;
    dirty = true;
  }
  if (!city.builderState) {
    city.builderState = {
      version: 1,
      harvestedCrops: 0,
      gatheredResources: 0,
      placedBlocks: 0,
      completedDetails: 0,
      lastWorkTick: 0
    };
    dirty = true;
  }
  if (dirty) {
    updateCity(city);
  }
}

function ensureCityBuilders(city, dimension) {
  const builders = getBuilderEntities(city, dimension);
  const cityTagValue = cityTag(city);

  for (let slot = 0; slot < BUILDER_COUNT; slot++) {
    if (builders.some((builder) => entityHasTag(builder, slotTag(slot)))) {
      continue;
    }
    const spawned = spawnBuilder(city, dimension, slot, cityTagValue);
    if (spawned) {
      builders.push(spawned);
    }
  }

  return builders
    .filter(isEntityUsable)
    .slice(0, BUILDER_COUNT);
}

function getBuilderEntities(city, dimension) {
  if (!requestEntityChecks("city_builders", 2)) {
    return [];
  }
  const results = [];
  const cityTagValue = cityTag(city);
  for (const type of ["minecraft:villager_v2", "minecraft:villager"]) {
    try {
      const entities = dimension.getEntities({
        type,
        location: city.center,
        maxDistance: BUILDER_QUERY_RADIUS
      });
      for (const entity of entities) {
        if (entityHasTag(entity, BUILDER_TAG) && entityHasTag(entity, cityTagValue)) {
          results.push(entity);
        }
      }
    } catch (error) {
      recordModuleError("city_builders", error);
    }
  }
  return results;
}

function spawnBuilder(city, dimension, slot, cityTagValue) {
  const location = findSpawnLocation(dimension, city, slot);
  for (const typeId of ["minecraft:villager_v2", "minecraft:villager"]) {
    try {
      const builder = dimension.spawnEntity(typeId, location);
      builder.addTag(BUILDER_TAG);
      builder.addTag(cityTagValue);
      builder.addTag(slotTag(slot));
      setBuilderLabel(builder, "Builder");
      return builder;
    } catch (_error) {
      // Try the next villager identifier for older or newer worlds.
    }
  }
  Logger.warn(`Could not spawn Builder villager for ${city.name}.`);
  return undefined;
}

function tickBuilder(city, dimension, builder, slot) {
  if (!isEntityUsable(builder)) {
    return;
  }

  const brain = getBuilderBrain(city, builder, slot);
  if (brain.cooldownUntil && system.currentTick < brain.cooldownUntil) {
    return;
  }

  if (!brain.task) {
    brain.task = chooseBuilderTask(city, dimension, brain, slot);
    if (!brain.task) {
      setBuilderLabel(builder, "Builder");
      return;
    }
    setBuilderLabel(builder, brain.task.label);
  }

  if (!moveToward(builder, brain.task.target, dimension)) {
    return;
  }

  executeTask(city, dimension, builder, brain);
}

function getBuilderBrain(city, builder, slot) {
  const key = builder.id || `${city.cityId}:${slot}`;
  let brain = builderBrains.get(key);
  if (!brain || brain.cityId !== city.cityId) {
    brain = {
      cityId: city.cityId,
      phase: "harvest",
      cropCursor: slot * 271,
      projectBlocks: [],
      task: undefined,
      cooldownUntil: 0
    };
    builderBrains.set(key, brain);
  }
  return brain;
}

function chooseBuilderTask(city, dimension, brain, slot) {
  if (brain.phase === "harvest") {
    const crop = findMatureCrop(city, dimension, brain);
    if (crop) {
      return {
        kind: "harvest",
        label: "Builder - Harvesting",
        crop,
        target: standNear(crop.location, crop.location.y + 1)
      };
    }
    return createGatherTask(city, dimension, slot);
  }

  if (brain.projectBlocks.length > 0) {
    return createPlaceBlockTask(brain.projectBlocks.shift());
  }

  const stageTask = createStageBuildTask(city);
  if (stageTask) {
    return stageTask;
  }

  const project = createDetailProject(city, dimension);
  if (project && canAfford(city, project.cost)) {
    spendResources(city, project.cost);
    city.builderState.completedDetails = Number(city.builderState.completedDetails || 0) + 1;
    city.builderState.lastWorkTick = system.currentTick;
    updateCity(city);
    brain.projectBlocks = project.blocks.slice(1);
    return createPlaceBlockTask(project.blocks[0]);
  }

  return createGatherTask(city, dimension, slot);
}

function executeTask(city, dimension, builder, brain) {
  const task = brain.task;
  brain.task = undefined;
  brain.cooldownUntil = system.currentTick + 10;

  if (task.kind === "harvest") {
    if (harvestCrop(city, dimension, task.crop)) {
      brain.phase = "build";
    }
    return;
  }

  if (task.kind === "gather") {
    addResource(city, task.resource, task.amount);
    city.builderState.gatheredResources = Number(city.builderState.gatheredResources || 0) + task.amount;
    city.builderState.lastWorkTick = system.currentTick;
    updateCity(city);
    playWorkParticle(dimension, task.target, "minecraft:crop_growth_emitter");
    brain.phase = "build";
    return;
  }

  if (task.kind === "stage") {
    const cost = STAGE_COSTS[task.stage] || {};
    if (canAfford(city, cost) && Number(city.stage || 0) < task.stage) {
      spendResources(city, cost);
      scheduleCityStage(city, task.stage, undefined, { silent: true });
      city.builderState.lastWorkTick = system.currentTick;
      playWorkParticle(dimension, task.target, "minecraft:basic_smoke_particle");
    }
    brain.phase = "harvest";
    return;
  }

  if (task.kind === "place_block") {
    enqueueSetBlock(dimension, task.location, task.blockType, { force: task.force });
    city.builderState.placedBlocks = Number(city.builderState.placedBlocks || 0) + 1;
    city.builderState.lastWorkTick = system.currentTick;
    updateCity(city);
    playWorkParticle(dimension, task.target, "minecraft:basic_smoke_particle");
    if (brain.projectBlocks.length === 0) {
      brain.phase = "harvest";
    }
  }
}

function createStageBuildTask(city) {
  const stage = getNextBuildStage(city);
  if (!stage) {
    return undefined;
  }
  const cost = STAGE_COSTS[stage] || {};
  if (!canAfford(city, cost)) {
    return undefined;
  }
  const placement = getStagePlacements(city, stage)[0];
  if (!placement) {
    return undefined;
  }
  const origin = addVec(city.center, placement.offset);
  return {
    kind: "stage",
    stage,
    label: `Builder - Stage ${stage}`,
    target: standNear(origin, origin.y + 1)
  };
}

function getNextBuildStage(city) {
  const current = Number(city.stage || 0);
  if (current >= 5) {
    return undefined;
  }
  if (current === 3 && city.type !== "fortified_city") {
    return 5;
  }
  return current + 1;
}

function createGatherTask(city, dimension, slot) {
  const resource = getNeededResource(city);
  const offset = getGatherOffset(resource, slot, city);
  const raw = addVec(city.center, offset);
  const y = findWorkY(dimension, raw, city.center.y);
  return {
    kind: "gather",
    label: resource === "food" ? "Builder - Harvesting" : "Builder - Gathering",
    resource,
    amount: resource === "iron" ? 1 : 4,
    target: standNear({ x: raw.x, y, z: raw.z }, y)
  };
}

function getNeededResource(city) {
  const nextStage = getNextBuildStage(city);
  const target = nextStage ? STAGE_COSTS[nextStage] : DETAIL_COST;
  for (const resource of ["wood", "stone", "food", "iron"]) {
    if (Number(city.resources?.[resource] || 0) < Number(target?.[resource] || 0)) {
      return resource;
    }
  }
  return "food";
}

function getGatherOffset(resource, slot, city) {
  const spread = 10 + slot * 4;
  if (resource === "wood") {
    return { x: -24 - slot * 3, y: 0, z: spread };
  }
  if (resource === "stone" || resource === "iron") {
    return { x: 24 + slot * 3, y: 0, z: 22 + slot * 2 };
  }
  const detail = Number(city.builderState?.completedDetails || 0);
  return { x: -18 - (detail % 3) * 4, y: 0, z: -20 - slot * 4 };
}

function createDetailProject(city, dimension) {
  const index = Number(city.builderState?.completedDetails || 0);
  const pattern = index % 5;
  const raw = addVec(city.center, detailOffset(index));
  const y = findWorkY(dimension, raw, city.center.y);
  const base = floorVec({ x: raw.x, y, z: raw.z });

  if (pattern === 0) {
    return {
      cost: { stone: 2 },
      blocks: roadPatch(base)
    };
  }
  if (pattern === 1) {
    return {
      cost: { wood: 2, stone: 1 },
      blocks: lampPost(base)
    };
  }
  if (pattern === 2) {
    return {
      cost: { food: 1, wood: 1 },
      blocks: gardenPatch(base)
    };
  }
  if (pattern === 3) {
    return {
      cost: { wood: 4 },
      blocks: builderFrame(base)
    };
  }
  return {
    cost: { wood: 2, stone: 2 },
    blocks: marketCrates(base)
  };
}

function detailOffset(index) {
  const ring = 16 + (index % 4) * 8;
  const side = Math.floor(index / 4) % 4;
  const along = ((index * 11) % 31) - 15;
  if (side === 0) {
    return { x: along, y: 0, z: -ring };
  }
  if (side === 1) {
    return { x: ring, y: 0, z: along };
  }
  if (side === 2) {
    return { x: along, y: 0, z: ring };
  }
  return { x: -ring, y: 0, z: along };
}

function roadPatch(base) {
  const y = base.y - 1;
  return [
    block(base.x - 1, y, base.z, "minecraft:cobblestone"),
    block(base.x, y, base.z, "minecraft:gravel"),
    block(base.x + 1, y, base.z, "minecraft:cobblestone"),
    block(base.x, y, base.z - 1, "minecraft:gravel"),
    block(base.x, y, base.z + 1, "minecraft:gravel")
  ];
}

function lampPost(base) {
  return [
    block(base.x, base.y, base.z, "minecraft:oak_fence"),
    block(base.x, base.y + 1, base.z, "minecraft:oak_fence"),
    block(base.x, base.y + 2, base.z, "minecraft:torch")
  ];
}

function gardenPatch(base) {
  const blocks = [];
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      blocks.push(block(base.x + x, base.y - 1, base.z + z, "minecraft:farmland"));
      blocks.push(block(base.x + x, base.y, base.z + z, "minecraft:wheat"));
    }
  }
  return blocks;
}

function builderFrame(base) {
  return [
    block(base.x - 1, base.y, base.z - 1, "minecraft:oak_log"),
    block(base.x + 1, base.y, base.z - 1, "minecraft:oak_log"),
    block(base.x - 1, base.y, base.z + 1, "minecraft:oak_log"),
    block(base.x + 1, base.y, base.z + 1, "minecraft:oak_log"),
    block(base.x - 1, base.y + 1, base.z - 1, "minecraft:oak_planks"),
    block(base.x, base.y + 1, base.z - 1, "minecraft:oak_planks"),
    block(base.x + 1, base.y + 1, base.z - 1, "minecraft:oak_planks")
  ];
}

function marketCrates(base) {
  return [
    block(base.x, base.y, base.z, "minecraft:barrel"),
    block(base.x + 1, base.y, base.z, "minecraft:hay_block"),
    block(base.x, base.y, base.z + 1, "minecraft:oak_planks")
  ];
}

function createPlaceBlockTask(projectBlock) {
  return {
    kind: "place_block",
    label: "Builder - Building",
    location: projectBlock.location,
    blockType: projectBlock.blockType,
    force: projectBlock.force,
    target: standNear(projectBlock.location, projectBlock.location.y + 1)
  };
}

function block(x, y, z, blockType, force = false) {
  return {
    location: { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) },
    blockType,
    force
  };
}

function findMatureCrop(city, dimension, brain) {
  const radius = CROP_SCAN_RADIUS;
  const diameter = radius * 2 + 1;
  const yLevels = 7;
  const total = diameter * diameter * yLevels;
  const cursor = brain.cropCursor || 0;

  for (let checked = 0; checked < CROP_SCAN_CHECKS; checked++) {
    const index = (cursor + checked) % total;
    const x = Math.floor(city.center.x - radius + (index % diameter));
    const z = Math.floor(city.center.z - radius + (Math.floor(index / diameter) % diameter));
    const y = Math.floor(city.center.y - 3 + Math.floor(index / (diameter * diameter)));
    try {
      const blockAtLocation = dimension.getBlock({ x, y, z });
      if (!blockAtLocation) {
        continue;
      }
      const crop = detectCrop(blockAtLocation);
      if (crop?.mature && crop.state) {
        brain.cropCursor = (index + 1) % total;
        return {
          location: { x, y, z },
          stateName: crop.state.name,
          replantValue: crop.definition.replantedStateValue
        };
      }
    } catch (_error) {
      // Unloaded or protected chunks can throw. Continue with the next candidate.
    }
  }

  brain.cropCursor = (cursor + CROP_SCAN_CHECKS) % total;
  return undefined;
}

function harvestCrop(city, dimension, crop) {
  try {
    const blockAtLocation = dimension.getBlock(crop.location);
    if (!blockAtLocation) {
      return false;
    }
    const cropInfo = detectCrop(blockAtLocation);
    if (!cropInfo?.mature || !cropInfo.state) {
      return false;
    }
    const replanted = blockAtLocation.permutation.withState(cropInfo.state.name, cropInfo.definition.replantedStateValue);
    if (typeof blockAtLocation.trySetPermutation === "function") {
      if (!blockAtLocation.trySetPermutation(replanted)) {
        return false;
      }
    } else {
      blockAtLocation.setPermutation(replanted);
    }
    addResource(city, "food", 3);
    city.builderState.harvestedCrops = Number(city.builderState.harvestedCrops || 0) + 1;
    city.builderState.lastWorkTick = system.currentTick;
    updateCity(city);
    playWorkParticle(dimension, crop.location, "minecraft:crop_growth_emitter");
    return true;
  } catch (error) {
    recordModuleError("city_builders", error);
    return false;
  }
}

function addResource(city, resource, amount) {
  city.resources = city.resources || {};
  city.resources[resource] = Number(city.resources[resource] || 0) + Number(amount || 0);
}

function canAfford(city, cost) {
  for (const [resource, amount] of Object.entries(cost || {})) {
    if (Number(city.resources?.[resource] || 0) < Number(amount || 0)) {
      return false;
    }
  }
  return true;
}

function spendResources(city, cost) {
  city.resources = city.resources || {};
  for (const [resource, amount] of Object.entries(cost || {})) {
    city.resources[resource] = Math.max(0, Number(city.resources[resource] || 0) - Number(amount || 0));
  }
}

function moveToward(entity, target, dimension) {
  const current = entity.location;
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const dz = target.z - current.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (distance <= MOVE_STEP) {
    teleportEntity(entity, target, dimension);
    return true;
  }
  const next = {
    x: current.x + (dx / distance) * MOVE_STEP,
    y: current.y + (dy / distance) * Math.min(MOVE_STEP, Math.abs(dy) || MOVE_STEP),
    z: current.z + (dz / distance) * MOVE_STEP
  };
  teleportEntity(entity, next, dimension, target);
  return false;
}

function teleportEntity(entity, location, dimension, facingLocation = undefined) {
  try {
    entity.teleport(location, { dimension, facingLocation });
  } catch (_error) {
    try {
      entity.teleport(location, { dimension });
    } catch (__error) {
      // Best effort movement only.
    }
  }
}

function findSpawnLocation(dimension, city, slot) {
  const offset = BUILDER_SPAWN_OFFSETS[slot] || BUILDER_SPAWN_OFFSETS[0];
  const raw = addVec(city.center, offset);
  const y = findWorkY(dimension, raw, city.center.y);
  return {
    x: raw.x + 0.5,
    y,
    z: raw.z + 0.5
  };
}

function findWorkY(dimension, raw, fallbackY) {
  const x = Math.floor(raw.x);
  const z = Math.floor(raw.z);
  const startY = Math.floor(raw.y || fallbackY || 64);
  for (let y = startY + 5; y >= startY - 8; y--) {
    try {
      const ground = dimension.getBlock({ x, y, z });
      const feet = dimension.getBlock({ x, y: y + 1, z });
      if (ground && !ground.isAir && !ground.isLiquid && feet && feet.isAir) {
        return y + 1;
      }
    } catch (_error) {
      return startY + 1;
    }
  }
  return startY + 1;
}

function standNear(location, y) {
  return {
    x: Math.floor(location.x) + 0.5,
    y: y,
    z: Math.floor(location.z) + 0.5
  };
}

function playWorkParticle(dimension, location, particle) {
  if (!requestParticles("city_builders", 1)) {
    return;
  }
  try {
    dimension.spawnParticle(particle, {
      x: location.x + 0.5,
      y: location.y + 0.6,
      z: location.z + 0.5
    });
  } catch (_error) {
    try {
      dimension.spawnParticle("minecraft:basic_smoke_particle", location);
    } catch (__error) {
      // Particle support varies by platform.
    }
  }
}

function setBuilderLabel(builder, label) {
  try {
    builder.nameTag = label;
  } catch (_error) {
    // Name tags are cosmetic only.
  }
}

function cityTag(city) {
  return `wu_city_${String(city.cityId || "unknown").replace(/[^A-Za-z0-9_]/g, "_").slice(0, 80)}`;
}

function slotTag(slot) {
  return `wu_builder_slot_${slot}`;
}

function entityHasTag(entity, tag) {
  try {
    if (typeof entity.hasTag === "function") {
      return entity.hasTag(tag);
    }
    if (typeof entity.getTags === "function") {
      return entity.getTags().includes(tag);
    }
  } catch (_error) {
    return false;
  }
  return false;
}

function isEntityUsable(entity) {
  try {
    if (!entity) {
      return false;
    }
    if (typeof entity.isValid === "function") {
      return entity.isValid();
    }
    return entity.isValid !== false && Boolean(entity.location);
  } catch (_error) {
    return false;
  }
}

function normalizeDimensionId(id) {
  if (id === "overworld") {
    return "minecraft:overworld";
  }
  if (id === "nether") {
    return "minecraft:nether";
  }
  if (id === "the_end") {
    return "minecraft:the_end";
  }
  return id || "minecraft:overworld";
}

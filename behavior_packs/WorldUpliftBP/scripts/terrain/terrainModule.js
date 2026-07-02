import { Logger } from "../utils/logger.js";
import { initAmbientParticleController } from "./ambientParticleController.js";
import { initLandmarkRegistry } from "./landmarkRegistry.js";
import { initPostGenerationDecorators } from "./postGenDecorator.js";
import { TERRAIN_CONFIG } from "./terrainConfig.js";

let initialized = false;

export function initTerrainUpliftModule() {
  if (initialized) {
    return;
  }
  initialized = true;
  initLandmarkRegistry();
  initPostGenerationDecorators();
  initAmbientParticleController();
  Logger.info(`Terrain Uplift module initialized profile=${TERRAIN_CONFIG.performanceProfile}.`);
}

export function getTerrainApi() {
  return {
    config: TERRAIN_CONFIG
  };
}

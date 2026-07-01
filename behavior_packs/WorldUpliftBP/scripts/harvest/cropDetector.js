import { Logger } from "../utils/logger.js";
import { getCropDefinition } from "./cropRegistry.js";

export function detectCrop(block) {
  try {
    const definition = getCropDefinition(block.typeId);
    if (!definition) {
      return undefined;
    }
    const state = findGrowthState(block, definition);
    if (!state) {
      Logger.debug(`No known growth state found for ${block.typeId}. Verify Bedrock state names for this version.`);
      return { definition, mature: false, state: undefined, unsupportedState: true };
    }
    return {
      definition,
      mature: Number(state.value) >= Number(definition.matureStateValue),
      state,
      unsupportedState: false
    };
  } catch (error) {
    Logger.debug(`Crop detection failed: ${error}`);
    return undefined;
  }
}

export function findGrowthState(block, definition) {
  for (const stateName of definition.matureStateNames) {
    try {
      const value = block.permutation.getState(stateName);
      if (value !== undefined) {
        return { name: stateName, value };
      }
    } catch (_error) {
      // Try next possible state name.
    }
  }
  return undefined;
}


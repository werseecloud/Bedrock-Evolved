import { ActionFormData } from "@minecraft/server-ui";
import { getMinimapState } from "../minimapUiState.js";
import { saveMinimapSettings } from "../minimapStorage.js";
import { openFullscreenMap } from "../minimapFullscreenController.js";

const LAYERS = ["deaths", "waypoints", "temp", "players", "mobs", "cities", "landmarks"];

export function setLayerEnabled(player, layer, enabled) {
  const state = getMinimapState(player);
  if (!state.layers) state.layers = {};
  state.layers[layer] = Boolean(enabled);
  saveMinimapSettings(player);
}

export function showLayerSettingsForm(player) {
  const state = getMinimapState(player);
  const form = new ActionFormData()
    .title("Map Layers")
    .body(LAYERS.map((layer) => `${layer}: ${state.layers?.[layer] !== false ? "on" : "off"}`).join("\n"));
  for (const layer of LAYERS) {
    form.button(`Toggle ${layer}`);
  }
  form.button("Back");

  form.show(player).then((response) => {
    if (response.canceled || response.selection === undefined) {
      return;
    }
    if (response.selection >= LAYERS.length) {
      openFullscreenMap(player);
      return;
    }
    const layer = LAYERS[response.selection];
    setLayerEnabled(player, layer, state.layers?.[layer] === false);
    showLayerSettingsForm(player);
  }).catch(() => {});
}

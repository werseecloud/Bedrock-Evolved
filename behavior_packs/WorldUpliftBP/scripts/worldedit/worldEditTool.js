import { CONFIG } from "../config.js";

export function isWorldEditAxeItem(itemStack) {
  if (!itemStack || itemStack.typeId !== CONFIG.worldEdit.axeItemId) {
    return false;
  }
  try {
    return itemStack.nameTag === CONFIG.worldEdit.axeName;
  } catch (_error) {
    return false;
  }
}

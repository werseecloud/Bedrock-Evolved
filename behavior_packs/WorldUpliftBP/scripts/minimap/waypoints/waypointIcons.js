import { VALID_COLORS, VALID_ICONS } from "../minimapConfig.js";

export function normalizeWaypointColor(value) {
  const color = String(value || "").toLowerCase();
  return VALID_COLORS.includes(color) ? color : "gold";
}

export function normalizeWaypointIcon(value) {
  const icon = String(value || "").toLowerCase();
  return VALID_ICONS.includes(icon) ? icon : "custom";
}

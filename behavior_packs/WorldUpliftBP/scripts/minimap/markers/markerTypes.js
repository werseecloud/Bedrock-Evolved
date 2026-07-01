export const MARKER_TYPES = Object.freeze({
  latest_death: { priority: 100, icon: "death", color: "red" },
  old_death: { priority: 90, icon: "death", color: "white" },
  temporary_waypoint: { priority: 85, icon: "temp", color: "cyan" },
  permanent_waypoint: { priority: 80, icon: "custom", color: "gold" },
  raid: { priority: 70, icon: "danger", color: "red" },
  city: { priority: 60, icon: "city", color: "gold" },
  village: { priority: 58, icon: "village", color: "green" },
  landmark: { priority: 55, icon: "custom", color: "purple" },
  player: { priority: 45, icon: "player", color: "white" },
  hostile_mob: { priority: 35, icon: "hostile", color: "red" },
  passive_mob: { priority: 20, icon: "passive", color: "green" },
  nether_portal: { priority: 50, icon: "portal", color: "purple" },
  bed_spawn: { priority: 48, icon: "home", color: "blue" },
  danger_zone: { priority: 65, icon: "danger", color: "orange" }
});

export function createMarker(fields) {
  const typeInfo = MARKER_TYPES[fields.type] || MARKER_TYPES.landmark;
  return {
    markerId: fields.markerId || `${fields.type}_${Math.floor(Math.random() * 99999999)}`,
    ownerPlayerId: fields.ownerPlayerId || "",
    visibility: fields.visibility || "private",
    type: fields.type || "landmark",
    name: fields.name || fields.type || "Marker",
    dimension: fields.dimension || "minecraft:overworld",
    x: Math.floor(fields.x || 0),
    y: Math.floor(fields.y || 64),
    z: Math.floor(fields.z || 0),
    color: fields.color || typeInfo.color,
    icon: fields.icon || typeInfo.icon,
    createdAtTick: fields.createdAtTick || 0,
    expiresAtTick: fields.expiresAtTick,
    priority: fields.priority ?? typeInfo.priority,
    showOnMinimap: fields.showOnMinimap !== false,
    showOnFullscreenMap: fields.showOnFullscreenMap !== false,
    showDistance: fields.showDistance !== false,
    showDirection: fields.showDirection !== false,
    metadata: fields.metadata || {}
  };
}

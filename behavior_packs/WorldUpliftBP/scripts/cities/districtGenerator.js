export const STRUCTURE_SIZES = {
  "city:town_hall": { x: 17, y: 12, z: 17 },
  "city:market_square": { x: 19, y: 5, z: 19 },
  "city:blacksmith_large": { x: 13, y: 8, z: 11 },
  "city:barracks": { x: 15, y: 8, z: 13 },
  "city:warehouse": { x: 15, y: 8, z: 13 },
  "city:house_small_01": { x: 7, y: 6, z: 7 },
  "city:house_small_02": { x: 7, y: 6, z: 9 },
  "city:house_medium_01": { x: 9, y: 7, z: 11 },
  "city:house_large_01": { x: 13, y: 9, z: 13 },
  "city:farm_plot_01": { x: 15, y: 3, z: 15 },
  "city:wall_segment": { x: 9, y: 6, z: 3 },
  "city:wall_gate": { x: 11, y: 8, z: 5 },
  "city:watchtower": { x: 7, y: 12, z: 7 },
  "city:mine_entrance": { x: 11, y: 7, z: 9 }
};

export function getStagePlacements(city, stage) {
  if (stage === 1) {
    return [
      building("town_center", "town_hall", "city:town_hall", -8, 0, -8)
    ];
  }

  if (stage === 2) {
    return [
      building("market", "market_square", "city:market_square", 18, 0, -9),
      building("residential", "house_small_01", "city:house_small_01", -24, 0, -14),
      building("residential", "house_small_02", "city:house_small_02", -34, 0, 8),
      building("residential", "house_medium_01", "city:house_medium_01", 16, 0, 18),
      building("residential", "house_large_01", "city:house_large_01", -4, 0, 26),
      building("market", "blacksmith_large", "city:blacksmith_large", 36, 0, 12)
    ];
  }

  if (stage === 3) {
    return [
      building("farming", "farm_plot_01", "city:farm_plot_01", -48, 0, -32),
      building("farming", "farm_plot_01", "city:farm_plot_01", -48, 0, -12),
      building("storage", "warehouse", "city:warehouse", 34, 0, -30)
    ];
  }

  if (stage === 4 && city.type === "fortified_city") {
    return [
      building("walls", "wall_gate", "city:wall_gate", -5, 0, -54),
      building("walls", "wall_segment", "city:wall_segment", -34, 0, -54),
      building("walls", "wall_segment", "city:wall_segment", 25, 0, -54),
      building("walls", "wall_segment", "city:wall_segment", -54, 0, -20),
      building("walls", "wall_segment", "city:wall_segment", 54, 0, -20),
      building("walls", "wall_segment", "city:wall_segment", -54, 0, 24),
      building("walls", "wall_segment", "city:wall_segment", 54, 0, 24),
      building("walls", "watchtower", "city:watchtower", -58, 0, -58),
      building("walls", "watchtower", "city:watchtower", 52, 0, -58),
      building("walls", "watchtower", "city:watchtower", -58, 0, 52),
      building("walls", "watchtower", "city:watchtower", 52, 0, 52)
    ];
  }

  if (stage === 5) {
    return [
      building("military", "barracks", "city:barracks", 10, 0, -42),
      building("mining", "mine_entrance", "city:mine_entrance", 52, 0, 36)
    ];
  }

  return [];
}

export function getDistrictForType(cityType) {
  if (cityType === "mining_city") {
    return ["town_center", "residential", "market", "mining", "storage"];
  }
  if (cityType === "farming_city") {
    return ["town_center", "residential", "market", "farming", "storage"];
  }
  if (cityType === "trade_capital") {
    return ["town_center", "market", "storage", "residential", "military"];
  }
  if (cityType === "fortified_city") {
    return ["town_center", "residential", "market", "military", "walls", "storage"];
  }
  return ["town_center", "residential", "market", "farming"];
}

function building(district, name, identifier, x, y, z) {
  return {
    district,
    name,
    identifier,
    offset: { x, y, z },
    size: STRUCTURE_SIZES[identifier] || { x: 9, y: 6, z: 9 }
  };
}

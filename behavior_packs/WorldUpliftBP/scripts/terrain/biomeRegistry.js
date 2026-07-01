export const TERRAIN_BIOMES = Object.freeze([
  {
    id: "be:alpine_peaks",
    style: "alpine",
    fog: "be:alpine_peaks_fog",
    snowY: 128,
    palette: ["minecraft:stone", "minecraft:andesite", "minecraft:calcite", "minecraft:snow"]
  },
  {
    id: "be:alpine_foothills",
    style: "foothills",
    fog: "be:alpine_peaks_fog",
    snowY: 150,
    palette: ["minecraft:stone", "minecraft:grass_block", "minecraft:coarse_dirt", "minecraft:gravel"]
  },
  {
    id: "be:shattered_cliffs",
    style: "cliffs",
    fog: "be:shattered_cliffs_fog",
    snowY: 170,
    palette: ["minecraft:deepslate", "minecraft:tuff", "minecraft:basalt", "minecraft:gravel"]
  },
  {
    id: "be:deep_valleys",
    style: "valley",
    fog: "be:deep_valleys_fog",
    snowY: 999,
    palette: ["minecraft:moss_block", "minecraft:mossy_cobblestone", "minecraft:clay", "minecraft:water"]
  },
  {
    id: "be:old_growth_highlands",
    style: "old_growth",
    fog: "be:old_growth_highlands_fog",
    snowY: 150,
    palette: ["minecraft:podzol", "minecraft:rooted_dirt", "minecraft:moss_block", "minecraft:spruce_log"]
  },
  {
    id: "be:highland_groves",
    style: "grove",
    fog: "be:old_growth_highlands_fog",
    snowY: 160,
    palette: ["minecraft:grass_block", "minecraft:podzol", "minecraft:oak_log", "minecraft:moss_block"]
  },
  {
    id: "be:crater_lake",
    style: "crater",
    fog: "be:deep_valleys_fog",
    snowY: 160,
    palette: ["minecraft:tuff", "minecraft:blackstone", "minecraft:basalt", "minecraft:water"]
  },
  {
    id: "be:coastal_cliffs",
    style: "coast",
    fog: "be:coastal_cliffs_fog",
    snowY: 999,
    palette: ["minecraft:stone", "minecraft:gravel", "minecraft:sandstone", "minecraft:calcite"]
  },
  {
    id: "be:hot_springs",
    style: "hot_springs",
    fog: "be:hot_springs_fog",
    snowY: 150,
    palette: ["minecraft:smooth_basalt", "minecraft:stone", "minecraft:water", "minecraft:calcite"]
  },
  {
    id: "be:forest_edge",
    style: "forest_edge",
    fog: "be:old_growth_highlands_fog",
    snowY: 999,
    palette: ["minecraft:grass_block", "minecraft:coarse_dirt", "minecraft:oak_log", "minecraft:azalea_leaves"]
  }
]);

export function getTerrainBiomeStyle(location) {
  const y = Math.floor(location.y || 64);
  if (y >= 150) {
    return TERRAIN_BIOMES[0];
  }
  if (y >= 112) {
    return TERRAIN_BIOMES[1];
  }
  if (y <= 50) {
    return TERRAIN_BIOMES[3];
  }
  return TERRAIN_BIOMES[Math.abs(Math.floor(location.x / 512) + Math.floor(location.z / 512)) % TERRAIN_BIOMES.length];
}

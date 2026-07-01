import { hashString, mulberry32, choice } from "../utils/random.js";

const MOUNTAIN_STRUCTURES = [
  "lod:mountain_silhouette_01",
  "lod:mountain_silhouette_02",
  "lod:mountain_silhouette_03",
  "lod:far_cliff_wall_01",
  "lod:far_peak_snowcap_01"
];

const CITY_STRUCTURES = [
  "lod:far_city_skyline_01",
  "lod:far_city_skyline_02",
  "lod:far_castle_silhouette_01"
];

const OTHER_STRUCTURES = {
  forest: "lod:far_forest_band_01",
  ruin: "lod:distant_ruin_silhouette_01",
  castle: "lod:far_castle_silhouette_01",
  valley: "lod:far_cliff_wall_01"
};

export function createLandmarkRecord(type, approximateX, approximateZ, options = {}) {
  const seed = hashString(`${type}:${Math.floor(approximateX / 32)}:${Math.floor(approximateZ / 32)}`);
  const random = mulberry32(seed);
  const biomeStyle = options.biomeStyle || chooseBiomeStyle(type, random);
  const heightClass = options.heightClass || chooseHeightClass(type, random);
  const impostorStructure = options.impostorStructure || chooseStructure(type, random);

  return {
    landmarkId: `lod_${type}_${Math.floor(approximateX / 16)}_${Math.floor(approximateZ / 16)}`,
    type,
    approximateX: Math.floor(approximateX),
    approximateZ: Math.floor(approximateZ),
    heightClass,
    biomeStyle,
    visualPriority: options.visualPriority ?? Math.floor(random() * 100),
    discoveredByPlayer: options.discoveredByPlayer || false,
    impostorStructure,
    activeImpostorEntityOrStructureId: "",
    convertedToReal: false
  };
}

export function chooseStructure(type, random) {
  if (type === "mountain" || type === "volcano") {
    return choice(random, MOUNTAIN_STRUCTURES);
  }
  if (type === "city") {
    return choice(random, CITY_STRUCTURES);
  }
  return OTHER_STRUCTURES[type] || "lod:mountain_silhouette_01";
}

function chooseBiomeStyle(type, random) {
  if (type === "city" || type === "castle") {
    return "city_plains";
  }
  if (type === "forest") {
    return "old_growth_highlands";
  }
  if (type === "ruin") {
    return random() > 0.5 ? "ancient_ruins" : "deep_valleys";
  }
  return random() > 0.55 ? "alpine_peaks" : "shattered_cliffs";
}

function chooseHeightClass(type, random) {
  if (type === "mountain" || type === "volcano") {
    return random() > 0.45 ? "high" : "extreme";
  }
  if (type === "city" || type === "castle") {
    return "medium";
  }
  return random() > 0.5 ? "low" : "medium";
}


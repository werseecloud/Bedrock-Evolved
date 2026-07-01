import { getCities } from "../cities/cityRegistry.js";
import { LODConfig } from "./lodConfig.js";
import { createLandmarkRecord } from "./impostorGenerator.js";
import { upsertLandmark } from "./lodRegistry.js";

export function syncCitySkylineRecords(player) {
  if (!LODConfig.LOD_CITY_SKYLINES_ENABLED) {
    return [];
  }

  const records = [];
  const px = player.location.x;
  const pz = player.location.z;
  const minDistance = LODConfig.LOD_NEAR_RADIUS_CHUNKS * 16;
  const maxDistance = LODConfig.LOD_SKYLINE_RADIUS_CHUNKS * 16;

  for (const city of getCities()) {
    const dx = city.center.x - px;
    const dz = city.center.z - pz;
    const distance = Math.sqrt(dx * dx + dz * dz);
    if (distance < minDistance || distance > maxDistance) {
      continue;
    }
    const record = createLandmarkRecord("city", city.center.x, city.center.z, {
      biomeStyle: "city_plains",
      heightClass: city.type === "fortified_city" ? "high" : "medium",
      visualPriority: 90,
      impostorStructure: city.type === "fortified_city" ? "lod:far_castle_silhouette_01" : "lod:far_city_skyline_01"
    });
    record.landmarkId = `lod_city_${city.cityId}`;
    record.sourceCityId = city.cityId;
    records.push(upsertLandmark(record));
  }

  return records;
}


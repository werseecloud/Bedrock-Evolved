import { hashString, mulberry32, choice } from "../utils/random.js";
import { LODConfig } from "./lodConfig.js";
import { createLandmarkRecord } from "./impostorGenerator.js";
import { upsertLandmark } from "./lodRegistry.js";

const DIRECTIONS = [
  { x: 1, z: 0 },
  { x: -1, z: 0 },
  { x: 0, z: 1 },
  { x: 0, z: -1 },
  { x: 1, z: 1 },
  { x: -1, z: 1 },
  { x: 1, z: -1 },
  { x: -1, z: -1 }
];

const TYPES = ["mountain", "mountain", "forest", "ruin", "valley"];

export function seedSkylineRecordsForPlayer(player) {
  const chunkX = Math.floor(player.location.x / 16);
  const chunkZ = Math.floor(player.location.z / 16);
  const random = mulberry32(hashString(`${player.name}:${Math.floor(chunkX / 8)}:${Math.floor(chunkZ / 8)}`));
  const count = LODConfig.PERFORMANCE_MODE === "performance" ? 2 : 4;
  const seeded = [];

  for (let i = 0; i < count; i++) {
    const direction = choice(random, DIRECTIONS);
    const ringChunks = LODConfig.LOD_DISTANT_RADIUS_CHUNKS + Math.floor(random() * Math.max(4, LODConfig.LOD_SKYLINE_RADIUS_CHUNKS - LODConfig.LOD_DISTANT_RADIUS_CHUNKS));
    const offsetX = Math.floor(direction.x * ringChunks * 16 + (random() - 0.5) * 128);
    const offsetZ = Math.floor(direction.z * ringChunks * 16 + (random() - 0.5) * 128);
    const type = choice(random, TYPES);
    const record = createLandmarkRecord(type, player.location.x + offsetX, player.location.z + offsetZ, {
      visualPriority: Math.floor(40 + random() * 60)
    });
    seeded.push(upsertLandmark(record));
  }

  return seeded;
}


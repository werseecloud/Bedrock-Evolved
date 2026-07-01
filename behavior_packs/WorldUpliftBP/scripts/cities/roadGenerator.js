import { enqueueSetBlock } from "./structurePlacer.js";

export function queueRoadGrid(city, dimension) {
  const center = city.center;
  queueRoadLine(dimension, { x: center.x - 48, y: center.y - 1, z: center.z }, { x: center.x + 48, y: center.y - 1, z: center.z }, 3);
  queueRoadLine(dimension, { x: center.x, y: center.y - 1, z: center.z - 48 }, { x: center.x, y: center.y - 1, z: center.z + 48 }, 3);
  queueRoadLine(dimension, { x: center.x - 34, y: center.y - 1, z: center.z - 22 }, { x: center.x + 36, y: center.y - 1, z: center.z - 22 }, 3);
  queueRoadLine(dimension, { x: center.x - 34, y: center.y - 1, z: center.z + 22 }, { x: center.x + 36, y: center.y - 1, z: center.z + 22 }, 3);
}

export function queueRoadToBuilding(city, dimension, buildingOrigin) {
  const center = city.center;
  queueRoadLine(dimension, { x: center.x, y: center.y - 1, z: center.z }, { x: buildingOrigin.x, y: center.y - 1, z: center.z }, 3);
  queueRoadLine(dimension, { x: buildingOrigin.x, y: center.y - 1, z: center.z }, { x: buildingOrigin.x, y: center.y - 1, z: buildingOrigin.z }, 3);
}

export function queueRoadLine(dimension, from, to, width = 3) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const steps = Math.max(Math.abs(dx), Math.abs(dz), 1);
  const half = Math.floor(width / 2);

  for (let i = 0; i <= steps; i++) {
    const x = Math.round(from.x + (dx * i) / steps);
    const z = Math.round(from.z + (dz * i) / steps);
    for (let wx = -half; wx <= half; wx++) {
      for (let wz = -half; wz <= half; wz++) {
        if (Math.abs(wx) + Math.abs(wz) <= half + 1) {
          const edge = Math.abs(wx) === half || Math.abs(wz) === half;
          enqueueSetBlock(dimension, { x: x + wx, y: from.y, z: z + wz }, edge ? "minecraft:cobblestone" : "minecraft:gravel");
        }
      }
    }
  }
}


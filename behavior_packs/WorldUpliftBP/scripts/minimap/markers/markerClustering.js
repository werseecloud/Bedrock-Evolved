import { distance2D } from "../../utils/vectors.js";

export function clusterMarkers(markers, mergeDistance = 5) {
  const remaining = new Set(markers);
  const output = [];
  for (const marker of markers) {
    if (!remaining.has(marker)) {
      continue;
    }
    remaining.delete(marker);
    const group = [marker];
    for (const other of [...remaining]) {
      if (marker.dimension === other.dimension && distance2D(marker, other) <= mergeDistance) {
        remaining.delete(other);
        group.push(other);
      }
    }
    if (group.length <= 2) {
      output.push(...group);
    } else {
      output.push({
        ...marker,
        markerId: `cluster_${marker.markerId}`,
        type: "cluster",
        name: `${group.length} markers`,
        icon: "cluster",
        priority: Math.max(...group.map((item) => item.priority || 0)),
        metadata: { clusterCount: group.length, markers: group.map((item) => item.markerId) }
      });
    }
  }
  return output;
}

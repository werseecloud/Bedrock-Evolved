import { distance2D } from "../../utils/vectors.js";

export function formatDistanceToMarker(player, marker) {
  if (!marker) {
    return "no marker";
  }
  if (marker.dimension !== player.dimension.id) {
    return `another dimension (${marker.dimension})`;
  }
  return `${Math.floor(distance2D(player.location, marker))}m`;
}

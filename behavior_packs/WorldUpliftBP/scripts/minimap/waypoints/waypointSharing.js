export function canShareWaypoint(marker) {
  return marker?.visibility === "team" || marker?.visibility === "public";
}

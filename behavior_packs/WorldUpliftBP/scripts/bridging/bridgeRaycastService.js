export function getViewBlock(player, maxDistance) {
  try {
    return player.getBlockFromViewDirection({ maxDistance, includeLiquidBlocks: false, includePassableBlocks: false });
  } catch (_error) {
    return undefined;
  }
}


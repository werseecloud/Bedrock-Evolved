export function floorVec(location) {
  return {
    x: Math.floor(location.x),
    y: Math.floor(location.y),
    z: Math.floor(location.z)
  };
}

export function addVec(a, b) {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z
  };
}

export function offsetVec(location, x, y, z) {
  return {
    x: location.x + x,
    y: location.y + y,
    z: location.z + z
  };
}

export function distance2D(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function locationKey(location) {
  const p = floorVec(location);
  return `${p.x},${p.y},${p.z}`;
}

export function chunkKey(location) {
  return `${Math.floor(location.x / 16)},${Math.floor(location.z / 16)}`;
}

export function rotateOffset(offset, quarterTurns) {
  const turns = ((quarterTurns % 4) + 4) % 4;
  if (turns === 1) {
    return { x: -offset.z, y: offset.y, z: offset.x };
  }
  if (turns === 2) {
    return { x: -offset.x, y: offset.y, z: -offset.z };
  }
  if (turns === 3) {
    return { x: offset.z, y: offset.y, z: -offset.x };
  }
  return { ...offset };
}

export function subtract(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z
  };
}

export function horizontalLength(vector) {
  return Math.sqrt(vector.x * vector.x + vector.z * vector.z);
}

export function normalize2D(vector) {
  const length = horizontalLength(vector);
  if (length <= 0.00001) {
    return { x: 0, z: 0 };
  }
  return {
    x: vector.x / length,
    z: vector.z / length
  };
}

export function yawToForward(yawDegrees) {
  const radians = (yawDegrees * Math.PI) / 180;
  return {
    x: -Math.sin(radians),
    z: Math.cos(radians)
  };
}

export function rightFromForward(forward) {
  return {
    x: forward.z,
    z: -forward.x
  };
}

export function dot2D(a, b) {
  return a.x * b.x + a.z * b.z;
}

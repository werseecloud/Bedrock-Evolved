export function sortMarkersByPriority(markers) {
  return [...markers].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return String(a.name).localeCompare(String(b.name));
  });
}

export const MINIMAP_UI_CONFIG = {
  enabledByDefault: true,
  defaultPosition: "top_right",
  defaultSize: "normal",
  defaultMode: "rotating",
  defaultProfile: "balanced",
  itemId: "be:minimap_settings",
  itemName: "Minimap Settings",

  smallMap: {
    enabled: true,
    fallbackToActionbar: true,
    width: 128,
    height: 128,
    marginTop: 12,
    marginRight: 12,
    opacity: 0.82,
    showExpandIcon: true,
    showCoordinates: true,
    updateIntervalTicks: 10,
    defaultGridSize: 13
  },

  fullscreenMap: {
    enabled: true,
    pauseSmallMap: true,
    defaultGridSize: 25,
    updateIntervalTicks: 15,
    showLegend: true,
    showWaypointNames: true,
    showCityNames: true,
    showCoordinates: true,
    showDimension: true
  },

  settings: {
    useForms: true,
    useItem: true,
    allowScripteventFallback: true
  },

  profiles: {
    performance: { smallGrid: 9, fullscreenGrid: 17, updateIntervalTicks: 20, markerCap: 16 },
    balanced: { smallGrid: 13, fullscreenGrid: 25, updateIntervalTicks: 10, markerCap: 32 },
    cinematic: { smallGrid: 15, fullscreenGrid: 33, updateIntervalTicks: 8, markerCap: 48 },
    server: { smallGrid: 7, fullscreenGrid: 13, updateIntervalTicks: 30, markerCap: 10 }
  },

  safety: {
    disableScanningWhenMapOff: true,
    disableScanningWhenPlayerOffline: true,
    fallbackToTextGrid: true,
    fallbackToLocator: true
  },

  markers: {
    enabled: true,
    maxMarkersOnMinimap: 24,
    maxMarkersOnFullscreen: 128,
    edgeArrows: true,
    clustering: true,
    showDistanceLabels: true,
    showDirectionArrows: true
  },

  deathMarkers: {
    enabled: true,
    latestDeath: true,
    deathHistory: true,
    maxHistory: 5,
    showDistance: true,
    showDirection: true,
    showTimer: true,
    showReason: true,
    autoClearOnReturn: false,
    autoClearRadius: 6,
    dimensionWarning: true
  },

  deathBeacon: {
    enabled: true,
    mode: "particle_beam",
    activeRadius: 160,
    durationTicks: 36000,
    pulseIntervalTicks: 20,
    beamHeight: 80,
    particlesPerPulse: 24,
    cleanupOnDeathClear: true,
    onlyShowOwnDeath: true,
    showTeamDeaths: false,
    showPublicDeaths: false
  },

  waypoints: {
    enabled: true,
    maxPerPlayer: 32,
    defaultVisibility: "private",
    allowPublicWaypoints: true,
    allowTeamWaypoints: true,
    allowRename: true,
    allowColors: true,
    allowIcons: true
  },

  temporaryWaypoints: {
    enabled: true,
    defaultLifetimeTicks: 12000,
    maxTemporaryWaypoints: 8,
    allowRightClickCreate: true,
    fallbackCursorMode: true,
    fadeBeforeExpireTicks: 1200,
    pulseMarker: true
  },

  fullscreenInput: {
    rightClickTemporaryWaypoint: true,
    leftClickMarkerInfo: true,
    cursorFallback: true,
    formFallback: true
  }
};

export const DEFAULT_LAYERS = Object.freeze({
  deaths: true,
  waypoints: true,
  temp: true,
  players: true,
  mobs: true,
  cities: true,
  landmarks: true,
  entities: true
});

export const VALID_POSITIONS = Object.freeze(["top_right", "top_left", "bottom_right", "bottom_left"]);
export const VALID_SIZES = Object.freeze(["small", "normal", "large"]);
export const VALID_PROFILES = Object.freeze(["performance", "balanced", "cinematic", "server"]);
export const VALID_COLORS = Object.freeze(["red", "blue", "green", "gold", "purple", "white", "cyan", "orange"]);
export const VALID_ICONS = Object.freeze(["home", "mine", "village", "city", "danger", "portal", "loot", "death", "custom"]);

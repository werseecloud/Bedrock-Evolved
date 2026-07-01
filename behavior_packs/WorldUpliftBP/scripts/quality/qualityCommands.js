import { CONFIG } from "../config.js";
import { Logger } from "../utils/logger.js";
import { canUseAdminCommand } from "../utils/permissions.js";

const PROFILES = {
  survival: {
    betterMending: true,
    bridging: true,
    clumps: true,
    clumpsInterval: 20,
    clumpsRadius: 24,
    approximateClumps: false,
    bridgePreview: false,
    actionbar: false
  },
  performance: {
    betterMending: true,
    bridging: true,
    clumps: true,
    clumpsInterval: 60,
    clumpsRadius: 14,
    approximateClumps: false,
    bridgePreview: false,
    actionbar: false
  },
  qol: {
    betterMending: true,
    bridging: true,
    clumps: true,
    clumpsInterval: 20,
    clumpsRadius: 28,
    approximateClumps: true,
    bridgePreview: true,
    actionbar: true
  }
};

export function handleQualityCommand(source, id, args) {
  const command = id.replace("qm:", "");
  if (command === "status") {
    tellStatus(source);
    return;
  }

  if (!canUseAdminCommand(source)) {
    Logger.tell(source, "You do not have permission to change Quality Mechanics settings.");
    return;
  }

  if (command === "all") {
    setAllEnabled(args[0] !== "off");
    Logger.tell(source, `Quality Mechanics ${CONFIG.betterMending.enabled ? "enabled" : "disabled"}.`);
    return;
  }
  if (command === "profile") {
    applyProfile(source, args[0] || "survival");
    return;
  }
  if (command === "debug") {
    const enabled = parseToggle(args[0], !CONFIG.debug);
    CONFIG.debug = enabled;
    CONFIG.clumps.debug = enabled;
    Logger.setDebug(enabled);
    Logger.tell(source, `Quality Mechanics debug ${enabled ? "enabled" : "disabled"}.`);
    return;
  }
  if (command === "mending") {
    handleMendingCommand(source, args);
    return;
  }
  if (command === "bridging") {
    handleBridgingCommand(source, args);
    return;
  }
  if (command === "clumps") {
    handleClumpsCommand(source, args);
    return;
  }

  Logger.tell(source, "Unknown Quality command. Use status, all, profile, debug, mending, bridging, or clumps.");
}

function handleMendingCommand(source, args) {
  const action = args[0] || "status";
  if (action === "on" || action === "off") {
    CONFIG.betterMending.enabled = action === "on";
    Logger.tell(source, `Better Than Mending ${CONFIG.betterMending.enabled ? "enabled" : "disabled"}.`);
    return;
  }
  if (action === "status") {
    Logger.tell(source, formatMendingStatus());
    return;
  }
  if (action === "cost") {
    CONFIG.betterMending.xpCostPerDurability = clampInteger(args[1], 1, 100, CONFIG.betterMending.xpCostPerDurability);
    Logger.tell(source, `Better Than Mending XP cost is ${CONFIG.betterMending.xpCostPerDurability} per durability.`);
    return;
  }
  if (action === "max") {
    CONFIG.betterMending.maxRepairPerUse = clampInteger(args[1], 1, 2048, CONFIG.betterMending.maxRepairPerUse);
    Logger.tell(source, `Better Than Mending max repair is ${CONFIG.betterMending.maxRepairPerUse}.`);
    return;
  }
  if (action === "require_mending") {
    CONFIG.betterMending.requireMendingEnchant = parseToggle(args[1], true);
    Logger.tell(source, `Mending enchant requirement ${CONFIG.betterMending.requireMendingEnchant ? "enabled" : "disabled"}.`);
    return;
  }
  if (action === "xpbottle") {
    CONFIG.betterMending.allowXpBottleFallback = parseToggle(args[1], true);
    Logger.tell(source, `XP bottle fallback ${CONFIG.betterMending.allowXpBottleFallback ? "enabled" : "disabled"}.`);
    return;
  }
  Logger.tell(source, "Unknown mending action. Use on, off, status, cost, max, require_mending, or xpbottle.");
}

function handleBridgingCommand(source, args) {
  const action = args[0] || "status";
  if (action === "on" || action === "off") {
    CONFIG.bridging.enabled = action === "on";
    Logger.tell(source, `Bridging ${CONFIG.bridging.enabled ? "enabled" : "disabled"}.`);
    return;
  }
  if (action === "status") {
    Logger.tell(source, formatBridgingStatus());
    return;
  }
  if (action === "preview") {
    CONFIG.bridging.debugPreview = parseToggle(args[1], true);
    Logger.tell(source, `Bridge preview ${CONFIG.bridging.debugPreview ? "enabled" : "disabled"}.`);
    return;
  }
  if (action === "distance") {
    CONFIG.bridging.maxPlacementDistance = clampInteger(args[1], 1, 8, CONFIG.bridging.maxPlacementDistance);
    Logger.tell(source, `Bridge distance set to ${CONFIG.bridging.maxPlacementDistance}.`);
    return;
  }
  if (action === "diagonal") {
    CONFIG.bridging.allowDiagonalEdgePlacement = parseToggle(args[1], true);
    Logger.tell(source, `Diagonal bridging ${CONFIG.bridging.allowDiagonalEdgePlacement ? "enabled" : "disabled"}.`);
    return;
  }
  Logger.tell(source, "Unknown bridging action. Use on, off, status, preview, distance, or diagonal.");
}

function handleClumpsCommand(source, args) {
  const action = args[0] || "status";
  if (action === "on" || action === "off") {
    CONFIG.clumps.enabled = action === "on";
    Logger.tell(source, `Clumps ${CONFIG.clumps.enabled ? "enabled" : "disabled"}.`);
    return;
  }
  if (action === "status") {
    Logger.tell(source, formatClumpsStatus());
    return;
  }
  if (action === "radius") {
    CONFIG.clumps.mergeRadius = clampNumber(args[1], 0.5, 8, CONFIG.clumps.mergeRadius);
    Logger.tell(source, `Clumps merge radius set to ${CONFIG.clumps.mergeRadius}.`);
    return;
  }
  if (action === "scan_radius") {
    CONFIG.clumps.scanRadius = clampInteger(args[1], 4, 64, CONFIG.clumps.scanRadius);
    Logger.tell(source, `Clumps player scan radius set to ${CONFIG.clumps.scanRadius}.`);
    return;
  }
  if (action === "interval") {
    CONFIG.clumps.scanIntervalTicks = clampInteger(args[1], 5, 200, CONFIG.clumps.scanIntervalTicks);
    Logger.tell(source, `Clumps scan interval set to ${CONFIG.clumps.scanIntervalTicks} ticks.`);
    return;
  }
  if (action === "approximate") {
    CONFIG.clumps.approximateMode = parseToggle(args[1], true);
    Logger.tell(source, `Approximate clumps ${CONFIG.clumps.approximateMode ? "enabled" : "disabled"}.`);
    return;
  }
  if (action === "debug") {
    CONFIG.clumps.debug = parseToggle(args[1], true);
    Logger.tell(source, `Clumps debug ${CONFIG.clumps.debug ? "enabled" : "disabled"}.`);
    return;
  }
  Logger.tell(source, "Unknown clumps action. Use on, off, status, radius, scan_radius, interval, approximate, or debug.");
}

function applyProfile(source, profileName) {
  const profile = PROFILES[profileName];
  if (!profile) {
    Logger.tell(source, "Unknown Quality profile. Use survival, performance, or qol.");
    return;
  }

  CONFIG.betterMending.enabled = profile.betterMending;
  CONFIG.bridging.enabled = profile.bridging;
  CONFIG.clumps.enabled = profile.clumps;
  CONFIG.clumps.scanIntervalTicks = profile.clumpsInterval;
  CONFIG.clumps.scanRadius = profile.clumpsRadius;
  CONFIG.clumps.approximateMode = profile.approximateClumps;
  CONFIG.bridging.debugPreview = profile.bridgePreview;
  CONFIG.betterMending.useActionbar = profile.actionbar;
  CONFIG.bridging.useActionbar = profile.actionbar;
  Logger.tell(source, `Quality profile set to ${profileName}.`);
}

function setAllEnabled(enabled) {
  CONFIG.betterMending.enabled = enabled;
  CONFIG.bridging.enabled = enabled;
  CONFIG.clumps.enabled = enabled;
}

function tellStatus(source) {
  Logger.tell(source, `${formatMendingStatus()} ${formatBridgingStatus()} ${formatClumpsStatus()}`);
}

function formatMendingStatus() {
  return `Mending enabled=${CONFIG.betterMending.enabled} requireEnchant=${CONFIG.betterMending.requireMendingEnchant} cost=${CONFIG.betterMending.xpCostPerDurability} max=${CONFIG.betterMending.maxRepairPerUse}.`;
}

function formatBridgingStatus() {
  return `Bridging enabled=${CONFIG.bridging.enabled} distance=${CONFIG.bridging.maxPlacementDistance} diagonal=${CONFIG.bridging.allowDiagonalEdgePlacement} preview=${CONFIG.bridging.debugPreview}.`;
}

function formatClumpsStatus() {
  return `Clumps enabled=${CONFIG.clumps.enabled} scanRadius=${CONFIG.clumps.scanRadius} mergeRadius=${CONFIG.clumps.mergeRadius} interval=${CONFIG.clumps.scanIntervalTicks} exactAvailable=${CONFIG.clumps.exactModeAvailable} approximate=${CONFIG.clumps.approximateMode}.`;
}

function parseToggle(value, fallback) {
  if (value === "on" || value === "true" || value === "1") {
    return true;
  }
  if (value === "off" || value === "false" || value === "0") {
    return false;
  }
  return fallback;
}

function clampInteger(value, min, max, fallback) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

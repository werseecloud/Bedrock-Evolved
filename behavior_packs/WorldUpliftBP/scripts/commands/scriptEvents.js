import { world } from "@minecraft/server";
import { Logger } from "../utils/logger.js";
import { setBottomTransitionEnabled } from "../terrain/bottomTransition.js";
import { decorateAroundPlayer } from "../terrain/scenicDecorator.js";
import {
  decorateMegaRegionAroundPlayer,
  getMegaRegionStatus,
  setMegaRegionsEnabled
} from "../terrain/megaRegionDecorator.js";
import {
  giveGuideBook,
  resetGuideForPlayer,
  showGuideForPlayer
} from "../guide/guideBook.js";
import {
  createOrUpgradeNearestCity,
  expandNearestCity,
  setNearestCityType,
  showNearestCityStatus
} from "../cities/cityGenerator.js";
import {
  addCityResource,
  assignCityRole,
  findCityById,
  formatCityStatus,
  raiseCityGuard
} from "../cities/cityRegistry.js";
import {
  handleLodCommand,
  handlePerformanceCommand,
  handleVibrantCommand
} from "../lod/lodManager.js";
import { handlePerfCommand, setPerfProfile } from "../performance/performanceCommands.js";
import { handleTerrainUpliftCommand } from "../terrain/commands/terrainCommands.js";
import { handleCameraCommand } from "../camera/cameraCommands.js";
import { handleHarvestCommand } from "../harvest/harvestCommands.js";
import { handleQualityCommand } from "../quality/qualityCommands.js";
import { handleWorldEditCommand } from "../worldedit/worldEditController.js";
import { handleQolCommand } from "../qol/qolController.js";
import { handleFogCommand } from "../visuals/fogController.js";

let initialized = false;

export function initScriptEvents() {
  if (initialized) {
    return;
  }
  initialized = true;
  world.afterEvents.scriptEventReceive.subscribe(handleScriptEvent);
}

function handleScriptEvent(event) {
  const id = event.id;
  const message = String(event.message || "").trim();
  const args = message.length ? message.split(/\s+/g) : [];
  const source = getSourcePlayer(event);

  try {
    const worldEditArgs = getWorldEditArgs(id, args);
    if (worldEditArgs) {
      return runScriptCommand(source, id, message, () => handleWorldEditCommand(source, worldEditArgs));
    }
    if (id === "wu:city") {
      return runScriptCommand(source, id, message, () => handleCityCommand(source, args));
    }
    if (id === "wu:terrain") {
      return runScriptCommand(source, id, message, () => handleTerrainCommand(source, args));
    }
    if (id === "be:terrain") {
      return runScriptCommand(source, id, message, () => handleTerrainUpliftCommand(source, args));
    }
    if (id === "wu:regions") {
      return runScriptCommand(source, id, message, () => handleRegionCommand(source, args));
    }
    if (id === "wu:guide") {
      return runScriptCommand(source, id, message, () => handleGuideCommand(source, args));
    }
    if (id === "wu:deepnether") {
      return runScriptCommand(source, id, message, () => handleDeepNetherCommand(source, args));
    }
    if (id === "wu:lod") {
      return runScriptCommand(source, id, message, () => handleLodCommand(source, args));
    }
    if (id === "wu:vibrant") {
      return runScriptCommand(source, id, message, () => handleVibrantCommand(source, args));
    }
    if (id === "wu:performance") {
      return runScriptCommand(source, id, message, () => {
        setPerfProfile(source, args[0] || "balanced");
        handlePerformanceCommand(source, args);
      });
    }
    if (id === "be:perf") {
      return runScriptCommand(source, id, message, () => handlePerfCommand(source, args));
    }
    if (id === "be:fog") {
      return runScriptCommand(source, id, message, () => handleFogCommand(source, args));
    }
    if (id === "co:camera") {
      return runScriptCommand(source, id, message, () => handleCameraCommand(source, args));
    }
    if (id.startsWith("rch:")) {
      return runScriptCommand(source, id, message, () => handleHarvestCommand(source, id, args));
    }
    if (id.startsWith("qm:")) {
      return runScriptCommand(source, id, message, () => handleQualityCommand(source, id, args));
    }
    if (id === "qol" || id === "be:qol" || id.startsWith("qol:")) {
      const qolArgs = id.startsWith("qol:") ? [id.slice("qol:".length), ...args] : args;
      return runScriptCommand(source, id, message, () => handleQolCommand(source, qolArgs));
    }
    if (id === "wu:get_city_status") {
      return runScriptCommand(source, id, message, () => {
        const city = args[0] ? findCityById(args[0]) : undefined;
        Logger.tell(source, formatCityStatus(city));
      });
    }
    if (id === "wu:add_city_resource") {
      return runScriptCommand(source, id, message, () => {
        const city = addCityResource(args[0], args[1], Number(args[2] || 0));
        Logger.tell(source, formatCityStatus(city));
      });
    }
    if (id === "wu:raise_city_guard") {
      return runScriptCommand(source, id, message, () => {
        const city = raiseCityGuard(args[0], Number(args[1] || 1));
        Logger.tell(source, formatCityStatus(city));
      });
    }
    if (id === "wu:assign_city_role") {
      return runScriptCommand(source, id, message, () => {
        const city = assignCityRole(args[0], args[1] || "worker", args[2] || "unknown");
        Logger.tell(source, formatCityStatus(city));
      });
    }
    Logger.tell(source, `Niet gelukt: onbekende scriptcommand ${formatScriptCommand(id, message)}.`);
    return { ok: false };
  } catch (error) {
    Logger.tell(source, `Niet gelukt: ${formatScriptCommand(id, message)} faalde: ${error}`);
    return { ok: false };
  }
}

function runScriptCommand(source, id, message, callback) {
  const result = callback();
  if (result && typeof result.ok === "boolean") {
    return result;
  }
  Logger.tell(source, `Gelukt: scriptcommand verwerkt: ${formatScriptCommand(id, message)}.`);
  return { ok: true };
}

function handleCityCommand(source, args) {
  const action = args[0] || "status";
  const player = requirePlayer(source);
  if (!player) {
    Logger.tell(source, "City commands need an in-world player source.");
    return { ok: false };
  }

  if (action === "create") {
    createOrUpgradeNearestCity(player);
    return { ok: true };
  }
  if (action === "status") {
    showNearestCityStatus(player);
    return { ok: true };
  }
  if (action === "expand") {
    expandNearestCity(player);
    return { ok: true };
  }
  if (action === "type") {
    setNearestCityType(player, args[1] || "small_town");
    return { ok: true };
  }
  if (action === "debug") {
    const enabled = args[1] === "on";
    Logger.setDebug(enabled);
    Logger.tell(player, `Debug ${enabled ? "enabled" : "disabled"}.`);
    return { ok: true };
  }
  Logger.tell(player, "Unknown city action. Use create, status, expand, type, or debug.");
  return { ok: false };
}

function handleTerrainCommand(source, args) {
  const player = requirePlayer(source);
  if (!player) {
    Logger.tell(source, "Terrain commands need an in-world player source.");
    return { ok: false };
  }
  if ((args[0] || "") === "decorate") {
    decorateAroundPlayer(player);
    return { ok: true };
  }
  Logger.tell(player, "Unknown terrain action. Use decorate.");
  return { ok: false };
}

function handleRegionCommand(source, args) {
  const action = args[0] || "status";
  if (action === "on") {
    setMegaRegionsEnabled(true);
    Logger.tell(source, "Mega region terrain enabled.");
    return { ok: true };
  }
  if (action === "off") {
    setMegaRegionsEnabled(false);
    Logger.tell(source, "Mega region terrain disabled.");
    return { ok: true };
  }
  if (action === "status") {
    Logger.tell(source, getMegaRegionStatus(requirePlayer(source)));
    return { ok: true };
  }
  if (action === "decorate") {
    const player = requirePlayer(source);
    if (!player) {
      Logger.tell(source, "Region decoration needs an in-world player source.");
      return { ok: false };
    }
    const count = decorateMegaRegionAroundPlayer(player, true);
    Logger.tell(player, `Queued mega-region decoration for ${count} loaded chunk areas.`);
    return { ok: true };
  }
  Logger.tell(source, "Unknown region action. Use on, off, status, or decorate.");
  return { ok: false };
}

function handleGuideCommand(source, args) {
  const action = args[0] || "open";
  const player = requirePlayer(source);
  if (!player) {
    Logger.tell(source, "Guide commands need an in-world player source.");
    return { ok: false };
  }
  if (action === "open") {
    showGuideForPlayer(player);
    Logger.tell(player, "Guide opened.");
    return { ok: true };
  }
  if (action === "book") {
    giveGuideBook(player, false);
    Logger.tell(player, "Guide book added.");
    return { ok: true };
  }
  if (action === "reset") {
    resetGuideForPlayer(player);
    Logger.tell(player, "Guide first-join state reset for you.");
    return { ok: true };
  }
  Logger.tell(player, "Unknown guide action. Use open, book, or reset.");
  return { ok: false };
}

function handleDeepNetherCommand(source, args) {
  const action = args[0] || "on";
  if (action === "on") {
    setBottomTransitionEnabled(true);
    Logger.tell(source, "Deep Nether transition enabled.");
    return { ok: true };
  }
  if (action === "off") {
    setBottomTransitionEnabled(false);
    Logger.tell(source, "Deep Nether transition disabled.");
    return { ok: true };
  }
  Logger.tell(source, "Unknown deepnether action. Use on or off.");
  return { ok: false };
}

function getWorldEditArgs(id, args) {
  if (id === "worldedit" || id === "we" || id === "worldedit:cmd" || id === "we:cmd") {
    return args;
  }
  if (id.startsWith("worldedit:")) {
    return [id.slice("worldedit:".length), ...args];
  }
  if (id.startsWith("we:")) {
    return [id.slice("we:".length), ...args];
  }
  return undefined;
}

function formatScriptCommand(id, message) {
  const suffix = message ? ` ${message}` : "";
  return `/scriptevent ${id}${suffix}`;
}

function getSourcePlayer(event) {
  if (event.sourceEntity && event.sourceEntity.typeId === "minecraft:player") {
    return event.sourceEntity;
  }
  const players = world.getPlayers();
  return players.length ? players[0] : undefined;
}

function requirePlayer(source) {
  if (source && source.typeId === "minecraft:player") {
    return source;
  }
  return undefined;
}

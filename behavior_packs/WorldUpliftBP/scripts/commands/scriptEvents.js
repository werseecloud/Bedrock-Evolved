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
import { handleTerrainUpliftCommand } from "../terrain/commands/terrainCommands.js";
import { handleCameraCommand } from "../camera/cameraCommands.js";
import { handleHarvestCommand } from "../harvest/harvestCommands.js";
import { handleQualityCommand } from "../quality/qualityCommands.js";
import { handleMinimapCommand } from "../minimap/commands/minimapCommands.js";

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
    if (id === "wu:city") {
      handleCityCommand(source, args);
      return;
    }
    if (id === "wu:terrain") {
      handleTerrainCommand(source, args);
      return;
    }
    if (id === "be:terrain") {
      handleTerrainUpliftCommand(source, args);
      return;
    }
    if (id === "wu:regions") {
      handleRegionCommand(source, args);
      return;
    }
    if (id === "wu:guide") {
      handleGuideCommand(source, args);
      return;
    }
    if (id === "wu:deepnether") {
      handleDeepNetherCommand(source, args);
      return;
    }
    if (id === "wu:lod") {
      handleLodCommand(source, args);
      return;
    }
    if (id === "wu:vibrant") {
      handleVibrantCommand(source, args);
      return;
    }
    if (id === "wu:performance") {
      handlePerformanceCommand(source, args);
      return;
    }
    if (id === "co:camera") {
      handleCameraCommand(source, args);
      return;
    }
    if (id.startsWith("rch:")) {
      handleHarvestCommand(source, id, args);
      return;
    }
    if (id.startsWith("qm:")) {
      handleQualityCommand(source, id, args);
      return;
    }
    if (id === "be:minimap") {
      handleMinimapCommand(source, args);
      return;
    }
    if (id === "wu:get_city_status") {
      const city = args[0] ? findCityById(args[0]) : undefined;
      Logger.tell(source, formatCityStatus(city));
      return;
    }
    if (id === "wu:add_city_resource") {
      const city = addCityResource(args[0], args[1], Number(args[2] || 0));
      Logger.tell(source, formatCityStatus(city));
      return;
    }
    if (id === "wu:raise_city_guard") {
      const city = raiseCityGuard(args[0], Number(args[1] || 1));
      Logger.tell(source, formatCityStatus(city));
      return;
    }
    if (id === "wu:assign_city_role") {
      const city = assignCityRole(args[0], args[1] || "worker", args[2] || "unknown");
      Logger.tell(source, formatCityStatus(city));
    }
  } catch (error) {
    Logger.tell(source, `Command failed: ${error}`);
  }
}

function handleCityCommand(source, args) {
  const action = args[0] || "status";
  const player = requirePlayer(source);
  if (!player) {
    Logger.tell(source, "City commands need an in-world player source.");
    return;
  }

  if (action === "create") {
    createOrUpgradeNearestCity(player);
    return;
  }
  if (action === "status") {
    showNearestCityStatus(player);
    return;
  }
  if (action === "expand") {
    expandNearestCity(player);
    return;
  }
  if (action === "type") {
    setNearestCityType(player, args[1] || "small_town");
    return;
  }
  if (action === "debug") {
    const enabled = args[1] === "on";
    Logger.setDebug(enabled);
    Logger.tell(player, `Debug ${enabled ? "enabled" : "disabled"}.`);
    return;
  }
  Logger.tell(player, "Unknown city action. Use create, status, expand, type, or debug.");
}

function handleTerrainCommand(source, args) {
  const player = requirePlayer(source);
  if (!player) {
    Logger.tell(source, "Terrain commands need an in-world player source.");
    return;
  }
  if ((args[0] || "") === "decorate") {
    decorateAroundPlayer(player);
    return;
  }
  Logger.tell(player, "Unknown terrain action. Use decorate.");
}

function handleRegionCommand(source, args) {
  const action = args[0] || "status";
  if (action === "on") {
    setMegaRegionsEnabled(true);
    Logger.tell(source, "Mega region terrain enabled.");
    return;
  }
  if (action === "off") {
    setMegaRegionsEnabled(false);
    Logger.tell(source, "Mega region terrain disabled.");
    return;
  }
  if (action === "status") {
    Logger.tell(source, getMegaRegionStatus(requirePlayer(source)));
    return;
  }
  if (action === "decorate") {
    const player = requirePlayer(source);
    if (!player) {
      Logger.tell(source, "Region decoration needs an in-world player source.");
      return;
    }
    const count = decorateMegaRegionAroundPlayer(player, true);
    Logger.tell(player, `Queued mega-region decoration for ${count} loaded chunk areas.`);
    return;
  }
  Logger.tell(source, "Unknown region action. Use on, off, status, or decorate.");
}

function handleGuideCommand(source, args) {
  const action = args[0] || "open";
  const player = requirePlayer(source);
  if (!player) {
    Logger.tell(source, "Guide commands need an in-world player source.");
    return;
  }
  if (action === "open") {
    showGuideForPlayer(player);
    return;
  }
  if (action === "book") {
    giveGuideBook(player, false);
    Logger.tell(player, "Guide book added.");
    return;
  }
  if (action === "reset") {
    resetGuideForPlayer(player);
    Logger.tell(player, "Guide first-join state reset for you.");
    return;
  }
  Logger.tell(player, "Unknown guide action. Use open, book, or reset.");
}

function handleDeepNetherCommand(source, args) {
  const action = args[0] || "on";
  if (action === "on") {
    setBottomTransitionEnabled(true);
    Logger.tell(source, "Deep Nether transition enabled.");
    return;
  }
  if (action === "off") {
    setBottomTransitionEnabled(false);
    Logger.tell(source, "Deep Nether transition disabled.");
    return;
  }
  Logger.tell(source, "Unknown deepnether action. Use on or off.");
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

import { ActionFormData } from "@minecraft/server-ui";
import { Logger } from "../utils/logger.js";

const TITLE = "Bedrock Evolved Guide";

const PAGES = Object.freeze({
  overview: {
    title: "Overview",
    body: [
      "World Uplift: Cities & Deep Realms upgrades world exploration with bigger-feeling terrain, staged city expansion, deep realm transitions, LOD skyline illusions, camera movement, RightClick Harvest, Better Than Mending, Bridging, and XP Clumps.",
      "It also includes the Bedrock Evolved Minimap with settings item, fullscreen map, waypoints, death marker, and death beacon fallback controls.",
      "",
      "This add-on stays inside Bedrock limits. It does not force infinite height, real 2000 chunk rendering, or native engine changes."
    ].join("\n")
  },
  terrain: {
    title: "Terrain & Regions",
    body: [
      "Mega regions make areas feel thousands of blocks wide while only decorating loaded chunks near players.",
      "",
      "Useful commands:",
      "/scriptevent wu:regions status",
      "/scriptevent wu:regions decorate",
      "/scriptevent wu:terrain decorate",
      "/scriptevent wu:lod status"
    ].join("\n")
  },
  cities: {
    title: "Cities",
    body: [
      "Village-like areas can become staged towns and cities with roads, districts, farms, walls, towers, markets, storage, barracks, mines, and town halls.",
      "",
      "Useful commands:",
      "/scriptevent wu:city create",
      "/scriptevent wu:city status",
      "/scriptevent wu:city expand",
      "/scriptevent wu:city type fortified_city"
    ].join("\n")
  },
  deep: {
    title: "Deep Realms",
    body: [
      "When enabled, falling far below the Overworld triggers a warning and then sends the player to the Nether-like deep realm flow.",
      "",
      "Useful commands:",
      "/scriptevent wu:deepnether on",
      "/scriptevent wu:deepnether off"
    ].join("\n")
  },
  quality: {
    title: "Quality Mechanics",
    body: [
      "RightClick Harvest replants mature crops safely. Better Than Mending repairs held Mending items with XP. Bridging helps place blocks at ledges. Clumps reduces XP orb clutter where the API can preserve XP safely.",
      "",
      "Useful commands:",
      "/scriptevent rch:status",
      "/scriptevent qm:status",
      "/scriptevent qm:profile survival",
      "/scriptevent qm:profile performance",
      "/scriptevent qm:profile qol"
    ].join("\n")
  },
  camera: {
    title: "Camera",
    body: [
      "Camera Overhaul adds subtle movement sway, strafe tilt feel, crouch dip, and landing bounce. It does not zoom while walking or sprinting.",
      "",
      "Useful commands:",
      "/scriptevent co:camera status",
      "/scriptevent co:camera profile balanced",
      "/scriptevent co:camera intensity 0.5",
      "/scriptevent co:camera off"
    ].join("\n")
  },
  minimap: {
    title: "Minimap",
    body: [
      "Run /scriptevent be:minimap item to get the Minimap Settings item.",
      "",
      "Use it to enable the minimap or open fullscreen map. Sneak + use opens fullscreen when enabled.",
      "",
      "Useful commands:",
      "/scriptevent be:minimap settings",
      "/scriptevent be:minimap on",
      "/scriptevent be:minimap fullscreen",
      "/scriptevent be:minimap waypoint add Home",
      "/scriptevent be:minimap death status"
    ].join("\n")
  },
  performance: {
    title: "Performance",
    body: [
      "The add-on uses intervals, cooldowns, queues, and loaded-area checks. It never scans the whole world every tick.",
      "",
      "Useful commands:",
      "/scriptevent wu:performance performance",
      "/scriptevent wu:performance balanced",
      "/scriptevent wu:performance cinematic",
      "/scriptevent qm:profile performance"
    ].join("\n")
  },
  limits: {
    title: "Bedrock Limits",
    body: [
      "Bedrock controls real world height, render distance, simulation distance, server view distance, and ticking areas.",
      "",
      "This add-on simulates bigger terrain with safe dimension bounds, features, structures, LOD impostors, fog, metadata, and progressive loaded-chunk decoration."
    ].join("\n")
  }
});

export function showGuideHome(player) {
  const form = new ActionFormData()
    .title(TITLE)
    .body("Choose a guide page. You can reopen this by using the Bedrock Evolved Guide book or running /scriptevent wu:guide.")
    .button("Overview")
    .button("Terrain & Mega Regions")
    .button("Cities")
    .button("Deep Realms")
    .button("Quality Mechanics")
    .button("Camera")
    .button("Minimap")
    .button("Performance")
    .button("Bedrock Limits");

  form.show(player).then((response) => {
    if (response.canceled || response.selection === undefined) {
      return;
    }
    const pageKeys = ["overview", "terrain", "cities", "deep", "quality", "camera", "minimap", "performance", "limits"];
    const pageKey = pageKeys[response.selection];
    if (pageKey) {
      showGuidePage(player, pageKey);
    }
  }).catch((error) => {
    Logger.debug(`Guide UI failed: ${error}`);
  });
}

export function showGuidePage(player, pageKey) {
  const page = PAGES[pageKey] || PAGES.overview;
  const form = new ActionFormData()
    .title(`${TITLE}: ${page.title}`)
    .body(page.body)
    .button("Back")
    .button("Close");

  form.show(player).then((response) => {
    if (response.canceled || response.selection === undefined) {
      return;
    }
    if (response.selection === 0) {
      showGuideHome(player);
    }
  }).catch((error) => {
    Logger.debug(`Guide page failed: ${error}`);
  });
}

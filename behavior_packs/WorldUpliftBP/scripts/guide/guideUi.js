import { ActionFormData } from "@minecraft/server-ui";
import { Logger } from "../utils/logger.js";

const TITLE = "Bedrock Evolved Guide";

const PAGES = Object.freeze({
  overview: {
    title: "Overview",
    body: [
      "World Uplift: Cities & Deep Realms upgrades world exploration with bigger-feeling terrain, staged city expansion, deep realm transitions, LOD skyline illusions, camera movement, RightClick Harvest, Better Than Mending, Bridging, and XP Clumps.",
      "Loaded village-like areas now spawn Builder villagers that harvest, gather resources, and keep expanding their town while players are nearby.",
      "",
      "This add-on stays inside Bedrock limits. It does not force infinite height, real 2000 chunk rendering, or native engine changes."
    ].join("\n")
  },
  terrain: {
    title: "Terrain & Regions",
    body: [
      "Mega regions make areas feel about 10,000 x 10,000 blocks wide while only decorating loaded chunks near players.",
      "Mountain regions now push bigger scripted spires, longer ridges, denser peak caps, and higher waterfall sources.",
      "Forests can show rare fireflies at night. Custom waterfalls can show soft mist particles.",
      "",
      "Useful commands:",
      "/scriptevent wu:regions status",
      "/scriptevent wu:regions decorate",
      "/scriptevent wu:terrain decorate",
      "/scriptevent wu:lod status"
    ].join("\n")
  },
  fog: {
    title: "Realistic Fog",
    body: [
      "Fog is lighter and biome-specific so distant mountains, valleys, city skylines, and LOD silhouettes stay visible.",
      "Alpine peaks are clearer, valleys have low moisture haze, forests use gentle green morning haze, coasts use pale ocean mist, and caves stay subtle.",
      "",
      "Useful commands:",
      "/scriptevent be:fog status",
      "/scriptevent be:fog profile cinematic",
      "/scriptevent be:fog profile performance",
      "/scriptevent be:fog biome alpine",
      "/scriptevent be:fog biome valley"
    ].join("\n")
  },
  cities: {
    title: "Cities",
    body: [
      "Village-like areas can become staged towns and cities with roads, districts, farms, walls, towers, markets, storage, barracks, mines, and town halls.",
      "Each loaded registered village keeps up to 3 visible Builder villagers. They harvest mature crops, gather resources, and place blocks or queue city stages over time.",
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
      "/scriptevent qol:status",
      "/scriptevent qol:quick_stack",
      "/scriptevent worldedit:wand",
      "/scriptevent worldedit:set stone",
      "/scriptevent worldedit:undo",
      "/scriptevent qm:profile survival",
      "/scriptevent qm:profile performance",
      "/scriptevent qm:profile qol"
    ].join("\n")
  },
  qol: {
    title: "Survival QoL",
    body: [
      "Auto Torch Refill keeps torch hotbar slots stocked from inventory.",
      "Tree Capitator Lite chops connected logs when you sneak-break a tree with an axe and costs durability.",
      "Quick Stack moves non-hotbar items into nearby chests or barrels that already contain matching items.",
      "Death Coordinates sends your death position privately.",
      "Biome Enter Messages announce custom World Uplift biomes where biome lookup is available.",
      "",
      "Useful commands:",
      "/scriptevent qol:status",
      "/scriptevent qol:quick_stack",
      "/scriptevent qol:off quick_stack",
      "/scriptevent qol:on all"
    ].join("\n")
  },
  worldedit: {
    title: "WorldEdit",
    body: [
      "WorldEdit uses a named wooden axe for safe Bedrock-compatible region selection.",
      "",
      "Break block with axe: pos1",
      "Use axe on block: pos2",
      "",
      "Useful commands:",
      "/scriptevent worldedit:wand",
      "/scriptevent worldedit:set stone",
      "/scriptevent worldedit:replace dirt stone",
      "/scriptevent worldedit:walls oak_planks",
      "/scriptevent worldedit:outline glass",
      "/scriptevent worldedit:clear",
      "/scriptevent worldedit:undo"
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
    .button("Realistic Fog")
    .button("Cities")
    .button("Deep Realms")
    .button("Quality Mechanics")
    .button("Survival QoL")
    .button("WorldEdit")
    .button("Camera")
    .button("Performance")
    .button("Bedrock Limits");

  form.show(player).then((response) => {
    if (response.canceled || response.selection === undefined) {
      return;
    }
    const pageKeys = ["overview", "terrain", "fog", "cities", "deep", "quality", "qol", "worldedit", "camera", "performance", "limits"];
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

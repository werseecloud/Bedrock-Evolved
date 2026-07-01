# Bedrock Evolved: World Uplift

Bedrock Evolved: World Uplift is a Minecraft Bedrock Edition add-on prototype for 1.21.80+ that combines data-driven biome/worldgen content with Script API systems for scenic terrain decoration, city-village expansion, and a deep-overworld transition into the Nether.

The optional Vibrant Visuals resource layer targets Bedrock builds that support PBR texture sets. Current Microsoft documentation requires the `pbr` capability and `min_engine_version` `1.21.120` or newer for Vibrant Visuals PBR packs. The core behavior pack remains conservative, but the resource pack is authored for that newer visual pipeline where available.

## What It Adds

- Custom worldgen biomes for alpine peaks, shattered cliffs, deep valleys, old-growth highlands, and city plains.
- Worldgen features and feature rules for peak caps, cliff boulders, alpine trees, waterfalls, deep cave ores, ruins, and road anchors.
- Scripted scenic decoration around loaded players without scanning the whole world.
- Scripted city-village upgrades with staged roads, districts, walls, farms, markets, warehouses, barracks, mines, and town halls.
- A bottom-transition system that turns deep-overworld falling into a Nether transition instead of pretending Bedrock's world bottom can be removed.
- Resource pack fog, localization, and placeholder sound/texture definitions.
- Vibrant Visuals-oriented PBR material sets for cliffs, snow rock, wet stone, roads, old bricks, and roof tiles.
- A budgeted LOD illusion system that places distant mountain and city skyline impostors without trying to load or tick impossible chunk counts.
- Integrated Camera Overhaul controls for subtle movement sway, sprint movement feedback, strafe tilt illusion, crouch dip, and landing bounce, without zooming the camera.
- Integrated RightClick Harvest for mature crops with transactional seed consume/replant/drop handling.
- Integrated Quality Mechanics: Better Than Mending, safe edge bridging, and XP Clumps with strict scan budgets.
- Mega-region terrain styling that keeps mountain, valley, forest, and city-plain areas feeling thousands of blocks wide as players explore loaded chunks.
- First-join World Uplift Guide book with a custom Script UI menu for commands, features, performance notes, and Bedrock limitations.
- Bedrock Evolved Minimap with settings item, square minimap fallback, fullscreen map forms, waypoints, temporary waypoints, death markers, death beacon particles, layer toggles, and per-player settings.

## Bedrock Height And World Limit Reality

Bedrock add-ons cannot inject native engine code or remove every native world limit. This pack does not claim to create true infinite height or guaranteed 1000+ block terrain.

The included `dimensions/overworld.json` uses `minecraft:dimension_bounds` with the maximum documented safe Overworld bounds: `min: -512`, `max: 512`. The official documentation states that these values must be multiples of 16 between `-512` and `512`. The same documentation also warns that data-driven Overworld height changes slice/void world visibility and do not rescale vanilla terrain generation or blend terrain into the new range.

Because of that, this add-on aims for an ultra-tall terrain feel through:

- Mountain-biome terrain shaping with `minecraft:overworld_height`.
- Large structure templates for cliffs, snow caps, cave mouths, arches, and waterfalls.
- Scripted scenic decoration in loaded areas.
- A deep-bottom transition that moves players into the Nether instead of repeatedly editing bedrock.

If a Bedrock build rejects the high dimension bounds, remove or edit `behavior_packs/WorldUpliftBP/dimensions/overworld.json`. The scripts automatically use the loaded dimension height range when selecting the deep-transition threshold, so the city, biome, feature, and command systems can continue to work with vanilla height.

## Install

1. Import `WorldUplift_Cities_Deep_Realms.mcaddon` into Minecraft Bedrock Edition.
2. Enable both packs:
   - Behavior Pack: `World Uplift BP`
   - Resource Pack: `World Uplift RP`
3. Create or open a world with cheats enabled for `/scriptevent` commands.
4. Enable experiments if your target build requires them for custom biomes, scripts, or data-driven worldgen:
   - Beta APIs, if your installed Bedrock build gates Script API behavior behind it.
   - Upcoming Creator Features, if your build gates worldgen features behind it.
   - Custom Biomes, if your build requires the custom-biome experiment.

Always test on a backup world first. Height-bound experiments and void slicing can permanently affect generated chunks.

## Commands

Use these from chat with cheats enabled:

- `/scriptevent wu:city create`
- `/scriptevent wu:city status`
- `/scriptevent wu:city expand`
- `/scriptevent wu:city type fortified_city`
- `/scriptevent wu:city debug on`
- `/scriptevent wu:city debug off`
- `/scriptevent wu:terrain decorate`
- `/scriptevent wu:regions on`
- `/scriptevent wu:regions off`
- `/scriptevent wu:regions status`
- `/scriptevent wu:regions decorate`
- `/scriptevent wu:guide`
- `/scriptevent wu:guide open`
- `/scriptevent wu:guide book`
- `/scriptevent wu:guide reset`
- `/scriptevent be:minimap settings`
- `/scriptevent be:minimap item`
- `/scriptevent be:minimap on`
- `/scriptevent be:minimap off`
- `/scriptevent be:minimap toggle`
- `/scriptevent be:minimap fullscreen`
- `/scriptevent be:minimap close`
- `/scriptevent be:minimap size small`
- `/scriptevent be:minimap size normal`
- `/scriptevent be:minimap size large`
- `/scriptevent be:minimap position top_right`
- `/scriptevent be:minimap position top_left`
- `/scriptevent be:minimap rotate on`
- `/scriptevent be:minimap rotate off`
- `/scriptevent be:minimap profile performance`
- `/scriptevent be:minimap profile balanced`
- `/scriptevent be:minimap waypoint add Home`
- `/scriptevent be:minimap waypoint list`
- `/scriptevent be:minimap waypoint remove Home`
- `/scriptevent be:minimap temp add Scout`
- `/scriptevent be:minimap temp clear`
- `/scriptevent be:minimap death status`
- `/scriptevent be:minimap death clear`
- `/scriptevent be:minimap death beacon on`
- `/scriptevent be:minimap death beacon off`
- `/scriptevent be:minimap layer deaths on`
- `/scriptevent be:minimap layer waypoints off`
- `/scriptevent be:minimap cursor up`
- `/scriptevent be:minimap cursor place_temp`
- `/scriptevent wu:deepnether on`
- `/scriptevent wu:deepnether off`
- `/scriptevent wu:lod on`
- `/scriptevent wu:lod off`
- `/scriptevent wu:lod status`
- `/scriptevent wu:lod debug on`
- `/scriptevent wu:lod debug off`
- `/scriptevent wu:vibrant status`
- `/scriptevent wu:vibrant profile alpine`
- `/scriptevent wu:vibrant profile valley`
- `/scriptevent wu:vibrant profile city`
- `/scriptevent wu:performance performance`
- `/scriptevent wu:performance balanced`
- `/scriptevent wu:performance cinematic`
- `/scriptevent co:camera on`
- `/scriptevent co:camera off`
- `/scriptevent co:camera status`
- `/scriptevent co:camera profile performance`
- `/scriptevent co:camera profile balanced`
- `/scriptevent co:camera profile cinematic`
- `/scriptevent co:camera intensity 0.5`
- `/scriptevent co:camera reset`
- `/scriptevent co:camera debug on`
- `/scriptevent co:camera debug off`
- `/scriptevent rch:on`
- `/scriptevent rch:off`
- `/scriptevent rch:status`
- `/scriptevent rch:seed_required on`
- `/scriptevent rch:seed_required off`
- `/scriptevent rch:drop inventory`
- `/scriptevent rch:drop ground`
- `/scriptevent rch:hoe_only on`
- `/scriptevent rch:hoe_only off`
- `/scriptevent rch:debug on`
- `/scriptevent rch:debug off`
- `/scriptevent qm:status`
- `/scriptevent qm:all on`
- `/scriptevent qm:all off`
- `/scriptevent qm:profile survival`
- `/scriptevent qm:profile performance`
- `/scriptevent qm:profile qol`
- `/scriptevent qm:debug on`
- `/scriptevent qm:debug off`
- `/scriptevent qm:mending on`
- `/scriptevent qm:mending off`
- `/scriptevent qm:mending status`
- `/scriptevent qm:mending cost 1`
- `/scriptevent qm:mending max 128`
- `/scriptevent qm:mending require_mending on`
- `/scriptevent qm:mending xpbottle on`
- `/scriptevent qm:bridging on`
- `/scriptevent qm:bridging off`
- `/scriptevent qm:bridging status`
- `/scriptevent qm:bridging preview on`
- `/scriptevent qm:bridging distance 5`
- `/scriptevent qm:bridging diagonal off`
- `/scriptevent qm:clumps on`
- `/scriptevent qm:clumps off`
- `/scriptevent qm:clumps status`
- `/scriptevent qm:clumps radius 2.5`
- `/scriptevent qm:clumps scan_radius 24`
- `/scriptevent qm:clumps interval 20`
- `/scriptevent qm:clumps approximate off`
- `/scriptevent qm:clumps debug off`

Integration events prepared for a Village Politics add-on:

- `/scriptevent wu:get_city_status <cityId>`
- `/scriptevent wu:add_city_resource <cityId> <resource> <amount>`
- `/scriptevent wu:raise_city_guard <cityId> <amount>`
- `/scriptevent wu:assign_city_role <cityId> <role> <entityId>`

## City Generation Stages

Cities generate in small queued stages:

1. Road grid and town hall.
2. Houses and market.
3. Farms and warehouse.
4. Walls and towers, only for `fortified_city`.
5. Barracks and mine entrance.

The scripts scan loaded areas around players on a long interval and register village-like anchors using bells, beds, and villagers. Structure placement is queued and checks for non-natural blocks before writing, so it avoids obvious player builds and does not place thousands of blocks in one tick.

## Village Politics Integration

Generated city metadata is saved in a world dynamic property under `wu:city_registry`. Each city record includes:

- `cityId`
- `name`
- `type`
- `center`
- `stage`
- `buildings`
- `districts`
- `populationEstimate`
- `resources`
- `guards`

Another add-on can query or mutate this state through the prepared script events listed above. For tighter integration later, mirror those events or import compatible helper logic from `scripts/cities/cityRegistry.js`.

## Performance Notes

- Player bottom checks run every 20 ticks by default.
- City scans run every 200 ticks by default.
- Mega-region terrain styling runs every 80 ticks by default and decorates only a few loaded chunk areas per scan.
- LOD player checks run every 40 ticks by default and only update after meaningful player chunk movement.
- Structure and block placement are queued.
- The default max direct block operations per tick is intentionally low.
- All dimension, block, entity, and structure operations are wrapped defensively because unloaded chunks and missing structures can throw.
- The `performance`, `balanced`, and `cinematic` modes adjust LOD active-impostor caps, skyline radius, placement rate, and block-operation budgets.

## Can This Add-On Really Load 2000+ Chunks?

No, not as real Minecraft chunks. Bedrock controls real render distance, simulation distance, server view distance, and ticking areas through the engine, device, world settings, and server settings. This add-on never tries to force 2000 real loaded, rendered, simulated, or ticking chunks.

`LOD_FAKE_WORLD_TARGET_CHUNKS = 2000` is only a design target for the illusion system and far-landmark metadata. It is not interpreted as a request to load real chunks.

The add-on creates a massive-distance feel with:

- LOD structure impostors placed only in loaded/safe areas.
- Mountain skyline proxies and far cliff silhouettes.
- City skyline and castle silhouettes for known generated cities.
- Fog blending so low-cost silhouettes read as far terrain.
- Far-landmark metadata that can later convert into real generation when the player approaches.
- Strict placement and block-operation budgets.

LOD rings:

1. Ring 0: real gameplay zone. Normal Bedrock chunks, entities, villagers, city logic, combat, mining, and structures.
2. Ring 1: near scenic zone. Small safe details near loaded render edges.
3. Ring 2: distant landmark zone. Cheap block-only impostor structures; no entities, AI, redstone, or ticking systems.
4. Ring 3: skyline illusion zone. Metadata plus a small number of silhouettes blended by fog.

When a fake landmark becomes close enough, the script marks it converted and triggers the matching real-system behavior: city landmarks become city anchors, mountain/forest/valley landmarks trigger scenic decoration, and ruin/castle landmarks queue real structure placement.

## Larger Terrain Regions

Bedrock add-ons do not expose a simple reliable setting that says "make this biome exactly 3000 blocks wide." Native biome placement is still controlled by the Bedrock world generator.

This pack now uses two safe approaches to make areas feel much larger:

- Custom biome climate weights were increased so World Uplift biomes appear as broader, more dominant regions in new chunks.
- A scripted mega-region decorator divides the Overworld into deterministic regions of about `3072 x 3072` blocks. Each region gets one dominant style such as alpine peaks, shattered cliffs, deep valleys, old-growth highlands, or city plains. As players move, only nearby loaded chunk areas are decorated, so the region keeps the same visual identity for thousands of blocks without scanning or editing the whole world.

Mountain regions now receive denser peak caps, snow/stone platforms, cliff ribs, boulder fields, water hints, and highland tree bands. This expands the mountain feel over a much larger area, while staying inside Bedrock performance limits.

## First-Join Guide

When a player joins with the add-on for the first time, the script gives them a named `Bedrock Evolved Guide` book and opens a custom `@minecraft/server-ui` menu. The book can be used again later to reopen the guide.

The guide covers:

- What the add-on changes.
- Terrain, mega regions, cities, deep realms, LOD, and Vibrant Visuals.
- RightClick Harvest and Quality Mechanics.
- Camera commands.
- Performance modes.
- Honest Bedrock limitations.

If a player loses the book, run `/scriptevent wu:guide book`. To reopen the UI directly, run `/scriptevent wu:guide open`. To test the first-join flow again, run `/scriptevent wu:guide reset`.

## Minimap Settings And Fullscreen Map

Run `/scriptevent be:minimap item` to receive the `Minimap Settings` item. Use the item to open minimap settings. Sneak + use opens the fullscreen map when the minimap is enabled.

Bedrock add-ons do not have the same unrestricted clickable HUD access as Java client mods. This pack includes Resource Pack UI JSON placeholders for a top-right square minimap and fullscreen frame, but the reliable runtime path is script-driven:

- Settings item opens the minimap menu.
- `/scriptevent be:minimap settings` opens the same menu.
- The small square minimap uses a budgeted actionbar/text-grid fallback.
- `/scriptevent be:minimap fullscreen` opens a fullscreen `ActionFormData` map with a larger text-grid, markers, coordinates, compass-style north label, and commands.
- `/scriptevent be:minimap close` returns to gameplay and resumes the small minimap if enabled.

Minimap settings are stored per player where dynamic properties are available, with memory fallback if storage fails. If minimap is disabled, terrain sampling and marker rendering are skipped for that player.

## Map Markers, Waypoints And Death Beacon

The minimap tracks a latest death marker, death history, permanent waypoints, temporary waypoints, city markers, player markers, and limited entity markers. Waypoints are private by default.

Death marker behavior:

- On player death, the latest death location, dimension, coordinates, and tick time are saved.
- The latest death marker appears on the minimap/fullscreen map when that layer is enabled.
- `/scriptevent be:minimap death status` shows distance and dimension state.
- `/scriptevent be:minimap death clear` clears the latest marker.
- The death beacon uses particles only by default. It pulses near the saved death location and only when the player is within the configured active radius.

Waypoint behavior:

- `/scriptevent be:minimap waypoint add <name>` creates a permanent waypoint at your current location.
- `/scriptevent be:minimap temp add <name>` creates a temporary waypoint that expires.
- The fullscreen map includes Add Waypoint, Add Temporary Waypoint, Waypoint List, cursor movement, layer settings, and center-on-death options.
- Direct right-click placement on the fullscreen map is not guaranteed in Bedrock. The fallback is cursor/form mode: move the cursor with form buttons or `/scriptevent be:minimap cursor up/down/left/right`, then place a temporary marker with `/scriptevent be:minimap cursor place_temp`.

Layer toggles:

- `deaths`
- `waypoints`
- `temp`
- `players`
- `mobs`
- `cities`
- `landmarks`

Example: `/scriptevent be:minimap layer mobs off`.

Performance notes:

- No minimap work runs for players with minimap disabled.
- Small map updates are interval-based, not every tick.
- Fullscreen map uses profile-based grid sizes: `performance`, `balanced`, `cinematic`, and `server`.
- Entity markers only render on fullscreen map and are capped.
- Marker caps and clustering reduce spam.
- Death beacon particles pulse on an interval and only near the death marker.

## Vibrant Visuals

The resource pack includes PBR texture sets:

- `uplift_granite_cliff`: rough, low-metallic exposed cliff rock.
- `uplift_snow_rock`: bright snow-stone blend with a MERS texture set for subtle subsurface-capable rendering where supported.
- `uplift_wet_stone`: darker stone with lower roughness for waterfall-adjacent reflection.
- `uplift_city_road`: matte worn road with slight reflectance.
- `uplift_old_bricks`: rough, uneven, non-metallic city masonry.
- `uplift_roof_tiles`: roof material with normal detail and medium roughness.

If Vibrant Visuals is disabled, the same base-color textures still render in classic mode. Scripts do not try to change the player's graphics settings; `/scriptevent wu:vibrant profile ...` only changes add-on-side metadata and messaging.

## Camera Overhaul

Camera Overhaul is integrated into this same add-on. It does not require a separate import.

The camera system is intentionally subtle and defensive:

- `performance`: anti-motion-sickness friendly, very low intensity.
- `balanced`: default movement feedback.
- `cinematic`: stronger but still clamped.

Bedrock does not guarantee unrestricted first-person camera roll for add-ons. This pack simulates movement tilt safely with tiny camera-shake feedback where available, command fallbacks, easing, and clamps. It does not zoom the camera while walking or sprinting. If advanced camera APIs are unavailable, it falls back to `/camera`, minimal behavior, or disabled mode without crashing the world.

Use `/scriptevent co:camera status` to see the current per-player profile, intensity, and API mode.

## RightClick Harvest

RightClick Harvest is part of the same behavior pack. It supports wheat, carrots, potatoes, beetroot, and Nether wart by default. Cocoa and sweet berries are present in config but disabled until their state handling is tested more broadly.

Harvesting is transactional: the script validates maturity, removes one seed only when required, replants the crop, gives drops to inventory or ground, and refunds the seed if replanting fails. It uses interaction cooldowns and `event.isFirstEvent` where available to avoid duplicate harvests from holding right click.

## Quality Mechanics

Quality Mechanics is also integrated into this same add-on:

- Better Than Mending repairs the held item when used/interacted with, costs XP per durability, and can fall back to XP bottles if direct XP removal is unavailable.
- Bridging places a held block at safe edge candidates only after checking distance, support, replaceable target blocks, and inventory consume rollback.
- Clumps scans XP orbs around players on an interval. Exact mode does not delete XP if the API cannot read the orb value. Approximate mode is opt-in with `/scriptevent qm:clumps approximate on`.

None of these systems scans the whole world. They operate around active players and use cooldowns or scan intervals to keep normal Bedrock devices safe.

## Structures

This prototype includes generated low-detail `.mcstructure` templates so the pack is usable immediately. Replace them with hand-built exports for a production-quality city and mountain experience. See `behavior_packs/WorldUpliftBP/structures/README.md` for the intended sizes and block palettes.

## Troubleshooting

- Pack does not load: validate JSON and ensure both BP and RP are enabled.
- Scripts do not run: enable cheats and any Script API experiment your Bedrock build requires.
- Biomes do not generate: enable Custom Biomes if required and test in newly generated chunks.
- New terrain appears void after changing height bounds: this is a documented limitation of data-driven Overworld height changes. Test on backups.
- Structures are missing: check the content log. The scripts log missing structure IDs and skip placement instead of crashing.
- Deep transition happens near vanilla bedrock instead of `Y=-500`: your loaded dimension height range did not allow `-500`, so the script selected a safe threshold near the actual minimum.

## Documentation References

- Data-driven Overworld height and bounds: https://learn.microsoft.com/en-us/minecraft/creator/documents/datadrivenoverworldheight
- Custom biome tutorial: https://learn.microsoft.com/en-us/minecraft/creator/documents/biomes/custombiometutorial
- Feature and feature-rule overview: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/featuresreference/examples/featuresintroduction
- Script API module versioning: https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/versioning
- Camera class: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/camera
- Camera system introduction: https://learn.microsoft.com/en-us/minecraft/creator/documents/camerasystem/cameracommandintroduction
- Texture sets and PBR layers: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/texturesetsreference/texturesetsconcepts/texturesetsintroduction
- Vibrant Visuals resource packs: https://learn.microsoft.com/en-us/minecraft/creator/documents/vibrantvisuals/vvresourcepacks

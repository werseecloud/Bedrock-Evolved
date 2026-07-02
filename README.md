# Bedrock Evolved: World Uplift

Bedrock Evolved: World Uplift is a Minecraft Bedrock Edition add-on prototype with a 1.21.80+ behavior pack and a 1.21.120+ Vibrant Visuals resource pack. It combines data-driven biome/worldgen content with Script API systems for scenic terrain decoration, city-village expansion, and a deep-overworld transition into the Nether.

The optional Vibrant Visuals resource layer targets Bedrock builds that support PBR texture sets. Current Microsoft documentation requires the `pbr` capability and `min_engine_version` `1.21.120` or newer for Vibrant Visuals PBR packs. The core behavior pack remains conservative, but the resource pack is authored for that newer visual pipeline where available.

## What It Adds

- Custom worldgen biomes for alpine peaks, shattered cliffs, deep valleys, old-growth highlands, and city plains.
- Worldgen features and feature rules for peak caps, cliff boulders, alpine trees, waterfalls, deep cave ores, ruins, and road anchors.
- Scripted scenic decoration around loaded players without scanning the whole world.
- Scripted city-village upgrades with staged roads, districts, walls, farms, markets, warehouses, barracks, mines, and town halls.
- A bottom-transition system that turns deep-overworld falling into a Nether transition instead of pretending Bedrock's world bottom can be removed.
- Resource pack fog, localization, and placeholder sound/texture definitions.
- Realistic Fog Rework with lighter biome-specific fog, long-range visibility, and LOD-friendly haze profiles.
- Vibrant Visuals-oriented PBR material sets for cliffs, snow rock, wet stone, roads, old bricks, and roof tiles.
- A budgeted LOD illusion system that places distant mountain and city skyline impostors without trying to load or tick impossible chunk counts.
- Integrated Camera Overhaul controls for subtle movement sway, sprint movement feedback, strafe tilt illusion, crouch dip, and landing bounce, without zooming the camera.
- Integrated RightClick Harvest for mature crops with transactional seed consume/replant/drop handling.
- Integrated Quality Mechanics: Better Than Mending, safe edge bridging, and XP Clumps with strict scan budgets.
- Integrated WorldEdit-style tools with a WorldEdit Axe, pos1/pos2 selection, set, replace, walls, outline, clear, and undo.
- Survival QoL helpers: Auto Torch Refill, Tree Capitator Lite, Quick Stack Nearby Chests, private death coordinates, and custom-biome enter messages.
- Mega-region terrain styling that keeps mountain, valley, forest, and city-plain areas feeling about 10,000 x 10,000 blocks wide as players explore loaded chunks.
- Rare ambient fireflies in forest-like areas at night and soft mist particles around custom waterfalls.
- First-join World Uplift Guide book with a custom Script UI menu for commands, features, performance notes, and Bedrock limitations.
- Builder villagers for loaded village-like areas: 3 visible Builder villagers spawn per registered village, harvest crops, gather resources, and keep building city stages/details over time.

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

1. Import `Bedrock_Evolved.mcaddon` into Minecraft Bedrock Edition.
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

Use these from chat with cheats enabled. Script commands now always answer with a success, processed, or failure message.

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
- `/scriptevent worldedit:help`
- `/scriptevent worldedit:wand`
- `/scriptevent worldedit:pos1`
- `/scriptevent worldedit:pos2`
- `/scriptevent worldedit:set stone`
- `/scriptevent worldedit:replace dirt stone`
- `/scriptevent worldedit:walls oak_planks`
- `/scriptevent worldedit:outline glass`
- `/scriptevent worldedit:clear`
- `/scriptevent worldedit:undo`
- `/scriptevent qol:status`
- `/scriptevent qol:quick_stack`
- `/scriptevent qol:on all`
- `/scriptevent qol:off quick_stack`
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
- `/scriptevent be:fog on`
- `/scriptevent be:fog off`
- `/scriptevent be:fog status`
- `/scriptevent be:fog profile performance`
- `/scriptevent be:fog profile balanced`
- `/scriptevent be:fog profile cinematic`
- `/scriptevent be:fog profile server`
- `/scriptevent be:fog biome default`
- `/scriptevent be:fog biome valley`
- `/scriptevent be:fog biome alpine`
- `/scriptevent be:fog debug on`
- `/scriptevent be:fog debug off`
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

## Survival QoL

- Auto Torch Refill moves replacement torches from inventory into a hotbar slot that just ran out.
- Tree Capitator Lite chops connected logs when you sneak-break a log with an axe. It drops logs and damages the axe per chopped log.
- Quick Stack Nearby Chests periodically moves non-hotbar inventory stacks into nearby chests/barrels that already contain the same item. Run `/scriptevent qol:quick_stack` to trigger it manually.
- Death Coordinates Message sends your death location privately when you die, with a respawn fallback if the death event is not available.
- Biome Enter Message announces custom World Uplift biomes such as `Entering Alpine Peaks.` when the runtime exposes biome lookup.

Use `/scriptevent qol:status` to inspect toggles. Use `/scriptevent qol:on <feature>` or `/scriptevent qol:off <feature>` with `all`, `torches`, `trees`, `quick_stack`, `death_coords`, or `biomes`.

## WorldEdit Tools

Run `/scriptevent worldedit:wand` to get a named `WorldEdit Axe`.

- Break a block with the axe to set `pos1`.
- Use the axe on a block to set `pos2`.
- Run `/scriptevent worldedit:set <block>` to fill the selection.
- Run `/scriptevent worldedit:replace <from> <to>` to replace one block type.
- Run `/scriptevent worldedit:walls <block>` or `/scriptevent worldedit:outline <block>` for shell-style edits.
- Run `/scriptevent worldedit:clear` to set the selection to air.
- Run `/scriptevent worldedit:undo` to restore the last edit snapshot.

For Bedrock Script API compatibility this pack exposes the command namespace through `/scriptevent worldedit:*` and `/scriptevent we:*`. The editor queues block changes over multiple ticks, caps selections at 32768 blocks, and sends a final success/failure summary when each job finishes.

## City Generation Stages

Cities generate in small queued stages:

1. Road grid and town hall.
2. Houses and market.
3. Farms and warehouse.
4. Walls and towers, only for `fortified_city`.
5. Barracks and mine entrance.

The scripts scan loaded areas around players on a long interval and register village-like anchors using bells, beds, and villagers. Structure placement is queued and checks for non-natural blocks before writing, so it avoids obvious player builds and does not place thousands of blocks in one tick.

## Builder Villagers

Every loaded registered village keeps 3 visible Builder villagers near the town center. They are vanilla villager entities tagged and named as Builders for reliable Bedrock compatibility.

Builders cycle between harvesting and building:

- Harvest mature crops in or near the village, replant them, and add food to the city registry.
- Gather wood, stone, food, and occasional iron when the next build needs resources.
- Spend stored resources to queue the next city stage.
- Keep placing small detail projects such as road repairs, lamp posts, garden patches, frames, and market crates after major city stages are done.

Builders only tick while a player has the village loaded. The city registry persists their resources and work counters, so returning to a previously loaded village resumes the builder loop.

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
- `builderState`
- `guards`

Another add-on can query or mutate this state through the prepared script events listed above. For tighter integration later, mirror those events or import compatible helper logic from `scripts/cities/cityRegistry.js`.

## Performance Notes

- Player bottom checks run every 20 ticks by default.
- City scans run every 200 ticks by default.
- Mega-region terrain styling runs every 60 ticks by default and decorates only a few loaded chunk areas per scan.
- LOD player checks run every 40 ticks by default and only update after meaningful player chunk movement.
- Structure and block placement are queued.
- The default max direct block operations per tick is intentionally low.
- All dimension, block, entity, and structure operations are wrapped defensively because unloaded chunks and missing structures can throw.
- The `performance`, `balanced`, and `cinematic` modes adjust LOD active-impostor caps, skyline radius, placement rate, and block-operation budgets.
- Fog profiles sync with performance modes: performance adds slightly more distance blending, balanced stays natural, cinematic keeps the clearest horizon, and server uses a moderate safe profile.

## Central Performance Manager

Bedrock Evolved includes a central performance manager so heavy systems do not all run every tick. Use:

- `/scriptevent be:perf status`
- `/scriptevent be:perf profile performance`
- `/scriptevent be:perf profile balanced`
- `/scriptevent be:perf profile cinematic`
- `/scriptevent be:perf profile server`
- `/scriptevent be:perf cleanup`
- `/scriptevent be:perf debug on`
- `/scriptevent be:perf debug off`

Profiles:

- `performance`: LOD max 12 impostors, city active radius 64 blocks, particles 25%, guards cap 4, builders cap 3, recommended simulation distance 4 chunks.
- `balanced`: LOD max 32 impostors, city active radius 96 blocks, particles 50%, guards cap 8, builders cap 3, recommended simulation distance 4-6 chunks.
- `cinematic`: LOD max 64 impostors, city active radius 128 blocks, particles 100%, guards cap 12, builders cap 3, recommended simulation distance 6 chunks on a strong device/server.
- `server`: LOD max 8 impostors, city active radius 64 blocks, particles 10%, guards cap 4, builders cap 3, recommended simulation distance 4 chunks.

The manager enforces shared budgets: max 64 block operations, 32 entity checks, 1 structure placement per tick, and profile-based structure placements per minute. Repeated module errors put that module in temporary fallback mode instead of spamming failures every tick.

Server/world notes: keep simulation distance modest for heavier worlds, usually 4-6 chunks. Bedrock controls render distance and simulation distance; this add-on does not force real far chunks to tick. It also does not create permanent ticking city centers or ticking areas for cities, because those keep chunks active without players and can become expensive quickly.

Performance systems included:

- Per-player staggered updates for camera, clumps, bottom transition checks, city scans, builder villagers, and LOD.
- Queue-based structure and block placement.
- Item cleanup with a valuable-item whitelist.
- Hostile mob caps near active cities.
- Inactive city sleep mode that simulates resources as data when no player is nearby.
- Particle caps for builder work, rare fireflies, waterfalls, deep bottom effects, and valley fog.
- LOD-aware fog profiles that blend far silhouettes without hiding them.

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

Bedrock add-ons do not expose a simple reliable setting that says "make this biome exactly 10,000 blocks wide." Native biome placement is still controlled by the Bedrock world generator.

This pack now uses two safe approaches to make areas feel much larger:

- Custom biome climate weights were increased so World Uplift biomes appear as broader, more dominant regions in new chunks.
- A scripted mega-region decorator divides the Overworld into deterministic regions of about `10000 x 10000` blocks. Each region gets one dominant style such as alpine peaks, shattered cliffs, deep valleys, old-growth highlands, or city plains. As players move, only nearby loaded chunk areas are decorated, so the region keeps the same visual identity for a long expedition without scanning or editing the whole world.

Mountain regions now receive denser peak caps, larger scripted spires, longer cliff ribs, boulder fields, water hints, and highland tree bands. This expands the mountain feel over a much larger area, while staying inside Bedrock performance limits.

## Realistic Fog Rework

The old fog settings were heavy enough to hide too much terrain. The new fog system focuses on atmospheric depth instead: far mountains, large valleys, city skylines, and LOD silhouettes should remain visible through soft haze.

Fog is now biome-specific:

- Default areas use a neutral blue-grey aerial perspective with wide visibility.
- Alpine peaks are clearer and colder, so distant ridgelines stay readable.
- Shattered cliffs use light rock haze with more low-air depth.
- Deep valleys keep the strongest fog, but it is low moisture haze instead of a wall.
- Old-growth highlands use gentle green forest haze.
- Coastal cliffs use pale ocean mist with a visible sea horizon.
- Hot springs use warmer steam-like haze without making the whole biome opaque.
- Cave fog is subtle and should not block navigation.
- Nether deep crack fog is stronger and moodier, but still readable.

Fog files live in `resource_packs/WorldUpliftRP/fogs/`. Start with `be_default_realistic_fog.json` for global tuning, then adjust biome files such as `be_alpine_peaks_fog.json`, `be_deep_valleys_fog.json`, or `be_coastal_cliffs_fog.json`. Higher `fog_start`, higher `fog_end`, and lower `max_density` make the world clearer.

Profiles are available through `/scriptevent be:fog profile <performance|balanced|cinematic|server>`. Performance adds slightly more far-distance blending to hide low-detail terrain. Balanced is the default. Cinematic gives the clearest long-range horizon. Server stays moderate and stable.

Bedrock limitation: static biome fog is resource-pack driven. The script controller attempts to use Bedrock's `/fog` command for runtime profile and biome tests, but if a runtime blocks that command, the pack falls back to the static biome fog files without crashing.

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

## UI Branding

The Resource Pack includes Bedrock Evolved UI branding as a subtle add-on overlay. It does not replace the official Minecraft logo and does not claim Mojang or Microsoft affiliation.

Logo files:

- `resource_packs/WorldUpliftRP/textures/ui/branding/bedrock_evolved_logo.png`
- `resource_packs/WorldUpliftRP/textures/ui/branding/bedrock_evolved_logo_small.png`
- `resource_packs/WorldUpliftRP/textures/ui/branding/bedrock_evolved_logo_wide.png`

UI files:

- `resource_packs/WorldUpliftRP/ui/be_branding_common.json`
- `resource_packs/WorldUpliftRP/ui/be_loading_screen_branding.json`
- `resource_packs/WorldUpliftRP/ui/be_world_create_branding.json`
- `resource_packs/WorldUpliftRP/ui/be_pause_screen_branding.json`
- `resource_packs/WorldUpliftRP/ui/be_branding_config.json`

The new files are registered in `resource_packs/WorldUpliftRP/ui/_ui_defs.json`. They add a center/upper logo for loading-style progress screens and a small bottom-right badge for the pause menu. The world creation/generation overlay uses the text `Evolving your world...` with a subtle subtitle.

To replace the logo, keep the same file names and use transparent PNGs. Recommended source size is at least `1024 x 360` for the main logo. Keep the background transparent so the logo blends into Bedrock UI screens.

To disable branding, remove these entries from `_ui_defs.json`:

- `ui/be_branding_config.json`
- `ui/be_branding_common.json`
- `ui/be_loading_screen_branding.json`
- `ui/be_world_create_branding.json`
- `ui/be_pause_screen_branding.json`

Known limitation: Bedrock JSON UI target names can shift between versions, especially as parts of the UI move toward newer systems. These files patch the `progress_screen` and `pause` namespaces with modular `modifications` so a missing target should not break the rest of the pack, but a specific overlay may not appear on every Bedrock build. Back up the pack before editing UI JSON.

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

## Bedrock Evolved: Terrain Uplift

Terrain Uplift is integrated into this same add-on under the `be_terrain` data namespace and `/scriptevent be:terrain` command namespace. It is terrain-only: biomes, scenic features, waterfalls, snowlines, cave mouths, old roads, coastal cliffs, forest density, rare landmarks, underground ruins, hot springs, rare fireflies, waterfall mist, and valley ambience.

Commands:

- `/scriptevent be:terrain on`
- `/scriptevent be:terrain off`
- `/scriptevent be:terrain status`
- `/scriptevent be:terrain profile performance`
- `/scriptevent be:terrain profile balanced`
- `/scriptevent be:terrain profile cinematic`
- `/scriptevent be:terrain debug on`
- `/scriptevent be:terrain debug off`
- `/scriptevent be:terrain decorate`
- `/scriptevent be:terrain landmark`
- `/scriptevent be:terrain snowline`
- `/scriptevent be:terrain waterfalls`

The module adds custom biome JSON prototypes for alpine peaks, alpine foothills, shattered cliffs, deep valleys, old-growth highlands, highland groves, crater lakes, coastal cliffs, hot springs, and forest edges. It also adds feature and feature-rule JSON for mountain spires, boulders, snowline patches, waterfalls, cave mouths, forest detail, rivers, ruins, coastal cliffs, fantasy floating cliffs, and hot springs. Mountain and highland biomes now bias harder toward mountain-style height and higher peak feature placement in new chunks.

Bedrock limitation notes:

- Bedrock add-ons cannot fully rewrite the native terrain engine like a Java core mod.
- True infinite height or guaranteed 1000+ block terrain is not possible from a pure add-on.
- Existing chunks will not fully regenerate. Script decorators add scenic details only around active players in loaded areas.
- New unexplored chunks work best for custom biome and feature-rule data.

Performance behavior:

- The module scans only around active players.
- It uses movement thresholds before rescanning.
- Block and structure work is queued through strict budgets.
- Rare landmarks are tracked so they do not spam a region.
- Missing `.mcstructure` files are logged/skipped or replaced by small fallback block hints.

Structure templates for `terrain:*` and `ruins:*` are documented in `behavior_packs/WorldUpliftBP/structures/terrain/README.md` and `behavior_packs/WorldUpliftBP/structures/ruins/README.md`. Export production versions with Bedrock structure blocks using the listed IDs.

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

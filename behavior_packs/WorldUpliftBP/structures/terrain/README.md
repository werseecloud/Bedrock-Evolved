# Terrain Uplift Structure Placeholders

The script and feature JSONs reference these structure IDs. Missing structures are allowed in this prototype: script placement logs/skips or uses a small fallback.

| Structure | Suggested size | Palette | Context |
| --- | ---: | --- | --- |
| terrain:cliff_arch_01 | 13x11x5 | stone, andesite, calcite | mountain cliff arch |
| terrain:cliff_arch_02 | 15x13x6 | deepslate, tuff | shattered cliff arch |
| terrain:cave_mouth_small_01 | 7x5x5 | stone, gravel, air | small cliff cave |
| terrain:cave_mouth_large_01 | 11x8x9 | stone, deepslate, gravel, air | large mountain cave |
| terrain:frozen_cave_mouth_01 | 9x7x7 | packed ice, snow, stone, air | high snow cave |
| terrain:mossy_cave_mouth_01 | 9x6x7 | moss, stone, vines, air | valley cave |
| terrain:waterfall_cliff_01 | 9x18x9 | stone, moss, water | safe waterfall facade |
| terrain:crater_lake_01 | 24x8x24 | tuff, basalt, water | rare crater lake |
| terrain:floating_cliff_01 | 18x12x18 | stone, grass, vines | rare floating cliff |
| terrain:floating_cliff_02 | 16x10x16 | deepslate, glowstone | rare fantasy cliff |
| terrain:hot_spring_01 | 13x5x13 | smooth basalt, water, calcite | hot spring pool |
| terrain:mountain_spring_01 | 9x5x9 | stone, water, moss | river source |
| terrain:sea_cave_01 | 11x6x9 | stone, gravel, water, air | coastal cave |
| terrain:coastal_arch_01 | 12x9x5 | stone, calcite, gravel | coastal arch |
| ruins:ancient_tower_01 | 9x18x9 | stone bricks, mossy cobble | rare tower |
| ruins:ancient_tower_02 | 11x20x11 | deepslate bricks, lanterns | rare tower variant |
| ruins:ruined_castle_01 | 22x14x20 | cracked stone bricks, moss | mountain castle |
| ruins:underground_chamber_01 | 11x6x11 | stone bricks, air, chest | underground ruin pocket |
| ruins:underground_shrine_01 | 9x6x9 | deepslate, candles, chest | cave shrine |
| ruins:ancient_road_segment_01 | 9x3x5 | gravel, cracked bricks | ancient road |
| ruins:ancient_road_segment_02 | 11x3x5 | coarse dirt, mossy cobble | ancient road variant |
| ruins:broken_bridge_01 | 13x6x5 | stone brick, fences | broken bridge |

Export each build with a Bedrock structure block using the namespace/path shown before the colon and file name after it. Keep block counts low and avoid entities/redstone for terrain landmarks.
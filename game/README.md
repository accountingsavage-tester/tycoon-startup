# Startup Tycoon Game Architecture

The game layer is built around Phaser 3. Next.js is the shell and UI; Phaser owns the simulation, scenes, entities, movement and rendering.

Planned scenes:
- BootScene
- TownScene
- StoreScene
- UIScene

Planned systems:
- Player movement and collision
- Customer state machine and pathfinding
- Store build mode
- Inventory and economy
- Employee AI
- Day/night simulation
- Persistent campaign save

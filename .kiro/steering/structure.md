# Project Structure

```
/
├── index.html              # Main game file (all code lives here)
├── game-config.json        # Reference configuration values (physics, walls, canvas, etc.)
├── ghosty-sprites.md       # Sprite sheet specifications and animation details
├── README.md               # Project overview
├── LICENCE.md              # License file
├── assets/
│   ├── ghosty.png          # Ghost sprite sheet (192×32, 6 frames)
│   ├── jump.wav            # Flap sound effect
│   ├── game_over.wav       # Collision sound effect
│   ├── score.wav           # Score chime (planned)
│   └── background_music.mp3 # Background music (planned)
├── img/
│   └── example-ui.png      # UI mockup reference
└── .kiro/
    ├── specs/flappy-kiro/  # Feature spec (requirements, design, tasks)
    └── steering/           # AI steering rules (this directory)
```

## Conventions
- The game is a **single-file** application — all code goes in `index.html`
- Assets are referenced by relative path from `index.html` (e.g., `assets/ghosty.png`)
- No `src/` folder, no modules, no imports — everything is inline
- Configuration constants are defined in a `CONFIG` object at the top of the `<script>` block
- Game state is managed in a single `gameState` object
- Rendering follows strict layer order (back-to-front): sky → clouds → pipes → ground → particles → ghost → UI

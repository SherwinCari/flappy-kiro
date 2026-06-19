# Tech Stack

## Architecture
- **Single-file application**: All markup, styles, and JavaScript in one `index.html`
- **Zero dependencies**: No frameworks, no build tools, no bundling
- **Vanilla JavaScript** with HTML5 Canvas 2D API
- **Game loop**: `requestAnimationFrame` with delta-time for frame-independent physics

## Key Technical Decisions
- Fixed logical coordinate system (400×600) scaled to viewport
- Circle-vs-AABB collision detection (circular ghost hitbox, rectangular pipe hitboxes)
- State machine with three states: `idle`, `running`, `gameover`
- Object pooling for particles to reduce GC pressure
- All game constants defined in a CONFIG object at the top of the script
- Game configuration values stored in `game-config.json` for reference

## Audio
- Preloaded HTML5 Audio elements
- Cloned Audio nodes for overlapping short sounds
- Autoplay policy compliance via deferred playback until first interaction

## Storage
- `localStorage` key: `flappyKiro_highScore`
- Graceful fallback to 0 on read/write failures

## Assets
- `assets/ghosty.png` — Sprite sheet (192×32, 6 frames of 32×32)
- `assets/jump.wav` — Flap sound effect
- `assets/game_over.wav` — Collision sound effect
- `assets/score.wav` — Score chime (to be created)
- `assets/background_music.mp3` — Background music (to be created)

## Commands
No build step required. To run:
- Open `index.html` in a browser, or
- Serve with any static file server (e.g., `npx serve .` or `python -m http.server`)

## Browser Compatibility
- All modern browsers (Chrome, Firefox, Safari, Edge)
- Touch events for mobile, mouse/keyboard for desktop

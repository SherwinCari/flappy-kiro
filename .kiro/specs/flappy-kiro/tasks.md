# Implementation Plan: Flappy Kiro

## Overview

Implement a retro browser-based endless side-scroller game as a single `index.html` file using vanilla JavaScript and the HTML5 Canvas API. The game features a ghost character with sprite animations navigating pipe gaps, time-based frame-independent physics (gravity 800 px/s², flap velocity -300 px/s), circle-vs-AABB collision detection, progressive difficulty, audio feedback, particle effects, UI screens, and responsive scaling. All game logic, styles, and markup reside in one file with external asset references for sprites and audio.

## Tasks

- [ ] 1. Generate asset documentation and configuration files
  - [ ] 1.1 Generate `game-config.json` with complete physics parameters
    - Create `game-config.json` at the project root containing all physics constants: gravity (800 px/s²), jump/flap velocity (-300 px/s), wall/pipe speed (120 px/s), gap size (140px), wall/pipe spacing (350px), max fall speed (600 px/s), max rise speed (-720 px/s), max delta time (0.05s), speed increment (6 px/s per 5 points), max pipe speed (300 px/s)
    - Include canvas dimensions (logical 400×600, min 300×400), ground height (60px), pipe width (50px), min pipe height (50px)
    - Include timing values: restart delay (500ms), shake duration (300ms), popup duration (800ms), particle lifespan (500ms)
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 4.1, 4.2, 4.3, 4.5, 10.2, 10.5_

  - [ ] 1.2 Create `ghosty-sprites.md` with detailed character specifications
    - Document sprite dimensions: 32×32 pixels per frame, 192×32 pixel sprite sheet (6 frames horizontal)
    - Document animation states: idle (frames 0-1, 300ms per frame, loops), flap (frames 2-3-4, 80ms per frame, returns to idle), death (frame 5, static hold)
    - Document hitbox: circular, radius 12px, centered at (16, 16) relative to sprite top-left, 4px visual buffer on each side
    - Document animation transitions: idle→flap on input, flap→idle on completion, any→death on collision
    - _Requirements: 9.2, 5.1_

  - [ ] 1.3 Develop `audio-assets.md` with sound design specifications
    - Document flap sound: short whoosh, 0.1s duration, upward frequency sweep (800Hz→1200Hz), volume 0.5, allows overlap
    - Document score sound: pleasant chime, 0.2s duration, two ascending tones (C5→E5), bell-like timbre, volume 0.6, allows overlap
    - Document collision sound: soft thud, 0.3s duration, low frequency impact (200Hz) with white noise burst, volume 0.7, exclusive playback (interrupts others)
    - Document background music: loops continuously at volume 0.3 during running state, pauses on game-over, resumes on restart
    - Document audio playback rules: preload all on page load, clone nodes for overlapping short sounds, defer music until first interaction, try/catch all play calls
    - _Requirements: 2.3, 6.4, 8.2, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ] 1.4 Generate `ui-mockups.md` with interface designs
    - Document main menu layout: title "FLAPPY KIRO" at ~30% from top, ghost with idle animation centered, Play button (160×40px, green #2ecc40, rounded), High score display (160×40px, semi-transparent), pulsing instruction text "Tap or click to start" (0.5↔1.0 opacity, 1s cycle)
    - Document in-game HUD: score "Score: X" bottom-left overlapping ground strip, high score "High: X" bottom-right, 16px monospace white with dark shadow, "+1" popup at ghost position floating up 30px fading over 800ms
    - Document game-over screen: semi-transparent dark overlay (rgba(0,0,0,0.7)), centered panel ~280×200px, "GAME OVER" 24px bold white, final/best scores 18px, conditional "New High Score!" badge in gold (#FFD700), pulsing restart prompt after 500ms delay
    - Document render layer order (back-to-front): sky → clouds → pipes → ground → particles → ghost → score popups → score display → game-over overlay → menu elements
    - _Requirements: 1.3, 1.4, 6.3, 6.5, 7.5, 8.4, 9.6_

- [ ] 2. Set up project structure and core game scaffold
  - [ ] 2.1 Create the index.html file with canvas, styles, and script scaffold
    - Create a single `index.html` with full-viewport canvas, CSS for no-scrollbars/margins, and a `<script>` block containing the CONFIG constants object (using time-based values: GRAVITY=800, FLAP_VELOCITY=-300, BASE_PIPE_SPEED=120, GAP_HEIGHT=140, SPAWN_SPACING=350), gameState object, and empty placeholder functions for the game loop
    - Include the asset references (ghosty.png sprite sheet, audio files)
    - Set up the canvas context and logical coordinate system (400×600)
    - _Requirements: 1.1, 1.3, 10.1_

  - [ ] 2.2 Implement the ResizeHandler and responsive canvas scaling
    - Implement the resize handler that scales the canvas to viewport dimensions while maintaining the 400:600 aspect ratio with letterboxing
    - Enforce minimum canvas size of 300×400 with scrolling below that threshold
    - Compute scale factor as canvasHeight / logicalHeight, apply uniform scaling to all elements
    - Recalculate scale factor and offsets on window resize events
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 2.3 Write property test for responsive scaling (Property 18)
    - **Property 18: Responsive scaling preserves aspect ratio**
    - Generate arbitrary viewport dimensions above minimum thresholds (300×400), verify computed scale and letterbox offsets produce a play area with the fixed 400:600 aspect ratio and all elements scaled by the same factor
    - **Validates: Requirements 10.2, 10.3**

- [ ] 3. Implement ghost physics, sprite animation, and input handling
  - [ ] 3.1 Implement the Ghost object with time-based physics and sprite animation
    - Create the Ghost with initial position at 25% horizontal, vertically centered
    - Implement `applyGravity(dt)`: vy += 800 * dt (time-based, px/s²)
    - Implement `updatePosition(dt)`: y += vy * dt (time-based, px/s)
    - Implement velocity clamping to [-720, 600] px/s range
    - Implement top-edge boundary clamping (y < 0 → y = 0, vy = 0)
    - Implement sprite animation system: load 32×32px frames from sprite sheet, track current animation state (idle/flap/death), advance frames based on elapsed time (idle: 300ms/frame, flap: 80ms/frame)
    - Implement animation transitions: idle→flap on input, flap→idle on completion, any→death on collision
    - Implement circular hitbox: `getHitbox()` returns { cx: x+16, cy: y+16, radius: 12 }
    - Render ghost using sprite sheet frame; fallback to colored rectangle if sprite fails to load
    - _Requirements: 1.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 9.2_

  - [ ] 3.2 Implement input handling (click, tap, spacebar) and flap mechanics
    - Register mousedown, touchstart, and keydown (spacebar) event listeners
    - On flap input: set ghost velocity to exactly -300 px/s (overriding current velocity)
    - Trigger flap animation state transition on input
    - Transition from idle to running state on first flap input
    - Show start-prompt text on canvas during idle state
    - Ignore flap inputs during game-over state until 500ms delay has passed
    - _Requirements: 1.4, 1.5, 2.1, 2.2, 2.4, 3.7_

  - [ ]* 3.3 Write property tests for ghost physics (Properties 1-6)
    - **Property 1: Flap velocity override** — generate random velocities, verify flap always produces -300 px/s
    - **Property 2: Delta-time clamping** — generate arbitrary numbers (including negatives, NaN-adjacent, very large), verify output in [0, 0.05] seconds
    - **Property 3: Gravity application** — generate (vy, dt) pairs with dt in [0, 0.05], verify newVy = vy + 800 * dt
    - **Property 4: Position update** — generate (y, vy, dt) triples with dt in [0, 0.05], verify newY = y + vy * dt
    - **Property 5: Velocity clamping invariant** — generate arbitrary velocities after physics updates, verify clamped to [-720, 600] px/s
    - **Property 6: Top-edge boundary clamping** — generate positions where y < 0, verify y → 0 and vy → 0
    - **Validates: Requirements 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.8**

- [ ] 4. Checkpoint - Core physics verified
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement pipe generation, movement, and collision detection
  - [ ] 5.1 Implement PipeManager with generation, movement, and cleanup
    - Generate new pipe pairs when horizontal distance from last pipe exceeds 350 logical pixels (SPAWN_SPACING)
    - Randomize gap center Y with constraints: min 50px top pipe height, min 50px bottom pipe height above ground, fixed gap height of 140px
    - Render pipes as green rectangles with 50px width
    - Move pipes leftward at base speed of 120 px/s scaled by dt (time-based)
    - Implement speed scaling: currentSpeed = min(120 + 6 × floor(score / 5), 300) px/s
    - Remove pipes that move entirely off-screen left (x + width < 0)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 5.2 Implement CollisionDetector with circle-vs-AABB overlap checks
    - Implement `circleRectOverlap(circle, rect)`: find closest point on rect to circle center, return true if distance ≤ circle radius
    - Implement `checkPipeCollision(ghostCircle, pipe)`: test ghost circular hitbox (radius 12px) against top pipe rect and bottom pipe rect using circle-vs-AABB
    - Implement `checkGroundCollision(ghostCircle, groundY)`: test if circle bottom (cy + radius) meets or exceeds ground top
    - On collision: stop ghost position updates, trigger death animation, transition to game-over state within same frame
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 5.3 Write property tests for pipes and collision (Properties 7-10)
    - **Property 7: Pipe speed scaling** — generate scores 0-150, verify speed = min(120 + 6 × floor(score/5), 300) px/s
    - **Property 8: Pipe offscreen cleanup** — generate pipe arrays with some x + width < 0, verify removal
    - **Property 9: Gap position bounds** — generate (canvasHeight, groundHeight), verify gap constraints ensure min 50px top pipe and min 50px bottom pipe with 140px gap
    - **Property 10: Circle-vs-AABB collision correctness** — generate arbitrary circles and rectangles, verify collision returns true iff closest point on rect to circle center is within radius
    - **Validates: Requirements 4.2, 4.5, 4.6, 5.1, 5.2**

- [ ] 6. Implement scoring system
  - [ ] 6.1 Implement ScoreManager with scoring, popups, and high score persistence
    - Increment score by 1 when ghost horizontal center passes pipe trailing edge (x + width)
    - Mark each pipe as scored to prevent double-counting
    - Display current score as "Score: X" bottom-left and high score as "High: X" bottom-right, 16px monospace white with dark shadow
    - Display "+1" Score_Popup at ghost position that animates upward 30px and fades over 800ms (opacity = 1 - t/800, offset = 30 × t/800)
    - Load high score from localStorage on page load (key: `flappyKiro_highScore`, default to 0 if absent/non-numeric via parseInt || 0)
    - Save new high score to localStorage when current score > stored value, wrapped in try/catch
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 6.2 Write property tests for scoring (Properties 11-13)
    - **Property 11: Score increments exactly once per pipe** — generate frame sequences where ghost passes pipe trailing edge, verify single increment per pipe and no re-count
    - **Property 12: Score popup animation decay** — generate elapsed times [0, 800]ms, verify opacity = (1 - t/800) and offset = 30 × (t/800)
    - **Property 13: High score persistence logic** — generate (currentScore, storedHighScore) pairs + invalid localStorage values (null, undefined, non-numeric), verify write iff current > stored and loadHighScore returns 0 for invalid
    - **Validates: Requirements 6.1, 6.2, 6.5, 7.2, 7.4**

- [ ] 7. Checkpoint - Core gameplay loop complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement game-over, restart, screen shake, and UI screens
  - [ ] 8.1 Implement UIManager with main menu, HUD, and game-over overlay
    - Implement `renderMainMenu()`: title "FLAPPY KIRO" centered at ~30% from top, ghost with idle animation, Play button (160×40px green), high score display, pulsing instruction text (0.5↔1.0 opacity, 1s cycle)
    - Implement `renderHUD()`: "Score: X" bottom-left, "High: X" bottom-right, 16px monospace white with dark shadow for readability
    - Implement `renderGameOver()`: semi-transparent dark overlay (rgba(0,0,0,0.7)), centered panel ~280×200px, "GAME OVER" 24px bold, final/best scores, conditional "New High Score!" in gold (#FFD700), pulsing restart prompt visible after 500ms
    - Implement `update(dt)`: advance pulse animation phase for pulsing text effects
    - _Requirements: 1.3, 1.4, 6.3, 7.5, 8.4_

  - [ ] 8.2 Implement game-over state and restart logic
    - Stop updating ghost/pipes and freeze current frame on collision
    - Display game-over overlay via UIManager with final score, high score, and restart prompt
    - Implement 500ms restart delay before accepting new flap input
    - On restart: reset score, remove pipes, reset pipe speed to 120 px/s, reposition ghost, reset animations to idle, start new loop
    - _Requirements: 8.1, 8.4, 8.5, 8.6_

  - [ ] 8.3 Implement ScreenShake effect
    - Trigger on collision: apply random displacement between -5 and 5 pixels on both axes for 300ms
    - Implement linear decay: intensity multiplier = (1 - elapsed/300), offsets = random(-5,5) × multiplier
    - Apply offset to canvas rendering context translation during shake
    - Reset shake state on game restart
    - _Requirements: 8.3_

  - [ ]* 8.4 Write property tests for game-over mechanics (Properties 14-15)
    - **Property 14: Screen shake linear decay** — generate elapsed times [0, 300]ms, verify intensity multiplier = (1 - t/300) producing offsets in [-5×multiplier, 5×multiplier]
    - **Property 15: Restart delay enforcement** — generate elapsed times since game-over, verify restart permitted iff elapsed ≥ 500ms
    - **Validates: Requirements 8.3, 8.5, 8.6**

- [ ] 9. Implement visual effects and rendering layers
  - [ ] 9.1 Implement CloudManager with parallax scrolling
    - Initialize 3-6 clouds as white rounded rectangles at varying heights between top and ground
    - Assign each cloud a speed between 15-60 px/s (time-based) with correlated opacity (0.3-0.7)
    - Enforce speed-opacity correlation: for any two clouds where A.speed > B.speed, A.opacity ≥ B.opacity
    - Scroll clouds leftward using dt-based movement, wrap around when off-screen
    - _Requirements: 9.3, 9.5_

  - [ ] 9.2 Implement ParticleSystem for ghost trail
    - Emit one particle every 3 frames at ghost center-left edge with ±3px vertical randomness
    - Each particle: translucent white circle, radius 2-4px, opacity starts at 0.6
    - Decay opacity: opacity = 0.6 × (1 - elapsed/500), remove when elapsed ≥ 500ms
    - Use object pooling to avoid garbage collection pressure during gameplay
    - _Requirements: 9.7, 9.8, 9.9_

  - [ ] 9.3 Implement the full render pipeline with correct layer ordering
    - Render in back-to-front order: sky background (#87CEEB) → clouds (slowest to fastest) → pipes (green #2ecc40) → ground (dark navy #1a1a3e) → particles → ghost sprite → score popups → HUD score display → game-over overlay → menu elements
    - Apply screen shake offset to all rendering when active
    - Render ghost using correct sprite animation frame based on current animation state
    - _Requirements: 9.1, 9.4, 9.6_

  - [ ]* 9.4 Write property tests for visual effects (Properties 16-17)
    - **Property 16: Cloud initialization invariants** — generate parameters, verify count in [3,6], speed in [15,60] px/s, opacity in [0.3,0.7], and for any two clouds A,B where A.speed > B.speed → A.opacity ≥ B.opacity
    - **Property 17: Particle opacity decay** — generate elapsed times [0, 500]ms, verify opacity = 0.6 × (1 - t/500) and particle removed when t ≥ 500
    - **Validates: Requirements 9.3, 9.5, 9.8**

- [ ] 10. Implement audio system
  - [ ] 10.1 Implement AudioManager with preloading, playback, and autoplay compliance
    - Preload all audio assets (jump.wav, game_over.wav, score.wav, background_music.mp3) on page load
    - Play jump.wav (0.1s whoosh, volume 0.5) on flap input during running state — use cloned Audio nodes for overlapping playback
    - Play score.wav (0.2s chime, volume 0.6) on score increment — use cloned Audio nodes for overlapping playback
    - Play game_over.wav (0.3s thud, volume 0.7) on collision — exclusive playback, interrupts other sounds
    - Loop background_music.mp3 at volume 0.3 during running state, pause on game-over, resume from beginning on restart
    - Defer music playback until first user interaction for autoplay policy compliance (handle AudioContext unlock)
    - Wrap all play calls in try/catch; emit console.warn on failure without interrupting gameplay
    - _Requirements: 2.3, 6.4, 8.2, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 11. Final integration and wiring
  - [ ] 11.1 Wire the complete game loop connecting all systems
    - Implement the main game loop using requestAnimationFrame with delta-time calculation
    - Clamp delta-time to [0, 0.05] seconds (MAX_DELTA_TIME)
    - In running state: update ghost physics (gravity + position) → update sprite animation → update pipes → check circle-vs-AABB collisions → update particles → check scoring → update popups → update shake → update clouds → update UIManager
    - In idle state: render scene with UIManager main menu, ghost idle animation, no physics/pipe scrolling
    - In game-over state: render frozen frame with UIManager game-over overlay
    - Connect all input handlers, audio triggers, and state transitions
    - Wait for sprite image onload before starting game loop
    - _Requirements: 1.5, 3.1, 9.1_

  - [ ] 11.2 Implement state preservation on resize during gameplay
    - On resize during running state: recalculate scale/offsets without resetting game state
    - Maintain ghost relative position, pipe positions, score, and animation states
    - _Requirements: 10.4_

  - [ ]* 11.3 Write integration tests for end-to-end game flow
    - Test game state transitions (idle → running → gameover → running)
    - Test flap sets velocity to -300 px/s and triggers flap animation
    - Test circle-vs-AABB collision triggers game-over and death animation
    - Test scoring triggers audio and popup creation
    - Test resize preserves game state
    - Test localStorage integration for high score
    - _Requirements: 1.5, 5.1, 6.1, 7.3, 8.5, 10.4_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using the fast-check library
- Unit tests validate specific examples and edge cases
- The game is implemented as a single `index.html` file with no build tools or external dependencies beyond asset files
- All code examples and implementations use vanilla JavaScript
- Physics use time-based calculations (px/s, px/s²) with delta-time in seconds, NOT frame-based scaling
- Collision detection uses circle-vs-AABB (ghost circular hitbox radius 12px vs pipe/ground rectangles)
- Sprite animation uses a 32×32px frame system with state-based transitions (idle/flap/death)
- Audio design uses short overlapping sounds (flap 0.1s, score 0.2s) and exclusive collision sound (0.3s)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["2.3", "3.1"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["3.3", "5.1"] },
    { "id": 6, "tasks": ["5.2", "6.1"] },
    { "id": 7, "tasks": ["5.3", "6.2", "8.1"] },
    { "id": 8, "tasks": ["8.2", "8.3"] },
    { "id": 9, "tasks": ["8.4", "9.1", "9.2"] },
    { "id": 10, "tasks": ["9.3"] },
    { "id": 11, "tasks": ["9.4", "10.1"] },
    { "id": 12, "tasks": ["11.1"] },
    { "id": 13, "tasks": ["11.2"] },
    { "id": 14, "tasks": ["11.3"] }
  ]
}
```

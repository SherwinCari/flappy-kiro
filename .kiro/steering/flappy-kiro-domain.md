# Flappy Kiro Domain Knowledge

## Game States

The game operates as a three-state machine. Every system must check the current state before acting.

```
┌──────┐   flap input   ┌─────────┐   collision   ┌──────────┐
│ idle │ ──────────────→ │ running │ ────────────→ │ gameover │
└──────┘                 └─────────┘               └──────────┘
    ↑                                                    │
    └────────────────── restart (after 500ms) ───────────┘
```

### Idle State
- Game loop runs (renders scene) but no physics applied
- Ghost displayed at starting position with idle animation
- Clouds drift at their assigned speeds
- Main menu overlay visible
- Any flap input transitions to `running` AND applies the first flap

### Running State
- Full physics active (gravity, velocity, position integration)
- Pipes spawn and scroll
- Collisions checked every frame
- Particles emitted
- Scoring active
- Background music playing

### Game Over State
- Physics frozen — ghost stays at collision position
- Pipes stop moving
- Screen shake plays for 300ms
- Game-over overlay shown
- Input ignored for first 500ms (prevent accidental restart)
- After 500ms, any flap input triggers restart

## Ghosty Behavior

### Starting Position
- x: `LOGICAL_WIDTH * 0.25` (100px from left in 400px space)
- y: `LOGICAL_HEIGHT / 2` (300px, vertically centered)
- vy: 0 (no initial velocity)

### During Running State
- x position is FIXED — ghost never moves horizontally
- Only y and vy change during gameplay
- Ghost is always at 25% from the left edge

### On Flap
1. Set `vy = -300` (override current velocity)
2. Play `jump.wav`
3. Switch animation to `flap`
4. Ghost continues to be affected by gravity on subsequent frames

### On Collision
1. Freeze position (no more physics updates)
2. Switch animation to `death` (frame 5, hold)
3. Play `game_over.wav`
4. Trigger screen shake
5. Stop background music
6. Transition to `gameover` state

### Boundary Behavior
- **Top edge (y < 0)**: Clamp y to 0, set vy to 0. Ghost stays alive.
- **Ground**: Treated as collision — triggers game over. Ghost does NOT bounce or slide.

## Obstacle Generation

### Pipe Pair Structure
Each obstacle consists of:
- **Top pipe**: Rectangle from y=0 to `gapCenter - 70`
- **Bottom pipe**: Rectangle from `gapCenter + 70` to ground top
- **Gap**: 140px vertical opening between the two pipes
- **Width**: 50px for both pipes

### Spawning Rules
- First pipe spawns at x = `LOGICAL_WIDTH + SPAWN_SPACING` (off-screen right)
- New pipe spawns when the rightmost pipe's x ≤ `LOGICAL_WIDTH - SPAWN_SPACING`
- Spawn spacing: 350px horizontal distance between consecutive pipe pairs
- This ensures at most 2–3 pipes are visible on screen at any time

### Gap Positioning Algorithm
```javascript
const MIN_PIPE_HEIGHT = 50;
const GAP_SIZE = 140;
const GROUND_HEIGHT = 60;

function generateGapCenter() {
  const minY = MIN_PIPE_HEIGHT + GAP_SIZE / 2;          // 120px
  const maxY = LOGICAL_HEIGHT - GROUND_HEIGHT - MIN_PIPE_HEIGHT - GAP_SIZE / 2; // 420px
  return minY + Math.random() * (maxY - minY);          // uniform [120, 420]
}
```

### Constraints
- Top pipe always has at least 50px of visible height
- Bottom pipe always has at least 50px of visible height above ground
- Gap size is fixed at 140px (never changes with difficulty)
- Gap position is uniformly random within valid range (no weighted distribution)

## Difficulty Progression

### Speed Scaling Formula
```javascript
currentSpeed = Math.min(BASE_SPEED + INCREMENT * Math.floor(score / INTERVAL), MAX_SPEED);
// BASE_SPEED = 120 px/s
// INCREMENT = 10 px/s
// INTERVAL = 5 points
// MAX_SPEED = 300 px/s
```

### What Changes With Difficulty
- Pipe horizontal scroll speed (increases)
- Effective reaction time for gaps (decreases)

### What Does NOT Change
- Gap size (always 140px)
- Spawn spacing (always 350px)
- Gravity (always 800 px/s²)
- Flap velocity (always -300 px/s)
- Ghost hitbox (always 12px radius)
- Pipe width (always 50px)

### Difficulty Milestones
| Score | Speed | Notes |
|-------|-------|-------|
| 0 | 120 px/s | Comfortable starting pace |
| 5 | 130 px/s | First noticeable increase |
| 10 | 140 px/s | Moderate challenge |
| 25 | 170 px/s | Requires consistent timing |
| 50 | 220 px/s | Advanced territory |
| 90+ | 300 px/s | Maximum — pure reflex |

## Scoring System

### Increment Condition
- Score +1 when: `ghost.x > pipe.x + PIPE_WIDTH && !pipe.scored`
- Meaning: the ghost's left edge has fully passed the pipe's right edge
- Set `pipe.scored = true` immediately to prevent double-counting

### Score Events
On each score increment:
1. Increment `gameState.score`
2. Play `score.wav`
3. Spawn score popup at ghost position
4. Check if speed threshold crossed (every 5 points)

### Score Display
- During gameplay: bottom-left shows `Score: X`, bottom-right shows `High: X`
- On game over overlay: shows final score and best score

## High Score Persistence

### Storage Key
- `localStorage` key: `flappyKiro_highScore`
- Value: string representation of integer score

### Load Pattern
```javascript
function loadHighScore() {
  try {
    return parseInt(localStorage.getItem('flappyKiro_highScore'), 10) || 0;
  } catch (e) {
    return 0; // private browsing or storage unavailable
  }
}
```

### Save Pattern
```javascript
function saveHighScore(score) {
  try {
    if (score > loadHighScore()) {
      localStorage.setItem('flappyKiro_highScore', String(score));
    }
  } catch (e) {
    // silently fail — game continues without persistence
  }
}
```

### When to Save
- Only on transition to `gameover` state
- Only if current score > stored high score
- Never save during gameplay (avoid excessive writes)

### New High Score Detection
- Compare `gameState.score > previousHighScore` at game-over time
- If true: display "New High Score!" badge in gold on the overlay
- Update the in-memory high score value immediately for display

## Game Session Management

### Session Lifecycle
```
Page Load → Init → Idle → [Running → Game Over]* → (page close)
```

### Initialization (Page Load)
1. Create canvas, get 2D context
2. Load sprite image (wait for onload)
3. Preload audio assets
4. Load high score from localStorage
5. Initialize clouds (random positions)
6. Set ghost to starting position
7. Register input listeners
8. Start game loop in `idle` state

### Starting a Session (Idle → Running)
1. Transition state to `running`
2. Apply first flap (vy = -300)
3. Play flap sound
4. Start background music (if first interaction)
5. Begin pipe spawning
6. Begin particle emission

### Ending a Session (Running → Game Over)
1. Detect collision (pipe or ground)
2. Freeze ghost position
3. Transition state to `gameover`
4. Record `gameOverTimestamp = performance.now()`
5. Play collision sound
6. Trigger screen shake
7. Stop background music
8. Compare and save high score
9. Show game-over overlay

### Restart (Game Over → Running)
Precondition: `performance.now() - gameOverTimestamp >= 500`

Reset sequence:
1. `gameState.score = 0`
2. Clear pipes array
3. Reset pipe speed to BASE_SPEED
4. Ghost position → starting position
5. Ghost velocity → 0
6. Clear particles array
7. Clear score popups
8. Reset screen shake
9. Reset sprite animation to idle
10. Transition state to `running`
11. Apply first flap
12. Restart background music from beginning

### Reset Completeness Rule
Every reset function must restore its system to the exact same state as initial page load. No stale references, no leftover timers, no residual particles.

## Collision Responses

### Pipe Collision
- Detected via circle-vs-AABB between ghost hitbox and pipe rectangles
- Ghost freezes at exact collision position (no pushback, no bounce)
- Immediate transition to game over

### Ground Collision
- Detected when ghost bottom edge (`ghost.y + 16 + 12`) reaches ground top (`LOGICAL_HEIGHT - GROUND_HEIGHT`)
- Same response as pipe collision — immediate game over
- Fast-path check: `ghost.y + 28 >= 540` (for 400×600 with 60px ground)

### Top Boundary (NOT a collision)
- Ghost is clamped to y=0, velocity zeroed
- Game continues normally
- This is a soft boundary, not a death condition

## Audio Integration

### Sound Triggers
| Game Event | Sound File | Overlap |
|------------|-----------|---------|
| Flap input (running/idle) | `jump.wav` | Yes (clone) |
| Score increment | `score.wav` | Yes (clone) |
| Collision detected | `game_over.wav` | No (exclusive) |

### Background Music
- File: `background_music.mp3`
- Volume: 0.3
- Starts on first flap input (autoplay policy compliance)
- Loops during `running` state
- Pauses on game over
- Restarts from beginning on game restart

### Audio Failure Handling
- All `play()` calls wrapped in try/catch
- Failed loads logged via `console.warn`
- Game never crashes due to audio errors
- Missing audio files do not block game initialization

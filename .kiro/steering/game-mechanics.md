# Game Mechanics

## Physics Constants

All values operate in a logical coordinate space of 400×600 pixels.

| Constant | Value | Unit | Purpose |
|----------|-------|------|---------|
| GRAVITY | 800 | px/s² | Downward acceleration |
| FLAP_VELOCITY | -300 | px/s | Upward impulse on input |
| MAX_FALL_SPEED | 600 | px/s | Terminal velocity (downward) |
| MAX_RISE_SPEED | -400 | px/s | Max upward speed |
| MAX_DELTA_TIME | 0.05 | seconds | Frame clamp to prevent tunneling |
| BASE_PIPE_SPEED | 120 | px/s | Initial horizontal pipe speed |
| MAX_PIPE_SPEED | 300 | px/s | Speed cap |

## Ghost Movement Physics

### Gravity Simulation
```javascript
// Every frame (dt in seconds, clamped to [0, 0.05]):
ghost.vy += GRAVITY * dt;                          // accelerate downward
ghost.vy = Math.max(MAX_RISE_SPEED, Math.min(ghost.vy, MAX_FALL_SPEED)); // clamp
ghost.y += ghost.vy * dt;                          // integrate position
```

### Flap Input
- On any flap input, set `ghost.vy = FLAP_VELOCITY` (override, not additive)
- This produces a consistent jump height regardless of current velocity
- Flap is instantaneous — no wind-up or acceleration curve

### Boundary Clamping
- **Top edge**: If `ghost.y < 0`, clamp to 0 and set `vy = 0` (kill momentum)
- **Ground**: Collision with ground triggers game over (no clamping)

### Position & Velocity Order of Operations
1. Apply gravity to velocity
2. Clamp velocity
3. Integrate position (`y += vy * dt`)
4. Clamp position to top boundary
5. Check collisions

## Input Handling

### Responsiveness Rules
- Input is processed immediately on the frame it's received — no buffering or delay
- All input types (click, tap, spacebar) produce identical behavior
- During `idle`: flap input transitions to `running` AND applies first flap
- During `running`: flap input sets velocity to FLAP_VELOCITY
- During `gameover`: input ignored for first 500ms, then triggers restart
- Never queue multiple flaps per frame — only one flap per input event

### Touch/Click Normalization
```javascript
// Register all input types to the same handler
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', handleInput);
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') handleInput(e);
});
```

## Wall (Pipe) Generation

### Spawning Algorithm
- First pipe spawns at `canvasWidth + SPAWN_SPACING` on game start
- Subsequent pipes spawn when: `lastPipe.x <= canvasWidth - SPAWN_SPACING`
- Spawn spacing: 350 logical pixels between pipe pair centers

### Gap Positioning
```javascript
function randomGapCenter(canvasHeight, groundHeight) {
  const minY = MIN_PIPE_HEIGHT + GAP_SIZE / 2;
  const maxY = canvasHeight - groundHeight - MIN_PIPE_HEIGHT - GAP_SIZE / 2;
  return minY + Math.random() * (maxY - minY);
}
```

- Gap height: 140px (fixed, never changes)
- Min pipe segment: 50px on both top and bottom
- Gap center is uniformly distributed within valid range
- Pipes never overlap or generate impossible gaps

### Pipe Dimensions
- Width: 50 logical pixels
- Top pipe: extends from y=0 down to `gapCenter - GAP_SIZE/2`
- Bottom pipe: extends from `gapCenter + GAP_SIZE/2` down to ground top

### Movement & Speed Scaling
```javascript
function getPipeSpeed(score) {
  return Math.min(BASE_PIPE_SPEED + SPEED_INCREMENT * Math.floor(score / SCORE_INTERVAL), MAX_PIPE_SPEED);
}
// SPEED_INCREMENT = 10 px/s per interval
// SCORE_INTERVAL = 5 points
```

- Pipes move leftward at `currentSpeed * dt` each frame
- Speed increases by 10 px/s for every 5 points scored
- Capped at 300 px/s maximum

### Cleanup
- Remove pipe pairs when `pipe.x + PIPE_WIDTH < 0` (fully off-screen left)
- Pipes exit in FIFO order — always remove from the front of the array

## Collision Detection

### Ghost Hitbox
- Type: Circle
- Center: `(ghost.x + 16, ghost.y + 16)` — center of the 32×32 sprite
- Radius: 12px (intentionally smaller than sprite for forgiving feel)

### Pipe Hitboxes
Each pipe pair produces two rectangles:
- **Top pipe**: `{ x: pipe.x, y: 0, width: 50, height: gapCenter - GAP_SIZE/2 }`
- **Bottom pipe**: `{ x: pipe.x, y: gapCenter + GAP_SIZE/2, width: 50, height: groundY - (gapCenter + GAP_SIZE/2) }`

### Ground Hitbox
- `{ x: 0, y: canvasHeight - GROUND_HEIGHT, width: canvasWidth, height: GROUND_HEIGHT }`

### Circle-vs-AABB Algorithm
```javascript
function circleRectOverlap(circle, rect) {
  const closestX = Math.max(rect.x, Math.min(circle.cx, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.cy, rect.y + rect.height));
  const dx = circle.cx - closestX;
  const dy = circle.cy - closestY;
  return (dx * dx + dy * dy) <= (circle.radius * circle.radius);
}
```

### Collision Check Optimization
- Only check pipes where `pipe.x < ghost.x + 32` AND `pipe.x + PIPE_WIDTH > ghost.x - 12`
- This limits checks to at most 2 pipes per frame
- Check ground collision separately (simple y-threshold comparison is sufficient as a fast path)

### On Collision
1. Immediately transition to `gameover` state
2. Freeze ghost position (no further physics)
3. Trigger screen shake (300ms, ±5px random displacement, linear decay)
4. Play collision sound
5. Stop background music

## Scoring System

### Score Increment Rule
- Score +1 when ghost's center x passes the pipe's trailing edge (`pipe.x + PIPE_WIDTH`)
- Each pipe has a `scored` flag — set to true after scoring, prevents double-counting
- Check: `ghost.x > pipe.x + PIPE_WIDTH && !pipe.scored`

### Score Popup
- Spawns at ghost position on score increment
- Floats upward 30px over 800ms
- Opacity fades from 1.0 to 0.0 linearly: `opacity = 1 - (elapsed / 800)`
- Remove popup when elapsed ≥ 800ms

### High Score
- Compare on game over: if `score > highScore`, update and persist
- Persist: `localStorage.setItem('flappyKiro_highScore', score)`
- Load: `parseInt(localStorage.getItem('flappyKiro_highScore'), 10) || 0`
- Wrap both in try/catch for private browsing fallback

### Difficulty Curve
| Score | Pipe Speed (px/s) | Effective Gap Time |
|-------|-------------------|--------------------|
| 0–4 | 120 | ~1.17s |
| 5–9 | 130 | ~1.08s |
| 10–14 | 140 | ~1.00s |
| 15–19 | 150 | ~0.93s |
| 20–24 | 160 | ~0.88s |
| ... | +10 per 5 pts | ... |
| 90+ | 300 (max) | ~0.47s |

## Animation & Interpolation

### Ghost Rotation
- During rise (vy < 0): rotate sprite -10° (nose up)
- During fall (vy > 0): rotate proportionally up to +10° — `rotation = Math.min(vy / MAX_FALL_SPEED * 10, 10)` degrees clockwise
- At neutral (vy ≈ 0): no rotation
- Rotation is purely visual — does not affect hitbox

### Sprite Animation Timing
- Idle: 2 frames, 300ms each, looping
- Flap: 3 frames, 80ms each, plays once then returns to idle
- Death: 1 frame, holds indefinitely

### Screen Shake
```javascript
function updateShake(dtMs) {
  if (!shake.active) return;
  shake.elapsed += dtMs;
  if (shake.elapsed >= SHAKE_DURATION) {
    shake.active = false;
    shake.offsetX = 0;
    shake.offsetY = 0;
    return;
  }
  const intensity = SHAKE_INTENSITY * (1 - shake.elapsed / SHAKE_DURATION);
  shake.offsetX = (Math.random() * 2 - 1) * intensity;
  shake.offsetY = (Math.random() * 2 - 1) * intensity;
}
```

### Particle Trail
- Emit every 3 frames while `running`
- Position: ghost center-left with ±3px vertical jitter
- Radius: random 2–4px
- Initial opacity: 0.6, decays linearly to 0 over 500ms
- Remove when life ≤ 0

## Restart Sequence
1. Wait 500ms after game over (ignore input during this window)
2. On valid restart input:
   - Reset score to 0
   - Clear all pipes
   - Reset pipe speed to base (120 px/s)
   - Reposition ghost to starting position (x = 25% of width, y = center)
   - Reset ghost velocity to 0
   - Clear particles and popups
   - Reset shake
   - Transition state to `running`
   - Resume background music from beginning

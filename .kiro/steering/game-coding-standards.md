# Game Coding Standards

## JavaScript Patterns

### Naming Conventions
- **Constants**: `UPPER_SNAKE_CASE` — e.g., `MAX_FALL_SPEED`, `PIPE_WIDTH`
- **Functions**: `camelCase` verbs — e.g., `updateGhost()`, `renderPipes()`, `checkCollision()`
- **State objects**: `camelCase` nouns — e.g., `gameState`, `ghost`, `pipeManager`
- **Booleans**: prefix with `is`/`has`/`can` — e.g., `isRunning`, `hasScored`, `canRestart`
- **Event handlers**: prefix with `handle` — e.g., `handleClick()`, `handleResize()`
- **Render functions**: prefix with `render` or `draw` — e.g., `renderClouds()`, `drawGround()`
- **Update functions**: prefix with `update` — e.g., `updateParticles()`, `updatePhysics()`

### Function Structure
- Keep functions short and single-purpose (update OR render, never both)
- Separate update logic from render logic clearly
- Pass `dt` (delta time in seconds) to all update functions
- Pass `ctx` (canvas context) as first argument to all render functions

```javascript
// Good: clear separation
function updateGhost(dt) { /* physics only */ }
function renderGhost(ctx) { /* drawing only */ }

// Bad: mixed concerns
function ghost(ctx, dt) { /* updates and draws */ }
```

## Game Loop Structure

```javascript
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTimestamp) / 1000, CONFIG.MAX_DELTA_TIME);
  lastTimestamp = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}
```

### Delta-Time Rules
- Always clamp dt to `[0, 0.05]` seconds to prevent tunneling after tab switches
- Multiply all velocities and accelerations by `dt` for frame-independence
- Never use frame-count for timing gameplay events; use accumulated time in ms
- Particle emit interval (every N frames) is the one exception — acceptable for visual-only effects

## State Management

### State Machine Pattern
```javascript
const gameState = {
  current: 'idle', // 'idle' | 'running' | 'gameover'
  transition(newState) {
    this.current = newState;
    // trigger state entry logic here
  }
};
```

- All game state lives in a single `gameState` object
- State transitions happen in one place via a `transition()` function
- Guard clauses at the top of update/input handlers check current state
- Never mutate state during rendering — render is read-only

### Input Handling
- Register input listeners once at initialization
- Set flags or call actions; never do game logic inside event handlers
- Normalize touch/click/keyboard into a single `flap()` action

```javascript
function handleInput() {
  if (gameState.current === 'idle' || gameState.current === 'running') {
    flap();
  } else if (gameState.current === 'gameover' && canRestart()) {
    restart();
  }
}
```

## Canvas API Patterns

### Context Setup
- Get context once and store as a module-level variable
- Use `ctx.save()` / `ctx.restore()` around transforms (shake, scaling)
- Clear the full canvas each frame before drawing

### Coordinate System
- All game logic operates in logical coordinates (400×600)
- Scale to physical pixels via a single `ctx.setTransform()` call
- Never mix logical and physical pixel values in game logic

### Efficient Rendering
- Draw layers back-to-front in a fixed order (sky → clouds → pipes → ground → particles → ghost → UI)
- Batch similar draw calls (all pipes in one loop, all particles in one loop)
- Use `ctx.globalAlpha` for fade effects rather than creating new colors each frame
- Avoid `ctx.font` reassignment unless the font actually changes

```javascript
function render() {
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  
  renderBackground(ctx);
  renderClouds(ctx);
  renderPipes(ctx);
  renderGround(ctx);
  renderParticles(ctx);
  renderGhost(ctx);
  renderUI(ctx);
  
  ctx.restore();
}
```

## Collision Detection

### Circle-vs-AABB (primary algorithm)
```javascript
function circleRectOverlap(circle, rect) {
  const closestX = Math.max(rect.x, Math.min(circle.cx, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.cy, rect.y + rect.height));
  const dx = circle.cx - closestX;
  const dy = circle.cy - closestY;
  return (dx * dx + dy * dy) <= (circle.radius * circle.radius);
}
```

- Use squared distance comparisons — avoid `Math.sqrt()` in hot paths
- Ghost uses a circular hitbox (radius 12px, centered on sprite)
- Pipes and ground use axis-aligned rectangles
- Check collisions after position updates, before rendering

### Optimization
- Skip collision checks for pipes that are clearly off-screen or behind the ghost
- Early-exit broad-phase: if `pipe.x > ghost.x + ghost.width`, skip that pipe
- Only check the nearest 2–3 pipes, not the entire array

## Memory Management & Performance

### Object Pooling
- Reuse particle objects from a fixed-size pool instead of allocating new ones
- Reset properties on reuse rather than creating fresh objects
- Pool size should match the max expected active particles

```javascript
// Good: reuse from pool
function emitParticle() {
  const p = particlePool[nextFreeIndex];
  p.x = ghost.x;
  p.y = ghost.y;
  p.life = CONFIG.PARTICLE_LIFESPAN;
  p.active = true;
}

// Bad: allocation in hot loop
function emitParticle() {
  particles.push({ x: ghost.x, y: ghost.y, life: 500 });
}
```

### Avoid GC Pressure
- Pre-allocate arrays at startup with expected max sizes
- Reuse temporary objects (hitbox calculations, vector math) via module-level scratch variables
- Never use `Array.filter()` or `Array.map()` in the game loop — mutate in place
- Use index-based iteration (`for` loops) over `forEach` in hot paths

### Array Management
- Mark inactive items with a flag; compact arrays only when needed
- For pipes: splice from front when off-screen (pipes always exit in order)
- For particles: swap-and-pop or circular buffer for O(1) removal

## Modular Systems

Even though the code lives in a single file, organize it into clearly separated sections:

```javascript
// ═══════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// STATE
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// PHYSICS
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// PIPES
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// COLLISION
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// PARTICLES
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// INPUT
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// GAME LOOP
// ═══════════════════════════════════════
```

- Each section exposes a small public API (update/render/reset functions)
- Minimize cross-section dependencies
- Systems communicate via the shared `gameState` object, not direct function calls between systems
- Reset functions must restore a system to its initial state completely (no stale references)

## Error Handling
- Wrap audio `play()` calls in try/catch — never let audio crash the game loop
- Wrap localStorage access in try/catch — fall back to in-memory values
- If sprite fails to load, render a fallback shape (filled circle, radius 12px, white)
- Never throw in the game loop — catch and log via `console.warn`

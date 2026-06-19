# Visual Design Guidelines

## Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Sky background | Light blue | `#87CEEB` |
| Ground | Dark navy | `#1a1a3e` |
| Pipes | Green | `#2ecc40` |
| Clouds | White | `#ffffff` |
| UI background | Semi-transparent black | `rgba(0, 0, 0, 0.7)` |
| UI text | White | `#ffffff` |
| UI accent (high score) | Gold | `#FFD700` |
| Particle trail | White | `#ffffff` |

## Render Layer Order (back to front)

1. Sky fill (solid `#87CEEB`)
2. Clouds (sorted slowest → fastest for depth)
3. Pipe pairs (green rectangles)
4. Ground strip (dark navy, full width, 60px tall)
5. Particle trail (translucent white circles)
6. Ghost sprite (with rotation transform)
7. Score popups (+1 floating text)
8. HUD (score/high score text)
9. Overlay (game-over panel or main menu)

Always draw in this order. Never reorder layers conditionally.

## Sprite Rendering

### Ghost Sprite Sheet
- Source: `assets/ghosty.png`
- Layout: 6 frames in a horizontal strip, each 32×32px
- Total sheet size: 192×32 pixels

| Index | State | Description |
|-------|-------|-------------|
| 0 | idle-1 | Neutral, wings resting |
| 1 | idle-2 | Slight bob, wings raised |
| 2 | flap-1 | Wings begin upstroke |
| 3 | flap-2 | Wings at full extension |
| 4 | flap-3 | Wings completing downstroke |
| 5 | death | Eyes closed, wings drooped |

### Drawing a Sprite Frame
```javascript
function renderGhost(ctx) {
  const frameX = currentFrame * 32;
  ctx.save();
  ctx.translate(ghost.x + 16, ghost.y + 16);  // move to sprite center
  ctx.rotate(ghostRotation * Math.PI / 180);   // apply rotation
  ctx.drawImage(spriteSheet, frameX, 0, 32, 32, -16, -16, 32, 32);
  ctx.restore();
}
```

### Fallback Rendering
If `ghosty.png` fails to load, render a filled white circle:
```javascript
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.arc(ghost.x + 16, ghost.y + 16, 12, 0, Math.PI * 2);
ctx.fill();
```

## Animation System

### Frame Advancement
```javascript
function updateAnimation(dtMs) {
  sprite.elapsed += dtMs;
  const frameDuration = animations[sprite.currentAnim].frameDuration;
  if (sprite.elapsed >= frameDuration) {
    sprite.elapsed -= frameDuration;
    sprite.frameIndex++;
    // Handle loop or end
    const frames = animations[sprite.currentAnim].frames;
    if (sprite.frameIndex >= frames.length) {
      if (sprite.currentAnim === 'idle') {
        sprite.frameIndex = 0; // loop
      } else if (sprite.currentAnim === 'flap') {
        sprite.currentAnim = 'idle'; // return to idle
        sprite.frameIndex = 0;
      }
      // death holds last frame — no advancement
    }
  }
  sprite.currentFrame = animations[sprite.currentAnim].frames[sprite.frameIndex];
}
```

### Animation Timing
| State | Frames | ms/frame | Behavior |
|-------|--------|----------|----------|
| idle | [0, 1] | 300 | Loops continuously |
| flap | [2, 3, 4] | 80 | Plays once, returns to idle |
| death | [5] | — | Holds indefinitely |

### Transitions
- `idle → flap`: On flap input, immediately switch, reset frameIndex to 0
- `flap → idle`: On animation completion, auto-transition
- `any → death`: On collision, immediately switch, hold frame 5

## Ghost Rotation

- Rising (vy < 0): rotate -10° (counter-clockwise, nose up)
- Falling (vy > 0): rotate proportionally, `min(vy / 600 * 10, 10)°` clockwise
- Neutral: 0° rotation
- Rotation is applied via `ctx.rotate()` around sprite center
- Does NOT affect the circular hitbox — purely visual

## Particle Effects

### Trail Particles
- Emit every 3 frames while state is `running`
- Spawn position: ghost center-left edge, with ±3px random vertical offset
- Appearance: white filled circle, radius 2–4px (random)
- Initial opacity: 0.6
- Decay: linear fade to 0 over 500ms
- Remove particle when opacity reaches 0

### Rendering Particles
```javascript
function renderParticles(ctx) {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (!p.active) continue;
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0; // always reset after
}
```

## Background & Parallax

### Clouds
- Count: 3–6 (randomized at init)
- Shape: white rounded rectangles (use `roundRect` or manual arc corners)
- Opacity: 0.3–0.7 (correlated with speed — slower = more transparent)
- Speed: 0.25–1.0 px/frame (15–60 px/s at 60fps)
- Positioned between top of canvas and top of ground
- Wrap horizontally: when a cloud exits left, reposition to right edge with new random y

### Depth Effect
- Slower clouds render first (behind faster ones)
- Lower opacity + slower speed = appears farther away
- Faster clouds rendered on top = appears closer

### Ground
- Solid dark navy rectangle (`#1a1a3e`)
- Full canvas width, 60px logical height, anchored at bottom
- No scrolling texture — static fill

## Pipe Rendering

- Solid green rectangles (`#2ecc40`)
- Width: 50 logical pixels
- Top pipe: from y=0 to gap top edge
- Bottom pipe: from gap bottom edge to ground top
- No caps, no gradients — flat retro style
- Optional: 1px darker border for definition (not required)

## Screen Shake

### Trigger
- Activates on collision (transition to `gameover`)
- Duration: 300ms
- Max intensity: ±5px displacement on both axes

### Implementation
```javascript
// Apply before all rendering:
ctx.save();
ctx.translate(shake.offsetX, shake.offsetY);
// ... render all layers ...
ctx.restore();
```

### Decay
- Linear: intensity multiplier = `1 - (elapsed / 300)`
- Random direction each frame within ±intensity range
- Snaps to (0, 0) when duration expires

## Score Popup Animation

### Appearance
- Text: "+1"
- Font: 14px bold, white with dark shadow
- Spawns at ghost position

### Animation
- Duration: 800ms
- Rise: 30px upward (linear interpolation)
- Fade: opacity from 1.0 → 0.0 (linear)
- Formula: `y = startY - 30 * (elapsed / 800)`, `alpha = 1 - elapsed / 800`
- Remove when elapsed ≥ 800ms

## UI Panels

### HUD (Running State)
- Position: bottom of canvas, overlapping ground strip
- Left: `Score: X` — 16px monospace, white, dark text shadow
- Right: `High: X` — same style
- Always visible during gameplay

### Main Menu (Idle State)
- Title: "FLAPPY KIRO" — large bold text, centered at ~30% from top
- Ghost: centered, playing idle animation
- Play prompt: "Tap or click to start" — pulsing opacity (0.5 ↔ 1.0, 1s cycle)
- High score badge below title

### Game Over Overlay
- Background: semi-transparent black panel (`rgba(0, 0, 0, 0.7)`)
- Panel: ~280×200px centered, rounded corners
- "GAME OVER" — 24px bold white
- Final score — 18px white
- High score — 18px gold if new record
- "New High Score!" — shown conditionally with gold text
- Restart prompt — pulsing opacity, appears after 500ms delay

### Pulsing Text Effect
```javascript
function getPulseAlpha(timestamp) {
  return 0.5 + 0.5 * Math.sin(timestamp / 500 * Math.PI);
}
```

## Audio-Visual Synchronization

### Sound → Visual Pairing
| Event | Sound | Visual Feedback |
|-------|-------|-----------------|
| Flap input | `jump.wav` | Flap animation + upward rotation |
| Score increment | `score.wav` | "+1" popup at ghost position |
| Collision | `game_over.wav` | Screen shake + death sprite + overlay |

### Timing Rules
- Sound and visual trigger on the same frame — never delay one relative to the other
- Screen shake starts the same frame as collision sound
- Score popup appears the same frame as score chime
- Flap animation starts the same frame as flap sound

## Canvas Drawing Optimization

- Set `ctx.font` only when it changes (cache current font string)
- Use `ctx.globalAlpha` for transparency instead of constructing `rgba()` strings
- Batch similar shapes: draw all pipes in one loop, all particles in one loop
- Minimize `ctx.save()`/`ctx.restore()` pairs — only use for transforms (rotation, shake)
- Use `ctx.setTransform()` for the main scale transform rather than nested `scale()` calls
- Clear canvas with `ctx.clearRect(0, 0, canvas.width, canvas.height)` before the sky fill
- Avoid `ctx.measureText()` in the game loop — pre-calculate text widths at init if needed

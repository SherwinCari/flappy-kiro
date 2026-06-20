# Ghosty Character Sprite Specifications

## Sprite Sheet

- **Source File:** `assets/ghosty.png`
- **Format:** PNG with transparency
- **Total Sheet Size:** 192×32 pixels (6 frames horizontal strip)
- **Frame Size:** 32×32 pixels per frame

## Sprite Sheet Layout

```
┌────────┬────────┬────────┬────────┬────────┬────────┐
│ Frame 0│ Frame 1│ Frame 2│ Frame 3│ Frame 4│ Frame 5│
│ Idle-1 │ Idle-2 │ Flap-1 │ Flap-2 │ Flap-3 │ Death  │
│ 32×32  │ 32×32  │ 32×32  │ 32×32  │ 32×32  │ 32×32  │
└────────┴────────┴────────┴────────┴────────┴────────┘
 0px      32px     64px     96px     128px    160px
```

| Frame Index | State | Description |
|-------------|-------|-------------|
| 0 | idle-1 | Neutral pose, wings resting |
| 1 | idle-2 | Slight bob, wings slightly raised |
| 2 | flap-1 | Wings beginning upstroke |
| 3 | flap-2 | Wings at full extension (apex) |
| 4 | flap-3 | Wings completing downstroke |
| 5 | death | Eyes closed, wings drooped |

## Animation States

### Idle

- **Frames:** 0, 1
- **Frame Duration:** 300ms per frame
- **Total Cycle:** 600ms
- **Behavior:** Loops continuously
- **Usage:** Displayed during idle/menu state and between flap animations

### Flap

- **Frames:** 2, 3, 4
- **Frame Duration:** 80ms per frame
- **Total Cycle:** 240ms (plays once)
- **Behavior:** Plays once then returns to idle
- **Usage:** Triggered on each flap input during running state

### Death

- **Frames:** 5
- **Frame Duration:** N/A (static)
- **Behavior:** Holds frame 5 indefinitely
- **Usage:** Displayed on collision, held during game-over state

## Animation Transitions

```
┌──────┐   flap input    ┌──────┐   animation    ┌──────┐
│ idle │ ───────────────→ │ flap │ ─────────────→ │ idle │
└──────┘                  └──────┘  completes     └──────┘
    │                         │
    │  collision              │  collision
    ▼                         ▼
┌───────┐                 ┌───────┐
│ death │                 │ death │
└───────┘                 └───────┘
```

| Transition | Trigger | Behavior |
|-----------|---------|----------|
| idle → flap | Flap input received | Immediately switch to flap, reset frame index to 0 |
| flap → idle | Flap animation completes (all 3 frames played) | Auto-transition back to idle frame 0 |
| idle → death | Collision detected | Immediately switch to death frame 5, hold |
| flap → death | Collision detected | Immediately switch to death frame 5, hold |

## Hitbox

- **Type:** Circular (forgiving, matches ghost's round shape)
- **Radius:** 12 pixels
- **Center Position:** (16, 16) relative to sprite top-left corner (center of the 32×32 frame)
- **Visual Buffer:** 4 pixels on each side (32/2 - 12 = 4px between sprite edge and hitbox edge)
- **Purpose:** The circular hitbox is intentionally smaller than the full 32×32 sprite bounds to provide a forgiving collision feel, preventing unfair deaths from transparent sprite edges

```
┌──────────────────────────────────┐
│  4px buffer                      │
│    ┌────────────────────────┐    │
│    │                        │    │
│    │    ╭──────────────╮    │    │
│    │    │   Hitbox      │    │    │
│    │    │  radius=12px  │    │    │
│    │    │  center=(16,16)│   │    │
│    │    ╰──────────────╯    │    │
│    │                        │    │
│    └────────────────────────┘    │
│                          4px buf │
└──────────────────────────────────┘
        32×32 sprite frame
```

## Rendering

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

### Frame Advancement Logic

```javascript
function updateAnimation(dtMs) {
  sprite.elapsed += dtMs;
  const frameDuration = animations[sprite.currentAnim].frameDuration;
  if (sprite.elapsed >= frameDuration) {
    sprite.elapsed -= frameDuration;
    sprite.frameIndex++;
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

### Fallback Rendering

If `ghosty.png` fails to load, render a filled white circle as a fallback:

```javascript
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.arc(ghost.x + 16, ghost.y + 16, 12, 0, Math.PI * 2);
ctx.fill();
```

## Rotation (Visual Only)

- **Rising (vy < 0):** Rotate -10° (counter-clockwise, nose up)
- **Falling (vy > 0):** Rotate proportionally, `min(vy / 600 * 10, 10)°` clockwise
- **Neutral (vy ≈ 0):** 0° rotation
- Rotation is applied via `ctx.rotate()` around sprite center (16, 16)
- Rotation does NOT affect the circular hitbox — purely visual

## Configuration Constants

```javascript
// Sprite sheet
SPRITE_FRAME_WIDTH: 32,       // px per frame
SPRITE_FRAME_HEIGHT: 32,      // px per frame
GHOST_HITBOX_RADIUS: 12,      // circular hitbox radius

// Animation timing
ANIM_IDLE_FRAMES: [0, 1],
ANIM_IDLE_FRAME_DURATION: 300,   // ms per frame
ANIM_FLAP_FRAMES: [2, 3, 4],
ANIM_FLAP_FRAME_DURATION: 80,    // ms per frame
ANIM_DEATH_FRAMES: [5],
ANIM_DEATH_FRAME_DURATION: 0,    // static hold
```

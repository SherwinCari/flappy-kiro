# Ghosty Character Sprite Specifications

## Sprite Dimensions

- **Base Size:** 32×32 pixels (logical)
- **Format:** PNG with transparency
- **Source File:** `assets/ghosty.png`

## Animation Frames

### Idle State
- **Frames:** 2
- **Frame 1:** Ghost at neutral position, eyes open
- **Frame 2:** Ghost with slight vertical bob (2px offset), eyes half-closed
- **Cycle Duration:** 800ms (400ms per frame)
- **Usage:** Displayed during the idle/start-prompt state before gameplay begins

### Flap State
- **Frames:** 3
- **Frame 1:** Wings/body compressed (pre-flap)
- **Frame 2:** Wings/body extended upward (mid-flap)
- **Frame 3:** Wings/body returning to neutral (post-flap)
- **Cycle Duration:** 300ms (100ms per frame)
- **Trigger:** Activated on each flap input, plays once then returns to idle cycle
- **Usage:** Displayed when the player provides a flap input during running state

### Death State
- **Frames:** 2
- **Frame 1:** Ghost with surprised expression, slight rotation (15° clockwise)
- **Frame 2:** Ghost faded (opacity 0.5), rotation increased (30° clockwise)
- **Cycle Duration:** 400ms (200ms per frame)
- **Trigger:** Activated on collision, plays once and holds final frame
- **Usage:** Displayed during the game-over state

## Hitbox

- **Type:** Circle (simplified from sprite bounds for fairer collision detection)
- **Radius:** 12px (centered on sprite center)
- **Center Offset:** (16, 16) relative to sprite top-left corner
- **Coverage:** The circular hitbox is smaller than the full 32×32 sprite to avoid unfair collisions with transparent sprite edges

## Sprite Sheet Layout

If using a sprite sheet instead of individual frames:

```
┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│ Idle 1 │ Idle 2 │ Flap 1 │ Flap 2 │ Flap 3 │Death 1 │Death 2 │
│ 32×32  │ 32×32  │ 32×32  │ 32×32  │ 32×32  │ 32×32  │ 32×32  │
└────────┴────────┴────────┴────────┴────────┴────────┴────────┘
Total sheet size: 224×32 pixels (7 frames × 32px)
```

## Rendering Notes

- The ghost sprite is rendered at the logical coordinate position scaled by the canvas scale factor
- If the sprite asset fails to load, render a white filled circle with radius 12px as fallback
- During the flap animation, the sprite rotates slightly counter-clockwise (-10°) to indicate upward movement
- During falling (positive velocity), the sprite rotates slightly clockwise (up to +10° proportional to fall speed)

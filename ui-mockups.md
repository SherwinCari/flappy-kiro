# UI Mockups — Flappy Kiro

## Main Menu (Idle State)

```
┌─────────────────────────────────────────┐
│                                         │
│          ☁              ☁               │
│                                         │
│                                         │
│         ╔═════════════════════╗         │  ← ~30% from top
│         ║    FLAPPY KIRO      ║         │
│         ╚═════════════════════╝         │
│                                         │
│               👻                        │  ← Ghost centered,
│          (idle animation)               │    idle anim (frames 0-1)
│                                         │
│         ┌─────────────────────┐         │  ← Play button
│         │      ▶  PLAY        │         │    160×40px, green #2ecc40
│         └─────────────────────┘         │    rounded corners
│                                         │
│         ┌─────────────────────┐         │  ← High score badge
│         │    🏆 HIGH: 42      │         │    160×40px, semi-transparent
│         └─────────────────────┘         │
│                                         │
│        Tap or click to start            │  ← Pulsing instruction text
│                                         │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← Ground (#1a1a3e, 60px)
└─────────────────────────────────────────┘
```

### Layout Specifications

| Element | Position | Size | Style |
|---------|----------|------|-------|
| Title "FLAPPY KIRO" | Centered horizontally, ~30% from top of canvas | Large bold pixel-style font | White text, centered |
| Ghost character | Centered horizontally, below title | 32×32px sprite | Playing idle animation (frames 0-1, 300ms/frame, loops) |
| Play button | Centered horizontally, below ghost | 160×40px logical | Green fill `#2ecc40`, rounded corners, white text |
| High score display | Centered horizontally, below Play button | 160×40px logical | Semi-transparent background `rgba(0,0,0,0.4)`, white text |
| Instruction text | Centered horizontally, below high score | Auto | White text, pulsing opacity |

### Pulsing Instruction Text

The "Tap or click to start" text pulses between 0.5 and 1.0 opacity on a 1-second cycle:

```javascript
// Pulsing opacity formula (1s full cycle)
opacity = 0.5 + 0.5 * Math.sin(timestamp / 500 * Math.PI);
```

- Minimum opacity: 0.5
- Maximum opacity: 1.0
- Cycle period: 1000ms (1 second)
- Function: sinusoidal oscillation

### Interaction

- Clicking/tapping anywhere on the canvas OR pressing spacebar starts the game
- First input transitions state from `idle` → `running` and applies the first flap

---

## In-Game HUD (Running State)

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│       (gameplay area)                   │
│                                         │
│            👻→    +1                    │  ← Score popup at ghost position
│                      ↑ floats up 30px   │
│                  ┃       ┃              │
│                  ┃       ┃              │
│                  ┃       ┃              │
│                      gap (140px)        │
│                  ┃       ┃              │
│                  ┃       ┃              │
│                  ┃       ┃              │
│                                         │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← Ground (#1a1a3e, 60px)
│ Score: 7                    High: 42   │  ← HUD overlapping ground
└─────────────────────────────────────────┘
```

### HUD Specifications

| Element | Position | Font | Style |
|---------|----------|------|-------|
| "Score: X" | Bottom-left, overlapping ground strip | 16px monospace | White `#ffffff` with dark text shadow |
| "High: X" | Bottom-right, overlapping ground strip | 16px monospace | White `#ffffff` with dark text shadow |

### Text Shadow

```javascript
ctx.font = '16px monospace';
ctx.fillStyle = '#ffffff';
ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
ctx.shadowBlur = 2;
ctx.shadowOffsetX = 1;
ctx.shadowOffsetY = 1;
```

### Score Popup "+1"

| Property | Value |
|----------|-------|
| Text | "+1" |
| Font | 14px bold, white with dark shadow |
| Spawn position | Ghost position (ghost.x, ghost.y) |
| Animation duration | 800ms |
| Vertical rise | 30px upward (linear) |
| Opacity fade | 1.0 → 0.0 (linear) |

```javascript
// Score popup animation formulas
y = startY - 30 * (elapsed / 800);       // rises 30px over 800ms
opacity = 1 - (elapsed / 800);            // fades to 0 over 800ms
// Remove popup when elapsed >= 800ms
```

---

## Game Over Screen (Game-Over State)

```
┌─────────────────────────────────────────┐
│█████████████████████████████████████████│  ← Dark overlay
│█████████████████████████████████████████│    rgba(0,0,0,0.7)
│█████████████████████████████████████████│
│████┌───────────────────────────┐████████│
│████│                           │████████│  ← Centered panel
│████│       GAME OVER           │████████│    ~280×200px
│████│                           │████████│    rounded corners
│████│     Final Score: 12       │████████│
│████│     Best Score:  42       │████████│
│████│                           │████████│
│████│   🏆 New High Score!      │████████│  ← Conditional gold badge
│████│                           │████████│
│████│  Tap or click to restart  │████████│  ← Pulsing, after 500ms delay
│████│                           │████████│
│████└───────────────────────────┘████████│
│█████████████████████████████████████████│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ Score: 12                   High: 42   │
└─────────────────────────────────────────┘
```

### Overlay Specifications

| Element | Value |
|---------|-------|
| Background overlay | Full play area, `rgba(0, 0, 0, 0.7)` |
| Panel size | ~280×200px logical |
| Panel position | Centered horizontally and vertically |
| Panel style | Rounded corners, dark background with subtle border |

### Panel Content

| Element | Font | Color | Notes |
|---------|------|-------|-------|
| "GAME OVER" | 24px bold | White `#ffffff` | Centered in panel |
| "Final Score: X" | 18px | White `#ffffff` | Centered below title |
| "Best Score: X" | 18px | White `#ffffff` | Centered below final score |
| "New High Score!" | 16px bold | Gold `#FFD700` | Conditional — shown only when current score > previous high score |
| Restart prompt | 14px | White `#ffffff` | Pulsing opacity (0.5↔1.0), appears after 500ms delay |

### Conditional "New High Score!" Badge

- **Shown when:** `currentScore > previousHighScore`
- **Color:** Gold `#FFD700`
- **Style:** Bold text, optionally with a subtle glow effect
- **Position:** Centered in panel, below the best score line

### Restart Prompt Timing

```javascript
// Restart prompt visibility
const timeSinceGameOver = performance.now() - gameOverTimestamp;
const showRestartPrompt = timeSinceGameOver >= 500;  // 500ms delay

// Restart prompt pulsing (same formula as main menu)
if (showRestartPrompt) {
  const opacity = 0.5 + 0.5 * Math.sin(timestamp / 500 * Math.PI);
  // Render "Tap or click to restart" with this opacity
}
```

- Restart prompt is invisible for the first 500ms after game over
- After 500ms, it appears with pulsing opacity (0.5↔1.0, 1s cycle)
- Input is also ignored for the first 500ms to prevent accidental restarts

---

## Render Layer Order (Back-to-Front)

All visual elements are drawn in strict back-to-front order. This order is never conditionally changed.

| Layer | Z-Order | Element | Description |
|-------|---------|---------|-------------|
| 1 | Farthest | Sky fill | Solid `#87CEEB` covering full canvas |
| 2 | | Clouds | White rounded rectangles, sorted slowest → fastest for depth |
| 3 | | Pipes | Green `#2ecc40` rectangles (50px wide, top and bottom per pair) |
| 4 | | Ground | Dark navy `#1a1a3e` strip, full width, 60px tall at bottom |
| 5 | | Particles | Translucent white circles (ghost trail), radius 2-4px |
| 6 | | Ghost | Sprite from `ghosty.png` (32×32 frames) with rotation transform |
| 7 | | Score popups | "+1" floating text animations at ghost position |
| 8 | | Score display | HUD text ("Score: X" left, "High: X" right) |
| 9 | | Game-over overlay | Semi-transparent dark panel with scores and prompts |
| 10 | Nearest | Menu elements | Main menu title, buttons, and instruction text (idle state only) |

### Layer Rendering Notes

- **Layers 1-6** represent the gameplay scene
- **Layers 7-8** are the always-visible HUD during gameplay
- **Layer 9** appears only in the `gameover` state
- **Layer 10** appears only in the `idle` state
- Screen shake displacement (`ctx.translate(offsetX, offsetY)`) is applied before rendering all layers
- Clouds are sorted by speed (slowest first) to create parallax depth

```javascript
function render(ctx) {
  ctx.save();
  ctx.translate(shake.offsetX, shake.offsetY);  // Apply screen shake

  renderSky(ctx);          // Layer 1
  renderClouds(ctx);       // Layer 2 (sorted slowest → fastest)
  renderPipes(ctx);        // Layer 3
  renderGround(ctx);       // Layer 4
  renderParticles(ctx);    // Layer 5
  renderGhost(ctx);        // Layer 6
  renderScorePopups(ctx);  // Layer 7
  renderHUD(ctx);          // Layer 8

  if (gameState.current === 'gameover') {
    renderGameOverOverlay(ctx);  // Layer 9
  }
  if (gameState.current === 'idle') {
    renderMainMenu(ctx);         // Layer 10
  }

  ctx.restore();
}
```

---

## Color Reference

| Element | Color | Hex/RGBA |
|---------|-------|----------|
| Sky background | Light blue | `#87CEEB` |
| Ground strip | Dark navy | `#1a1a3e` |
| Pipes | Green | `#2ecc40` |
| Clouds | White | `#ffffff` (opacity 0.3–0.7) |
| UI overlay | Dark transparent | `rgba(0, 0, 0, 0.7)` |
| UI text | White | `#ffffff` |
| Accent / New high score | Gold | `#FFD700` |
| Play button | Green | `#2ecc40` |
| Particle trail | White | `#ffffff` (opacity decays from 0.6) |
| Text shadow | Dark | `rgba(0, 0, 0, 0.8)` |

---

## Typography

| Context | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Game title | System / pixel-style | 28px | Bold | White |
| HUD score | Monospace | 16px | Normal | White with dark shadow |
| Score popup | System | 14px | Bold | White with dark shadow |
| Game Over heading | System | 24px | Bold | White |
| Final/Best scores | System | 18px | Normal | White (gold for new record) |
| Restart prompt | System | 14px | Normal | White (pulsing) |
| Instruction text | System | 14px | Normal | White (pulsing) |

---

## Animation Summary

| Animation | Duration | Easing | Description |
|-----------|----------|--------|-------------|
| Instruction text pulse | 1000ms cycle | Sinusoidal | Opacity 0.5 ↔ 1.0 |
| Restart prompt pulse | 1000ms cycle | Sinusoidal | Opacity 0.5 ↔ 1.0, delayed 500ms |
| Score popup rise | 800ms | Linear | Rises 30px, fades to 0 opacity |
| Screen shake | 300ms | Linear decay | ±5px random displacement |
| Ghost idle | 600ms cycle | Frame-based | 2 frames at 300ms each |
| Ghost flap | 240ms total | Frame-based | 3 frames at 80ms each |

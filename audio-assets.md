# Audio Assets Specification

## Overview

Flappy Kiro uses HTML5 Audio elements for all sound playback. The audio system provides responsive feedback for player actions, scoring events, and collisions, plus ambient background music during gameplay.

## Sound Effects

### Flap Sound

| Property | Value |
|----------|-------|
| File | `assets/jump.wav` |
| Type | Short whoosh |
| Duration | 0.1 seconds |
| Frequency | Upward sweep 800Hz → 1200Hz |
| Attack | Fast (immediate onset) |
| Decay | Immediate (no sustain) |
| Volume | 0.5 |
| Overlap | Allowed (uses cloned Audio nodes) |
| Trigger | Player provides flap input during running state |

**Design Intent:** The flap sound should feel responsive and lightweight — a brief upward frequency sweep that reinforces the upward motion of the ghost without being harsh or distracting during rapid tapping.

---

### Score Sound

| Property | Value |
|----------|-------|
| File | `assets/score.wav` |
| Type | Pleasant chime |
| Duration | 0.2 seconds |
| Tones | Two ascending notes: C5 → E5 |
| Timbre | Bell-like (clean sine with harmonic overtones) |
| Volume | 0.6 |
| Overlap | Allowed (uses cloned Audio nodes) |
| Trigger | Ghost horizontal position passes pipe trailing edge |

**Design Intent:** The score chime should feel rewarding but not disruptive. Two quick ascending notes create a sense of achievement without demanding attention. The bell-like timbre sits well in the mix above the background music.

---

### Collision Sound

| Property | Value |
|----------|-------|
| File | `assets/game_over.wav` |
| Type | Soft thud |
| Duration | 0.3 seconds |
| Frequency | Low impact at 200Hz with white noise burst |
| Character | Impactful but not harsh |
| Volume | 0.7 |
| Overlap | Not allowed — exclusive playback |
| Behavior | Interrupts any currently playing flap or score sounds |
| Trigger | Ghost collides with pipe or ground |

**Design Intent:** The collision sound should feel impactful and final, clearly signaling that the game has ended. The low frequency thud provides weight, while the brief white noise burst adds texture. Exclusive playback ensures it cuts through cleanly.

---

## Background Music

| Property | Value |
|----------|-------|
| File | `assets/background_music.mp3` |
| Volume | 0.3 (ambient, non-intrusive) |
| Loop | Continuous during running state |
| Start | Deferred until first user interaction |
| On Game Over | Pauses playback |
| On Restart | Resumes from beginning |

**Design Intent:** Background music provides ambient atmosphere without competing with gameplay sound effects. The low volume (0.3) keeps it non-intrusive. Looping is seamless during the running state.

### Music State Machine

```
Page Load → Silent (awaiting interaction)
First Flap → Music starts playing (loop enabled)
Running → Music loops continuously
Game Over → Music pauses
Restart → Music restarts from beginning
```

---

## Audio Playback Rules

### 1. Preloading

All audio assets are preloaded on page load to prevent playback delays during gameplay:

```javascript
// Assets to preload
const audioAssets = [
  { name: 'flap', file: 'assets/jump.wav' },
  { name: 'score', file: 'assets/score.wav' },
  { name: 'collision', file: 'assets/game_over.wav' },
  { name: 'music', file: 'assets/background_music.mp3' }
];
```

Each `HTMLAudioElement` is created with `preload = 'auto'` to begin loading immediately.

### 2. Overlapping Short Sounds

Short sound effects (flap and score) support overlapping playback using cloned Audio nodes:

```javascript
function playOverlapping(audio) {
  try {
    const clone = audio.cloneNode();
    clone.volume = audio.volume;
    clone.play();
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
}
```

This allows rapid flap inputs or closely-spaced score events to each produce their own sound without cutting off the previous one.

### 3. Exclusive Playback (Collision)

The collision sound uses exclusive playback — it interrupts any other currently playing sound effects:

```javascript
function playExclusive(audio) {
  try {
    // Stop other active sounds
    stopAllSoundEffects();
    audio.currentTime = 0;
    audio.volume = 0.7;
    audio.play();
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
}
```

### 4. Autoplay Policy Compliance

Background music defers playback until the first user interaction to comply with browser autoplay policies:

- Music does not attempt to play on page load
- On the first valid user input (click, tap, or spacebar), the audio context is unlocked
- Music begins playing when the game transitions to the running state after first interaction
- The `userInteracted` flag tracks whether audio has been unlocked

### 5. Error Handling

All `play()` calls are wrapped in try/catch blocks to prevent audio failures from crashing the game loop:

- Failed loads are logged via `console.warn`
- Game continues without the failed audio
- Missing audio files do not block game initialization
- No audio error ever propagates to the game loop

---

## Audio Configuration Summary

| Sound | File | Duration | Volume | Overlap | Trigger |
|-------|------|----------|--------|---------|---------|
| Flap | `assets/jump.wav` | 0.1s | 0.5 | Yes (clone) | Flap input in running state |
| Score | `assets/score.wav` | 0.2s | 0.6 | Yes (clone) | Passing pipe trailing edge |
| Collision | `assets/game_over.wav` | 0.3s | 0.7 | No (exclusive) | Collision with pipe or ground |
| Music | `assets/background_music.mp3` | Loops | 0.3 | N/A | Running state (after first interaction) |

---

## Audio-Visual Synchronization

Sound effects and visual feedback trigger on the same frame — no delay between them:

| Event | Sound | Visual Feedback |
|-------|-------|-----------------|
| Flap input | `jump.wav` | Flap animation + upward rotation |
| Score increment | `score.wav` | "+1" popup at ghost position |
| Collision | `game_over.wav` | Screen shake + death sprite + overlay |

---

## Implementation Notes

- Audio elements use `HTMLAudioElement` (no Web Audio API required)
- Cloned nodes are garbage-collected after playback ends
- Background music element is persistent (not cloned)
- Volume levels are set per the configuration above and not adjustable by the player
- The `loop` property is set to `true` on the background music element
